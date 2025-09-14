import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Stethoscope, User, Calendar, Phone, MapPin, FileText, Droplet,
    AlertCircle, Building2, Award, Clock, Shield, Pill, Loader2,
    CheckCircle, ArrowRight, Eye, EyeOff, Heart, UserCheck
} from 'lucide-react';
import { toast } from 'react-toastify';
import { profileService, getCurrentUser } from '../../api';

const ProfileCompletionPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [userType, setUserType] = useState('');
    const [userData, setUserData] = useState(null);
    const [hospitals, setHospitals] = useState([]);

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

    // Mock hospitals data - replace with API call
    const mockHospitals = [
        { id: 1, name: 'University Teaching Hospital of Kigali (CHUK)' },
        { id: 2, name: 'King Faisal Hospital Rwanda' },
        { id: 3, name: 'Rwanda Military Hospital' },
        { id: 4, name: 'Kibagabaga Hospital' },
        { id: 5, name: 'Butare University Teaching Hospital (CHUB)' },
        { id: 6, name: 'Rwamagana Hospital' },
        { id: 7, name: 'Muhima Hospital' },
        { id: 8, name: 'Nyagatare Hospital' }
    ];

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

    useEffect(() => {
        checkProfileStatus();
        setHospitals(mockHospitals);
    }, []);

    const checkProfileStatus = async () => {
        try {
            const user = getCurrentUser();
            if (!user) {
                navigate('/login');
                return;
            }

            setUserData(user);
            setUserType(user.user_type);

            // Check if profile already exists
            const profileResponse = await profileService.getCurrentProfile();

            if (profileResponse.success && profileResponse.data) {
                // Profile exists, redirect to dashboard
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

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        switch (userType) {
            case 'patient':
                if (!formData.date_of_birth) newErrors.date_of_birth = 'Date of birth is required';
                if (!formData.emergency_contact) newErrors.emergency_contact = 'Emergency contact is required';
                break;

            case 'doctor':
                if (!formData.license_number) newErrors.license_number = 'License number is required';
                if (!formData.specialization) newErrors.specialization = 'Specialization is required';
                if (!formData.hospital) newErrors.hospital = 'Hospital selection is required';
                if (!formData.experience_years) newErrors.experience_years = 'Experience years is required';
                else if (formData.experience_years < 0 || formData.experience_years > 50) {
                    newErrors.experience_years = 'Experience years must be between 0 and 50';
                }
                break;

            case 'pharmacy':
                if (!formData.license_number) newErrors.license_number = 'License number is required';
                if (!formData.pharmacy_name) newErrors.pharmacy_name = 'Pharmacy name is required';
                if (!formData.address) newErrors.address = 'Address is required';
                if (!formData.location) newErrors.location = 'Location is required';
                break;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) {
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
                        user: userData.id, // Add user ID
                        license_number: formData.license_number,
                        specialization: formData.specialization,
                        hospital: formData.hospital,
                        experience_years: parseInt(formData.experience_years)
                    });
                    break;
                case 'pharmacy':
                    response = await profileService.createPharmacyProfile({
                        user: userData.id, // Add user ID
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
                return <Heart className="w-8 h-8 text-purple-600" />;
            case 'doctor':
                return <Stethoscope className="w-8 h-8 text-blue-600" />;
            case 'pharmacy':
                return <Building2 className="w-8 h-8 text-green-600" />;
            default:
                return <User className="w-8 h-8 text-gray-600" />;
        }
    };

    const renderForm = () => {
        switch (userType) {
            case 'patient':
                return (
                    <>
                        <div>
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
                                    className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${errors.date_of_birth ? 'border-red-300' : 'border-gray-300'
                                        }`}
                                />
                            </div>
                            {errors.date_of_birth && <p className="text-red-600 text-sm mt-1">{errors.date_of_birth}</p>}
                        </div>

                        <div>
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
                                    className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${errors.emergency_contact ? 'border-red-300' : 'border-gray-300'
                                        }`}
                                />
                            </div>
                            {errors.emergency_contact && <p className="text-red-600 text-sm mt-1">{errors.emergency_contact}</p>}
                        </div>

                        <div>
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
                                    className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                >
                                    {bloodGroups.map((group) => (
                                        <option key={group.value} value={group.value}>
                                            {group.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
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
                                    className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        <div>
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
                                    className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                    </>
                );

            case 'doctor':
                return (
                    <>
                        <div>
                            <label htmlFor="license_number" className="block text-sm font-medium text-gray-700 mb-2">
                                Medical License Number *
                            </label>
                            <div className="relative">
                                <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                                <input
                                    id="license_number"
                                    name="license_number"
                                    type="text"
                                    value={formData.license_number}
                                    onChange={handleInputChange}
                                    placeholder="DR-2024-001234"
                                    className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.license_number ? 'border-red-300' : 'border-gray-300'
                                        }`}
                                />
                            </div>
                            {errors.license_number && <p className="text-red-600 text-sm mt-1">{errors.license_number}</p>}
                        </div>

                        <div>
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
                                    className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.specialization ? 'border-red-300' : 'border-gray-300'
                                        }`}
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

                        <div>
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
                                    className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.hospital ? 'border-red-300' : 'border-gray-300'
                                        }`}
                                >
                                    <option value="">Select Hospital</option>
                                    {hospitals.map((hospital) => (
                                        <option key={hospital.name} value={hospital.name}>
                                            {hospital.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {errors.hospital && <p className="text-red-600 text-sm mt-1">{errors.hospital}</p>}
                        </div>

                        <div>
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
                                    className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.experience_years ? 'border-red-300' : 'border-gray-300'
                                        }`}
                                />
                            </div>
                            {errors.experience_years && <p className="text-red-600 text-sm mt-1">{errors.experience_years}</p>}
                        </div>
                    </>
                );

            case 'pharmacy':
                return (
                    <>
                        <div>
                            <label htmlFor="license_number" className="block text-sm font-medium text-gray-700 mb-2">
                                Pharmacy License Number *
                            </label>
                            <div className="relative">
                                <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                                <input
                                    id="license_number"
                                    name="license_number"
                                    type="text"
                                    value={formData.license_number}
                                    onChange={handleInputChange}
                                    placeholder="PH-2024-001234"
                                    className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${errors.license_number ? 'border-red-300' : 'border-gray-300'
                                        }`}
                                />
                            </div>
                            {errors.license_number && <p className="text-red-600 text-sm mt-1">{errors.license_number}</p>}
                        </div>

                        <div>
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
                                    className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${errors.pharmacy_name ? 'border-red-300' : 'border-gray-300'
                                        }`}
                                />
                            </div>
                            {errors.pharmacy_name && <p className="text-red-600 text-sm mt-1">{errors.pharmacy_name}</p>}
                        </div>

                        <div>
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
                                    className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${errors.address ? 'border-red-300' : 'border-gray-300'
                                        }`}
                                />
                            </div>
                            {errors.address && <p className="text-red-600 text-sm mt-1">{errors.address}</p>}
                        </div>

                        <div>
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
                                    className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${errors.location ? 'border-red-300' : 'border-gray-300'
                                        }`}
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
                    </>
                );

            default:
                return <div>Invalid user type</div>;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="flex flex-col items-center space-y-4">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    <p className="text-gray-600">Checking profile status...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8 text-center">
                    <div className="flex justify-center mb-4">
                        {renderUserTypeIcon()}
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">
                        Complete Your Profile
                    </h1>
                    <p className="text-blue-100 text-sm">
                        Welcome {userData?.first_name}! Please complete your {userType} profile to access the dashboard.
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="px-6 py-8 space-y-6">
                    {renderForm()}

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {submitting ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                Complete Profile
                                <ArrowRight className="ml-2 w-4 h-4" />
                            </>
                        )}
                    </button>

                    <div className="text-center">
                        <p className="text-xs text-gray-500"></p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProfileCompletionPage;
