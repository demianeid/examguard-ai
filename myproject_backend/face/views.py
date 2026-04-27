import os
import json
import base64
import tempfile
import traceback

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

from authentication.models import StudentProfile   # ← بدل StudentFaceEmbedding
from .face_service import get_embedding, compare_embeddings

# ─── CLIP Model (lazy load) ───────────────────────────────────────────────────
_clip_model     = None
_clip_processor = None


def _load_clip():
    global _clip_model, _clip_processor
    if _clip_model is None:
        from transformers import CLIPProcessor, CLIPModel
        _clip_model     = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
        _clip_processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
    return _clip_model, _clip_processor


# ─── Helper: base64 → temp file ──────────────────────────────────────────────
def base64_to_tempfile(b64_string: str, suffix=".jpg") -> str:
    img_data = base64.b64decode(b64_string)
    tmp      = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    tmp.write(img_data)
    tmp.close()
    return tmp.name


# ─── Helper: ID Card Check via CLIP ──────────────────────────────────────────
def is_id_card(image_path: str) -> bool:
    try:
        from PIL import Image
        import torch

        model, processor = _load_clip()
        image = Image.open(image_path).convert("RGB")

        labels = [
            "Egyptian national ID card with Arabic text",
            "identity card document with photo and text",
            "a selfie photo",
            "a random image",
            "a landscape photo",
        ]

        inputs = processor(text=labels, images=image, return_tensors="pt", padding=True)

        with torch.no_grad():
            outputs = model(**inputs)

        probs    = outputs.logits_per_image.softmax(dim=1)[0]
        id_score = probs[0].item() + probs[1].item()

        print(f"DEBUG CLIP scores: { {labels[i]: round(probs[i].item(), 3) for i in range(len(labels))} }")

        return id_score > 0.3

    except Exception as e:
        print(f"CLIP check failed: {e}")
        return True   # fail-open لو CLIP مش شغال


# ─── VIEW 1: register_face ────────────────────────────────────────────────────
# بيتبعت بعد التسجيل مباشرة من الـ frontend
# لو student_id = 0  →  validation فقط (التحقق إن في وش) بدون حفظ
# لو student_id > 0  →  validation + حفظ الـ embedding في StudentProfile
@csrf_exempt
@require_POST
def register_face(request):
    try:
        body       = json.loads(request.body)
        print("DEBUG body keys:", body.keys())
        print("student_id:", body.get("student_id"))

        student_id = body.get("student_id")
        b64_image  = body.get("id_card_image")

        if student_id is None or not b64_image:
            return JsonResponse(
                {"error": "student_id and id_card_image are required."}, status=400
            )

        tmp_path = base64_to_tempfile(b64_image)

        try:
            # ── Step 1: National ID Check ─────────────────────────────────────
            if not is_id_card(tmp_path):
                return JsonResponse(
                    {
                        "step":    "National ID Check",
                        "error":   "Invalid image uploaded.",
                        "details": "The image you uploaded does not appear to be a National ID card. "
                                   "Please upload a clear photo of the front side of your National ID card.",
                    },
                    status=400,
                )

            # ── Step 2: Face Detection ────────────────────────────────────────
            try:
                embedding = get_embedding(tmp_path)
            except ValueError:
                return JsonResponse(
                    {
                        "step":    "Face Detection",
                        "error":   "No face detected in the uploaded image.",
                        "details": "Please upload a clear front-side National ID card where your face is fully visible.",
                    },
                    status=400,
                )

        finally:
            os.unlink(tmp_path)

        # ── Step 3: Save Embedding (only for real students, not dummy validation) ──
        # الـ frontend بيبعت student_id=0 وقت الـ pre-validation
        # وبيبعت الـ id الحقيقي بعد التسجيل
        if int(student_id) > 0:
            try:
                profile = StudentProfile.objects.get(user_id=student_id)
                profile.face_embedding = json.dumps(embedding)
                profile.save()
            except StudentProfile.DoesNotExist:
                return JsonResponse(
                    {"error": f"StudentProfile not found for user_id={student_id}."},
                    status=404,
                )

        return JsonResponse({
            "success":    True,
            "message":    "Face embedding saved." if int(student_id) > 0 else "Face validated (not saved).",
            "student_id": student_id,
        })

    except Exception as e:
        traceback.print_exc()
        return JsonResponse({"error": str(e)}, status=500)


# ─── VIEW 2: verify_face ──────────────────────────────────────────────────────
# بيتبعت وقت الامتحان للتحقق من هوية الطالب
@csrf_exempt
@require_POST
def verify_face(request):
    try:
        body       = json.loads(request.body)
        student_id = body.get("student_id")
        b64_image  = body.get("live_image")

        if not student_id or not b64_image:
            return JsonResponse(
                {"error": "student_id and live_image are required."}, status=400
            )

        try:
            profile = StudentProfile.objects.get(user__custom_id=student_id)
        except StudentProfile.DoesNotExist:
            return JsonResponse(
                {"error": f"No student profile found for custom_id={student_id}."}, status=404
            )

        if not profile.face_embedding:
            return JsonResponse(
                {"error": "No face registered for this student."}, status=404
            )

        stored_embedding = json.loads(profile.face_embedding)

        tmp_path = base64_to_tempfile(b64_image)
        try:
            live_embedding = get_embedding(tmp_path)
        except ValueError as e:
            return JsonResponse({"error": str(e)}, status=400)
        finally:
            os.unlink(tmp_path)

        similarity = compare_embeddings(stored_embedding, live_embedding)

        THRESHOLD = 0.35
        is_match  = similarity >= THRESHOLD

        return JsonResponse({
            "success":    True,
            "is_match":   is_match,
            "confidence": round(similarity, 4),
            "threshold":  THRESHOLD,
            "message":    "Identity verified ✓" if is_match else "Face does not match ✗",
        })

    except Exception as e:
        traceback.print_exc()
        return JsonResponse({"error": str(e)}, status=500)