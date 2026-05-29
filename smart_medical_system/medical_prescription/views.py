# views.py
from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.core.mail import send_mail
from django.conf import settings
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.db.models import Q, Avg, Sum
from decimal import Decimal
import uuid
import logging
from datetime import timedelta
from django.utils import timezone

from .models import *
from rest_framework.exceptions import ValidationError
from .serializers import *
import random
import string
from django.core.cache import cache
from rest_framework.permissions import BasePermission

logger = logging.getLogger(__name__)

class CanDeleteDrug(BasePermission):
    """Allow access only to users with user_type == 'admin'and pharmacy."""
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.user_type in ('admin', 'pharmacy')
        )
 

# Email notification helper
def send_email_notification(recipient_email, subject, message, notification_type='general'):
    """
    Send email notification and create notification record
    """
    try:
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [recipient_email],
            fail_silently=False,
        )
        
        # Create notification record if user exists
        try:
            user = User.objects.get(email=recipient_email)
            Notification.objects.create(
                recipient=user,
                title=subject,
                message=message,
                notification_type=notification_type,
                email_sent=True
            )
        except User.DoesNotExist:
            pass
            
        logger.info(f"Email sent successfully to {recipient_email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {recipient_email}: {str(e)}")
        return False

def generate_otp(length=6):
    """Generate a random OTP of given length"""
    characters = string.digits  # Only digits for simplicity
    return ''.join(random.choice(characters) for _ in range(length))

# Authentication Views
@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    """Register new user and create profile based on user type"""
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        try:
            with transaction.atomic():
                user = serializer.save()

                if not user:   # ✅ Safety check
                    print("❌ User object was not created!")
                    return Response({
                        'error': 'User not created'
                    }, status=status.HTTP_400_BAD_REQUEST)

                token, created = Token.objects.get_or_create(user=user)
                
                # Send welcome email
                subject = "Welcome to Smart Medical Prescription System"
                message = (
                    f"Hello {user.first_name},\n\n"
                    f"Welcome to our Smart Medical Prescription System. "
                    f"Your account has been created successfully.\n\n"
                    f"Best regards,\nMedical System Team"
                )
                send_email_notification(user.email, subject, message, 'general')
                
                return Response({
                    'message': 'User registered successfully',
                    'user': UserSerializer(user).data,
                    'token': token.key
                }, status=status.HTTP_201_CREATED)
                
        except Exception as e:
            print(f"❌ Registration error: {str(e)}")   # ✅ Console output
            return Response({
                'error': 'Registration failed'
            }, status=status.HTTP_400_BAD_REQUEST)

    # If serializer validation fails
    print(f"❌ Registration validation failed: {serializer.errors}")  # ✅ Console output
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



