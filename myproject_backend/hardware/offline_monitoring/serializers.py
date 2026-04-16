from rest_framework import serializers
from .models import ExamHall, Camera, OfflineExam, StudentZone, HallEnrollment


class CameraSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Camera
        fields = '__all__'


class ExamHallSerializer(serializers.ModelSerializer):
    cameras       = CameraSerializer(many=True, read_only=True)
    total_cameras = serializers.IntegerField(source='cameras.count', read_only=True)

    class Meta:
        model  = ExamHall
        fields = '__all__'


class OfflineExamSerializer(serializers.ModelSerializer):
    hall_name      = serializers.CharField(source='hall.name', read_only=True)
    professor_name = serializers.CharField(source='professor.get_full_name', read_only=True)

    class Meta:
        model  = OfflineExam
        fields = '__all__'
        read_only_fields = ['professor']


class StudentZoneSerializer(serializers.ModelSerializer):
    camera_name = serializers.CharField(source='camera.name', read_only=True)

    class Meta:
        model  = StudentZone
        fields = '__all__'
        read_only_fields = ['hall']
        extra_kwargs = {
            'seat_number': {'required': False, 'allow_null': True},
        }


class HallEnrollmentSerializer(serializers.ModelSerializer):
    class Meta:
        model  = HallEnrollment
        fields = '__all__'
        read_only_fields = ['hall']
        extra_kwargs = {
            'seat_number': {'required': False, 'allow_null': True},
            'student':     {'required': False, 'allow_null': True},
        }