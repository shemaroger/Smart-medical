# myapp/tasks.py
from celery import shared_task
from medical_prescription.models import Appointment

@shared_task
def set_appointment_in_progress(appointment_id):
    appointment = Appointment.objects.get(id=appointment_id)
    appointment.status = 'in_progress'
    appointment.save()
