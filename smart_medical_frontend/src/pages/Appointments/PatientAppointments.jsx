import React, { useState, useEffect } from 'react';
import {
    Calendar, Clock, User, Stethoscope, Building2, Plus, Search,
    Eye, CheckCircle, XCircle, Clock as ClockIcon,
    AlertCircle, RefreshCw, FileText, MapPin, Phone, Mail, Pill,
    Save, X, Loader2, Store, Star, DollarSign, Package,
    ChevronLeft, ChevronRight, AlertTriangle
} from 'lucide-react';
import { toast } from 'react-toastify';
import { appointmentService, hospitalService, profileService, prescriptionService, getCurrentUser } from '../../api';

// ── helper: fetch recommendations via prescriptionService ────────────────────
// Adjust if your api.js exposes a dedicated recommendationService
const fetchRecommendations = async (prescriptionId) => {
    try {
        const res = await prescriptionService.getRecommendations(prescriptionId);
        return res.success ? (res.data.results || res.data || []) : [];
    } catch {
        return [];
    }
};

const PatientAppointments = () => {
    const [appointments, setAppointments] = useState([]);
    const [hospitals, setHospitals] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [loadingDoctors, setLoadingDoctors] = useState(false);

    // modals
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showRecommendationsModal, setShowRecommendationsModal] = useState(false);

    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [recommendations, setRecommendations] = useState([]);
    const [loadingRecs, setLoadingRecs] = useState(false);

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [appointmentsPerPage] = useState(10);
    const [userData, setUserData] = useState(null);

    const [formData, setFormData] = useState({
        hospital: '', doctor: '', appointment_date: '', appointment_time: '', reason: ''
    });
    const [errors, setErrors] = useState({});

    const statusConfig = {
        pending:     { color: 'yellow', icon: ClockIcon,    label: 'Pending' },
        approved:    { color: 'blue',   icon: CheckCircle,  label: 'Approved' },
        completed:   { color: 'green',  icon: CheckCircle,  label: 'Completed' },
        cancelled:   { color: 'red',    icon: XCircle,      label: 'Cancelled' },
        in_progress: { color: 'orange', icon: AlertCircle,  label: 'In Progress' }
    };

    useEffect(() => { initializePage(); }, []);

    useEffect(() => {
        if (formData.hospital) {
            fetchDoctorsByHospital(formData.hospital);
        } else {
            setDoctors([]);
            setFormData(prev => ({ ...prev, doctor: '' }));
        }
    }, [formData.hospital]);

    const initializePage = async () => {
        try {
            const user = getCurrentUser();
            if (!user) { toast.error('Please log in to access appointments'); return; }
            setUserData(user);
            await Promise.all([fetchAppointments(), fetchHospitals()]);
        } catch (error) {
            toast.error('Failed to load page data');
        } finally {
            setLoading(false);
        }
    };

    const fetchAppointments = async () => {
        try {
            const response = await appointmentService.getAll();
            if (response.success) {
                setAppointments(response.data.results || response.data || []);
            } else {
                toast.error('Failed to fetch appointments');
            }
        } catch (error) {
            toast.error('Failed to fetch appointments');
        }
    };

    const fetchHospitals = async () => {
        try {
            const response = await hospitalService.getAll();
            if (response.success) {
                const data = response.data.results || response.data || [];
                setHospitals(data.filter(h => h.is_active));
            }
        } catch (error) {
            toast.error('Failed to fetch hospitals');
        }
    };

    const fetchDoctorsByHospital = async (hospitalId) => {
        setLoadingDoctors(true);
        try {
            const response = await profileService.listDoctorProfiles({ hospital_id: hospitalId });
            if (response.success) {
                setDoctors(response.data.results || response.data || []);
            } else {
                setDoctors([]);
            }
        } catch (error) {
            setDoctors([]);
        } finally {
            setLoadingDoctors(false);
        }
    };

    // ── Recommendations ───────────────────────────────────────────────────────
    const handleViewRecommendations = async (appointment) => {
        setSelectedAppointment(appointment);
        setShowRecommendationsModal(true);
        setRecommendations([]);
        setLoadingRecs(true);
        try {
            // First get the prescription linked to this appointment
            const presRes = await prescriptionService.getByAppointment(appointment.id);
            if (!presRes.success || !presRes.data?.id) {
                toast.error('No prescription found for this appointment');
                setShowRecommendationsModal(false);
                return;
            }
            const recs = await fetchRecommendations(presRes.data.id);
            setRecommendations(recs);
        } catch (err) {
            toast.error('Failed to load recommendations');
        } finally {
            setLoadingRecs(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const handleViewPrescription = (appointment) => {
        window.location.href = `/dashboard/prescriptions/patients/list?appointment=${appointment.id}`;
    };

    const canViewPrescription = (appointment) => appointment.status === 'completed';

    const validateForm = () => {
        const newErrors = {};
        if (!formData.hospital) newErrors.hospital = 'Hospital selection is required';
        if (!formData.doctor) newErrors.doctor = 'Doctor selection is required';
        if (!formData.appointment_date) newErrors.appointment_date = 'Appointment date is required';
        if (!formData.appointment_time) newErrors.appointment_time = 'Appointment time is required';
        if (!formData.reason.trim()) newErrors.reason = 'Reason for appointment is required';
        const selectedDateTime = new Date(`${formData.appointment_date}T${formData.appointment_time}`);
        if (selectedDateTime <= new Date()) newErrors.appointment_date = 'Appointment date and time must be in the future';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleCreateAppointment = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        setSubmitting(true);
        try {
            const appointmentDateTime = new Date(`${formData.appointment_date}T${formData.appointment_time}`);
            const response = await appointmentService.create({
                hospital_id: formData.hospital,
                doctor_id: formData.doctor,
                appointment_date: appointmentDateTime.toISOString(),
                reason: formData.reason.trim()
            });
            if (response.success) {
                toast.success('Appointment booked successfully!');
                setShowCreateModal(false);
                resetForm();
                fetchAppointments();
            } else {
                toast.error(response.error || 'Failed to create appointment');
            }
        } catch (error) {
            toast.error('Failed to create appointment');
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setFormData({ hospital: '', doctor: '', appointment_date: '', appointment_time: '', reason: '' });
        setErrors({});
        setDoctors([]);
    };

    const handleViewDetails = (appointment) => {
        setSelectedAppointment(appointment);
        setShowDetailsModal(true);
    };

    const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric'
    });
    const formatTime = (dateString) => new Date(dateString).toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit'
    });
    const formatCurrency = (amount) => new Intl.NumberFormat('en-RW', {
        style: 'currency', currency: 'RWF', currencyDisplay: 'code'
    }).format(amount);

    const filteredAppointments = appointments.filter(appointment => {
        const matchesSearch =
            appointment.doctor?.user?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            appointment.doctor?.user?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            appointment.doctor?.specialization?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            appointment.hospital?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            appointment.reason?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || appointment.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const totalPages = Math.ceil(filteredAppointments.length / appointmentsPerPage);
    const startIndex = (currentPage - 1) * appointmentsPerPage;
    const paginatedAppointments = filteredAppointments.slice(startIndex, startIndex + appointmentsPerPage);

    const getAvailabilityColor = (score) => {
        if (score >= 80) return { bg: 'bg-green-100', text: 'text-green-800', bar: 'bg-green-500' };
        if (score >= 50) return { bg: 'bg-yellow-100', text: 'text-yellow-800', bar: 'bg-yellow-500' };
        return { bg: 'bg-red-100', text: 'text-red-800', bar: 'bg-red-500' };
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="flex flex-col items-center space-y-4">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    <p className="text-gray-600">Loading appointments...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">

            {/* ── Header ──────────────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">My Appointments</h1>
                    <p className="text-sm text-gray-600 mt-1">Book and manage your medical appointments</p>
                </div>
                <div className="flex items-center space-x-3 mt-4 sm:mt-0">
                    <button onClick={fetchAppointments}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors">
                        <RefreshCw className="w-4 h-4 mr-2" /> Refresh
                    </button>
                    <button onClick={() => { resetForm(); setShowCreateModal(true); }}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        <Plus className="w-4 h-4 mr-2" /> Book Appointment
                    </button>
                </div>
            </div>

            {/* ── Stats Cards ─────────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {Object.entries(statusConfig).map(([status, config]) => {
                    const count = appointments.filter(app => app.status === status).length;
                    return (
                        <div key={status} className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                            <div className="flex items-center gap-3">
                                <div className={`p-2.5 rounded-lg bg-${config.color}-100 flex-shrink-0`}>
                                    <config.icon className={`w-5 h-5 text-${config.color}-600`} />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-500">{config.label}</p>
                                    <p className="text-2xl font-bold text-gray-900 leading-none mt-0.5">{count}</p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ── Filters ─────────────────────────────────────────────────────── */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input type="text" placeholder="Search by doctor, hospital, reason…"
                            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <option value="all">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>
            </div>

            {/* ── Appointments Table ───────────────────────────────────────────── */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor & Hospital</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {paginatedAppointments.length > 0 ? (
                                paginatedAppointments.map((appointment) => {
                                    const statusInfo = statusConfig[appointment.status] || statusConfig.pending;
                                    return (
                                        <tr key={appointment.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                                                        <Stethoscope className="w-5 h-5 text-white" />
                                                    </div>
                                                    <div className="ml-3">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            Dr. {appointment.doctor?.user?.first_name} {appointment.doctor?.user?.last_name}
                                                        </div>
                                                        <div className="text-xs text-gray-500">{appointment.doctor?.specialization}</div>
                                                        <div className="text-xs text-gray-400 flex items-center mt-0.5">
                                                            <Building2 className="w-3 h-3 mr-1" />
                                                            {appointment.hospital?.name}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                                    <div>
                                                        <div>{formatDate(appointment.appointment_date)}</div>
                                                        <div className="text-xs text-gray-500 flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />
                                                            {formatTime(appointment.appointment_date)}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900 max-w-[200px]">
                                                <p className="truncate" title={appointment.reason}>{appointment.reason}</p>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-${statusInfo.color}-100 text-${statusInfo.color}-800`}>
                                                    <statusInfo.icon className="w-3 h-3" />
                                                    {statusInfo.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    {/* View details */}
                                                    <button onClick={() => handleViewDetails(appointment)}
                                                        className="text-blue-600 hover:text-blue-900 p-1.5 rounded-lg hover:bg-blue-50 transition-colors" title="View Details">
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    {/* View prescription */}
                                                    {canViewPrescription(appointment) && (
                                                        <button onClick={() => handleViewPrescription(appointment)}
                                                            className="text-purple-600 hover:text-purple-900 p-1.5 rounded-lg hover:bg-purple-50 transition-colors" title="View Prescription">
                                                            <Pill className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    {/* View pharmacy recommendations */}
                                                    {canViewPrescription(appointment) && (
                                                        <button onClick={() => handleViewRecommendations(appointment)}
                                                            className="text-green-600 hover:text-green-900 p-1.5 rounded-lg hover:bg-green-50 transition-colors" title="View Pharmacy Recommendations">
                                                            <Store className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center">
                                        <Stethoscope className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                        <h3 className="text-lg font-medium text-gray-900 mb-1">No appointments found</h3>
                                        <p className="text-sm text-gray-500">No appointments match your current filters</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="px-6 py-3 flex items-center justify-between border-t border-gray-200">
                        <p className="text-sm text-gray-500">
                            Showing <span className="font-medium">{startIndex + 1}–{Math.min(startIndex + appointmentsPerPage, filteredAppointments.length)}</span> of{' '}
                            <span className="font-medium">{filteredAppointments.length}</span>
                        </p>
                        <div className="flex items-center gap-1">
                            <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}
                                className="p-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                <button key={page} onClick={() => setCurrentPage(page)}
                                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${currentPage === page ? 'bg-blue-600 text-white' : 'border border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
                                    {page}
                                </button>
                            ))}
                            <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}
                                className="p-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Pharmacy Recommendations Modal ───────────────────────────────── */}
            {showRecommendationsModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center">
                                        <Store className="w-5 h-5 text-green-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-semibold text-gray-900">Pharmacy Recommendations</h3>
                                        <p className="text-xs text-gray-500">
                                            For appointment on {selectedAppointment && formatDate(selectedAppointment.appointment_date)}
                                        </p>
                                    </div>
                                </div>
                                <button onClick={() => setShowRecommendationsModal(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6">
                            {loadingRecs ? (
                                <div className="flex flex-col items-center py-12 space-y-3">
                                    <Loader2 className="w-8 h-8 animate-spin text-green-600" />
                                    <p className="text-sm text-gray-500">Loading pharmacy recommendations...</p>
                                </div>
                            ) : recommendations.length === 0 ? (
                                <div className="text-center py-12">
                                    <Store className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <h4 className="text-base font-medium text-gray-900 mb-1">No recommendations yet</h4>
                                    <p className="text-sm text-gray-500 max-w-xs mx-auto">
                                        Pharmacy recommendations are generated when your prescription is created. Please check back shortly or contact your doctor.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <p className="text-xs text-gray-500 mb-4">
                                        {recommendations.length} {recommendations.length === 1 ? 'pharmacy' : 'pharmacies'} can fill your prescription — sorted by availability.
                                    </p>

                                    {recommendations
                                        .sort((a, b) => b.availability_score - a.availability_score || a.total_cost - b.total_cost)
                                        .map((rec, index) => {
                                            const avail = parseFloat(rec.availability_score);
                                            const colors = getAvailabilityColor(avail);
                                            return (
                                                <div key={rec.id}
                                                    className={`border rounded-xl p-4 ${index === 0 ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-white'}`}>
                                                    {/* Top row */}
                                                    <div className="flex items-start justify-between gap-3 mb-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${index === 0 ? 'bg-green-200' : 'bg-gray-100'}`}>
                                                                <Store className={`w-5 h-5 ${index === 0 ? 'text-green-700' : 'text-gray-500'}`} />
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <p className="text-sm font-semibold text-gray-900">{rec.pharmacy?.pharmacy_name}</p>
                                                                    {index === 0 && (
                                                                        <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded-full">Best match</span>
                                                                    )}
                                                                </div>
                                                                <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                                                    <MapPin className="w-3 h-3" /> {rec.pharmacy?.location || rec.pharmacy?.address || 'Location not available'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right flex-shrink-0">
                                                            <p className="text-base font-bold text-gray-900">{formatCurrency(rec.total_cost)}</p>
                                                            <p className="text-xs text-gray-400">estimated cost</p>
                                                        </div>
                                                    </div>

                                                    {/* Availability bar */}
                                                    <div className="mb-3">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="text-xs font-medium text-gray-600">Drug availability</span>
                                                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
                                                                {avail.toFixed(0)}%
                                                            </span>
                                                        </div>
                                                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                                                            <div className={`h-1.5 rounded-full ${colors.bar} transition-all`} style={{ width: `${Math.min(avail, 100)}%` }} />
                                                        </div>
                                                    </div>

                                                    {/* Meta row */}
                                                    <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                                                        {rec.pharmacy?.address && (
                                                            <span className="flex items-center gap-1">
                                                                <MapPin className="w-3 h-3" /> {rec.pharmacy.address}
                                                            </span>
                                                        )}
                                                        {rec.distance_km && (
                                                            <span className="flex items-center gap-1">
                                                                <AlertCircle className="w-3 h-3" /> {parseFloat(rec.distance_km).toFixed(1)} km away
                                                            </span>
                                                        )}
                                                    </div>

                                                    {avail < 100 && (
                                                        <div className="mt-2 flex items-start gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                                                            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                                                            This pharmacy may not have all your prescribed medications. Call ahead to confirm.
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}

                                    <p className="text-xs text-gray-400 pt-2 border-t border-gray-100">
                                        Prices are estimates based on current inventory. Contact the pharmacy to confirm availability and final pricing.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Appointment Details Modal ────────────────────────────────────── */}
            {showDetailsModal && selectedAppointment && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900">Appointment Details</h3>
                                <button onClick={() => setShowDetailsModal(false)} className="text-gray-400 hover:text-gray-600">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="flex items-center space-x-4">
                                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                                    <Stethoscope className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                    <h4 className="text-xl font-bold text-gray-900">
                                        Dr. {selectedAppointment.doctor?.user?.first_name} {selectedAppointment.doctor?.user?.last_name}
                                    </h4>
                                    <p className="text-sm text-gray-500">{selectedAppointment.doctor?.specialization}</p>
                                    <div className="flex items-center text-sm text-gray-400 mt-1">
                                        <Building2 className="w-4 h-4 mr-1" />
                                        {selectedAppointment.hospital?.name}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <h5 className="font-medium text-gray-900">Appointment Information</h5>
                                    {(() => {
                                        const statusInfo = statusConfig[selectedAppointment.status] || statusConfig.pending;
                                        return (
                                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-${statusInfo.color}-100 text-${statusInfo.color}-800`}>
                                                <statusInfo.icon className="w-3 h-3" /> {statusInfo.label}
                                            </span>
                                        );
                                    })()}
                                    <div className="flex items-center text-sm gap-2">
                                        <Calendar className="w-4 h-4 text-gray-400" />
                                        <span>{formatDate(selectedAppointment.appointment_date)}</span>
                                    </div>
                                    <div className="flex items-center text-sm gap-2">
                                        <Clock className="w-4 h-4 text-gray-400" />
                                        <span>{formatTime(selectedAppointment.appointment_date)}</span>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h5 className="font-medium text-gray-900">Hospital Contact</h5>
                                    <div className="flex items-center text-sm gap-2">
                                        <Mail className="w-4 h-4 text-gray-400" />
                                        <span>{selectedAppointment.hospital?.email || 'Not available'}</span>
                                    </div>
                                    <div className="flex items-center text-sm gap-2">
                                        <Phone className="w-4 h-4 text-gray-400" />
                                        <span>{selectedAppointment.hospital?.phone || 'Not available'}</span>
                                    </div>
                                    <div className="flex items-start text-sm gap-2">
                                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                                        <span>{selectedAppointment.hospital?.location || 'Not available'}</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h5 className="font-medium text-gray-900 mb-2">Reason for Appointment</h5>
                                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{selectedAppointment.reason}</p>
                            </div>

                            {selectedAppointment.notes && (
                                <div>
                                    <h5 className="font-medium text-gray-900 mb-2">Doctor's Notes</h5>
                                    <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">{selectedAppointment.notes}</p>
                                </div>
                            )}

                            {/* Quick actions for completed appointments */}
                            {canViewPrescription(selectedAppointment) && (
                                <div className="flex gap-3 pt-2 border-t border-gray-100">
                                    <button onClick={() => { setShowDetailsModal(false); handleViewPrescription(selectedAppointment); }}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium transition-colors">
                                        <Pill className="w-4 h-4" /> View Prescription
                                    </button>
                                    <button onClick={() => { setShowDetailsModal(false); handleViewRecommendations(selectedAppointment); }}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium transition-colors">
                                        <Store className="w-4 h-4" /> Pharmacy Recommendations
                                    </button>
                                </div>
                            )}

                            <div className="text-xs text-gray-400 pt-2 border-t border-gray-100">
                                <p>ID: {selectedAppointment.id}</p>
                                <p>Created: {formatDate(selectedAppointment.created_at)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Book Appointment Modal ───────────────────────────────────────── */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900">Book New Appointment</h3>
                                <button onClick={() => { setShowCreateModal(false); resetForm(); }} className="text-gray-400 hover:text-gray-600">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>
                        <div className="p-6">
                            <form onSubmit={handleCreateAppointment} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Hospital *</label>
                                        <select name="hospital" value={formData.hospital} onChange={handleInputChange}
                                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.hospital ? 'border-red-300' : 'border-gray-300'}`}>
                                            <option value="">Select Hospital</option>
                                            {hospitals.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                                        </select>
                                        {errors.hospital && <p className="text-red-500 text-xs mt-1">{errors.hospital}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Doctor *</label>
                                        <select name="doctor" value={formData.doctor} onChange={handleInputChange}
                                            disabled={!formData.hospital || loadingDoctors}
                                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.doctor ? 'border-red-300' : 'border-gray-300'} ${(!formData.hospital || loadingDoctors) ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                            <option value="">{loadingDoctors ? 'Loading doctors...' : 'Select Doctor'}</option>
                                            {doctors.map(doctor => (
                                                <option key={doctor.id} value={doctor.user?.id}>
                                                    Dr. {doctor.user?.first_name} {doctor.user?.last_name} — {doctor.specialization}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.doctor && <p className="text-red-500 text-xs mt-1">{errors.doctor}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Appointment Date *</label>
                                        <input type="date" name="appointment_date" value={formData.appointment_date}
                                            onChange={handleInputChange} min={new Date().toISOString().split('T')[0]}
                                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.appointment_date ? 'border-red-300' : 'border-gray-300'}`} />
                                        {errors.appointment_date && <p className="text-red-500 text-xs mt-1">{errors.appointment_date}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Appointment Time *</label>
                                        <input type="time" name="appointment_time" value={formData.appointment_time}
                                            onChange={handleInputChange}
                                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.appointment_time ? 'border-red-300' : 'border-gray-300'}`} />
                                        {errors.appointment_time && <p className="text-red-500 text-xs mt-1">{errors.appointment_time}</p>}
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Appointment *</label>
                                        <textarea name="reason" value={formData.reason} onChange={handleInputChange} rows={3}
                                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.reason ? 'border-red-300' : 'border-gray-300'}`}
                                            placeholder="Describe the reason for your appointment…" />
                                        {errors.reason && <p className="text-red-500 text-xs mt-1">{errors.reason}</p>}
                                    </div>
                                </div>
                                <div className="flex justify-end space-x-3 pt-4">
                                    <button type="button" onClick={() => { setShowCreateModal(false); resetForm(); }}
                                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm">
                                        Cancel
                                    </button>
                                    <button type="submit" disabled={submitting}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center text-sm">
                                        {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Booking...</> : <><Save className="w-4 h-4 mr-2" />Book Appointment</>}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PatientAppointments;