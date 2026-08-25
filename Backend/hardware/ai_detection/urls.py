from django.urls import path
from . import views

urlpatterns = [
    # MonitoringSession
    path('exams/<int:exam_id>/start/',   views.start_monitoring,  name='start-monitoring'),
    path('exams/<int:exam_id>/session/', views.get_session,        name='get-session'),
    path('sessions/<int:session_id>/end/', views.end_monitoring,   name='end-monitoring'),

    # Alerts
    path('sessions/<int:session_id>/alerts/', views.alert_list,   name='alert-list'),
    path('alerts/<int:pk>/review/',           views.review_alert, name='review-alert'),

    # ViolationLog
    path('sessions/<int:session_id>/violations/',        views.violation_log_list,         name='violation-log-list'),
    path('sessions/<int:session_id>/generate-report/',   views.generate_violation_report,  name='generate-report'),
]