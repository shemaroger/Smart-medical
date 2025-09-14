# urls.py
from django.urls import path, include
from . import views

urlpatterns = [
    # Authentication URLs
    path('auth/register/', views.register_user, name='register_user'),
    path('auth/login/', views.login_user, name='login_user'),
     path('users/', views.UserListView.as_view(), name='user-list'),
    
    # Profile Creation URLs
    path('profiles/doctor/create/', views.create_doctor_profile, name='create_doctor_profile'),
    path('profiles/patient/create/', views.create_patient_profile, name='create_patient_profile'),
    path('profiles/pharmacy/create/', views.create_pharmacy_profile, name='create_pharmacy_profile'),
    
    # Hospital URLs
    path('hospitals/', views.HospitalListCreateView.as_view(), name='hospital_list_create'),
    path('hospitals/<uuid:pk>/', views.HospitalDetailView.as_view(), name='hospital_detail'),
    
    # Drug URLs
    path('drugs/', views.DrugListCreateView.as_view(), name='drug_list_create'),
    path('drugs/<uuid:pk>/', views.DrugDetailView.as_view(), name='drug_detail'),
    
    # Pharmacy Inventory URLs
    path('pharmacy/inventory/', views.pharmacy_inventory, name='pharmacy_inventory'),
    path('pharmacy/inventory/<uuid:item_id>/', views.pharmacy_inventory_detail, name='pharmacy_inventory_detail'),
    
    # Appointment URLs
    path('appointments/create/', views.create_appointment, name='create_appointment'),
    path('appointments/', views.get_appointments, name='get_appointments'),
    path('appointments/<uuid:appointment_id>/status/', views.update_appointment_status, name='update_appointment_status'),
    
    # Prescription URLs
    path('prescriptions/create/', views.create_prescription, name='create_prescription'),
    path('prescriptions/', views.get_prescriptions, name='get_prescriptions'),
    path('prescriptions/<uuid:prescription_id>/recommendations/', views.get_pharmacy_recommendations, name='get_pharmacy_recommendations'),
    
    # Payment URLs
    path('payments/create/', views.create_payment, name='create_payment'),
    path('payments/', views.get_payments, name='get_payments'),
    
    # Medical Report URLs
    path('medical-reports/create/', views.create_medical_report, name='create_medical_report'),
    path('medical-reports/', views.get_medical_reports, name='get_medical_reports'),
    
    # Notification URLs
    path('notifications/', views.get_notifications, name='get_notifications'),
    path('notifications/<uuid:notification_id>/read/', views.mark_notification_read, name='mark_notification_read'),
    
    # Dashboard URLs
    path('dashboard/', views.get_dashboard_data, name='get_dashboard_data'),
    
    # System monitoring URLs (for backend automation)
    path('system/check-low-stock/', views.check_low_stock_alerts, name='check_low_stock_alerts'),
]