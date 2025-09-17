import React, { useState, useEffect } from 'react';
import {
    Calendar, Clock, User, Stethoscope, Building2, Plus, Search,
    Filter, Eye, CheckCircle, XCircle, Clock as ClockIcon,
    AlertCircle, RefreshCw, FileText, MapPin, Phone, Mail, Pill,
    Save, X, Loader2
} from 'lucide-react';
import { toast } from 'react-toastify';
import { appointmentService, hospitalService, profileService, getCurrentUser } from '../../api';

const PatientAppointments = () => {
    const [appointments, setAppointments] = useState([]);
    const [hospitals, setHospitals] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [loadingDoctors, setLoadingDoctors] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [appointmentsPerPage] = useState(10);
    const [userData, setUserData] = useState(null);

    const [formData, setFormData] = useState({
        hospital: '',
        doctor: '',
        appointment_date: '',
        appointment_time: '',
        reason: ''
    });

    const [errors, setErrors] = useState({});

    const statusConfig = {
        pending: { color: 'yellow', icon: ClockIcon, label: 'Pending' },
        approved: { color: 'blue', icon: CheckCircle, label: 'Approved' },
        completed: { color: 'green', icon: CheckCircle, label: 'Completed' },
        cancelled: { color: 'red', icon: XCircle, label: 'Cancelled' }
    };

    useEffect(() => {
        initializePage();
    }, []);

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
            if (!user) {
                toast.error('Please log in to access appointments');
                return;
            }
            setUserData(user);

            await Promise.all([
                fetchAppointments(),
                fetchHospitals()
            ]);
        } catch (error) {
            console.error('Error initializing page:', error);
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
            console.error('Error fetching appointments:', error);
            toast.error('Failed to fetch appointments');
        }
    };

    const fetchHospitals = async () => {
        try {
            const response = await hospitalService.getAll();
            if (response.success) {
                const hospitalData = response.data.results || response.data || [];
                const activeHospitals = hospitalData.filter(hospital => hospital.is_active);
                setHospitals(activeHospitals);
            } else {
                toast.error('Failed to fetch hospitals');
            }
        } catch (error) {
            console.error('Error fetching hospitals:', error);
            toast.error('Failed to fetch hospitals');
        }
    };

    const fetchDoctorsByHospital = async (hospitalId) => {
        setLoadingDoctors(true);
        try {
            const response = await profileService.listDoctorProfiles({ hospital_id: hospitalId });
            console.log(response);
            if (response.success) {
                setDoctors(response.data.results || response.data || []);
                const doctorsData = response.data.results || response.data || [];
                doctorsData.forEach((doctor, index) => {
                    console.log(`Doctor ${index + 1}:`, {
                        id: doctor.id,
                        user_id: doctor.user,
                        user: doctor.user,
                        specialization: doctor.specialization,
                        allKeys: Object.keys(doctor)
                    });
                });

            } else {
                setDoctors([]);
                toast.error('Failed to fetch doctors for selected hospital');
            }
        } catch (error) {
            console.error('Error fetching doctors:', error);
            setDoctors([]);
        } finally {
            setLoadingDoctors(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const handlelistPrescription = (appointment) => {
        // Navigate to prescription creation page with appointment data
        // In a real app, you would use React Router
        const prescriptionUrl = `/dashboard/prescriptions/patients/list?appointment=${appointment.id}`;
        window.location.href = prescriptionUrl;
    };

    const canCreatePrescription = (appointment) => {
        return appointment.status === 'completed';
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.hospital) newErrors.hospital = 'Hospital selection is required';
        if (!formData.doctor) newErrors.doctor = 'Doctor selection is required';
        if (!formData.appointment_date) newErrors.appointment_date = 'Appointment date is required';
        if (!formData.appointment_time) newErrors.appointment_time = 'Appointment time is required';
        if (!formData.reason.trim()) newErrors.reason = 'Reason for appointment is required';

        const selectedDateTime = new Date(`${formData.appointment_date}T${formData.appointment_time}`);
        const now = new Date();
        if (selectedDateTime <= now) {
            newErrors.appointment_date = 'Appointment date and time must be in the future';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleCreateAppointment = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        setSubmitting(true);
        try {
            const appointmentDateTime = new Date(`${formData.appointment_date}T${formData.appointment_time}`);

            const appointmentData = {
                hospital_id: formData.hospital,
                doctor_id: formData.doctor,
                appointment_date: appointmentDateTime.toISOString(),
                reason: formData.reason.trim()
            };

            console.log(appointmentData)

            const response = await appointmentService.create(appointmentData);

            if (response.success) {
                toast.success('Appointment created successfully!');
                setShowCreateModal(false);
                resetForm();
                fetchAppointments();
            } else {
                toast.error(response.error || 'Failed to create appointment');
            }
        } catch (error) {
            console.error('Error creating appointment:', error);
            toast.error('Failed to create appointment');
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setFormData({
            hospital: '',
            doctor: '',
            appointment_date: '',
            appointment_time: '',
            reason: ''
        });
        setErrors({});
        setDoctors([]);
    };

    const handleViewDetails = (appointment) => {
        setSelectedAppointment(appointment);
        setShowDetailsModal(true);
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
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">My Appointments</h1>
                    <p className="text-sm text-gray-600 mt-1">
                        Book and manage your medical appointments
                    </p>
                </div>
                <div className="flex items-center space-x-3 mt-4 sm:mt-0">
                    <button
                        onClick={fetchAppointments}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </button>
                    <button
                        onClick={() => {
                            resetForm();
                            setShowCreateModal(true);
                        }}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Book Appointment
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {Object.entries(statusConfig).map(([status, config]) => {
                    const count = appointments.filter(app => app.status === status).length;
                    return (
                        <div key={status} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                            <div className="flex items-center">
                                <div className={`p-3 rounded-lg bg-${config.color}-100`}>
                                    <config.icon className={`w-6 h-6 text-${config.color}-600`} />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">{config.label}</p>
                                    <p className="text-2xl font-bold text-gray-900">{count}</p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search appointments..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>
            </div>

            {/* Appointments Table */}
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
                            {paginatedAppointments.map((appointment) => {
                                const statusInfo = statusConfig[appointment.status];
                                return (
                                    <tr key={appointment.id} className="hover:bg-gray-50 transition-colors">
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
                                                    <div>{formatDate(appointment.appointment_date)}</div>
                                                    <div className="text-xs text-gray-500 flex items-center">
                                                        <Clock className="w-3 h-3 mr-1" />
                                                        {formatTime(appointment.appointment_date)}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900">
                                            <div className="max-w-xs truncate" title={appointment.reason}>
                                                {appointment.reason}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-${statusInfo.color}-100 text-${statusInfo.color}-800`}>
                                                <statusInfo.icon className="w-3 h-3 mr-1" />
                                                {statusInfo.label}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => handleViewDetails(appointment)}
                                                className="text-blue-600 hover:text-blue-900 p-1 rounded-lg hover:bg-blue-50 transition-colors"
                                                title="View Details"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            {canCreatePrescription(appointment) && (
                                                <button
                                                    onClick={() => handlelistPrescription(appointment)}
                                                    className="text-purple-600 hover:text-purple-900 p-1 rounded-lg hover:bg-purple-50 transition-colors"
                                                    title="Views Prescription"
                                                >
                                                    <Pill className="w-4 h-4" />
                                                </button>
                                            )}

                                        </td>

                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="bg-white px-6 py-3 flex items-center justify-between border-t border-gray-200">
                        <div className="flex items-center text-sm text-gray-700">
                            Showing {startIndex + 1} to {Math.min(startIndex + appointmentsPerPage, filteredAppointments.length)} of {filteredAppointments.length} appointments
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

            {/* Create Appointment Modal */}
            {
                showCreateModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-gray-900">Book New Appointment</h3>
                                    <button
                                        onClick={() => {
                                            setShowCreateModal(false);
                                            resetForm();
                                        }}
                                        className="text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>
                            <div className="p-6">
                                <form onSubmit={handleCreateAppointment} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Hospital *
                                            </label>
                                            <select
                                                name="hospital"
                                                value={formData.hospital}
                                                onChange={handleInputChange}
                                                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.hospital ? 'border-red-300' : 'border-gray-300'}`}
                                            >
                                                <option value="">Select Hospital</option>
                                                {hospitals.map((hospital) => (
                                                    <option key={hospital.id} value={hospital.id}>
                                                        {hospital.name}
                                                    </option>
                                                ))}
                                            </select>
                                            {errors.hospital && <p className="text-red-500 text-sm mt-1">{errors.hospital}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Doctor *
                                            </label>
                                            <select
                                                name="doctor"
                                                value={formData.doctor}
                                                onChange={handleInputChange}
                                                disabled={!formData.hospital || loadingDoctors}
                                                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.doctor ? 'border-red-300' : 'border-gray-300'} ${(!formData.hospital || loadingDoctors) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            >
                                                <option value="">
                                                    {loadingDoctors ? 'Loading doctors...' : 'Select Doctor'}
                                                </option>
                                                {doctors.map((doctor) => (
                                                    <option key={doctor.id} value={doctor.user?.id}>
                                                        Dr. {doctor.user?.first_name} {doctor.user?.last_name} - {doctor.specialization}
                                                    </option>
                                                ))}
                                            </select>
                                            {errors.doctor && <p className="text-red-500 text-sm mt-1">{errors.doctor}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Appointment Date *
                                            </label>
                                            <input
                                                type="date"
                                                name="appointment_date"
                                                value={formData.appointment_date}
                                                onChange={handleInputChange}
                                                min={new Date().toISOString().split('T')[0]}
                                                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.appointment_date ? 'border-red-300' : 'border-gray-300'}`}
                                            />
                                            {errors.appointment_date && <p className="text-red-500 text-sm mt-1">{errors.appointment_date}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Appointment Time *
                                            </label>
                                            <input
                                                type="time"
                                                name="appointment_time"
                                                value={formData.appointment_time}
                                                onChange={handleInputChange}
                                                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.appointment_time ? 'border-red-300' : 'border-gray-300'}`}
                                            />
                                            {errors.appointment_time && <p className="text-red-500 text-sm mt-1">{errors.appointment_time}</p>}
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Reason for Appointment *
                                            </label>
                                            <textarea
                                                name="reason"
                                                value={formData.reason}
                                                onChange={handleInputChange}
                                                rows={3}
                                                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.reason ? 'border-red-300' : 'border-gray-300'}`}
                                                placeholder="Describe the reason for your appointment..."
                                            />
                                            {errors.reason && <p className="text-red-500 text-sm mt-1">{errors.reason}</p>}
                                        </div>
                                    </div>
                                    <div className="flex justify-end space-x-3 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowCreateModal(false);
                                                resetForm();
                                            }}
                                            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={submitting}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
                                        >
                                            {submitting ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                    Booking...
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="w-4 h-4 mr-2" />
                                                    Book Appointment
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Appointment Details Modal */}
            {
                showDetailsModal && selectedAppointment && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
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
                                    <div className="space-y-4">
                                        <h5 className="font-medium text-gray-900">Appointment Information</h5>
                                        <div className="space-y-2">
                                            <div className="flex items-center text-sm">
                                                {(() => {
                                                    const statusInfo = statusConfig[selectedAppointment.status];
                                                    return (
                                                        <>
                                                            <statusInfo.icon className="w-4 h-4 text-gray-400 mr-3" />
                                                            <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${statusInfo.color}-100 text-${statusInfo.color}-800`}>
                                                                {statusInfo.label}
                                                            </span>
                                                        </>
                                                    );
                                                })()}
                                            </div>
                                            <div className="flex items-center text-sm">
                                                <Calendar className="w-4 h-4 text-gray-400 mr-3" />
                                                <span>{formatDate(selectedAppointment.appointment_date)}</span>
                                            </div>
                                            <div className="flex items-center text-sm">
                                                <Clock className="w-4 h-4 text-gray-400 mr-3" />
                                                <span>{formatTime(selectedAppointment.appointment_date)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h5 className="font-medium text-gray-900">Contact Information</h5>
                                        <div className="space-y-2">
                                            <div className="flex items-center text-sm">
                                                <Mail className="w-4 h-4 text-gray-400 mr-3" />
                                                <span>{selectedAppointment.hospital?.email || 'Not available'}</span>
                                            </div>
                                            <div className="flex items-center text-sm">
                                                <Phone className="w-4 h-4 text-gray-400 mr-3" />
                                                <span>{selectedAppointment.hospital?.phone || 'Not available'}</span>
                                            </div>
                                            <div className="flex items-start text-sm">
                                                <MapPin className="w-4 h-4 text-gray-400 mr-3 mt-0.5" />
                                                <span>{selectedAppointment.hospital?.location || 'Not available'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h5 className="font-medium text-gray-900 mb-2">Reason for Appointment</h5>
                                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                                        {selectedAppointment.reason}
                                    </p>
                                </div>

                                {selectedAppointment.notes && (
                                    <div>
                                        <h5 className="font-medium text-gray-900 mb-2">Doctor's Notes</h5>
                                        <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                                            {selectedAppointment.notes}
                                        </p>
                                    </div>
                                )}

                                <div className="text-xs text-gray-500 pt-4 border-t border-gray-200">
                                    <p>Appointment ID: {selectedAppointment.id}</p>
                                    <p>Created: {formatDate(selectedAppointment.created_at)}</p>
                                    {selectedAppointment.updated_at !== selectedAppointment.created_at && (
                                        <p>Last Updated: {formatDate(selectedAppointment.updated_at)}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default PatientAppointments;
