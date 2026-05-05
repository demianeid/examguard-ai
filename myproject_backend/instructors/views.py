
from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Class, ClassEnrollment
from .serializers import ClassSerializer
from authentication.models import BaseUser


class ClassListCreateView(generics.ListCreateAPIView):
    serializer_class   = ClassSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Class.objects.filter(instructor=self.request.user)

    def perform_create(self, serializer):
        serializer.save(instructor=self.request.user)


class ClassDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class   = ClassSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Class.objects.filter(instructor=self.request.user)


class ClassStudentsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        try:
            cls = Class.objects.get(pk=pk, instructor=request.user)
        except Class.DoesNotExist:
            return Response({'detail': 'Class not found.'}, status=status.HTTP_404_NOT_FOUND)

        enrollments = ClassEnrollment.objects.filter(class_enrolled=cls).select_related('student')

        students_data = []
        for enrollment in enrollments:
            student = enrollment.student
            students_data.append({
                'id':                student.id,
                'student_id':        student.custom_id,
                'student_custom_id': student.custom_id,
                'first_name':        student.first_name,
                'last_name':         student.last_name,
                'full_name':         student.get_full_name(),
                'profile_image':     request.build_absolute_uri(student.profile_image.url) if student.profile_image else None,
                'enrolled_at':       enrollment.enrolled_at,
            })

        return Response(students_data)


# ✅ ClassStudentsView
class JoinClassView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        code = request.data.get('code', '').upper().strip()
        
        if not code:
            return Response(
                {'detail': 'Class code is required.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            cls = Class.objects.get(code=code)
        except Class.DoesNotExist:
            return Response(
                {'detail': 'Class not found.'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        if ClassEnrollment.objects.filter(student=request.user, class_enrolled=cls).exists():
            return Response(
                {'detail': 'Already enrolled in this class.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        ClassEnrollment.objects.create(student=request.user, class_enrolled=cls)
        
        return Response({
            'detail': 'Joined successfully!',
            'class_id': cls.id,
            'class_name': cls.name,
            'class_code': cls.code,
            'instructor': cls.instructor.get_full_name(),
        }, status=status.HTTP_201_CREATED)


class StudentPerformanceView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, student_id):
        # Verify student exists
        try:
            student = BaseUser.objects.get(id=student_id, role=BaseUser.Role.STUDENT)
        except BaseUser.DoesNotExist:
            return Response({'detail': 'Student not found.'}, status=status.HTTP_404_NOT_FOUND)

        from exam.models import ExamResult, Exam
        from django.db.models import Avg, Q

        overall_avg = ExamResult.objects.filter(student=student).aggregate(Avg('percentage'))['percentage__avg']
        completed_count = ExamResult.objects.filter(student=student).count()
        
        # Get all classes the student is in to count total assigned exams
        enrollments = ClassEnrollment.objects.filter(student=student)
        class_ids = [e.class_enrolled.id for e in enrollments]
        
        total_exams = Exam.objects.filter(
            class_id__in=class_ids
        ).filter(
            Q(assigned_students__isnull=True) | Q(assigned_students=student)
        ).distinct().count()
        
        return Response({
            'average_score': round(overall_avg) if overall_avg is not None else 0,
            'completed_exams': completed_count,
            'total_exams': total_exams,
            'attendance_rate': 85, # Placeholder for Phase 4
        })