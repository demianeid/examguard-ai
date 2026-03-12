# # profile_views.py

# from rest_framework.views import APIView
# from rest_framework.response import Response
# from rest_framework import status
# from rest_framework.parsers import MultiPartParser, FormParser
# from rest_framework_simplejwt.tokens import AccessToken
# from django.core.mail import send_mail
# from django.conf import settings
# import os

# from .models import Student, Professor


# # ============================================================
# # HELPER - استخراج المستخدم من الـ Token يدوياً
# # ============================================================
# def get_user_from_token(request):
#     auth_header = request.headers.get('Authorization', '')
#     if not auth_header.startswith('Bearer '):
#         return None, None

#     token_str = auth_header.split(' ')[1]
#     try:
#         token = AccessToken(token_str)

#         if 'professor_id' in token:
#             professor = Professor.objects.get(professor_custom_id=token['professor_id'])
#             return professor, 'professor'

#         user_id = token['user_id']
#         student = Student.objects.get(pk=user_id)
#         return student, 'student'

#     except Exception:
#         return None, None


# # ============================================================
# # GET PROFILE
# # ============================================================
# class GetProfileView(APIView):

#     def get(self, request):
#         user, role = get_user_from_token(request)

#         if not user:
#             return Response({"error": "Invalid or expired token"}, status=status.HTTP_401_UNAUTHORIZED)

#         if role == 'student':
#             return Response({
#                 "user_role": "student",
#                 "student_id": user.student_custom_id,
#                 "first_name": user.first_name,
#                 "last_name": user.last_name,
#                 "full_name": f"{user.first_name} {user.last_name}",
#                 "real_email": user.real_email,  
#                 "phone": user.phone_number,
#                 "username": user.username,
#                 "profile_image": user.profile_image.url if user.profile_image else None,
#                 "is_active": user.is_active,
#                 "date_joined": user.date_joined,
#                 "last_login": user.last_login,
#             }, status=status.HTTP_200_OK)

#         elif role == 'professor':
#             return Response({
#                 "user_role": "professor",
#                 "professor_id": user.professor_custom_id,
#                 "first_name": user.first_name,
#                 "last_name": user.last_name,
#                 "full_name": f"Dr. {user.first_name} {user.last_name}",
#                 "real_email": user.real_email,
#                 "phone": user.phone_number,
#                 "profile_image": user.profile_image.url if user.profile_image else None,
#                 "identity_card": user.identity_card.url if user.identity_card else None,
#                 "is_active": user.is_active,
#                 "created_at": user.created_at,
#                 "last_login": user.last_login,
#             }, status=status.HTTP_200_OK)


# # ============================================================
# # UPDATE PROFILE
# # ============================================================
# class UpdateProfileView(APIView):
#     parser_classes = (MultiPartParser, FormParser)

#     def patch(self, request):
#         user, role = get_user_from_token(request)

#         if not user:
#             return Response({"error": "Invalid or expired token"}, status=status.HTTP_401_UNAUTHORIZED)

#         if role not in ('student', 'professor'):
#             return Response({"error": "User type not recognized"}, status=status.HTTP_400_BAD_REQUEST)

#         try:
#             data = request.data

#             if 'first_name' in data:
#                 user.first_name = data['first_name']
#             if 'last_name' in data:
#                 user.last_name = data['last_name']
#             if 'phone_number' in data:
#                 user.phone_number = data['phone_number']

#             if 'profile_image' in request.FILES:
#                 if user.profile_image and os.path.isfile(user.profile_image.path):
#                     os.remove(user.profile_image.path)
#                 user.profile_image = request.FILES['profile_image']

#             user.save()

#             return Response({
#                 "message": "Profile updated successfully",
#                 "data": {
#                     "first_name": user.first_name,
#                     "last_name": user.last_name,
#                     "phone": user.phone_number,
#                     "profile_image": user.profile_image.url if user.profile_image else None,
#                 }
#             }, status=status.HTTP_200_OK)

