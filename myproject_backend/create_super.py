import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
django.setup()

from authentication.models import BaseUser


admin_user = os.getenv("ADMIN_USERNAME")
admin_email = os.getenv("ADMIN_EMAIL")
admin_pass = os.getenv("ADMIN_PASSWORD")

if all([admin_user, admin_email, admin_pass]):
    if not BaseUser.objects.filter(username=admin_user).exists():
        BaseUser.objects.create_superuser(
            username=admin_user,
            email=admin_email,
            password=admin_pass,
            first_name="Admin",
            last_name="Admin"
        )
        print(f"✅ Main Admin '{admin_user}' created!")
    else:
        print(f"ℹ️ Main Admin '{admin_user}' already exists.")
else:
    print("⚠️ Skipping main admin: Variables not set in Railway.")

my_user = os.getenv("new_user")
my_email = os.getenv("new_email")
my_pass = os.getenv("new_pass")

if not BaseUser.objects.filter(username=my_user).exists():
    BaseUser.objects.create_superuser(
        username=my_user,
        email=my_email,
        password=my_pass,
        first_name="sandi",
        last_name="noshi"
    )
    print(f"✅ Personal Admin '{my_user}' created!")
else:
    print(f"ℹ️ Personal Admin '{my_user}' already exists.")