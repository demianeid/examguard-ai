from deepface import DeepFace
import tempfile, shutil

# حطي مسار أي صورة فيها وجه عندك
img_path = r"C:\Users\shrou\OneDrive\Desktop\photo_2026-02-24_03-29-32.jpg"  # ← غيري ده

# تيست 1: وجه موجود؟
faces = DeepFace.extract_faces(img_path, enforce_detection=True)
print('✅ Face detected!')

# تيست 2: المقارنة بنفس الصورة
result = DeepFace.verify(img_path, img_path, model_name='VGG-Face', enforce_detection=True)
print('✅ verified:', result['verified'])
print('✅ distance:', result['distance'])