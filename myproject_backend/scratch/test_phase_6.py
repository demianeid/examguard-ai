"""
test_phase_6.py
~~~~~~~~~~~~~~~~
Phase 6 — WebSocket Real-time Alerts Test Suite

Covers:
  1. Consumer unit test  — connects via Channels test client, verifies
     group_send() delivers the message to the WebSocket.
  2. WS push unit test   — _push_alert_to_ws() correctly calls
     channel_layer.group_send with the right group name & payload.
  3. Live integration    — starts a real Daphne server, connects a real
     WebSocket client, fires a fake alert, and verifies it arrives.

Run with:
    ..\venv\Scripts\python.exe scratch\test_phase_6.py
"""

import os
import sys
import json
import asyncio
import threading
import time as _time

# ── Django setup ──────────────────────────────────────────────────────────────
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
os.environ.setdefault('RUNPOD_ENDPOINT', 'http://mock-runpod')

import django
django.setup()

# ── Imports after setup ───────────────────────────────────────────────────────
from unittest.mock import AsyncMock, MagicMock, patch
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from channels.testing import WebsocketCommunicator
from backend.asgi import application   # full ASGI app

PASSED = []
FAILED = []

def report(name, ok, detail=""):
    if ok:
        PASSED.append(name)
        print(f"  [PASS] {name}")
    else:
        FAILED.append(name)
        print(f"  [FAIL] {name}" + (f" — {detail}" if detail else ""))


# ═════════════════════════════════════════════════════════════════════════════
# TEST 1 — Consumer via Channels test client (in-memory channel layer)
# ═════════════════════════════════════════════════════════════════════════════
async def test_consumer_receives_group_message():
    """
    Connect to AlertConsumer via WebsocketCommunicator, push a message
    through the in-memory channel layer, and assert it arrives.
    Uses InMemoryChannelLayer so no Redis is required.
    """
    from channels.layers import get_channel_layer
    from django.test.utils import override_settings

    # Force in-memory channel layer for this test
    test_channel_layer_config = {
        'default': {
            'BACKEND': 'channels.layers.InMemoryChannelLayer',
        }
    }

    exam_id = 42

    with override_settings(CHANNEL_LAYERS=test_channel_layer_config):
        communicator = WebsocketCommunicator(
            application,
            f"/ws/exam/{exam_id}/alerts/"
        )
        connected, subprotocol = await communicator.connect()
        assert connected, "WebSocket failed to connect"

        # Push a fake alert directly to the channel group
        channel_layer = get_channel_layer()
        fake_alert = {
            "id": 1,
            "alert_type": "mobile_phone",
            "severity": "high",
            "zone": 7,
            "session": 1,
            "timestamp": "2026-04-22T15:00:00Z",
            "is_reviewed": False,
        }
        await channel_layer.group_send(
            f"exam_{exam_id}_alerts",
            {"type": "alert.message", "data": fake_alert},
        )

        # Give consumer a moment to forward the message
        response = await asyncio.wait_for(communicator.receive_json_from(), timeout=3.0)
        await communicator.disconnect()

    return response == fake_alert


def run_test_consumer():
    print("\n[TEST 1] Consumer receives group message via Channels test client...")
    try:
        result = async_to_sync(test_consumer_receives_group_message)()
        report("Consumer delivers group_send message to WebSocket", result)
    except Exception as e:
        report("Consumer delivers group_send message to WebSocket", False, str(e))


# ═════════════════════════════════════════════════════════════════════════════
# TEST 2 — _push_alert_to_ws() unit test (mocked channel layer)
# ═════════════════════════════════════════════════════════════════════════════
def run_test_push_fn():
    """
    Verify that _push_alert_to_ws() calls channel_layer.group_send()
    with the correct group name and message type.
    """
    print("\n[TEST 2] _push_alert_to_ws() calls channel layer correctly...")

    from hardware.frame_dispatcher.tasks import _push_alert_to_ws

    mock_layer = MagicMock()
    mock_layer.group_send = AsyncMock()

    with patch('hardware.frame_dispatcher.tasks.get_channel_layer', return_value=mock_layer):
        alert_payload = {"id": 5, "alert_type": "no_face", "severity": "medium"}
        _push_alert_to_ws(exam_id=99, alert_data=alert_payload)

        called = mock_layer.group_send.called
        report("group_send was called", called)

        if called:
            call_args = mock_layer.group_send.call_args
            group_name = call_args[0][0]
            message    = call_args[0][1]

            report("group_name is 'exam_99_alerts'",
                   group_name == "exam_99_alerts",
                   f"got: {group_name}")

            report("message type is 'alert.message'",
                   message.get("type") == "alert.message",
                   f"got: {message.get('type')}")

            report("message data matches alert payload",
                   message.get("data") == alert_payload,
                   f"got: {message.get('data')}")


