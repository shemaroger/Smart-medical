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
import { appointmentService } from '../../api';

const AppointmentAnalyticsReportPage = () => {
    const navigate = useNavigate();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filter states
    const [filters, setFilters] = useState({
        status: 'all',
        hospitalId: 'all',
        doctorSpecialty: 'all',
        appointmentDateFrom: '',
        appointmentDateTo: '',
        searchTerm: '',
        createdDateFrom: '',
        createdDateTo: ''
    });

    const appointmentStatuses = [
        { value: 'pending', label: 'Pending' },
        { value: 'approved', label: 'Approved' },
        { value: 'completed', label: 'Completed' },
        { value: 'cancelled', label: 'Cancelled' }
    ];


    // Get user data and verify admin role
    const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
    const isAdmin = userData?.user_type === 'doctor';

    useEffect(() => {
        if (!isAdmin) {
            toast.error('Access denied. Administrator privileges required.');
            navigate('/dashboard');
            return;
        }
        fetchAllAppointments();
    }, [isAdmin, navigate]);

    const fetchAllAppointments = async () => {
        setLoading(true);
        try {
            const result = await appointmentService.getAll();
            if (result.success) {
                const appointmentsData = result.data.results || result.data || [];
                setAppointments(appointmentsData);
            } else {
                toast.error('Failed to fetch appointments');
                setAppointments([]);
            }
        } catch (error) {
            console.error('Error fetching appointments:', error);
            toast.error('Error loading appointments');
            setAppointments([]);
        } finally {
            setLoading(false);
        }
    };

    // Data Processing
    const getFilteredAppointments = () => {
        return appointments.filter(appointment => {
            if (filters.status !== 'all' && appointment.status !== filters.status) return false;

            if (filters.hospitalId !== 'all' && appointment.hospital?.id !== parseInt(filters.hospitalId)) return false;

            if (filters.doctorSpecialty !== 'all' && appointment.doctor?.specialization !== filters.doctorSpecialty) return false;

            if (filters.appointmentDateFrom) {
                const appointmentDate = new Date(appointment.appointment_date);
                const fromDate = new Date(filters.appointmentDateFrom);
                if (appointmentDate < fromDate) return false;
            }

            if (filters.appointmentDateTo) {
                const appointmentDate = new Date(appointment.appointment_date);
                const toDate = new Date(filters.appointmentDateTo);
                if (appointmentDate > toDate) return false;
            }

            if (filters.createdDateFrom) {
                const createdDate = new Date(appointment.created_at);
                const fromDate = new Date(filters.createdDateFrom);
                if (createdDate < fromDate) return false;
            }

            if (filters.createdDateTo) {
                const createdDate = new Date(appointment.created_at);
                const toDate = new Date(filters.createdDateTo);
                if (createdDate > toDate) return false;
            }

            if (filters.searchTerm) {
                const searchTerm = filters.searchTerm.toLowerCase();
                const patientName = `${appointment.patient?.user?.first_name || ''} ${appointment.patient?.user?.last_name || ''}`.toLowerCase();
                const doctorName = `${appointment.doctor?.user?.first_name || ''} ${appointment.doctor?.user?.last_name || ''}`.toLowerCase();
                const hospitalName = appointment.hospital?.name?.toLowerCase() || '';
                const reason = appointment.reason?.toLowerCase() || '';

                if (!patientName.includes(searchTerm) &&
                    !doctorName.includes(searchTerm) &&
                    !hospitalName.includes(searchTerm) &&
                    !reason.includes(searchTerm)) {
                    return false;
                }
            }

            return true;
        });
    };

    const calculateStats = () => {
        const filteredAppointments = getFilteredAppointments();
        const stats = {
            totalAppointments: filteredAppointments.length,
            pendingAppointments: filteredAppointments.filter(a => a.status === 'pending').length,
            approvedAppointments: filteredAppointments.filter(a => a.status === 'approved').length,
            completedAppointments: filteredAppointments.filter(a => a.status === 'completed').length,
            cancelledAppointments: filteredAppointments.filter(a => a.status === 'cancelled').length,

            // Time trends
            thisMonth: 0,
            lastMonth: 0,
            thisYear: 0,

            // Hospital diversity
            totalHospitals: 0,

            // Doctor specialty diversity
            totalSpecialties: 0,

            // Completion rate
            completionRate: 0,

            // Average appointments per day
            avgAppointmentsPerDay: 0
        };

        if (filteredAppointments.length > 0) {
            // Time trends
            const now = new Date();
            const thisMonth = now.getMonth();
            const thisYear = now.getFullYear();
            const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;

            stats.thisMonth = filteredAppointments.filter(a => {
                const appointmentDate = new Date(a.appointment_date);
                return appointmentDate.getMonth() === thisMonth && appointmentDate.getFullYear() === thisYear;
            }).length;

            stats.lastMonth = filteredAppointments.filter(a => {
                const appointmentDate = new Date(a.appointment_date);
                return appointmentDate.getMonth() === lastMonth &&
                    appointmentDate.getFullYear() === (thisMonth === 0 ? thisYear - 1 : thisYear);
            }).length;

            stats.thisYear = filteredAppointments.filter(a => {
                const appointmentDate = new Date(a.appointment_date);
                return appointmentDate.getFullYear() === thisYear;
            }).length;

            // Hospital diversity
            const uniqueHospitals = new Set(filteredAppointments.map(a => a.hospital?.name).filter(Boolean));
            stats.totalHospitals = uniqueHospitals.size;

            // Specialty diversity
            const uniqueSpecialties = new Set(filteredAppointments.map(a => a.doctor?.specialization).filter(Boolean));
            stats.totalSpecialties = uniqueSpecialties.size;

            // Completion rate
            const completedAndApproved = stats.completedAppointments + stats.approvedAppointments;
            stats.completionRate = (completedAndApproved / stats.totalAppointments) * 100;

            // Average appointments per day (last 30 days)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const last30DaysAppointments = filteredAppointments.filter(a => {
                const appointmentDate = new Date(a.appointment_date);
                return appointmentDate >= thirtyDaysAgo;
            });
            stats.avgAppointmentsPerDay = (last30DaysAppointments.length / 30).toFixed(1);
        }

        return stats;
    };

    // Get unique hospitals for filter
    const getUniqueHospitals = () => {
        const hospitals = [...new Set(appointments.map(a => ({
            id: a.hospital?.id,
            name: a.hospital?.name
        })).filter(h => h.id && h.name))];
        return hospitals.sort((a, b) => a.name.localeCompare(b.name));
    };

    // Get unique specialties for filter
    const getUniqueSpecialties = () => {
        const specialties = [...new Set(appointments.map(a => a.doctor?.specialization).filter(Boolean))];
        return specialties.sort();
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

    const formatDateTime = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            console.log(error)
            return 'Invalid Date';
        }
    };

    const clearFilters = () => {
        setFilters({
            status: 'all',
            hospitalId: 'all',
            doctorSpecialty: 'all',
            appointmentDateFrom: '',
            appointmentDateTo: '',
            searchTerm: '',
            createdDateFrom: '',
            createdDateTo: ''
        });
    };

    const hasActiveFilters = () => {
        return filters.status !== 'all' || filters.hospitalId !== 'all' ||
            filters.doctorSpecialty !== 'all' || filters.appointmentDateFrom ||
            filters.appointmentDateTo || filters.searchTerm ||
            filters.createdDateFrom || filters.createdDateTo;
    };

    const generatePDFReport = () => {
        const filteredAppointments = getFilteredAppointments();

        if (filteredAppointments.length === 0) {
            alert('No data to export. Please adjust your filters.');
            return;
        }

        const printWindow = window.open('', '_blank');
        const reportHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Appointment Management Analytics Report - Healthcare System</title>
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
                            <p>Appointment Analytics & Scheduling Management Platform</p>
                            <p>Healthcare Provider & Patient Appointment Insights</p>
                        </div>
                        <div class="report-title">Appointment Management Analytics Report</div>
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
                                    <th>Patient Name</th>
                                    <th>Doctor Name</th>
                                    <th>Hospital</th>
                                    <th>Specialty</th>
                                    <th>Appointment Date</th>
                                    <th>Status</th>
                                    <th>Created Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${filteredAppointments.map(appointment => `
                                    <tr>
                                        <td>${appointment.patient?.user?.first_name || ''} ${appointment.patient?.user?.last_name || 'Unknown Patient'}</td>
                                        <td>Dr. ${appointment.doctor?.user?.first_name || ''} ${appointment.doctor?.user?.last_name || 'Unknown Doctor'}</td>
                                        <td>${appointment.hospital?.name || 'N/A'}</td>
                                        <td>${appointment.doctor?.specialization || 'N/A'}</td>
                                        <td>${formatDateTime(appointment.appointment_date)}</td>
                                        <td>${appointment.status ? appointment.status.toUpperCase() : 'N/A'}</td>
                                        <td>${formatDate(appointment.created_at)}</td>
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
                                    <div class="signature-label">Medical Operations Manager</div>
                                    <div class="signature-title">Appointment Oversight</div>
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
    const filteredAppointments = getFilteredAppointments();
    const stats = calculateStats();
    const uniqueHospitals = getUniqueHospitals();
    const uniqueSpecialties = getUniqueSpecialties();

    // Show loading state while data is being fetched
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex items-center space-x-3">
                    <Loader className="w-8 h-8 animate-spin text-blue-600" />
                    <span className="text-gray-600">Loading appointment analytics...</span>
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
                                <Calendar className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-black uppercase">
                                    Appointment Management Analytics Report
                                </h1>
                                <p className="text-black text-sm font-medium">Comprehensive healthcare appointment scheduling analysis</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={generatePDFReport}
                                disabled={loading || filteredAppointments.length === 0}
                                className="bg-black hover:bg-gray-800 text-white px-6 py-3 border border-black font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                            >
                                <Download className="w-4 h-4" />
                                <span>Download PDF</span>
                            </button>
                            <button
                                onClick={fetchAllAppointments}
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
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-black mb-2 uppercase">
                                    Status
                                </label>
                                <select
                                    value={filters.status}
                                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                    className="w-full px-3 py-2 bg-white border-2 border-black focus:outline-none"
                                >
                                    <option value="all">All Statuses</option>
                                    {appointmentStatuses.map(status => (
                                        <option key={status.value} value={status.value}>
                                            {status.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-black mb-2 uppercase">
                                    Search
                                </label>
                                <input
                                    type="text"
                                    placeholder="Search appointments..."
                                    value={filters.searchTerm}
                                    onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
                                    className="w-full px-3 py-2 bg-white border-2 border-black focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-black mb-2 uppercase">
                                    Created Date From
                                </label>
                                <input
                                    type="date"
                                    value={filters.createdDateFrom}
                                    onChange={(e) => setFilters({ ...filters, createdDateFrom: e.target.value })}
                                    className="w-full px-3 py-2 bg-white border-2 border-black focus:outline-none"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                            <div>
                                <label className="block text-sm font-bold text-black mb-2 uppercase">
                                    Appointment Date From
                                </label>
                                <input
                                    type="date"
                                    value={filters.appointmentDateFrom}
                                    onChange={(e) => setFilters({ ...filters, appointmentDateFrom: e.target.value })}
                                    className="w-full px-3 py-2 bg-white border-2 border-black focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-black mb-2 uppercase">
                                    Appointment Date To
                                </label>
                                <input
                                    type="date"
                                    value={filters.appointmentDateTo}
                                    onChange={(e) => setFilters({ ...filters, appointmentDateTo: e.target.value })}
                                    className="w-full px-3 py-2 bg-white border-2 border-black focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-black mb-2 uppercase">
                                    Created Date To
                                </label>
                                <input
                                    type="date"
                                    value={filters.createdDateTo}
                                    onChange={(e) => setFilters({ ...filters, createdDateTo: e.target.value })}
                                    className="w-full px-3 py-2 bg-white border-2 border-black focus:outline-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Analytics Summary Report */}
                <div className="bg-gray-50 border-2 border-black p-6">
                    <div className="border-b border-black pb-4 mb-6">
                        <h3 className="text-lg font-bold text-black uppercase">Appointment Analytics Summary</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                        {/* Appointment Overview */}
                        <div className="bg-white border border-black p-4">
                            <h4 className="font-bold text-black mb-3 uppercase flex items-center">
                                <Calendar className="w-4 h-4 mr-2" />
                                Appointment Overview
                            </h4>
                            <div className="space-y-2 text-sm text-black">
                                <div className="flex justify-between">
                                    <span>Total Appointments:</span>
                                    <span className="font-bold">{stats.totalAppointments}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Pending:</span>
                                    <span className="font-bold text-yellow-600">{stats.pendingAppointments}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Approved:</span>
                                    <span className="font-bold text-blue-600">{stats.approvedAppointments}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Completed:</span>
                                    <span className="font-bold text-green-600">{stats.completedAppointments}</span>
                                </div>
                            </div>
                        </div>

                        {/* Scheduling Trends */}
                        <div className="bg-white border border-black p-4">
                            <h4 className="font-bold text-black mb-3 uppercase flex items-center">
                                <TrendingUp className="w-4 h-4 mr-2" />
                                Scheduling Trends
                            </h4>
                            <div className="space-y-2 text-sm text-black">
                                <div className="flex justify-between">
                                    <span>This Month:</span>
                                    <span className="font-bold">{stats.thisMonth} appointments</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Last Month:</span>
                                    <span className="font-bold">{stats.lastMonth} appointments</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>This Year:</span>
                                    <span className="font-bold">{stats.thisYear} appointments</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Growth Rate:</span>
                                    <span className="font-bold">{stats.lastMonth > 0 ? ((stats.thisMonth - stats.lastMonth) / stats.lastMonth * 100).toFixed(1) : 0}%</span>
                                </div>
                            </div>
                        </div>

                        {/* Healthcare Network */}
                        <div className="bg-white border border-black p-4">
                            <h4 className="font-bold text-black mb-3 uppercase flex items-center">
                                <Building2 className="w-4 h-4 mr-2" />
                                Healthcare Network
                            </h4>
                            <div className="space-y-2 text-sm text-black">
                                <div className="flex justify-between">
                                    <span>Total Hospitals:</span>
                                    <span className="font-bold text-blue-600">{stats.totalHospitals}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Specialties:</span>
                                    <span className="font-bold text-purple-600">{stats.totalSpecialties}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Avg Daily:</span>
                                    <span className="font-bold">{stats.avgAppointmentsPerDay} appointments</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Success Rate:</span>
                                    <span className="font-bold text-green-600">{stats.completionRate.toFixed(1)}%</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Appointment Status Distribution Chart */}
                    <div className="bg-white border border-black p-4 mb-6">
                        <h4 className="font-bold text-black mb-4 uppercase">Appointment Status Distribution</h4>
                        <div className="grid grid-cols-4 gap-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-yellow-600 mb-1">{stats.pendingAppointments}</div>
                                <div className="text-xs text-black uppercase font-bold">Pending</div>
                                <div className="text-xs text-black">
                                    {stats.totalAppointments > 0 ? ((stats.pendingAppointments / stats.totalAppointments) * 100).toFixed(1) : 0}%
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600 mb-1">{stats.approvedAppointments}</div>
                                <div className="text-xs text-black uppercase font-bold">Approved</div>
                                <div className="text-xs text-black">
                                    {stats.totalAppointments > 0 ? ((stats.approvedAppointments / stats.totalAppointments) * 100).toFixed(1) : 0}%
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-600 mb-1">{stats.completedAppointments}</div>
                                <div className="text-xs text-black uppercase font-bold">Completed</div>
                                <div className="text-xs text-black">
                                    {stats.totalAppointments > 0 ? ((stats.completedAppointments / stats.totalAppointments) * 100).toFixed(1) : 0}%
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-red-600 mb-1">{stats.cancelledAppointments}</div>
                                <div className="text-xs text-black uppercase font-bold">Cancelled</div>
                                <div className="text-xs text-black">
                                    {stats.totalAppointments > 0 ? ((stats.cancelledAppointments / stats.totalAppointments) * 100).toFixed(1) : 0}%
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Performance Analytics */}
                    <div className="bg-white border border-black p-4 mb-6">
                        <h4 className="font-bold text-black mb-4 uppercase">Performance Analytics</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-600 mb-1">
                                    {stats.completionRate.toFixed(1)}%
                                </div>
                                <div className="text-sm text-black uppercase font-bold">Success Rate</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600 mb-1">
                                    {stats.avgAppointmentsPerDay}
                                </div>
                                <div className="text-sm text-black uppercase font-bold">Daily Average</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-purple-600 mb-1">
                                    {stats.totalHospitals}
                                </div>
                                <div className="text-sm text-black uppercase font-bold">Network Hospitals</div>
                            </div>
                        </div>
                    </div>

                    {/* Monthly Trend Analysis */}
                    <div className="bg-white border border-black p-4 mb-6">
                        <h4 className="font-bold text-black mb-4 uppercase">Monthly Trend Analysis</h4>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-indigo-600 mb-1">
                                    {stats.thisMonth}
                                </div>
                                <div className="text-sm text-black uppercase font-bold">This Month</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-gray-600 mb-1">
                                    {stats.lastMonth}
                                </div>
                                <div className="text-sm text-black uppercase font-bold">Last Month</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-teal-600 mb-1">
                                    {stats.thisYear}
                                </div>
                                <div className="text-sm text-black uppercase font-bold">Year to Date</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-orange-600 mb-1">
                                    {stats.lastMonth > 0 ? ((stats.thisMonth - stats.lastMonth) / stats.lastMonth * 100).toFixed(1) : 0}%
                                </div>
                                <div className="text-sm text-black uppercase font-bold">Growth Rate</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AppointmentAnalyticsReportPage;