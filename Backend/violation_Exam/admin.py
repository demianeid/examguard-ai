from django.contrib import admin
from .models import ViolationBehavior, AIEventViolation


@admin.register(ViolationBehavior)
class ViolationBehaviorAdmin(admin.ModelAdmin):
    list_display  = ('student', 'exam', 'event_type', 'score_points', 'cumulative_score', 'occurred_at')
    list_filter   = ('event_type', 'exam')
    search_fields = ('student__email', 'exam__title', 'details')
    ordering      = ('-occurred_at',)


@admin.register(AIEventViolation)
class AIEventViolationAdmin(admin.ModelAdmin):
    list_display  = ('student', 'exam', 'cheating_reason', 'head_suspicious', 'yolo_suspicious', 'occurred_at')
    list_filter   = ('head_suspicious', 'yolo_suspicious', 'exam')
    search_fields = ('student__email', 'exam__title', 'cheating_reason')
    ordering      = ('-occurred_at',)
