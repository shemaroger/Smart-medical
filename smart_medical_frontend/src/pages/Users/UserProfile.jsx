import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    User, Mail, Phone, MapPin, Calendar, Shield, Building2,
    Award, LogOut, CheckCircle, AlertCircle, Camera, Heart,
    Clock, FileText, Users, Badge, Hospital
} from 'lucide-react';
import { toast } from 'react-toastify';
import { getCurrentUser, profileService } from '../../api';

const UserProfilePage = () => {
    const navigate = useNavigate();
    const [userData, setUserData] = useState(null);
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Fetch user and profile data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const storedUser = getCurrentUser();
                if (!storedUser) {
                    navigate('/login');
                    return;
                }
                setUserData(storedUser);

                if (storedUser.hasProfile) {
                    const profileResponse = await profileService.getCurrentProfile();
                    if (profileResponse.success) {
                        setProfileData(profileResponse.data);
                    }
                }
            } catch (error) {
                console.error('Error fetching data:', error);
                toast.error('Failed to load profile data.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [navigate]);

    // Handle logout
    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_data');
        toast.success('Logged out successfully');
        navigate('/login');
    };

    // Get user type color
    const getUserTypeColor = (userType) => {
        switch (userType) {
            case 'doctor': return 'bg-blue-500';
            case 'patient': return 'bg-green-500';
            case 'pharmacy': return 'bg-purple-500';
            default: return 'bg-gray-500';
        }
    };

    // Get user type icon
    const getUserTypeIcon = (userType) => {
        switch (userType) {
            case 'doctor': return <Award className="w-6 h-6" />;
            case 'patient': return <User className="w-6 h-6" />;
            case 'pharmacy': return <Building2 className="w-6 h-6" />;
            default: return <User className="w-6 h-6" />;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
                    <p className="text-gray-600 text-lg">Loading your profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">


            <div className="max-w-6xl mx-auto px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Profile Card */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl shadow-sm p-6 sticky top-8">
                            {/* Profile Avatar */}
                            <div className="text-center mb-6">
                                <div className="relative mx-auto w-32 h-32 mb-4">
                                    <div className={`w-full h-full rounded-full ${getUserTypeColor(userData?.user_type)} flex items-center justify-center text-white text-3xl font-bold shadow-lg`}>
                                        {userData?.first_name?.[0]}{userData?.last_name?.[0]}
                                    </div>
                                    <div className="absolute bottom-2 right-2 bg-white rounded-full p-2 shadow-lg">
                                        {getUserTypeIcon(userData?.user_type)}
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900">
                                    {userData?.first_name} {userData?.last_name}
                                </h3>
                                <p className="text-gray-500 capitalize text-lg mt-1">{userData?.user_type}</p>

                                {/* Status Badge */}
                                <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium mt-3 ${userData?.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                    }`}>
                                    <div className={`w-2 h-2 rounded-full mr-2 ${userData?.is_active ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                    {userData?.is_active ? 'Active Account' : 'Inactive Account'}
                                </div>
                            </div>

                            {/* Quick Stats */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <span className="text-sm text-gray-600">Profile Status</span>
                                    <CheckCircle className={`w-5 h-5 ${userData?.hasProfile ? 'text-green-500' : 'text-orange-500'}`} />
                                </div>
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <span className="text-sm text-gray-600">Phone Verified</span>
                                    <CheckCircle className={`w-5 h-5 ${userData?.is_phone_verified ? 'text-green-500' : 'text-orange-500'}`} />
                                </div>
                                {profileData?.is_verified !== undefined && (
                                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <span className="text-sm text-gray-600">
                                            {userData?.user_type === 'doctor' ? 'Medical License' : 'License Verified'}
                                        </span>
                                        <CheckCircle className={`w-5 h-5 ${profileData?.is_verified ? 'text-green-500' : 'text-orange-500'}`} />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-3 space-y-6">
                        {/* Basic Information */}
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                                <User className="w-6 h-6 mr-3 text-blue-600" />
                                Personal Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-500">First Name</label>
                                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                        <User className="w-5 h-5 text-gray-400" />
                                        <span className="text-gray-900 font-medium">{userData?.first_name}</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-500">Last Name</label>
                                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                        <User className="w-5 h-5 text-gray-400" />
                                        <span className="text-gray-900 font-medium">{userData?.last_name}</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-500">Email Address</label>
                                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                        <Mail className="w-5 h-5 text-gray-400" />
                                        <span className="text-gray-900 font-medium">{userData?.email}</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-500">Phone Number</label>
                                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                        <Phone className="w-5 h-5 text-gray-400" />
                                        <span className="text-gray-900 font-medium">{userData?.phone_number}</span>
                                    </div>
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-sm font-medium text-gray-500">Location</label>
                                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                        <MapPin className="w-5 h-5 text-gray-400" />
                                        <span className="text-gray-900 font-medium">{userData?.location || 'Not specified'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Doctor-specific Information */}
                        {userData?.user_type === 'doctor' && profileData && (
                            <div className="bg-white rounded-xl shadow-sm p-6">
                                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                                    <Award className="w-6 h-6 mr-3 text-blue-600" />
                                    Medical Practice Details
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-500">License Number</label>
                                        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                            <Shield className="w-5 h-5 text-gray-400" />
                                            <span className="text-gray-900 font-medium">{profileData.license_number}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-500">Specialization</label>
                                        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                            <Award className="w-5 h-5 text-gray-400" />
                                            <span className="text-gray-900 font-medium">{profileData.specialization}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-500">Hospital</label>
                                        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                            <Hospital className="w-5 h-5 text-gray-400" />
                                            <span className="text-gray-900 font-medium">{profileData.hospital?.name || 'Not specified'}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-500">Experience</label>
                                        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                            <Clock className="w-5 h-5 text-gray-400" />
                                            <span className="text-gray-900 font-medium">{profileData.experience_years} years</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Patient-specific Information */}
                        {userData?.user_type === 'patient' && profileData && (
                            <div className="bg-white rounded-xl shadow-sm p-6">
                                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                                    <Heart className="w-6 h-6 mr-3 text-red-600" />
                                    Medical Information
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-500">Date of Birth</label>
                                        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                            <Calendar className="w-5 h-5 text-gray-400" />
                                            <span className="text-gray-900 font-medium">{profileData.date_of_birth}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-500">Blood Group</label>
                                        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                            <Heart className="w-5 h-5 text-gray-400" />
                                            <span className="text-gray-900 font-medium">{profileData.blood_group || 'Not specified'}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-500">Emergency Contact</label>
                                        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                            <Phone className="w-5 h-5 text-gray-400" />
                                            <span className="text-gray-900 font-medium">{profileData.emergency_contact}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-sm font-medium text-gray-500">Allergies</label>
                                        <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                                            <AlertCircle className="w-5 h-5 text-gray-400 mt-0.5" />
                                            <span className="text-gray-900 font-medium">{profileData.allergies || 'No known allergies'}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-sm font-medium text-gray-500">Medical History</label>
                                        <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                                            <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                                            <span className="text-gray-900 font-medium">{profileData.medical_history || 'No medical history recorded'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Pharmacy-specific Information */}
                        {userData?.user_type === 'pharmacy' && profileData && (
                            <div className="bg-white rounded-xl shadow-sm p-6">
                                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                                    <Building2 className="w-6 h-6 mr-3 text-purple-600" />
                                    Pharmacy Details
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-500">Pharmacy Name</label>
                                        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                            <Building2 className="w-5 h-5 text-gray-400" />
                                            <span className="text-gray-900 font-medium">{profileData.pharmacy_name}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-500">License Number</label>
                                        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                            <Shield className="w-5 h-5 text-gray-400" />
                                            <span className="text-gray-900 font-medium">{profileData.license_number}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-500">Location</label>
                                        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                            <MapPin className="w-5 h-5 text-gray-400" />
                                            <span className="text-gray-900 font-medium">{profileData.location}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-sm font-medium text-gray-500">Address</label>
                                        <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                                            <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                                            <span className="text-gray-900 font-medium">{profileData.address}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Account Statistics */}
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                                <Badge className="w-6 h-6 mr-3 text-green-600" />
                                Account Overview
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="text-center p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
                                    <CheckCircle className={`w-8 h-8 mx-auto mb-2 ${userData?.is_active ? 'text-green-500' : 'text-red-500'}`} />
                                    <p className="font-semibold text-gray-900">Account Status</p>
                                    <p className="text-sm text-gray-600">{userData?.is_active ? 'Active' : 'Inactive'}</p>
                                </div>
                                <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                                    <Phone className={`w-8 h-8 mx-auto mb-2 ${userData?.is_phone_verified ? 'text-green-500' : 'text-orange-500'}`} />
                                    <p className="font-semibold text-gray-900">Phone Status</p>
                                    <p className="text-sm text-gray-600">{userData?.is_phone_verified ? 'Verified' : 'Pending'}</p>
                                </div>
                                <div className="text-center p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg">
                                    <User className={`w-8 h-8 mx-auto mb-2 ${userData?.hasProfile ? 'text-green-500' : 'text-orange-500'}`} />
                                    <p className="font-semibold text-gray-900">Profile Status</p>
                                    <p className="text-sm text-gray-600">{userData?.hasProfile ? 'Complete' : 'Incomplete'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserProfilePage;