from django.db import migrations


def clear_local_image_paths(apps, schema_editor):
    """
    Clear any profile_image or identity_card paths that are NOT
    Cloudinary URLs (i.e. old local paths like 'profiles/p.jpg').
    After this migration, users will need to re-upload their photos
    which will then be saved correctly to Cloudinary.
    """
    BaseUser = apps.get_model('authentication', 'BaseUser')
    ProfessorProfile = apps.get_model('authentication', 'ProfessorProfile')

    # ─── Clear old local profile images ──────────────────────────
    updated_users = 0
    for user in BaseUser.objects.exclude(profile_image='').exclude(profile_image__isnull=True):
        image_name = user.profile_image.name if hasattr(user.profile_image, 'name') else str(user.profile_image)
        if image_name and not image_name.startswith('https://res.cloudinary.com'):
            user.profile_image = ''
            user.save(update_fields=['profile_image'])
            updated_users += 1

    print(f"\n✅ Cleared {updated_users} old local profile image(s).")

    # ─── Clear old local professor identity cards ─────────────────
    updated_professors = 0
    for profile in ProfessorProfile.objects.exclude(identity_card='').exclude(identity_card__isnull=True):
        card_name = profile.identity_card.name if hasattr(profile.identity_card, 'name') else str(profile.identity_card)
        if card_name and not card_name.startswith('https://res.cloudinary.com'):
            profile.identity_card = ''
            profile.save(update_fields=['identity_card'])
            updated_professors += 1

    print(f"✅ Cleared {updated_professors} old local identity card(s).")


def reverse_migration(apps, schema_editor):
    # Cannot restore deleted paths — this is intentionally irreversible
    pass


class Migration(migrations.Migration):

    dependencies = [
        # 🔴 IMPORTANT: Replace '0001_initial' with your LAST migration file name
        ('authentication', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(clear_local_image_paths, reverse_migration),
    ]