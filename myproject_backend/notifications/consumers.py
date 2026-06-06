import json
from channels.generic.websocket import AsyncWebsocketConsumer
from urllib.parse import parse_qs
from channels.db import database_sync_to_async
from rest_framework_simplejwt.tokens import AccessToken
@database_sync_to_async
def get_user_from_token(token):
    try:
        from django.contrib.auth import get_user_model
        User = get_user_model()
        access_token = AccessToken(token)
        user = User.objects.get(id=access_token['user_id'])
        return user
    except Exception as e:
        print(f"[WebSocket Auth] Error parsing token: {e}")
        return None

class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        query_string = self.scope['query_string'].decode()
        query_params = parse_qs(query_string)
        
        user = self.scope.get("user")
        if user and user.is_authenticated:
            self.user = user
        elif 'token' in query_params:
            token = query_params['token'][0]
            self.user = await get_user_from_token(token)
        else:
            self.user = None

        if not self.user:
            await self.close()
            return
            
        self.group_name = f"user_{self.user.id}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def send_notification(self, event):
        notification_data = event['notification']
        await self.send(text_data=json.dumps(notification_data))
