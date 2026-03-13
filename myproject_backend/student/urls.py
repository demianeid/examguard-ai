from django.urls import path
from .views import StudentClassesView, JoinClassView, StudentClassExamsView

urlpatterns = [
    path('classes/', StudentClassesView.as_view(), name='student-classes'),
    path('classes/join/', JoinClassView.as_view(), name='join-class'),
    path('classes/<int:class_id>/exams/', StudentClassExamsView.as_view(), name='student-class-exams'),
]