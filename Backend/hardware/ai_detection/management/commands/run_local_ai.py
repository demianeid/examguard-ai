import time
import logging
from django.core.management.base import BaseCommand
from hardware.frame_dispatcher.tasks import dispatch_active_sessions

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Runs the local AI inference loop continuously without needing Celery or Redis'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS("Starting Local AI Inference Loop..."))
        self.stdout.write(self.style.WARNING("This completely bypasses Celery and Redis!"))
        
        while True:
            try:
                # Runs the exact same logic Celery Beat used to run every 2 seconds
                result = dispatch_active_sessions()
                if result != "No active sessions":
                    self.stdout.write(self.style.SUCCESS(f"Cycle Complete: {result}"))
            except Exception as e:
                self.stderr.write(self.style.ERROR(f"Error in AI Loop: {e}"))
            
            time.sleep(0.01)
