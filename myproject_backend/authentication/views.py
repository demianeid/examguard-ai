import random
from django.utils import timezone
from datetime import timedelta
from django.core.mail import send_mail
from django.conf import settings
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate

from .serializers import StudentRegisterSerializer, ProfessorRegisterSerializer
from .models import Student, Professor


# ============================================================
# STUDENT REGISTER
# ============================================================
class StudentRegisterView(APIView):
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request):
        serializer = StudentRegisterSerializer(data=request.data)
        if serializer.is_valid():
            student = serializer.save()
            return Response({
                "message": "Student registered successfully!",
                "data": {
                    "student_id": student.student_custom_id,
                    "username": student.username,
                    "profile_image": student.profile_image.url if student.profile_image else None
                }
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ============================================================
# PROFESSOR REGISTER
# ============================================================
class ProfessorRegisterView(APIView):
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request):
        serializer = ProfessorRegisterSerializer(data=request.data)
        if serializer.is_valid():
            professor = serializer.save()
            return Response({
                "message": "Application submitted! Your account is under review.",
                "data": {
                    "professor_id": professor.professor_custom_id,
                    "full_name": f"{professor.first_name} {professor.last_name}",
                    "profile_image": professor.profile_image.url if professor.profile_image else None
                }
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ============================================================
# LOGIN
# ============================================================
class LoginView(APIView):
    def post(self, request):
        email    = request.data.get("email", "").strip()
        password = request.data.get("password", "").strip()

        if not email or not password:
            return Response({"detail": "Email and password are required."}, status=status.HTTP_400_BAD_REQUEST)

        # ------- Student -->> platform email -------
        student = None
        try:
           student = Student.objects.get(real_email=email)
        except Student.DoesNotExist:
            pass

        if student is not None:
            if not student.check_password(password):
                return Response({"detail": "Invalid email or password."}, status=status.HTTP_401_UNAUTHORIZED)
            if not student.is_active:
                return Response({"detail": "Account is inactive."}, status=status.HTTP_403_FORBIDDEN)
            refresh = RefreshToken.for_user(student)
            return Response({
                "refresh": str(refresh),
                "access": str(refresh.access_token),
                "user_role": "student",
                "name": f"{student.first_name} {student.last_name}",
                "student_id": student.student_custom_id,
            }, status=status.HTTP_200_OK)

        # ------- Professor -->> real_email -------
        professor = None
        try:
            professor = Professor.objects.get(real_email=email)
        except Professor.DoesNotExist:
            pass

        if professor is not None:
            from django.contrib.auth.hashers import check_password
            if not check_password(password, professor.password):
                return Response({"detail": "Invalid email or password."}, status=status.HTTP_401_UNAUTHORIZED)
            if not professor.is_active:
                return Response({"detail": "Your account is still under review by the administration."}, status=status.HTTP_403_FORBIDDEN)
            refresh = RefreshToken()
            refresh["professor_id"] = professor.professor_custom_id
            refresh["user_role"]    = "professor"
            refresh["name"]         = f"{professor.first_name} {professor.last_name}"
            return Response({
                "refresh": str(refresh),
                "access": str(refresh.access_token),
                "user_role": "professor",
                "name": f"{professor.first_name} {professor.last_name}",
                "professor_id": professor.professor_custom_id,
            }, status=status.HTTP_200_OK)

        return Response({"detail": "Invalid email or password."}, status=status.HTTP_401_UNAUTHORIZED)


# ============================================================
# FORGET PASSWORD
# ============================================================
class ForgetPasswordView(APIView):
    def post(self, request):
        email = request.data.get("email", "").strip().lower()
        if not email:
            return Response({"error": "Personal email is required."}, status=status.HTTP_400_BAD_REQUEST)

        user = Student.objects.filter(real_email=email).first() or \
               Professor.objects.filter(real_email=email).first()

        if user:
            otp = str(random.randint(100000, 999999))
            user.otp_code   = otp
            user.otp_expiry = timezone.now() + timedelta(seconds=70)
            user.save()

            try:
                send_mail(
                    'ExamGuard - Reset Code',
                    f'Hello {user.first_name},\n\nYour password reset code is: {otp}\nValid for 60 seconds.',
                    settings.EMAIL_HOST_USER,
                    [user.real_email],
                    fail_silently=False,
                )
                return Response({"message": "OTP sent to your personal email."}, status=status.HTTP_200_OK)
            except Exception:
                return Response({"error": "Failed to send email."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({"error": "This email is not registered as a recovery email."}, status=status.HTTP_404_NOT_FOUND)


# ============================================================
# VERIFY OTP
# ============================================================
class VerifyOtpView(APIView):
    def post(self, request):
        email = request.data.get("email", "").strip().lower()
        otp   = str(request.data.get("otp", "")).strip()

        if not email or not otp:
            return Response({"error": "Email and OTP are required."}, status=status.HTTP_400_BAD_REQUEST)

        user = Student.objects.filter(real_email=email, otp_code=otp).first() or \
               Professor.objects.filter(real_email=email, otp_code=otp).first()

        if not user:
            return Response({"error": "Invalid verification code."}, status=status.HTTP_400_BAD_REQUEST)

        if not user.otp_expiry or user.otp_expiry < timezone.now():
            return Response({"error": "OTP has expired. Please request a new one."}, status=status.HTTP_400_BAD_REQUEST)

        return Response({"message": "OTP verified successfully."}, status=status.HTTP_200_OK)


# ============================================================
# RESET PASSWORD
# ============================================================
class ResetPasswordView(APIView):
    def post(self, request):
        email        = request.data.get("email", "").strip().lower()
        otp          = str(request.data.get("otp", "")).strip()
        new_password = request.data.get("new_password")

        if not all([email, otp, new_password]):
            return Response({"error": "All fields are required."}, status=status.HTTP_400_BAD_REQUEST)

        user = Student.objects.filter(real_email=email, otp_code=otp).first() or \
               Professor.objects.filter(real_email=email, otp_code=otp).first()

        if not user:
            return Response({"error": "Invalid code or email mismatch."}, status=status.HTTP_400_BAD_REQUEST)

        if not user.otp_expiry or user.otp_expiry < timezone.now():
            return Response({"error": "OTP has expired. Please request a new one."}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.otp_code   = None
        user.otp_expiry = None
        user.save()

        return Response({"message": "Password updated successfully!"}, status=status.HTTP_200_OK)