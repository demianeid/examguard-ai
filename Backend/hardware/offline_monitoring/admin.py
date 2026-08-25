from django.contrib import admin
from .models import ExamHall, Camera, OfflineExam, StudentZone, HallEnrollment

class StudentZoneAdmin(admin.ModelAdmin):
    list_display = ('dynamic_student_name', 'dynamic_seat_number', 'hall', 'camera', 'student_code')
    readonly_fields = ('dynamic_student_name', 'dynamic_seat_number')
    fields = (
        'hall', 'camera', 'student_code',
        'dynamic_student_name', 'dynamic_seat_number',
        'x1', 'y1', 'x2', 'y2'
    )
    search_fields = ('student_code', 'student_name', 'seat_number')
    list_filter = ('hall', 'camera')

    def dynamic_student_name(self, obj):
        return obj.dynamic_student_name
    dynamic_student_name.short_description = 'Current Student Name'

    def dynamic_seat_number(self, obj):
        return obj.dynamic_seat_number
    dynamic_seat_number.short_description = 'Current Seat Number'

admin.site.register(ExamHall)
admin.site.register(Camera)
admin.site.register(OfflineExam)
admin.site.register(StudentZone, StudentZoneAdmin)
admin.site.register(HallEnrollment)
