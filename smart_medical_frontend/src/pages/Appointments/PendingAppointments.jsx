import React, { useState, useEffect } from 'react';
import {
    Calendar, Clock, User, Stethoscope, Building2, Search, Filter,
    Eye, CheckCircle, XCircle, Clock as ClockIcon, AlertCircle,
    RefreshCw, FileText, MapPin, Phone, Mail, Edit, Save, X,
    Loader2, Users, Activity, TrendingUp, AlertTriangle, Pill
} from 'lucide-react';
import { toast } from 'react-toastify';
import { appointmentService, getCurrentUser } from '../../api';

const PendingAppointments = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFilter, setDateFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [appointmentsPerPage] = useState(15);
    const [userData, setUserData] = useState(null);

    const [statusFormData, setStatusFormData] = useState({
        status: '',
        notes: ''
    });

    const statusConfig = {
        pending: { color: 'yellow', icon: ClockIcon, label: 'Pending', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800' },
        approved: { color: 'blue', icon: CheckCircle, label: 'Approved', bgColor: 'bg-blue-100', textColor: 'text-blue-800' },
        completed: { color: 'green', icon: CheckCircle, label: 'Completed', bgColor: 'bg-green-100', textColor: 'text-green-800' },
        cancelled: { color: 'red', icon: XCircle, label: 'Cancelled', bgColor: 'bg-red-100', textColor: 'text-red-800' }
    };

    const statusChoices = [
        { value: 'approved', label: 'Approve' },
        { value: 'cancelled', label: 'Cancel' }
    ];

    useEffect(() => {
        initializePage();
    }, []);

    const initializePage = async () => {
        try {
            const user = getCurrentUser();
            if (!user) {
                toast.error('Please log in to access appointments');
                return;
            }
            setUserData(user);
            await fetchPendingAppointments();
        } catch (error) {
            console.error('Error initializing page:', error);
            toast.error('Failed to load page data');
        } finally {
            setLoading(false);
        }
    };

    const fetchPendingAppointments = async () => {
        try {
            // Filter for only pending appointments
            const response = await appointmentService.getAll({ status: 'pending' });
            if (response.success) {
                const appointmentData = response.data.results || response.data || [];
                setAppointments(appointmentData);
            } else {
                toast.error('Failed to fetch pending appointments');
            }
        } catch (error) {
            console.error('Error fetching pending appointments:', error);
            toast.error('Failed to fetch pending appointments');
        }
    };

    const handleViewDetails = async (appointment) => {
        try {
            const response = await appointmentService.getById(appointment.id);
            if (response.success) {
                setSelectedAppointment(response.data);
                setShowDetailsModal(true);
            } else {
                toast.error('Failed to fetch appointment details');
            }
        } catch (error) {
            console.error('Error fetching appointment details:', error);
            toast.error('Failed to fetch appointment details');
        }
    };

    const handleStatusUpdate = (appointment) => {
        setSelectedAppointment(appointment);
        setStatusFormData({
            status: 'approved', // Default to approve
            notes: ''
        });
        setShowStatusModal(true);
    };

    const handleSubmitStatusUpdate = async (e) => {
        e.preventDefault();
        if (!statusFormData.status) {
            toast.error('Please select an action');
            return;
        }

        setSubmitting(true);
        try {
            const response = await appointmentService.updateStatus(selectedAppointment.id, {
                status: statusFormData.status,
                notes: statusFormData.notes
            });

            if (response.success) {
                toast.success(`Appointment ${statusFormData.status === 'approved' ? 'approved' : 'cancelled'} successfully`);
                setShowStatusModal(false);
                resetStatusForm();
                fetchPendingAppointments(); // Refresh to remove the processed appointment
            } else {
                toast.error(response.error || 'Failed to update appointment status');
            }
        } catch (error) {
            console.error('Error updating appointment status:', error);
            toast.error('Failed to update appointment status');
        } finally {
            setSubmitting(false);
        }
    };

    const resetStatusForm = () => {
        setStatusFormData({
            status: '',
            notes: ''
        });
        setSelectedAppointment(null);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
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

    const formatDateTime = (dateString) => {
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusBadge = (status) => {
        const config = statusConfig[status];
        return (
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor}`}>
                <config.icon className="w-3 h-3 mr-1" />
                {config.label}
            </span>
        );
    };

    const filteredAppointments = appointments.filter(appointment => {
        const matchesSearch =
            appointment.patient?.user?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            appointment.patient?.user?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            appointment.doctor?.user?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            appointment.doctor?.user?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            appointment.doctor?.specialization?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            appointment.hospital?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            appointment.reason?.toLowerCase().includes(searchTerm.toLowerCase());

        let matchesDate = true;
        if (dateFilter === 'today') {
            const today = new Date().toDateString();
            matchesDate = new Date(appointment.appointment_date).toDateString() === today;
        } else if (dateFilter === 'week') {
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            matchesDate = new Date(appointment.appointment_date) >= weekAgo;
        } else if (dateFilter === 'month') {
            const monthAgo = new Date();
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            matchesDate = new Date(appointment.appointment_date) >= monthAgo;
        }

        return matchesSearch && matchesDate;
    });

    const totalPages = Math.ceil(filteredAppointments.length / appointmentsPerPage);
    const startIndex = (currentPage - 1) * appointmentsPerPage;
    const paginatedAppointments = filteredAppointments.slice(startIndex, startIndex + appointmentsPerPage);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="flex flex-col items-center space-y-4">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    <p className="text-gray-600">Loading pending appointments...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Pending Appointments</h1>
                    <p className="text-sm text-gray-600 mt-1">
                        Review and approve pending appointment requests
                    </p>
                </div>
                <div className="flex items-center space-x-3 mt-4 sm:mt-0">
                    <button
                        onClick={fetchPendingAppointments}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Stats Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center">
                        <div className="p-3 rounded-lg bg-yellow-100">
                            <ClockIcon className="w-6 h-6 text-yellow-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Pending Appointments</p>
                            <p className="text-2xl font-bold text-gray-900">{appointments.length}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center">
                        <div className="p-3 rounded-lg bg-blue-100">
                            <Calendar className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Today's Pending</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {appointments.filter(a => {
                                    const today = new Date().toDateString();
                                    return new Date(a.appointment_date).toDateString() === today;
                                }).length}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center">
                        <div className="p-3 rounded-lg bg-red-100">
                            <AlertTriangle className="w-6 h-6 text-red-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Urgent (Overdue)</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {appointments.filter(a => {
                                    const appointmentDate = new Date(a.appointment_date);
                                    const now = new Date();
                                    return appointmentDate < now;
                                }).length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search pending appointments..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <select
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                    >
                        <option value="all">All Dates</option>
                        <option value="today">Today</option>
                        <option value="week">This Week</option>
                        <option value="month">This Month</option>
                    </select>

                    <div className="text-sm text-gray-500 flex items-center">
                        Showing {filteredAppointments.length} pending appointments
                    </div>
                </div>
            </div>

            {/* Appointments Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor & Hospital</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {paginatedAppointments.length > 0 ? (
                                paginatedAppointments.map((appointment) => {
                                    const isOverdue = new Date(appointment.appointment_date) < new Date();
                                    return (
                                        <tr key={appointment.id} className={`hover:bg-gray-50 transition-colors ${isOverdue ? 'bg-red-50' : ''}`}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                                                        <User className="w-5 h-5 text-white" />
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {appointment.patient?.user?.first_name} {appointment.patient?.user?.last_name}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {appointment.patient?.user?.email}
                                                        </div>
                                                        {appointment.patient?.user?.phone_number && (
                                                            <div className="text-xs text-gray-400">
                                                                {appointment.patient.user.phone_number}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                                                        <Stethoscope className="w-5 h-5 text-white" />
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            Dr. {appointment.doctor?.user?.first_name} {appointment.doctor?.user?.last_name}
                                                        </div>
                                                        <div className="text-sm text-gray-500">{appointment.doctor?.specialization}</div>
                                                        <div className="text-xs text-gray-400 flex items-center mt-1">
                                                            <Building2 className="w-3 h-3 mr-1" />
                                                            {appointment.hospital?.name}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                <div className="flex items-center">
                                                    <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                                                    <div>
                                                        <div className={isOverdue ? 'text-red-600 font-medium' : ''}>
                                                            {formatDate(appointment.appointment_date)}
                                                        </div>
                                                        <div className={`text-xs flex items-center ${isOverdue ? 'text-red-500' : 'text-gray-500'}`}>
                                                            <Clock className="w-3 h-3 mr-1" />
                                                            {formatTime(appointment.appointment_date)}
                                                        </div>
                                                        {isOverdue && (
                                                            <div className="text-xs text-red-600 font-medium flex items-center mt-1">
                                                                <AlertTriangle className="w-3 h-3 mr-1" />
                                                                Overdue
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                <div className="max-w-xs truncate" title={appointment.reason}>
                                                    {appointment.reason}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {formatDate(appointment.created_at)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex items-center justify-end space-x-2">
                                                    <button
                                                        onClick={() => handleViewDetails(appointment)}
                                                        className="text-blue-600 hover:text-blue-900 p-1 rounded-lg hover:bg-blue-50 transition-colors"
                                                        title="View Details"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleStatusUpdate(appointment)}
                                                        className="text-green-600 hover:text-green-900 p-1 rounded-lg hover:bg-green-50 transition-colors"
                                                        title="Approve/Cancel"
                                                    >
                                                        <CheckCircle className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center">
                                        <CheckCircle className="w-12 h-12 text-green-300 mx-auto mb-4" />
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">No pending appointments</h3>
                                        <p className="text-gray-500">All appointments have been reviewed and processed</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="bg-white px-6 py-3 flex items-center justify-between border-t border-gray-200">
                        <div className="flex items-center text-sm text-gray-700">
                            Showing {startIndex + 1} to {Math.min(startIndex + appointmentsPerPage, filteredAppointments.length)} of {filteredAppointments.length} pending appointments
                        </div>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`px-3 py-1 border rounded-md text-sm font-medium ${currentPage === page
                                        ? 'border-blue-500 bg-blue-50 text-blue-600'
                                        : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    {page}
                                </button>
                            ))}
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Status Update Modal */}
            {showStatusModal && selectedAppointment && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl max-w-md w-full">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900">Review Appointment Request</h3>
                                <button
                                    onClick={() => {
                                        setShowStatusModal(false);
                                        resetStatusForm();
                                    }}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="mb-4 bg-gray-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-600 mb-1">
                                    <span className="font-medium">Patient:</span> {selectedAppointment.patient?.user?.first_name} {selectedAppointment.patient?.user?.last_name}
                                </p>
                                <p className="text-sm text-gray-600 mb-1">
                                    <span className="font-medium">Doctor:</span> Dr. {selectedAppointment.doctor?.user?.first_name} {selectedAppointment.doctor?.user?.last_name}
                                </p>
                                <p className="text-sm text-gray-600 mb-1">
                                    <span className="font-medium">Date:</span> {formatDateTime(selectedAppointment.appointment_date)}
                                </p>
                                <p className="text-sm text-gray-600">
                                    <span className="font-medium">Reason:</span> {selectedAppointment.reason}
                                </p>
                            </div>

                            <form onSubmit={handleSubmitStatusUpdate} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Action *
                                    </label>
                                    <select
                                        value={statusFormData.status}
                                        onChange={(e) => setStatusFormData(prev => ({ ...prev, status: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        {statusChoices.map(status => (
                                            <option key={status.value} value={status.value}>{status.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Notes (Optional)
                                    </label>
                                    <textarea
                                        value={statusFormData.notes}
                                        onChange={(e) => setStatusFormData(prev => ({ ...prev, notes: e.target.value }))}
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Add any notes or comments for the patient..."
                                    />
                                </div>

                                <div className="flex justify-end space-x-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowStatusModal(false);
                                            resetStatusForm();
                                        }}
                                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className={`px-4 py-2 rounded-lg text-white disabled:opacity-50 flex items-center ${statusFormData.status === 'approved'
                                            ? 'bg-green-600 hover:bg-green-700'
                                            : 'bg-red-600 hover:bg-red-700'
                                            }`}
                                    >
                                        {submitting ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                {statusFormData.status === 'approved' ? (
                                                    <>
                                                        <CheckCircle className="w-4 h-4 mr-2" />
                                                        Approve Appointment
                                                    </>
                                                ) : (
                                                    <>
                                                        <XCircle className="w-4 h-4 mr-2" />
                                                        Cancel Appointment
                                                    </>
                                                )}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Appointment Details Modal */}
            {showDetailsModal && selectedAppointment && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900">Appointment Details</h3>
                                <button
                                    onClick={() => setShowDetailsModal(false)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>
                        <div className="p-6 space-y-6">
                            {/* Status Banner */}
                            <div className="p-4 rounded-lg bg-yellow-100">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <ClockIcon className="w-5 h-5 mr-2 text-yellow-600" />
                                        <span className="font-medium text-yellow-800">
                                            Status: Pending Review
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => handleStatusUpdate(selectedAppointment)}
                                        className="text-yellow-600 hover:text-yellow-800 font-medium text-sm"
                                    >
                                        Review Now
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Patient Information */}
                                <div className="space-y-4">
                                    <h4 className="text-lg font-medium text-gray-900 flex items-center">
                                        <User className="w-5 h-5 mr-2 text-purple-600" />
                                        Patient Information
                                    </h4>
                                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-sm font-medium text-gray-600">Name:</span>
                                            <span className="text-sm text-gray-900">
                                                {selectedAppointment.patient?.user?.first_name} {selectedAppointment.patient?.user?.last_name}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm font-medium text-gray-600">Email:</span>
                                            <span className="text-sm text-gray-900">{selectedAppointment.patient?.user?.email}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm font-medium text-gray-600">Phone:</span>
                                            <span className="text-sm text-gray-900">{selectedAppointment.patient?.user?.phone || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm font-medium text-gray-600">Blood Group:</span>
                                            <span className="text-sm text-gray-900">{selectedAppointment.patient?.blood_group || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm font-medium text-gray-600">Emergency Contact:</span>
                                            <span className="text-sm text-gray-900">{selectedAppointment.patient?.emergency_contact || 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Doctor & Hospital Information */}
                                <div className="space-y-4">
                                    <h4 className="text-lg font-medium text-gray-900 flex items-center">
                                        <Stethoscope className="w-5 h-5 mr-2 text-blue-600" />
                                        Doctor & Hospital
                                    </h4>
                                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-sm font-medium text-gray-600">Doctor:</span>
                                            <span className="text-sm text-gray-900">
                                                Dr. {selectedAppointment.doctor?.user?.first_name} {selectedAppointment.doctor?.user?.last_name}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm font-medium text-gray-600">Specialization:</span>
                                            <span className="text-sm text-gray-900">{selectedAppointment.doctor?.specialization}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm font-medium text-gray-600">Experience:</span>
                                            <span className="text-sm text-gray-900">{selectedAppointment.doctor?.experience_years} years</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm font-medium text-gray-600">License:</span>
                                            <span className="text-sm text-gray-900">{selectedAppointment.doctor?.license_number}</span>
                                        </div>
                                        <div className="pt-2 border-t border-gray-200">
                                            <div className="flex justify-between">
                                                <span className="text-sm font-medium text-gray-600">Hospital:</span>
                                                <span className="text-sm text-gray-900">{selectedAppointment.hospital?.name}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm font-medium text-gray-600">Location:</span>
                                                <span className="text-sm text-gray-900">{selectedAppointment.hospital?.location}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm font-medium text-gray-600">Phone:</span>
                                                <span className="text-sm text-gray-900">{selectedAppointment.hospital?.phone}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Appointment Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                                        <Calendar className="w-4 h-4 mr-2 text-gray-600" />
                                        Appointment Details
                                    </h5>
                                    <div className="space-y-2">
                                        <div className="flex items-center text-sm">
                                            <Calendar className="w-4 h-4 text-gray-400 mr-3" />
                                            <span>Date: {formatDate(selectedAppointment.appointment_date)}</span>
                                        </div>
                                        <div className="flex items-center text-sm">
                                            <Clock className="w-4 h-4 text-gray-400 mr-3" />
                                            <span>Time: {formatTime(selectedAppointment.appointment_date)}</span>
                                        </div>
                                        <div className="flex items-center text-sm">
                                            <AlertCircle className="w-4 h-4 text-gray-400 mr-3" />
                                            <span>Status: Pending</span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                                        <Activity className="w-4 h-4 mr-2 text-gray-600" />
                                        Timeline
                                    </h5>
                                    <div className="space-y-2">
                                        <div className="flex items-center text-sm">
                                            <CheckCircle className="w-4 h-4 text-green-400 mr-3" />
                                            <span>Created: {formatDateTime(selectedAppointment.created_at)}</span>
                                        </div>
                                        {selectedAppointment.updated_at !== selectedAppointment.created_at && (
                                            <div className="flex items-center text-sm">
                                                <AlertCircle className="w-4 h-4 text-blue-400 mr-3" />
                                                <span>Updated: {formatDateTime(selectedAppointment.updated_at)}</span>
                                            </div>
                                        )}
                                        <div className="flex items-center text-sm">
                                            <FileText className="w-4 h-4 text-gray-400 mr-3" />
                                            <span>ID: {selectedAppointment.id}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Reason */}
                            <div>
                                <h5 className="font-medium text-gray-900 mb-2">Reason for Appointment</h5>
                                <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                                    {selectedAppointment.reason}
                                </p>
                            </div>

                            {/* Notes */}
                            {selectedAppointment.notes && (
                                <div>
                                    <h5 className="font-medium text-gray-900 mb-2">Medical Notes</h5>
                                    <p className="text-sm text-gray-600 bg-green-50 p-3 rounded-lg">
                                        {selectedAppointment.notes}
                                    </p>
                                </div>
                            )}

                            {/* Patient Medical History */}
                            {selectedAppointment.patient?.medical_history && (
                                <div>
                                    <h5 className="font-medium text-gray-900 mb-2">Patient Medical History</h5>
                                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                                        {selectedAppointment.patient.medical_history}
                                    </p>
                                </div>
                            )}

                            {/* Patient Allergies */}
                            {selectedAppointment.patient?.allergies && (
                                <div>
                                    <h5 className="font-medium text-gray-900 mb-2 flex items-center text-red-600">
                                        <AlertTriangle className="w-4 h-4 mr-2" />
                                        Allergies
                                    </h5>
                                    <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
                                        {selectedAppointment.patient.allergies}
                                    </p>
                                </div>
                            )}

                            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                                <button
                                    onClick={() => handleStatusUpdate(selectedAppointment)}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
                                >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Review Appointment
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PendingAppointments;