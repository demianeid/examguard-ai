import jwt
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.settings import api_settings
from .models import Professor, Student


class ProfessorJWTAuthentication(BaseAuthentication):
    def authenticate(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if not auth_header.startswith('Bearer '):
            return None

        token = auth_header.split(' ', 1)[1]

        try:
            payload = jwt.decode(
                token,
                api_settings.SIGNING_KEY,
                algorithms=[api_settings.ALGORITHM],
            )
        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed('Token has expired.')
        except jwt.InvalidTokenError:
            raise AuthenticationFailed('Invalid token.')

        user = self._get_user(payload)
        if user is None:
            raise AuthenticationFailed('User not found.')

        return (user, payload)

    def authenticate_header(self, request):
        return 'Bearer'

    def _get_user(self, payload):
        professor_id = payload.get('professor_id')
        if professor_id:
            try:
                return Professor.objects.get(professor_custom_id=professor_id)
            except Professor.DoesNotExist:
                return None

        user_id = payload.get('user_id')
        if user_id:
            try:
                return Student.objects.get(pk=user_id)
            except Student.DoesNotExist:
                return None

        return None
