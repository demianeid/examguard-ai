from django.db import models
from django.conf import settings


class ExamHall(models.Model):
    name       = models.CharField(max_length=100)
    building   = models.CharField(max_length=100)
    capacity   = models.PositiveIntegerField(default=0)
    is_active  = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'H_exam_halls'

    def __str__(self):
        return f"{self.name} - {self.building}"


class Camera(models.Model):
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
        db_table = 'H_cameras'

    def __str__(self):
        return f"{self.name} - {self.hall.name}"


class OfflineExam(models.Model):
    STATUS_CHOICES = [
        ('upcoming',  'Upcoming'),
        ('active',    'Active'),
        ('completed', 'Completed'),
    ]

    hall      = models.ForeignKey(ExamHall, on_delete=models.CASCADE, related_name='offline_exams')
    professor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='offline_exams',
        limit_choices_to={'role': 'professor'}
    )
    title      = models.CharField(max_length=255)
    date       = models.DateField()
    start_time = models.TimeField()
    end_time   = models.TimeField()
    status     = models.CharField(max_length=20, choices=STATUS_CHOICES, default='upcoming')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'H_offline_exams'

    def __str__(self):
        return f"{self.title} - {self.hall.name}"


class StudentZone(models.Model):
    hall        = models.ForeignKey(ExamHall, on_delete=models.CASCADE, related_name='zones')
    camera      = models.ForeignKey(Camera, on_delete=models.CASCADE, related_name='zones')
    student_name = models.CharField(max_length=255, default='')
    student_code = models.CharField(max_length=100, default='')
    seat_number  = models.CharField(max_length=20, blank=True, null=True)
    x1 = models.IntegerField()
    y1 = models.IntegerField()
    x2 = models.IntegerField()
    y2 = models.IntegerField()

    class Meta:
        db_table = 'H_student_zones'

    def __str__(self):
        return f"{self.student_name} - {self.seat_number}"


class HallEnrollment(models.Model):
    hall         = models.ForeignKey(ExamHall, on_delete=models.CASCADE, related_name='enrollments')
    student      = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='hall_enrollments')
    student_name = models.CharField(max_length=255, default='')
    student_code = models.CharField(max_length=100, default='')
    seat_number  = models.CharField(max_length=20, blank=True, null=True)
    enrolled_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table        = 'H_hall_enrollments'
        unique_together = ['hall', 'student_code']

    def __str__(self):
        return f"{self.student_name} - {self.hall.name}"