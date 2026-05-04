import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.utils import timezone
from exam.models import Exam
from notifications.tasks import check_upcoming_exams

def debug():
    now = timezone.now()
    print("CURRENT TIME:", now)
    
    exams = Exam.objects.filter(status='upcoming')
    for exam in exams:
        diff = exam.start_datetime - now
        print(f"Exam: {exam.title}, Start: {exam.start_datetime}, Diff: {diff}, Diff Mins: {diff.total_seconds() / 60}")
    
    print("\nRunning check_upcoming_exams manually...")
    check_upcoming_exams()

if __name__ == '__main__':
    debug()
