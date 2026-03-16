import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
django.setup()

from authentication.models import BaseUser

if not BaseUser.objects.filter(is_superuser=True).exists():
    BaseUser.objects.create_superuser(
        username="admin",
        email="admin@examguard.com",
        password="Admin1234!",
        first_name="Admin",
        last_name="Admin"
    )
    print("Superuser created!")
else:
    print("Superuser already exists!")