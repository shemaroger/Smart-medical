# admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from .models import *

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'user_type', 'is_phone_verified', 'is_active')
    list_filter = ('user_type', 'is_phone_verified', 'is_active', 'preferred_language')
    search_fields = ('username', 'email', 'first_name', 'last_name', 'phone_number')
    ordering = ('-date_joined',)
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Additional Info', {
            'fields': ('user_type', 'phone_number', 'preferred_language', 'is_phone_verified', 'location')
        }),
    )
    
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Additional Info', {
            'fields': ('user_type', 'phone_number', 'preferred_language', 'location')
        }),
    )

@admin.register(Hospital)
class HospitalAdmin(admin.ModelAdmin):
    list_display = ('name', 'location', 'phone', 'email', 'is_active', 'created_at')
    list_filter = ('is_active', 'location', 'created_at')
    search_fields = ('name', 'location', 'phone', 'email')
    readonly_fields = ('id', 'created_at')

@admin.register(Doctor)
class DoctorAdmin(admin.ModelAdmin):
    list_display = ('get_full_name', 'license_number', 'specialization', 'hospital', 'is_verified', 'experience_years')
    list_filter = ('is_verified', 'specialization', 'hospital')
    search_fields = ('user__first_name', 'user__last_name', 'license_number', 'specialization')
    readonly_fields = ('user',)
    
    def get_full_name(self, obj):
        return f"Dr. {obj.user.first_name} {obj.user.last_name}"
    get_full_name.short_description = 'Doctor Name'

@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = ('get_full_name', 'date_of_birth', 'blood_group', 'emergency_contact')
    search_fields = ('user__first_name', 'user__last_name', 'blood_group')
    readonly_fields = ('user',)
    
    def get_full_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}"
    get_full_name.short_description = 'Patient Name'

@admin.register(Pharmacy)
class PharmacyAdmin(admin.ModelAdmin):
    list_display = ('pharmacy_name', 'get_owner_name', 'license_number', 'location', 'is_verified')
    list_filter = ('is_verified', 'location')
    search_fields = ('pharmacy_name', 'license_number', 'user__first_name', 'user__last_name')
    readonly_fields = ('user',)
    
    def get_owner_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}"
    get_owner_name.short_description = 'Owner Name'

@admin.register(Drug)
class DrugAdmin(admin.ModelAdmin):
    list_display = ('name', 'generic_name', 'category', 'dosage_form', 'manufacturer', 'requires_prescription')
    list_filter = ('category', 'dosage_form', 'requires_prescription', 'manufacturer')
    search_fields = ('name', 'generic_name', 'manufacturer')
    readonly_fields = ('id', 'created_at')

class PharmacyInventoryAdmin(admin.ModelAdmin):
    list_display = ('drug', 'pharmacy', 'quantity_available', 'price_per_unit', 'is_low_stock', 'expiry_date')
    list_filter = ('pharmacy', 'drug__category', 'expiry_date')
    search_fields = ('drug__name', 'pharmacy__pharmacy_name')
    readonly_fields = ('id', 'last_updated', 'is_low_stock')
    
    def is_low_stock(self, obj):
        if obj.is_low_stock:
            return format_html('<span style="color: red;">Yes</span>')
        return format_html('<span style="color: green;">No</span>')
    is_low_stock.short_description = 'Low Stock'

admin.site.register(PharmacyInventory, PharmacyInventoryAdmin)

@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ('get_patient_name', 'get_doctor_name', 'hospital', 'appointment_date', 'status', 'created_at')
    list_filter = ('status', 'hospital', 'appointment_date', 'created_at')
    search_fields = ('patient__user__first_name', 'patient__user__last_name', 
                    'doctor__user__first_name', 'doctor__user__last_name')
    readonly_fields = ('id', 'created_at', 'updated_at')
    
    def get_patient_name(self, obj):
        return f"{obj.patient.user.first_name} {obj.patient.user.last_name}"
    get_patient_name.short_description = 'Patient'
    
    def get_doctor_name(self, obj):
        return f"Dr. {obj.doctor.user.first_name} {obj.doctor.user.last_name}"
    get_doctor_name.short_description = 'Doctor'

