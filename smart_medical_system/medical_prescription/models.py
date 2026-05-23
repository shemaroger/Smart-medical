# models.py
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator, MaxValueValidator
from decimal import Decimal
import uuid
from django.utils import timezone
from datetime import timedelta

class User(AbstractUser):
    USER_TYPES = (
        ('patient', 'Patient'),
        ('doctor', 'Doctor'),
        ('pharmacy', 'Pharmacy'),
        ('admin', 'Admin'),
    )
    
    LANGUAGE_CHOICES = (
        ('en', 'English'),
        ('fr', 'French'),
        ('rw', 'Kinyarwanda'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_type = models.CharField(max_length=20, choices=USER_TYPES)
    phone_number = models.CharField(max_length=15, unique=True)
    preferred_language = models.CharField(max_length=5, choices=LANGUAGE_CHOICES, default='en')
    is_phone_verified = models.BooleanField(default=True)
    hasProfile = models.BooleanField(default=False)
    location = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.username} ({self.user_type})"

class Hospital(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    address = models.TextField()
    phone = models.CharField(max_length=15)
    email = models.EmailField()
    location = models.CharField(max_length=255)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class Doctor(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True)
    license_number = models.CharField(max_length=50, unique=True)
    specialization = models.CharField(max_length=100)
    hospital = models.ForeignKey(Hospital,on_delete=models.CASCADE,related_name="doctors")     
    experience_years = models.PositiveIntegerField()
    is_verified = models.BooleanField(default=True)

    def __str__(self):
        return f"Dr. {self.user.first_name} {self.user.last_name}"

class Patient(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True)
    date_of_birth = models.DateField()
    medical_history = models.TextField(blank=True)
    emergency_contact = models.CharField(max_length=15)
    blood_group = models.CharField(max_length=5, blank=True)
    allergies = models.TextField(blank=True)

    def __str__(self):
        return f"{self.user.first_name} {self.user.last_name}"

class Pharmacy(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True)
    license_number = models.CharField(max_length=50, unique=True)
    pharmacy_name = models.CharField(max_length=255)
    address = models.TextField()
    location = models.CharField(max_length=255)
    is_verified = models.BooleanField(default=True)

    def __str__(self):
        return self.pharmacy_name
    


class Drug(models.Model):
    DRUG_CATEGORIES = (
        ('antibiotic', 'Antibiotic'),
        ('painkiller', 'Painkiller'),
        ('vitamin', 'Vitamin'),
        ('prescription', 'Prescription'),
        ('over_counter', 'Over The Counter'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    generic_name = models.CharField(max_length=255)
    category = models.CharField(max_length=20, choices=DRUG_CATEGORIES)
    description = models.TextField()
    dosage_form = models.CharField(max_length=50)  # tablet, syrup, injection
    manufacturer = models.CharField(max_length=255)
    requires_prescription = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.generic_name})"

class PharmacyInventory(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    pharmacy = models.ForeignKey(Pharmacy, on_delete=models.CASCADE, related_name='inventory')
    drug = models.ForeignKey(Drug, on_delete=models.CASCADE)
    quantity_available = models.PositiveIntegerField()
    price_per_unit = models.DecimalField(max_digits=10, decimal_places=2)
    expiry_date = models.DateField()
    low_stock_threshold = models.PositiveIntegerField(default=10)
    last_updated = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['pharmacy', 'drug']

    def __str__(self):
        return f"{self.drug.name} at {self.pharmacy.pharmacy_name}"

    @property
    def is_low_stock(self):
        return self.quantity_available <= self.low_stock_threshold

class Appointment(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='appointments')
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='appointments')
    hospital = models.ForeignKey(Hospital, on_delete=models.CASCADE)
    appointment_date = models.DateTimeField()
    reason = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Appointment: {self.patient} with {self.doctor} on {self.appointment_date}"

class Prescription(models.Model):
    STATUS_CHOICES = (
        ('active', 'Active'),
        ('filled', 'Filled'),
        ('expired', 'Expired'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    appointment = models.OneToOneField(Appointment, on_delete=models.CASCADE, related_name='prescription')
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='prescriptions')
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='prescriptions')
    diagnosis = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    notes = models.TextField(blank=True)
    is_ordered=models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Prescription for {self.patient} by {self.doctor}"

class PrescriptionItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    prescription = models.ForeignKey(Prescription, on_delete=models.CASCADE, related_name='items')
    drug = models.ForeignKey(Drug, on_delete=models.SET_NULL, null=True, blank=True)
    drug_name = models.CharField(max_length=255, null=True, blank=True, verbose_name="Drug Name")    
    quantity = models.PositiveIntegerField()
    dosage = models.CharField(max_length=255)  
    duration = models.CharField(max_length=100) 
    instructions = models.TextField(blank=True)

    def save(self, *args, **kwargs):
        # Only try to access drug.name if drug exists
        if self.drug is not None:  # Check if drug is not None
            if not self.drug_name:
                self.drug_name = self.drug.name
        super().save(*args, **kwargs)

    def __str__(self):
        # Handle case where drug is None
        if self.drug is not None:
            return f"{self.drug.name} - {self.quantity} units"
        return f"{self.drug_name or 'Unknown Drug'} - {self.quantity} units"
    
    
class PharmacyRecommendation(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    prescription = models.ForeignKey(Prescription, on_delete=models.CASCADE, related_name='recommendations')
    pharmacy = models.ForeignKey(Pharmacy, on_delete=models.CASCADE)
    availability_score = models.DecimalField(max_digits=5, decimal_places=2)  # percentage of drugs available
    total_cost = models.DecimalField(max_digits=10, decimal_places=2)
    distance_km = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['prescription', 'pharmacy']

    def __str__(self):
        return f"Recommendation: {self.pharmacy.pharmacy_name} for prescription {self.prescription.id}"

class Payment(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
    )
    
    PAYMENT_METHODS = (
        ('cash', 'Cash'),
        ('card', 'Card'),
        ('mobile_money', 'Mobile Money'),
        ('insurance', 'Insurance'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    prescription = models.ForeignKey(Prescription, on_delete=models.CASCADE, related_name='payments')
    pharmacy = models.ForeignKey(Pharmacy, on_delete=models.CASCADE)
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHODS)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    transaction_id = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Payment {self.transaction_id} - {self.amount}"

class MedicalReport(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='medical_reports')
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='medical_reports')
    prescription = models.ForeignKey(Prescription, on_delete=models.CASCADE, related_name='medical_reports')
    report_content = models.TextField()
    recommendations = models.TextField(blank=True)
    follow_up_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Medical Report for {self.patient} - {self.created_at.date()}"

class Notification(models.Model):
    NOTIFICATION_TYPES = (
        ('appointment_request', 'Appointment Request'),
        ('appointment_approved', 'Appointment Approved'),
        ('prescription_ready', 'Prescription Ready'),
        ('pharmacy_recommendation', 'Pharmacy Recommendation'),
        ('low_stock_alert', 'Low Stock Alert'),
        ('payment_confirmation', 'Payment Confirmation'),
        ('general', 'General'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=255)
    message = models.TextField()
    notification_type = models.CharField(max_length=30, choices=NOTIFICATION_TYPES)
    is_read = models.BooleanField(default=False)
    email_sent = models.BooleanField(default=False)
    sms_sent = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Notification for {self.recipient.username}: {self.title}"

class SystemSettings(models.Model):
    key = models.CharField(max_length=255, unique=True)
    value = models.TextField()
    description = models.TextField(blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.key}: {self.value}"
    

class Order(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    pharmacy = models.ForeignKey(Pharmacy,on_delete=models.CASCADE,related_name='orders')
    patient = models.ForeignKey(Patient,on_delete=models.CASCADE,related_name='patient_orders')
    doctor = models.ForeignKey(Doctor,on_delete=models.SET_NULL,related_name='doctor_orders',null=True,blank=True )
    prescription = models.ForeignKey(Prescription,on_delete=models.CASCADE,related_name='orders')
    status = models.CharField(max_length=20,choices=STATUS_CHOICES,default='pending')
    is_paid = models.BooleanField(default=False,verbose_name='Payment Status' )
    total_amount = models.DecimalField(max_digits=10,decimal_places=2,validators=[MinValueValidator(0)],default=0.00)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Order'
        verbose_name_plural = 'Orders'

    def __str__(self):
        return f"Order #{self.id} - {self.get_status_display()} - {self.patient}"


class OTPVerification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='otp_verifications')
    otp_code = models.CharField(max_length=6)
    purpose = models.CharField(max_length=20, default='login')  # login, password_reset, etc.
    is_verified = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    verified_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'otp_verification'
        ordering = ['-created_at']
    
    def save(self, *args, **kwargs):
        if not self.expires_at:
            # Set expiration to 5 minutes from creation
            self.expires_at = timezone.now() + timedelta(minutes=5)
        super().save(*args, **kwargs)
    
    def is_expired(self):
        return timezone.now() > self.expires_at
    
    def is_valid(self):
        return self.is_active and not self.is_verified and not self.is_expired()
    
    @classmethod
    def cleanup_expired(cls):
        """Remove expired OTP records"""
        expired_otps = cls.objects.filter(expires_at__lt=timezone.now())
        count = expired_otps.count()
        expired_otps.delete()
        return count
    
    def __str__(self):
        return f"OTP for {self.user.username} - {self.otp_code} ({self.purpose})"
