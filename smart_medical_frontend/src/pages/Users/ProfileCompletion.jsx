import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Stethoscope, User, Calendar, Phone, MapPin, FileText, Droplet,
    AlertCircle, Building2, Award, Clock, Shield, Pill, Loader2,
    CheckCircle, ArrowRight, Eye, EyeOff, Heart, UserCheck,
    ChevronLeft, ChevronRight, Save, Star, Info, HelpCircle, LogOut
} from 'lucide-react';
import { toast } from 'react-toastify';
import { profileService, getCurrentUser, hospitalService } from '../../api';

const ProfileCompletionPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [loadingHospitals, setLoadingHospitals] = useState(false);
    const [userType, setUserType] = useState('');
    const [userData, setUserData] = useState(null);
    const [hospitals, setHospitals] = useState([]);
    const [currentStep, setCurrentStep] = useState(1);

    const [formData, setFormData] = useState({
        // Patient fields
        date_of_birth: '',
        medical_history: '',
        emergency_contact: '',
        blood_group: '',
        allergies: '',

        // Doctor fields
        license_number: '',
        specialization: '',
        hospital: '',
        experience_years: '',

        // Pharmacy fields
        pharmacy_name: '',
        address: '',
        location: ''
    });

    const [errors, setErrors] = useState({});

    const bloodGroups = [
        { value: '', label: 'Select Blood Group (Optional)' },
        { value: 'A+', label: 'A+' },
        { value: 'A-', label: 'A-' },
        { value: 'B+', label: 'B+' },
        { value: 'B-', label: 'B-' },
        { value: 'AB+', label: 'AB+' },
        { value: 'AB-', label: 'AB-' },
        { value: 'O+', label: 'O+' },
        { value: 'O-', label: 'O-' }
    ];

    const specializations = [
        'General Medicine', 'Cardiology', 'Neurology', 'Pediatrics', 'Orthopedics',
        'Dermatology', 'Psychiatry', 'Ophthalmology', 'ENT', 'Gynecology',
        'Surgery', 'Radiology', 'Pathology', 'Anesthesiology', 'Emergency Medicine'
    ];

    const rwandaLocations = [
        'Kigali', 'Butare/Huye', 'Musanze', 'Rubavu', 'Kayonza',
        'Nyagatare', 'Muhanga', 'Karongi', 'Rusizi', 'Gicumbi',
        'Burera', 'Gatsibo', 'Nyanza', 'Rwamagana', 'Ngoma'
    ];

    // Define steps for each user type
    const getStepsConfig = () => {
        switch (userType) {
            case 'patient':
                return [
                    {
                        id: 1,
                        title: 'Personal Info',
                        description: 'Basic personal information',
                        icon: User,
                        fields: ['date_of_birth', 'emergency_contact']
                    },
                    {
                        id: 2,
                        title: 'Medical Details',
                        description: 'Health information',
                        icon: Heart,
                        fields: ['blood_group', 'allergies', 'medical_history']
                    }
                ];
            case 'doctor':
                return [
                    {
                        id: 1,
                        title: 'Credentials',
                        description: 'License and specialization',
                        icon: Shield,
                        fields: ['license_number', 'specialization']
                    },
                    {
                        id: 2,
                        title: 'Practice Details',
                        description: 'Hospital and experience',
                        icon: Building2,
                        fields: ['hospital', 'experience_years']
                    }
                ];
            case 'pharmacy':
                return [
                    {
                        id: 1,
                        title: 'License Info',
                        description: 'License and pharmacy name',
                        icon: Shield,
                        fields: ['license_number', 'pharmacy_name']
                    },
                    {
                        id: 2,
                        title: 'Location Details',
                        description: 'Address and location',
                        icon: MapPin,
                        fields: ['address', 'location']
                    }
                ];
            default:
                return [];
        }
    };

    const steps = getStepsConfig();
    const totalSteps = steps.length;

    useEffect(() => {
        checkProfileStatus();
        if (userType === 'doctor') {
            fetchHospitals();
        }
    }, [userType]);

    const checkProfileStatus = async () => {
        try {
            const user = getCurrentUser();
            if (!user) {
                navigate('/login');
                return;
            }

            setUserData(user);
            setUserType(user.user_type);

            const profileResponse = await profileService.getCurrentProfile();

            if (profileResponse.success && profileResponse.data) {
                toast.info('Profile already completed. Redirecting to dashboard...');
                setTimeout(() => {
                    navigate('/dashboard');
                }, 1500);
                return;
            }

            setLoading(false);
        } catch (error) {
            console.error('Error checking profile status:', error);
            setLoading(false);
        }
    };

    const fetchHospitals = async () => {
        setLoadingHospitals(true);
        try {
            const response = await hospitalService.getAll();
            if (response.success) {
                const hospitalData = response.data.results || response.data || [];
                const activeHospitals = hospitalData.filter(hospital => hospital.is_active);
                setHospitals(activeHospitals);
            } else {
                console.error('Failed to fetch hospitals:', response.error);
                toast.error('Failed to load hospitals. Please refresh the page.');
                setHospitals([]);
            }
        } catch (error) {
            console.error('Error fetching hospitals:', error);
            toast.error('Failed to load hospitals. Please refresh the page.');
            setHospitals([]);
        } finally {
            setLoadingHospitals(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateCurrentStep = () => {
        const currentStepConfig = steps[currentStep - 1];
        const newErrors = {};

        currentStepConfig.fields.forEach(field => {
            switch (field) {
                case 'date_of_birth':
                    if (!formData.date_of_birth) newErrors.date_of_birth = 'Date of birth is required';
                    break;
                case 'emergency_contact':
                    if (!formData.emergency_contact) newErrors.emergency_contact = 'Emergency contact is required';
                    break;
                case 'license_number':
                    if (!formData.license_number) newErrors.license_number = 'License number is required';
                    break;
                case 'specialization':
                    if (!formData.specialization) newErrors.specialization = 'Specialization is required';
                    break;
                case 'hospital':
                    if (!formData.hospital) newErrors.hospital = 'Hospital selection is required';
                    break;
                case 'experience_years':
                    if (!formData.experience_years) {
                        newErrors.experience_years = 'Experience years is required';
                    } else if (formData.experience_years < 0 || formData.experience_years > 50) {
                        newErrors.experience_years = 'Experience years must be between 0 and 50';
                    }
                    break;
                case 'pharmacy_name':
                    if (!formData.pharmacy_name) newErrors.pharmacy_name = 'Pharmacy name is required';
                    break;
                case 'address':
                    if (!formData.address) newErrors.address = 'Address is required';
                    break;
                case 'location':
                    if (!formData.location) newErrors.location = 'Location is required';
                    break;
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (validateCurrentStep()) {
            setCurrentStep(prev => Math.min(prev + 1, totalSteps));
        } else {
            toast.error('Please fill in all required fields correctly');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_data');
        toast.success('Logged out successfully');
        navigate('/login', { replace: true });
    };

    const handlePrevious = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateCurrentStep()) {
            toast.error('Please fill in all required fields correctly');
            return;
        }

        setSubmitting(true);
        try {
            let response;

            switch (userType) {
                case 'patient':
                    response = await profileService.createPatientProfile({
                        date_of_birth: formData.date_of_birth,
                        medical_history: formData.medical_history,
                        emergency_contact: formData.emergency_contact,
                        blood_group: formData.blood_group,
                        allergies: formData.allergies
                    });
                    break;
                case 'doctor':
                    response = await profileService.createDoctorProfile({
                        user: userData.id,
                        license_number: formData.license_number,
                        specialization: formData.specialization,
                        hospital: formData.hospital,
                        experience_years: parseInt(formData.experience_years)
                    });
                    break;
                case 'pharmacy':
                    response = await profileService.createPharmacyProfile({
                        user: userData.id,
                        license_number: formData.license_number,
                        pharmacy_name: formData.pharmacy_name,
                        address: formData.address,
                        location: formData.location
                    });
                    break;
                default:
                    throw new Error('Invalid user type');
            }

            if (response.success) {
                toast.success('Profile completed successfully! Redirecting to dashboard...');
                setTimeout(() => {
                    navigate('/dashboard');
                }, 2000);
            } else {
                throw new Error(response.error || 'Failed to create profile');
            }
        } catch (error) {
            console.error('Profile creation error:', error);
            toast.error(error.message || 'Failed to complete profile. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const renderUserTypeIcon = () => {
        switch (userType) {
            case 'patient':
                return <Heart className="w-12 h-12 text-purple-600" />;
            case 'doctor':
                return <Stethoscope className="w-12 h-12 text-blue-600" />;
            case 'pharmacy':
                return <Building2 className="w-12 h-12 text-green-600" />;
            default:
                return <User className="w-12 h-12 text-gray-600" />;
        }
    };

    const getUserTypeColor = () => {
        switch (userType) {
            case 'patient':
                return 'purple';
            case 'doctor':
                return 'blue';
            case 'pharmacy':
                return 'green';
            default:
                return 'gray';
        }
    };

    const color = getUserTypeColor();

    const renderFormField = (fieldName) => {
        switch (fieldName) {
            case 'date_of_birth':
                return (
                    <div key={fieldName}>
                        <label htmlFor="date_of_birth" className="block text-sm font-medium text-gray-700 mb-2">
                            Date of Birth *
                        </label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                            <input
                                id="date_of_birth"
                                name="date_of_birth"
                                type="date"
                                value={formData.date_of_birth}
                                onChange={handleInputChange}
                                className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-${color}-500 focus:border-transparent transition-colors ${errors.date_of_birth ? 'border-red-300' : 'border-gray-300'}`}
                            />
                        </div>
                        {errors.date_of_birth && <p className="text-red-600 text-sm mt-1">{errors.date_of_birth}</p>}
                    </div>
                );

            case 'emergency_contact':
                return (
                    <div key={fieldName}>
                        <label htmlFor="emergency_contact" className="block text-sm font-medium text-gray-700 mb-2">
                            Emergency Contact *
                        </label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                            <input
                                id="emergency_contact"
                                name="emergency_contact"
                                type="tel"
                                value={formData.emergency_contact}
                                onChange={handleInputChange}
                                placeholder="+250 788 123 456"
                                className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-${color}-500 focus:border-transparent transition-colors ${errors.emergency_contact ? 'border-red-300' : 'border-gray-300'}`}
                            />
                        </div>
                        {errors.emergency_contact && <p className="text-red-600 text-sm mt-1">{errors.emergency_contact}</p>}
                    </div>
                );

            case 'blood_group':
                return (
                    <div key={fieldName}>
                        <label htmlFor="blood_group" className="block text-sm font-medium text-gray-700 mb-2">
                            Blood Group
                        </label>
                        <div className="relative">
                            <Droplet className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                            <select
                                id="blood_group"
                                name="blood_group"
                                value={formData.blood_group}
                                onChange={handleInputChange}
                                className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-${color}-500 focus:border-transparent transition-colors border-gray-300`}
                            >
                                {bloodGroups.map((group) => (
                                    <option key={group.value} value={group.value}>
                                        {group.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                );

            case 'allergies':
                return (
                    <div key={fieldName}>
                        <label htmlFor="allergies" className="block text-sm font-medium text-gray-700 mb-2">
                            Allergies
                        </label>
                        <div className="relative">
                            <AlertCircle className="absolute left-3 top-3 text-gray-400 h-5 w-5" />
                            <textarea
                                id="allergies"
                                name="allergies"
                                rows={3}
                                value={formData.allergies}
                                onChange={handleInputChange}
                                placeholder="List any known allergies (e.g., Penicillin, Peanuts, etc.)"
                                className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-${color}-500 focus:border-transparent transition-colors border-gray-300`}
                            />
                        </div>
                    </div>
                );

            case 'medical_history':
                return (
                    <div key={fieldName}>
                        <label htmlFor="medical_history" className="block text-sm font-medium text-gray-700 mb-2">
                            Medical History
                        </label>
                        <div className="relative">
                            <FileText className="absolute left-3 top-3 text-gray-400 h-5 w-5" />
                            <textarea
                                id="medical_history"
                                name="medical_history"
                                rows={3}
                                value={formData.medical_history}
                                onChange={handleInputChange}
                                placeholder="Describe any significant medical history or ongoing conditions"
                                className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-${color}-500 focus:border-transparent transition-colors border-gray-300`}
                            />
                        </div>
                    </div>
                );

            case 'license_number':
                return (
                    <div key={fieldName}>
                        <label htmlFor="license_number" className="block text-sm font-medium text-gray-700 mb-2">
                            {userType === 'doctor' ? 'Medical' : 'Pharmacy'} License Number *
                        </label>
                        <div className="relative">
                            <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                            <input
                                id="license_number"
                                name="license_number"
                                type="text"
                                value={formData.license_number}
                                onChange={handleInputChange}
                                placeholder={userType === 'doctor' ? 'DR-2024-001234' : 'PH-2024-001234'}
                                className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-${color}-500 focus:border-transparent transition-colors ${errors.license_number ? 'border-red-300' : 'border-gray-300'}`}
                            />
                        </div>
                        {errors.license_number && <p className="text-red-600 text-sm mt-1">{errors.license_number}</p>}
                    </div>
                );

            case 'specialization':
                return (
                    <div key={fieldName}>
                        <label htmlFor="specialization" className="block text-sm font-medium text-gray-700 mb-2">
                            Medical Specialization *
                        </label>
                        <div className="relative">
                            <Award className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                            <select
                                id="specialization"
                                name="specialization"
                                value={formData.specialization}
                                onChange={handleInputChange}
                                className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-${color}-500 focus:border-transparent transition-colors ${errors.specialization ? 'border-red-300' : 'border-gray-300'}`}
                            >
                                <option value="">Select Specialization</option>
                                {specializations.map((spec) => (
                                    <option key={spec} value={spec}>
                                        {spec}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {errors.specialization && <p className="text-red-600 text-sm mt-1">{errors.specialization}</p>}
                    </div>
                );

            case 'hospital':
                return (
                    <div key={fieldName}>
                        <label htmlFor="hospital" className="block text-sm font-medium text-gray-700 mb-2">
                            Hospital/Clinic Affiliation *
                        </label>
                        <div className="relative">
                            <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                            <select
                                id="hospital"
                                name="hospital"
                                value={formData.hospital}
                                onChange={handleInputChange}
                                disabled={loadingHospitals}
                                className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-${color}-500 focus:border-transparent transition-colors ${errors.hospital ? 'border-red-300' : 'border-gray-300'} ${loadingHospitals ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <option value="">
                                    {loadingHospitals ? 'Loading hospitals...' : 'Select Hospital'}
                                </option>
                                {hospitals.map((hospital) => (
                                    <option key={hospital.id} value={hospital.id}>
                                        {hospital.name}
                                    </option>
                                ))}
                            </select>
                            {loadingHospitals && (
                                <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 animate-spin" />
                            )}
                        </div>
                        {errors.hospital && <p className="text-red-600 text-sm mt-1">{errors.hospital}</p>}
                        {hospitals.length === 0 && !loadingHospitals && (
                            <p className="text-amber-600 text-sm mt-1 flex items-center">
                                <AlertCircle className="w-4 h-4 mr-1" />
                                No hospitals available. Please try refreshing the page.
                            </p>
                        )}
                    </div>
                );

            case 'experience_years':
                return (
                    <div key={fieldName}>
                        <label htmlFor="experience_years" className="block text-sm font-medium text-gray-700 mb-2">
                            Years of Experience *
                        </label>
                        <div className="relative">
                            <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                            <input
                                id="experience_years"
                                name="experience_years"
                                type="number"
                                min="0"
                                max="50"
                                value={formData.experience_years}
                                onChange={handleInputChange}
                                placeholder="5"
                                className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-${color}-500 focus:border-transparent transition-colors ${errors.experience_years ? 'border-red-300' : 'border-gray-300'}`}
                            />
                        </div>
                        {errors.experience_years && <p className="text-red-600 text-sm mt-1">{errors.experience_years}</p>}
                    </div>
                );

            case 'pharmacy_name':
                return (
                    <div key={fieldName}>
                        <label htmlFor="pharmacy_name" className="block text-sm font-medium text-gray-700 mb-2">
                            Pharmacy Name *
                        </label>
                        <div className="relative">
                            <Pill className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                            <input
                                id="pharmacy_name"
                                name="pharmacy_name"
                                type="text"
                                value={formData.pharmacy_name}
                                onChange={handleInputChange}
                                placeholder="HealthCare Pharmacy"
                                className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-${color}-500 focus:border-transparent transition-colors ${errors.pharmacy_name ? 'border-red-300' : 'border-gray-300'}`}
                            />
                        </div>
                        {errors.pharmacy_name && <p className="text-red-600 text-sm mt-1">{errors.pharmacy_name}</p>}
                    </div>
                );

            case 'address':
                return (
                    <div key={fieldName}>
                        <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                            Physical Address *
                        </label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-3 text-gray-400 h-5 w-5" />
                            <textarea
                                id="address"
                                name="address"
                                rows={3}
                                value={formData.address}
                                onChange={handleInputChange}
                                placeholder="123 Kigali Street, Gasabo District, Kigali"
                                className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-${color}-500 focus:border-transparent transition-colors ${errors.address ? 'border-red-300' : 'border-gray-300'}`}
                            />
                        </div>
                        {errors.address && <p className="text-red-600 text-sm mt-1">{errors.address}</p>}
                    </div>
                );

            case 'location':
                return (
                    <div key={fieldName}>
                        <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                            City/District *
                        </label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                            <select
                                id="location"
                                name="location"
                                value={formData.location}
                                onChange={handleInputChange}
                                className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-${color}-500 focus:border-transparent transition-colors ${errors.location ? 'border-red-300' : 'border-gray-300'}`}
                            >
                                <option value="">Select Location</option>
                                {rwandaLocations.map((location) => (
                                    <option key={location} value={location}>
                                        {location}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {errors.location && <p className="text-red-600 text-sm mt-1">{errors.location}</p>}
                    </div>
                );

            default:
                return null;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                <div className="flex flex-col items-center space-y-4 text-center">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-blue-200 rounded-full animate-spin"></div>
                        <div className="absolute top-0 left-0 w-16 h-16 border-4 border-blue-600 rounded-full animate-spin border-t-transparent"></div>
                    </div>
                    <div>
                        <h3 className="text-lg font-medium text-gray-900">Checking profile status</h3>
                        <p className="text-gray-600">Please wait a moment...</p>
                    </div>
                </div>
            </div>
        );
    }

    const currentStepConfig = steps[currentStep - 1];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
            <div className="flex flex-col lg:flex-row min-h-screen ">
                {/* Left Sidebar - Progress & Info */}
                <div className={`lg:w-1/3  p-8 lg:p-12`}>
                    <div className="max-w-4xl mx-auto lg:max-w-none ml-10">
                        {/* Header */}
                        <div className="text-center lg:text-left mb-8">
                            <div className="flex justify-center lg:justify-start mb-4">
                                {renderUserTypeIcon()}
                            </div>
                            <h1 className="text-3xl font-bold mb-2">Complete Your Profile</h1>
                            <p className="text-lg opacity-90">
                                Welcome {userData?.first_name}! Let's set up your {userType} profile.
                            </p>
                        </div>

                        {/* Progress Steps */}
                        <div className="space-y-4">
                            {steps.map((step) => {
                                const StepIcon = step.icon;
                                const isCompleted = currentStep > step.id;
                                const isCurrent = currentStep === step.id;

                                return (
                                    <div
                                        key={step.id}
                                        className={`flex items-center space-x-4 p-4 rounded-lg transition-all ${isCurrent
                                            ? 'bg-white bg-opacity-20 shadow-lg'
                                            : isCompleted
                                                ? 'bg-white bg-opacity-10'
                                                : 'opacity-60'
                                            }`}
                                    >
                                        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${isCompleted
                                            ? 'bg-green-500 text-white'
                                            : isCurrent
                                                ? 'bg-white text-black-800'
                                                : 'bg-white bg-opacity-20 text-white'
                                            }`}>
                                            {isCompleted ? (
                                                <CheckCircle className="w-5 h-5" />
                                            ) : (
                                                <StepIcon className="w-5 h-5" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-lg">{step.title}</h3>
                                            <p className="text-sm opacity-90">{step.description}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Progress Bar */}
                        <div className="mt-8">
                            <div className="flex justify-between text-sm mb-2">
                                <span>Progress</span>
                                <span>{Math.round((currentStep / totalSteps) * 100)}%</span>
                            </div>
                            <div className="w-full bg-black bg-opacity-20 rounded-full h-3">
                                <div
                                    className="bg-orange-500 h-3 rounded-full transition-all duration-300 ease-out"
                                    style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                                ></div>
                            </div>
                        </div>

                        {/* Tips */}
                        <div className="mt-8 p-4 bg-white bg-opacity-10 rounded-lg">
                            <div className="flex items-start space-x-3">
                                <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-medium mb-1">Quick Tip</h4>
                                    <p className="text-sm opacity-90">
                                        {userType === 'patient' && currentStep === 1 && "Accurate personal information helps us provide better healthcare services."}
                                        {userType === 'patient' && currentStep === 2 && "Medical history and allergies are crucial for safe treatment."}
                                        {userType === 'doctor' && currentStep === 1 && "Your credentials help patients find the right specialist for their needs."}
                                        {userType === 'doctor' && currentStep === 2 && "Hospital affiliation and experience build patient trust."}
                                        {userType === 'pharmacy' && currentStep === 1 && "Valid licensing ensures compliance with healthcare regulations."}
                                        {userType === 'pharmacy' && currentStep === 2 && "Accurate location helps patients find your pharmacy easily."}
                                    </p>
                                </div>
                            </div>
                        </div>
                        {/* Additional Actions Section */}
                        <div className="mt-6 space-y-4">

                            {/* Profile Completion Reminder */}
                            {currentStep < totalSteps && (
                                <div className="p-3 bg-blue-500 bg-opacity-20 rounded-lg border border-blue-400 border-opacity-30">
                                    <div className="flex items-start space-x-3">
                                        <Clock className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-300" />
                                        <div className="text-sm">
                                            <p className="text-blue-100">
                                                Complete your profile to access all features and start using the platform.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Security Notice */}
                            <div className="p-3 bg-white bg-opacity-5 rounded-lg">
                                <div className="flex items-start space-x-3 text-x text-gray-900">
                                    <Shield className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                    <p>
                                        Your information is encrypted and secure. We follow HIPAA compliance standards
                                        to protect your healthcare data.
                                    </p>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="pt-4 border-t border-white border-opacity-10">
                                <div className="flex flex-col space-y-3">

                                    {/* Logout Button */}
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center justify-center space-x-2 w-full py-2 px-4 bg-red-500 bg-opacity-20 hover:bg-opacity-30 text-red-200 hover:text-red-100 rounded-lg transition-all duration-200 text-sm border border-red-500 border-opacity-30"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        <span>Logout</span>
                                    </button>
                                </div>
                            </div>

                            {/* Footer Text */}
                            <div className="text-center text-xs text-gray-400 mt-4">
                                <p>© 2024 HealthCare Platform. All rights reserved.</p>
                            </div>
                        </div>




                    </div>
                </div>

                {/* Right Content - Form */}
                <div className="lg:w-2/3 flex items-center justify-center p-2 lg:p-12">
                    <div className="w-full max-w-2xl">
                        <form onSubmit={handleSubmit}>
                            {/* Step Header */}
                            <div className="text-center mb-8">
                                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-${color}-100 mb-4`}>
                                    {React.createElement(currentStepConfig.icon, {
                                        className: `w-8 h-8 text-${color}-600`
                                    })}
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                    {currentStepConfig.title}
                                </h2>
                                <p className="text-gray-600">
                                    {currentStepConfig.description}
                                </p>
                            </div>

                            {/* Form Fields */}
                            <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
                                <div className="space-y-6">
                                    {currentStepConfig.fields.map(field => renderFormField(field))}
                                </div>
                            </div>

                            {/* Navigation Buttons */}
                            <div className="flex justify-between items-center">
                                {currentStep > 1 ? (
                                    <button
                                        type="button"
                                        onClick={handlePrevious}
                                        className="flex items-center px-6 py-3 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-colors"
                                    >
                                        <ChevronLeft className="w-4 h-4 mr-2" />
                                        Previous
                                    </button>
                                ) : (
                                    <div></div>
                                )}

                                {currentStep < totalSteps ? (
                                    <button
                                        type="button"
                                        onClick={handleNext}
                                        className={`flex items-center px-6 py-3 bg-${color}-600 text-white rounded-lg hover:bg-${color}-700 focus:outline-none focus:ring-2 focus:ring-${color}-500 focus:ring-offset-2 transition-colors`}
                                    >
                                        Next
                                        <ChevronRight className="w-4 h-4 ml-2" />
                                    </button>
                                ) : (
                                    <button
                                        type="submit"
                                        disabled={submitting || (userType === 'doctor' && loadingHospitals)}
                                        className={`flex items-center px-8 py-3 bg-${color}-600 text-white rounded-lg hover:bg-${color}-700 focus:outline-none focus:ring-2 focus:ring-${color}-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
                                    >
                                        {submitting ? (
                                            <>
                                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                                Completing...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="w-5 h-5 mr-2" />
                                                Complete Profile
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>

                            {/* Step Indicator */}
                            <div className="flex justify-center mt-8">
                                <div className="flex space-x-2">
                                    {steps.map((_, index) => (
                                        <div
                                            key={index}
                                            className={`w-3 h-3 rounded-full transition-colors ${index + 1 <= currentStep
                                                ? `bg-${color}-600`
                                                : 'bg-gray-300'
                                                }`}
                                        />
                                    ))}
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileCompletionPage;