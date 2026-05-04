import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from notifications.models import Notification
from exam.models import Exam

User = get_user_model()

def run():
    # Get any user to test with, preferably the first one
    user = User.objects.first()
    if not user:
        print("No users found in the database.")
        return

    print(f"Sending test notifications to user: {user.username} (ID: {user.id})")

    # 1. System/Violation Notification
    Notification.objects.create(
        recipient=user,
        type='system',
        title='Flagged Incident Detected',
        content=f'Suspicious behavior detected during Midterm Exam by Sandinoshy2.',
        priority='critical',
        metadata={'studentId': 1, 'examId': 1}
    )
    print("✅ Created System Notification (Violation)")

    # 2. Exam Assigned Notification
    Notification.objects.create(
        recipient=user,
        type='exam',
        title='New Exam Assigned',
        content=f'You have been assigned to the exam: Final Mathematics.',
        priority='high',
        metadata={'examId': 1, 'classId': 1}
    )
    print("✅ Created Exam Notification")

    # 3. Grade Published Notification
    Notification.objects.create(
        recipient=user,
        type='grade',
        title='Grade Published',
        content=f'Your grade for Data Structures is available. You scored 95/100.',
        priority='medium',
        metadata={'examId': 1, 'score': '95', 'percentage': '95.0'}
    )
    print("✅ Created Grade Notification")

    print("\n🎉 All test notifications sent! Check your React frontend.")

if __name__ == '__main__':
    run()
