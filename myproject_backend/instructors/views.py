from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Class, ClassEnrollment
from .serializers import ClassSerializer
from authentication.models import Student


class ClassListCreateView(generics.ListCreateAPIView):
    serializer_class = ClassSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Class.objects.filter(instructor=self.request.user)

    def perform_create(self, serializer):
        serializer.save(instructor=self.request.user)


class ClassDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ClassSerializer
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
            profile_image_url = None
            if student.profile_image:
                profile_image_url = request.build_absolute_uri(student.profile_image.url)

            students_data.append({
                'id': student.id,
                'student_custom_id': student.student_custom_id,
                'first_name': student.first_name,
                'last_name': student.last_name,
                'full_name': f"{student.first_name} {student.last_name}",
                'profile_image': profile_image_url,
                'enrolled_at': enrollment.enrolled_at,
            })

        return Response(students_data)