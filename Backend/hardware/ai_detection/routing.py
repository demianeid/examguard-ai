"""
hardware/ai_detection/routing.py
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
WebSocket URL routing for the ai_detection module.
"""

from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r"^ws/exam/(?P<exam_id>\d+)/alerts/$", consumers.AlertConsumer.as_asgi()),
]
