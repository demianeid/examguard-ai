# student/face_views.py

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import os
import base64
import json
import tempfile
import urllib.request
from authentication.models import BaseUser


@csrf_exempt
def face_register(request):
    if request.method != "POST":
        return JsonResponse({"success": False, "message": "Method not allowed."}, status=405)

    from deepface import DeepFace  # ← lazy import هنا

    data = json.loads(request.body)
    student_id = data.get("student_id")
    image_base64 = data.get("image")

    # ... باقي الكود زي ما هو

    if not student_id or not image_base64:
        return JsonResponse({"success": False, "message": "Missing required fields."}, status=400)

    try:
        student = BaseUser.objects.get(custom_id=student_id, role='student')
    except BaseUser.DoesNotExist:
        return JsonResponse({"success": False, "message": "Student not found."}, status=404)

    if not student.profile_image:
        return JsonResponse({"success": False, "message": "Student has no profile image."}, status=400)

    try:
        # بنجيب صورة البروفايل من Cloudinary
        profile_url = student.profile_image.url
        profile_tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".jpg")
        urllib.request.urlretrieve(profile_url, profile_tmp.name)

        # بنحول الصورة الجديدة من base64
        if "," in image_base64:
            image_base64 = image_base64.split(",")[1]
        img_data = base64.b64decode(image_base64)
        input_tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".jpg")
        input_tmp.write(img_data)
        input_tmp.close()

        # بنتأكد إن صورة البروفايل فيها وجه
        try:
            DeepFace.extract_faces(img_path=profile_tmp.name, enforce_detection=True)
        except Exception:
            os.unlink(profile_tmp.name)
            os.unlink(input_tmp.name)
            return JsonResponse({"success": False, "message": "No face detected in your profile image. Please update your profile photo."}, status=400)

        # بنتأكد إن الصورة الجديدة فيها وجه
        try:
            DeepFace.extract_faces(img_path=input_tmp.name, enforce_detection=True)
        except Exception:
            os.unlink(profile_tmp.name)
            os.unlink(input_tmp.name)
            return JsonResponse({"success": False, "message": "No face detected in your photo. Please take a clear photo of your face."}, status=400)

        os.unlink(profile_tmp.name)
        os.unlink(input_tmp.name)

        return JsonResponse({
            "success": True,
            "message": f"Student {student.get_full_name()} registered successfully."
        })

    except Exception as e:
        if 'profile_tmp' in locals() and os.path.exists(profile_tmp.name):
            os.unlink(profile_tmp.name)
        if 'input_tmp' in locals() and os.path.exists(input_tmp.name):
            os.unlink(input_tmp.name)
        return JsonResponse({"success": False, "message": f"Error: {str(e)}"}, status=400)


@csrf_exempt
def face_verify(request):
    if request.method != "POST":
        return JsonResponse({"success": False, "message": "Method not allowed."}, status=405)
    from deepface import DeepFace
    data = json.loads(request.body)
    student_id = data.get("student_id")
    image_base64 = data.get("image")

    if not student_id or not image_base64:
        return JsonResponse({"success": False, "message": "Missing required fields."}, status=400)

    try:
        student = BaseUser.objects.get(custom_id=student_id, role='student')
    except BaseUser.DoesNotExist:
        return JsonResponse({"success": False, "message": "Student not found."}, status=404)

    if not student.profile_image:
        return JsonResponse({"success": False, "message": "Student has no profile image."}, status=400)

    try:
        # بنجيب صورة البروفايل من Cloudinary
        profile_url = student.profile_image.url
        profile_tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".jpg")
        urllib.request.urlretrieve(profile_url, profile_tmp.name)

        # بنحول الصورة الجديدة من base64
        if "," in image_base64:
            image_base64 = image_base64.split(",")[1]
        img_data = base64.b64decode(image_base64)
        input_tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".jpg")
        input_tmp.write(img_data)
        input_tmp.close()

        # بنقارن الوجهين
        result = DeepFace.verify(
            img1_path=profile_tmp.name,
            img2_path=input_tmp.name,
            model_name="Facenet",
            distance_metric="cosine",
            enforce_detection=True,
            threshold=0.50
        )

        os.unlink(profile_tmp.name)
        os.unlink(input_tmp.name)

        is_verified = result["verified"]
        distance = round(result["distance"], 4)
        threshold = round(result["threshold"], 4)

        if is_verified:
            return JsonResponse({
                "success": True,
                "verified": True,
                "message": f"Welcome, {student.get_full_name()}!",
                "student_name": student.get_full_name(),
                "confidence": round((1 - distance / threshold) * 100, 1)
            })
        else:
            return JsonResponse({
                "success": True,
                "verified": False,
                "message": "Face does not match the student on record.",
                "confidence": 0
            })

    except Exception as e:
        if 'profile_tmp' in locals() and os.path.exists(profile_tmp.name):
            os.unlink(profile_tmp.name)
        if 'input_tmp' in locals() and os.path.exists(input_tmp.name):
            os.unlink(input_tmp.name)
        return JsonResponse({"success": False, "message": f"Comparison error: {str(e)}"}, status=500)


@csrf_exempt
def get_students(request):
    if request.method != "GET":
        return JsonResponse({"success": False, "message": "Method not allowed."}, status=405)

    students = BaseUser.objects.filter(role='student').values(
        'custom_id', 'first_name', 'last_name'
    )

    result = [
        {
            "student_id": s["custom_id"],
            "name": f"{s['first_name']} {s['last_name']}"
        }
        for s in students
    ]

    return JsonResponse({"success": True, "students": result, "total": len(result)})