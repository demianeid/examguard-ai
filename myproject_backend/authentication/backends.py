from django.contrib.auth.backends import ModelBackend
from .models import Student, Professor


class MultiUserBackend(ModelBackend):
    def authenticate(self, request, username=None, password=None, **kwargs):
        if not username:
            return None

        username = username.lower()

        # دور على الـ Student بالـ real_email
        try:
            student = Student.objects.get(real_email=username)
            if student.check_password(password):
                return student
        except Student.DoesNotExist:
            pass

        # دور على الـ Professor بالـ real_email
        try:
            professor = Professor.objects.get(real_email=username)
            if professor.check_password(password):
                return professor
        except Professor.DoesNotExist:
            pass

        return None

    def get_user(self, user_id):
        try:
            return Student.objects.get(pk=user_id)
        except Student.DoesNotExist:
            pass
        try:
            return Professor.objects.get(pk=user_id)
        except Professor.DoesNotExist:
            return None