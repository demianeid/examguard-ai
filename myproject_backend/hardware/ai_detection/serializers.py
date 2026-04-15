from rest_framework import serializers
from .models import MonitoringSession, Alert, ViolationLog


class AlertSerializer(serializers.ModelSerializer):
    seat_number  = serializers.CharField(source='zone.seat_number', read_only=True)
    student_name = serializers.CharField(source='zone.student.get_full_name', read_only=True)

    class Meta:
        model  = Alert
        fields = '__all__'


class MonitoringSessionSerializer(serializers.ModelSerializer):
    exam_title    = serializers.CharField(source='exam.title', read_only=True)
    hall_name     = serializers.CharField(source='exam.hall.name', read_only=True)
    total_alerts  = serializers.IntegerField(source='alerts.count', read_only=True)
    alerts        = AlertSerializer(many=True, read_only=True)

    class Meta:
        model  = MonitoringSession
        fields = '__all__'


class ViolationLogSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='zone.student.get_full_name', read_only=True)
    exam_title   = serializers.CharField(source='session.exam.title', read_only=True)

    class Meta:
        model  = ViolationLog
        fields = '__all__'