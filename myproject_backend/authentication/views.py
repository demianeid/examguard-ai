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
            send_mail(
                'ExamGuard - Reset Code',
                f'Hello {user.first_name},\n\nYour password reset code is: {otp}\nValid for 60 seconds.',
                settings.EMAIL_HOST_USER,
                [user.email],
                fail_silently=False,
            )
            return Response({"message": "OTP sent to your email."}, status=status.HTTP_200_OK)
        except Exception:
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