from django.urls import path
from . import views

urlpatterns = [
    # ExamHall
    path('halls/',         views.exam_hall_list,   name='exam-hall-list'),
    path('halls/<int:pk>/', views.exam_hall_detail, name='exam-hall-detail'),

    # Camera
    path('halls/<int:hall_id>/cameras/', views.camera_list, name='camera-list'),
    path('cameras/<int:pk>/', views.camera_detail, name='camera-detail'),

    # OfflineExam
    path('exams/',          views.offline_exam_list,   name='offline-exam-list'),
    path('exams/<int:pk>/', views.offline_exam_detail, name='offline-exam-detail'),

    # StudentZone
    path('exams/<int:exam_id>/zones/', views.student_zone_list,   name='student-zone-list'),
    path('zones/<int:pk>/',            views.student_zone_detail, name='student-zone-detail'),

    # HallEnrollment
    path('halls/<int:hall_id>/students/',                   views.hall_enrollment_list,     name='hall-enrollment-list'),
    path('halls/<int:hall_id>/students/bulk-upload/',       views.bulk_enroll_from_excel,   name='hall-enrollment-bulk'),
    path('halls/students/<int:pk>/',                        views.hall_enrollment_detail,   name='hall-enrollment-detail'),

    # Students list
    path('students/list/', views.student_list_view, name='student-list'),
]