import random
from django.utils import timezone
from datetime import timedelta
from django.core.mail import send_mail
from django.conf import settings
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import (
    StudentRegisterSerializer,
    ProfessorRegisterSerializer,
    ProfileSerializer,
    ProfileUpdateSerializer,
)
from .models import BaseUser


# ─── Shared helper ────────────────────────────────────────────────
def build_image_url(request, image_field):
    if not image_field:
        return None
    return request.build_absolute_uri(image_field.url)


# ─── Student Register ─────────────────────────────────────────────
class StudentRegisterView(APIView):
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request):
        serializer = StudentRegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response({
                "message": "Student registered successfully!",
                "data": {
                    "id":            user.id,
                    "student_id":    user.custom_id,
                    "username":      user.username,
                    "profile_image": build_image_url(request, user.profile_image),
                }
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ─── Professor Register ───────────────────────────────────────────
class ProfessorRegisterView(APIView):
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request):
        serializer = ProfessorRegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response({
                "message": "Application submitted! Your account is under review.",
                "data": {
                    "professor_id":  user.custom_id,
                    "full_name":     user.get_full_name(),
                    "profile_image": build_image_url(request, user.profile_image),
                }
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ─── Login ────────────────────────────────────────────────────────
def _get_client_ip(request):
    """Extract the real client IP from request headers."""
    x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded:
        return x_forwarded.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR', '')


class LoginView(APIView):
    def post(self, request):
        email    = request.data.get("email", "").strip()
        password = request.data.get("password", "").strip()

        if not email or not password:
            return Response({"detail": "Email and password are required."}, status=status.HTTP_400_BAD_REQUEST)

        user = BaseUser.objects.filter(email=email).first()

        if not user or not user.check_password(password):
            return Response({"detail": "Invalid email or password."}, status=status.HTTP_401_UNAUTHORIZED)

        if not user.is_active:
            if user.role == BaseUser.Role.PROFESSOR:
                return Response({"detail": "Your account is still under review by the administration."}, status=status.HTTP_403_FORBIDDEN)
            return Response({"detail": "Account is inactive."}, status=status.HTTP_403_FORBIDDEN)

        # ── New device / IP detection ──────────────────────────────
        current_ip = _get_client_ip(request)
        previous_ip = user.last_login_ip

        if previous_ip and current_ip and current_ip != previous_ip:
            # Fire security alert email (respects email_notifications toggle)
            try:
                from .models import _send_email
                from django.utils import timezone as tz
                login_time = tz.now().strftime('%B %d, %Y at %I:%M %p')
                html = f"""
                <!DOCTYPE html>
                <html>
                <head><meta charset="UTF-8"></head>
                <body style="margin:0;padding:0;background:#f4f6f9;font-family:'Segoe UI',Arial,sans-serif;">
                  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:40px 0;">
                    <tr><td align="center">
                      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);">
                        <tr>
                          <td style="background:linear-gradient(135deg,#c62828,#b71c1c);padding:40px;text-align:center;">
                            <h1 style="color:#fff;margin:0;font-size:26px;font-weight:700;">🔐 ExamGuard</h1>
                            <p style="color:rgba(255,255,255,.85);margin:8px 0 0;font-size:14px;">Security Alert</p>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:40px;">
                            <h2 style="color:#c62828;margin:0 0 12px;">New Login Detected</h2>
                            <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 24px;">
                              Hello {user.first_name},<br><br>
                              We detected a login to your ExamGuard account from a <strong>new location or device</strong>.
                            </p>
                            <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff5f5;border:1px solid #ffcdd2;border-radius:8px;margin-bottom:24px;">
                              <tr><td style="padding:20px;">
                                <p style="margin:0 0 8px;font-size:13px;color:#999;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Login Details</p>
                                <p style="margin:4px 0;font-size:14px;color:#333;"><strong>Time:</strong> {login_time}</p>
                                <p style="margin:4px 0;font-size:14px;color:#333;"><strong>IP Address:</strong> {current_ip}</p>
                                <p style="margin:4px 0;font-size:14px;color:#333;"><strong>Previous IP:</strong> {previous_ip}</p>
                              </td></tr>
                            </table>
                            <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff8e1;border-left:4px solid #ffc107;border-radius:4px;margin-bottom:24px;">
                              <tr><td style="padding:16px;">
                                <p style="margin:0;color:#856404;font-size:14px;">
                                  ⚠️ <strong>Not you?</strong> Change your password immediately and contact support.
                                </p>
                              </td></tr>
                            </table>
                          </td>
                        </tr>
                        <tr>
                          <td style="background:#f8f9fa;padding:20px;text-align:center;border-top:1px solid #e9ecef;">
                            <p style="margin:0;color:#888;font-size:12px;">© 2026 ExamGuard. This is an automated security alert.</p>
                          </td>
                        </tr>
                      </table>
                    </td></tr>
                  </table>
                </body>
                </html>
                """
                _send_email(
                    subject="⚠️ New Login Detected — ExamGuard",
                    html_content=html,
                    to_email=user.email,
                    user=user,
                )
            except Exception as e:
                print(f"[LoginAlert] Failed to send email: {e}")

        # Update stored IP for next comparison
        if current_ip:
            BaseUser.objects.filter(pk=user.pk).update(last_login_ip=current_ip)

        refresh = RefreshToken.for_user(user)
        return Response({
            "refresh":   str(refresh),
            "access":    str(refresh.access_token),
            "user_role": user.role.lower(),
            "name":      user.get_full_name(),
            "id":        user.custom_id,
        }, status=status.HTTP_200_OK)


# ─── Profile (GET) ────────────────────────────────────────────────
class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = ProfileSerializer(request.user, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


# ─── Profile Update (PUT / PATCH) ────────────────────────────────
class ProfileUpdateView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes     = (MultiPartParser, FormParser)

    def patch(self, request):
        serializer = ProfileUpdateSerializer(
            request.user,
            data=request.data,
            partial=True,
            context={'request': request}
        )
        if serializer.is_valid():
            user = serializer.save()
            return Response({
                "message":       "Profile updated successfully!",
                "profile_image": build_image_url(request, user.profile_image),
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request):
        return self.patch(request)


# ─── Forget Password ──────────────────────────────────────────────
class ForgetPasswordView(APIView):
    def post(self, request):
        email = request.data.get("email", "").strip().lower()
        if not email:
            return Response({"error": "Email is required."}, status=status.HTTP_400_BAD_REQUEST)

        user = BaseUser.objects.filter(email=email).first()
        if not user:
            return Response({"error": "This email is not registered."}, status=status.HTTP_404_NOT_FOUND)

        otp             = str(random.randint(100000, 999999))
        user.otp_code   = otp
        user.otp_expiry = timezone.now() + timedelta(seconds=70)
        user.save()

        try:
            from .models import _send_email
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
                                    <td style="background:linear-gradient(135deg,#1a73e8,#0d47a1);padding:40px;text-align:center;">
                                        <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:700;letter-spacing:1px;">🔐 ExamGuard</h1>
                                        <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">Academic Examination Platform</p>
                                    </td>
                                </tr>

                                <!-- Body -->
                                <tr>
                                    <td style="padding:40px;">
                                        <h2 style="color:#1a73e8;margin:0 0 8px;font-size:22px;">Password Reset Request</h2>
                                        <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 24px;">
                                            Hello <strong>{user.first_name}</strong>, we received a request to reset your ExamGuard password.
                                            Use the verification code below to proceed. If you did not request this, you can safely ignore this email.
                                        </p>

                                        <!-- OTP Code Box -->
                                        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f7ff;border:1px solid #d0e4ff;border-radius:8px;margin-bottom:24px;">
                                            <tr>
                                                <td style="padding:24px;">
                                                    <p style="margin:0 0 16px;font-size:14px;color:#666;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Your Verification Code</p>
                                                    <table width="100%" cellpadding="0" cellspacing="0">
                                                        <tr>
                                                            <td style="padding:8px 0;border-bottom:1px solid #d0e4ff;">
                                                                <span style="color:#888;font-size:13px;">Account</span><br>
                                                                <strong style="color:#1a1a1a;font-size:15px;">{user.first_name} {user.last_name}</strong>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td style="padding:8px 0;border-bottom:1px solid #d0e4ff;">
                                                                <span style="color:#888;font-size:13px;">Email</span><br>
                                                                <strong style="color:#1a1a1a;font-size:15px;">{user.email}</strong>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td style="padding:16px 0 8px;">
                                                                <span style="color:#888;font-size:13px;">Reset Code</span><br>
                                                                <strong style="color:#1a73e8;font-size:32px;letter-spacing:8px;font-family:monospace;">{otp}</strong>
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
                                                        ⚠️ <strong>Security Notice:</strong> This code expires in 60 seconds. Never share this code with anyone.
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>

                                        <p style="color:#555;font-size:14px;line-height:1.6;">
                                            If you have any questions or need assistance, please contact our support team.
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
            success = _send_email(
                subject='🔒 ExamGuard — Password Reset Code',
                html_content=html_content,
                to_email=user.email,
                # No user= argument: password resets must always send regardless of the toggle
            )
            if success:
                return Response({"message": "OTP sent to your email."}, status=status.HTTP_200_OK)
            else:
                return Response({"error": "Failed to send email. Please check email configuration."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception as e:
            print(f"[ForgetPassword] Error: {e}")
            return Response({"error": "Failed to send email."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ─── Verify OTP ───────────────────────────────────────────────────
class VerifyOtpView(APIView):
    def post(self, request):
        email = request.data.get("email", "").strip().lower()
        otp   = str(request.data.get("otp", "")).strip()

        if not email or not otp:
            return Response({"error": "Email and OTP are required."}, status=status.HTTP_400_BAD_REQUEST)

        user = BaseUser.objects.filter(email=email, otp_code=otp).first()
        if not user:
            return Response({"error": "Invalid verification code."}, status=status.HTTP_400_BAD_REQUEST)

        if not user.otp_expiry or user.otp_expiry < timezone.now():
            return Response({"error": "OTP has expired. Please request a new one."}, status=status.HTTP_400_BAD_REQUEST)

        return Response({"message": "OTP verified successfully."}, status=status.HTTP_200_OK)


# ─── Reset Password ───────────────────────────────────────────────
class ResetPasswordView(APIView):
    def post(self, request):
        email        = request.data.get("email", "").strip().lower()
        otp          = str(request.data.get("otp", "")).strip()
        new_password = request.data.get("new_password")

        if not all([email, otp, new_password]):
            return Response({"error": "All fields are required."}, status=status.HTTP_400_BAD_REQUEST)

        user = BaseUser.objects.filter(email=email, otp_code=otp).first()
        if not user:
            return Response({"error": "Invalid code or email mismatch."}, status=status.HTTP_400_BAD_REQUEST)

        if not user.otp_expiry or user.otp_expiry < timezone.now():
            return Response({"error": "OTP has expired. Please request a new one."}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.otp_code   = None
        user.otp_expiry = None
        user.save()

        return Response({"message": "Password updated successfully!"}, status=status.HTTP_200_OK)