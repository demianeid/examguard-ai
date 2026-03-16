from django.urls import path
from .views import ExamListCreateView, ExamDetailView, ExamResultsView

urlpatterns = [
    path('class/<int:class_id>/', ExamListCreateView.as_view(), name='exam-list-create'),
    path('<int:exam_id>/', ExamDetailView.as_view(), name='exam-detail'),
    path('<int:exam_id>/results/', ExamResultsView.as_view(), name='exam-results'),
]