class PrescriptionItemInline(admin.TabularInline):
    model = PrescriptionItem
    extra = 1
    readonly_fields = ('id',)

@admin.register(Prescription)
class PrescriptionAdmin(admin.ModelAdmin):
    list_display = ('get_patient_name', 'get_doctor_name', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('patient__user__first_name', 'patient__user__last_name', 
                    'doctor__user__first_name', 'doctor__user__last_name', 'diagnosis')
    readonly_fields = ('id', 'created_at', 'updated_at')
    inlines = [PrescriptionItemInline]
    
    def get_patient_name(self, obj):
        return f"{obj.patient.user.first_name} {obj.patient.user.last_name}"
    get_patient_name.short_description = 'Patient'
    
    def get_doctor_name(self, obj):
        return f"Dr. {obj.doctor.user.first_name} {obj.doctor.user.last_name}"
    get_doctor_name.short_description = 'Doctor'

@admin.register(PrescriptionItem)
class PrescriptionItemAdmin(admin.ModelAdmin):
    list_display = ('prescription', 'drug', 'quantity', 'dosage', 'duration')
    list_filter = ('drug__category', 'prescription__created_at')
    search_fields = ('drug__name', 'prescription__patient__user__first_name', 
                    'prescription__patient__user__last_name')
    readonly_fields = ('id',)

@admin.register(PharmacyRecommendation)
class PharmacyRecommendationAdmin(admin.ModelAdmin):
    list_display = ('prescription', 'pharmacy', 'availability_score', 'total_cost', 'distance_km', 'created_at')
    list_filter = ('pharmacy', 'created_at')
    search_fields = ('prescription__patient__user__first_name', 'prescription__patient__user__last_name',
                    'pharmacy__pharmacy_name')
    readonly_fields = ('id', 'created_at')

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('transaction_id', 'get_patient_name', 'pharmacy', 'amount', 'payment_method', 'status', 'created_at')
    list_filter = ('status', 'payment_method', 'created_at')
    search_fields = ('transaction_id', 'patient__user__first_name', 'patient__user__last_name',
                    'pharmacy__pharmacy_name')
    readonly_fields = ('id', 'transaction_id', 'created_at', 'updated_at')
    
    def get_patient_name(self, obj):
        return f"{obj.patient.user.first_name} {obj.patient.user.last_name}"
    get_patient_name.short_description = 'Patient'

@admin.register(MedicalReport)
class MedicalReportAdmin(admin.ModelAdmin):
    list_display = ('get_patient_name', 'get_doctor_name', 'follow_up_date', 'created_at')
    list_filter = ('follow_up_date', 'created_at')
    search_fields = ('patient__user__first_name', 'patient__user__last_name',
                    'doctor__user__first_name', 'doctor__user__last_name', 'report_content')
    readonly_fields = ('id', 'created_at', 'updated_at')
    
    def get_patient_name(self, obj):
        return f"{obj.patient.user.first_name} {obj.patient.user.last_name}"
    get_patient_name.short_description = 'Patient'
    
    def get_doctor_name(self, obj):
        return f"Dr. {obj.doctor.user.first_name} {obj.doctor.user.last_name}"
    get_doctor_name.short_description = 'Doctor'

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('recipient', 'title', 'notification_type', 'is_read', 'email_sent', 'sms_sent', 'created_at')
    list_filter = ('notification_type', 'is_read', 'email_sent', 'sms_sent', 'created_at')
    search_fields = ('recipient__username', 'recipient__email', 'title', 'message')
    readonly_fields = ('id', 'created_at')

@admin.register(SystemSettings)
class SystemSettingsAdmin(admin.ModelAdmin):
    list_display = ('key', 'value', 'updated_at')
    search_fields = ('key', 'value', 'description')
    readonly_fields = ('updated_at',)

# Customize admin site
admin.site.site_header = "Smart Medical Prescription Admin"
admin.site.site_title = "Smart Medical Admin"
admin.site.index_title = "Welcome to Smart Medical Prescription Administration"