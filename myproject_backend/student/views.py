from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from instructors.models import Class, ClassEnrollment
from exam.models import Exam


# ─── Get all classes the student is enrolled in ───────────────────
class StudentClassesView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # Get all enrollments for the current student
        enrollments = ClassEnrollment.objects.filter(
            student=request.user
        ).select_related('class_enrolled', 'class_enrolled__instructor')

        classes_data = []
        for enrollment in enrollments:
            cls = enrollment.class_enrolled
            classes_data.append({
                'id': cls.id,
                'name': cls.name,
                'description': cls.description,
                'code': cls.code,
                'instructor_name': cls.instructor.get_full_name(),
                'created_at': cls.created_at,
            })

        return Response(classes_data)


# ─── Join a class using its code ──────────────────────────────────
class JoinClassView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        # Get and clean the class code from request
        code = request.data.get('code', '').upper().strip()

        if not code:
            return Response(
                {'detail': 'Class code is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if class exists
        try:
            cls = Class.objects.get(code=code)
        except Class.DoesNotExist:
            return Response(
                {'detail': 'Class not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Check if student is already enrolled
        if ClassEnrollment.objects.filter(student=request.user, class_enrolled=cls).exists():
            return Response(
                {'detail': 'Already enrolled in this class.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create enrollment
        ClassEnrollment.objects.create(student=request.user, class_enrolled=cls)

        return Response({
            'detail': 'Joined successfully!',
            'class_id': cls.id,
            'class_name': cls.name,
            'class_code': cls.code,
            'instructor_name': cls.instructor.get_full_name(),
        }, status=status.HTTP_201_CREATED)


# ─── Get all exams for a specific class ───────────────────────────
class StudentClassExamsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, class_id):
        # Verify student is enrolled in this class
        enrolled = ClassEnrollment.objects.filter(
            student=request.user,
            class_enrolled__id=class_id
        ).exists()

        if not enrolled:
            return Response(
                {'detail': 'Not enrolled in this class.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Return all exams for this class
        exams = Exam.objects.filter(class_id=class_id).values(
            'id', 'title', 'description', 'duration',
            'total_marks', 'start_datetime', 'end_datetime', 'status'
        )

        return Response(list(exams))