from django.contrib import admin
from .models import ExamHall, Camera, OfflineExam, StudentZone


@admin.register(ExamHall)
class ExamHallAdmin(admin.ModelAdmin):
    list_display  = ['name', 'building', 'capacity', 'is_active']
    list_filter   = ['is_active', 'building']
    search_fields = ['name', 'building']


@admin.register(Camera)
class CameraAdmin(admin.ModelAdmin):
    list_display  = ['name', 'hall', 'status']
    list_filter   = ['status', 'hall']
    search_fields = ['name']


@admin.register(OfflineExam)
class OfflineExamAdmin(admin.ModelAdmin):
    list_display  = ['title', 'hall', 'professor', 'date', 'status']
    list_filter   = ['status', 'hall']
    search_fields = ['title']


@admin.register(StudentZone)
class StudentZoneAdmin(admin.ModelAdmin):
    list_display  = ['seat_number', 'student', 'exam', 'camera']
    list_filter   = ['exam', 'camera']
    search_fields = ['seat_number']