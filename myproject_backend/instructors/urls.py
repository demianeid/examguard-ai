from django.urls import path
from .views import ClassListCreateView, ClassDetailView, ClassStudentsView, JoinClassView, StudentPerformanceView

urlpatterns = [
    path('classes/', ClassListCreateView.as_view(), name='class-list-create'),
    path('classes/join/', JoinClassView.as_view(), name='join-class'),
    path('classes/<int:pk>/', ClassDetailView.as_view(), name='class-detail'),
    path('classes/<int:pk>/students/', ClassStudentsView.as_view(), name='class-students'),
    path('student-performance/<int:student_id>/', StudentPerformanceView.as_view(), name='student-performance'),
]