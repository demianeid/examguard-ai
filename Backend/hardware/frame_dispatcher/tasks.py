import logging
from concurrent.futures import ThreadPoolExecutor, as_completed
from celery import shared_task
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from hardware.ai_detection.models import MonitoringSession
from hardware.offline_monitoring.models import Camera
from .dispatcher import dispatch_once

logger = logging.getLogger(__name__)

# Max parallel threads for camera dispatch.
# One thread per camera — keeps cycle time constant regardless of camera count.
_DISPATCH_THREAD_POOL = ThreadPoolExecutor(max_workers=16, thread_name_prefix="cam_dispatch")


def _push_alert_to_ws(exam_id: int, alert_data: dict) -> None:
    """
    Push a single alert payload to the WebSocket group for this exam.
    Called synchronously from the Celery worker thread.
    """
    try:
        channel_layer = get_channel_layer()
        if channel_layer is None:
            logger.warning("No channel layer configured — skipping WebSocket push.")
            return

        group_name = f"exam_{exam_id}_alerts"
        # Use a timeout for the async_to_sync call to avoid hanging the solo worker
        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                "type":  "alert.message",   # maps to AlertConsumer.alert_message()
                "data":  alert_data,
            },
        )
        logger.debug("WS push success → group=%s", group_name)
    except Exception as exc:
        logger.error("WebSocket push CRASHED for exam %s: %s", exam_id, exc)


def _dispatch_camera(session_id, exam_id, camera) -> bool:
    """
    Worker function executed in a thread — dispatches one camera.
    Returns True on success, False on failure.
    """
    logger.info(
        "Dispatching frame | session=%s exam=%s cam=%s",
        session_id, exam_id, camera.id,
    )
    try:
        return dispatch_once(
            stream_url=camera.stream_url,
            exam_id=exam_id,
            camera_id=camera.id,
            session_id=session_id,
            ws_push_fn=_push_alert_to_ws,
        )
    except Exception as exc:
        logger.error("Error dispatching cam %s: %s", camera.id, exc)
        return False


@shared_task
def dispatch_active_sessions():
    """
    Celery Beat task — runs every 2 s.
    For each active MonitoringSession, capture a frame from EVERY camera
    in the exam hall IN PARALLEL so that having multiple cameras/zones
    never adds delay to the cycle time.
    """
    active_sessions = MonitoringSession.objects.filter(status='running')

    if not active_sessions.exists():
        logger.debug("No active monitoring sessions found.")
        return "No active sessions"

    # Build a list of all (session, exam_id, camera) jobs across all sessions
    jobs = []
    for session in active_sessions:
        exam     = session.exam
        hall     = exam.hall
        exam_id  = exam.id
        cameras  = Camera.objects.filter(hall=hall, status='active')

        for camera in cameras:
            if not camera.stream_url:
                logger.warning("Camera %s has no stream_url.", camera.id)
                continue
            jobs.append((session.id, exam_id, camera))

    if not jobs:
        return "No active sessions"

    # Fire all camera dispatches in parallel
    futures = {
        _DISPATCH_THREAD_POOL.submit(_dispatch_camera, sid, eid, cam): cam.id
        for sid, eid, cam in jobs
    }

    dispatched_count = 0
    for future in as_completed(futures):
        cam_id = futures[future]
        try:
            if future.result():
                dispatched_count += 1
        except Exception as exc:
            logger.error("Camera %s dispatch thread raised: %s", cam_id, exc)

    total_sessions = active_sessions.count()
    logger.info(
        "Parallel dispatch complete: %d/%d cameras OK across %d session(s).",
        dispatched_count, len(jobs), total_sessions,
    )
    return f"Dispatched {dispatched_count}/{len(jobs)} cameras across {total_sessions} sessions."