#         except Exception as e:
#             return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


# # ============================================================
# # CHANGE PASSWORD
# # ============================================================
# class ChangePasswordView(APIView):

#     def post(self, request):
#         user, role = get_user_from_token(request)

#         if not user:
#             return Response({"error": "Invalid or expired token"}, status=status.HTTP_401_UNAUTHORIZED)

#         old_password     = request.data.get('old_password')
#         new_password     = request.data.get('new_password')
#         confirm_password = request.data.get('confirm_password')

#         if not all([old_password, new_password, confirm_password]):
#             return Response({"error": "All fields are required"}, status=status.HTTP_400_BAD_REQUEST)

#         if new_password != confirm_password:
#             return Response({"error": "New passwords do not match"}, status=status.HTTP_400_BAD_REQUEST)

#         if len(new_password) < 8:
#             return Response({"error": "Password must be at least 8 characters"}, status=status.HTTP_400_BAD_REQUEST)

#         if not user.check_password(old_password):
#             return Response({"error": "Old password is incorrect"}, status=status.HTTP_400_BAD_REQUEST)

#         user.set_password(new_password)
#         # Professor.set_password بيعمل save تلقائي — Student محتاج save يدوي
#         if role == 'student':
#             user.save()

#         try:
#             send_mail(
#                 'ExamGuard - Password Changed',
#                 f'Hello {user.first_name},\n\nYour password has been changed successfully.',
#                 settings.EMAIL_HOST_USER,
#                 [user.real_email],
#                 fail_silently=True,
#             )
#         except:
#             pass

#         return Response({"message": "Password changed successfully"}, status=status.HTTP_200_OK)


# # ============================================================
# # DELETE ACCOUNT
# # ============================================================
# class DeleteAccountView(APIView):

#     def delete(self, request):
#         user, role = get_user_from_token(request)

#         if not user:
#             return Response({"error": "Invalid or expired token"}, status=status.HTTP_401_UNAUTHORIZED)

#         password = request.data.get('password')
#         if not password:
#             return Response({"error": "Password is required"}, status=status.HTTP_400_BAD_REQUEST)

#         if not user.check_password(password):
#             return Response({"error": "Incorrect password"}, status=status.HTTP_400_BAD_REQUEST)

#         for field in ['profile_image', 'identity_card']:
#             img = getattr(user, field, None)
#             if img and os.path.isfile(img.path):
#                 os.remove(img.path)

#         user_name  = user.first_name
#         user_email = user.real_email

#         user.delete()

#         try:
#             send_mail(
#                 'ExamGuard - Account Deleted',
#                 f'Dear {user_name},\n\nYour account has been successfully deleted.',
#                 settings.EMAIL_HOST_USER,
#                 [user_email],
#                 fail_silently=True,
#             )
#         except:
#             pass

#         return Response({"message": "Account deleted successfully"}, status=status.HTTP_200_OK)
















# profile_views.py

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
                if user.profile_image and os.path.isfile(user.profile_image.path):
                    os.remove(user.profile_image.path)
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

        send_mail(
            'ExamGuard - Password Changed',
            f'Hello {user.first_name},\n\nYour password has been changed successfully.',
            settings.EMAIL_HOST_USER,
            [user.email],
            fail_silently=True,
        )

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

        if user.profile_image and os.path.isfile(user.profile_image.path):
            os.remove(user.profile_image.path)

        profile = getattr(user, 'professor_profile', None)
        if profile and profile.identity_card and os.path.isfile(profile.identity_card.path):
            os.remove(profile.identity_card.path)

        user_name  = user.first_name
        user_email = user.email
        user.delete()

        send_mail(
            'ExamGuard - Account Deleted',
            f'Dear {user_name},\n\nYour account has been successfully deleted.',
            settings.EMAIL_HOST_USER,
            [user_email],
            fail_silently=True,
        )

        return Response({"message": "Account deleted successfully."}, status=status.HTTP_200_OK)