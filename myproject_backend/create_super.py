import os
import django

# إعداد بيئة دجانغو
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
django.setup()

from authentication.models import BaseUser


username = os.getenv("ADMIN_USERNAME")
email = os.getenv("ADMIN_EMAIL")
password = os.getenv("ADMIN_PASSWORD")

if all([username, email, password]):
    if not BaseUser.objects.filter(is_superuser=True).exists():
        BaseUser.objects.create_superuser(
            username=username,
            email=email,
            password=password,
            first_name="Admin",
            last_name="Admin"
        )
        print(f" Superuser '{username}' created successfully!")
    else:
        print(" Superuser already exists!")
else:
    print("⚠️ Skipping superuser creation: ADMIN_USERNAME, ADMIN_EMAIL, or ADMIN_PASSWORD not set in environment.")