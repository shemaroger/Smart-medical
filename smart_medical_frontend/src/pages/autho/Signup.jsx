import React, { useState } from 'react';
import {
    Stethoscope,
    Eye, EyeOff, Mail, Lock, User, Phone, MapPin,
    ArrowRight, AlertCircle, Loader2, CheckCircle,
    Heart, UserCheck, Building2, Globe, ArrowLeft
} from 'lucide-react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { authService } from '../../api';

const MultiStepSignupPage = () => {
    const [formData, setFormData] = useState({
        username: '', email: '', password: '', password_confirm: '',
        first_name: '', last_name: '', phone_number: '',
        user_type: '', preferred_language: 'en', location: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [currentStep, setCurrentStep] = useState(1);
    const totalSteps = 4;

    const userTypes = [
        { value: 'patient', label: 'Patient', icon: <Heart className="w-5 h-5" />, description: 'Book appointments and manage prescriptions' }
    ];
    const languages = [{ value: 'en', label: 'English' }];

    const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (error) setError('');
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (currentStep < totalSteps) {
                nextStep();
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        if (formData.password !== formData.password_confirm) {
            toast.error('Passwords do not match');
            setIsLoading(false);
            return;
        }
        try {
            const response = await authService.register(formData);
            if (response) {
                toast.success('Registration successful! Redirecting to login...');
                setTimeout(() => { window.location.href = '/login'; }, 2000);
            } else {
                toast.error('An unexpected error occurred. Please try again.');
            }
        } catch (err) {
            toast.error('An unexpected error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const inputClass = "appearance-none block w-full pl-10 pr-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500";

    const renderStep = () => {
        switch (currentStep) {
            case 1:
                return (
                    <>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                I am registering as
                            </label>
                            <div className="grid grid-cols-1 gap-3">
                                {userTypes.map((type) => (
                                    <label key={type.value} className="cursor-pointer">
                                        <input
                                            type="radio"
                                            name="user_type"
                                            value={type.value}
                                            checked={formData.user_type === type.value}
                                            onChange={handleInputChange}
                                            onKeyDown={handleKeyDown}
                                            className="sr-only"
                                            required
                                        />
                                        <div className={`border-2 rounded-lg p-4 flex items-center space-x-3 transition-all ${formData.user_type === type.value ? 'border-green-600 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}>
                                            <div className={formData.user_type === type.value ? 'text-green-700' : 'text-gray-400'}>
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
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-2">
                                    First Name
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <User className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="first_name"
                                        name="first_name"
                                        type="text"
                                        required
                                        value={formData.first_name}
                                        onChange={handleInputChange}
                                        onKeyDown={handleKeyDown}
                                        className={inputClass}
                                        placeholder="First name"
                                    />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-2">
                                    Last Name
                                </label>
                                <input
                                    id="last_name"
                                    name="last_name"
                                    type="text"
                                    required
                                    value={formData.last_name}
                                    onChange={handleInputChange}
                                    onKeyDown={handleKeyDown}
                                    className="appearance-none block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                    placeholder="Last name"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                                Username
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="username"
                                    name="username"
                                    type="text"
                                    required
                                    value={formData.username}
                                    onChange={handleInputChange}
                                    onKeyDown={handleKeyDown}
                                    className={inputClass}
                                    placeholder="Choose a username"
                                />
                            </div>
                        </div>
                    </>
                );

            case 2:
                return (
                    <>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                Email Address
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    onKeyDown={handleKeyDown}
                                    className={inputClass}
                                    placeholder="your.email@example.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700 mb-2">
                                Phone Number
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Phone className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="phone_number"
                                    name="phone_number"
                                    type="tel"
                                    required
                                    value={formData.phone_number}
                                    onChange={handleInputChange}
                                    onKeyDown={handleKeyDown}
                                    className={inputClass}
                                    placeholder="+250 788 123 456"
                                />
                            </div>
                        </div>

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
                                    onKeyDown={handleKeyDown}
                                    className={inputClass}
                                    placeholder="Kigali, Rwanda"
                                />
                            </div>
                        </div>
                    </>
                );

            case 3:
                return (
                    <>
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
                                    onKeyDown={handleKeyDown}
                                    className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-300 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                >
                                    {languages.map(lang => (
                                        <option key={lang.value} value={lang.value}>{lang.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    onKeyDown={handleKeyDown}
                                    className="appearance-none block w-full pl-10 pr-10 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                    placeholder="Create a password"
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword
                                        ? <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                                        : <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password_confirm" className="block text-sm font-medium text-gray-700 mb-2">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="password_confirm"
                                    name="password_confirm"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    required
                                    value={formData.password_confirm}
                                    onChange={handleInputChange}
                                    onKeyDown={handleKeyDown}
                                    className="appearance-none block w-full pl-10 pr-10 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                    placeholder="Confirm your password"
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    {showConfirmPassword
                                        ? <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                                        : <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />}
                                </button>
                            </div>
                        </div>
                    </>
                );

            case 4:
                return (
                    <div className="flex items-start">
                        <input
                            id="terms"
                            name="terms"
                            type="checkbox"
                            required
                            onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(e); }}
                            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded mt-1"
                        />
                        <label htmlFor="terms" className="ml-3 block text-sm text-gray-700">
                            I agree to the{' '}
                            <a href="#" className="text-green-700 hover:text-green-600">Terms of Service</a>
                            {' '}and{' '}
                            <a href="#" className="text-green-700 hover:text-green-600">Privacy Policy</a>
                        </label>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left Side - Branding */}
            <div className="hidden lg:flex flex-1 bg-gradient-to-br from-green-900 via-green-900 to-emerald-800 items-center justify-center p-12">
                <div className="max-w-lg text-white">
                    {/* Logo */}
                    <div className="flex items-center space-x-3 mb-8">
                        <img
                            src="/Images/log4.jpeg"
                            alt="Smart Medical Logo"
                            className="w-16 h-16 rounded-full object-cover border-2 border-emerald-400 shadow-lg"
                        />
                        <span className="text-2xl font-bold text-white">Smart Medical</span>
                    </div>

                    <div className="mb-8">
                        <h1 className="text-4xl font-bold mb-4">Join Our Healthcare Community</h1>
                        <p className="text-xl text-green-100 leading-relaxed">
                            Register today and become part of Rwanda's most advanced healthcare management platform.
                        </p>
                    </div>

                    <div className="space-y-6">
                        {userTypes.map((type, index) => (
                            <div key={index} className="flex items-start space-x-4">
                                <div className="bg-white bg-opacity-20 p-3 rounded-lg flex-shrink-0">
                                    <div className="text-emerald-300">{type.icon}</div>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg mb-1">{type.label}</h3>
                                    <p className="text-green-100 text-sm leading-relaxed">{type.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-12 grid grid-cols-3 gap-4 text-center">
                        {[
                            { num: '10K+', label: 'Active Users' },
                            { num: '500+', label: 'Healthcare Providers' },
                            { num: '200+', label: 'Partner Pharmacies' }
                        ].map((stat, i) => (
                            <div key={i} className="bg-white bg-opacity-10 p-4 rounded-lg backdrop-blur-sm">
                                <div className="text-2xl font-bold text-emerald-300">{stat.num}</div>
                                <div className="text-sm text-green-200">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-white overflow-y-auto">
                <div className="max-w-md w-full space-y-8 py-12">
                    {/* Header */}
                    <div className="text-center">
                        {/* Mobile logo */}
                        <div className="lg:hidden flex justify-center items-center space-x-3 mb-6">
                            <img
                                src="/Images/log4.jpeg"
                                alt="Smart Medical Logo"
                                className="w-12 h-12 rounded-full object-cover border-2 border-green-500 shadow-md"
                            />
                            <span className="text-2xl font-bold text-gray-900">Smart Medical</span>
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">Create Your Account</h2>
                        <p className="text-gray-600">Join thousands of healthcare professionals and patients</p>
                    </div>

                    {/* Step Indicator */}
                    <div className="flex justify-center items-center mb-8">
                        {Array.from({ length: totalSteps }).map((_, i) => (
                            <React.Fragment key={i}>
                                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                                    currentStep === i + 1
                                        ? 'bg-green-700 text-white ring-4 ring-green-100'
                                        : currentStep > i + 1
                                            ? 'bg-green-600 text-white'
                                            : 'bg-gray-200 text-gray-500'
                                }`}>
                                    {currentStep > i + 1
                                        ? <CheckCircle className="w-4 h-4" />
                                        : i + 1}
                                </div>
                                {i < totalSteps - 1 && (
                                    <div className={`h-1 w-10 mx-1 rounded transition-all duration-300 ${currentStep > i + 1 ? 'bg-green-600' : 'bg-gray-200'}`} />
                                )}
                            </React.Fragment>
                        ))}
                    </div>

                    {/* Step label */}
                    <div className="text-center -mt-4 mb-2">
                        <p className="text-sm text-gray-500">
                            Step {currentStep} of {totalSteps} —{' '}
                            <span className="text-green-700 font-medium">
                                {currentStep === 1 && 'Personal Info'}
                                {currentStep === 2 && 'Contact Details'}
                                {currentStep === 3 && 'Security'}
                                {currentStep === 4 && 'Confirmation'}
                            </span>
                        </p>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
                            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                            <div className="text-red-700 text-sm">{error}</div>
                        </div>
                    )}

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {renderStep()}

                        {/* Navigation Buttons */}
                        <div className="flex justify-between items-center pt-2">
                            {currentStep > 1 ? (
                                <button
                                    type="button"
                                    onClick={prevStep}
                                    className="flex items-center py-3 px-5 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                                >
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Back
                                </button>
                            ) : (
                                <div />
                            )}

                            {currentStep < totalSteps ? (
                                <button
                                    type="button"
                                    onClick={nextStep}
                                    className="flex items-center py-3 px-6 border border-transparent text-sm font-medium rounded-lg text-white bg-green-700 hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                                >
                                    Next
                                    <ArrowRight className="ml-2 w-4 h-4" />
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="flex items-center py-3 px-6 border border-transparent text-sm font-medium rounded-lg text-white bg-green-700 hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {isLoading
                                        ? <><Loader2 className="w-5 h-5 animate-spin mr-2" />Creating...</>
                                        : <><CheckCircle className="w-4 h-4 mr-2" />Create Account</>
                                    }
                                </button>
                            )}
                        </div>

                        <div className="text-center">
                            <p className="text-sm text-gray-600">
                                Already have an account?{' '}
                                <a href="/login" className="text-green-700 hover:text-green-600 font-medium">
                                    Sign in here
                                </a>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default MultiStepSignupPage;