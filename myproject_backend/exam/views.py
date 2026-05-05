from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone

from .models import Exam, ExamResult
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
            })

        return Response({
            'exam_id': exam.id,
            'exam_title': exam.title,
            'total_students': len(data),
            'results': data,
        })