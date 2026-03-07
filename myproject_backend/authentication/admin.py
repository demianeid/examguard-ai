from django.contrib import admin
from django.utils.html import format_html
from .models import Student, Professor

@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    # BACKEND: Added student_custom_id to fields
    fields = (
        'student_custom_id',  # يظهر في الأول كعنوان للهوية
        'first_name',
        'last_name',
        'real_email',
        'phone_number',
        'profile_image',
        'username',
        # 'email',  # Platform email (@examguard.ed)
        'password',
        'is_active',
    )

    # BACKEND: Display ID in the main list for quick identification
    list_display = ('student_custom_id', 'username', 'real_email', 'email', 'is_active')
    
    # Prevent editing the generated IDs
    readonly_fields = ('student_custom_id', 'email', 'username')

@admin.register(Professor)
class ProfessorAdmin(admin.ModelAdmin):
    # BACKEND: Display Professor ID and keep the professional look
    list_display = ('professor_custom_id', 'first_name', 'last_name', 'real_email', 'is_active', 'display_id_card')
    list_filter = ('is_active', 'created_at')
    search_fields = ('professor_custom_id', 'real_email', 'last_name')
    
    # BACKEND: Added custom ID to detailed view
    fields = (
        'professor_custom_id',
        'first_name',
        'last_name',
        'real_email',
        'phone_number',
        'identity_card',
        'password',
        'is_active',
    )
    readonly_fields = ('professor_custom_id',)

    actions = ['activate_professors']

    def display_id_card(self, obj):
        if obj.identity_card:
            return format_html('<img src="{}" style="width: 50px; height:auto; border-radius:5px;" />', obj.identity_card.url)
        return "No ID Uploaded"
    
    display_id_card.short_description = 'ID Card Preview'

    def activate_professors(self, request, queryset):
        queryset.update(is_active=True)
        self.message_user(request, "Selected professors have been activated.")
    
    activate_professors.short_description = "Activate selected Professors"