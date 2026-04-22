import logging
from celery import shared_task
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from hardware.ai_detection.models import MonitoringSession
from hardware.offline_monitoring.models import Camera
from .dispatcher import dispatch_once

logger = logging.getLogger(__name__)


def _push_alert_to_ws(exam_id: int, alert_data: dict) -> None:
    """
    Push a single alert payload to the WebSocket group for this exam.
    Called synchronously from the Celery worker thread.
    """
    channel_layer = get_channel_layer()
    if channel_layer is None:
        logger.warning("No channel layer configured — skipping WebSocket push.")
        return

    group_name = f"exam_{exam_id}_alerts"
    try:
        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                "type":  "alert.message",   # maps to AlertConsumer.alert_message()
                "data":  alert_data,
            },
        )
        logger.debug("WS push → group=%s payload=%s", group_name, alert_data)
    except Exception as exc:
        logger.error("WebSocket push failed for exam %s: %s", exam_id, exc)


@shared_task
def dispatch_active_sessions():
    """
    Celery Beat task — runs every 2 s.
    For each active MonitoringSession, capture a frame from every camera
    in the exam hall, send it to RunPod, and push any resulting alerts
    to the WebSocket group so the frontend receives them in real time.
    """
    active_sessions = MonitoringSession.objects.filter(status='running')

    if not active_sessions.exists():
        logger.debug("No active monitoring sessions found.")
        return "No active sessions"

    dispatched_count = 0

    for session in active_sessions:
        exam     = session.exam
        hall     = exam.hall
        exam_id  = exam.id
        cameras  = Camera.objects.filter(hall=hall, status='active')

        for camera in cameras:
            if not camera.stream_url:
                logger.warning("Camera %s has no stream_url.", camera.id)
                continue

            logger.info(
                "Dispatching frame | session=%s exam=%s cam=%s",
                session.id, exam_id, camera.id,
            )

            try:
                # dispatch_once handles: capture → encode → RunPod → post alerts via REST
                # It returns (success, alert_payloads) in the updated version below
                result = dispatch_once(
                    stream_url=camera.stream_url,
                    exam_id=exam_id,
                    camera_id=camera.id,
                    session_id=session.id,
                    ws_push_fn=_push_alert_to_ws,   # ← NEW: callback for WS push
                )
                if result:
                    dispatched_count += 1
            except Exception as exc:
                logger.error("Error dispatching cam %s: %s", camera.id, exc)

    return f"Dispatched {dispatched_count} frames across {active_sessions.count()} sessions."
