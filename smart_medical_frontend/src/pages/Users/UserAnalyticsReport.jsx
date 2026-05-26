import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
    Search,
    Filter,
    Eye,
    X,
    Loader,
    ArrowUpDown,
    ArrowDown,
    ArrowUp,
    Users,
    User,
    Calendar,
    Flag,
    AlertCircle,
    Shield,
    Database,
    FileText,
    Download,
    Target,
    Star,
    Hash,
    Activity,
    BarChart3,
    TrendingUp,
    Stethoscope,
    Building2,
    UserCheck,
    UserX,
    Phone,
    Mail,
    MapPin,
    CheckCircle,
    XCircle,
    Clock
} from 'lucide-react';
import { authService } from '../../api';

const UserAnalyticsReportPage = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filter states
    const [filters, setFilters] = useState({
        userType: 'all',
        status: 'all',
        verificationStatus: 'all',
        joinDateFrom: '',
        joinDateTo: '',
        searchTerm: '',
        location: 'all'
    });

    const userTypes = [
        { value: 'doctor', label: 'Doctor' },
        { value: 'patient', label: 'Patient' },
        { value: 'pharmacy', label: 'Pharmacy' },
        { value: 'admin', label: 'Administrator' }
    ];

    // Get user data and verify admin role
    const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
    const isAdmin = userData?.user_type === 'admin';

    useEffect(() => {
        if (!isAdmin) {
            toast.error('Access denied. Administrator privileges required.');
            navigate('/dashboard');
            return;
        }
        fetchAllUsers();
    }, [isAdmin, navigate]);

    const fetchAllUsers = async () => {
        setLoading(true);
        try {
            const result = await authService.getAllUsers();
            if (result.success) {
                const usersData = result.data.results || result.data || [];
                setUsers(usersData);
            } else {
                toast.error('Failed to fetch users');
                setUsers([]);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
            toast.error('Error loading users');
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    // Data Processing
    const getFilteredUsers = () => {
        return users.filter(user => {
            if (filters.userType !== 'all' && user.user_type !== filters.userType) return false;

            if (filters.status !== 'all') {
                const isActive = filters.status === 'active';
                if (user.is_active !== isActive) return false;
            }

            if (filters.verificationStatus !== 'all') {
                const isVerified = filters.verificationStatus === 'verified';
                if (user.is_phone_verified !== isVerified) return false;
            }

            if (filters.joinDateFrom) {
                const joinDate = new Date(user.created_at);
                const fromDate = new Date(filters.joinDateFrom);
                if (joinDate < fromDate) return false;
            }

            if (filters.joinDateTo) {
                const joinDate = new Date(user.created_at);
                const toDate = new Date(filters.joinDateTo);
                if (joinDate > toDate) return false;
            }

            if (filters.location !== 'all' && user.location !== filters.location) return false;

            if (filters.searchTerm) {
                const searchTerm = filters.searchTerm.toLowerCase();
                const userName = `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase();
                const email = user.email?.toLowerCase() || '';
                const phone = user.phone_number?.toLowerCase() || '';
                const location = user.location?.toLowerCase() || '';

                if (!userName.includes(searchTerm) &&
                    !email.includes(searchTerm) &&
                    !phone.includes(searchTerm) &&
                    !location.includes(searchTerm)) {
                    return false;
                }
            }

            return true;
        });
    };

    const calculateStats = () => {
        const filteredUsers = getFilteredUsers();
        const stats = {
            totalUsers: filteredUsers.length,
            activeUsers: filteredUsers.filter(u => u.is_active).length,
            inactiveUsers: filteredUsers.filter(u => !u.is_active).length,
            verifiedUsers: filteredUsers.filter(u => u.is_phone_verified).length,

            // User type breakdown
            doctors: filteredUsers.filter(u => u.user_type === 'doctor').length,
            patients: filteredUsers.filter(u => u.user_type === 'patient').length,
            pharmacies: filteredUsers.filter(u => u.user_type === 'pharmacy').length,
            admins: filteredUsers.filter(u => u.user_type === 'admin').length,

            // Registration trends
            thisMonth: 0,
            lastMonth: 0,
            thisYear: 0,

            // Location diversity
            totalLocations: 0,

            // Verification rate
            verificationRate: 0
        };

        if (filteredUsers.length > 0) {
            // Registration trends
            const now = new Date();
            const thisMonth = now.getMonth();
            const thisYear = now.getFullYear();
            const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;

            stats.thisMonth = filteredUsers.filter(u => {
                const joinDate = new Date(u.created_at);
                return joinDate.getMonth() === thisMonth && joinDate.getFullYear() === thisYear;
            }).length;

            stats.lastMonth = filteredUsers.filter(u => {
                const joinDate = new Date(u.created_at);
                return joinDate.getMonth() === lastMonth &&
                    joinDate.getFullYear() === (thisMonth === 0 ? thisYear - 1 : thisYear);
            }).length;

            stats.thisYear = filteredUsers.filter(u => {
                const joinDate = new Date(u.created_at);
                return joinDate.getFullYear() === thisYear;
            }).length;

            // Location diversity
            const uniqueLocations = new Set(filteredUsers.map(u => u.location).filter(Boolean));
            stats.totalLocations = uniqueLocations.size;

            // Verification rate
            stats.verificationRate = (stats.verifiedUsers / stats.totalUsers) * 100;
        }

        return stats;
    };

    // Get unique locations for filter
    const getUniqueLocations = () => {
        const locations = [...new Set(users.map(u => u.location).filter(Boolean))];
        return locations.sort();
    };

    // Utility Functions
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (error) {
            console.log(error)
            return 'Invalid Date';
        }
    };


    const clearFilters = () => {
        setFilters({
            userType: 'all',
            status: 'all',
            verificationStatus: 'all',
            joinDateFrom: '',
            joinDateTo: '',
            searchTerm: '',
            location: 'all'
        });
    };

    const hasActiveFilters = () => {
        return filters.userType !== 'all' || filters.status !== 'all' ||
            filters.verificationStatus !== 'all' || filters.joinDateFrom ||
            filters.joinDateTo || filters.searchTerm || filters.location !== 'all';
    };

    const generatePDFReport = () => {
        const filteredUsers = getFilteredUsers();


        if (filteredUsers.length === 0) {
            alert('No data to export. Please adjust your filters.');
            return;
        }

        const printWindow = window.open('', '_blank');
        const reportHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>User Management Analytics Report - Healthcare System</title>
                <style>
                    body { 
                        font-family: Arial, sans-serif; 
                        margin: 0; 
                        padding: 20px; 
                        color: #000; 
                        line-height: 1.4; 
                        background: white;
                    }
                    .container {
                        max-width: 1200px;
                        margin: 0 auto;
                        background: white;
                        border: 2px solid #000;
                    }
                    .header { 
                        background: #f5f5f5;
                        color: #000;
                        padding: 30px;
                        text-align: center;
                        
                    }
                    .system-info {
                        margin-bottom: 20px;
                    }
                    .system-info h1 {
                        margin: 0;
                        font-size: 28px;
                        font-weight: bold;
                        text-transform: uppercase;
                    }
                    .system-info p {
                        margin: 5px 0;
                        font-size: 14px;
                    }
                    .report-title {
                        font-size: 20px;
                        font-weight: bold;
                        margin: 20px 0 10px 0;
                        text-transform: uppercase;
                        letter-spacing: 1px;
                        
                        padding-bottom: 5px;
                    }
                    .report-date {
                        font-size: 12px;
                    }
                    .content {
                        padding: 20px;
                    }
                    .section-title {
                        font-size: 16px;
                        font-weight: bold;
                        margin: 20px 0 15px 0;
                        padding-bottom: 5px;
                        
                        text-transform: uppercase;
                    }
                    .stats-grid {
                        display: grid;
                        grid-template-columns: repeat(4, 1fr);
                        gap: 15px;
                        margin: 20px 0;
                    }
                    .stat-box {
                        border: 1px solid #000;
                        padding: 15px;
                        text-align: center;
                        background: #f9f9f9;
                    }
                    .stat-value {
                        font-size: 24px;
                        font-weight: bold;
                        margin-bottom: 5px;
                    }
                    .stat-label {
                        font-size: 12px;
                        text-transform: uppercase;
                        font-weight: bold;
                    }
                    .table { 
                        width: 100%; 
                        border-collapse: collapse; 
                        margin-top: 15px;
                        border: 2px solid #000;
                    }
                    .table th, .table td { 
                        border: 1px solid #000; 
                        padding: 10px 8px; 
                        text-align: left; 
                        font-size: 11px; 
                    }
                    .table th { 
                        background: #f5f5f5;
                        font-weight: bold; 
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    }
                    .table tr:nth-child(even) { 
                        background: #fafafa; 
                    }
                    .footer { 
                        margin-top: 10px; 
                        padding: 10px;
                        background: #f5f5f5;
                    }
                    .signature-section {
                        padding-top: 10px;
                        margin-top: 10px;
                    }
                    .signature-grid {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 60px;
                    }
                    .signature-box {
                        text-align: center;
                    }
                    .signature-line {
                        border-bottom: 1px solid #000;
                        margin: 40px 0 10px 0;
                        height: 1px;
                    }
                    .signature-label {
                        font-weight: bold;
                        font-size: 12px;
                        text-transform: uppercase;
                    }
                    .signature-title {
                        font-size: 10px;
                        margin-top: 5px;
                    }
                    @media print {
                        body { 
                            background: white !important; 
                        }
                        .container {
                            border: none;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div class="system-info">
                            <h1>Healthcare Management System</h1>
                            <p>User Analytics & Account Management Platform</p>
                            <p>Healthcare Provider & Patient Registration Insights</p>
                        </div>
                        <div class="report-title">User Management Analytics Report</div>
                        <div class="report-date">Generated on ${new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })}</div>
                    </div>
                    
                    <div class="content">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>User Name</th>
                                    <th>Type</th>
                                    <th>Email</th>
                                    <th>Phone</th>
                                    <th>Location</th>
                                    <th>Status</th>
                                    <th>Joined</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${filteredUsers.map(user => `
                                    <tr>
                                        <td>${user.first_name || ''} ${user.last_name || 'Unknown User'}</td>
                                        <td>${user.user_type ? user.user_type.toUpperCase() : 'N/A'}</td>
                                        <td>${user.email || 'N/A'}</td>
                                        <td>${user.phone_number || 'N/A'}</td>
                                        <td>${user.location || 'N/A'}</td>
                                        <td>${user.is_active ? 'ACTIVE' : 'INACTIVE'}</td>
                                        <td>${formatDate(user.created_at)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                    
                    <div class="footer">
                       
                        <div class="signature-section">
                            <div class="signature-grid">
                                <div class="signature-box">
                                    <div class="signature-line"></div>
                                    <div class="signature-label">System Administrator</div>
                                    <div class="signature-title">Healthcare Management System</div>
                                    <div style="font-size: 10px; margin-top: 5px;">
                                        Date: ${new Date().toLocaleDateString('en-US')}
                                    </div>
                                </div>
                                <div class="signature-box">
                                    <div class="signature-line"></div>
                                    <div class="signature-label">Data Protection Officer</div>
                                    <div class="signature-title">Privacy & Compliance</div>
                                    <div style="font-size: 10px; margin-top: 5px;">
                                        Date: _________________
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `;

        printWindow.document.write(reportHTML);
        printWindow.document.close();
        setTimeout(() => {
            printWindow.print();
        }, 500);
    };

    // Computed Values
    const filteredUsers = getFilteredUsers();
    const stats = calculateStats();
    const uniqueLocations = getUniqueLocations();

    // Show loading state while data is being fetched
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex items-center space-x-3">
                    <Loader className="w-8 h-8 animate-spin text-blue-600" />
                    <span className="text-gray-600">Loading user analytics...</span>
                </div>
            </div>
        );
    }

    // Show access denied if not admin
    if (!isAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
                    <p className="text-gray-600 mb-4">
                        You need administrator privileges to access this page.
                    </p>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Go to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <div className="bg-gray-100 border-b-2 border-black">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="bg-blue-100 p-2 rounded-lg">
                                <BarChart3 className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-black uppercase">
                                    User Management Analytics Report
                                </h1>
                                <p className="text-black text-sm font-medium">Comprehensive healthcare system user analysis</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={generatePDFReport}
                                disabled={loading || filteredUsers.length === 0}
                                className="bg-black hover:bg-gray-800 text-white px-6 py-3 border border-black font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                            >
                                <Download className="w-4 h-4" />
                                <span>Download PDF</span>
                            </button>
                            <button
                                onClick={fetchAllUsers}
                                className="bg-white hover:bg-gray-100 text-black px-6 py-3 border-2 border-black font-semibold"
                            >
                                Refresh Data
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-6">
                {/* Filters Section */}
                <div className="bg-gray-50 border-2 border-black mb-6">
                    <div className="p-6 border-b border-black">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-black uppercase">Analytics Filters</h3>
                            {hasActiveFilters() && (
                                <button
                                    onClick={clearFilters}
                                    className="text-sm px-4 py-2 text-black border border-black hover:bg-gray-100"
                                >
                                    Clear All Filters
                                </button>
                            )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-black mb-2 uppercase">
                                    User Type
                                </label>
                                <select
                                    value={filters.userType}
                                    onChange={(e) => setFilters({ ...filters, userType: e.target.value })}
                                    className="w-full px-3 py-2 bg-white border-2 border-black focus:outline-none"
                                >
                                    <option value="all">All User Types</option>
                                    {userTypes.map(type => (
                                        <option key={type.value} value={type.value}>
                                            {type.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-black mb-2 uppercase">
                                    Status
                                </label>
                                <select
                                    value={filters.status}
                                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                    className="w-full px-3 py-2 bg-white border-2 border-black focus:outline-none"
                                >
                                    
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-black mb-2 uppercase">
                                    Verification
                                </label>
                                <select
                                    value={filters.verificationStatus}
                                    onChange={(e) => setFilters({ ...filters, verificationStatus: e.target.value })}
                                    className="w-full px-3 py-2 bg-white border-2 border-black focus:outline-none"
                                >
                                    <option value="all">All Verification</option>
                                    <option value="verified">Verified</option>
                                    <option value="unverified">Unverified</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-black mb-2 uppercase">
                                    Location
                                </label>
                                <select
                                    value={filters.location}
                                    onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                                    className="w-full px-3 py-2 bg-white border-2 border-black focus:outline-none"
                                >
                                    <option value="all">All Locations</option>
                                    {uniqueLocations.map(location => (
                                        <option key={location} value={location}>
                                            {location}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                            <div>
                                <label className="block text-sm font-bold text-black mb-2 uppercase">
                                    Join Date From
                                </label>
                                <input
                                    type="date"
                                    value={filters.joinDateFrom}
                                    onChange={(e) => setFilters({ ...filters, joinDateFrom: e.target.value })}
                                    className="w-full px-3 py-2 bg-white border-2 border-black focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-black mb-2 uppercase">
                                    Join Date To
                                </label>
                                <input
                                    type="date"
                                    value={filters.joinDateTo}
                                    onChange={(e) => setFilters({ ...filters, joinDateTo: e.target.value })}
                                    className="w-full px-3 py-2 bg-white border-2 border-black focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-black mb-2 uppercase">
                                    Search Users
                                </label>
                                <input
                                    type="text"
                                    placeholder="Search by name, email, phone..."
                                    value={filters.searchTerm}
                                    onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
                                    className="w-full px-3 py-2 bg-white border-2 border-black focus:outline-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>


                {/* Analytics Summary Report */}
                <div className="bg-gray-50 border-2 border-black p-6">
                    <div className="border-b border-black pb-4 mb-6">
                        <h3 className="text-lg font-bold text-black uppercase">User Analytics Summary</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                        {/* User Composition */}
                        <div className="bg-white border border-black p-4">
                            <h4 className="font-bold text-black mb-3 uppercase flex items-center">
                                <Users className="w-4 h-4 mr-2" />
                                User Composition
                            </h4>
                            <div className="space-y-2 text-sm text-black">
                                <div className="flex justify-between">
                                    <span>Total Users:</span>
                                    <span className="font-bold">{stats.totalUsers}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Active Users:</span>
                                    <span className="font-bold text-green-600">{stats.activeUsers}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Inactive Users:</span>
                                    <span className="font-bold text-red-600">{stats.inactiveUsers}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Verified Users:</span>
                                    <span className="font-bold text-blue-600">{stats.verifiedUsers}</span>
                                </div>
                            </div>
                        </div>

                        {/* Registration Trends */}
                        <div className="bg-white border border-black p-4">
                            <h4 className="font-bold text-black mb-3 uppercase flex items-center">
                                <TrendingUp className="w-4 h-4 mr-2" />
                                Registration Trends
                            </h4>
                            <div className="space-y-2 text-sm text-black">
                                <div className="flex justify-between">
                                    <span>This Month:</span>
                                    <span className="font-bold">{stats.thisMonth} users</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Last Month:</span>
                                    <span className="font-bold">{stats.lastMonth} users</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>This Year:</span>
                                    <span className="font-bold">{stats.thisYear} users</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Growth Rate:</span>
                                    <span className="font-bold">{stats.lastMonth > 0 ? ((stats.thisMonth - stats.lastMonth) / stats.lastMonth * 100).toFixed(1) : 0}%</span>
                                </div>
                            </div>
                        </div>

                        {/* User Categories */}
                        <div className="bg-white border border-black p-4">
                            <h4 className="font-bold text-black mb-3 uppercase flex items-center">
                                <Target className="w-4 h-4 mr-2" />
                                User Categories
                            </h4>
                            <div className="space-y-2 text-sm text-black">
                                <div className="flex justify-between">
                                    <span>Healthcare Providers:</span>
                                    <span className="font-bold text-blue-600">{stats.doctors + stats.pharmacies}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Patients:</span>
                                    <span className="font-bold text-purple-600">{stats.patients}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Administrators:</span>
                                    <span className="font-bold text-red-600">{stats.admins}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Geographic Coverage:</span>
                                    <span className="font-bold">{stats.totalLocations} locations</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* User Type Distribution Chart */}
                    <div className="bg-white border border-black p-4 mb-6">
                        <h4 className="font-bold text-black mb-4 uppercase">User Type Distribution</h4>
                        <div className="grid grid-cols-4 gap-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600 mb-1">{stats.doctors}</div>
                                <div className="text-xs text-black uppercase font-bold">Doctors</div>
                                <div className="text-xs text-black">
                                    {stats.totalUsers > 0 ? ((stats.doctors / stats.totalUsers) * 100).toFixed(1) : 0}%
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-purple-600 mb-1">{stats.patients}</div>
                                <div className="text-xs text-black uppercase font-bold">Patients</div>
                                <div className="text-xs text-black">
                                    {stats.totalUsers > 0 ? ((stats.patients / stats.totalUsers) * 100).toFixed(1) : 0}%
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-600 mb-1">{stats.pharmacies}</div>
                                <div className="text-xs text-black uppercase font-bold">Pharmacies</div>
                                <div className="text-xs text-black">
                                    {stats.totalUsers > 0 ? ((stats.pharmacies / stats.totalUsers) * 100).toFixed(1) : 0}%
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-red-600 mb-1">{stats.admins}</div>
                                <div className="text-xs text-black uppercase font-bold">Administrators</div>
                                <div className="text-xs text-black">
                                    {stats.totalUsers > 0 ? ((stats.admins / stats.totalUsers) * 100).toFixed(1) : 0}%
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Verification Analytics */}
                    <div className="bg-white border border-black p-4 mb-6">
                        <h4 className="font-bold text-black mb-4 uppercase">Verification Analytics</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-600 mb-1">
                                    {stats.verificationRate.toFixed(1)}%
                                </div>
                                <div className="text-sm text-black uppercase font-bold">Verification Rate</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600 mb-1">
                                    {stats.verifiedUsers}
                                </div>
                                <div className="text-sm text-black uppercase font-bold">Verified Users</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-orange-600 mb-1">
                                    {stats.totalUsers - stats.verifiedUsers}
                                </div>
                                <div className="text-sm text-black uppercase font-bold">Pending Verification</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>


        </div>
    );
};

export default UserAnalyticsReportPage;