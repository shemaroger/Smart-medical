import React, { useState } from 'react';
import {
    Stethoscope,
    Eye,
    EyeOff,
    Mail,
    Lock,
    ArrowRight,
    Loader2,
    Heart,
    UserCheck,
    Building2,
    Shield
} from 'lucide-react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { authService, profileService } from '../../api';

const LoginPage = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const checkProfileCompletion = (userData) => {
        // Admin users don't need profile completion
        if (userData.user_type === 'admin') {
            return { hasProfile: true, redirectUrl: '/dashboard' };
        }

        if (userData.hasProfile) {
            // Profile exists - redirect based on user type
            switch (userData.user_type) {
                case 'patient':
                    return { hasProfile: true, redirectUrl: '/dashboard' };
                case 'doctor':
                    return { hasProfile: true, redirectUrl: '/dashboard' };
                case 'pharmacy':
                    return { hasProfile: true, redirectUrl: '/dashboard' };
                default:
                    return { hasProfile: true, redirectUrl: '/dashboard' };
            }
        } else {
            // Profile doesn't exist - send them to completion page
            return { hasProfile: false, redirectUrl: '/complete-profile' };
        }
    };


    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.email || !formData.password) {
            toast.error('Please fill in all fields');
            return;
        }

        setIsLoading(true);

        try {
            const response = await authService.login(formData.email, formData.password);

            if (response.success) {
                const userData = response.data.user;

                toast.success('Login successful! Checking profile status...');

                const profileStatus = checkProfileCompletion(userData);

                console.log(response);
                console.log(profileStatus);

                if (!profileStatus.hasProfile) {
                    toast.info('Please complete your profile to continue...');
                    setTimeout(() => {
                        window.location.href = profileStatus.redirectUrl;
                    }, 2000);
                } else {
                    toast.success('Welcome back! Redirecting to dashboard...');
                    setTimeout(() => {
                        window.location.href = profileStatus.redirectUrl;
                    }, 1500);
                }
            } else {
                toast.error(response.error?.message || 'Invalid email or password');
            }
        } catch (err) {
            toast.error('Connection error. Please check your internet and try again.');
            console.error('Login error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const features = [
        {
            icon: <Heart className="w-6 h-6" />,
            title: "For Patients",
            description: "Book appointments, manage prescriptions, and find nearby pharmacies"
        },
        {
            icon: <UserCheck className="w-6 h-6" />,
            title: "For Doctors",
            description: "Manage patients, create digital prescriptions, and streamline workflows"
        },
        {
            icon: <Building2 className="w-6 h-6" />,
            title: "For Pharmacies",
            description: "Smart inventory management and digital prescription processing"
        },
        {
            icon: <Shield className="w-6 h-6" />,
            title: "Secure Platform",
            description: "HIPAA compliant with end-to-end encryption for your data"
        }
    ];

    return (
        <div className="min-h-screen flex">
            {/* Left Side - Login Form */}
            <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-white">
                <div className="max-w-md w-full space-y-8">
                    {/* Header */}
                    <div className="text-center">
                        <div className="flex justify-center items-center space-x-2 mb-6">
                            <div className="bg-blue-600 p-3 rounded-xl">
                                <Stethoscope className="w-8 h-8 text-white" />
                            </div>
                            <span className="text-2xl font-bold text-gray-900">Smart Medical</span>
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h2>
                        <p className="text-gray-600">Sign in to your account to continue</p>
                    </div>

                    {/* Login Form */}
                    <div className="space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                Email
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
                                    className="appearance-none relative block w-full pl-10 pr-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10"
                                    placeholder="Enter your email"
                                />
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
                                    className="appearance-none relative block w-full pl-10 pr-10 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Enter your password"
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                                    ) : (
                                        <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">

                        </div>

                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={isLoading}
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                    Signing In...
                                </>
                            ) : (
                                <>
                                    Sign In
                                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>

                        <div className="text-center">
                            <p className="text-sm text-gray-600">
                                Don't have an account?{' '}
                                <a href="/signup" className="text-blue-600 hover:text-blue-500 font-medium">
                                    Sign up here
                                </a>
                            </p>
                        </div>

                        {/* Profile Completion Notice */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-start">
                                <div className="flex-shrink-0">
                                    <Shield className="h-5 w-5 text-blue-600" />
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-blue-800">
                                        New to Smart Medical?
                                    </h3>
                                    <div className="mt-2 text-sm text-blue-700">
                                        <p>
                                            After signing in, you'll be guided to complete your profile based on your role
                                            (Patient, Doctor, or Pharmacy) to access all platform features.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Features & Branding */}
            <div className="hidden lg:flex flex-1 bg-gradient-to-br from-blue-900 via-blue-800 to-cyan-700 items-center justify-center p-12">
                <div className="max-w-lg text-white">
                    <div className="mb-8">
                        <h1 className="text-4xl font-bold mb-4">
                            Streamline Your Healthcare Journey
                        </h1>
                        <p className="text-xl text-blue-100 leading-relaxed">
                            Connect with healthcare providers, manage prescriptions, and access
                            comprehensive medical services all in one secure platform.
                        </p>
                    </div>

                    <div className="space-y-6">
                        {features.map((feature, index) => (
                            <div key={index} className="flex items-start space-x-4">
                                <div className="bg-white bg-opacity-20 p-3 rounded-lg flex-shrink-0">
                                    <div className="text-cyan-300">
                                        {feature.icon}
                                    </div>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg mb-1">{feature.title}</h3>
                                    <p className="text-blue-100 text-sm leading-relaxed">{feature.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Success Story */}
                    <div className="mt-12 p-6 bg-white bg-opacity-10 rounded-xl backdrop-blur-sm">
                        <div className="flex items-center space-x-3 mb-3">
                            <div className="flex -space-x-2">
                                <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full border-2 border-white"></div>
                                <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full border-2 border-white"></div>
                                <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-violet-400 rounded-full border-2 border-white"></div>
                            </div>
                            <div className="text-sm font-medium text-blue-800">10,000+ Active Users</div>
                        </div>
                        <p className="text-blue-900 text-sm">
                            "This platform has transformed how we manage patient care. The integration
                            between doctors, patients, and pharmacies is seamless."
                        </p>
                        <div className="mt-3 text-sm font-medium text-blue-900">- Dr. Sarah Johnson, Cardiologist</div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default LoginPage;