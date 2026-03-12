import random
import string
import os
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.mail import EmailMultiAlternatives

# ─── Upload Paths ────────────────────────────────────────────────
def professor_upload_path(instance, filename):
    folder_name = f"{instance.user.first_name}_{instance.user.last_name}".replace(" ", "_")
    return os.path.join('professors', folder_name, filename)

# ─── Base User ───────────────────────────────────────────────────
class BaseUser(AbstractUser):
    class Role(models.TextChoices):
        STUDENT   = 'student',   'Student'  # Use lowercase to match frontend/logic
        PROFESSOR = 'professor', 'Professor'

    email         = models.EmailField(unique=True) # Ensure email is primary
    role          = models.CharField(max_length=10, choices=Role.choices)
    phone_number  = models.CharField(max_length=15, blank=True, null=True)
    profile_image = models.ImageField(upload_to='profiles/', blank=True, null=True)
    email_sent    = models.BooleanField(default=False)
    otp_code      = models.CharField(max_length=6, blank=True, null=True)
    otp_expiry    = models.DateTimeField(blank=True, null=True)
    updated_at    = models.DateTimeField(auto_now=True)
    custom_id     = models.CharField(max_length=10, unique=True, editable=False)

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['email', 'first_name', 'last_name']

    class Meta:
        db_table = 'base_users'

    def save(self, *args, **kwargs):
        # 1. Generate custom ID automatically if not provided
        if not self.custom_id:
            # Fix: Ensure we check against the actual Role enum values
            prefix = 'ST' if self.role == self.Role.STUDENT else 'DR'
            self._generate_custom_id(prefix)

        # 2. Generate username automatically if not provided
        if not self.username:
            self._generate_username()
        
        # 3. Handle email/username sync
        if self.email and not self.username:
            self.username = self.email

        super().save(*args, **kwargs)

    def _generate_custom_id(self, prefix):
        while True:
            candidate = f"{prefix}{''.join(random.choices(string.digits, k=4))}"
            if not BaseUser.objects.filter(custom_id=candidate).exists():
                self.custom_id = candidate
                break

    def _generate_username(self):
        # Fallback to email if name is missing, otherwise use name
        base = f"{self.first_name}{self.last_name}".lower().replace(" ", "")
        if not base and self.email:
            base = self.email.split('@')[0]
        if not base: 
            base = "user"
            
        username, counter = base, 1
        while BaseUser.objects.filter(username=username).exists():
            username = f"{base}{counter}"
            counter += 1
        self.username = username

    def __str__(self):
        return f"{self.custom_id} - {self.get_full_name()}"


# ─── Shared email helper ─────────────────────────────────────────
def _send_email(subject, text_content, html_content, to_email):
    try:
        msg = EmailMultiAlternatives(subject, text_content, None, [to_email])
        msg.attach_alternative(html_content, "text/html")
        msg.send()
    except Exception as e:
        print(f"SMTP Error: {e}")


# ─── Student Profile ─────────────────────────────────────────────
class StudentProfile(models.Model):
    user = models.OneToOneField(
        BaseUser, on_delete=models.CASCADE,
        related_name='student_profile',
        limit_choices_to={'role': 'student'}
    )

    class Meta:
        db_table = 'student_profiles'
        verbose_name = 'Student'
        verbose_name_plural = 'Students'

    def send_welcome_email(self, raw_password=None):
        u = self.user
        subject = 'Welcome to ExamGuard — Your Academic Account is Ready'
        password_display = raw_password or "[Your provided password]"

        html_content = f"""
        <div style="font-family: Arial, sans-serif; color: #1a1a1a; max-width: 600px; margin: auto;">
            <p>Dear <strong>{u.first_name} {u.last_name}</strong>,</p>
            <p>Welcome to <strong>ExamGuard</strong>!</p>
            <p>
                🆔 <strong>Student ID:</strong> {u.custom_id}<br>
                🔑 <strong>Password:</strong> {password_display}
            </p>
            <p><strong>⚠️ Important:</strong> Please change your password after your first login.</p>
            <hr style="border:none;border-top:1px solid #e0e0e0;margin:24px 0;">
            <p style="color:#555;font-size:13px;">Best regards,<br><strong>The ExamGuard Team</strong></p>
        </div>"""

        text_content = f"Dear {u.first_name} {u.last_name},\n\nStudent ID: {u.custom_id}\nPassword: {password_display}"
        
        # Fixed: Use u.email instead of old fields
        _send_email(subject, text_content, html_content, u.email)
        BaseUser.objects.filter(pk=u.pk).update(email_sent=True)

    def __str__(self):
        return f"Student — {self.user}"
    
    
# ─── Professor Profile ───────────────────────────────────────────
class ProfessorProfile(models.Model):
    user = models.OneToOneField(
        BaseUser, on_delete=models.CASCADE,
        related_name='professor_profile',
        limit_choices_to={'role': 'professor'}
    )
    identity_card = models.ImageField(upload_to=professor_upload_path)
    is_verified   = models.BooleanField(default=False)

    class Meta:
        db_table = 'professor_profiles'
        verbose_name = 'Professor'
        verbose_name_plural = 'Professors'

    def send_review_notification(self):
        u = self.user
        subject = 'Application Received — ExamGuard Academic Staff Portal'

        html_content = f"""
        <div style="font-family: Arial, sans-serif; color: #1a1a1a; max-width: 600px; margin: auto;">
            <p>Dear <strong>Dr. {u.first_name} {u.last_name}</strong>,</p>
            <p>Your application has been received. Status: <strong>PENDING VERIFICATION</strong></p>
            <p>🆔 <strong>Tracking ID:</strong> {u.custom_id}</p>
            <p>Best regards,<br><strong>The ExamGuard Team</strong></p>
        </div>"""

        text_content = f"Dear Dr. {u.first_name} {u.last_name},\n\nTracking ID: {u.custom_id}\nStatus: PENDING VERIFICATION"
        
        # Fixed: Use u.email
        _send_email(subject, text_content, html_content, u.email)
        BaseUser.objects.filter(pk=u.pk).update(email_sent=True)

    def __str__(self):
        return f"Professor — {self.user}"