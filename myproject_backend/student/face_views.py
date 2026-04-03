from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
import os
import base64
import json
import tempfile
import urllib.request
import numpy as np
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
        except:
            pass


def cosine_similarity(a, b):
    a = np.array(a)
    b = np.array(b)
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))


@csrf_exempt
def face_register(request):
    if request.method != "POST":
        return JsonResponse({"success": False}, status=405)

    from deepface import DeepFace

    data = json.loads(request.body)
    student_id = data.get("student_id")
    image_base64 = data.get("image")

    if not student_id or not image_base64:
        return JsonResponse({"success": False, "message": "Missing data"}, status=400)

    try:
        student = BaseUser.objects.get(custom_id=student_id, role='student')
    except BaseUser.DoesNotExist:
        return JsonResponse({"success": False, "message": "Student not found"}, status=404)

    input_path = None
    try:
        input_path = _save_temp_image(image_base64)
        embedding_obj = DeepFace.represent(
            img_path=input_path,
            model_name="Facenet",
            enforce_detection=True
        )
        embedding = embedding_obj[0]["embedding"]
        student.face_embedding = json.dumps(embedding)
        student.face_registered = True
        student.save(update_fields=["face_embedding", "face_registered"])
        return JsonResponse({"success": True, "message": "Face registered successfully"})
    except Exception as e:
        return JsonResponse({"success": False, "message": str(e)}, status=400)
    finally:
        _cleanup(input_path)


@csrf_exempt
def face_verify(request):
    if request.method != "POST":
        return JsonResponse({"success": False}, status=405)

    from deepface import DeepFace

    data = json.loads(request.body)
    student_id = data.get("student_id")
    image_base64 = data.get("image")

    if not student_id or not image_base64:
        return JsonResponse({"success": False, "message": "Missing data"}, status=400)

    try:
        student = BaseUser.objects.get(custom_id=student_id, role='student')
    except BaseUser.DoesNotExist:
        return JsonResponse({"success": False, "message": "Student not found"}, status=404)

    if not student.face_embedding:
        return JsonResponse({"success": False, "message": "Face not registered"}, status=400)

    input_path = None
    try:
        input_path = _save_temp_image(image_base64)
        embedding_obj = DeepFace.represent(
            img_path=input_path,
            model_name="Facenet",
            enforce_detection=True
        )
        new_embedding = embedding_obj[0]["embedding"]
        saved_embedding = json.loads(student.face_embedding)
        similarity = cosine_similarity(new_embedding, saved_embedding)
        threshold = 0.7

        if similarity >= threshold:
            return JsonResponse({
                "success": True,
                "verified": True,
                "student_name": student.get_full_name(),
                "confidence": round(similarity * 100, 2)
            })
        else:
            return JsonResponse({
                "success": True,
                "verified": False,
                "confidence": round(similarity * 100, 2)
            })
    except Exception as e:
        return JsonResponse({"success": False, "message": str(e)}, status=500)
    finally:
        _cleanup(input_path)


@login_required
def get_students(request):
    if request.method != "GET":
        return JsonResponse({"success": False}, status=405)

    students = BaseUser.objects.filter(role='student').values(
        'custom_id', 'first_name', 'last_name'
    )
    return JsonResponse({
        "success": True,
        "students": [
            {"student_id": s["custom_id"], "name": f"{s['first_name']} {s['last_name']}"}
            for s in students
        ]
    })