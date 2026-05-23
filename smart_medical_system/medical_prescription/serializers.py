# serializers.py
from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import *

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password_confirm', 'first_name', 
                 'last_name', 'phone_number', 'user_type', 'preferred_language', 'location']

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Passwords don't match")
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()
        return user

from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import check_password

User = get_user_model()

class UserLoginSerializer(serializers.Serializer):
    email = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')

        if email and password:
            try:
                user = User.objects.get(email=email)
                if not user.is_active:
                    raise serializers.ValidationError('User account is disabled')

                # Manually check the password
                if not check_password(password, user.password):
                    raise serializers.ValidationError('Invalid credentials')

                attrs['user'] = user
            except User.DoesNotExist:
                raise serializers.ValidationError('Invalid credentials')
        else:
            raise serializers.ValidationError('Must provide email and password')

        return attrs



class UserSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 
                 'phone_number', 'user_type', 'preferred_language', 'location', 
                 'is_phone_verified', 'created_at','hasProfile','is_active']
        read_only_fields = ['id', 'created_at','is_active']

class HospitalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Hospital
        fields = ['id','name', 'address', 'phone', 'email', 'location', 
                 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']

class DoctorSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    hospital= HospitalSerializer(read_only=True)
    
    class Meta:
        model = Doctor
        fields = ['user', 'license_number','specialization', 'hospital', 
                 'experience_years', 'is_verified']

class DoctorCreateSerializer(serializers.ModelSerializer):
    hospital = serializers.PrimaryKeyRelatedField(queryset=Hospital.objects.all())

    class Meta:
        model = Doctor
        fields = [
            'license_number', 
            'specialization', 
            'hospital', 
            'experience_years'
        ]

    def create(self, validated_data):
        return super().create(validated_data)

class PatientSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = Patient
        fields = ['user', 'date_of_birth', 'medical_history', 'emergency_contact', 
                 'blood_group', 'allergies']

class PatientCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Patient
        fields = ['date_of_birth', 'medical_history', 'emergency_contact', 
                 'blood_group', 'allergies']

class PharmacySerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = Pharmacy
        fields = ['user', 'license_number', 'pharmacy_name', 'address', 
                 'location', 'is_verified']

class PharmacyCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pharmacy
        fields = ['license_number', 'pharmacy_name', 'address', 'location']

class DrugSerializer(serializers.ModelSerializer):
    class Meta:
        model = Drug
        fields = ['id', 'name', 'generic_name', 'category', 'description', 
                 'dosage_form', 'manufacturer', 'requires_prescription', 'created_at']
        read_only_fields = ['id', 'created_at']

class PharmacyInventorySerializer(serializers.ModelSerializer):
    drug = DrugSerializer(read_only=True)
    pharmacy = PharmacySerializer(read_only=True)
    is_low_stock = serializers.ReadOnlyField()
    
    class Meta:
        model = PharmacyInventory
        fields = ['id', 'pharmacy', 'drug', 'quantity_available', 'price_per_unit', 
                 'expiry_date', 'low_stock_threshold', 'is_low_stock', 'last_updated']
        read_only_fields = ['id', 'last_updated']

class PharmacyInventoryCreateSerializer(serializers.ModelSerializer):
    drug_id = serializers.UUIDField()
    
    class Meta:
        model = PharmacyInventory
        fields = ['drug_id', 'quantity_available', 'price_per_unit', 
                 'expiry_date', 'low_stock_threshold']

    def create(self, validated_data):
        drug_id = validated_data.pop('drug_id')
        drug = Drug.objects.get(id=drug_id)
        validated_data['drug'] = drug
        return super().create(validated_data)

class AppointmentSerializer(serializers.ModelSerializer):
    patient = PatientSerializer(read_only=True)
    doctor = DoctorSerializer(read_only=True)
    hospital = HospitalSerializer(read_only=True)
    
    class Meta:
        model = Appointment
        fields = ['id','patient', 'doctor', 'hospital', 'appointment_date', 
                 'reason', 'status', 'notes', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

class AppointmentCreateSerializer(serializers.ModelSerializer):
    doctor_id = serializers.UUIDField()
    hospital_id = serializers.UUIDField()
    
    class Meta:
        model = Appointment
        fields = ['doctor_id', 'hospital_id', 'appointment_date', 'reason']

    def create(self, validated_data):
        doctor_id = validated_data.pop('doctor_id')
        hospital_id = validated_data.pop('hospital_id')
        doctor = Doctor.objects.get(user_id=doctor_id)
        hospital = Hospital.objects.get(id=hospital_id)
        validated_data['doctor'] = doctor
        validated_data['hospital'] = hospital
        return super().create(validated_data)

class PrescriptionItemSerializer(serializers.ModelSerializer):
    drug = DrugSerializer(read_only=True)
    
    class Meta:
        model = PrescriptionItem
        fields = ['id', 'drug','drug_name', 'quantity', 'dosage', 'duration', 'instructions']
        read_only_fields = ['id']

# serializers.py

class PrescriptionItemCreateSerializer(serializers.ModelSerializer):
    drug_id = serializers.UUIDField(required=False, allow_null=True)
    
    class Meta:
        model = PrescriptionItem
        fields = ['drug_id', 'drug_name', 'quantity', 'dosage', 'duration', 'instructions']
    
    def validate(self, data):
        # Either drug_id or drug_name must be provided
        if not data.get('drug_id') and not data.get('drug_name'):
            raise serializers.ValidationError("Either drug_id or drug_name is required")
        return data
    
    def create(self, validated_data):
        drug_id = validated_data.pop('drug_id', None)
        drug_name = validated_data.pop('drug_name', '')
        
        # Handle drug_id if provided
        if drug_id:
            try:
                from .models import Drug
                drug = Drug.objects.get(id=drug_id)
                validated_data['drug'] = drug
                # Auto-populate drug_name from the drug if not provided
                if not drug_name:
                    validated_data['drug_name'] = drug.name
                else:
                    validated_data['drug_name'] = drug_name
            except Drug.DoesNotExist:
                raise serializers.ValidationError({"drug_id": "Drug not found"})
        else:
            # Manual entry - only drug_name is provided, drug remains None
            validated_data['drug'] = None
            validated_data['drug_name'] = drug_name
        
        return super().create(validated_data)

class PrescriptionSerializer(serializers.ModelSerializer):
    patient = PatientSerializer(read_only=True)
    doctor = DoctorSerializer(read_only=True)
    appointment = AppointmentSerializer(read_only=True)
    items = PrescriptionItemSerializer(many=True, read_only=True)
    
    class Meta:
        model = Prescription
        fields = ['id', 'appointment', 'patient', 'doctor', 'diagnosis', 
                 'status', 'notes', 'items', 'created_at', 'updated_at','is_ordered']
        read_only_fields = ['id', 'created_at', 'updated_at','is_ordered']

class PrescriptionCreateSerializer(serializers.ModelSerializer):
    appointment_id = serializers.UUIDField()
    items = PrescriptionItemCreateSerializer(many=True)
    status = serializers.ChoiceField(choices=Prescription.STATUS_CHOICES, default='active', required=False)
    
    class Meta:
        model = Prescription
        fields = ['appointment_id', 'diagnosis', 'notes', 'items', 'status']

    def create(self, validated_data):
        appointment_id = validated_data.pop('appointment_id')
        items_data = validated_data.pop('items')
        
        appointment = Appointment.objects.get(id=appointment_id)
        validated_data['appointment'] = appointment
        validated_data['patient'] = appointment.patient
        validated_data['doctor'] = appointment.doctor
        
        prescription = Prescription.objects.create(**validated_data)
        
        for item_data in items_data:
            drug_id = item_data.pop('drug_id', None)
            drug_name = item_data.pop('drug_name', '')
            
            # Handle drug - it can be None for manual entries
            drug = None
            final_drug_name = drug_name
            
            if drug_id:
                try:
                    drug = Drug.objects.get(id=drug_id)
                    # Use drug name from database if drug_name not provided
                    if not final_drug_name:
                        final_drug_name = drug.name
                except Drug.DoesNotExist:
                    # If drug not found, treat as manual entry if drug_name exists
                    if not final_drug_name:
                        raise serializers.ValidationError(
                            {"drug_id": f"Drug with id {drug_id} not found and no drug_name provided"}
                        )
                    drug = None  # Set to None since drug not found
            
            # Create prescription item - drug can be None
            PrescriptionItem.objects.create(
                prescription=prescription,
                drug=drug,  # This can be None
                drug_name=final_drug_name,
                quantity=item_data.get('quantity'),
                dosage=item_data.get('dosage'),
                duration=item_data.get('duration'),
                instructions=item_data.get('instructions', '')
            )
            
        return prescription

class PharmacyRecommendationSerializer(serializers.ModelSerializer):
    pharmacy = PharmacySerializer(read_only=True)
    prescription = PrescriptionSerializer(read_only=True)
    
    class Meta:
        model = PharmacyRecommendation
        fields = ['id', 'prescription', 'pharmacy', 'availability_score', 
                 'total_cost', 'distance_km', 'created_at']
        read_only_fields = ['id', 'created_at']

class PaymentSerializer(serializers.ModelSerializer):
    prescription = PrescriptionSerializer(read_only=True)
    pharmacy = PharmacySerializer(read_only=True)
    patient = PatientSerializer(read_only=True)
    
    class Meta:
        model = Payment
        fields = ['id', 'prescription', 'pharmacy', 'patient', 'amount', 
                 'payment_method', 'status', 'transaction_id', 'created_at', 'updated_at']
        read_only_fields = ['id', 'transaction_id', 'created_at', 'updated_at']

class PaymentCreateSerializer(serializers.ModelSerializer):
    prescription_id = serializers.UUIDField()
    pharmacy_id = serializers.UUIDField()
    
    class Meta:
        model = Payment
        fields = ['prescription_id', 'pharmacy_id', 'amount', 'payment_method']

class MedicalReportSerializer(serializers.ModelSerializer):
    patient = PatientSerializer(read_only=True)
    doctor = DoctorSerializer(read_only=True)
    prescription = PrescriptionSerializer(read_only=True)
    
    class Meta:
        model = MedicalReport
        fields = ['id', 'patient', 'doctor', 'prescription', 'report_content', 
                 'recommendations', 'follow_up_date', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

class MedicalReportCreateSerializer(serializers.ModelSerializer):
    prescription_id = serializers.UUIDField()
    
    class Meta:
        model = MedicalReport
        fields = ['prescription_id', 'report_content', 'recommendations', 'follow_up_date']

    def create(self, validated_data):
        prescription_id = validated_data.pop('prescription_id')
        prescription = Prescription.objects.get(id=prescription_id)
        validated_data['prescription'] = prescription
        validated_data['patient'] = prescription.patient
        validated_data['doctor'] = prescription.doctor
        return super().create(validated_data)

class NotificationSerializer(serializers.ModelSerializer):
    recipient = UserSerializer(read_only=True)
    
    class Meta:
        model = Notification
        fields = ['id', 'recipient', 'title', 'message', 'notification_type', 
                 'is_read', 'email_sent', 'sms_sent', 'created_at']
        read_only_fields = ['id', 'email_sent', 'sms_sent', 'created_at']

class SystemSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = SystemSettings
        fields = ['key', 'value', 'description', 'updated_at']
        read_only_fields = ['updated_at']

    

class OrderSerializer(serializers.ModelSerializer):
    # Nested serializers for full details
    patient = PatientSerializer(read_only=True)
    doctor = DoctorSerializer(read_only=True)
    pharmacy = PharmacySerializer(read_only=True)
    prescription = PrescriptionSerializer(read_only=True)

    # Writable fields (for input)
    patient_id = serializers.UUIDField(write_only=True)  # Assuming patient IDs are UUIDs
    doctor_id = serializers.UUIDField(write_only=True)
    pharmacy_id = serializers.UUIDField(write_only=True)
    prescription_id = serializers.UUIDField(write_only=True)

    # Legacy fields
    pharmacy_name = serializers.CharField(source='pharmacy.pharmacy_name', read_only=True)
    patient_name = serializers.SerializerMethodField()
    doctor_name = serializers.SerializerMethodField()
    class Meta:
        model = Order
        fields = [
            'id', 'pharmacy', 'pharmacy_name', 'patient', 'patient_name',
            'doctor', 'doctor_name', 'prescription', 'prescription_id','pharmacy_id','patient_id','doctor_id',
            'status', 'is_paid', 'total_amount', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def get_patient_name(self, obj):
        if obj.patient and hasattr(obj.patient, 'user'):
            return f"{obj.patient.user.first_name} {obj.patient.user.last_name}"
        return str(obj.patient)

    def get_doctor_name(self, obj):
        if obj.doctor and hasattr(obj.doctor, 'user'):
            return f"Dr. {obj.doctor.user.first_name} {obj.doctor.user.last_name}"
        return None