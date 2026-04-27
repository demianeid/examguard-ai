from django.urls import path
from .views import (
    StudentClassesView,
    JoinClassView,
    LeaveClassView,
    StudentClassExamsView,
    StudentExamDetailView,
    StudentExamStartView,
    StudentExamSubmitView,
    StudentExamResultView,
    StudentClassGradesView,
    StudentDashboardView,
)
from face.views import verify_face  # alias so frontend /api/student/face/verify/ works

urlpatterns = [
    path('classes/',                              StudentClassesView.as_view(),    name='student-classes'),
    path('classes/join/',                         JoinClassView.as_view(),         name='join-class'),
    path('classes/<int:class_id>/leave/',         LeaveClassView.as_view(),        name='leave-class'),
    path('classes/<int:class_id>/exams/',         StudentClassExamsView.as_view(), name='student-class-exams'),
    path('classes/<int:class_id>/grades/',        StudentClassGradesView.as_view(),name='student-class-grades'),
    path('exams/<int:exam_id>/',                  StudentExamDetailView.as_view(), name='student-exam-detail'),
    path('exams/<int:exam_id>/start/',            StudentExamStartView.as_view(),  name='student-exam-start'),
    path('exams/<int:exam_id>/submit/',           StudentExamSubmitView.as_view(), name='student-exam-submit'),
    path('exams/<int:exam_id>/result/',           StudentExamResultView.as_view(), name='student-exam-result'),
    path('dashboard/',                            StudentDashboardView.as_view(),  name='student-dashboard'),

    # Face verification alias — frontend calls /api/student/face/verify/
    path('face/verify/',                          verify_face,                     name='student-face-verify'),
]