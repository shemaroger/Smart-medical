# myapp/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from medical_prescription.models import Appointment
from medical_prescription.tasks import set_appointment_in_progress

@receiver(post_save, sender=Appointment)
def schedule_appointment_status_update(sender, instance, created, **kwargs):
    if instance.status == 'approved' and not created:
        # Schedule a task to run at the appointment time
        print("In changed")
        set_appointment_in_progress.apply_async(
            args=[instance.id],
            eta=instance.appointment_date
        )
