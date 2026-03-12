from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.html import format_html
from .models import BaseUser, StudentProfile, ProfessorProfile

# ─── Base User Admin ──────────────────────────────────────────────
@admin.register(BaseUser)
class BaseUserAdmin(UserAdmin):
    # Main list view columns
    list_display  = ('first_name', 'last_name', 'email', 'custom_id', 'role', 'is_active')
    list_filter   = ('role', 'is_active', 'is_staff')
    search_fields = ('email', 'first_name', 'last_name', 'custom_id')
    ordering      = ('-date_joined',)
    readonly_fields = ('custom_id', 'username')

    # The form used when ADDING a new user (Simplified as requested)
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('first_name', 'last_name', 'email', 'password'),
        }),
    )

    # The form used when EDITING an existing user
    fieldsets = (
        (None, {'fields': ('custom_id', 'username', 'password')}),
        ('Personal Info', {'fields': ('first_name', 'last_name', 'email', 'phone_number', 'profile_image')}),
        ('Role & Status', {'fields': ('role', 'is_active', 'is_staff', 'is_superuser')}),
        ('OTP Info', {'fields': ('otp_code', 'otp_expiry', 'email_sent')}),
    )

# ─── Student Profile Admin ────────────────────────────────────────
@admin.register(StudentProfile)
class StudentProfileAdmin(admin.ModelAdmin):
    list_display  = ('get_id', 'get_full_name', 'get_email', 'get_is_active')
    search_fields = ('user__custom_id', 'user__email', 'user__last_name')

    def get_id(self, obj):        return obj.user.custom_id
    def get_full_name(self, obj):  return obj.user.get_full_name()
    def get_email(self, obj):      return obj.user.email
    def get_is_active(self, obj):  return obj.user.is_active

    get_id.short_description        = 'Student ID'
    get_full_name.short_description = 'Full Name'
    get_email.short_description     = 'Email'
    get_is_active.short_description = 'Active'
    get_is_active.boolean           = True

# ─── Professor Profile Admin ──────────────────────────────────────
@admin.register(ProfessorProfile)
class ProfessorProfileAdmin(admin.ModelAdmin):
    list_display  = ('get_id', 'get_full_name', 'get_email', 'is_verified', 'display_id_card')
    list_filter   = ('is_verified',)
    list_editable = ('is_verified',)
    search_fields = ('user__custom_id', 'user__email', 'user__last_name')
    actions       = ['activate_professors']

    def get_id(self, obj):        return obj.user.custom_id
    def get_full_name(self, obj):  return f"Dr. {obj.user.get_full_name()}"
    def get_email(self, obj):      return obj.user.email

    get_id.short_description        = 'Professor ID'
    get_full_name.short_description = 'Full Name'
    get_email.short_description     = 'Email'

    def display_id_card(self, obj):
        if obj.identity_card:
            return format_html(
                '<a href="{0}" target="_blank"><img src="{0}" style="width:50px;height:auto;border-radius:5px;" /></a>',
                obj.identity_card.url
            )
        return "No ID Uploaded"
    display_id_card.short_description = 'ID Card'

    @admin.action(description="Verify and Activate selected Professors")
    def activate_professors(self, request, queryset):
        for profile in queryset:
            profile.is_verified = True
            profile.save()
            user = profile.user
            user.is_active = True
            user.save()
        self.message_user(request, f"Successfully activated {queryset.count()} professors.")