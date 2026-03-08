from django.db import models
from authentication.models import Professor, Student
import uuid


class Class(models.Model):
    instructor = models.ForeignKey(
        Professor, on_delete=models.CASCADE, related_name='classes'
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    number_of_students = models.PositiveIntegerField(default=0)
    code = models.CharField(max_length=8, unique=True, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.code:
            self.code = uuid.uuid4().hex[:8].upper()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.code})"


class ClassEnrollment(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='enrollments')
    class_enrolled = models.ForeignKey(Class, on_delete=models.CASCADE, related_name='enrollments')
    enrolled_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['student', 'class_enrolled']

    def __str__(self):
        return f"{self.student} - {self.class_enrolled}"