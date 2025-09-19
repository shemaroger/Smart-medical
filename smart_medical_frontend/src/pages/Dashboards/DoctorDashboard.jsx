import React, { useState, useEffect } from 'react';
import {
    Calendar, Clock, User, Stethoscope, Building2, Plus, Search,
    Filter, Eye, CheckCircle, XCircle, Clock as ClockIcon,
    AlertCircle, RefreshCw, FileText, MapPin, Phone, Mail, Pill,
    Save, X, Loader2, Activity, TrendingUp, TrendingDown,
    Users, Heart, Shield, AlertTriangle, BarChart3, PieChart,
    LineChart, ArrowUpRight, ArrowDownRight, Award, Star
} from 'lucide-react';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPieChart, Cell, AreaChart, Area } from 'recharts';
import { toast } from 'react-toastify';
import { appointmentService, prescriptionService, drugService, getCurrentUser } from '../../api';

const DoctorDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [appointments, setAppointments] = useState([]);
    const [prescriptions, setPrescriptions] = useState([]);
    const [drugs, setDrugs] = useState([]);
    const [userData, setUserData] = useState(null);
    const [selectedTimeframe, setSelectedTimeframe] = useState('30');

    // Stats states
    const [stats, setStats] = useState({
        totalAppointments: 0,
        todayAppointments: 0,
        pendingAppointments: 0,
        completedAppointments: 0,
        totalPrescriptions: 0,
        activePrescriptions: 0,
        totalPatients: 0,
        completionRate: 0
    });

    // Chart data states
    const [appointmentTrends, setAppointmentTrends] = useState([]);
    const [prescriptionTrends, setPrescriptionTrends] = useState([]);
    const [appointmentStatusData, setAppointmentStatusData] = useState([]);
    const [prescriptionStatusData, setPrescriptionStatusData] = useState([]);
    const [patientDemographics, setPatientDemographics] = useState([]);
    const [topDrugs, setTopDrugs] = useState([]);

    const statusConfig = {
        pending: { color: '#EAB308', label: 'Pending' },
        approved: { color: '#3B82F6', label: 'Approved' },
        completed: { color: '#10B981', label: 'Completed' },
        cancelled: { color: '#EF4444', label: 'Cancelled' },
        active: { color: '#3B82F6', label: 'Active' },
        filled: { color: '#10B981', label: 'Filled' },
        expired: { color: '#EF4444', label: 'Expired' }
    };

    const COLORS = ['#3B82F6', '#10B981', '#EAB308', '#EF4444', '#8B5CF6', '#F59E0B'];

    useEffect(() => {
        initializeDashboard();
    }, [selectedTimeframe]);

    const initializeDashboard = async () => {
        try {
            const user = getCurrentUser();
            if (!user) {
                toast.error('Please log in to access dashboard');
                return;
            }
            setUserData(user);

            setLoading(true);
            await Promise.all([
                fetchAppointments(),
                fetchPrescriptions(),
                fetchDrugs()
            ]);
        } catch (error) {
            console.error('Error initializing dashboard:', error);
            toast.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const fetchAppointments = async () => {
        try {
            const response = await appointmentService.getAll({
                page_size: 100,
                doctor: userData?.id // Filter by current doctor
            });
            if (response.success) {
                const appointmentData = response.data.results || response.data || [];
                setAppointments(appointmentData);
                processAppointmentData(appointmentData);
            }
        } catch (error) {
            console.error('Error fetching appointments:', error);
        }
    };

    const fetchPrescriptions = async () => {
        try {
            const response = await prescriptionService.getAll({
                page_size: 100,
                doctor: userData?.id // Filter by current doctor
            });
            if (response.success) {
                const prescriptionData = response.data.results || response.data || [];
                setPrescriptions(prescriptionData);
                processPrescriptionData(prescriptionData);
            }
        } catch (error) {
            console.error('Error fetching prescriptions:', error);
        }
    };

    const fetchDrugs = async () => {
        try {
            const response = await drugService.getAll();
            if (response.success) {
                const drugData = response.data.results || response.data || [];
                setDrugs(drugData);
            }
        } catch (error) {
            console.error('Error fetching drugs:', error);
        }
    };

    const processAppointmentData = (appointmentData) => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const timeframeDays = parseInt(selectedTimeframe);
        const startDate = new Date(now.getTime() - (timeframeDays * 24 * 60 * 60 * 1000));

        // Calculate stats
        const totalAppointments = appointmentData.length;
        const todayAppointments = appointmentData.filter(apt =>
            new Date(apt.appointment_date).toDateString() === today.toDateString()
        ).length;
        const pendingAppointments = appointmentData.filter(apt => apt.status === 'pending').length;
        const completedAppointments = appointmentData.filter(apt => apt.status === 'completed').length;
        const completionRate = totalAppointments > 0 ? Math.round((completedAppointments / totalAppointments) * 100) : 0;

        // Get unique patients
        const uniquePatients = new Set(appointmentData.map(apt => apt.patient?.id)).size;

        // Process appointment status distribution
        const statusCounts = appointmentData.reduce((acc, apt) => {
            acc[apt.status] = (acc[apt.status] || 0) + 1;
            return acc;
        }, {});

        const appointmentStatusData = Object.entries(statusCounts).map(([status, count]) => ({
            name: statusConfig[status]?.label || status,
            value: count,
            color: statusConfig[status]?.color || '#6B7280'
        }));

        // Process appointment trends (last 14 days)
        const trendData = {};
        const last14Days = new Date(now.getTime() - (14 * 24 * 60 * 60 * 1000));

        appointmentData.filter(apt => new Date(apt.appointment_date) >= last14Days)
            .forEach(apt => {
                const date = new Date(apt.appointment_date).toLocaleDateString();
                trendData[date] = (trendData[date] || 0) + 1;
            });

        const appointmentTrends = Object.entries(trendData)
            .sort(([a], [b]) => new Date(a) - new Date(b))
            .slice(-14)
            .map(([date, count]) => ({
                date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                appointments: count,
                completed: appointmentData.filter(apt =>
                    new Date(apt.appointment_date).toLocaleDateString() === date && apt.status === 'completed'
                ).length
            }));

        setStats(prev => ({
            ...prev,
            totalAppointments,
            todayAppointments,
            pendingAppointments,
            completedAppointments,
            totalPatients: uniquePatients,
            completionRate
        }));

        setAppointmentStatusData(appointmentStatusData);
        setAppointmentTrends(appointmentTrends);
    };

    const processPrescriptionData = (prescriptionData) => {
        const now = new Date();

        // Calculate prescription stats
        const totalPrescriptions = prescriptionData.length;
        const activePrescriptions = prescriptionData.filter(p => p.status === 'active').length;

        // Process prescription status distribution
        const statusCounts = prescriptionData.reduce((acc, prescription) => {
            acc[prescription.status] = (acc[prescription.status] || 0) + 1;
            return acc;
        }, {});

        const prescriptionStatusData = Object.entries(statusCounts).map(([status, count]) => ({
            name: statusConfig[status]?.label || status,
            value: count,
            color: statusConfig[status]?.color || '#6B7280'
        }));

        // Process prescription trends (last 14 days)
        const trendData = {};
        const last14Days = new Date(now.getTime() - (14 * 24 * 60 * 60 * 1000));

        prescriptionData.filter(p => new Date(p.created_at) >= last14Days)
            .forEach(p => {
                const date = new Date(p.created_at).toLocaleDateString();
                trendData[date] = (trendData[date] || 0) + 1;
            });

        const prescriptionTrends = Object.entries(trendData)
            .sort(([a], [b]) => new Date(a) - new Date(b))
            .slice(-14)
            .map(([date, count]) => ({
                date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                prescriptions: count
            }));

        // Process top prescribed drugs
        const drugCounts = {};
        prescriptionData.forEach(prescription => {
            prescription.items?.forEach(item => {
                const drugName = item.drug?.name || 'Unknown';
                drugCounts[drugName] = (drugCounts[drugName] || 0) + parseInt(item.quantity || 0);
            });
        });

        const topDrugs = Object.entries(drugCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([drug, count]) => ({ drug, count }));

        setStats(prev => ({
            ...prev,
            totalPrescriptions,
            activePrescriptions
        }));

        setPrescriptionStatusData(prescriptionStatusData);
        setPrescriptionTrends(prescriptionTrends);
        setTopDrugs(topDrugs);
    };

    const getRecentAppointments = () => {
        return appointments
            .sort((a, b) => new Date(b.appointment_date) - new Date(a.appointment_date))
            .slice(0, 5);
    };

    const getRecentPrescriptions = () => {
        return prescriptions
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 5);
    };

    const getTodayAppointments = () => {
        const today = new Date().toDateString();
        return appointments
            .filter(apt => new Date(apt.appointment_date).toDateString() === today)
            .sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date));
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
    };

    const formatTime = (dateString) => {
        return new Date(dateString).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="flex flex-col items-center space-y-4">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    <p className="text-gray-600">Loading your dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Welcome back, Dr. {userData?.first_name}!
                    </h1>
                    <p className="text-sm text-gray-600 mt-1">
                        Here's your practice overview and patient management summary
                    </p>
                </div>
                <div className="flex items-center space-x-3 mt-4 sm:mt-0">
                    <select
                        value={selectedTimeframe}
                        onChange={(e) => setSelectedTimeframe(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="7">Last 7 days</option>
                        <option value="30">Last 30 days</option>
                        <option value="90">Last 90 days</option>
                    </select>
                    <button
                        onClick={initializeDashboard}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Quick Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Today's Appointments</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.todayAppointments}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-blue-100">
                            <Calendar className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm">
                        <span className="text-gray-600">
                            {stats.pendingAppointments} pending review
                        </span>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Patients</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.totalPatients}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-purple-100">
                            <Users className="w-6 h-6 text-purple-600" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm">
                        <span className="text-gray-600">
                            Active patient base
                        </span>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Active Prescriptions</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.activePrescriptions}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-green-100">
                            <Pill className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm">
                        <span className="text-gray-600">
                            Currently active
                        </span>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.completionRate}%</p>
                        </div>
                        <div className="p-3 rounded-lg bg-yellow-100">
                            <Award className="w-6 h-6 text-yellow-600" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm">
                        {stats.completionRate >= 80 ? (
                            <>
                                <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                                <span className="text-green-600 font-medium">Excellent</span>
                            </>
                        ) : stats.completionRate >= 60 ? (
                            <>
                                <Activity className="w-4 h-4 text-yellow-600 mr-1" />
                                <span className="text-yellow-600 font-medium">Good</span>
                            </>
                        ) : (
                            <>
                                <TrendingDown className="w-4 h-4 text-red-600 mr-1" />
                                <span className="text-red-600 font-medium">Needs improvement</span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Appointment Trends */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-gray-900">Appointment Trends</h3>
                        <BarChart3 className="w-5 h-5 text-gray-400" />
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={appointmentTrends}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Area type="monotone" dataKey="appointments" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
                            <Area type="monotone" dataKey="completed" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.8} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Prescription Trends */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-gray-900">Prescription Trends</h3>
                        <LineChart className="w-5 h-5 text-gray-400" />
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <RechartsLineChart data={prescriptionTrends}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Line type="monotone" dataKey="prescriptions" stroke="#8B5CF6" strokeWidth={2} />
                        </RechartsLineChart>
                    </ResponsiveContainer>
                </div>


            </div>

            {/* Today's Schedule & Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Today's Appointments */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-gray-900">Today's Schedule</h3>
                        <Calendar className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="space-y-4">
                        {getTodayAppointments().length > 0 ? (
                            getTodayAppointments().map((appointment) => (
                                <div key={appointment.id} className="flex items-center space-x-4 p-4 bg-blue-50 rounded-lg">
                                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                                        <User className="w-5 h-5 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-900">
                                            {appointment.patient?.user?.first_name} {appointment.patient?.user?.last_name}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {formatTime(appointment.appointment_date)} - {appointment.reason}
                                        </p>
                                    </div>
                                    <span className={`px-2 py-1 text-xs rounded-full ${appointment.status === 'approved' ? 'bg-green-100 text-green-800' :
                                        appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`}>
                                        {statusConfig[appointment.status]?.label || appointment.status}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div className="text-center text-gray-500 py-8">
                                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                                <p>No appointments scheduled for today</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent Prescriptions */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-gray-900">Recent Prescriptions</h3>
                        <Pill className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="space-y-4">
                        {getRecentPrescriptions().length > 0 ? (
                            getRecentPrescriptions().slice(0, 4).map((prescription) => (
                                <div key={prescription.id} className="flex items-center space-x-4 p-4 bg-purple-50 rounded-lg">
                                    <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                                        <Pill className="w-5 h-5 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-900">
                                            {prescription.patient?.user?.first_name} {prescription.patient?.user?.last_name}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {formatDate(prescription.created_at)} - {prescription.items?.length || 0} medications
                                        </p>
                                        <p className="text-xs text-gray-600 truncate">
                                            {(prescription?.diagnosis ?? '').length > 30
                                                ? `${(prescription?.diagnosis ?? '').slice(0, 30)}…`
                                                : (prescription?.diagnosis ?? '')}
                                        </p>

                                    </div>
                                    <span className={`px-2 py-1 text-xs rounded-full ${prescription.status === 'active' ? 'bg-blue-100 text-blue-800' :
                                        prescription.status === 'filled' ? 'bg-green-100 text-green-800' :
                                            'bg-red-100 text-red-800'
                                        }`}>
                                        {statusConfig[prescription.status]?.label || prescription.status}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div className="text-center text-gray-500 py-8">
                                <Pill className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                                <p>No recent prescriptions</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Practice Insights */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-6 shadow-sm border border-blue-200">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Practice Insights</h3>
                    <Activity className="w-5 h-5 text-blue-600" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-lg p-4">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                <TrendingUp className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-900">Patient Satisfaction</p>
                                <p className="text-xs text-gray-500">
                                    {stats.completionRate}% completion rate indicates high patient satisfaction
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg p-4">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <Users className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-900">Patient Load</p>
                                <p className="text-xs text-gray-500">
                                    Managing {stats.totalPatients} active patients effectively
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg p-4">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                <Pill className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-900">Prescription Management</p>
                                <p className="text-xs text-gray-500">
                                    {stats.activePrescriptions} active prescriptions under monitoring
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DoctorDashboard;