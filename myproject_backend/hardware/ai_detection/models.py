from django.db import models
from django.conf import settings
from hardware.offline_monitoring.models import OfflineExam, StudentZone


class MonitoringSession(models.Model):
    """جلسة المراقبة الكاملة"""
    STATUS_CHOICES = [
        ('running',   'Running'),
        ('paused',    'Paused'),
        ('ended',     'Ended'),
    ]

    exam       = models.OneToOneField(OfflineExam, on_delete=models.CASCADE, related_name='monitoring_session')
    started_at = models.DateTimeField(auto_now_add=True)
    ended_at   = models.DateTimeField(null=True, blank=True)
    status     = models.CharField(max_length=20, choices=STATUS_CHOICES, default='running')

    class Meta:
        db_table = 'monitoring_sessions'

    def __str__(self):
        return f"Session - {self.exam.title}"


class Alert(models.Model):
    """التنبيهات اللحظية"""
    TYPE_CHOICES = [
        ('mobile_phone',      'Mobile Phone Detected'),
        ('multiple_faces',    'Multiple Faces Detected'),
        ('no_face',           'No Face Detected'),
        ('looking_away',      'Looking Away'),
        ('external_paper',    'External Paper Detected'),
        ('voice_detected',    'Voice Detected'),
        ('head_movement',     'Excessive Head Movement'),
    ]

    SEVERITY_CHOICES = [
        ('low',      'Low'),
        ('medium',   'Medium'),
        ('high',     'High'),
    ]

    session    = models.ForeignKey(MonitoringSession, on_delete=models.CASCADE, related_name='alerts')
    zone       = models.ForeignKey(StudentZone, on_delete=models.CASCADE, related_name='alerts')
    alert_type = models.CharField(max_length=50, choices=TYPE_CHOICES)
    severity   = models.CharField(max_length=20, choices=SEVERITY_CHOICES, default='medium')
    timestamp  = models.DateTimeField(auto_now_add=True)
    is_reviewed = models.BooleanField(default=False)
    snapshot   = models.ImageField(upload_to='alerts/snapshots/', null=True, blank=True)

    class Meta:
        db_table = 'alerts'
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.alert_type} - Seat {self.zone.seat_number}"


class ViolationLog(models.Model):
    """السجل النهائي لكل طالب بعد الامتحان"""
    student          = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='violations'
    )
    session          = models.ForeignKey(MonitoringSession, on_delete=models.CASCADE, related_name='violations')
    total_alerts     = models.PositiveIntegerField(default=0)
    high_severity    = models.PositiveIntegerField(default=0)
    medium_severity  = models.PositiveIntegerField(default=0)
    low_severity     = models.PositiveIntegerField(default=0)
    violation_score  = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    summary          = models.TextField(blank=True, null=True)
    created_at       = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'violation_logs'
        unique_together = ['student', 'session']

    def __str__(self):
        return f"{self.student} - Score: {self.violation_score}"