from datetime import timedelta
from django.utils import timezone
from django.db.models import Avg
from exam.models import Exam, ExamResult
from .models import Notification, ExamReminderLog


# ─── 1-Day Email Reminder ─────────────────────────────────────────
def send_exam_reminder_email(exam, recipients):
    """
    Send a 1-day-before reminder email to each recipient.
    Respects each user's email_notifications toggle via _send_email().
    Uses ExamReminderLog type '1day_email' to guarantee exactly-once delivery.
    """
    from authentication.models import _send_email

    if ExamReminderLog.objects.filter(exam=exam, reminder_type='1day_email').exists():
        print(f"[EmailReminder] Already sent 1-day email for '{exam.title}' — skipping")
        return

    ExamReminderLog.objects.create(exam=exam, reminder_type='1day_email')

    exam_date = exam.start_datetime.strftime('%A, %B %d, %Y')
    exam_time = exam.start_datetime.strftime('%I:%M %p')

    for user in recipients:
        html = f"""
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"></head>
        <body style="margin:0;padding:0;background:#f4f6f9;font-family:'Segoe UI',Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:40px 0;">
            <tr><td align="center">
              <table width="600" cellpadding="0" cellspacing="0"
                     style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);">
                <tr>
                  <td style="background:linear-gradient(135deg,#1a73e8,#0d47a1);padding:40px;text-align:center;">
                    <h1 style="color:#fff;margin:0;font-size:26px;font-weight:700;">🎓 ExamGuard</h1>
                    <p style="color:rgba(255,255,255,.85);margin:8px 0 0;font-size:14px;">Exam Reminder</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:40px;">
                    <h2 style="color:#1a73e8;margin:0 0 12px;">Your exam is tomorrow, {user.first_name}!</h2>
                    <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 24px;">
                      This is a reminder that you have an upcoming exam scheduled for <strong>tomorrow</strong>.
                    </p>
                    <table width="100%" cellpadding="0" cellspacing="0"
                           style="background:#f0f7ff;border:1px solid #d0e4ff;border-radius:8px;margin-bottom:24px;">
                      <tr><td style="padding:24px;">
                        <p style="margin:0 0 12px;font-size:13px;color:#666;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Exam Details</p>
                        <p style="margin:6px 0;font-size:15px;color:#1a1a1a;"><strong>Exam:</strong> {exam.title}</p>
                        <p style="margin:6px 0;font-size:15px;color:#1a1a1a;"><strong>Date:</strong> {exam_date}</p>
                        <p style="margin:6px 0;font-size:15px;color:#1a1a1a;"><strong>Time:</strong> {exam_time}</p>
                        <p style="margin:6px 0;font-size:15px;color:#1a1a1a;"><strong>Duration:</strong> {exam.duration} minutes</p>
                      </td></tr>
                    </table>
                    <table width="100%" cellpadding="0" cellspacing="0"
                           style="background:#e8f5e9;border-left:4px solid #4caf50;border-radius:4px;margin-bottom:24px;">
                      <tr><td style="padding:16px;">
                        <p style="margin:0 0 8px;color:#2e7d32;font-size:14px;font-weight:600;">✅ Pre-exam checklist</p>
                        <p style="margin:2px 0;color:#2e7d32;font-size:13px;">• Ensure your webcam and microphone are working</p>
                        <p style="margin:2px 0;color:#2e7d32;font-size:13px;">• Find a quiet, well-lit room</p>
                        <p style="margin:2px 0;color:#2e7d32;font-size:13px;">• Have your Student ID ready</p>
                        <p style="margin:2px 0;color:#2e7d32;font-size:13px;">• Log in a few minutes early</p>
                      </td></tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="background:#f8f9fa;padding:20px;text-align:center;border-top:1px solid #e9ecef;">
                    <p style="margin:0;color:#888;font-size:12px;">
                      © 2026 ExamGuard. All rights reserved.<br>
                      You are receiving this because you have email notifications enabled.
                    </p>
                  </td>
                </tr>
              </table>
            </td></tr>
          </table>
        </body>
        </html>
        """
        _send_email(
            subject=f"📅 Reminder: Your exam '{exam.title}' is tomorrow",
            html_content=html,
            to_email=user.email,
            user=user,
        )
        print(f"[EmailReminder] 1-day reminder sent to {user.email} for '{exam.title}'")


# ─── Helper: get recipients for an exam ───────────────────────────
def _get_exam_recipients(exam):
    recipients = list(exam.assigned_students.all())
    if not recipients and exam.class_id:
        from instructors.models import ClassEnrollment
        enrollments = ClassEnrollment.objects.filter(
            class_enrolled=exam.class_id
        ).select_related('student')
        recipients = [e.student for e in enrollments]
    if exam.professor not in recipients:
        recipients.append(exam.professor)
    return recipients


