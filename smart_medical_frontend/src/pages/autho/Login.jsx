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
    Shield,
    KeyRound,
    ArrowLeft,
    CheckCircle
} from 'lucide-react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { authService, otpService } from '../../api';

const LoginPage = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [otpData, setOtpData] = useState({
        otp: '',
        userToken: null,
        userData: null
    });

    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isOtpLoading, setIsOtpLoading] = useState(false);
    const [showOtpStep, setShowOtpStep] = useState(false);
    const [otpTimer, setOtpTimer] = useState(300);
    const [timerInterval, setTimerInterval] = useState(null);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleOtpChange = (e) => {
        const value = e.target.value.replace(/\D/g, '');
        if (value.length <= 6) {
            setOtpData(prev => ({
                ...prev,
                otp: value
            }));
        }
    };

    const startOtpTimer = () => {
        const interval = setInterval(() => {
            setOtpTimer(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        setTimerInterval(interval);
    };

    const formatTimer = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const checkProfileCompletion = (userData) => {
        if (userData.user_type === 'admin') {
            return { hasProfile: true, redirectUrl: '/dashboard/system/overview' };
        }

        if (userData.hasProfile) {
            switch (userData.user_type) {
                case 'patient':
                    return { hasProfile: true, redirectUrl: '/dashboard/patient/overview' };
                case 'doctor':
                    return { hasProfile: true, redirectUrl: '/dashboard/doctor/overview' };
                case 'pharmacy':
                    return { hasProfile: true, redirectUrl: '/dashboard/pharmacy/overview' };
                default:
                    return { hasProfile: true, redirectUrl: '/dashboard' };
            }
        } else {
            return { hasProfile: false, redirectUrl: '/complete-profile' };
        }
    };

    const showToast = (message, type = 'info') => {
        if (type === 'error') toast.error(message);
        else if (type === 'success') toast.success(message);
        else if (type === 'info') toast.info(message);
        else toast(message);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.email || !formData.password) {
            showToast('Please fill in all fields', 'error');
            return;
        }

        setIsLoading(true);

        try {
            const response = await authService.login(formData.email, formData.password);

            if (response.success) {
                const userData = response.data.user;
                setOtpData({
                    otp: '',
                    userToken: response.data.token || response.token,
                    userData: userData
                });
                setShowOtpStep(true);
                setOtpTimer(300);
                startOtpTimer();

                showToast('OTP sent to your email. Please check your inbox.', 'success');

            } else {
                showToast(response.error?.message || 'Invalid email or password', 'error');
            }
        } catch (err) {
            showToast('Connection error. Please check your internet and try again.', 'error');
            console.error('Login error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOtpVerification = async (e) => {
        e.preventDefault();

        if (!otpData.otp || otpData.otp.length !== 6) {
            showToast('Please enter a valid 6-digit OTP', 'error');
            return;
        }

        setIsOtpLoading(true);

        try {
            const response = await otpService.verify(otpData.otp, formData.email);

            if (response.success && response.isVerified) {
                showToast('OTP verified successfully!', 'success');
                if (timerInterval) {
                    clearInterval(timerInterval);
                }
                handleSuccessfulLogin(response.data.user);
            } else {
                showToast(response.error || 'Invalid OTP. Please try again.', 'error');
            }
        } catch (err) {
            showToast('OTP verification failed. Please try again.', 'error');
            console.error('OTP verification error:', err);
        } finally {
            setIsOtpLoading(false);
        }
    };

    const handleSuccessfulLogin = (userData) => {

        const profileStatus = checkProfileCompletion(userData);

        if (!profileStatus.hasProfile) {
            showToast('Please complete your profile to continue...', 'info');
            setTimeout(() => {
                window.location.href = profileStatus.redirectUrl;
            }, 2000);

        } else {
            showToast('Welcome back! Redirecting to dashboard...', 'success');
            setTimeout(() => {
                window.location.href = profileStatus.redirectUrl;
            }, 1500);
        }
    };

    const handleBackToLogin = () => {
        setShowOtpStep(false);
        setOtpData({ otp: '', userToken: null, userData: null });
        if (timerInterval) {
            clearInterval(timerInterval);
        }
    };

    const handleResendOtp = async () => {
        if (otpTimer > 0) return;

        setIsLoading(true);
        try {
            const response = await authService.login(formData.email, formData.password);
            if (response.success) {
                setOtpTimer(300);
                startOtpTimer();
                showToast('New OTP sent to your email', 'success');
            } else {
                showToast('Failed to resend OTP. Please try again.', 'error');
            }
        } catch (err) {
            console.log(err)
            showToast('Failed to resend OTP. Please try again.', 'error');
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
            {/* Left Side - Login/OTP Form */}
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

                        {!showOtpStep ? (
                            <>
                                <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h2>
                                <p className="text-gray-600">Sign in to your account to continue</p>
                            </>
                        ) : (
                            <>
                                <h2 className="text-3xl font-bold text-gray-900 mb-2">Verify Your Email</h2>
                                <p className="text-gray-600">
                                    We've sent a 6-digit code to <span className="font-medium">{formData.email}</span>
                                </p>
                            </>
                        )}
                    </div>

                    {!showOtpStep ? (
                        /* Login Form */
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
                    ) : (
                        /* OTP Verification Form */
                        <div className="space-y-6">
                            {/* Back Button */}
                            <button
                                type="button"
                                onClick={handleBackToLogin}
                                className="flex items-center text-gray-600 hover:text-gray-800 text-sm font-medium"
                            >
                                <ArrowLeft className="w-4 h-4 mr-1" />
                                Back to Login
                            </button>

                            <div>
                                <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                                    Enter 6-digit code
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <KeyRound className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="otp"
                                        name="otp"
                                        type="text"
                                        inputMode="numeric"
                                        maxLength="6"
                                        required
                                        value={otpData.otp}
                                        onChange={handleOtpChange}
                                        className="appearance-none relative block w-full pl-10 pr-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 text-center text-lg tracking-widest"
                                        placeholder="000000"
                                    />
                                </div>
                            </div>

                            {/* Timer */}
                            <div className="text-center">
                                <div className="text-sm text-gray-600">
                                    {otpTimer > 0 ? (
                                        <span>Code expires in <span className="font-medium text-red-600">{formatTimer(otpTimer)}</span></span>
                                    ) : (
                                        <span className="text-red-600">Code has expired</span>
                                    )}
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={handleOtpVerification}
                                disabled={isOtpLoading || otpData.otp.length !== 6}
                                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {isOtpLoading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                        Verifying...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="w-5 h-5 mr-2" />
                                        Verify Code
                                    </>
                                )}
                            </button>

                            {/* Resend OTP */}
                            <div className="text-center">
                                <button
                                    type="button"
                                    onClick={handleResendOtp}
                                    disabled={otpTimer > 0 || isLoading}
                                    className="text-sm text-blue-600 hover:text-blue-500 font-medium disabled:text-gray-400 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? 'Sending...' : "Didn't receive the code? Resend"}
                                </button>
                            </div>

                            {/* Security Notice */}
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                <div className="flex items-start">
                                    <div className="flex-shrink-0">
                                        <Shield className="h-5 w-5 text-amber-600" />
                                    </div>
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-amber-800">
                                            Security Verification
                                        </h3>
                                        <div className="mt-2 text-sm text-amber-700">
                                            <p>
                                                For your security, we've sent a verification code to your email.
                                                Please don't share this code with anyone.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
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
                            <div className="text-sm font-medium text-blue-900">10,000+ Active Users</div>
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