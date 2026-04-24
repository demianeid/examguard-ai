from django.db import models
from django.conf import settings


class ExamHall(models.Model):
    name       = models.CharField(max_length=100)
    building   = models.CharField(max_length=100)
    capacity   = models.PositiveIntegerField(default=0)
    is_active  = models.BooleanField(default=True)
    professor  = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='exam_halls', null=True, blank=True)
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
        ('missed',    'Missed'),
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

    @property
    def computed_status(self):
        """
        Auto-determine the real exam status based on date/time:
        - completed: instructor ended it manually (stays completed)
        - active:    right now is between start_time and end_time on exam date
        - missed:    exam date+end_time has passed without being completed
        - upcoming:  exam hasn't started yet
        """
        from django.utils import timezone
        import datetime

        # If the instructor already marked it completed, keep it
        if self.status == 'completed':
            return 'completed'

        now = timezone.localtime()
        today = now.date()
        current_time = now.time()

        exam_date = self.date

        if exam_date > today:
            return 'upcoming'

        if exam_date == today:
            if current_time < self.start_time:
                return 'upcoming'
            if current_time <= self.end_time:
                return 'active'
            # Past end_time today
            return 'missed'

        # exam_date < today
        return 'missed'

    def __str__(self):
        return f"{self.title} - {self.hall.name}"


class StudentZone(models.Model):
    hall        = models.ForeignKey(ExamHall, on_delete=models.CASCADE, related_name='zones')
    camera      = models.ForeignKey(Camera, on_delete=models.CASCADE, related_name='zones', null=True, blank=True)
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