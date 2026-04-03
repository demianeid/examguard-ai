from django.db import models
from django.conf import settings


class ExamHall(models.Model):
    """المدرج / قاعة الامتحان"""
    name       = models.CharField(max_length=100)
    building   = models.CharField(max_length=100)
    capacity   = models.PositiveIntegerField(default=0)
    is_active  = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'exam_halls'

    def __str__(self):
        return f"{self.name} - {self.building}"


class Camera(models.Model):
    """الكاميرات في كل مدرج"""
    STATUS_CHOICES = [
        ('active',   'Active'),
        ('inactive', 'Inactive'),
        ('error',    'Error'),
    ]

    hall       = models.ForeignKey(ExamHall, on_delete=models.CASCADE, related_name='cameras')
    name       = models.CharField(max_length=100)
    stream_url = models.CharField(max_length=255, blank=True, null=True)
    status     = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'cameras'

    def __str__(self):
        return f"{self.name} - {self.hall.name}"


class OfflineExam(models.Model):
    """امتحان الـ offline"""
    STATUS_CHOICES = [
        ('upcoming',   'Upcoming'),
        ('active',     'Active'),
        ('completed',  'Completed'),
    ]

    hall       = models.ForeignKey(ExamHall, on_delete=models.CASCADE, related_name='offline_exams')
    professor  = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='offline_exams',
        limit_choices_to={'role': 'PROFESSOR'}
    )
    title      = models.CharField(max_length=255)
    date       = models.DateField()
    start_time = models.TimeField()
    end_time   = models.TimeField()
    status     = models.CharField(max_length=20, choices=STATUS_CHOICES, default='upcoming')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'offline_exams'

    def __str__(self):
        return f"{self.title} - {self.hall.name}"


class StudentZone(models.Model):
    """مكان الطالب في الكاميرا (ROI)"""
    exam    = models.ForeignKey(OfflineExam, on_delete=models.CASCADE, related_name='zones')
    camera  = models.ForeignKey(Camera, on_delete=models.CASCADE, related_name='zones')
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='zones'
    )
    seat_number = models.CharField(max_length=20)
    # الـ rectangle coordinates
    x1 = models.IntegerField()
    y1 = models.IntegerField()
    x2 = models.IntegerField()
    y2 = models.IntegerField()

    class Meta:
        db_table = 'student_zones'

    def __str__(self):
        return f"Seat {self.seat_number} - {self.student}"