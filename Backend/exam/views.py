from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone

from .models import Exam, ExamResult, ExamSession
from .serializers import ExamSerializer, ExamListSerializer
from authentication.models import BaseUser
from instructors.models import Class


def is_professor(user):
    return user.role == BaseUser.Role.PROFESSOR

def auto_update_exam_status(exam):
    now = timezone.now()
    if exam.status == 'upcoming' and exam.start_datetime <= now:
        exam.status = 'active'
        exam.save()
    elif exam.status in ['upcoming', 'active'] and exam.end_datetime <= now:
        exam.status = 'completed'
        exam.save()
    return exam


# ─── List & Create Exams ──────────────────────────────────────────
class ExamListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, class_id):
        if not is_professor(request.user):
            return Response({"error": "Unauthorized. Professors only."}, status=status.HTTP_403_FORBIDDEN)

        exams = Exam.objects.filter(professor=request.user, class_id=class_id)
        updated_exams = [auto_update_exam_status(exam) for exam in exams]
        serializer = ExamListSerializer(updated_exams, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, class_id):
        if not is_professor(request.user):
            return Response({"error": "Unauthorized. Professors only."}, status=status.HTTP_403_FORBIDDEN)

        try:
            class_obj = Class.objects.get(id=class_id, instructor=request.user)
        except Class.DoesNotExist:
            return Response({"error": "Class not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = ExamSerializer(data=request.data)
        if serializer.is_valid():
            exam = serializer.save(professor=request.user, class_id=class_obj)

            student_selection_type = request.data.get('student_selection_type', 'all')
            assigned_students = request.data.get('assigned_student_ids', None)

            if student_selection_type == 'specific' and assigned_students:
                students = BaseUser.objects.filter(
                    custom_id__in=assigned_students,
                    role=BaseUser.Role.STUDENT
                )
                exam.assigned_students.set(students)
            else:
                exam.assigned_students.clear()

            # Count question types for format summary
            questions = exam.questions.all()
            q_count = questions.count()
            mc_count = questions.filter(question_type='multiple_choice').count()
            tf_count = questions.filter(question_type='true_false').count()
            essay_count = questions.filter(question_type='essay').count()
            type_parts = []
            if mc_count: type_parts.append(f"{mc_count} MCQ")
            if tf_count: type_parts.append(f"{tf_count} T/F")
            if essay_count: type_parts.append(f"{essay_count} Essay")
            format_summary = f"{q_count} question{'s' if q_count != 1 else ''}" + (f" ({', '.join(type_parts)})" if type_parts else "")
            start_str = exam.start_datetime.strftime('%b %d at %I:%M %p')

            from notifications.models import Notification
            Notification.objects.create(
                recipient=request.user,
                type='exam',
                title='Exam Created Successfully',
                content=(
                    f"'{exam.title}' has been published to {class_obj.name}. "
                    f"Format: {format_summary}, {exam.duration} min, {exam.total_marks} marks. "
                    f"Starts {start_str}."
                ),
                priority='medium',
                metadata={'examId': exam.id, 'classId': class_obj.id}
            )

            return Response({
                "message": "Exam created successfully.",
                "data": serializer.data
            }, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ─── Get, Update, Delete Exam ─────────────────────────────────────
class ExamDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_exam(self, exam_id, user):
        try:
            return Exam.objects.get(id=exam_id, professor=user)
        except Exam.DoesNotExist:
            return None

    def get(self, request, exam_id):
        if not is_professor(request.user):
            return Response({"error": "Unauthorized. Professors only."}, status=status.HTTP_403_FORBIDDEN)

        exam = self.get_exam(exam_id, request.user)
        if not exam:
            return Response({"error": "Exam not found."}, status=status.HTTP_404_NOT_FOUND)

        exam = auto_update_exam_status(exam)
        return Response(ExamSerializer(exam).data, status=status.HTTP_200_OK)

    def put(self, request, exam_id):
        if not is_professor(request.user):
            return Response({"error": "Unauthorized. Professors only."}, status=status.HTTP_403_FORBIDDEN)

        exam = self.get_exam(exam_id, request.user)
        if not exam:
            return Response({"error": "Exam not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = ExamSerializer(exam, data=request.data)
        if serializer.is_valid():
            exam = serializer.save()
            assigned = request.data.get('assigned_student_ids')
            selection = request.data.get('student_selection_type', 'all')

            if selection == 'specific' and assigned:
                students = BaseUser.objects.filter(
                    custom_id__in=assigned,
                    role=BaseUser.Role.STUDENT
                )
                exam.assigned_students.set(students)
            else:
                exam.assigned_students.clear()

            return Response({
                "message": "Exam updated successfully.",
                "data": serializer.data
            }, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, exam_id):
        if not is_professor(request.user):
            return Response({"error": "Unauthorized. Professors only."}, status=status.HTTP_403_FORBIDDEN)

        exam = self.get_exam(exam_id, request.user)
        if not exam:
            return Response({"error": "Exam not found."}, status=status.HTTP_404_NOT_FOUND)

        exam.delete()
        return Response({"message": "Exam deleted successfully."}, status=status.HTTP_200_OK)


# ─── Get Exam Results for Professor ───────────────────────────────
class ExamResultsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, exam_id):
        if not is_professor(request.user):
            return Response({"error": "Unauthorized. Professors only."}, status=status.HTTP_403_FORBIDDEN)

        try:
            exam = Exam.objects.get(id=exam_id, professor=request.user)
        except Exam.DoesNotExist:
            return Response({"error": "Exam not found."}, status=status.HTTP_404_NOT_FOUND)

        results = ExamResult.objects.filter(exam=exam).select_related('student')

        data = []
        for r in results:
            data.append({
                'id': r.student.id,
                'student_id': r.student.custom_id,
                'student_name': r.student.get_full_name(),
                'profile_image': r.student.profile_image.url if r.student.profile_image else None,
                'total_marks_obtained': r.total_marks_obtained,
                'total_marks': r.total_marks,
                'percentage': r.percentage,
                'submitted_at': r.submitted_at,
                'is_terminated': r.is_terminated,
                'risk_score': r.risk_score if hasattr(r, 'risk_score') and r.risk_score is not None else r.violation_score,
                'grading_status': r.grading_status,
            })

        return Response({
            'exam_id': exam.id,
            'exam_title': exam.title,
            'total_students': len(data),
            'results': data,
            'has_essay_questions': exam.questions.filter(question_type='essay').exists(),
        })


# ─── Grade Essay Questions (Instructor) ───────────────────────────
class GradeEssayView(APIView):
    permission_classes = [IsAuthenticated]

    def _get_exam(self, exam_id, user):
        try:
            return Exam.objects.get(id=exam_id, professor=user)
        except Exam.DoesNotExist:
            return None

    def get(self, request, exam_id):
        """Return all students' essay answers for this exam."""
        if not is_professor(request.user):
            return Response({"error": "Professors only."}, status=status.HTTP_403_FORBIDDEN)

        exam = self._get_exam(exam_id, request.user)
        if not exam:
            return Response({"error": "Exam not found."}, status=status.HTTP_404_NOT_FOUND)

        essay_questions = exam.questions.filter(question_type='essay').order_by('order')
        if not essay_questions.exists():
            return Response({"error": "This exam has no essay questions."}, status=status.HTTP_400_BAD_REQUEST)

        results = ExamResult.objects.filter(exam=exam).select_related('student')

        students_data = []
        for result in results:
            student = result.student
            answers = []
            for q in essay_questions:
                try:
                    sa = student.answers.get(exam=exam, question=q)
                    answers.append({
                        'question_id':   q.id,
                        'question_text': q.question_text,
                        'max_marks':     q.marks,
                        'essay_answer':  sa.essay_answer or '',
                        'marks_awarded': float(sa.marks_obtained),
                        'is_graded':     sa.marks_obtained > 0 or sa.essay_answer is not None,
                    })
                except Exception:
                    answers.append({
                        'question_id':   q.id,
                        'question_text': q.question_text,
                        'max_marks':     q.marks,
                        'essay_answer':  '',
                        'marks_awarded': 0,
                        'is_graded':     False,
                    })

            students_data.append({
                'student_id':      student.id,
                'student_name':    student.get_full_name(),
                'student_code':    student.custom_id,
                'profile_image':   request.build_absolute_uri(student.profile_image.url) if student.profile_image else None,
                'grading_status':  result.grading_status,
                'answers':         answers,
            })

        return Response({
            'exam_id':    exam.id,
            'exam_title': exam.title,
            'students':   students_data,
        })

    def post(self, request, exam_id):
        """Save marks for a specific student's essay question."""
        if not is_professor(request.user):
            return Response({"error": "Professors only."}, status=status.HTTP_403_FORBIDDEN)

        exam = self._get_exam(exam_id, request.user)
        if not exam:
            return Response({"error": "Exam not found."}, status=status.HTTP_404_NOT_FOUND)

        student_id  = request.data.get('student_id')
        question_id = request.data.get('question_id')
        marks_awarded = request.data.get('marks_awarded', 0)

        try:
            marks_awarded = float(marks_awarded)
        except (TypeError, ValueError):
            return Response({"error": "Invalid marks value."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            from authentication.models import BaseUser
            student = BaseUser.objects.get(id=student_id)
        except BaseUser.DoesNotExist:
            return Response({"error": "Student not found."}, status=status.HTTP_404_NOT_FOUND)

        try:
            from .models import Question
            question = Question.objects.get(id=question_id, exam=exam, question_type='essay')
        except Question.DoesNotExist:
            return Response({"error": "Essay question not found."}, status=status.HTTP_404_NOT_FOUND)

        # Clamp marks to max allowed
        marks_awarded = min(marks_awarded, question.marks)

        # Update the StudentAnswer
        from .models import StudentAnswer
        sa, _ = StudentAnswer.objects.get_or_create(
            student=student, exam=exam, question=question,
            defaults={'essay_answer': '', 'marks_obtained': 0}
        )
        old_marks = float(sa.marks_obtained)
        sa.marks_obtained = marks_awarded
        sa.is_correct = marks_awarded > 0
        sa.save()

        # Recalculate total marks for this student
        result = ExamResult.objects.get(student=student, exam=exam)
        marks_diff = marks_awarded - old_marks
        new_total = float(result.total_marks_obtained) + marks_diff
        new_total = max(0, new_total)
        new_pct = (new_total / exam.total_marks * 100) if exam.total_marks > 0 else 0
        result.total_marks_obtained = round(new_total, 2)
        result.percentage = round(new_pct, 2)

        # Check if ALL essay questions are now graded for this student
        essay_questions = exam.questions.filter(question_type='essay')
        graded_count = StudentAnswer.objects.filter(
            student=student, exam=exam,
            question__question_type='essay',
            marks_obtained__gt=0
        ).count()

        unsubmitted_essays = StudentAnswer.objects.filter(
            student=student, exam=exam,
            question__question_type='essay',
            essay_answer__isnull=False
        ).exclude(essay_answer='').count()

        if graded_count >= essay_questions.count() or graded_count >= unsubmitted_essays:
            result.grading_status = 'graded'
        
        result.save()

        return Response({
            'detail': 'Grade saved.',
            'new_total': float(result.total_marks_obtained),
            'new_percentage': float(result.percentage),
            'grading_status': result.grading_status,
        })


class TerminateStudentExamView(APIView):
    """
    POST /api/exam/<exam_id>/terminate/<student_id>/
    Allows an instructor to forcefully terminate a student's exam.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, exam_id, student_id):
        if not is_professor(request.user):
            return Response({"error": "Unauthorized. Professors only."}, status=status.HTTP_403_FORBIDDEN)

        try:
            exam = Exam.objects.get(id=exam_id, professor=request.user)
        except Exam.DoesNotExist:
            return Response({"error": "Exam not found."}, status=status.HTTP_404_NOT_FOUND)

        try:
            student = BaseUser.objects.get(id=student_id, role=BaseUser.Role.STUDENT)
        except BaseUser.DoesNotExist:
            return Response({"error": "Student not found."}, status=status.HTTP_404_NOT_FOUND)

        # Mark session inactive
        session = ExamSession.objects.filter(exam=exam, student=student, is_active=True).first()
        if session:
            session.is_active = False
            session.save()

        # Compute risk score
        from violation_Exam.risk_engine import compute_risk_score
        computed_risk = compute_risk_score(student, exam)

        # Update or create ExamResult
        has_essays = exam.questions.filter(question_type='essay').exists()
        grading_status = 'pending' if has_essays else 'auto'

        result, created = ExamResult.objects.get_or_create(
            student=student,
            exam=exam,
            defaults={
                'total_marks_obtained': 0,
                'total_marks': exam.total_marks,
                'percentage': 0.0,
                'is_terminated': True,
                'termination_reason': 'instructor',
                'violation_score': 0.0,
                'risk_score': computed_risk,
                'grading_status': grading_status,
            }
        )

        if not created:
            result.is_terminated = True
            result.termination_reason = 'instructor'
            result.risk_score = computed_risk
            result.save()

        # Notify student
        from notifications.models import Notification
        from django.core.mail import send_mail
        
        Notification.objects.create(
            recipient=student,
            type='system',
            title='Exam Terminated',
            content=f'Your exam "{exam.title}" was terminated by the instructor.',
            priority='high',
            metadata={'examId': exam.id}
        )

        try:
            send_mail(
                subject=f'Exam Terminated: {student.email}',
                message=f'Student {student.email} ({student.first_name} {student.last_name}) had their exam "{exam.title}" forcefully terminated by the instructor.',
                from_email=None,
                recipient_list=['ExamGuard11@gmail.com'],
                fail_silently=True,
            )
        except Exception as e:
            print(f"Email failed to send: {e}")

        return Response({
            'detail': 'Exam terminated successfully.',
            'student_id': student.id
        }, status=status.HTTP_200_OK)