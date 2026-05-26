import React, { useState } from 'react';
import {
    Eye, EyeOff, Mail, Lock, ArrowRight, Loader2,
    Heart, UserCheck, Building2, Shield, KeyRound,
    ArrowLeft, CheckCircle
} from 'lucide-react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { authService, otpService } from '../../api';

const LoginPage = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [otpData, setOtpData] = useState({ otp: '', userToken: null, userData: null });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isOtpLoading, setIsOtpLoading] = useState(false);
    const [showOtpStep, setShowOtpStep] = useState(false);
    const [otpTimer, setOtpTimer] = useState(300);
    const [timerInterval, setTimerInterval] = useState(null);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleOtpChange = (e) => {
        const value = e.target.value.replace(/\D/g, '');
        if (value.length <= 6) {
            setOtpData(prev => ({ ...prev, otp: value }));
        }
    };

    // Enter key handler for login fields
    const handleLoginKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    // Enter key handler for OTP field
    const handleOtpKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (otpData.otp.length === 6) {
                handleOtpVerification(e);
            }
        }
    };

    const startOtpTimer = () => {
        const interval = setInterval(() => {
            setOtpTimer(prev => {
                if (prev <= 1) { clearInterval(interval); return 0; }
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
        if (userData.user_type === 'admin') return { hasProfile: true, redirectUrl: '/dashboard/system/overview' };
        if (userData.hasProfile) {
            switch (userData.user_type) {
                case 'patient': return { hasProfile: true, redirectUrl: '/dashboard/patient/overview' };
                case 'doctor': return { hasProfile: true, redirectUrl: '/dashboard/doctor/overview' };
                case 'pharmacy': return { hasProfile: true, redirectUrl: '/dashboard/pharmacy/overview' };
                default: return { hasProfile: true, redirectUrl: '/dashboard' };
            }
        }
        return { hasProfile: false, redirectUrl: '/complete-profile' };
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
                setOtpData({ otp: '', userToken: response.data.token || response.token, userData });
                setShowOtpStep(true);
                setOtpTimer(300);
                startOtpTimer();
                showToast('OTP sent to your email. Please check your inbox.', 'success');
            } else {
                showToast(response.error?.message || 'Invalid email or password', 'error');
            }
        } catch (err) {
            showToast('Connection error. Please check your internet and try again.', 'error');
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
                if (timerInterval) clearInterval(timerInterval);
                handleSuccessfulLogin(response.data.user);
            } else {
                showToast(response.error || 'Invalid OTP. Please try again.', 'error');
            }
        } catch (err) {
            showToast('OTP verification failed. Please try again.', 'error');
        } finally {
            setIsOtpLoading(false);
        }
    };

    const handleSuccessfulLogin = (userData) => {
        const profileStatus = checkProfileCompletion(userData);
        if (!profileStatus.hasProfile) {
            showToast('Please complete your profile to continue...', 'info');
            setTimeout(() => { window.location.href = profileStatus.redirectUrl; }, 2000);
        } else {
            showToast('Welcome back! Redirecting to dashboard...', 'success');
            setTimeout(() => { window.location.href = profileStatus.redirectUrl; }, 1500);
        }
    };

    const handleBackToLogin = () => {
        setShowOtpStep(false);
        setOtpData({ otp: '', userToken: null, userData: null });
        if (timerInterval) clearInterval(timerInterval);
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
            showToast('Failed to resend OTP. Please try again.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const features = [
        { icon: <Heart className="w-6 h-6" />, title: "For Patients", description: "Book appointments, manage prescriptions, and find nearby pharmacies" },
        { icon: <UserCheck className="w-6 h-6" />, title: "For Doctors", description: "Manage patients, create digital prescriptions, and streamline workflows" },
        { icon: <Building2 className="w-6 h-6" />, title: "For Pharmacies", description: "Smart inventory management and digital prescription processing" },
        { icon: <Shield className="w-6 h-6" />, title: "Secure Platform", description: "HIPAA compliant with end-to-end encryption for your data" }
    ];

    return (
        <div className="min-h-screen flex">
            {/* Left Side - Login / OTP Form */}
            <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-white">
                <div className="max-w-md w-full space-y-8">

                    {/* Header with Logo */}
                    <div className="text-center">
                        <div className="flex justify-center items-center space-x-3 mb-6">
                            <img
                                src="/Images/log4.jpeg"
                                alt="Smart Medical Logo"
                                className="w-14 h-14 rounded-full object-cover border-2 border-green-500 shadow-md"
                            />
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
                                    We've sent a 6-digit code to{' '}
                                    <span className="font-medium text-green-700">{formData.email}</span>
                                </p>
                            </>
                        )}
                    </div>

                    {!showOtpStep ? (
                        /* ── Login Form ── */
                        <div className="space-y-6">
                            {/* Email */}
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
                                        onKeyDown={handleLoginKeyDown}
                                        className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                        placeholder="Enter your email"
                                    />
                                </div>
                            </div>

                            {/* Password */}
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
                                        onKeyDown={handleLoginKeyDown}
                                        className="appearance-none block w-full pl-10 pr-10 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                        placeholder="Enter your password"
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

                            {/* Submit */}
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={isLoading}
                                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-green-700 hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {isLoading ? (
                                    <><Loader2 className="w-5 h-5 animate-spin mr-2" />Signing In...</>
                                ) : (
                                    <>Sign In <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" /></>
                                )}
                            </button>

                            <div className="text-center">
                                <p className="text-sm text-gray-600">
                                    Don't have an account?{' '}
                                    <a href="/signup" className="text-green-700 hover:text-green-600 font-medium">
                                        Sign up here
                                    </a>
                                </p>
                            </div>

                            {/* Info Notice */}
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <div className="flex items-start">
                                    <Shield className="h-5 w-5 text-green-700 flex-shrink-0 mt-0.5" />
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-green-900">New to Smart Medical?</h3>
                                        <p className="mt-2 text-sm text-green-800">
                                            After signing in, you'll be guided to complete your profile based on your role
                                            (Patient, Doctor, or Pharmacy) to access all platform features.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                    ) : (
                        /* ── OTP Step ── */
                        <div className="space-y-6">
                            <button
                                type="button"
                                onClick={handleBackToLogin}
                                className="flex items-center text-gray-600 hover:text-gray-800 text-sm font-medium"
                            >
                                <ArrowLeft className="w-4 h-4 mr-1" />
                                Back to Login
                            </button>

                            {/* OTP Input */}
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
                                        onKeyDown={handleOtpKeyDown}
                                        className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-center text-lg tracking-widest"
                                        placeholder="000000"
                                    />
                                </div>
                                {/* Live length indicator */}
                                <div className="mt-2 flex justify-center space-x-2">
                                    {Array.from({ length: 6 }).map((_, i) => (
                                        <div
                                            key={i}
                                            className={`h-1.5 w-8 rounded-full transition-all duration-200 ${
                                                i < otpData.otp.length ? 'bg-green-600' : 'bg-gray-200'
                                            }`}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Timer */}
                            <div className="text-center text-sm text-gray-600">
                                {otpTimer > 0 ? (
                                    <span>
                                        Code expires in{' '}
                                        <span className="font-medium text-red-600">{formatTimer(otpTimer)}</span>
                                    </span>
                                ) : (
                                    <span className="text-red-600 font-medium">Code has expired</span>
                                )}
                            </div>

                            {/* Verify Button */}
                            <button
                                type="button"
                                onClick={handleOtpVerification}
                                disabled={isOtpLoading || otpData.otp.length !== 6}
                                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-green-700 hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {isOtpLoading ? (
                                    <><Loader2 className="w-5 h-5 animate-spin mr-2" />Verifying...</>
                                ) : (
                                    <><CheckCircle className="w-5 h-5 mr-2" />Verify Code</>
                                )}
                            </button>

                            {/* Resend */}
                            <div className="text-center">
                                <button
                                    type="button"
                                    onClick={handleResendOtp}
                                    disabled={otpTimer > 0 || isLoading}
                                    className="text-sm text-green-700 hover:text-green-600 font-medium disabled:text-gray-400 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? 'Sending...' : "Didn't receive the code? Resend"}
                                </button>
                            </div>

                            {/* Security Notice */}
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                <div className="flex items-start">
                                    <Shield className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-amber-800">Security Verification</h3>
                                        <p className="mt-2 text-sm text-amber-700">
                                            For your security, we've sent a verification code to your email.
                                            Please don't share this code with anyone.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Right Side - Branding */}
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
                        <h1 className="text-4xl font-bold mb-4">Streamline Your Healthcare Journey</h1>
                        <p className="text-xl text-green-100 leading-relaxed">
                            Connect with healthcare providers, manage prescriptions, and access
                            comprehensive medical services all in one secure platform.
                        </p>
                    </div>

                    <div className="space-y-6">
                        {features.map((feature, index) => (
                            <div key={index} className="flex items-start space-x-4">
                                <div className="bg-white bg-opacity-20 p-3 rounded-lg flex-shrink-0">
                                    <div className="text-emerald-300">{feature.icon}</div>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg mb-1">{feature.title}</h3>
                                    <p className="text-green-100 text-sm leading-relaxed">{feature.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                  
                </div>
            </div>
        </div>
    );
};

export default LoginPage;