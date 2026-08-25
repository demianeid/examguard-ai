from django.db import models
from django.conf import settings

class Notification(models.Model):
    TYPE_CHOICES = (
        ('exam', 'Exam'),
        ('grade', 'Grade'),
        ('system', 'System'),
        ('announcement', 'Announcement'),
    )

    PRIORITY_CHOICES = (
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    )

    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    title = models.CharField(max_length=255)
    content = models.TextField()
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    is_read = models.BooleanField(default=False)
    metadata = models.JSONField(blank=True, null=True, help_text="Additional data for frontend routing/display")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.type.upper()} Notification to {self.recipient.username}"

class ExamReminderLog(models.Model):
    REMINDER_CHOICES = [
        ('1day',       '1 Day Before (in-app)'),
        ('1day_email', '1 Day Before (email)'),
        ('1hour',      '1 Hour Before'),
        ('10min',      '10 Minutes Before'),
    ]
    
    exam = models.ForeignKey('exam.Exam', on_delete=models.CASCADE, related_name='reminder_logs')
    reminder_type = models.CharField(max_length=20, choices=REMINDER_CHOICES)
    sent_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'exam_reminder_logs'
        unique_together = ('exam', 'reminder_type')

    def __str__(self):
        return f"{self.exam.title} - {self.get_reminder_type_display()} sent at {self.sent_at}"
