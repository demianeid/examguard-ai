from django.db import models
from hardware.offline_monitoring.models import Camera


class StreamSession(models.Model):
    """جلسة الـ stream لكل كاميرا"""
    STATUS_CHOICES = [
        ('connecting', 'Connecting'),
        ('live',       'Live'),
        ('stopped',    'Stopped'),
        ('error',      'Error'),
    ]

    camera     = models.ForeignKey(Camera, on_delete=models.CASCADE, related_name='stream_sessions')
    started_at = models.DateTimeField(auto_now_add=True)
    ended_at   = models.DateTimeField(null=True, blank=True)
    status     = models.CharField(max_length=20, choices=STATUS_CHOICES, default='connecting')
    fps        = models.FloatField(default=0)
    resolution = models.CharField(max_length=20, blank=True, null=True)  # e.g. "1920x1080"
    error_log  = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'stream_sessions'
        ordering = ['-started_at']

    def __str__(self):
        return f"{self.camera.name} - {self.status}"