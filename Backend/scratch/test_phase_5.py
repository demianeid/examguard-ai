import os
import django
import sys
import unittest
from unittest.mock import patch, MagicMock

# 1. Setup Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
os.environ.setdefault('RUNPOD_ENDPOINT', 'http://mock-runpod')
django.setup()

from django.contrib.auth import get_user_model
from hardware.offline_monitoring.models import ExamHall, Camera, OfflineExam, StudentZone
from hardware.ai_detection.models import MonitoringSession, Alert
from hardware.frame_dispatcher.tasks import dispatch_active_sessions
from django.utils import timezone
from datetime import time, date

User = get_user_model()

def setup_test_data():
    """Creates a complete mock environment for testing Phase 5."""
    print("\n[1/3] Setting up test data...")
    
    # Create a test professor
    prof, _ = User.objects.get_or_create(username="test_prof", defaults={"email": "prof@test.com", "role": "professor"})
    
    # Create a hall
    hall, _ = ExamHall.objects.get_or_create(name="Lab 101", defaults={"building": "Tech Wing", "professor": prof})
    
    # Create a camera (using a public test stream)
    # This is a public BigBuckBunny RTSP stream for testing
    test_stream = "rtsp://rtspstream:7290072b22ec6cf89d0422998a46237a@zephyr.rtsp.stream/pattern"
    camera, _ = Camera.objects.get_or_create(
        name="Main Cam", 
        hall=hall, 
        defaults={"stream_url": test_stream, "status": "active"}
    )
    
    # Create an exam
    exam, _ = OfflineExam.objects.get_or_create(
        title="Midterm AI",
        defaults={
            "hall": hall,
            "professor": prof,
            "date": date.today(),
            "start_time": time(9, 0),
            "end_time": time(12, 0),
            "status": "active"
        }
    )
    
    # Create a monitoring session
    session, _ = MonitoringSession.objects.get_or_create(
        exam=exam,
        defaults={"status": "running"}
    )
    
    # Create a student zone (needed for the AI to have something to process)
    zone, _ = StudentZone.objects.get_or_create(
        hall=hall,
        camera=camera,
        student_code="STU001",
        defaults={
            "student_name": "John Doe",
            "x1": 100, "y1": 100, "x2": 400, "y2": 400
        }
    )
    
    print(f"DONE Data ready: Hall='{hall.name}', Cam='{camera.name}', SessionID={session.id}")
    return session, camera, zone

@patch('hardware.frame_dispatcher.dispatcher.requests.post')
@patch('hardware.frame_dispatcher.dispatcher._fetch_zones')
@patch('hardware.frame_dispatcher.dispatcher.RtspReader')
@patch('hardware.frame_dispatcher.dispatcher.encode_frame')
def run_test(mock_encode, mock_reader_class, mock_fetch, mock_post):
    """Executes the Phase 5 task with mocked external calls."""
    session, camera, zone = setup_test_data()
    
    print("\n[2/3] Mocking Frame Capture, RunPod & API...")
    
    # Mock RtspReader to return a dummy frame
    mock_reader = MagicMock()
    mock_reader_class.return_value = mock_reader
    mock_reader.read.return_value = "dummy_frame_data"
    mock_encode.return_value = "base64_encoded_frame"
    
    # Mock zones fetching (returns the zone we just created)
    mock_fetch.return_value = [{
        "id": zone.id,
        "student_code": zone.student_code,
        "x1": zone.x1, "y1": zone.y1, "x2": zone.x2, "y2": zone.y2
    }]
    
    # Mock RunPod response (simulating a phone detection)
    mock_post.return_value.status_code = 200
    mock_post.return_value.json.return_value = {
        "output": {
            "results": [
                {
                    "zone_id": zone.id,
                    "alerts": [
                        {"type": "mobile_phone", "confidence": 0.95, "severity": "high"}
                    ]
                }
            ]
        }
    }
    
    print("[3/3] Running dispatch_active_sessions task...")
    result = dispatch_active_sessions()
    print(f"\nTask Result: {result}")
    
    # Verify if an alert was created in the database
    # Note: dispatcher.py uses requests.post to create alerts. 
    # In a real environment, this creates a record. In this test, we check if the request was made.
    if mock_post.call_count >= 2: # One for RunPod, one for Alert API
        print("\nSUCCESS: The dispatcher captured a frame and sent it to RunPod!")
        print(f"SUCCESS: RunPod results were parsed and sent back to the Alert API.")
    else:
        print("\nFAILED: The dispatcher did not complete the full cycle.")
        print(f"Post calls made: {mock_post.call_count}")

if __name__ == "__main__":
    try:
        run_test()
    except Exception as e:
        print(f"\nERROR Error during test: {e}")
        import traceback
        traceback.print_exc()
