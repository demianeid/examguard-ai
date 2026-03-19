from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
from django.core.mail import send_mail
from django.conf import settings
import os

from .models import BaseUser


# ─── Get Profile ──────────────────────────────────────────────────
class GetProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        is_professor = user.role == 'professor'

        data = {
            "user_role":     user.role,
            "id":            user.custom_id,
            "first_name":    user.first_name,
            "last_name":     user.last_name,
            "full_name":     f"{'Dr. ' if is_professor else ''}{user.get_full_name()}",
            "email":         user.email,
            "phone":         user.phone_number,
            "profile_image": user.profile_image.url if user.profile_image else None,
            "is_active":     user.is_active,
            "last_login":    user.last_login,
        }

        if is_professor:
            profile = getattr(user, 'professor_profile', None)
            data["identity_card"] = profile.identity_card.url if profile and profile.identity_card else None
            data["is_verified"]   = profile.is_verified if profile else False
        else:
            data["username"]    = user.username
            data["date_joined"] = user.date_joined

        return Response(data, status=status.HTTP_200_OK)


# ─── Update Profile ───────────────────────────────────────────────
class UpdateProfileView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes     = (MultiPartParser, FormParser)

    def patch(self, request):
        user = request.user
        data = request.data

        try:
            if 'first_name'   in data: user.first_name   = data['first_name']
            if 'last_name'    in data: user.last_name    = data['last_name']
            if 'phone_number' in data: user.phone_number = data['phone_number']

            if 'profile_image' in request.FILES:
                user.profile_image = request.FILES['profile_image']

            user.save()

            return Response({
                "message": "Profile updated successfully",
                "data": {
                    "first_name":    user.first_name,
                    "last_name":     user.last_name,
                    "phone":         user.phone_number,
                    "profile_image": user.profile_image.url if user.profile_image else None,
                }
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


# ─── Change Password ──────────────────────────────────────────────
class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user             = request.user
        old_password     = request.data.get('old_password')
        new_password     = request.data.get('new_password')
        confirm_password = request.data.get('confirm_password')

        if not all([old_password, new_password, confirm_password]):
            return Response({"error": "All fields are required."}, status=status.HTTP_400_BAD_REQUEST)

        if new_password != confirm_password:
            return Response({"error": "New passwords do not match."}, status=status.HTTP_400_BAD_REQUEST)

        if len(new_password) < 8:
            return Response({"error": "Password must be at least 8 characters."}, status=status.HTTP_400_BAD_REQUEST)

        if not user.check_password(old_password):
            return Response({"error": "Old password is incorrect."}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()

        try:
            send_mail(
                'ExamGuard - Password Changed',
                f'Hello {user.first_name},\n\nYour password has been changed successfully.',
                settings.EMAIL_HOST_USER,
                [user.email],
                fail_silently=True,
            )
        except Exception:
            pass

        return Response({"message": "Password changed successfully."}, status=status.HTTP_200_OK)


# ─── Delete Account ───────────────────────────────────────────────
class DeleteAccountView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        user     = request.user
        password = request.data.get('password')

        if not password:
            return Response({"error": "Password is required."}, status=status.HTTP_400_BAD_REQUEST)

        if not user.check_password(password):
            return Response({"error": "Incorrect password."}, status=status.HTTP_400_BAD_REQUEST)

        user_name  = user.first_name
        user_email = user.email
        user.delete()

        try:
            send_mail(
                'ExamGuard - Account Deleted',
                f'Dear {user_name},\n\nYour account has been successfully deleted.',
                settings.EMAIL_HOST_USER,
                [user_email],
                fail_silently=True,
            )
        except Exception:
            pass

        return Response({"message": "Account deleted successfully."}, status=status.HTTP_200_OK)