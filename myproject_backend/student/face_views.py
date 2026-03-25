# student/face_views.py

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
import os
import base64
import json
import tempfile
import urllib.request
import traceback
from authentication.models import BaseUser


def _save_temp_image(image_base64):
    if "," in image_base64:
        image_base64 = image_base64.split(",")[1]
    img_data = base64.b64decode(image_base64)
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".jpg")
    tmp.write(img_data)
    tmp.close()
    return tmp.name


def _download_profile_image(url):
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".jpg")
    tmp.close()
    urllib.request.urlretrieve(url, tmp.name)
    return tmp.name


def _cleanup(*paths):
    for path in paths:
        try:
            if path and os.path.exists(path):
                os.unlink(path)
        except Exception:
            pass


@csrf_exempt
def face_verify(request):
    if request.method != "POST":
        return JsonResponse({"success": False, "message": "Method not allowed."}, status=405)

    profile_path = None
    input_path = None

    try:
        # Step 1: Parse request
        try:
            data = json.loads(request.body)
        except Exception:
            return JsonResponse({"success": False, "step": "parse", "message": "Invalid JSON body."}, status=400)

        student_id = data.get("student_id")
        image_base64 = data.get("image")

        if not student_id or not image_base64:
            return JsonResponse({"success": False, "step": "validation", "message": "Missing student_id or image."}, status=400)

        # Step 2: Get student
        try:
            student = BaseUser.objects.get(custom_id=student_id, role='student')
        except BaseUser.DoesNotExist:
            return JsonResponse({"success": False, "step": "student_lookup", "message": f"Student '{student_id}' not found."}, status=404)

        if not student.profile_image:
            return JsonResponse({"success": False, "step": "profile_image", "message": "Student has no profile image."}, status=400)

        # Step 3: Import DeepFace
        try:
            from deepface import DeepFace
        except Exception as e:
            return JsonResponse({
                "success": False,
                "step": "deepface_import",
                "message": f"DeepFace import failed: {str(e)}",
                "traceback": traceback.format_exc()
            }, status=500)

        # Step 4: Download profile image
        try:
            profile_path = _download_profile_image(student.profile_image.url)
        except Exception as e:
            return JsonResponse({
                "success": False,
                "step": "download_profile",
                "message": f"Failed to download profile image: {str(e)}",
                "traceback": traceback.format_exc()
            }, status=500)

        # Step 5: Save input image
        try:
            input_path = _save_temp_image(image_base64)
        except Exception as e:
            _cleanup(profile_path)
            return JsonResponse({
                "success": False,
                "step": "save_input",
                "message": f"Failed to decode input image: {str(e)}",
                "traceback": traceback.format_exc()
            }, status=500)

        # Step 6: Detect face in profile image
        try:
            DeepFace.extract_faces(img_path=profile_path, enforce_detection=True)
        except Exception as e:
            _cleanup(profile_path, input_path)
            return JsonResponse({
                "success": False,
                "verified": False,
                "step": "detect_profile_face",
                "message": "No face detected in your profile image. Please update your profile photo.",
                "detail": str(e)
            }, status=400)

        # Step 7: Detect face in live image
        try:
            DeepFace.extract_faces(img_path=input_path, enforce_detection=True)
        except Exception as e:
            _cleanup(profile_path, input_path)
            return JsonResponse({
                "success": False,
                "verified": False,
                "step": "detect_input_face",
                "message": "No face detected in your photo. Please take a clear photo of your face.",
                "detail": str(e)
            }, status=400)

        # Step 8: Verify faces
        try:
            result = DeepFace.verify(
                img1_path=profile_path,
                img2_path=input_path,
                model_name="Facenet",
                distance_metric="cosine",
                enforce_detection=True,
                threshold=0.50
            )
        except Exception as e:
            _cleanup(profile_path, input_path)
            return JsonResponse({
                "success": False,
                "step": "deepface_verify",
                "message": f"DeepFace.verify failed: {str(e)}",
                "traceback": traceback.format_exc()
            }, status=500)

        _cleanup(profile_path, input_path)

        is_verified = result["verified"]
        distance    = round(result["distance"], 4)
        threshold   = round(result["threshold"], 4)

        if is_verified:
            confidence = max(0.0, round((1 - distance / threshold) * 100, 1))
            return JsonResponse({
                "success": True,
                "verified": True,
                "message": f"Welcome, {student.get_full_name()}!",
                "student_name": student.get_full_name(),
                "confidence": confidence,
            })
        else:
            return JsonResponse({
                "success": True,
                "verified": False,
                "message": "Face does not match the student on record.",
                "confidence": 0,
            })

    except Exception as e:
        _cleanup(profile_path, input_path)
        return JsonResponse({
            "success": False,
            "step": "unexpected",
            "message": f"Unexpected error: {str(e)}",
            "traceback": traceback.format_exc()
        }, status=500)


@login_required
def get_students(request):
    if request.method != "GET":
        return JsonResponse({"success": False, "message": "Method not allowed."}, status=405)

    students = BaseUser.objects.filter(role='student').values(
        'custom_id', 'first_name', 'last_name'
    )

    result = [
        {"student_id": s["custom_id"], "name": f"{s['first_name']} {s['last_name']}"}
        for s in students
    ]

    return JsonResponse({"success": True, "students": result, "total": len(result)})