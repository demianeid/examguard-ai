from django.db import models
from authentication.models import Professor
import uuid

class Class(models.Model):
    instructor = models.ForeignKey(
        Professor, on_delete=models.CASCADE, related_name='classes'  # 👈 Professor مباشرة
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