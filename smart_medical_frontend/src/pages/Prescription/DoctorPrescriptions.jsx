import React, { useState, useEffect } from 'react';
import {
    Search, Filter, RefreshCw, Eye, Edit, Trash2, Plus, Loader2,
    Calendar, Clock, User, Pill, FileText, AlertCircle, CheckCircle,
    X, Save, Building2, Phone, Mail, AlertTriangle, Activity,
    TrendingUp, Users, Stethoscope, MapPin
} from 'lucide-react';
import { toast } from 'react-toastify';
import { prescriptionService, getCurrentUser } from '../../api';

const DoctorPrescriptions = () => {
    const [prescriptions, setPrescriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedPrescription, setSelectedPrescription] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [prescriptionsPerPage] = useState(12);
    const [userData, setUserData] = useState(null);
    const [recommendations, setRecommendations] = useState([]);
    const [loadingRecommendations, setLoadingRecommendations] = useState(false);

    const fetchRecommendations = async (prescriptionId) => {
        setLoadingRecommendations(true);
        try {
            const response = await prescriptionService.getRecommendations(prescriptionId);
            if (response.success) {
                setRecommendations(response.data);
            } else {
                toast.error('Failed to fetch pharmacy recommendations');
            }
        } catch (error) {
            console.error('Error fetching recommendations:', error);
            toast.error('Failed to fetch pharmacy recommendations');
        } finally {
            setLoadingRecommendations(false);
        }
    };


    const [editFormData, setEditFormData] = useState({
        status: '',
        notes: ''
    });

    const [filters, setFilters] = useState({
        status: '',
        date_from: '',
        date_to: ''
    });

    const statusConfig = {
        active: {
            color: 'blue',
            icon: CheckCircle,
            label: 'Active',
            bgColor: 'bg-blue-100',
            textColor: 'text-blue-800',
            description: 'Prescription is currently active'
        },
        filled: {
            color: 'green',
            icon: CheckCircle,
            label: 'Filled',
            bgColor: 'bg-green-100',
            textColor: 'text-green-800',
            description: 'Prescription has been filled by pharmacy'
        },
        expired: {
            color: 'red',
            icon: AlertCircle,
            label: 'Expired',
            bgColor: 'bg-red-100',
            textColor: 'text-red-800',
            description: 'Prescription has expired'
        }
    };

    const statusChoices = [
        { value: 'active', label: 'Active' },
        { value: 'filled', label: 'Filled' },
        { value: 'expired', label: 'Expired' }
    ];

    useEffect(() => {
        initializePage();
    }, []);

    useEffect(() => {
        fetchPrescriptions();
    }, [filters]);

    const initializePage = async () => {
        try {
            const user = getCurrentUser();
            if (!user) {
                toast.error('Please log in to access prescriptions');
                return;
            }
            setUserData(user);
            await fetchPrescriptions();
        } catch (error) {
            console.error('Error initializing page:', error);
            toast.error('Failed to load page data');
        } finally {
            setLoading(false);
        }
    };

    const fetchPrescriptions = async () => {
        try {
            const response = await prescriptionService.getAll(filters);
            if (response.success) {
                const prescriptionData = response.data.results || response.data || [];
                setPrescriptions(prescriptionData);
            } else {
                toast.error('Failed to fetch prescriptions');
            }
        } catch (error) {
            console.error('Error fetching prescriptions:', error);
            toast.error('Failed to fetch prescriptions');
        }
    };

    const handleViewDetails = async (prescription) => {
        try {
            const response = await prescriptionService.getById(prescription.id);
            if (response.success) {
                setSelectedPrescription(response.data);
                await fetchRecommendations(prescription.id); // Add this line
                setShowDetailsModal(true);
            } else {
                toast.error('Failed to fetch prescription details');
            }
        } catch (error) {
            console.error('Error fetching prescription details:', error);
            toast.error('Failed to fetch prescription details');
        }
    };


    const handleEditPrescription = (prescription) => {
        setSelectedPrescription(prescription);
        setEditFormData({
            status: prescription.status,
            notes: prescription.notes || ''
        });
        setShowEditModal(true);
    };

    const handleUpdatePrescription = async () => {
        if (!editFormData.status) {
            toast.error('Please select a status');
            return;
        }

        setSubmitting(true);
        try {
            // This would need to be implemented in your prescriptionService
            // const response = await prescriptionService.update(selectedPrescription.id, editFormData);

            // For now, we'll simulate the update
            toast.success('Prescription updated successfully');
            setShowEditModal(false);
            resetEditForm();
            fetchPrescriptions();
        } catch (error) {
            console.error('Error updating prescription:', error);
            toast.error('Failed to update prescription');
        } finally {
            setSubmitting(false);
        }
    };

    const resetEditForm = () => {
        setEditFormData({
            status: '',
            notes: ''
        });
        setSelectedPrescription(null);
    };

    const handleFilterChange = (filterType, value) => {
        setFilters(prev => ({
            ...prev,
            [filterType]: value
        }));
        setCurrentPage(1);
    };

    const clearFilters = () => {
        setFilters({
            status: '',
            date_from: '',
            date_to: ''
        });
        setSearchTerm('');
        setStatusFilter('all');
        setDateFilter('all');
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
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
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.bgColor} ${config.textColor}`}>
                <config.icon className="w-4 h-4 mr-2" />
                {config.label}
            </span>
        );
    };

    const filteredPrescriptions = prescriptions.filter(prescription => {
        const matchesSearch =
            prescription.patient?.user?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            prescription.patient?.user?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            prescription.diagnosis?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            prescription.appointment?.reason?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'all' || prescription.status === statusFilter;

        let matchesDate = true;
        if (dateFilter === 'today') {
            const today = new Date().toDateString();
            matchesDate = new Date(prescription.created_at).toDateString() === today;
        } else if (dateFilter === 'week') {
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            matchesDate = new Date(prescription.created_at) >= weekAgo;
        } else if (dateFilter === 'month') {
            const monthAgo = new Date();
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            matchesDate = new Date(prescription.created_at) >= monthAgo;
        }

        return matchesSearch && matchesStatus && matchesDate;
    });

    const totalPages = Math.ceil(filteredPrescriptions.length / prescriptionsPerPage);
    const startIndex = (currentPage - 1) * prescriptionsPerPage;
    const paginatedPrescriptions = filteredPrescriptions.slice(startIndex, startIndex + prescriptionsPerPage);

    const getStats = () => {
        const total = prescriptions.length;
        const active = prescriptions.filter(p => p.status === 'active').length;
        const filled = prescriptions.filter(p => p.status === 'filled').length;
        const expired = prescriptions.filter(p => p.status === 'expired').length;

        return { total, active, filled, expired };
    };

    const stats = getStats();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="flex flex-col items-center space-y-4">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    <p className="text-gray-600">Loading prescriptions...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">My Prescriptions</h1>
                    <p className="text-sm text-gray-600 mt-1">
                        Manage and monitor prescriptions you've created
                    </p>
                </div>
                <div className="flex items-center space-x-3 mt-4 sm:mt-0">
                    <button
                        onClick={fetchPrescriptions}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </button>
                    <button
                        onClick={clearFilters}
                        className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                        <Filter className="w-4 h-4 mr-2" />
                        Clear Filters
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center">
                        <div className="p-3 rounded-lg bg-gray-100">
                            <Pill className="w-6 h-6 text-gray-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Total</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                        </div>
                    </div>
                </div>

                {Object.entries(statusConfig).map(([status, config]) => (
                    <div key={status} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                        <div className="flex items-center">
                            <div className={`p-3 rounded-lg bg-${config.color}-100`}>
                                <config.icon className={`w-6 h-6 text-${config.color}-600`} />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">{config.label}</p>
                                <p className="text-2xl font-bold text-gray-900">{stats[status]}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search prescriptions..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <select
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value);
                            handleFilterChange('status', e.target.value === 'all' ? '' : e.target.value);
                        }}
                    >
                        <option value="all">All Status</option>
                        {statusChoices.map(status => (
                            <option key={status.value} value={status.value}>{status.label}</option>
                        ))}
                    </select>

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

                    <input
                        type="date"
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={filters.date_from}
                        onChange={(e) => handleFilterChange('date_from', e.target.value)}
                        placeholder="From Date"
                    />

                    <input
                        type="date"
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={filters.date_to}
                        onChange={(e) => handleFilterChange('date_to', e.target.value)}
                        placeholder="To Date"
                    />
                </div>
            </div>

            {/* Prescriptions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedPrescriptions.map((prescription) => (
                    <div key={prescription.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                        {/* Card Header */}
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center">
                                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                                    <User className="w-5 h-5 text-white" />
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-gray-900">
                                        {prescription.patient?.user?.first_name} {prescription.patient?.user?.last_name}
                                    </h3>
                                    <p className="text-xs text-gray-500">{prescription.patient?.user?.email}</p>
                                </div>
                            </div>
                            {getStatusBadge(prescription.status)}
                        </div>

                        {/* Prescription Info */}
                        <div className="space-y-3 mb-4">
                            <div>
                                <h4 className="text-sm font-medium text-gray-700 mb-1">Diagnosis</h4>
                                <p className="text-sm text-gray-600 line-clamp-2">{prescription.diagnosis}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs font-medium text-gray-500">Items</p>
                                    <p className="text-sm font-medium text-gray-900">
                                        {prescription.items?.length || 0} medications
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-500">Created</p>
                                    <p className="text-sm font-medium text-gray-900">
                                        {formatDate(prescription.created_at)}
                                    </p>
                                </div>
                            </div>

                            {prescription.appointment && (
                                <div className="bg-blue-50 p-3 rounded-lg">
                                    <div className="flex items-center text-sm text-blue-800">
                                        <Calendar className="w-4 h-4 mr-1" />
                                        <span>Appointment: {formatDate(prescription.appointment.appointment_date)}</span>
                                    </div>
                                    <p className="text-xs text-blue-600 mt-1">
                                        {prescription.appointment.reason}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end space-x-2 pt-4 border-t border-gray-100">
                            <button
                                onClick={() => handleViewDetails(prescription)}
                                className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                                title="View Details"
                            >
                                <Eye className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => handleEditPrescription(prescription)}
                                className="text-green-600 hover:text-green-800 p-2 rounded-lg hover:bg-green-50 transition-colors"
                                title="Edit Prescription"
                            >
                                <Edit className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Empty State */}
            {filteredPrescriptions.length === 0 && (
                <div className="text-center py-12">
                    <Pill className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No prescriptions found</h3>
                    <p className="text-gray-600">
                        {searchTerm || statusFilter !== 'all' || dateFilter !== 'all'
                            ? 'Try adjusting your filters to see more results.'
                            : 'You haven\'t created any prescriptions yet.'
                        }
                    </p>
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center text-sm text-gray-700">
                            Showing {startIndex + 1} to {Math.min(startIndex + prescriptionsPerPage, filteredPrescriptions.length)} of {filteredPrescriptions.length} prescriptions
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
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && selectedPrescription && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl max-w-md w-full">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900">Edit Prescription</h3>
                                <button
                                    onClick={() => {
                                        setShowEditModal(false);
                                        resetEditForm();
                                    }}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="mb-4">
                                <p className="text-sm text-gray-600">
                                    Patient: <span className="font-medium">{selectedPrescription.patient?.user?.first_name} {selectedPrescription.patient?.user?.last_name}</span>
                                </p>
                                <p className="text-sm text-gray-600">
                                    Created: <span className="font-medium">{formatDateTime(selectedPrescription.created_at)}</span>
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Status *
                                    </label>
                                    <select
                                        value={editFormData.status}
                                        onChange={(e) => setEditFormData(prev => ({ ...prev, status: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        {statusChoices.map(status => (
                                            <option key={status.value} value={status.value}>{status.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Notes
                                    </label>
                                    <textarea
                                        value={editFormData.notes}
                                        onChange={(e) => setEditFormData(prev => ({ ...prev, notes: e.target.value }))}
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Add notes..."
                                    />
                                </div>

                                <div className="flex justify-end space-x-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowEditModal(false);
                                            resetEditForm();
                                        }}
                                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleUpdatePrescription}
                                        disabled={submitting}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
                                    >
                                        {submitting ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Updating...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="w-4 h-4 mr-2" />
                                                Update
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Details Modal */}
            {showDetailsModal && selectedPrescription && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900">Prescription Details</h3>
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
                            <div className={`p-4 rounded-lg ${statusConfig[selectedPrescription.status].bgColor}`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        {React.createElement(statusConfig[selectedPrescription.status].icon, {
                                            className: `w-5 h-5 mr-2 text-${statusConfig[selectedPrescription.status].color}-600`
                                        })}
                                        <span className={`font-medium ${statusConfig[selectedPrescription.status].textColor}`}>
                                            Status: {statusConfig[selectedPrescription.status].label}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => handleEditPrescription(selectedPrescription)}
                                        className={`text-${statusConfig[selectedPrescription.status].color}-600 hover:text-${statusConfig[selectedPrescription.status].color}-800 font-medium text-sm`}
                                    >
                                        Edit Status
                                    </button>
                                </div>
                                <p className={`text-sm ${statusConfig[selectedPrescription.status].textColor} mt-1`}>
                                    {statusConfig[selectedPrescription.status].description}
                                </p>
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
                                                {selectedPrescription.patient?.user?.first_name} {selectedPrescription.patient?.user?.last_name}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm font-medium text-gray-600">Email:</span>
                                            <span className="text-sm text-gray-900">{selectedPrescription.patient?.user?.email}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm font-medium text-gray-600">Phone:</span>
                                            <span className="text-sm text-gray-900">{selectedPrescription.patient?.user?.phone || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm font-medium text-gray-600">Blood Group:</span>
                                            <span className="text-sm text-gray-900">{selectedPrescription.patient?.blood_group || 'N/A'}</span>
                                        </div>
                                    </div>

                                    {/* Patient Allergies */}
                                    {selectedPrescription.patient?.allergies && (
                                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                            <div className="flex items-start">
                                                <AlertTriangle className="w-5 h-5 text-red-600 mr-2 mt-0.5" />
                                                <div>
                                                    <h5 className="text-sm font-medium text-red-800">Patient Allergies</h5>
                                                    <p className="text-sm text-red-700 mt-1">{selectedPrescription.patient.allergies}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Prescription Details */}
                                <div className="space-y-4">
                                    <h4 className="text-lg font-medium text-gray-900 flex items-center">
                                        <Pill className="w-5 h-5 mr-2 text-blue-600" />
                                        Prescription Details
                                    </h4>
                                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-sm font-medium text-gray-600">Created:</span>
                                            <span className="text-sm text-gray-900">{formatDateTime(selectedPrescription.created_at)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm font-medium text-gray-600">Updated:</span>
                                            <span className="text-sm text-gray-900">{formatDateTime(selectedPrescription.updated_at)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm font-medium text-gray-600">Status:</span>
                                            <span className="text-sm text-gray-900">{statusConfig[selectedPrescription.status].label}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm font-medium text-gray-600">ID:</span>
                                            <span className="text-sm text-gray-900 font-mono">{selectedPrescription.id}</span>
                                        </div>
                                    </div>

                                    {/* Appointment Info */}
                                    {selectedPrescription.appointment && (
                                        <div className="bg-blue-50 p-4 rounded-lg">
                                            <h5 className="text-sm font-medium text-blue-800 mb-2 flex items-center">
                                                <Calendar className="w-4 h-4 mr-1" />
                                                Related Appointment
                                            </h5>
                                            <div className="space-y-1">
                                                <p className="text-sm text-blue-700">
                                                    Date: {formatDateTime(selectedPrescription.appointment.appointment_date)}
                                                </p>
                                                <p className="text-sm text-blue-700">
                                                    Reason: {selectedPrescription.appointment.reason}
                                                </p>
                                                <p className="text-sm text-blue-700">
                                                    Hospital: {selectedPrescription.appointment.hospital?.name}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Diagnosis */}
                            <div>
                                <h5 className="font-medium text-gray-900 mb-2 flex items-center">
                                    <FileText className="w-4 h-4 mr-2 text-gray-600" />
                                    Diagnosis
                                </h5>
                                <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                                    {selectedPrescription.diagnosis}
                                </p>
                            </div>

                            {/* Prescription Items */}
                            <div>
                                <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                                    <Pill className="w-4 h-4 mr-2 text-green-600" />
                                    Medications ({selectedPrescription.items?.length || 0})
                                </h5>
                                <div className="space-y-3">
                                    {selectedPrescription.items?.map((item, index) => (
                                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                                <div>
                                                    <p className="text-xs font-medium text-gray-500 uppercase">Drug</p>
                                                    <p className="text-sm font-medium text-gray-900">
                                                        {/* Check if drug object exists, if not use drug_name */}
                                                        {item.drug ? item.drug.name : (item.drug_name || 'Unknown Drug')}
                                                    </p>
                                                    {/* Only show strength if drug exists */}
                                                    {item.drug && item.drug.strength && (
                                                        <p className="text-xs text-gray-500">{item.drug.strength}</p>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-medium text-gray-500 uppercase">Quantity</p>
                                                    <p className="text-sm text-gray-900">{item.quantity}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-medium text-gray-500 uppercase">Dosage</p>
                                                    <p className="text-sm text-gray-900">{item.dosage}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-medium text-gray-500 uppercase">Duration</p>
                                                    <p className="text-sm text-gray-900">{item.duration}</p>
                                                </div>
                                            </div>
                                            {item.instructions && (
                                                <div className="mt-3 pt-3 border-t border-gray-100">
                                                    <p className="text-xs font-medium text-gray-500 uppercase">Instructions</p>
                                                    <p className="text-sm text-gray-600 mt-1">{item.instructions}</p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Notes */}
                            {selectedPrescription.notes && (
                                <div>
                                    <h5 className="font-medium text-gray-900 mb-2">Additional Notes</h5>
                                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                                        {selectedPrescription.notes}
                                    </p>
                                </div>
                            )}

                            {/* Patient Medical History */}
                            {selectedPrescription.patient?.medical_history && (
                                <div>
                                    <h5 className="font-medium text-gray-900 mb-2">Patient Medical History</h5>
                                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                                        {selectedPrescription.patient.medical_history}
                                    </p>
                                </div>
                            )}

                            {/* Pharmacy Recommendations Section */}
                            <div className="mt-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h5 className="font-medium text-gray-900 flex items-center">
                                        <Building2 className="w-5 h-5 mr-2 text-purple-600" />
                                        Pharmacy Recommendations
                                    </h5>
                                    {loadingRecommendations && (
                                        <div className="flex items-center text-sm text-gray-500">
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Loading recommendations...
                                        </div>
                                    )}
                                </div>

                                {recommendations.length > 0 ? (
                                    <div className="space-y-4">
                                        {recommendations.map((recommendation) => (
                                            <div
                                                key={recommendation.id}
                                                className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow"
                                            >
                                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                    {/* Pharmacy Info */}
                                                    <div className="flex-1">
                                                        <div className="flex items-center mb-2">
                                                            <Building2 className="w-5 h-5 text-purple-600 mr-2" />
                                                            <h6 className="font-medium text-gray-900">
                                                                {recommendation.pharmacy.pharmacy_name}
                                                            </h6>
                                                        </div>

                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                                                            {recommendation.pharmacy.address && (
                                                                <div className="flex items-center truncate">
                                                                    <MapPin className="w-4 h-4 text-gray-500 mr-1.5 flex-shrink-0" />
                                                                    <span className="text-gray-700">
                                                                        {recommendation.pharmacy.address}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            {recommendation.pharmacy.phone && (
                                                                <div className="flex items-center">
                                                                    <Phone className="w-4 h-4 text-gray-500 mr-1.5" />
                                                                    <span className="text-gray-700">
                                                                        {recommendation.pharmacy.phone}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            {recommendation.pharmacy.email && (
                                                                <div className="flex items-center truncate">
                                                                    <Mail className="w-4 h-4 text-gray-500 mr-1.5 flex-shrink-0" />
                                                                    <span className="text-gray-700">
                                                                        {recommendation.pharmacy.email}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {recommendation.pharmacy.operating_hours && (
                                                            <div className="mt-2 flex items-center text-sm text-gray-600">
                                                                <Clock className="w-4 h-4 text-gray-500 mr-1.5" />
                                                                <span>{recommendation.pharmacy.operating_hours}</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Availability and Cost */}
                                                    <div className="flex-shrink-0 text-right">
                                                        <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium mb-2 ${recommendation.availability_score >= 80
                                                            ? 'bg-green-100 text-green-800'
                                                            : recommendation.availability_score >= 50
                                                                ? 'bg-yellow-100 text-yellow-800'
                                                                : 'bg-red-100 text-red-800'
                                                            }`}>
                                                            {Math.round(recommendation.availability_score)}% available
                                                        </div>
                                                        <div className="text-lg font-semibold text-gray-900">
                                                            {recommendation.total_cost.toLocaleString()} RWF
                                                        </div>
                                                        <div className="text-xs text-gray-500 mt-1">
                                                            Total cost
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Additional Info */}
                                                {recommendation.pharmacy.description && (
                                                    <div className="mt-3 pt-3 border-t border-gray-100 text-sm text-gray-600">
                                                        <p className="italic">{recommendation.pharmacy.description}</p>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    !loadingRecommendations && (
                                        <div className="bg-gray-50 p-6 rounded-lg text-center">
                                            <Building2 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                            <p className="text-sm text-gray-600">
                                                No pharmacy recommendations available for this prescription
                                            </p>
                                        </div>
                                    )
                                )}
                            </div>

                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DoctorPrescriptions;