# ─── Helper: create in-app notifications (exactly once) ───────────
def _send_reminder_if_needed(exam, reminder_type, title, content,
                              priority='medium', recipients=None):
    """Create in-app Notification objects for all recipients (once per reminder_type)."""
    if ExamReminderLog.objects.filter(exam=exam, reminder_type=reminder_type).exists():
        print(f"[Scheduler] Skipping {reminder_type} for '{exam.title}' (already sent)")
        return

    print(f"[Scheduler] Creating {reminder_type} notifications for '{exam.title}'")
    ExamReminderLog.objects.create(exam=exam, reminder_type=reminder_type)

    if recipients is None:
        recipients = _get_exam_recipients(exam)

    for user in recipients:
        Notification.objects.create(
            recipient=user,
            type='exam',
            title=title,
            content=content,
            priority=priority,
            metadata={
                'examId':  exam.id,
                'classId': exam.class_id.id if exam.class_id else None,
            }
        )


# ─── Upcoming Exam Check (scheduler entry point) ──────────────────
def check_upcoming_exams():
    now = timezone.now()
    print(f"[Scheduler] Checking upcoming exams at {now}")

    upcoming_exams = Exam.objects.filter(
        status__in=['upcoming', 'active'],
        start_datetime__gt=now,
        start_datetime__lte=now + timedelta(days=1, minutes=5)
    ).prefetch_related('assigned_students')

    print(f"[Scheduler] Found {upcoming_exams.count()} upcoming exams within 24h")

    for exam in upcoming_exams:
        time_until_exam = exam.start_datetime - now
        print(f"[Scheduler] Exam: {exam.title}, Starts in: {time_until_exam}")

        # ── 1-Day Reminder (in-app + email) ───────────────────────
        if timedelta(hours=23) <= time_until_exam <= timedelta(hours=25):
            hours_left = int(time_until_exam.total_seconds() // 3600)
            recipients = _get_exam_recipients(exam)

            _send_reminder_if_needed(
                exam, '1day',
                "Tomorrow's Exam Reminder",
                f"Your exam '{exam.title}' is scheduled for tomorrow at "
                f"{exam.start_datetime.strftime('%I:%M %p')} (in about {hours_left} hours).",
                recipients=recipients,
            )
            send_exam_reminder_email(exam, recipients)

        # ── 1-Hour Reminder (in-app only) ─────────────────────────
        elif timedelta(minutes=50) <= time_until_exam <= timedelta(minutes=65):
            minutes_left = int(time_until_exam.total_seconds() // 60)
            print(f"[Scheduler] Triggering 1-hour reminder for {exam.title}")
            _send_reminder_if_needed(
                exam, '1hour',
                "Upcoming Exam in 1 Hour",
                f"Your exam '{exam.title}' starts in about {minutes_left} minutes. "
                f"Make sure your environment is ready.",
            )

        # ── 10-Minute Reminder (in-app only) ──────────────────────
        elif timedelta(minutes=0) <= time_until_exam <= timedelta(minutes=15):
            minutes_left = max(1, int(time_until_exam.total_seconds() // 60))
            _send_reminder_if_needed(
                exam, '10min',
                "Exam Starting Very Soon!",
                f"Get ready! Your exam '{exam.title}' starts in "
                f"{minutes_left} minute{'s' if minutes_left != 1 else ''}.",
                priority='high',
            )


# ─── Completed Exam Check ─────────────────────────────────────────
def check_completed_exams():
    now = timezone.now()

    ended_exams = Exam.objects.filter(
        status__in=['upcoming', 'active'],
        end_datetime__lte=now
    )

    for exam in ended_exams:
        exam.status = 'completed'
        exam.save()

        results = ExamResult.objects.filter(exam=exam)
        submission_count = results.count()
        if results.exists():
            avg_percentage = results.aggregate(Avg('percentage'))['percentage__avg']
            avg_text = f"{avg_percentage:.1f}%" if avg_percentage else "N/A"
        else:
            avg_text = "No submissions"

        Notification.objects.create(
            recipient=exam.professor,
            type='grade',
            title='Exam Completed',
            content=(
                f"The exam '{exam.title}' has ended. "
                f"{submission_count} submission(s). Average Score: {avg_text}."
            ),
            priority='high',
            metadata={
                'examId':  exam.id,
                'classId': exam.class_id.id if exam.class_id else None,
            }
        )

        from instructors.models import ClassEnrollment
        if exam.assigned_students.exists():
            enrolled_users = list(exam.assigned_students.all())
        elif exam.class_id:
            enrolled_users = [
                e.student for e in ClassEnrollment.objects.filter(
                    class_enrolled=exam.class_id
                ).select_related('student')
            ]
        else:
            enrolled_users = []

        submitted_ids = set(results.values_list('student_id', flat=True))

        for student in enrolled_users:
            if student.id not in submitted_ids:
                Notification.objects.create(
                    recipient=student,
                    type='exam',
                    title='Exam Ended — Missed',
                    content=(
                        f"The exam '{exam.title}' has ended and you did not submit. "
                        f"Please contact your instructor."
                    ),
                    priority='high',
                    metadata={
                        'examId':  exam.id,
                        'classId': exam.class_id.id if exam.class_id else None,
                    }
                )
