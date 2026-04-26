from rest_framework import serializers
from .models import ViolationBehavior, AIEventViolation


class ViolationBehaviorSerializer(serializers.ModelSerializer):
    class Meta:
        model  = ViolationBehavior
        fields = [
            'id', 'student', 'exam', 'event_type',
            'score_points', 'cumulative_score', 'details', 'occurred_at',
        ]
        read_only_fields = ['id', 'occurred_at', 'student']


class AIEventViolationSerializer(serializers.ModelSerializer):
    class Meta:
        model  = AIEventViolation
        fields = [
            'id', 'student', 'exam',
            'cheating_detected', 'cheating_reason',
            'head_direction', 'head_suspicious',
            'yolo_suspicious', 'yolo_labels',
            'h_ratio', 'v_ratio', 'occurred_at',
        ]
        read_only_fields = ['id', 'occurred_at', 'student']
