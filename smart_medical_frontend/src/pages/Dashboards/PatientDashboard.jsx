import React, { useState, useEffect } from 'react';
import {
    Calendar, Clock, User, Stethoscope, Building2, Plus, Search,
    Filter, Eye, CheckCircle, XCircle, Clock as ClockIcon,
    AlertCircle, RefreshCw, FileText, MapPin, Phone, Mail, Pill,
    Save, X, Loader2, Activity, TrendingUp, TrendingDown,
    DollarSign, Package, Heart, Shield, AlertTriangle,
    BarChart3, PieChart, LineChart, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPieChart, Cell } from 'recharts';
import { toast } from 'react-toastify';
import { appointmentService, orderService, getCurrentUser } from '../../api';

const PatientDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [appointments, setAppointments] = useState([]);
    const [orders, setOrders] = useState([]);
    const [userData, setUserData] = useState(null);
    const [selectedTimeframe, setSelectedTimeframe] = useState('30');

    // Stats states
    const [stats, setStats] = useState({
        totalAppointments: 0,
        pendingAppointments: 0,
        completedAppointments: 0,
        totalOrders: 0,
        pendingOrders: 0,
        totalSpent: 0,
        upcomingAppointments: 0
    });

    // Chart data states
    const [appointmentTrends, setAppointmentTrends] = useState([]);
    const [orderTrends, setOrderTrends] = useState([]);
    const [appointmentStatusData, setAppointmentStatusData] = useState([]);
    const [orderStatusData, setOrderStatusData] = useState([]);
    const [monthlySpending, setMonthlySpending] = useState([]);

    const statusConfig = {
        pending: { color: '#EAB308', label: 'Pending' },
        approved: { color: '#3B82F6', label: 'Approved' },
        completed: { color: '#10B981', label: 'Completed' },
        cancelled: { color: '#EF4444', label: 'Cancelled' },
        processing: { color: '#8B5CF6', label: 'Processing' }
    };

    const COLORS = ['#3B82F6', '#10B981', '#EAB308', '#EF4444', '#8B5CF6'];

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
                fetchOrders()
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
                page_size: 100 // Get more data for better analytics
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

    const fetchOrders = async () => {
        try {
            const response = await orderService.getAll({
                page_size: 100 // Get more data for better analytics
            });
            if (response.success) {
                const orderData = response.data || [];
                setOrders(orderData);
                processOrderData(orderData);
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
        }
    };

    const processAppointmentData = (appointmentData) => {
        const now = new Date();
        const timeframeDays = parseInt(selectedTimeframe);
        const startDate = new Date(now.getTime() - (timeframeDays * 24 * 60 * 60 * 1000));

        // Filter appointments within timeframe
        const filteredAppointments = appointmentData.filter(apt =>
            new Date(apt.created_at) >= startDate
        );

        // Calculate stats
        const totalAppointments = appointmentData.length;
        const pendingAppointments = appointmentData.filter(apt => apt.status === 'pending').length;
        const completedAppointments = appointmentData.filter(apt => apt.status === 'completed').length;
        const upcomingAppointments = appointmentData.filter(apt =>
            apt.status === 'approved' && new Date(apt.appointment_date) > now
        ).length;

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

        // Process appointment trends (last 30 days)
        const trendData = {};
        const last30Days = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));

        appointmentData.filter(apt => new Date(apt.created_at) >= last30Days)
            .forEach(apt => {
                const date = new Date(apt.created_at).toLocaleDateString();
                trendData[date] = (trendData[date] || 0) + 1;
            });

        const appointmentTrends = Object.entries(trendData)
            .sort(([a], [b]) => new Date(a) - new Date(b))
            .slice(-14) // Last 14 days
            .map(([date, count]) => ({
                date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                appointments: count
            }));

        setStats(prev => ({
            ...prev,
            totalAppointments,
            pendingAppointments,
            completedAppointments,
            upcomingAppointments
        }));

        setAppointmentStatusData(appointmentStatusData);
        setAppointmentTrends(appointmentTrends);
    };

    const processOrderData = (orderData) => {
        const now = new Date();
        const timeframeDays = parseInt(selectedTimeframe);
        const startDate = new Date(now.getTime() - (timeframeDays * 24 * 60 * 60 * 1000));

        // Filter orders within timeframe
        const filteredOrders = orderData.filter(order =>
            new Date(order.created_at) >= startDate
        );

        // Calculate stats
        const totalOrders = orderData.length;
        const pendingOrders = orderData.filter(order => order.status === 'pending').length;
        const totalSpent = orderData.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0);

        // Process order status distribution
        const statusCounts = orderData.reduce((acc, order) => {
            acc[order.status] = (acc[order.status] || 0) + 1;
            return acc;
        }, {});

        const orderStatusData = Object.entries(statusCounts).map(([status, count]) => ({
            name: statusConfig[status]?.label || status,
            value: count,
            color: statusConfig[status]?.color || '#6B7280'
        }));

        // Process order trends (last 30 days)
        const trendData = {};
        const last30Days = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));

        orderData.filter(order => new Date(order.created_at) >= last30Days)
            .forEach(order => {
                const date = new Date(order.created_at).toLocaleDateString();
                trendData[date] = (trendData[date] || 0) + 1;
            });

        const orderTrends = Object.entries(trendData)
            .sort(([a], [b]) => new Date(a) - new Date(b))
            .slice(-14) // Last 14 days
            .map(([date, count]) => ({
                date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                orders: count
            }));

        // Process monthly spending
        const spendingData = {};
        orderData.forEach(order => {
            const month = new Date(order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
            spendingData[month] = (spendingData[month] || 0) + parseFloat(order.total_amount || 0);
        });

        const monthlySpending = Object.entries(spendingData)
            .sort(([a], [b]) => new Date(a) - new Date(b))
            .slice(-6) // Last 6 months
            .map(([month, amount]) => ({
                month,
                amount: Math.round(amount)
            }));

        setStats(prev => ({
            ...prev,
            totalOrders,
            pendingOrders,
            totalSpent
        }));

        setOrderStatusData(orderStatusData);
        setOrderTrends(orderTrends);
        setMonthlySpending(monthlySpending);
    };

    const formatCurrency = (amount) => {
        return `${parseFloat(amount).toLocaleString()} RWF`;
    };

    const getRecentAppointments = () => {
        return appointments
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 5);
    };

    const getRecentOrders = () => {
        return orders
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 5);
    };

    const getUpcomingAppointments = () => {
        const now = new Date();
        return appointments
            .filter(apt => apt.status === 'approved' && new Date(apt.appointment_date) > now)
            .sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date))
            .slice(0, 3);
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
                        Welcome back, {userData?.first_name}!
                    </h1>
                    <p className="text-sm text-gray-600 mt-1">
                        Here's your health overview and recent activity
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
                            <p className="text-sm font-medium text-gray-600">Total Appointments</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.totalAppointments}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-blue-100">
                            <Calendar className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm">
                        <span className="text-green-600 font-medium">
                            {stats.upcomingAppointments} upcoming
                        </span>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Drug Requests</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-purple-100">
                            <Package className="w-6 h-6 text-purple-600" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm">
                        <span className="text-yellow-600 font-medium">
                            {stats.pendingOrders} pending
                        </span>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Spent</p>
                            <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalSpent)}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-green-100">
                            <DollarSign className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm">
                        <span className="text-gray-600">
                            on medications
                        </span>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Health Score</p>
                            <p className="text-2xl font-bold text-gray-900">85%</p>
                        </div>
                        <div className="p-3 rounded-lg bg-red-100">
                            <Heart className="w-6 h-6 text-red-600" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm">
                        <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                        <span className="text-green-600 font-medium">+5% this month</span>
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
                        <RechartsLineChart data={appointmentTrends}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Line type="monotone" dataKey="appointments" stroke="#3B82F6" strokeWidth={2} />
                        </RechartsLineChart>
                    </ResponsiveContainer>
                </div>

                {/* Order Trends */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-gray-900">Drug Request Trends</h3>
                        <LineChart className="w-5 h-5 text-gray-400" />
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <RechartsLineChart data={orderTrends}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Line type="monotone" dataKey="orders" stroke="#8B5CF6" strokeWidth={2} />
                        </RechartsLineChart>
                    </ResponsiveContainer>
                </div>



            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Upcoming Appointments */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-gray-900">Upcoming Appointments</h3>
                        <Calendar className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="space-y-4">
                        {getUpcomingAppointments().length > 0 ? (
                            getUpcomingAppointments().map((appointment) => (
                                <div key={appointment.id} className="flex items-center space-x-4 p-4 bg-blue-50 rounded-lg">
                                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                                        <Stethoscope className="w-5 h-5 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-900">
                                            Dr. {appointment.doctor?.user?.first_name} {appointment.doctor?.user?.last_name}
                                        </p>
                                        <p className="text-xs text-gray-500">{appointment.doctor?.specialization}</p>
                                        <p className="text-xs text-gray-500">
                                            {new Date(appointment.appointment_date).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </p>
                                    </div>
                                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                        Approved
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div className="text-center text-gray-500 py-8">
                                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                                <p>No upcoming appointments</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent Orders */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-gray-900">Recent Drug Requests</h3>
                        <Package className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="space-y-4">
                        {getRecentOrders().length > 0 ? (
                            getRecentOrders().slice(0, 3).map((order) => (
                                <div key={order.id} className="flex items-center space-x-4 p-4 bg-purple-50 rounded-lg">
                                    <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                                        <Pill className="w-5 h-5 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-900">
                                            {order.pharmacy?.pharmacy_name || 'Pharmacy Order'}
                                        </p>
                                        <p className="text-xs text-gray-500">{formatCurrency(order.total_amount)}</p>
                                        <p className="text-xs text-gray-500">
                                            {new Date(order.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <span className={`px-2 py-1 text-xs rounded-full ${order.status === 'completed' ? 'bg-green-100 text-green-800' :
                                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-blue-100 text-blue-800'
                                        }`}>
                                        {statusConfig[order.status]?.label || order.status}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div className="text-center text-gray-500 py-8">
                                <Package className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                                <p>No recent drug requests</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Health Insights */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-6 shadow-sm border border-blue-200">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Health Insights</h3>
                    <Activity className="w-5 h-5 text-blue-600" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-lg p-4">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-900">Regular Check-ups</p>
                                <p className="text-xs text-gray-500">
                                    {stats.completedAppointments} completed this year
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg p-4">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-900">Pending Actions</p>
                                <p className="text-xs text-gray-500">
                                    {stats.pendingAppointments + stats.pendingOrders} items need attention
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg p-4">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <Shield className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-900">Health Score</p>
                                <p className="text-xs text-gray-500">
                                    85% - Good health management
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PatientDashboard;