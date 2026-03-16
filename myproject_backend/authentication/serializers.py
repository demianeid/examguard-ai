# from rest_framework import serializers
# from django.contrib.auth.password_validation import validate_password
# from .models import BaseUser, StudentProfile, ProfessorProfile

# # ─── Student Register ─────────────────────────────────────────────
# class StudentRegisterSerializer(serializers.ModelSerializer):
#     password      = serializers.CharField(write_only=True, required=True, validators=[validate_password])
#     custom_id     = serializers.CharField(read_only=True)
#     profile_image = serializers.ImageField(required=False)
#     email         = serializers.EmailField(required=True)

#     class Meta:
#         model  = BaseUser
#         fields = [
#             'custom_id', 'first_name', 'last_name',
#             'email', 'phone_number', 'password',
#             'username', 'profile_image'
#         ]
#         extra_kwargs = {
#             'username': {'read_only': True},
#         }

#     def validate_email(self, value):
#         # Check if email is already used by a Professor
#         if BaseUser.objects.filter(email=value, role=BaseUser.Role.PROFESSOR).exists():
#             raise serializers.ValidationError("This email is already registered as a Professor.")
#         # General check for existing user
#         if BaseUser.objects.filter(email=value).exists():
#             raise serializers.ValidationError("A user with this email already exists.")
#         return value

#     def create(self, validated_data):
#         raw_password = validated_data.pop('password')
        
#         # Initialize user object
#         user = BaseUser(**validated_data)
        
#         # CRITICAL: Set role before save so models.py generates 'ST' prefix
#         user.role = BaseUser.Role.STUDENT 
        
#         user.set_password(raw_password)
#         user.save() 
        
#         # Create profile and send email
#         student_profile = StudentProfile.objects.create(user=user)
#         if hasattr(student_profile, 'send_welcome_email'):
#             student_profile.send_welcome_email(raw_password)
            
#         return user


# # ─── Professor Register ───────────────────────────────────────────
# class ProfessorRegisterSerializer(serializers.ModelSerializer):
#     password      = serializers.CharField(write_only=True, required=True, validators=[validate_password])
#     custom_id     = serializers.CharField(read_only=True)
#     identity_card = serializers.ImageField(required=True)
#     profile_image = serializers.ImageField(required=False)
#     email         = serializers.EmailField(required=True)

#     class Meta:
#         model  = BaseUser
#         fields = [
#             'custom_id', 'first_name', 'last_name',
#             'email', 'phone_number', 'password',
#             'username', 'profile_image', 'identity_card'
#         ]
#         extra_kwargs = {
#             'username': {'read_only': True},
#         }

#     def validate_email(self, value):
#         # Check if email is already used by a Student
#         if BaseUser.objects.filter(email=value, role=BaseUser.Role.STUDENT).exists():
#             raise serializers.ValidationError("This email is already registered as a Student.")
#         # General check for existing user
#         if BaseUser.objects.filter(email=value).exists():
#             raise serializers.ValidationError("A user with this email already exists.")
#         return value

#     def create(self, validated_data):
#         raw_password  = validated_data.pop('password')
#         identity_card = validated_data.pop('identity_card', None)
        
#         # Initialize user object
#         user = BaseUser(**validated_data)
        
#         # CRITICAL: Set role before save so models.py generates 'DR' prefix
#         user.role = BaseUser.Role.PROFESSOR
        
#         user.set_password(raw_password)
#         user.is_active = False # Pending admin approval
#         user.save()
        
#         # Create profile and send notification
#         professor_profile = ProfessorProfile.objects.create(user=user, identity_card=identity_card)
#         if hasattr(professor_profile, 'send_review_notification'):
#             professor_profile.send_review_notification()
            
#         return user


# # ─── OTP ──────────────────────────────────────────────────────────
# class OTPSerializer(serializers.Serializer):
#     email    = serializers.EmailField()
#     otp_code = serializers.CharField(max_length=6, min_length=6)

from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import BaseUser, StudentProfile, ProfessorProfile

# ─── Student Register ─────────────────────────────────────────────
class StudentRegisterSerializer(serializers.ModelSerializer):
    password      = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    custom_id     = serializers.CharField(read_only=True)
    profile_image = serializers.ImageField(required=False)
    email         = serializers.EmailField(required=True)

    class Meta:
        model  = BaseUser
        fields = [
            'custom_id', 'first_name', 'last_name',
            'email', 'phone_number', 'password',
            'username', 'profile_image'
        ]
        extra_kwargs = {
            'username': {'read_only': True},
        }

    def validate_email(self, value):
        if BaseUser.objects.filter(email=value, role=BaseUser.Role.PROFESSOR).exists():
            raise serializers.ValidationError("This email is already registered as a Professor.")
        if BaseUser.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def create(self, validated_data):
        raw_password = validated_data.pop('password')
        
        user = BaseUser(**validated_data)
        user.role = BaseUser.Role.STUDENT 
        user.set_password(raw_password)
        user.save() 
        
        student_profile = StudentProfile.objects.create(user=user)
        try:
            student_profile.send_welcome_email(raw_password)
        except Exception as e:
            print(f"Welcome email failed (registration still successful): {e}")
            
        return user


# ─── Professor Register ───────────────────────────────────────────
class ProfessorRegisterSerializer(serializers.ModelSerializer):
    password      = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    custom_id     = serializers.CharField(read_only=True)
    identity_card = serializers.ImageField(required=True)
    profile_image = serializers.ImageField(required=False)
    email         = serializers.EmailField(required=True)

    class Meta:
        model  = BaseUser
        fields = [
            'custom_id', 'first_name', 'last_name',
            'email', 'phone_number', 'password',
            'username', 'profile_image', 'identity_card'
        ]
        extra_kwargs = {
            'username': {'read_only': True},
        }

    def validate_email(self, value):
        if BaseUser.objects.filter(email=value, role=BaseUser.Role.STUDENT).exists():
            raise serializers.ValidationError("This email is already registered as a Student.")
        if BaseUser.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def create(self, validated_data):
        raw_password  = validated_data.pop('password')
        identity_card = validated_data.pop('identity_card', None)
        
        user = BaseUser(**validated_data)
        user.role = BaseUser.Role.PROFESSOR
        user.set_password(raw_password)
        user.is_active = False
        user.save()
        
        professor_profile = ProfessorProfile.objects.create(user=user, identity_card=identity_card)
        try:
            professor_profile.send_review_notification()
        except Exception as e:
            print(f"Review notification email failed (registration still successful): {e}")
            
        return user


# ─── OTP ──────────────────────────────────────────────────────────
class OTPSerializer(serializers.Serializer):
    email    = serializers.EmailField()
    otp_code = serializers.CharField(max_length=6, min_length=6)