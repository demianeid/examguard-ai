"""
Django settings for backend project.
"""

from pathlib import Path
from datetime import timedelta
import os
from decouple import config

BASE_DIR = Path(__file__).resolve().parent.parent

# ─── Security ─────────────────────────────────────────────────────
SECRET_KEY    = config('SECRET_KEY')
DEBUG         = config('DEBUG', default=True, cast=bool)
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='localhost,127.0.0.1,.ngrok-free.dev,*', cast=lambda v: [s.strip() for s in v.split(',')])

# ─── CORS ─────────────────────────────────────────────────────────
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'origin',
    'x-csrftoken',
    'x-requested-with',
]

# ─── CSRF ─────────────────────────────────────────────────────────
CSRF_TRUSTED_ORIGINS = [
    "http://localhost:8000",
    "http://127.0.0.1:8000",
]

# ─── Apps ─────────────────────────────────────────────────────────
INSTALLED_APPS = [
    'daphne',                          # ← must be first for ASGI
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'channels',                        # Django Channels
    # My Apps
    'authentication',
    'instructors',
    'exam',
    'student',
    'hardware',
    'hardware.offline_monitoring',
    'hardware.ai_detection',
    'hardware.camera_stream',
    'hardware.frame_dispatcher',
    'face',
    'violation_Exam',              # Phase 1 — violation tracking
]

# ─── Middleware ───────────────────────────────────────────────────
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF     = 'backend.urls'
WSGI_APPLICATION = 'backend.wsgi.application'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

# ─── Database ─────────────────────────────────────────────────────
DATABASES = {
    'default': {
        'ENGINE':   config('DB_ENGINE',   default='django.db.backends.postgresql'),
        'NAME':     config('DB_NAME',     default='examguard_db'),
        'USER':     config('DB_USER',     default='postgres'),
        'PASSWORD': config('DB_PASSWORD', default=''),
        'HOST':     config('DB_HOST',     default='localhost'),
        'PORT':     config('DB_PORT',     default='5432'),
    }
}

# ─── Auth ─────────────────────────────────────────────────────────
AUTH_USER_MODEL = 'authentication.BaseUser'

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# ─── DRF ──────────────────────────────────────────────────────────
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
}

# ─── JWT ──────────────────────────────────────────────────────────
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME':    timedelta(hours=24),
    'REFRESH_TOKEN_LIFETIME':   timedelta(days=30),
    'ROTATE_REFRESH_TOKENS':    True,
    'BLACKLIST_AFTER_ROTATION': False,
}

# ─── Internationalization ─────────────────────────────────────────
LANGUAGE_CODE = 'en-us'
TIME_ZONE     = 'Africa/Cairo'
USE_I18N      = True
USE_TZ        = True

# ─── Static & Media ───────────────────────────────────────────────
STATIC_URL  = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

MEDIA_URL  = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ─── Email ────────────────────────────────────────────────────────
EMAIL_BACKEND       = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST          = config('EMAIL_HOST',          default='smtp.gmail.com')
EMAIL_PORT          = config('EMAIL_PORT',          default=587, cast=int)
EMAIL_USE_TLS       = config('EMAIL_USE_TLS',       default=True, cast=bool)
EMAIL_HOST_USER     = config('EMAIL_HOST_USER',     default='')
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD', default='')
DEFAULT_FROM_EMAIL  = config('DEFAULT_FROM_EMAIL',  default='ExamGuard <noreply@examguard.com>')

# ─── Celery & Redis ───────────────────────────────────────────────
CELERY_BROKER_URL      = config('CELERY_BROKER_URL',      default='redis://localhost:6379/0')
CELERY_RESULT_BACKEND  = config('CELERY_RESULT_BACKEND',  default='redis://localhost:6379/0')
CELERY_ACCEPT_CONTENT  = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE        = TIME_ZONE

# Phase 5 — Beat Schedule
CELERY_BEAT_SCHEDULE = {
    'dispatch-frames-every-2-seconds': {
        'task': 'hardware.frame_dispatcher.tasks.dispatch_active_sessions',
        'schedule': 2.0,  # Run every 2 seconds
    },
}

# ─── RunPod & Dispatcher Config ───────────────────────────────────
RUNPOD_ENDPOINT             = config('RUNPOD_ENDPOINT',             default='')
RUNPOD_FACE_ENDPOINT_URL    = config('RUNPOD_FACE_ENDPOINT_URL',    default=RUNPOD_ENDPOINT)
RUNPOD_API_KEY              = config('RUNPOD_API_KEY',              default='')
DJANGO_API_URL              = config('DJANGO_API_URL',              default='http://localhost:8000/api')
DJANGO_API_TOKEN            = config('DJANGO_API_TOKEN',            default='')
ALERT_CONFIDENCE_THRESHOLD  = config('ALERT_CONFIDENCE_THRESHOLD',  default=0.6, cast=float)
FRAME_JPEG_QUALITY          = config('FRAME_JPEG_QUALITY',          default=85,  cast=int)
FRAME_SAMPLE_RATE           = config('FRAME_SAMPLE_RATE',           default=2,   cast=int)

# ─── Django Channels (Phase 6) ────────────────────────────────────
ASGI_APPLICATION = 'backend.asgi.application'

CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            'hosts': [config('REDIS_URL', default='redis://localhost:6379/1')],
        },
    },
}

