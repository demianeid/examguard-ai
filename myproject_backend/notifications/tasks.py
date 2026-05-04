from datetime import timedelta
from django.utils import timezone
from exam.models import Exam
from .models import Notification, ExamReminderLog

def check_upcoming_exams():
    now = timezone.now()
    print(f"[Scheduler] Checking upcoming exams at {now}")
    
    # Look for upcoming exams starting within the next ~24 hours
    upcoming_exams = Exam.objects.filter(
        status__in=['upcoming', 'active'],
        start_datetime__gt=now,
        start_datetime__lte=now + timedelta(days=1, minutes=5)
    ).prefetch_related('assigned_students')

    print(f"[Scheduler] Found {upcoming_exams.count()} upcoming exams within 24h")

    for exam in upcoming_exams:
        time_until_exam = exam.start_datetime - now
        print(f"[Scheduler] Exam: {exam.title}, Starts in: {time_until_exam}")
        
        # 1 Day Reminder (Triggered if exactly 24 hours away, with a small window)
        if timedelta(hours=23) <= time_until_exam <= timedelta(hours=24, minutes=5):
            _send_reminder_if_needed(
                exam, '1day', 
                "Tomorrow's Exam Reminder", 
                f"Your exam '{exam.title}' is scheduled for tomorrow at {exam.start_datetime.strftime('%I:%M %p')}."
            )
            
        # 1 Hour Reminder (Triggered if exactly 1 hour away)
        elif timedelta(minutes=50) <= time_until_exam <= timedelta(minutes=65):
            print(f"[Scheduler] Triggering 1-hour reminder for {exam.title}")
            _send_reminder_if_needed(
                exam, '1hour', 
                "Upcoming Exam in 1 Hour", 
                f"Your exam '{exam.title}' starts in 1 hour. Make sure your environment is ready."
            )
            
        # 10 Minute Reminder
        elif timedelta(minutes=0) <= time_until_exam <= timedelta(minutes=15):
            _send_reminder_if_needed(
                exam, '10min', 
                "Exam Starting Very Soon!", 
                f"Get ready! Your exam '{exam.title}' starts in 10 minutes.",
                priority='high'
            )

def _send_reminder_if_needed(exam, reminder_type, title, content, priority='medium'):
    # Prevent duplicate reminders
    if ExamReminderLog.objects.filter(exam=exam, reminder_type=reminder_type).exists():
        print(f"[Scheduler] Skipping {reminder_type} for {exam.title} (already sent)")
        return
        
    print(f"[Scheduler] Creating {reminder_type} log and sending notifications for {exam.title} to students AND professor")
    ExamReminderLog.objects.create(exam=exam, reminder_type=reminder_type)
    
    # We want to send it to all students AND the instructor
    recipients = list(exam.assigned_students.all())
    
    if not recipients and exam.class_id:
        from instructors.models import ClassEnrollment
        enrollments = ClassEnrollment.objects.filter(class_enrolled=exam.class_id).select_related('student')
        recipients = [e.student for e in enrollments]

    if exam.professor not in recipients:
        recipients.append(exam.professor)

    for user in recipients:
        # Saving individually triggers the post_save signal -> broadcasts to WebSocket
        Notification.objects.create(
            recipient=user,
            type='exam',
            title=title,
            content=content,
            priority=priority,
            metadata={'examId': exam.id, 'classId': exam.class_id.id if exam.class_id else None}
        )

from django.db.models import Avg
from exam.models import ExamResult

def check_completed_exams():
    now = timezone.now()
    
    # Find active or upcoming exams whose end_datetime has passed
    ended_exams = Exam.objects.filter(
        status__in=['upcoming', 'active'],
        end_datetime__lte=now
    )

    for exam in ended_exams:
        exam.status = 'completed'
        exam.save()

        # Calculate average grade
        results = ExamResult.objects.filter(exam=exam)
        if results.exists():
            avg_percentage = results.aggregate(Avg('percentage'))['percentage__avg']
            avg_text = f"{avg_percentage:.1f}%" if avg_percentage else "N/A"
        else:
            avg_text = "No submissions yet"

        # Notify the professor
        Notification.objects.create(
            recipient=exam.professor,
            type='grade',
            title='Exam Completed',
            content=f"The exam '{exam.title}' has ended. Average Score: {avg_text}.",
            priority='high',
            metadata={'examId': exam.id, 'classId': exam.class_id.id if exam.class_id else None}
        )