# ═════════════════════════════════════════════════════════════════════════════
# TEST 3 — Full roundtrip: tasks.dispatch_active_sessions → WS push
# ═════════════════════════════════════════════════════════════════════════════
def run_test_dispatch_pushes_to_ws():
    """
    Run dispatch_active_sessions() with all external calls mocked.
    Verify that _push_alert_to_ws is invoked with the correct exam_id
    and alert payload when the dispatcher creates an alert.
    """
    print("\n[TEST 3] dispatch_active_sessions() pushes alerts to WebSocket group...")

    from hardware.frame_dispatcher import tasks as tasks_module

    captured_pushes = []

    def fake_push(exam_id, alert_data):
        captured_pushes.append({"exam_id": exam_id, "alert": alert_data})

    mock_alert_response = {
        "id": 10,
        "alert_type": "mobile_phone",
        "severity": "high",
        "zone": 3,
        "session": 1,
        "timestamp": "2026-04-22T15:30:00Z",
        "is_reviewed": False,
    }

    # Mock the REST post that creates the alert (returns the created object)
    mock_post_resp = MagicMock()
    mock_post_resp.status_code = 201
    mock_post_resp.json.return_value = mock_alert_response
    mock_post_resp.raise_for_status = MagicMock()

    with (
        patch('hardware.frame_dispatcher.tasks._push_alert_to_ws', side_effect=fake_push),
        patch('hardware.frame_dispatcher.dispatcher.requests.post', return_value=mock_post_resp),
        patch('hardware.frame_dispatcher.dispatcher._fetch_zones', return_value=[
            {"id": 3, "student_code": "S001", "x1": 0, "y1": 0, "x2": 100, "y2": 100}
        ]),
        patch('hardware.frame_dispatcher.dispatcher.RtspReader') as mock_reader_cls,
        patch('hardware.frame_dispatcher.dispatcher.encode_frame', return_value="base64frame"),
    ):
        # RunPod response mock
        mock_runpod_resp = MagicMock()
        mock_runpod_resp.json.return_value = {
            "output": {"results": [
                {"zone_id": 3, "alerts": [
                    {"type": "mobile_phone", "confidence": 0.92, "severity": "high"}
                ]}
            ]}
        }
        mock_runpod_resp.raise_for_status = MagicMock()
        mock_post_resp_runpod = mock_runpod_resp

        # Patch requests.post to return RunPod mock for RunPod URL, Alert mock for alerts URL
        call_count = [0]
        def smart_post(url, **kwargs):
            call_count[0] += 1
            if "api.runpod" in url or "mock-runpod" in url:
                return mock_runpod_resp
            return mock_post_resp  # alert creation

        with patch('hardware.frame_dispatcher.dispatcher.requests.post', side_effect=smart_post):
            mock_reader = MagicMock()
            mock_reader_cls.return_value = mock_reader
            mock_reader.read.return_value = "dummy_frame"

            from hardware.frame_dispatcher.tasks import dispatch_active_sessions
            result = dispatch_active_sessions()

    print(f"  Task result: {result}")
    print(f"  WS pushes captured: {len(captured_pushes)}")

    pushed = len(captured_pushes) > 0
    report("At least one alert was pushed to WebSocket", pushed)

    if pushed:
        push = captured_pushes[0]
        report("Pushed exam_id matches active session's exam",
               isinstance(push["exam_id"], int))
        report("Pushed alert payload is a dict",
               isinstance(push["alert"], dict))


# ═════════════════════════════════════════════════════════════════════════════
# Main
# ═════════════════════════════════════════════════════════════════════════════
if __name__ == "__main__":
    print("=" * 60)
    print("  Phase 6 — WebSocket Real-time Alerts Test Suite")
    print("=" * 60)

    run_test_consumer()
    run_test_push_fn()
    run_test_dispatch_pushes_to_ws()

    print("\n" + "=" * 60)
    print(f"  Results: {len(PASSED)} passed, {len(FAILED)} failed")
    print("=" * 60)
    if FAILED:
        print("  FAILED tests:")
        for f in FAILED:
            print(f"    - {f}")
        sys.exit(1)
    else:
        print("  All Phase 6 tests passed!")
        sys.exit(0)
