from rest_framework import serializers
from .models import StreamSession


class StreamSessionSerializer(serializers.ModelSerializer):
    camera_name = serializers.CharField(source='camera.name', read_only=True)
    hall_name   = serializers.CharField(source='camera.hall.name', read_only=True)
    duration    = serializers.SerializerMethodField()

    class Meta:
        model  = StreamSession
        fields = '__all__'

    def get_duration(self, obj):
        if obj.ended_at and obj.started_at:
            diff = obj.ended_at - obj.started_at
            minutes = int(diff.total_seconds() // 60)
            seconds = int(diff.total_seconds() % 60)
            return f"{minutes}m {seconds}s"
        return "Still Running"