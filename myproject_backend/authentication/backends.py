from django.contrib.auth.backends import ModelBackend
from .models import Student, Professor

class MultiUserBackend(ModelBackend):
    def authenticate(self, request, username=None, password=None, **kwargs):
        if not username:
            return None

        username = username.lower()

        if username.endswith('@examguard.ed'):
            try:
                user = Student.objects.get(email=username)
                if user.check_password(password):
                    return user
            except Student.DoesNotExist:
                return None

        else:
            try:
                user = Professor.objects.get(real_email=username)
                if user.check_password(password):
                    return user
            except (Professor.DoesNotExist, AttributeError):
                return None

        return None

    def get_user(self, user_id):
        try:
            return Student.objects.get(pk=user_id)
        except Student.DoesNotExist:
            try:
                return Professor.objects.get(pk=user_id)
            except Professor.DoesNotExist:
                return None