import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
django.setup()

from django.utils import timezone
from hardware.offline_monitoring.models import OfflineExam

now = timezone.localtime()
print("Current Local Time:", now)
print("Current Time:", now.time())

exam = OfflineExam.objects.last()
print("Last Exam ID:", exam.id)
print("Exam Start:", exam.start_time)
print("Exam End:", exam.end_time)
print("Computed Status:", exam.computed_status)
