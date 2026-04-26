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