import random
import string
import os
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.contrib.auth.hashers import make_password, check_password as django_check_password
from django.core.mail import EmailMultiAlternatives


def professor_upload_path(instance, filename):
    folder_name = f"{instance.first_name}_{instance.last_name}".replace(" ", "_")
    return os.path.join('professors', folder_name, filename)


# =================================================== STUDENT ===================================================
class Student(AbstractUser):
    student_custom_id = models.CharField(
        max_length=6, unique=True, editable=False,
        help_text="Unique ID starting with ST followed by 4 digits"
    )
    real_email = models.EmailField(unique=True)
    phone_number = models.CharField(max_length=15)
    profile_image = models.ImageField(upload_to='profiles/students/', blank=False, null=False)
    email_sent = models.BooleanField(default=False)
    otp_code = models.CharField(max_length=6, blank=True, null=True)
    otp_expiry = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        raw_password = getattr(self, '_raw_password', None)

        if not self.student_custom_id:
            while True:
                random_digits = ''.join(random.choices(string.digits, k=4))
                new_id = f"ST{random_digits}"
                if not Student.objects.filter(student_custom_id=new_id).exists():
                    self.student_custom_id = new_id
                    break

        if not self.username:
            base_username = f"{self.first_name}{self.last_name}".lower().replace(" ", "")
            username = base_username
            counter = 1
            while Student.objects.filter(username=username).exists():
                username = f"{base_username}{counter}"
                counter += 1
            self.username = username

        # ✅ الـ email بيبقى نفس الـ real_email
        self.email = self.real_email
        if is_new and self.password:
            if not self.password.startswith(('pbkdf2_', 'bcrypt', 'argon2')):
                if not raw_password:
                    raw_password = self.password
                self.password = make_password(self.password)

        super().save(*args, **kwargs)

        if is_new and not self.email_sent:
            self.send_welcome_email(raw_password)

    def send_welcome_email(self, raw_password=None):
        subject = 'Welcome to ExamGuard — Your Academic Account is Ready'
        password_display = raw_password if raw_password else "[Your provided password]"

        html_content = f"""
        <div style="font-family: Arial, sans-serif; color: #1a1a1a; max-width: 600px; margin: auto;">
            <p>Dear <strong>{self.first_name} {self.last_name}</strong>,</p>
            <p>Welcome to <strong>ExamGuard</strong>!</p>
            <p>
                🆔 <strong>Student ID:</strong> {self.student_custom_id}<br>
                🔑 <strong>Password:</strong> {password_display}
            </p>
            <p><strong>⚠️ Important:</strong> Please change your password after your first login.</p>
            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 24px 0;">
            <p style="color: #555; font-size: 13px;">
                Best regards,<br>
                <strong>The ExamGuard Team</strong>
            </p>
        </div>
        """

        text_content = f"Dear {self.first_name} {self.last_name},\n\nStudent ID: {self.student_custom_id}\nPassword: {password_display}"

        try:
            msg = EmailMultiAlternatives(subject, text_content, None, [self.real_email])
            msg.attach_alternative(html_content, "text/html")
            msg.send()
            Student.objects.filter(pk=self.pk).update(email_sent=True)
        except Exception as e:
            print(f"SMTP Error (Student): {e}")

    class Meta:
        db_table = 'students'
        verbose_name = 'Student'
        verbose_name_plural = 'Students'
        ordering = ['-date_joined']

    def __str__(self):
        return f"{self.student_custom_id} - {self.first_name} {self.last_name}"
# =================================================== PROFESSOR ===================================================
class Professor(models.Model):
    professor_custom_id = models.CharField(
        max_length=6, unique=True, editable=False,
        help_text="Unique ID starting with DR followed by 4 digits"
    )
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    real_email = models.EmailField(unique=True)
    phone_number = models.CharField(max_length=15)
    identity_card = models.ImageField(upload_to=professor_upload_path)
    profile_image = models.ImageField(upload_to=professor_upload_path, blank=True, null=True)
    is_active = models.BooleanField(default=False)
    password = models.CharField(max_length=255)
    email_sent = models.BooleanField(default=False)
    otp_code = models.CharField(max_length=6, blank=True, null=True)
    otp_expiry = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_login = models.DateTimeField(null=True, blank=True)

    @property
    def is_authenticated(self):
        return True

    def check_password(self, raw_password):
        return django_check_password(raw_password, self.password)

    def set_password(self, raw_password):
        self.password = make_password(raw_password)
        self.save()

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        if not self.professor_custom_id:
            while True:
                random_digits = ''.join(random.choices(string.digits, k=4))
                new_id = f"DR{random_digits}"
                if not Professor.objects.filter(professor_custom_id=new_id).exists():
                    self.professor_custom_id = new_id
                    break

        if is_new and self.password:
            if not self.password.startswith(('pbkdf2_', 'bcrypt', 'argon2')):
                self.password = make_password(self.password)

        super().save(*args, **kwargs)

        if is_new and not self.email_sent:
            self.send_review_notification()

    def send_review_notification(self):
        subject = 'Application Received — ExamGuard Academic Staff Portal'

        html_content = f"""
        <div style="font-family: Arial, sans-serif; color: #1a1a1a; max-width: 600px; margin: auto;">
            <p>Dear <strong>Dr. {self.first_name} {self.last_name}</strong>,</p>
            <p>Your application has been received. Status: <strong>PENDING VERIFICATION</strong></p>
            <p>🆔 <strong>Tracking ID:</strong> {self.professor_custom_id}</p>
            <p>Best regards,<br><strong>The ExamGuard Team</strong></p>
        </div>
        """

        text_content = f"Dear Dr. {self.first_name} {self.last_name},\n\nTracking ID: {self.professor_custom_id}\nStatus: PENDING VERIFICATION"

        try:
            msg = EmailMultiAlternatives(subject, text_content, None, [self.real_email])
            msg.attach_alternative(html_content, "text/html")
            msg.send()
            Professor.objects.filter(pk=self.pk).update(email_sent=True)
        except Exception as e:
            print(f"SMTP Error (Professor): {e}")

    class Meta:
        db_table = 'professors'
        verbose_name = 'Professor'
        verbose_name_plural = 'Professors'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.professor_custom_id} - Dr. {self.first_name} {self.last_name}"