from django.contrib import admin
from .models import Class, ClassEnrollment


@admin.register(Class)
class ClassAdmin(admin.ModelAdmin):
    list_display = ['name', 'instructor', 'number_of_students', 'code', 'created_at']
    list_filter = ['created_at']
    search_fields = ['name', 'code']
    readonly_fields = ['code', 'created_at']


@admin.register(ClassEnrollment)
class ClassEnrollmentAdmin(admin.ModelAdmin):
    list_display = ['student', 'class_enrolled', 'enrolled_at']
    list_filter = ['class_enrolled']
    search_fields = ['student__student_custom_id', 'student__first_name', 'student__last_name']
    readonly_fields = ['enrolled_at']