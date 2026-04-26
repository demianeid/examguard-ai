from django.urls import path
from .views import (
    PostBehaviorViolationView,
    PostAIViolationView,
    ExamViolationSummaryView,
    StudentViolationSummaryView,
    ExamLiveStatusView,
    ExamIncidentsView,
    ExamRiskScoresView,
    ExamExportAuditTrailView,
)

urlpatterns = [
    path('behavior/',                                      PostBehaviorViolationView.as_view(),   name='violation-behavior-post'),
    path('ai/',                                            PostAIViolationView.as_view(),         name='violation-ai-post'),
    path('exam/<int:exam_id>/',                            ExamViolationSummaryView.as_view(),    name='violation-exam-summary'),
    path('exam/<int:exam_id>/student/<int:student_id>/',   StudentViolationSummaryView.as_view(), name='violation-student-summary'),
    # Phase 2
    path('exam/<int:exam_id>/live-status/',                ExamLiveStatusView.as_view(),          name='violation-live-status'),
    path('exam/<int:exam_id>/incidents/',                  ExamIncidentsView.as_view(),           name='violation-incidents'),
    # Phase 3
    path('exam/<int:exam_id>/risk-scores/',                ExamRiskScoresView.as_view(),          name='violation-risk-scores'),
    # Phase 5
    path('exam/<int:exam_id>/export-audit/',               ExamExportAuditTrailView.as_view(),    name='violation-export-audit'),
]
