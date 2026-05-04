from django.db.models.signals import post_save, m2m_changed
from django.dispatch import receiver
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from .models import Notification
from .serializers import NotificationSerializer
from exam.models import Exam, ExamResult
from violation_Exam.models import ViolationBehavior, AIEventViolation

@receiver(post_save, sender=Notification)
def send_notification_on_save(sender, instance, created, **kwargs):
    if created:
        channel_layer = get_channel_layer()
        if channel_layer:
            group_name = f"user_{instance.recipient.id}"
            serializer = NotificationSerializer(instance)
            
            async_to_sync(channel_layer.group_send)(
                group_name,
                {
                    'type': 'send_notification',
                    'notification': serializer.data
                }
            )

@receiver(m2m_changed, sender=Exam.assigned_students.through)
def notify_students_exam_assigned(sender, instance, action, pk_set, **kwargs):
    if action == "post_add" and pk_set:
        from django.contrib.auth import get_user_model
        User = get_user_model()
        students = User.objects.filter(pk__in=pk_set)
        for student in students:
            Notification.objects.create(
                recipient=student,
                type='exam',
                title='New Exam Assigned',
                content=f'You have been assigned to the exam: {instance.title}.',
                priority='high',
                metadata={'examId': instance.id, 'classId': instance.class_id.id if instance.class_id else None}
            )

@receiver(post_save, sender=ExamResult)
def notify_grade_published(sender, instance, created, **kwargs):
    if created:
        Notification.objects.create(
            recipient=instance.student,
            type='grade',
            title='Grade Published',
            content=f'Your grade for {instance.exam.title} is available.',
            priority='medium',
            metadata={'examId': instance.exam.id, 'score': str(instance.total_marks_obtained), 'percentage': str(instance.percentage)}
        )

@receiver(post_save, sender=AIEventViolation)
def notify_instructor_ai_violation(sender, instance, created, **kwargs):
    if created and instance.cheating_detected:
        Notification.objects.create(
            recipient=instance.exam.professor,
            type='system',
            title='Flagged Incident Detected',
            content=f'Suspicious behavior detected during {instance.exam.title} by {instance.student.username}.',
            priority='critical',
            metadata={'studentId': instance.student.id, 'examId': instance.exam.id}
        )
