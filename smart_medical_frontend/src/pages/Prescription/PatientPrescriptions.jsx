import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    Search, Filter, RefreshCw, Eye, Edit, Trash2, Plus, Loader2,
    Calendar, Clock, User, Pill, FileText, AlertCircle, CheckCircle,
    X, Save, Building2, Phone, Mail, AlertTriangle, Activity,
    TrendingUp, Users, Stethoscope, MapPin, ArrowLeft
} from 'lucide-react';
import { toast } from 'react-toastify';
import { prescriptionService, getCurrentUser, orderService } from '../../api';


const AppointmentPrescriptions = () => {
    const [searchParams] = useSearchParams();
    const appointmentId = searchParams.get('appointment');

    const [prescriptions, setPrescriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPrescription, setSelectedPrescription] = useState(null);
    const [recommendations, setRecommendations] = useState([]);
    const [loadingRecommendations, setLoadingRecommendations] = useState(false);
    const [userData, setUserData] = useState(null);
    const [creatingOrderId, setCreatingOrderId] = useState(null);

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

    useEffect(() => {
        if (appointmentId) {
            initializePage();
        }
    }, [appointmentId]);

    const initializePage = async () => {
        try {
            const user = getCurrentUser();
            if (!user) {
                toast.error('Please log in to access prescriptions');
                return;
            }
            setUserData(user);
            await fetchPrescriptionsByAppointment();
        } catch (error) {
            console.error('Error initializing page:', error);
            toast.error('Failed to load page data');
        }
    };

    const handleCreateOrder = async (recommendation) => {
        if (!selectedPrescription) {
            toast.error('No prescription selected');
            return;
        }

        if (selectedPrescription.status !== 'active') {
            toast.info('Only active prescriptions can be ordered');
            return;
        }

        if (userData?.user_type !== 'patient') {
            toast.error('Only patients can place orders');
            return;
        }


        const patientId = selectedPrescription.patient.user?.id;
        const doctorId = selectedPrescription.doctor.user?.id ?? null;

        const payload = {
            pharmacy_id: recommendation.pharmacy.user?.id,
            prescription_id: selectedPrescription.id,
            patient_id: patientId,
            doctor_id: doctorId,
            total_amount: recommendation.total_cost,
        };

        console.log(payload)
        try {
            setCreatingOrderId(recommendation.id);
            const res = await orderService.create(payload);
            if (res.success) {
                toast.success('Order created successfully');
                initializePage();
            } else {
                toast.error(res.error?.message || 'Failed to create order');
            }
        } catch (err) {
            console.error('Create order error:', err);
            toast.error('Failed to create order');
        } finally {
            setCreatingOrderId(null);
        }
    };

    const fetchPrescriptionsByAppointment = async () => {
        try {
            setLoading(true);
            const response = await prescriptionService.getByAppointment(appointmentId);


            if (response.success) {
                setPrescriptions(response.data.results);

                // Automatically select the first prescription and load its details
                const firstPrescription = response.data;

                setSelectedPrescription(firstPrescription);
                await fetchRecommendations(firstPrescription.id);
            } else {
                toast.info('No prescriptions found for this appointment');
            }
        } catch (error) {
            console.error('Error fetching prescriptions:', error);
            toast.error('Failed to fetch prescriptions');
        } finally {
            setLoading(false);
        }
    };

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

    const formatDateTime = (dateString) => {
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleCancel = () => {
        // Navigate back to users list
        window.history.back(); // or use your navigation method
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="flex flex-col items-center space-y-4">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    <p className="text-gray-600">Loading prescriptions for this appointment...</p>
                </div>
            </div>
        );
    }

    if (!appointmentId) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="bg-white p-8 rounded-lg shadow-md text-center">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">No Appointment Selected</h2>
                    <p className="text-gray-600">Please select an appointment to view its prescriptions.</p>
                </div>
            </div>
        );
    }

    if (!selectedPrescription) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="bg-white p-8 rounded-lg shadow-md text-center">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">No Prescriptions Found</h2>
                    <p className="text-gray-600">There are no prescriptions associated with this appointment.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Appointment Prescriptions</h1>
                    <p className="text-sm text-gray-600 mt-1">
                        Viewing prescriptions for the appointment
                    </p>
                </div>

                <button
                    onClick={handleCancel}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Appointments
                </button>

            </div>

            {/* Prescription Details */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 space-y-6">
                    {/* Status Banner */}
                    <div className={`p-4 rounded-lg ${statusConfig[selectedPrescription.status]?.bgColor}`}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                {React.createElement(statusConfig[selectedPrescription.status]?.icon, {
                                    className: `w-5 h-5 mr-2 ${statusConfig[selectedPrescription.status]?.textColor}`
                                })}
                                <span className={`font-medium ${statusConfig[selectedPrescription.status]?.textColor}`}>
                                    Status: {statusConfig[selectedPrescription.status]?.label}
                                </span>
                            </div>
                        </div>
                        <p className={`text-sm ${statusConfig[selectedPrescription.status]?.textColor} mt-1`}>
                            {statusConfig[selectedPrescription.status]?.description}
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
                                    <span className="text-sm text-gray-900">{statusConfig[selectedPrescription.status]?.label}</span>
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
                                                {item.drug?.name || item.drug_name || 'Unknown Drug'}
                                            </p>
                                            {item.drug?.strength && (
                                                <p className="text-xs text-gray-500">{item.drug.strength}</p>
                                            )}
                                            {!item.drug && item.drug_name && (
                                                <p className="text-xs text-orange-500 mt-0.5">⚠️ Manual Entry</p>
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
                                        <div className="mt-4 flex justify-end">
                                            {!selectedPrescription.is_ordered ? (
                                                <button
                                                    onClick={() => handleCreateOrder(recommendation)}
                                                    disabled={
                                                        creatingOrderId === recommendation.id ||
                                                        selectedPrescription.status !== 'active'
                                                    }
                                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                                                >
                                                    {creatingOrderId === recommendation.id ? (
                                                        <>
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                            Creating order...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Plus className="w-4 h-4" />
                                                            Order from this pharmacy
                                                        </>
                                                    )}
                                                </button>
                                            ) : (
                                                <p className="px-4 py-2 text-sm font-medium text-gray-600 bg-green-200 rounded-lg">
                                                    Order already placed ✓
                                                </p>
                                            )}
                                        </div>


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
    );
};

export default AppointmentPrescriptions;
