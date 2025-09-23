# celery.py (in your project root, same level as settings.py)
import os
from celery import Celery
from django.conf import settings

# Set the default Django settings module for the 'celery' program
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'your_project.settings')

app = Celery('your_project')

# Configure Celery using settings from Django settings.py
app.config_from_object('django.conf:settings', namespace='CELERY')

# Load task modules from all registered Django app configs
app.autodiscover_tasks()

# Periodic task configuration
app.conf.beat_schedule = {
    'update-appointments-status': {
        'task': 'appointments.tasks.update_appointments_to_in_progress',
        'schedule': 300.0,  # Run every 5 minutes (300 seconds)
    },
}

app.conf.timezone = 'UTC'