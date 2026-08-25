from django.urls import path
from . import views

urlpatterns = [
    path("api/face/register/", views.register_face, name="face_register"),  # وقت التسجيل
    path("api/face/verify/",   views.verify_face,   name="face_verify"),    # وقت الامتحان
]