from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('offline_monitoring', '0005_hallenrollment_seat_number'),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name='hallenrollment',
            unique_together=set(),
        ),
        migrations.AddField(
            model_name='hallenrollment',
            name='student_code',
            field=models.CharField(default='', max_length=100),
        ),
        migrations.AddField(
            model_name='hallenrollment',
            name='student_name',
            field=models.CharField(default='', max_length=255),
        ),
        migrations.RemoveField(
            model_name='hallenrollment',
            name='student',
        ),
        migrations.AlterUniqueTogether(
            name='hallenrollment',
            unique_together={('hall', 'student_code')},
        ),
    ]