@api_view(['POST'])
@permission_classes([AllowAny])
def login_user(request):
    """User login with OTP verification"""
    serializer = UserLoginSerializer(data=request.data)
    
    try:
        if serializer.is_valid():
            user = serializer.validated_data['user']
            token, created = Token.objects.get_or_create(user=user)
            
            # Deactivate any existing active OTP for this user (for login purpose)
            OTPVerification.objects.filter(
                user=user, 
                purpose='login', 
                is_active=True
            ).update(is_active=False)
            
            # Generate and store OTP in database
            otp_code = generate_otp()
            otp_verification = OTPVerification.objects.create(
                user=user,
                otp_code=otp_code,
                purpose='login'
            )
            

            print("User Otp",otp_code)
            # Send OTP via email
            subject = "Your Login OTP Code"
            message = (
                f"Hello {user.first_name},\n\n"
                f"Your one-time password (OTP) for login is: {otp_code}\n\n"
                f"This OTP is valid for 5 minutes. Please don't share it with anyone.\n\n"
                f"If you didn't request this, please ignore this email.\n\n"
                f"Best regards,\nMedical System Team"
            )
            
            try:
                send_email_notification(user.email, subject, message, 'otp')
                logger.info(f"OTP sent successfully to {user.email} for user {user.id}")
            except Exception as e:
                logger.error(f"Failed to send OTP email to {user.email}: {str(e)}")
                # Still return success but log the error
                # You might want to handle this differently based on your requirements
            
            return Response({
                'success': True,
                'message': 'OTP sent to your email',
                'data': {
                    'user': UserSerializer(user).data,
                    'token': token.key,
                    'requires_otp': True
                },
                'otp_expires_in': 300  # 5 minutes in seconds
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'success': False,
                'error': {'message': 'Incorrect email or password'}
            }, status=status.HTTP_400_BAD_REQUEST)
            
    except ValidationError as e:
        return Response({
            'success': False,
            'error': {'message': 'Incorrect email or password'}
        }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        logger.error(f"Unexpected error in login_user: {str(e)}")
        return Response({
            'success': False,
            'error': {'message': 'An unexpected error occurred. Please try again.'}
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_otp(request):
    """Verify OTP sent to user's email"""
    otp_code = request.data.get('otp')
    email = request.data.get('email')
    
    if not otp_code:
        return Response({
            'success': False,
            'error': 'OTP is required',
            'isVerified': False
        }, status=status.HTTP_400_BAD_REQUEST)
    
    if not email:
        return Response({
            'success': False,
            'error': 'Email is required',
            'isVerified': False
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Validate OTP format (should be 6 digits)
    if not otp_code.isdigit() or len(otp_code) != 6:
        return Response({
            'success': False,
            'error': 'OTP must be 6 digits',
            'isVerified': False
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({
            'success': False,
            'error': 'User not found',
            'isVerified': False
        }, status=status.HTTP_404_NOT_FOUND)
    
    try:
        # Get the most recent active OTP for this user
        otp_verification = OTPVerification.objects.filter(
            user=user,
            purpose='login',
            is_active=True,
            is_verified=False
        ).order_by('-created_at').first()
        
        if not otp_verification:
            return Response({
                'success': False,
                'error': 'No active OTP found. Please request a new one.',
                'isVerified': False
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if OTP has expired
        if otp_verification.is_expired():
            # Mark as inactive
            otp_verification.is_active = False
            otp_verification.save()
            
            return Response({
                'success': False,
                'error': 'OTP has expired. Please request a new one.',
                'isVerified': False
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Verify OTP code
        if otp_code == otp_verification.otp_code:
            # Mark OTP as verified and inactive
            # otp_verification.is_verified = True
            # otp_verification.is_active = False
            otp_verification.verified_at = timezone.now()
            otp_verification.save()
            
            # Get or create token for the user
            token, created = Token.objects.get_or_create(user=user)
            
            # Optional: Clean up old expired OTPs for this user
            OTPVerification.objects.filter(
                user=user,
                expires_at__lt=timezone.now()
            ).delete()
            
            logger.info(f"OTP verified successfully for user {user.id}")
            
            return Response({
                'success': True,
                'message': 'OTP verified successfully',
                'isVerified': True,
                'data': {
                    'user': UserSerializer(user).data,
                    'token': token.key,
                    'requires_otp': False  # OTP is now verified
                }
            }, status=status.HTTP_200_OK)
        else:
            logger.warning(f"Invalid OTP attempt for user {user.id}")
            return Response({
                'success': False,
                'error': 'Invalid OTP. Please check and try again.',
                'isVerified': False
            }, status=status.HTTP_400_BAD_REQUEST)
            
    except Exception as e:
        logger.error(f"Error verifying OTP for user {user.id}: {str(e)}")
        return Response({
            'success': False,
            'error': 'An error occurred while verifying OTP. Please try again.',
            'isVerified': False
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UserListView(generics.ListAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]  



@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_doctor_profile(request):
    """Create doctor profile for authenticated user"""
    if request.user.user_type != 'doctor':
        return Response({'error': 'Only doctor users can create doctor profiles'},
                       status=status.HTTP_403_FORBIDDEN)


    serializer = DoctorCreateSerializer(data=request.data)
    print("Request data:", request.data)  # Print the incoming request data

    if serializer.is_valid():
        doctor = serializer.save(user=request.user)

        request.user.hasProfile = True
        request.user.save(update_fields=['hasProfile'])

        # Send profile creation notification
        subject = "Doctor Profile Created"
        message = f"Dear Dr. {request.user.first_name},\n\nYour doctor profile has been created successfully and is pending verification.\n\nProfile Details:\n- License Number: {doctor.license_number}\n- Specialization: {doctor.specialization}\n- Hospital: {doctor.hospital}\n\nBest regards,\nMedical System Team"
        send_email_notification(request.user.email, subject, message, 'general')
        
        return Response({
            'message': 'Doctor profile created successfully',
            'doctor': DoctorSerializer(doctor).data
        }, status=status.HTTP_201_CREATED)

    print("Serializer errors:", serializer.errors)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)




@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_patient_profile(request):
    """Create patient profile for authenticated user"""
    if request.user.user_type != 'patient':
        return Response({'error': 'Only patient users can create patient profiles'}, 
                       status=status.HTTP_403_FORBIDDEN)
    
    if hasattr(request.user, 'patient'):
        return Response({'error': 'Patient profile already exists'}, 
                       status=status.HTTP_400_BAD_REQUEST)
    
    serializer = PatientCreateSerializer(data=request.data)
    if serializer.is_valid():
        patient = serializer.save(user=request.user)

        request.user.hasProfile = True
        request.user.save(update_fields=['hasProfile'])
        
        # Send profile creation notification
        subject = "Patient Profile Created"
        message = f"Dear {request.user.first_name},\n\nYour patient profile has been created successfully.\n\nYou can now:\n- Book appointments\n- View prescriptions\n- Find recommended pharmacies\n\nBest regards,\nMedical System Team"
        send_email_notification(request.user.email, subject, message, 'general')
        
        return Response({
            'message': 'Patient profile created successfully',
            'patient': PatientSerializer(patient).data
        }, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_pharmacy_profile(request):
    """Create pharmacy profile for authenticated user"""
    if request.user.user_type != 'pharmacy':
        return Response({'error': 'Only pharmacy users can create pharmacy profiles'}, 
                       status=status.HTTP_403_FORBIDDEN)
    
    if hasattr(request.user, 'pharmacy'):
        return Response({'error': 'Pharmacy profile already exists'}, 
                       status=status.HTTP_400_BAD_REQUEST)
    
    serializer = PharmacyCreateSerializer(data=request.data)
    if serializer.is_valid():
        pharmacy = serializer.save(user=request.user)

        request.user.hasProfile = True
        request.user.save(update_fields=['hasProfile'])
        
        # Send profile creation notification
        subject = "Pharmacy Profile Created"
        message = f"Dear {request.user.first_name},\n\nYour pharmacy profile for '{pharmacy.pharmacy_name}' has been created successfully and is pending verification.\n\nProfile Details:\n- License Number: {pharmacy.license_number}\n- Address: {pharmacy.address}\n- Location: {pharmacy.location}\n\nBest regards,\nMedical System Team"
        send_email_notification(request.user.email, subject, message, 'general')
        
        return Response({
            'message': 'Pharmacy profile created successfully',
            'pharmacy': PharmacySerializer(pharmacy).data
        }, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_doctor_profiles(request):
    """
    List doctor profiles.
    Optional query params:
      - id:        (str) Doctor PK (same as user id, since OneToOne primary_key=True)
      - hospital_id: (UUID str) Hospital UUID (filters doctors in that hospital)
      - is_verified: (bool-like) true/false
    """
    qs = Doctor.objects.select_related('user', 'hospital').all()

    doc_id = request.query_params.get('id')  # Doctor PK == user id
    hospital_id = request.query_params.get('hospital_id') or request.query_params.get('hospital')
    is_verified = request.query_params.get('is_verified')

    if doc_id:
        qs = qs.filter(pk=doc_id)
    if hospital_id:
        qs = qs.filter(hospital_id=hospital_id)
    if is_verified is not None:
        val = str(is_verified).lower() in ('1', 'true', 'yes')
        qs = qs.filter(is_verified=val)

    serializer = DoctorSerializer(qs, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def retrieve_doctor_profile(request, id):
    """
    Retrieve a single doctor profile by its PK (user id).
    """
    doctor = get_object_or_404(
        Doctor.objects.select_related('user', 'hospital'), pk=id
    )
    return Response(DoctorSerializer(doctor).data)


# ---------- Patients ----------

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_patient_profiles(request):
    """
    List patient profiles.
    Optional query params:
      - id: (str) Patient PK (user id)
    """
    qs = Patient.objects.select_related('user').all()
    patient_id = request.query_params.get('id')
    if patient_id:
        qs = qs.filter(pk=patient_id)

    serializer = PatientSerializer(qs, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def retrieve_patient_profile(request, id):
    """
    Retrieve a single patient profile by PK (user id).
    """
    patient = get_object_or_404(Patient.objects.select_related('user'), pk=id)
    return Response(PatientSerializer(patient).data)


# ---------- Pharmacies ----------

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_pharmacy_profiles(request):
    """
    List pharmacy profiles.
    Optional query params:
      - id: (str) Pharmacy PK (user id)
    """
    qs = Pharmacy.objects.select_related('user').all()
    pharmacy_id = request.query_params.get('id')
    if pharmacy_id:
        qs = qs.filter(pk=pharmacy_id)

    serializer = PharmacySerializer(qs, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def retrieve_pharmacy_profile(request, id):
    """
    Retrieve a single pharmacy profile by PK (user id).
    """
    pharmacy = get_object_or_404(Pharmacy.objects.select_related('user'), pk=id)
    return Response(PharmacySerializer(pharmacy).data)



@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_current_doctor_profile(request):
    """
    Retrieve the current authenticated doctor's profile.
    """
    doctor = get_object_or_404(
        Doctor.objects.select_related('user', 'hospital'),
        user=request.user
    )
    return Response(DoctorSerializer(doctor).data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_current_patient_profile(request):
    """
    Retrieve the current authenticated patient's profile.
    """
    patient = get_object_or_404(
        Patient.objects.select_related('user'),
        user=request.user
    )
    return Response(PatientSerializer(patient).data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_current_pharmacy_profile(request):
    """
    Retrieve the current authenticated pharmacy's profile.
    """
    pharmacy = get_object_or_404(
        Pharmacy.objects.select_related('user'),
        user=request.user
    )
    return Response(PharmacySerializer(pharmacy).data)

# Hospital Views
class HospitalListCreateView(generics.ListCreateAPIView):
    queryset = Hospital.objects.filter(is_active=True)
    serializer_class = HospitalSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        hospital = serializer.save()
        
        # Send hospital creation notification to admin
        subject = "New Hospital Registered"
        message = f"A new hospital has been registered:\n\nName: {hospital.name}\nAddress: {hospital.address}\nPhone: {hospital.phone}\nEmail: {hospital.email}\n\nPlease review and verify."
        # Send to admin users
        admin_users = User.objects.filter(user_type='admin')
        for admin in admin_users:
            send_email_notification(admin.email, subject, message, 'general')

class HospitalDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Hospital.objects.all()
    serializer_class = HospitalSerializer
    permission_classes = [IsAuthenticated]

# Drug Views
class DrugListCreateView(generics.ListCreateAPIView):
    queryset = Drug.objects.all()
    serializer_class = DrugSerializer
    permission_classes = [IsAuthenticated]

class DrugDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Drug.objects.all()
    serializer_class = DrugSerializer
 
    def get_permissions(self):
        """
        GET / PUT / PATCH  → any authenticated user
        DELETE             → admin or pharmacy users only
        """
        if self.request.method == 'DELETE':
            return [IsAuthenticated(), CanDeleteDrug()]
        return [IsAuthenticated()]
 
    def destroy(self, request, *args, **kwargs):
        drug = self.get_object()
        drug_name = drug.name
        self.perform_destroy(drug)
        return Response(
            {'message': f'Drug "{drug_name}" deleted successfully'},
            status=status.HTTP_200_OK
        )

# Pharmacy Inventory Views
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def pharmacy_inventory(request):
    """Manage pharmacy inventory - only for pharmacy users"""
    if not hasattr(request.user, 'pharmacy'):
        return Response({'error': 'Only pharmacy users can access inventory'}, 
                       status=status.HTTP_403_FORBIDDEN)
    
    pharmacy = request.user.pharmacy
    
    if request.method == 'GET':
        inventory = PharmacyInventory.objects.filter(pharmacy=pharmacy)
        serializer = PharmacyInventorySerializer(inventory, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = PharmacyInventoryCreateSerializer(data=request.data)
        if serializer.is_valid():
            inventory_item = serializer.save(pharmacy=pharmacy)
            
            # Check for low stock and send notification
            if inventory_item.is_low_stock:
                subject = "Low Stock Alert"
                message = f"Warning: {inventory_item.drug.name} is running low in stock.\n\nCurrent quantity: {inventory_item.quantity_available}\nThreshold: {inventory_item.low_stock_threshold}\n\nPlease restock soon."
                send_email_notification(request.user.email, subject, message, 'low_stock_alert')
            
            return Response({
                'message': 'Inventory item added successfully',
                'item': PharmacyInventorySerializer(inventory_item).data
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def pharmacy_inventory_detail(request, item_id):
    """Update or delete specific inventory item"""
    if not hasattr(request.user, 'pharmacy'):
        return Response({'error': 'Only pharmacy users can access inventory'}, 
                       status=status.HTTP_403_FORBIDDEN)
    
    try:
        inventory_item = PharmacyInventory.objects.get(
            id=item_id, 
            pharmacy=request.user.pharmacy
        )
    except PharmacyInventory.DoesNotExist:
        return Response({'error': 'Inventory item not found'}, 
                       status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'PUT':
        serializer = PharmacyInventoryCreateSerializer(inventory_item, data=request.data, partial=True)
        if serializer.is_valid():
            inventory_item = serializer.save()
            
            # Check for low stock after update
            if inventory_item.is_low_stock:
                subject = "Low Stock Alert - Updated"
                message = f"After recent update, {inventory_item.drug.name} is still low in stock.\n\nCurrent quantity: {inventory_item.quantity_available}\nThreshold: {inventory_item.low_stock_threshold}\n\nPlease restock soon."
                send_email_notification(request.user.email, subject, message, 'low_stock_alert')
            
            return Response({
                'message': 'Inventory item updated successfully',
                'item': PharmacyInventorySerializer(inventory_item).data
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        drug_name = inventory_item.drug.name
        inventory_item.delete()
        
        subject = "Inventory Item Removed"
        message = f"The inventory item '{drug_name}' has been removed from your pharmacy inventory."
        send_email_notification(request.user.email, subject, message, 'general')
        
        return Response({'message': 'Inventory item deleted successfully'})

# Appointment Views
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_appointment(request):
    """Create appointment - only for patients"""
    try:
        if not hasattr(request.user, 'patient'):
            print("❌ Error: Only patients can create appointments")
            return Response(
                {'error': 'Only patients can create appointments'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = AppointmentCreateSerializer(data=request.data)
        print(request.data)
        if serializer.is_valid():
            try:
                appointment = serializer.save(patient=request.user.patient)
            except Exception as e:
                print(f"❌ Error saving appointment: {str(e)}")
                return Response(
                    {'error': 'Could not save appointment'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Send notifications
            try:
                patient_subject = "Appointment Request Submitted"
                patient_message = (
                    f"Dear {request.user.first_name},\n\n"
                    f"Your appointment request has been submitted successfully.\n\n"
                    f"Details:\n"
                    f"- Doctor: Dr. {appointment.doctor.user.first_name} {appointment.doctor.user.last_name}\n"
                    f"- Hospital: {appointment.hospital.name}\n"
                    f"- Requested Date: {appointment.appointment_date}\n"
                    f"- Reason: {appointment.reason}\n\n"
                    f"Status: Pending approval\n\n"
                    f"You will be notified once the doctor approves your request.\n\n"
                    f"Best regards,\nMedical System Team"
                )
                send_email_notification(request.user.email, patient_subject, patient_message, 'appointment_request')

                doctor_subject = "New Appointment Request"
                doctor_message = (
                    f"Dear Dr. {appointment.doctor.user.first_name},\n\n"
                    f"You have received a new appointment request.\n\n"
                    f"Patient: {appointment.patient.user.first_name} {appointment.patient.user.last_name}\n"
                    f"Requested Date: {appointment.appointment_date}\n"
                    f"Reason: {appointment.reason}\n\n"
                    f"Please review and approve/decline the request.\n\n"
                    f"Best regards,\nMedical System Team"
                )
                send_email_notification(appointment.doctor.user.email, doctor_subject, doctor_message, 'appointment_request')

            except Exception as e:
                print(f"❌ Error sending email notification: {str(e)}")

            return Response({
                'message': 'Appointment request created successfully',
                'appointment': AppointmentSerializer(appointment).data
            }, status=status.HTTP_201_CREATED)

        else:
            print(f"❌ Serializer validation errors: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    except Exception as e:
        print(f"❌ Unexpected error in create_appointment: {str(e)}")
        return Response(
            {'error': 'An unexpected error occurred'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_appointments(request):
    """Get appointments based on user type"""
    user = request.user
    
    if hasattr(user, 'patient'):
        appointments = Appointment.objects.filter(patient=user.patient)
    elif hasattr(user, 'doctor'):
        appointments = Appointment.objects.filter(doctor=user.doctor)
    else:
        return Response({'error': 'No appointments found for this user type'}, 
                       status=status.HTTP_403_FORBIDDEN)
    
    serializer = AppointmentSerializer(appointments, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_appointment_by_id(request, appointment_id):
    """Get a single appointment by ID"""
    appointment = get_object_or_404(Appointment, id=appointment_id)
    serializer = AppointmentSerializer(appointment)
    return Response(serializer.data, status=status.HTTP_200_OK)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_appointment_status(request, appointment_id):
    """Update appointment status - only for doctors"""
    if not hasattr(request.user, 'doctor'):
        return Response({'error': 'Only doctors can update appointment status'}, 
                       status=status.HTTP_403_FORBIDDEN)
    
    try:
        appointment = Appointment.objects.get(id=appointment_id, doctor=request.user.doctor)
    except Appointment.DoesNotExist:
        return Response({'error': 'Appointment not found'}, 
                       status=status.HTTP_404_NOT_FOUND)
    
    new_status = request.data.get('status')
    notes = request.data.get('notes', '')
    
    if new_status not in ['approved', 'completed', 'cancelled']:
        return Response({'error': 'Invalid status'}, 
                       status=status.HTTP_400_BAD_REQUEST)
    
    appointment.status = new_status
    appointment.notes = notes
    appointment.save()
    
    # Send notification to patient
    status_messages = {
        'approved': 'Your appointment has been approved.',
        'completed': 'Your appointment has been completed.',
        'cancelled': 'Your appointment has been cancelled.'
    }
    
    subject = f"Appointment {new_status.title()}"
    message = f"Dear {appointment.patient.user.first_name},\n\n{status_messages[new_status]}\n\nAppointment Details:\n- Doctor: Dr. {appointment.doctor.user.first_name} {appointment.doctor.user.last_name}\n- Date: {appointment.appointment_date}\n- Reason: {appointment.reason}\n"
    
    if notes:
        message += f"\nNotes from doctor: {notes}\n"
    
    message += "\nBest regards,\nMedical System Team"
    
    send_email_notification(appointment.patient.user.email, subject, message, f'appointment_{new_status}')
    
    return Response({
        'message': f'Appointment {new_status} successfully',
        'appointment': AppointmentSerializer(appointment).data
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def auto_update_appointment_status(request):
    """
    Automatically update appointment status to 'in_progress' when appointment time arrives
    This function can be called periodically or triggered manually
    """
    try:
        now = timezone.now()
    
        appointments_to_update = Appointment.objects.filter(
            status='approved',
            appointment_date__lte=now,
            appointment_date__gte=now - timedelta(hours=1) 
        )
        
        updated_appointments = []
        
        for appointment in appointments_to_update:
            appointment.status = 'in_progress'
            appointment.save()
            
            updated_appointments.append({
                'id': appointment.id,
                'patient': f"{appointment.patient.user.first_name} {appointment.patient.user.last_name}",
                'doctor': f"Dr. {appointment.doctor.user.first_name} {appointment.doctor.user.last_name}",
                'appointment_date': appointment.appointment_date,
                'status': appointment.status
            })
        
            try:
                patient_subject = "Your Appointment is Now In Progress"
                patient_message = (
                    f"Dear {appointment.patient.user.first_name},\n\n"
                    f"Your appointment with Dr. {appointment.doctor.user.first_name} "
                    f"{appointment.doctor.user.last_name} is now in progress.\n\n"
                    f"Appointment Details:\n"
                    f"- Date & Time: {appointment.appointment_date}\n"
                    f"- Hospital: {appointment.hospital.name}\n"
                    f"- Reason: {appointment.reason}\n\n"
                    f"Please proceed to the hospital if you haven't already.\n\n"
                    f"Best regards,\nMedical System Team"
                )
                
                send_email_notification(
                    appointment.patient.user.email, 
                    patient_subject, 
                    patient_message, 
                    'appointment_in_progress'
                )
                
                # Also send notification to doctor
                doctor_subject = "Appointment Started"
                doctor_message = (
                    f"Dear Dr. {appointment.doctor.user.first_name},\n\n"
                    f"Your appointment with {appointment.patient.user.first_name} "
                    f"{appointment.patient.user.last_name} is now in progress.\n\n"
                    f"Appointment Details:\n"
                    f"- Date & Time: {appointment.appointment_date}\n"
                    f"- Reason: {appointment.reason}\n\n"
                    f"Best regards,\nMedical System Team"
                )
                
                send_email_notification(
                    appointment.doctor.user.email, 
                    doctor_subject, 
                    doctor_message, 
                    'appointment_in_progress'
                )
                
            except Exception as e:
                print(f"❌ Error sending notification for appointment {appointment.id}: {str(e)}")
        
        return Response({
            'message': f'Successfully updated {len(updated_appointments)} appointments to in_progress',
            'updated_appointments': updated_appointments,
            'total_updated': len(updated_appointments),
            'timestamp': now
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        print(f"❌ Error in auto_update_appointment_status: {str(e)}")
        return Response(
            {'error': 'Failed to update appointment statuses', 'details': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

# Prescription Views
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_prescription(request):
    """Create prescription - only for doctors"""
    if not hasattr(request.user, 'doctor'):
        return Response(
            {'error': 'Only doctors can create prescriptions'},
            status=status.HTTP_403_FORBIDDEN
        )
 
    serializer = PrescriptionCreateSerializer(data=request.data)
    if serializer.is_valid():
        try:
            with transaction.atomic():
                prescription = serializer.save()
 
                # Mark appointment as completed
                appointment = prescription.appointment
                appointment.status = 'completed'
                appointment.save()
 
                # Generate pharmacy recommendations
                try:
                    generate_pharmacy_recommendations(prescription)
                except Exception as rec_err:
                    logger.error(f"Pharmacy recommendation generation failed: {rec_err}")
                    # Don't block the response — recommendations are best-effort
 
                # Notify patient
                subject = "Prescription Ready"
                message = (
                    f"Dear {prescription.patient.user.first_name},\n\n"
                    f"Your prescription is ready.\n\n"
                    f"Diagnosis: {prescription.diagnosis}\n\n"
                    f"Prescribed Medications:\n"
                )
                for item in prescription.items.all():
                    drug_display = item.drug.name if item.drug else (item.drug_name or 'Unknown Drug')
                    message += f"- {drug_display}: {item.quantity} units, {item.dosage}, for {item.duration}\n"
 
                message += f"\nNotes: {prescription.notes}\n\nBest regards,\nMedical System Team"
                send_email_notification(
                    prescription.patient.user.email, subject, message, 'prescription_ready'
                )
 
                return Response({
                    'message': 'Prescription created successfully',
                    'prescription': PrescriptionSerializer(prescription).data
                }, status=status.HTTP_201_CREATED)
 
        except Exception as e:
            logger.error(f"Prescription creation error: {str(e)}")
            import traceback; traceback.print_exc()
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    else:
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    

def generate_pharmacy_recommendations(prescription):
    """
    Generate pharmacy recommendations based on drug availability.
 
    Matching strategy:
      - If PrescriptionItem.drug is set  → match via drug FK (exact)
      - If PrescriptionItem.drug is NULL → match via case-insensitive drug_name
        against Drug.name in the pharmacy's inventory
    """
    try:
        prescribed_items = list(
            prescription.items.select_related('drug').all()
        )
        total_items = len(prescribed_items)
 
        if total_items == 0:
            logger.warning(f"Prescription {prescription.id} has no items — skipping recommendations")
            return
 
        pharmacies = Pharmacy.objects.filter(is_verified=True).prefetch_related(
            'inventory__drug'
        )
 
        recommendations = []
 
        for pharmacy in pharmacies:
            # Build a quick lookup for this pharmacy's inventory
            # keyed by drug_id (UUID) and drug_name (lowercase)
            inventory_by_drug_id = {}
            inventory_by_drug_name = {}
 
            for inv in pharmacy.inventory.all():
                inventory_by_drug_id[inv.drug_id] = inv
                inventory_by_drug_name[inv.drug.name.lower()] = inv
 
            available_count = 0
            total_cost = Decimal('0.00')
 
            for item in prescribed_items:
                inv = None
 
                if item.drug_id:
                    # Catalog drug — match by FK
                    inv = inventory_by_drug_id.get(item.drug_id)
                elif item.drug_name:
                    # Manual entry — fuzzy match by name
                    inv = inventory_by_drug_name.get(item.drug_name.strip().lower())
 
                if inv and inv.quantity_available >= item.quantity:
                    available_count += 1
                    total_cost += inv.price_per_unit * item.quantity
 
            # Only recommend pharmacies that can fill at least one item
            if available_count == 0:
                continue
 
            availability_score = Decimal(str(round((available_count / total_items) * 100, 2)))
 
            # update_or_create so re-running doesn't create duplicates
            rec, created = PharmacyRecommendation.objects.update_or_create(
                prescription=prescription,
                pharmacy=pharmacy,
                defaults={
                    'availability_score': availability_score,
                    'total_cost': total_cost,
                }
            )
            recommendations.append(rec)
 
        if not recommendations:
            logger.info(f"No pharmacies can fill prescription {prescription.id}")
            return
 
        # Sort: highest availability first, then lowest cost
        recommendations.sort(key=lambda r: (-r.availability_score, r.total_cost))
 
        # Send top-3 to patient
        subject = "Pharmacy Recommendations for Your Prescription"
        message = (
            f"Dear {prescription.patient.user.first_name},\n\n"
            f"Based on your prescription, here are our recommended pharmacies:\n\n"
        )
        for i, rec in enumerate(recommendations[:3], 1):
            message += (
                f"{i}. {rec.pharmacy.pharmacy_name}\n"
                f"   - Availability: {rec.availability_score:.1f}%\n"
                f"   - Estimated Cost: {rec.total_cost:.2f} RWF\n"
                f"   - Location: {rec.pharmacy.location}\n"
                f"   - Address: {rec.pharmacy.address}\n\n"
            )
 
        message += (
            "Please contact the pharmacy to confirm availability before visiting.\n\n"
            "Best regards,\nMedical System Team"
        )
        send_email_notification(
            prescription.patient.user.email,
            subject,
            message,
            'pharmacy_recommendation'
        )
 
        logger.info(
            f"Generated {len(recommendations)} recommendations for prescription {prescription.id}"
        )
 
    except Exception as e:
        logger.error(f"Failed to generate pharmacy recommendations: {str(e)}")
        raise 

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_prescriptions(request):
    """Get prescriptions based on user type"""
    user = request.user
    
    if hasattr(user, 'patient'):
        prescriptions = Prescription.objects.filter(patient=user.patient)
    elif hasattr(user, 'doctor'):
        prescriptions = Prescription.objects.filter(doctor=user.doctor)
    else:
        return Response({'error': 'No prescriptions found for this user type'}, 
                       status=status.HTTP_403_FORBIDDEN)
    
    serializer = PrescriptionSerializer(prescriptions, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_prescription_by_id(request, prescription_id):
    """Get a single prescription by ID"""
    prescription = get_object_or_404(Prescription, id=prescription_id)
    serializer = PrescriptionSerializer(prescription)
    return Response(serializer.data, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_prescription_by_appointment(request, appointment_id):
    """Get a prescription using the related appointment ID"""

    # 1. Print the received appointment_id (check for hyphens or formatting issues)
    print("Received appointment_id:", appointment_id)
    print("Type of appointment_id:", type(appointment_id))

    # 2. Query the prescription and print the raw object
    prescription = get_object_or_404(
        Prescription.objects.select_related('appointment', 'patient', 'doctor'),
        appointment_id=appointment_id
    )

    # 3. Serialize and print the data before returning
    serializer = PrescriptionSerializer(prescription)
    print("Serialized Prescription Data:", serializer.data)

    return Response(serializer.data, status=status.HTTP_200_OK)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_pharmacy_recommendations(request, prescription_id):
    """Get pharmacy recommendations for a specific prescription"""
    try:
        prescription = Prescription.objects.get(id=prescription_id)
        
        # Check if user has permission to view this prescription
        if hasattr(request.user, 'patient') and prescription.patient.user != request.user:
            return Response({'error': 'Access denied'}, 
                           status=status.HTTP_403_FORBIDDEN)
        elif hasattr(request.user, 'doctor') and prescription.doctor.user != request.user:
            return Response({'error': 'Access denied'}, 
                           status=status.HTTP_403_FORBIDDEN)
        
        recommendations = PharmacyRecommendation.objects.filter(
            prescription=prescription
        ).order_by('-availability_score', 'total_cost')
        
        serializer = PharmacyRecommendationSerializer(recommendations, many=True)
        return Response(serializer.data)
        
    except Prescription.DoesNotExist:
        return Response({'error': 'Prescription not found'}, 
                       status=status.HTTP_404_NOT_FOUND)

# Payment Views
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_payment(request):
    """Create payment - only for patients"""
    if not hasattr(request.user, 'patient'):
        return Response({'error': 'Only patients can make payments'}, 
                       status=status.HTTP_403_FORBIDDEN)
    
    serializer = PaymentCreateSerializer(data=request.data)
    if serializer.is_valid():
        try:
            with transaction.atomic():
                prescription_id = serializer.validated_data['prescription_id']
                pharmacy_id = serializer.validated_data['pharmacy_id']
                
                prescription = Prescription.objects.get(id=prescription_id)
                pharmacy = Pharmacy.objects.get(user_id=pharmacy_id)
                
                # Generate unique transaction ID
                transaction_id = str(uuid.uuid4())[:8].upper()
                
                payment = Payment.objects.create(
                    prescription=prescription,
                    pharmacy=pharmacy,
                    patient=request.user.patient,
                    amount=serializer.validated_data['amount'],
                    payment_method=serializer.validated_data['payment_method'],
                    transaction_id=transaction_id,
                    status='completed'  # Assuming immediate completion for demo
                )
                
                # Update prescription status
                prescription.status = 'filled'
                prescription.save()
                
                # Send confirmation emails
                patient_subject = "Payment Confirmation"
                patient_message = f"Dear {request.user.first_name},\n\nYour payment has been processed successfully.\n\nTransaction ID: {transaction_id}\nAmount: ${payment.amount}\nPharmacy: {pharmacy.pharmacy_name}\nPayment Method: {payment.payment_method.title()}\n\nYour prescription is now ready for collection.\n\nBest regards,\nMedical System Team"
                send_email_notification(request.user.email, patient_subject, patient_message, 'payment_confirmation')
                
                pharmacy_subject = "Payment Received"
                pharmacy_message = f"Dear {pharmacy.user.first_name},\n\nYou have received a payment.\n\nTransaction ID: {transaction_id}\nAmount: ${payment.amount}\nPatient: {payment.patient.user.first_name} {payment.patient.user.last_name}\nPayment Method: {payment.payment_method.title()}\n\nPlease prepare the prescription for collection.\n\nBest regards,\nMedical System Team"
                send_email_notification(pharmacy.user.email, pharmacy_subject, pharmacy_message, 'payment_confirmation')
                
                return Response({
                    'message': 'Payment processed successfully',
                    'payment': PaymentSerializer(payment).data
                }, status=status.HTTP_201_CREATED)
                
        except Exception as e:
            logger.error(f"Payment processing error: {str(e)}")
            return Response({'error': 'Payment processing failed'}, 
                           status=status.HTTP_400_BAD_REQUEST)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_payments(request):
    """Get payments based on user type"""
    user = request.user
    
    if hasattr(user, 'patient'):
        payments = Payment.objects.filter(patient=user.patient)
    elif hasattr(user, 'pharmacy'):
        payments = Payment.objects.filter(pharmacy=user.pharmacy)
    else:
        return Response({'error': 'No payments found for this user type'}, 
                       status=status.HTTP_403_FORBIDDEN)
    
    serializer = PaymentSerializer(payments, many=True)
    return Response(serializer.data)

# Medical Report Views
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_medical_report(request):
    """Create medical report - only for doctors"""
    if not hasattr(request.user, 'doctor'):
        return Response({'error': 'Only doctors can create medical reports'}, 
                       status=status.HTTP_403_FORBIDDEN)
    
    serializer = MedicalReportCreateSerializer(data=request.data)
    if serializer.is_valid():
        report = serializer.save(doctor=request.user.doctor)
        
        # Send notification to patient
        subject = "Medical Report Available"
        message = f"Dear {report.patient.user.first_name},\n\nYour medical report is now available.\n\nReport Summary:\n{report.report_content[:200]}...\n\nRecommendations: {report.recommendations}\n\n"
        
        if report.follow_up_date:
            message += f"Follow-up Date: {report.follow_up_date}\n\n"
        
        message += "Please contact your doctor if you have any questions.\n\nBest regards,\nMedical System Team"
        
        send_email_notification(report.patient.user.email, subject, message, 'general')
        
        return Response({
            'message': 'Medical report created successfully',
            'report': MedicalReportSerializer(report).data
        }, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_medical_reports(request):
    """Get medical reports based on user type"""
    user = request.user
    
    if hasattr(user, 'patient'):
        reports = MedicalReport.objects.filter(patient=user.patient)
    elif hasattr(user, 'doctor'):
        reports = MedicalReport.objects.filter(doctor=user.doctor)
    else:
        return Response({'error': 'No medical reports found for this user type'}, 
                       status=status.HTTP_403_FORBIDDEN)
    
    serializer = MedicalReportSerializer(reports, many=True)
    return Response(serializer.data)

# Notification Views
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_notifications(request):
    """Get user notifications"""
    notifications = Notification.objects.filter(recipient=request.user).order_by('-created_at')
    serializer = NotificationSerializer(notifications, many=True)
    return Response(serializer.data)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def mark_notification_read(request, notification_id):
    """Mark notification as read"""
    try:
        notification = Notification.objects.get(id=notification_id, recipient=request.user)
        notification.is_read = True
        notification.save()
        
        return Response({'message': 'Notification marked as read'})
    except Notification.DoesNotExist:
        return Response({'error': 'Notification not found'}, 
                       status=status.HTTP_404_NOT_FOUND)

# Dashboard/Analytics Views
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_dashboard_data(request):
    """Get dashboard data based on user type"""
    user = request.user
    
    if hasattr(user, 'patient'):
        data = {
            'total_appointments': Appointment.objects.filter(patient=user.patient).count(),
            'pending_appointments': Appointment.objects.filter(patient=user.patient, status='pending').count(),
            'active_prescriptions': Prescription.objects.filter(patient=user.patient, status='active').count(),
            'total_payments': Payment.objects.filter(patient=user.patient).count()
        }
    elif hasattr(user, 'doctor'):
        data = {
            'total_appointments': Appointment.objects.filter(doctor=user.doctor).count(),
            'pending_appointments': Appointment.objects.filter(doctor=user.doctor, status='pending').count(),
            'total_prescriptions': Prescription.objects.filter(doctor=user.doctor).count(),
            'completed_appointments': Appointment.objects.filter(doctor=user.doctor, status='completed').count()
        }
    elif hasattr(user, 'pharmacy'):
        data = {
            'total_inventory_items': PharmacyInventory.objects.filter(pharmacy=user.pharmacy).count(),
            'low_stock_items': PharmacyInventory.objects.filter(pharmacy=user.pharmacy, quantity_available__lte=models.F('low_stock_threshold')).count(),
            'total_payments_received': Payment.objects.filter(pharmacy=user.pharmacy).count(),
            'total_revenue': Payment.objects.filter(pharmacy=user.pharmacy).aggregate(Sum('amount'))['amount__sum'] or 0
        }
    else:
        data = {'error': 'Invalid user type'}
    
    return Response(data)

# System monitoring (auto-generated backend actions)
@api_view(['POST'])
@permission_classes([AllowAny])
def check_low_stock_alerts(request):
    """System function to check and send low stock alerts"""
    try:
        low_stock_items = PharmacyInventory.objects.filter(
            quantity_available__lte=models.F('low_stock_threshold')
        )
        
        alerts_sent = 0
        for item in low_stock_items:
            # Check if alert was already sent recently (within 24 hours)
            recent_notification = Notification.objects.filter(
                recipient=item.pharmacy.user,
                notification_type='low_stock_alert',
                message__contains=item.drug.name,
                created_at__gte=timezone.now() - timedelta(hours=24)
            ).exists()
            
            if not recent_notification:
                subject = f"Low Stock Alert: {item.drug.name}"
                message = f"Warning: {item.drug.name} is running low in stock.\n\nCurrent quantity: {item.quantity_available}\nThreshold: {item.low_stock_threshold}\n\nPlease restock soon to avoid shortages."
                
                send_email_notification(item.pharmacy.user.email, subject, message, 'low_stock_alert')
                alerts_sent += 1
        
        return Response({
            'message': f'Low stock check completed. {alerts_sent} alerts sent.'
        })
        
    except Exception as e:
        logger.error(f"Low stock check error: {str(e)}")
        return Response({'error': 'Low stock check failed'}, 
                       status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    



@api_view(['GET'])
@permission_classes([IsAuthenticated])
def order_list(request):
    """List all orders (filtered by user type)"""
    user = request.user

    if hasattr(user, 'patient'):
        orders = Order.objects.filter(patient=user.patient)
    elif hasattr(user, 'doctor'):
        orders = Order.objects.filter(doctor=user.doctor)
    elif hasattr(user, 'pharmacy'):
        orders = Order.objects.filter(pharmacy=user.pharmacy)
    else:
        # For pharmacy staff or admin - adjust as needed
        orders = Order.objects.all()

    serializer = OrderSerializer(orders, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def order_detail(request, pk):
    """Get a specific order by ID"""
    order = get_object_or_404(Order, pk=pk)
    user = request.user
    if (not hasattr(user, 'patient') or order.patient != user.patient) and \
       (not hasattr(user, 'doctor') or order.doctor != user.doctor):
        pass

    serializer = OrderSerializer(order)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def order_create(request):
    """Create a new order"""
    data = request.data.copy()
    data['patient'] = request.user.patient.user_id
    serializer = OrderSerializer(data=data, context={'request': request})

    if serializer.is_valid():
        order = serializer.save()  # First save the order to get the instance

        # Update the prescription's is_ordered status
        prescription = order.prescription  # Assuming your Order model has a prescription field
        prescription.is_ordered = True
        prescription.save()

        return Response(serializer.data, status=status.HTTP_201_CREATED)
    else:
        print("Serializer errors:", serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def order_update_status(request, pk):
    """Update order status and payment status"""
    order = get_object_or_404(Order, pk=pk)
    allowed_fields = ['status', 'is_paid']
    for field in request.data:
        if field not in allowed_fields:
            return Response(
                {'error': f'Field {field} cannot be updated through this endpoint'},
                status=status.HTTP_400_BAD_REQUEST
            )

    serializer = OrderSerializer(order, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)