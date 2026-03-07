from rest_framework import generics, permissions
from .models import Class
from .serializers import ClassSerializer


class ClassListCreateView(generics.ListCreateAPIView):  # بيقبل GET و POST
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