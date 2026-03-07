# serializers.py

from rest_framework import serializers
from .models import Student, Professor
from django.contrib.auth.password_validation import validate_password

# ============================================================
class StudentRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    student_custom_id = serializers.CharField(read_only=True)
    profile_image = serializers.ImageField(required=False)

    class Meta:
        model = Student
        fields = [
            'student_custom_id', 'first_name', 'last_name',
            'real_email', 'phone_number', 'password',
            'username', 'email', 'profile_image'
        ]
        extra_kwargs = {
            'username': {'read_only': True},
            'email': {'read_only': True}
        }

    def validate_real_email(self, value):
        if Professor.objects.filter(real_email=value).exists():
            raise serializers.ValidationError(
                "This email is already registered as a Professor."
            )
        return value

    def create(self, validated_data):
        raw_password = validated_data.pop('password')
        student = Student(**validated_data)
        student._raw_password = raw_password
        student.set_password(raw_password)
        student.save()
        return student


# ============================================================
class ProfessorRegisterSerializer(serializers.ModelSerializer):
    professor_custom_id = serializers.CharField(read_only=True)
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    identity_card = serializers.ImageField(required=True)
    profile_image = serializers.ImageField(required=True)

    class Meta:
        model = Professor
        fields = [
            'professor_custom_id', 'first_name', 'last_name',
            'real_email', 'phone_number', 'identity_card',
            'profile_image', 'password'
        ]

    def validate_real_email(self, value):
        if Student.objects.filter(real_email=value).exists():
            raise serializers.ValidationError(
                "This email is already registered as a Student."
            )
        return value

    def create(self, validated_data):
        raw_password = validated_data.pop('password')
        professor = Professor(**validated_data)
        professor._raw_password = raw_password
        professor.set_password(raw_password)
        professor.save()
        return professor


# ============================================================
class OTPSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp_code = serializers.CharField(max_length=6, min_length=6)