from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import BaseUser, StudentProfile, ProfessorProfile


# ─── Shared image URL helper ──────────────────────────────────────
def get_full_image_url(image_field, request=None):
    if not image_field:
        return None
    if request:
        return request.build_absolute_uri(image_field.url)
    return f"http://127.0.0.1:8000{image_field.url}"


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
        user         = BaseUser(**validated_data)
        user.role    = BaseUser.Role.STUDENT
        user.set_password(raw_password)
        user.save()
        student_profile = StudentProfile.objects.create(user=user)
        if hasattr(student_profile, 'send_welcome_email'):
            student_profile.send_welcome_email(raw_password)
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
        user          = BaseUser(**validated_data)
        user.role     = BaseUser.Role.PROFESSOR
        user.set_password(raw_password)
        user.is_active = False
        user.save()
        professor_profile = ProfessorProfile.objects.create(user=user, identity_card=identity_card)
        if hasattr(professor_profile, 'send_review_notification'):
            professor_profile.send_review_notification()
        return user


# ─── OTP ──────────────────────────────────────────────────────────
class OTPSerializer(serializers.Serializer):
    email    = serializers.EmailField()
    otp_code = serializers.CharField(max_length=6, min_length=6)


# ─── Profile ──────────────────────────────────────────────────────
class ProfileSerializer(serializers.ModelSerializer):
    profile_image = serializers.SerializerMethodField()
    full_name     = serializers.SerializerMethodField()
    phone         = serializers.CharField(source='phone_number', allow_blank=True)
    user_role     = serializers.CharField(source='role')
    id            = serializers.CharField(source='custom_id')

    def get_profile_image(self, obj):
        return get_full_image_url(obj.profile_image, self.context.get('request'))

    def get_full_name(self, obj):
        return obj.get_full_name()

    class Meta:
        model  = BaseUser
        fields = [
            'user_role', 'id', 'first_name', 'last_name', 'full_name',
            'email', 'phone', 'username', 'profile_image',
            'is_active', 'date_joined', 'last_login',
        ]


# ─── Profile Update ───────────────────────────────────────────────
class ProfileUpdateSerializer(serializers.ModelSerializer):
    profile_image = serializers.ImageField(required=False, allow_null=True)
    phone         = serializers.CharField(source='phone_number', required=False, allow_blank=True)

    class Meta:
        model  = BaseUser
        fields = ['first_name', 'last_name', 'phone', 'profile_image']

    def update(self, instance, validated_data):
        # Only replace image if a new one was actually uploaded
        new_image = validated_data.pop('profile_image', None)
        if new_image:
            instance.profile_image = new_image

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()
        return instance