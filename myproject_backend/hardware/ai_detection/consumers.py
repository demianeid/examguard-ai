"""
hardware/ai_detection/consumers.py
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
WebSocket consumer for real-time alert streaming.

Each instructor connecting to ws://server/ws/exam/<exam_id>/alerts/
is subscribed to the channel group  "exam_<exam_id>_alerts".

When the frame_dispatcher creates a new alert it calls
  channel_layer.group_send("exam_<exam_id>_alerts", {...})
and this consumer forwards that message to the WebSocket client.
"""

import json
from channels.generic.websocket import AsyncWebsocketConsumer


class AlertConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.exam_id   = self.scope["url_route"]["kwargs"]["exam_id"]
        self.group_name = f"exam_{self.exam_id}_alerts"

        # Join the exam-specific channel group
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    # Receive a message forwarded from the channel layer (sent by dispatcher)
    async def alert_message(self, event):
        """Called when group_send() sends type='alert.message'."""
        await self.send(text_data=json.dumps(event["data"]))
