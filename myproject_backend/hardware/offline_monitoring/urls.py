from django.urls import path
from . import views

urlpatterns = [
    # ExamHall
    path('halls/',         views.exam_hall_list,   name='exam-hall-list'),
    path('halls/<int:pk>/', views.exam_hall_detail, name='exam-hall-detail'),

    # Camera
    path('halls/<int:hall_id>/cameras/', views.camera_list, name='camera-list'),

    # OfflineExam
    path('exams/',          views.offline_exam_list,   name='offline-exam-list'),
    path('exams/<int:pk>/', views.offline_exam_detail, name='offline-exam-detail'),

    # StudentZone
    path('exams/<int:exam_id>/zones/', views.student_zone_list,   name='student-zone-list'),
    path('zones/<int:pk>/',            views.student_zone_detail, name='student-zone-detail'),
]