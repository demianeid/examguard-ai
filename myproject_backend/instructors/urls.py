from django.urls import path
from .views import ClassListCreateView, ClassDetailView, ClassStudentsView, JoinClassView

urlpatterns = [
    path('classes/', ClassListCreateView.as_view(), name='class-list-create'),
    path('classes/join/', JoinClassView.as_view(), name='join-class'),
    path('classes/<int:pk>/', ClassDetailView.as_view(), name='class-detail'),
    path('classes/<int:pk>/students/', ClassStudentsView.as_view(), name='class-students'),
]