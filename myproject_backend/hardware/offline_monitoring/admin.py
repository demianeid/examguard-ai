from django.contrib import admin
from .models import ExamHall, Camera, OfflineExam, StudentZone, HallEnrollment

admin.site.register(ExamHall)
admin.site.register(Camera)
admin.site.register(OfflineExam)
admin.site.register(StudentZone)
admin.site.register(HallEnrollment)
