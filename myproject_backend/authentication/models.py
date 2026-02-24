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

        if not self.email:
            random_num = random.randint(10, 99)
            self.email = f"{self.username}2026_{random_num}@examguard.ed"

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

            <p>We are delighted to welcome you to <strong>ExamGuard</strong> — your trusted academic examination and proctoring platform.</p>

            <p>Your student account has been successfully created and is now fully active. Please find your login credentials below.</p>

            <p>
                📧 <strong>Platform Email:</strong> {self.email}<br>
                🔑 <strong>Password:</strong> {password_display}<br>
                🆔 <strong>Student ID:</strong> {self.student_custom_id}
            </p>

            <p><strong>⚠️ Important Security Notice</strong><br>
            Please change your password after your first login. Never share your credentials with anyone. ExamGuard staff will never ask for your password.</p>

            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 24px 0;">

            <p style="color: #555; font-size: 13px;">
                🌐 Platform: https://examguard.ed &nbsp;|&nbsp; 📩 Support: support@examguard.ed<br><br>
                Best regards,<br>
                <strong>The ExamGuard Team</strong><br>
                Academic Technology & Assessment Division<br><br>
                © 2026 ExamGuard. All rights reserved.<br>
            </p>
        </div>
        """

        text_content = f"Dear {self.first_name} {self.last_name},\n\nWelcome to ExamGuard!\n\nEmail: {self.email}\nPassword: {password_display}\nStudent ID: {self.student_custom_id}\n\nBest regards,\nThe ExamGuard Team"

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

            <p>Thank you for submitting your registration to join <strong>ExamGuard</strong> as a member of our academic staff.</p>

            <p>We have successfully received your application along with your submitted documents. Our administration team will carefully review your credentials and identity verification.</p>

            <p>
                👤 <strong>Full Name:</strong> Dr. {self.first_name} {self.last_name}<br>
                🆔 <strong>Tracking ID:</strong> {self.professor_custom_id}<br>
                ⚖️ <strong>Status:</strong> PENDING VERIFICATION
            </p>

            <p><strong>📌 What Happens Next?</strong><br>
            1. Our team will review your submitted documents.<br>
            2. Identity verification will be completed within <strong>24–48 hours</strong>.<br>
            3. You will receive a confirmation email once approved.<br>
            4. Upon approval, your login credentials will be provided.</p>

            <p>Please do not attempt to register again. If you have any questions, contact our support team directly.</p>

            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 24px 0;">

            <p style="color: #555; font-size: 13px;">
                🌐 Platform: https://examguard.ed &nbsp;|&nbsp; 📩 Support: support@examguard.ed<br><br>
                Best regards,<br>
                <strong>The ExamGuard Administration Team</strong><br>
                Academic Technology & Assessment Division<br><br>
                © 2026 ExamGuard. All rights reserved.<br>
            </p>
        </div>
        """

        text_content = f"Dear Dr. {self.first_name} {self.last_name},\n\nYour application has been received.\nTracking ID: {self.professor_custom_id}\nStatus: PENDING VERIFICATION\n\nBest regards,\nThe ExamGuard Team"

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