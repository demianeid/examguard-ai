from rest_framework import serializers
from .models import ExamHall, Camera, OfflineExam, StudentZone


class CameraSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Camera
        fields = '__all__'


class ExamHallSerializer(serializers.ModelSerializer):
    cameras      = CameraSerializer(many=True, read_only=True)
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


class StudentZoneSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    camera_name  = serializers.CharField(source='camera.name', read_only=True)

    class Meta:
        model  = StudentZone
        fields = '__all__'