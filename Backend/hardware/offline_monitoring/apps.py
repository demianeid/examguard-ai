from django.apps import AppConfig

class OfflineMonitoringConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'hardware.offline_monitoring'
    label = 'offline_monitoring'