"""
ASGI config for backend project — upgraded for Django Channels (Phase 6).

Supports both standard HTTP (via Django's ASGI app) and WebSocket
connections (via Channels routing).
"""

import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
import hardware.ai_detection.routing
import notifications.routing

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

application = ProtocolTypeRouter({
    # Standard Django HTTP
    "http": get_asgi_application(),

    # WebSocket connections — JWT auth middleware wraps the router
    "websocket": AuthMiddlewareStack(
        URLRouter(
            hardware.ai_detection.routing.websocket_urlpatterns +
            notifications.routing.websocket_urlpatterns
        )
    ),
})
