
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