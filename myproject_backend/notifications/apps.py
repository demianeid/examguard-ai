import os
from django.apps import AppConfig

class NotificationsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'notifications'

    def ready(self):
        import notifications.signals
        
        # Only start the scheduler in the main process, not in the auto-reloader worker
        if os.environ.get('RUN_MAIN', None) == 'true' or os.environ.get('SERVER_GATEWAY'):
            from apscheduler.schedulers.background import BackgroundScheduler
            from notifications.tasks import check_upcoming_exams, check_completed_exams
            
            scheduler = BackgroundScheduler()
            # Run every 1 minute
            scheduler.add_job(check_upcoming_exams, 'interval', minutes=1, id='check_exams_job', replace_existing=True)
            scheduler.add_job(check_completed_exams, 'interval', minutes=1, id='check_completed_exams_job', replace_existing=True)
            scheduler.start()

