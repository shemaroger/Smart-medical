import React, { useState } from 'react';
import {
    Stethoscope,
    Eye,
    EyeOff,
    Mail,
    Lock,
    User,
    Phone,
    MapPin,
    ArrowLeft,
    AlertCircle,
    Loader2,
    CheckCircle,
    Building2,
    Globe,
    Save,
    X
} from 'lucide-react';
import { toast } from 'react-toastify';
import { authService } from '../../api';

const AddUserForm = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        password_confirm: '',
        first_name: '',
        last_name: '',
        phone_number: '',
        user_type: '',
        preferred_language: 'en',
        location: ''
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const userTypes = [
        {
            value: 'doctor',
            label: 'Doctor',
            icon: <Stethoscope className="w-5 h-5" />,
            description: 'Medical practitioner providing healthcare services'
        },
        {
            value: 'pharmacy',
            label: 'Pharmacy',
            icon: <Building2 className="w-5 h-5" />,
            description: 'Pharmaceutical service provider managing medications'
        }
    ];

    const languages = [
        { value: 'en', label: 'English' },
        { value: 'rw', label: 'Kinyarwanda' },
        { value: 'fr', label: 'French' }
    ];

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear specific field error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.user_type) {
            newErrors.user_type = 'Please select a user type';
        }
        if (!formData.first_name.trim()) {
            newErrors.first_name = 'First name is required';
        }
        if (!formData.last_name.trim()) {
            newErrors.last_name = 'Last name is required';
        }
        if (!formData.username.trim()) {
            newErrors.username = 'Username is required';
        }
        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }
        if (!formData.phone_number.trim()) {
            newErrors.phone_number = 'Phone number is required';
        }
        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters long';
        }
        if (!formData.password_confirm) {
            newErrors.password_confirm = 'Please confirm your password';
        } else if (formData.password !== formData.password_confirm) {
            newErrors.password_confirm = 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            toast.error('Please fix the errors in the form');
            return;
        }

        setIsLoading(true);

        try {
            console.log('Creating user:', formData);
            const response = await authService.register(formData);

            if (response && response.success) {
                toast.success('User created successfully!');
                // Reset form
                setFormData({
                    username: '',
                    email: '',
                    password: '',
                    password_confirm: '',
                    first_name: '',
                    last_name: '',
                    phone_number: '',
                    user_type: '',
                    preferred_language: 'en',
                    location: ''
                });
                // Navigate back or to users list
                setTimeout(() => {
                    window.history.back(); // or use your navigation method
                }, 1500);
            } else {
                toast.error(response?.message || 'Failed to create user. Please try again.');
            }
        } catch (err) {
            console.error('Error creating user:', err);
            toast.error('An unexpected error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        // Navigate back to users list
        window.history.back(); // or use your navigation method
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Add New User</h1>
                    <p className="text-sm text-gray-600 mt-1">
                        Create a new doctor or pharmacy account
                    </p>
                </div>
                <button
                    onClick={handleCancel}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Users
                </button>
            </div>

            {/* Form */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* User Type Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            User Type <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {userTypes.map((type) => (
                                <label key={type.value} className="cursor-pointer">
                                    <input
                                        type="radio"
                                        name="user_type"
                                        value={type.value}
                                        checked={formData.user_type === type.value}
                                        onChange={handleInputChange}
                                        className="sr-only"
                                    />
                                    <div className={`border-2 rounded-lg p-4 flex items-center space-x-3 transition-all ${formData.user_type === type.value
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                        } ${errors.user_type ? 'border-red-300' : ''}`}>
                                        <div className={`${formData.user_type === type.value
                                            ? 'text-blue-600'
                                            : 'text-gray-400'
                                            }`}>
                                            {type.icon}
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-medium text-gray-900">{type.label}</div>
                                            <div className="text-sm text-gray-500">{type.description}</div>
                                        </div>
                                    </div>
                                </label>
                            ))}
                        </div>
                        {errors.user_type && (
                            <p className="mt-1 text-sm text-red-600">{errors.user_type}</p>
                        )}
                    </div>

                    {/* Personal Information */}
                    <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* First Name */}
                            <div>
                                <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-2">
                                    First Name <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <User className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="first_name"
                                        name="first_name"
                                        type="text"
                                        value={formData.first_name}
                                        onChange={handleInputChange}
                                        className={`appearance-none relative block w-full pl-10 pr-3 py-3 border placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.first_name ? 'border-red-300' : 'border-gray-300'
                                            }`}
                                        placeholder="Enter first name"
                                    />
                                </div>
                                {errors.first_name && (
                                    <p className="mt-1 text-sm text-red-600">{errors.first_name}</p>
                                )}
                            </div>

                            {/* Last Name */}
                            <div>
                                <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-2">
                                    Last Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="last_name"
                                    name="last_name"
                                    type="text"
                                    value={formData.last_name}
                                    onChange={handleInputChange}
                                    className={`appearance-none relative block w-full px-3 py-3 border placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.last_name ? 'border-red-300' : 'border-gray-300'
                                        }`}
                                    placeholder="Enter last name"
                                />
                                {errors.last_name && (
                                    <p className="mt-1 text-sm text-red-600">{errors.last_name}</p>
                                )}
                            </div>

                            {/* Username */}
                            <div>
                                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                                    Username <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <User className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="username"
                                        name="username"
                                        type="text"
                                        value={formData.username}
                                        onChange={handleInputChange}
                                        className={`appearance-none relative block w-full pl-10 pr-3 py-3 border placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.username ? 'border-red-300' : 'border-gray-300'
                                            }`}
                                        placeholder="Choose a username"
                                    />
                                </div>
                                {errors.username && (
                                    <p className="mt-1 text-sm text-red-600">{errors.username}</p>
                                )}
                            </div>

                            {/* Email */}
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                    Email Address <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        className={`appearance-none relative block w-full pl-10 pr-3 py-3 border placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.email ? 'border-red-300' : 'border-gray-300'
                                            }`}
                                        placeholder="user@example.com"
                                    />
                                </div>
                                {errors.email && (
                                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                                )}
                            </div>

                            {/* Phone Number */}
                            <div>
                                <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700 mb-2">
                                    Phone Number <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Phone className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="phone_number"
                                        name="phone_number"
                                        type="tel"
                                        value={formData.phone_number}
                                        onChange={handleInputChange}
                                        className={`appearance-none relative block w-full pl-10 pr-3 py-3 border placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.phone_number ? 'border-red-300' : 'border-gray-300'
                                            }`}
                                        placeholder="+250 788 123 456"
                                    />
                                </div>
                                {errors.phone_number && (
                                    <p className="mt-1 text-sm text-red-600">{errors.phone_number}</p>
                                )}
                            </div>

                            {/* Location */}
                            <div>
                                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                                    Location
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <MapPin className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="location"
                                        name="location"
                                        type="text"
                                        value={formData.location}
                                        onChange={handleInputChange}
                                        className="appearance-none relative block w-full pl-10 pr-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Kigali, Rwanda"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Account Settings */}
                    <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Account Settings</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Language Preference */}
                            <div>
                                <label htmlFor="preferred_language" className="block text-sm font-medium text-gray-700 mb-2">
                                    Preferred Language
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Globe className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <select
                                        id="preferred_language"
                                        name="preferred_language"
                                        value={formData.preferred_language}
                                        onChange={handleInputChange}
                                        className="appearance-none relative block w-full pl-10 pr-3 py-3 border border-gray-300 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        {languages.map((lang) => (
                                            <option key={lang.value} value={lang.value}>
                                                {lang.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                    Password <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="password"
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        className={`appearance-none relative block w-full pl-10 pr-10 py-3 border placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.password ? 'border-red-300' : 'border-gray-300'
                                            }`}
                                        placeholder="Create password"
                                    />
                                    <button
                                        type="button"
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ?
                                            <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" /> :
                                            <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                                        }
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label htmlFor="password_confirm" className="block text-sm font-medium text-gray-700 mb-2">
                                    Confirm Password <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="password_confirm"
                                        name="password_confirm"
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        value={formData.password_confirm}
                                        onChange={handleInputChange}
                                        className={`appearance-none relative block w-full pl-10 pr-10 py-3 border placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.password_confirm ? 'border-red-300' : 'border-gray-300'
                                            }`}
                                        placeholder="Confirm password"
                                    />
                                    <button
                                        type="button"
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    >
                                        {showConfirmPassword ?
                                            <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" /> :
                                            <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                                        }
                                    </button>
                                </div>
                                {errors.password_confirm && (
                                    <p className="mt-1 text-sm text-red-600">{errors.password_confirm}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="px-6 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="inline-flex items-center justify-center gap-2 px-6 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            aria-busy={isLoading}
                            aria-live="polite"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />
                                    <span>Creating User...</span>
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 shrink-0" aria-hidden="true" />
                                    <span>Create User</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddUserForm;