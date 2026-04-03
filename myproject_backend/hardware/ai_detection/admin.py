from django.contrib import admin
from .models import MonitoringSession, Alert, ViolationLog


@admin.register(MonitoringSession)
class MonitoringSessionAdmin(admin.ModelAdmin):
    list_display  = ['exam', 'status', 'started_at', 'ended_at']
    list_filter   = ['status']


@admin.register(Alert)
class AlertAdmin(admin.ModelAdmin):
    list_display  = ['alert_type', 'severity', 'zone', 'timestamp', 'is_reviewed']
    list_filter   = ['alert_type', 'severity', 'is_reviewed']
    search_fields = ['zone__seat_number']


@admin.register(ViolationLog)
class ViolationLogAdmin(admin.ModelAdmin):
    list_display  = ['student', 'session', 'total_alerts', 'violation_score']
    list_filter   = ['session']
    search_fields = ['student__first_name', 'student__last_name']