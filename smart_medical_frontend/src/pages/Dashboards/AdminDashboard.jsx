import React, { useState, useEffect } from 'react';
import {
    Users, Shield, Building2, Pill, TrendingUp, TrendingDown,
    Activity, BarChart3, PieChart, LineChart, Calendar, Clock,
    RefreshCw, Eye, Settings, AlertTriangle, CheckCircle, XCircle,
    UserPlus, Stethoscope, Factory, Package, Loader2, Target,
    Award, Zap, Heart, Star, Phone, Mail, MapPin, ArrowUpRight,
    ArrowDownRight, Building
} from 'lucide-react';
import {
    LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer, BarChart, Bar,
    PieChart as RechartsPieChart, Cell, Pie, Area, AreaChart
} from 'recharts';
import { toast } from 'react-toastify';
import { authService, drugService, hospitalService, getCurrentUser } from '../../api';

const AdminDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState([]);
    const [drugs, setDrugs] = useState([]);
    const [hospitals, setHospitals] = useState([]);
    const [userData, setUserData] = useState(null);
    const [selectedTimeframe, setSelectedTimeframe] = useState('30');

    // Stats states
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeUsers: 0,
        verifiedUsers: 0,
        totalDoctors: 0,
        totalPatients: 0,
        totalPharmacies: 0,
        totalDrugs: 0,
        prescriptionDrugs: 0,
        totalHospitals: 0,
        activeHospitals: 0,
        userGrowth: 0,
        systemHealth: 95
    });

    // Chart data states
    const [userRegistrationData, setUserRegistrationData] = useState([]);
    const [userTypeDistribution, setUserTypeDistribution] = useState([]);
    const [drugCategoryData, setCategoryData] = useState([]);
    const [systemActivityData, setSystemActivityData] = useState([]);
    const [recentUsers, setRecentUsers] = useState([]);
    const [recentHospitals, setRecentHospitals] = useState([]);

    const userTypeConfig = {
        patient: { color: '#8B5CF6', label: 'Patients', bg: 'bg-purple-100', text: 'text-purple-800' },
        doctor: { color: '#3B82F6', label: 'Doctors', bg: 'bg-blue-100', text: 'text-blue-800' },
        pharmacy: { color: '#10B981', label: 'Pharmacies', bg: 'bg-green-100', text: 'text-green-800' },
        admin: { color: '#EF4444', label: 'Admins', bg: 'bg-red-100', text: 'text-red-800' }
    };

    const COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#EF4444', '#F59E0B', '#EC4899'];

    useEffect(() => {
        initializeDashboard();
    }, [selectedTimeframe]);

    const initializeDashboard = async () => {
        try {
            const user = getCurrentUser();
            if (!user) {
                toast.error('Please log in to access admin dashboard');
                return;
            }
            setUserData(user);

            setLoading(true);
            await Promise.all([
                fetchUsers(),
                fetchDrugs(),
                fetchHospitals()
            ]);
        } catch (error) {
            console.error('Error initializing dashboard:', error);
            toast.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await authService.getAllUsers();
            if (response.success) {
                const userData = response.data.results || response.data || [];
                setUsers(userData);
                processUserData(userData);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const fetchDrugs = async () => {
        try {
            const response = await drugService.getAll();
            if (response.success) {
                const drugData = response.data.results || response.data || [];
                setDrugs(drugData);
                processDrugData(drugData);
            }
        } catch (error) {
            console.error('Error fetching drugs:', error);
        }
    };

    const fetchHospitals = async () => {
        try {
            const response = await hospitalService.getAll();
            if (response.success) {
                const hospitalData = response.data.results || response.data || [];
                setHospitals(hospitalData);
                processHospitalData(hospitalData);
            }
        } catch (error) {
            console.error('Error fetching hospitals:', error);
        }
    };

    const processUserData = (userData) => {
        const now = new Date();
        const timeframeDays = parseInt(selectedTimeframe);
        const startDate = new Date(now.getTime() - (timeframeDays * 24 * 60 * 60 * 1000));

        // Calculate user stats
        const totalUsers = userData.length;
        const activeUsers = userData.filter(user => user.is_active).length;
        const verifiedUsers = userData.filter(user => user.is_phone_verified).length;
        const totalDoctors = userData.filter(user => user.user_type === 'doctor').length;
        const totalPatients = userData.filter(user => user.user_type === 'patient').length;
        const totalPharmacies = userData.filter(user => user.user_type === 'pharmacy').length;

        // Calculate user growth (compare current vs previous month)
        const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
        const sixtyDaysAgo = new Date(now.getTime() - (60 * 24 * 60 * 60 * 1000));

        const currentMonthUsers = userData.filter(user =>
            new Date(user.created_at) >= thirtyDaysAgo
        ).length;

        const previousMonthUsers = userData.filter(user => {
            const createdAt = new Date(user.created_at);
            return createdAt >= sixtyDaysAgo && createdAt < thirtyDaysAgo;
        }).length;

        const userGrowth = previousMonthUsers > 0 ?
            ((currentMonthUsers - previousMonthUsers) / previousMonthUsers) * 100 : 0;

        // Process user type distribution
        const typeDistribution = Object.keys(userTypeConfig).map(type => ({
            name: userTypeConfig[type].label,
            value: userData.filter(user => user.user_type === type).length,
            color: userTypeConfig[type].color
        }));

        // Process user registration trends (last 14 days)
        const registrationData = {};
        const last14Days = new Date(now.getTime() - (14 * 24 * 60 * 60 * 1000));

        userData.filter(user => new Date(user.created_at) >= last14Days)
            .forEach(user => {
                const date = new Date(user.created_at).toLocaleDateString();
                if (!registrationData[date]) {
                    registrationData[date] = { total: 0, doctors: 0, patients: 0, pharmacies: 0 };
                }
                registrationData[date].total += 1;
                registrationData[date][user.user_type + 's'] = (registrationData[date][user.user_type + 's'] || 0) + 1;
            });

        const userRegistrationData = Object.entries(registrationData)
            .sort(([a], [b]) => new Date(a) - new Date(b))
            .map(([date, data]) => ({
                date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                total: data.total,
                doctors: data.doctors || 0,
                patients: data.patients || 0,
                pharmacies: data.pharmacies || 0
            }));

        // Get recent users (last 5)
        const recentUsers = userData
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 5);

        setStats(prev => ({
            ...prev,
            totalUsers,
            activeUsers,
            verifiedUsers,
            totalDoctors,
            totalPatients,
            totalPharmacies,
            userGrowth
        }));

        setUserTypeDistribution(typeDistribution);
        setUserRegistrationData(userRegistrationData);
        setRecentUsers(recentUsers);
    };

    const processDrugData = (drugData) => {
        const totalDrugs = drugData.length;
        const prescriptionDrugs = drugData.filter(drug => drug.requires_prescription).length;

        // Process drug category distribution
        const categoryCount = drugData.reduce((acc, drug) => {
            acc[drug.category] = (acc[drug.category] || 0) + 1;
            return acc;
        }, {});

        const categoryData = Object.entries(categoryCount).map(([category, count], index) => ({
            name: category.charAt(0).toUpperCase() + category.slice(1).replace('_', ' '),
            value: count,
            color: COLORS[index % COLORS.length]
        }));

        setStats(prev => ({
            ...prev,
            totalDrugs,
            prescriptionDrugs
        }));

        setCategoryData(categoryData);
    };

    const processHospitalData = (hospitalData) => {
        const totalHospitals = hospitalData.length;
        const activeHospitals = hospitalData.filter(hospital => hospital.is_active).length;

        // Get recent hospitals (last 3)
        const recentHospitals = hospitalData
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 3);

        setStats(prev => ({
            ...prev,
            totalHospitals,
            activeHospitals
        }));

        setRecentHospitals(recentHospitals);

        // Generate mock system activity data
        const activityData = Array.from({ length: 7 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (6 - i));
            return {
                date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                users: Math.floor(Math.random() * 50) + 20,
                registrations: Math.floor(Math.random() * 10) + 2,
                activity: Math.floor(Math.random() * 100) + 50
            };
        });

        setSystemActivityData(activityData);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const getUserTypeIcon = (userType) => {
        switch (userType) {
            case 'doctor': return <Stethoscope className="w-4 h-4" />;
            case 'pharmacy': return <Building2 className="w-4 h-4" />;
            case 'patient': return <Users className="w-4 h-4" />;
            case 'admin': return <Shield className="w-4 h-4" />;
            default: return <Users className="w-4 h-4" />;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="flex flex-col items-center space-y-4">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    <p className="text-gray-600">Loading admin dashboard...</p>
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
                        Admin Dashboard
                    </h1>
                    <p className="text-sm text-gray-600 mt-1">
                        System administration and management overview
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

            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Users</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-blue-100">
                            <Users className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm">
                        {stats.userGrowth >= 0 ? (
                            <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                        ) : (
                            <TrendingDown className="w-4 h-4 text-red-600 mr-1" />
                        )}
                        <span className={stats.userGrowth >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {Math.abs(stats.userGrowth).toFixed(1)}% vs last month
                        </span>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Active Users</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.activeUsers}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-green-100">
                            <CheckCircle className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm">
                        <span className="text-gray-600">
                            {stats.verifiedUsers} verified accounts
                        </span>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Healthcare Providers</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.totalDoctors + stats.totalPharmacies}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-purple-100">
                            <Stethoscope className="w-6 h-6 text-purple-600" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm">
                        <span className="text-gray-600">
                            {stats.totalDoctors} doctors, {stats.totalPharmacies} pharmacies
                        </span>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">System Health</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.systemHealth}%</p>
                        </div>
                        <div className="p-3 rounded-lg bg-indigo-100">
                            <Activity className="w-6 h-6 text-indigo-600" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-1" />
                        <span className="text-green-600">All systems operational</span>
                    </div>
                </div>
            </div>

            {/* Secondary Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Drug Catalog</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.totalDrugs}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-yellow-100">
                            <Pill className="w-6 h-6 text-yellow-600" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm">
                        <span className="text-gray-600">
                            {stats.prescriptionDrugs} prescription drugs
                        </span>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Hospitals</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.totalHospitals}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-red-100">
                            <Building className="w-6 h-6 text-red-600" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm">
                        <span className="text-gray-600">
                            {stats.activeHospitals} active hospitals
                        </span>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Patients</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.totalPatients}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-pink-100">
                            <Heart className="w-6 h-6 text-pink-600" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm">
                        <span className="text-gray-600">
                            Registered patients
                        </span>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* User Registration Trends */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-gray-900">User Registration Trends</h3>
                        <UserPlus className="w-5 h-5 text-gray-400" />
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <RechartsLineChart data={userRegistrationData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="total" stroke="#3B82F6" strokeWidth={2} name="Total" />
                            <Line type="monotone" dataKey="doctors" stroke="#10B981" strokeWidth={2} name="Doctors" />
                            <Line type="monotone" dataKey="patients" stroke="#8B5CF6" strokeWidth={2} name="Patients" />
                        </RechartsLineChart>
                    </ResponsiveContainer>
                </div>

                {/* System Activity */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-gray-900">System Activity</h3>
                        <Activity className="w-5 h-5 text-gray-400" />
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={systemActivityData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Area type="monotone" dataKey="activity" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.3} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* User Type Distribution */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-gray-900">User Distribution</h3>
                        <PieChart className="w-5 h-5 text-gray-400" />
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <RechartsPieChart>
                            <Pie
                                data={userTypeDistribution}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {userTypeDistribution.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </RechartsPieChart>
                    </ResponsiveContainer>
                </div>

                {/* Drug Categories */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-gray-900">Drug Categories</h3>
                        <Factory className="w-5 h-5 text-gray-400" />
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={drugCategoryData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="value" fill="#10B981">
                                {drugCategoryData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent User Registrations */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-gray-900">Recent User Registrations</h3>
                        <Users className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="space-y-4">
                        {recentUsers.length > 0 ? (
                            recentUsers.map((user) => (
                                <div key={user.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                                        <span className="text-white text-sm font-medium">
                                            {user.first_name[0]}{user.last_name[0]}
                                        </span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-900">
                                            {user.first_name} {user.last_name}
                                        </p>
                                        <div className="flex items-center space-x-2">
                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${userTypeConfig[user.user_type]?.bg} ${userTypeConfig[user.user_type]?.text}`}>
                                                {getUserTypeIcon(user.user_type)}
                                                <span className="ml-1 capitalize">{user.user_type}</span>
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                {formatDate(user.created_at)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center text-gray-500 py-4">
                                <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                <p className="text-sm">No recent registrations</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent Hospitals */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-gray-900">Recent Hospitals</h3>
                        <Building className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="space-y-4">
                        {recentHospitals.length > 0 ? (
                            recentHospitals.map((hospital) => (
                                <div key={hospital.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                                    <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center">
                                        <Building className="w-5 h-5 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-900">{hospital.name}</p>
                                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                                            <MapPin className="w-3 h-3" />
                                            <span>{hospital.location}</span>
                                            <span>•</span>
                                            <span>{formatDate(hospital.created_at)}</span>
                                        </div>
                                    </div>
                                    <span className={`px-2 py-1 text-xs rounded-full ${hospital.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {hospital.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div className="text-center text-gray-500 py-4">
                                <Building className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                <p className="text-sm">No recent hospitals</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* System Status */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-6 shadow-sm border border-blue-200">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">System Status & Insights</h3>
                    <Shield className="w-5 h-5 text-blue-600" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white rounded-lg p-4">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-900">Database</p>
                                <p className="text-xs text-gray-500">Online - 99.9% uptime</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg p-4">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <Activity className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-900">API Services</p>
                                <p className="text-xs text-gray-500">All endpoints active</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg p-4">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                <Users className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-900">User Sessions</p>
                                <p className="text-xs text-gray-500">{stats.activeUsers} active now</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg p-4">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                                <Zap className="w-5 h-5 text-yellow-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-900">Performance</p>
                                <p className="text-xs text-gray-500">Response time: 120ms</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>


            {/* System Alerts */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">System Alerts & Notifications</h3>
                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                </div>
                <div className="space-y-4">
                    <div className="flex items-start space-x-3 p-4 bg-green-50 rounded-lg border border-green-200">
                        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-green-800">System Status: All Good</p>
                            <p className="text-xs text-green-600">All services are running normally. No issues detected.</p>
                        </div>
                        <span className="text-xs text-green-500 ml-auto">Just now</span>
                    </div>

                    <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <Activity className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-blue-800">Daily Backup Completed</p>
                            <p className="text-xs text-blue-600">System backup completed successfully at 2:00 AM.</p>
                        </div>
                        <span className="text-xs text-blue-500 ml-auto">6h ago</span>
                    </div>

                    <div className="flex items-start space-x-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                        <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-yellow-800">High Registration Volume</p>
                            <p className="text-xs text-yellow-600">Unusual number of new registrations detected today.</p>
                        </div>
                        <span className="text-xs text-yellow-500 ml-auto">2h ago</span>
                    </div>

                    {stats.totalUsers === 0 && (
                        <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <AlertCircle className="w-5 h-5 text-gray-600 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-gray-800">No System Alerts</p>
                                <p className="text-xs text-gray-600">System is operating normally with no active alerts.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;