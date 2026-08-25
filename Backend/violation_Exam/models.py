from django.db import models
from django.conf import settings
from exam.models import Exam


class ViolationBehavior(models.Model):
    """
    Records every browser-side violation event from StartExam.tsx.
    Examples: tab-switch, copy-attempt, devtools, fullscreen-exit, keyboard-shortcut.
    """

    VIOLATION_TYPES = [
        ('tab_switch',         'Tab Switch'),
        ('copy_paste',         'Copy / Paste Attempt'),
        ('devtools',           'Developer Tools Opened'),
        ('fullscreen_exit',    'Exited Fullscreen'),
        ('keyboard_shortcut',  'Blocked Keyboard Shortcut'),
        ('right_click',        'Right Click Attempt'),
        ('drag_select',        'Drag / Select Attempt'),
        ('ai_head_pose',       'AI: Suspicious Head Movement'),
        ('ai_multiple_faces',  'AI: Multiple Faces Detected'),
        ('ai_object_detected', 'AI: Unauthorized Object Detected'),
        ('ai_audio_violation', 'AI: Abnormal Sound Detected'),
        ('other',              'Other'),
    ]

    student        = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='violation_behaviors',
    )
    exam           = models.ForeignKey(
        Exam,
        on_delete=models.CASCADE,
        related_name='violation_behaviors',
    )
    event_type     = models.CharField(max_length=30, choices=VIOLATION_TYPES, default='other')
    score_points   = models.DecimalField(max_digits=4, decimal_places=1, default=0)
    details        = models.CharField(max_length=255, blank=True, null=True,
                                      help_text='Human-readable reason, e.g. reason string from frontend')
    cumulative_score = models.DecimalField(max_digits=5, decimal_places=1, default=0,
                                           help_text='Total violation score at the time of this event')
    snapshot       = models.TextField(blank=True, null=True,
                                      help_text='Base64 JPEG of the camera frame at the time of violation')
    occurred_at    = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'violation_behavior'
        ordering = ['-occurred_at']

    def __str__(self):
        return f"{self.student} | {self.exam.title} | {self.event_type} (+{self.score_points}pt)"


class AIEventViolation(models.Model):
    """
    Records every cheating event detected by the FastAPI AI service (head pose + YOLO).
    Posted to Django after the frontend receives the AnalysisResult over WebSocket.
    """

    student           = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='ai_violations',
    )
    exam              = models.ForeignKey(
        Exam,
        on_delete=models.CASCADE,
        related_name='ai_violations',
    )
    cheating_detected = models.BooleanField(default=True)
    cheating_reason   = models.CharField(max_length=255, blank=True, null=True,
                                          help_text='Human-readable AI verdict, e.g. "LOOKING LEFT | OBJECT: phone"')
    head_direction    = models.CharField(max_length=50, blank=True, null=True)
    head_suspicious   = models.BooleanField(default=False)
    yolo_suspicious   = models.BooleanField(default=False)
    yolo_labels       = models.JSONField(default=list, blank=True,
                                          help_text='List of YOLO detection labels, e.g. ["phone", "book"]')
    h_ratio           = models.FloatField(default=0.0)
    v_ratio           = models.FloatField(default=0.0)
    occurred_at       = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'ai_event_violation'
        ordering = ['-occurred_at']

    def __str__(self):
        return f"{self.student} | {self.exam.title} | {self.cheating_reason} @ {self.occurred_at:%H:%M:%S}"


class AudioViolation(models.Model):
    """
    Records every abnormal sound event detected by the FastAPI AI audio service.
    Posted to Django after the frontend receives the AudioResult over WebSocket.
    """

    AUDIO_EVENT_TYPES = [
        ('loud_noise',         'Loud Noise Detected'),
        ('speech_detected',    'Speech / Talking Detected'),
        ('multiple_speakers',  'Multiple Speakers Detected'),
    ]

    student     = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='audio_violations',
    )
    exam        = models.ForeignKey(
        Exam,
        on_delete=models.CASCADE,
        related_name='audio_violations',
    )
    event_type  = models.CharField(
        max_length=30,
        choices=AUDIO_EVENT_TYPES,
        default='loud_noise',
    )
    db_level    = models.FloatField(
        default=0.0,
        help_text='Sound level in dBFS at the time of the event',
    )
    reason      = models.CharField(max_length=255, blank=True, null=True)
    occurred_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'audio_violation'
        ordering = ['-occurred_at']

    def __str__(self):
        return f"{self.student} | {self.exam.title} | {self.event_type} ({self.db_level:.1f} dBFS) @ {self.occurred_at:%H:%M:%S}"
