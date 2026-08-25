from django.contrib import admin
from .models import StreamSession


@admin.register(StreamSession)
class StreamSessionAdmin(admin.ModelAdmin):
    list_display  = ['camera', 'status', 'fps', 'resolution', 'started_at']
    list_filter   = ['status']
    search_fields = ['camera__name']