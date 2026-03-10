from django.urls import path
from .views import ExamListCreateView, ExamDetailView

urlpatterns = [
    path('class/<int:class_id>/', ExamListCreateView.as_view(), name='exam-list-create'),
    path('<int:exam_id>/', ExamDetailView.as_view(), name='exam-detail'),
]