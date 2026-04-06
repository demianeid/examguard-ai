import random
import string
import os
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.mail import send_mail
from django.conf import settings

# ─── Upload Paths (Local Storage) ────────────────────────────────
def professor_upload_path(instance, filename):
    folder_name = f"{instance.user.first_name}_{instance.user.last_name}".replace(" ", "_")
    return os.path.join('professors', folder_name, filename)

# ─── Base User ───────────────────────────────────────────────────
class BaseUser(AbstractUser):
    class Role(models.TextChoices):
        STUDENT   = 'student',   'Student'
        PROFESSOR = 'professor', 'Professor'

    email         = models.EmailField(unique=True)
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
        if not self.custom_id:
            prefix = 'ST' if self.role == self.Role.STUDENT else 'DR'
            self._generate_custom_id(prefix)
        if not self.username:
            self._generate_username()
        super().save(*args, **kwargs)

    def _generate_custom_id(self, prefix):
        while True:
            candidate = f"{prefix}{''.join(random.choices(string.digits, k=4))}"
            if not BaseUser.objects.filter(custom_id=candidate).exists():
                self.custom_id = candidate
                break

    def _generate_username(self):
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


# ─── Shared Email Helper (Local SMTP) ───────────────────────────
def _send_email(subject, html_content, to_email):
    try:
        send_mail(
            subject=subject,
            message="", 
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[to_email],
            html_message=html_content,
            fail_silently=False,
        )
        print(f"Email sent successfully to {to_email}")
        return True
    except Exception as e:
        print(f"Email Error: {e}")
        return False


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

        html_content = html_content = f"""
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"></head>
        <body style="margin:0;padding:0;background-color:#f4f6f9;font-family:'Segoe UI',Arial,sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f9;padding:40px 0;">
                <tr>
                    <td align="center">
                        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
                            
                            <!-- Header -->
                            <tr>
                                <td style="background:linear-gradient(135deg,#1a73e8,#0d47a1);padding:40px;text-align:center;">
                                    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:700;letter-spacing:1px;">🎓 ExamGuard</h1>
                                    <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">Academic Examination Platform</p>
                                </td>
                            </tr>

                            <!-- Body -->
                            <tr>
                                <td style="padding:40px;">
                                    <h2 style="color:#1a73e8;margin:0 0 8px;font-size:22px;">Welcome aboard, {u.first_name}! 👋</h2>
                                    <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 24px;">
                                        Your student account has been successfully created on <strong>ExamGuard</strong>. 
                                        You now have access to all academic resources, exams, and performance tracking tools.
                                    </p>

                                    <!-- Credentials Box -->
                                    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f7ff;border:1px solid #d0e4ff;border-radius:8px;margin-bottom:24px;">
                                        <tr>
                                            <td style="padding:24px;">
                                                <p style="margin:0 0 16px;font-size:14px;color:#666;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Your Account Credentials</p>
                                                <table width="100%" cellpadding="0" cellspacing="0">
                                                    <tr>
                                                        <td style="padding:8px 0;border-bottom:1px solid #d0e4ff;">
                                                            <span style="color:#888;font-size:13px;">Student ID</span><br>
                                                            <strong style="color:#1a1a1a;font-size:18px;letter-spacing:2px;">{u.custom_id}</strong>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td style="padding:8px 0;border-bottom:1px solid #d0e4ff;">
                                                            <span style="color:#888;font-size:13px;">Full Name</span><br>
                                                            <strong style="color:#1a1a1a;font-size:15px;">{u.first_name} {u.last_name}</strong>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td style="padding:8px 0;border-bottom:1px solid #d0e4ff;">
                                                            <span style="color:#888;font-size:13px;">Email Address</span><br>
                                                            <strong style="color:#1a1a1a;font-size:15px;">{u.email}</strong>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td style="padding:8px 0;">
                                                            <span style="color:#888;font-size:13px;">Temporary Password</span><br>
                                                            <strong style="color:#1a73e8;font-size:15px;font-family:monospace;">{password_display}</strong>
                                                        </td>
                                                    </tr>
                                                </table>
                                            </td>
                                        </tr>
                                    </table>

                                    <!-- Warning -->
                                    <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff8e1;border-left:4px solid #ffc107;border-radius:4px;margin-bottom:24px;">
                                        <tr>
                                            <td style="padding:16px;">
                                                <p style="margin:0;color:#856404;font-size:14px;">
                                                    ⚠️ <strong>Security Notice:</strong> Please change your password immediately after your first login to protect your account.
                                                </p>
                                            </td>
                                        </tr>
                                    </table>

                                    <p style="color:#555;font-size:14px;line-height:1.6;">
                                        If you have any questions or need assistance, please don't hesitate to contact your instructor or our support team.
                                    </p>
                                </td>
                            </tr>

                            <!-- Footer -->
                            <tr>
                                <td style="background:#f8f9fa;padding:24px;text-align:center;border-top:1px solid #e9ecef;">
                                    <p style="margin:0;color:#888;font-size:12px;">
                                        © 2026 ExamGuard. All rights reserved.<br>
                                        This is an automated message, please do not reply directly to this email.
                                    </p>
                                </td>
                            </tr>

                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
        """
        if _send_email(subject, html_content, u.email):
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
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"></head>
        <body style="margin:0;padding:0;background-color:#f4f6f9;font-family:'Segoe UI',Arial,sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f9;padding:40px 0;">
                <tr>
                    <td align="center">
                        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
                            
                            <!-- Header -->
                            <tr>
                                <td style="background:linear-gradient(135deg,#1a237e,#283593);padding:40px;text-align:center;">
                                    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:700;letter-spacing:1px;">🎓 ExamGuard</h1>
                                    <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">Academic Staff Portal</p>
                                </td>
                            </tr>

                            <!-- Body -->
                            <tr>
                                <td style="padding:40px;">
                                    <h2 style="color:#1a237e;margin:0 0 8px;font-size:22px;">Application Received, Dr. {u.last_name}</h2>
                                    <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 24px;">
                                        Thank you for applying to join <strong>ExamGuard</strong> as an academic staff member. 
                                        Your application has been successfully submitted and is currently under review by our verification team.
                                    </p>

                                    <!-- Status Box -->
                                    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f0ff;border:1px solid #d4c5ff;border-radius:8px;margin-bottom:24px;">
                                        <tr>
                                            <td style="padding:24px;">
                                                <p style="margin:0 0 16px;font-size:14px;color:#666;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Application Details</p>
                                                <table width="100%" cellpadding="0" cellspacing="0">
                                                    <tr>
                                                        <td style="padding:8px 0;border-bottom:1px solid #d4c5ff;">
                                                            <span style="color:#888;font-size:13px;">Tracking ID</span><br>
                                                            <strong style="color:#1a1a1a;font-size:18px;letter-spacing:2px;">{u.custom_id}</strong>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td style="padding:8px 0;border-bottom:1px solid #d4c5ff;">
                                                            <span style="color:#888;font-size:13px;">Full Name</span><br>
                                                            <strong style="color:#1a1a1a;font-size:15px;">Dr. {u.first_name} {u.last_name}</strong>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td style="padding:8px 0;border-bottom:1px solid #d4c5ff;">
                                                            <span style="color:#888;font-size:13px;">Email Address</span><br>
                                                            <strong style="color:#1a1a1a;font-size:15px;">{u.email}</strong>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td style="padding:8px 0;">
                                                            <span style="color:#888;font-size:13px;">Application Status</span><br>
                                                            <span style="background:#fff3cd;color:#856404;padding:4px 12px;border-radius:20px;font-size:13px;font-weight:600;">⏳ PENDING VERIFICATION</span>
                                                        </td>
                                                    </tr>
                                                </table>
                                            </td>
                                        </tr>
                                    </table>

                                    <!-- Info Box -->
                                    <table width="100%" cellpadding="0" cellspacing="0" style="background:#e8f5e9;border-left:4px solid #4caf50;border-radius:4px;margin-bottom:24px;">
                                        <tr>
                                            <td style="padding:16px;">
                                                <p style="margin:0;color:#2e7d32;font-size:14px;">
                                                    ✅ <strong>What happens next?</strong> Our team will review your submitted documents within 2-3 business days. 
                                                    You will receive an email notification once your account has been verified and activated.
                                                </p>
                                            </td>
                                        </tr>
                                    </table>

                                    <p style="color:#555;font-size:14px;line-height:1.6;">
                                        If you have any questions regarding your application, please contact our support team with your Tracking ID.
                                    </p>
                                </td>
                            </tr>

                            <!-- Footer -->
                            <tr>
                                <td style="background:#f8f9fa;padding:24px;text-align:center;border-top:1px solid #e9ecef;">
                                    <p style="margin:0;color:#888;font-size:12px;">
                                        © 2026 ExamGuard. All rights reserved.<br>
                                        This is an automated message, please do not reply directly to this email.
                                    </p>
                                </td>
                            </tr>

                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
        """
        if _send_email(subject, html_content, u.email):
            BaseUser.objects.filter(pk=u.pk).update(email_sent=True)

    def __str__(self):
        return f"Professor — {self.user}"


# import random
# import string
# import os
# import resend
# from django.db import models
# from django.contrib.auth.models import AbstractUser
# from cloudinary.models import CloudinaryField

# # ─── Base User ───────────────────────────────────────────────────
# class BaseUser(AbstractUser):
#     class Role(models.TextChoices):
#         STUDENT   = 'student',   'Student'
#         PROFESSOR = 'professor', 'Professor'

#     email         = models.EmailField(unique=True)
#     role          = models.CharField(max_length=10, choices=Role.choices)
#     phone_number  = models.CharField(max_length=15, blank=True, null=True)
    
#     # Cloudinary handles folders automatically; no more local 'media/' folder
#     profile_image = CloudinaryField('image', folder='examguard/profiles', blank=True, null=True)
    
#     email_sent    = models.BooleanField(default=False)
#     otp_code      = models.CharField(max_length=6, blank=True, null=True)
#     otp_expiry    = models.DateTimeField(blank=True, null=True)
#     updated_at    = models.DateTimeField(auto_now=True)
#     custom_id     = models.CharField(max_length=10, unique=True, editable=False)

#     USERNAME_FIELD = 'username'
#     REQUIRED_FIELDS = ['email', 'first_name', 'last_name']

#     class Meta:
#         db_table = 'base_users'

#     def save(self, *args, **kwargs):
#         if not self.custom_id:
#             prefix = 'ST' if self.role == self.Role.STUDENT else 'DR'
#             self._generate_custom_id(prefix)
#         if not self.username:
#             self._generate_username()
#         super().save(*args, **kwargs)

#     def _generate_custom_id(self, prefix):
#         while True:
#             candidate = f"{prefix}{''.join(random.choices(string.digits, k=4))}"
#             if not BaseUser.objects.filter(custom_id=candidate).exists():
#                 self.custom_id = candidate
#                 break

#     def _generate_username(self):
#         base = f"{self.first_name}{self.last_name}".lower().replace(" ", "")
#         if not base and self.email:
#             base = self.email.split('@')[0]
#         if not base:
#             base = "user"
#         username, counter = base, 1
#         while BaseUser.objects.filter(username=username).exists():
#             username = f"{base}{counter}"
#             counter += 1
#         self.username = username

#     def __str__(self):
#         return f"{self.custom_id} - {self.get_full_name()}"


# # ─── Shared email helper ─────────────────────────────────────────
# def _send_email(subject, html_content, to_email):
#     try:
#         resend.api_key = os.environ.get("RESEND_API_KEY")
#         resend.Emails.send({
#             "from": "ExamGuard <onboarding@resend.dev>",
#             "to": [to_email],
#             "subject": subject,
#             "html": html_content,
#         })
#         print(f"Email sent successfully to {to_email}")
#     except Exception as e:
#         print(f"Email Error: {e}")


# # ─── Student Profile ─────────────────────────────────────────────
# class StudentProfile(models.Model):
#     user = models.OneToOneField(
#         BaseUser, on_delete=models.CASCADE,
#         related_name='student_profile',
#         limit_choices_to={'role': 'student'}
#     )

#     class Meta:
#         db_table = 'student_profiles'
#         verbose_name = 'Student'
#         verbose_name_plural = 'Students'

#     def send_welcome_email(self, raw_password=None):
#         u = self.user
#         subject = 'Welcome to ExamGuard — Your Academic Account is Ready'
#         password_display = raw_password or "[Your provided password]"

#         html_content = f"""
#         <!DOCTYPE html>
#         <html>
#         <head><meta charset="UTF-8"></head>
#         <body style="margin:0;padding:0;background-color:#f4f6f9;font-family:'Segoe UI',Arial,sans-serif;">
#             <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f9;padding:40px 0;">
#                 <tr>
#                     <td align="center">
#                         <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
#                             <tr>
#                                 <td style="background:linear-gradient(135deg,#1a73e8,#0d47a1);padding:40px;text-align:center;">
#                                     <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:700;letter-spacing:1px;">🎓 ExamGuard</h1>
#                                     <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">Academic Examination Platform</p>
#                                 </td>
#                             </tr>
#                             <tr>
#                                 <td style="padding:40px;">
#                                     <h2 style="color:#1a73e8;margin:0 0 8px;font-size:22px;">Welcome aboard, {u.first_name}! 👋</h2>
#                                     <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 24px;">
#                                         Your student account has been successfully created on <strong>ExamGuard</strong>. 
#                                     </p>
#                                     <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f7ff;border:1px solid #d0e4ff;border-radius:8px;margin-bottom:24px;">
#                                         <tr>
#                                             <td style="padding:24px;">
#                                                 <p style="margin:0 0 16px;font-size:14px;color:#666;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Your Account Credentials</p>
#                                                 <table width="100%" cellpadding="0" cellspacing="0">
#                                                     <tr>
#                                                         <td style="padding:8px 0;border-bottom:1px solid #d0e4ff;">
#                                                             <span style="color:#888;font-size:13px;">Student ID</span><br>
#                                                             <strong style="color:#1a1a1a;font-size:18px;letter-spacing:2px;">{u.custom_id}</strong>
#                                                         </td>
#                                                     </tr>
#                                                     <tr>
#                                                         <td style="padding:8px 0;">
#                                                             <span style="color:#888;font-size:13px;">Temporary Password</span><br>
#                                                             <strong style="color:#1a73e8;font-size:15px;font-family:monospace;">{password_display}</strong>
#                                                         </td>
#                                                     </tr>
#                                                 </table>
#                                             </td>
#                                         </tr>
#                                     </table>
#                                 </td>
#                             </tr>
#                             <tr>
#                                 <td style="background:#f8f9fa;padding:24px;text-align:center;border-top:1px solid #e9ecef;">
#                                     <p style="margin:0;color:#888;font-size:12px;">© 2026 ExamGuard. All rights reserved.</p>
#                                 </td>
#                             </tr>
#                         </table>
#                     </td>
#                 </tr>
#             </table>
#         </body>
#         </html>
#         """
#         _send_email(subject, html_content, u.email)
#         BaseUser.objects.filter(pk=u.pk).update(email_sent=True)

#     def __str__(self):
#         return f"Student — {self.user}"


# # ─── Professor Profile ───────────────────────────────────────────
# class ProfessorProfile(models.Model):
#     user = models.OneToOneField(
#         BaseUser, on_delete=models.CASCADE,
#         related_name='professor_profile',
#         limit_choices_to={'role': 'professor'}
#     )
    
#     # Switched to CloudinaryField
#     identity_card = CloudinaryField('image', folder='examguard/professors/ids')
#     is_verified   = models.BooleanField(default=False)

#     class Meta:
#         db_table = 'professor_profiles'
#         verbose_name = 'Professor'
#         verbose_name_plural = 'Professors'

#     def send_review_notification(self):
#         u = self.user
#         subject = 'Application Received — ExamGuard Academic Staff Portal'
#         html_content = f"<h1>Application Received, Dr. {u.last_name}</h1>" # Simplified for brevity, use your full HTML here
#         _send_email(subject, html_content, u.email)
#         BaseUser.objects.filter(pk=u.pk).update(email_sent=True)

#     def __str__(self):
#         return f"Professor — {self.user}"