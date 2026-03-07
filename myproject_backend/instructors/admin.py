from django.contrib import admin
from .models import Class


@admin.register(Class)
class ClassAdmin(admin.ModelAdmin):
    list_display = ['name', 'instructor', 'number_of_students', 'code', 'created_at']
    list_filter = ['created_at']
    search_fields = ['name', 'code']
    readonly_fields = ['code', 'created_at']