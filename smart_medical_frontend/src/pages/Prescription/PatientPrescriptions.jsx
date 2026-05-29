import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    Search, Filter, RefreshCw, Eye, Edit, Trash2, Plus, Loader2,
    Calendar, Clock, User, Pill, FileText, AlertCircle, CheckCircle,
    X, Save, Building2, Phone, Mail, AlertTriangle, Activity,
    TrendingUp, Users, Stethoscope, MapPin, ArrowLeft, Store,
    TrendingDown, ChevronDown, ChevronUp
} from 'lucide-react';
import { toast } from 'react-toastify';
import { prescriptionService, getCurrentUser, orderService } from '../../api';

const AppointmentPrescriptions = () => {
    const [searchParams] = useSearchParams();
    const appointmentId = searchParams.get('appointment');

    const [loading, setLoading] = useState(true);
    const [selectedPrescription, setSelectedPrescription] = useState(null);
    const [recommendations, setRecommendations] = useState([]);
    const [loadingRecommendations, setLoadingRecommendations] = useState(false);
    const [userData, setUserData] = useState(null);
    const [creatingOrderId, setCreatingOrderId] = useState(null);
    const [expandedItems, setExpandedItems] = useState(true);

    const statusConfig = {
        active: {
            icon: CheckCircle,
            label: 'Active',
            bgColor: 'bg-blue-50',
            textColor: 'text-blue-700',
            borderColor: 'border-blue-200',
            description: 'Prescription is currently active'
        },
        filled: {
            icon: CheckCircle,
            label: 'Filled',
            bgColor: 'bg-green-50',
            textColor: 'text-green-700',
            borderColor: 'border-green-200',
            description: 'Prescription has been filled by pharmacy'
        },
        expired: {
            icon: AlertCircle,
            label: 'Expired',
            bgColor: 'bg-red-50',
            textColor: 'text-red-700',
            borderColor: 'border-red-200',
            description: 'Prescription has expired'
        }
    };

    useEffect(() => {
        if (appointmentId) initializePage();
    }, [appointmentId]);

    const initializePage = async () => {
        try {
            const user = getCurrentUser();
            if (!user) { toast.error('Please log in to access prescriptions'); return; }
            setUserData(user);
            await fetchPrescriptionsByAppointment();
        } catch (error) {
            console.error('Error initializing page:', error);
            toast.error('Failed to load page data');
        }
    };

    const fetchPrescriptionsByAppointment = async () => {
        setLoading(true);
        try {
            const response = await prescriptionService.getByAppointment(appointmentId);
            console.log('Prescription response:', response);

            if (response.success && response.data) {
                // getByAppointment returns a single prescription object (OneToOne relation)
                const prescription = response.data.results
                    ? response.data.results[0]   // paginated
                    : response.data;             // single object

                if (!prescription?.id) {
                    toast.info('No prescription found for this appointment');
                    setLoading(false);
                    return;
                }

                setSelectedPrescription(prescription);
                await fetchRecommendations(prescription.id);
            } else {
                toast.info('No prescription found for this appointment');
            }
        } catch (error) {
            console.error('Error fetching prescription:', error);
            toast.error('Failed to fetch prescription');
        } finally {
            setLoading(false);
        }
    };

    const fetchRecommendations = async (prescriptionId) => {
        setLoadingRecommendations(true);
        try {
            const response = await prescriptionService.getRecommendations(prescriptionId);
            console.log('Recommendations response:', response);

            if (response.success) {
                // Handle both array and paginated responses
                const recs = Array.isArray(response.data)
                    ? response.data
                    : response.data?.results || response.data || [];

                console.log('Parsed recommendations:', recs);
                setRecommendations(recs);

                if (recs.length === 0) {
                    console.warn('No recommendations returned for prescription:', prescriptionId);
                }
            } else {
                console.error('Recommendations API error:', response);
                toast.error('Failed to fetch pharmacy recommendations');
            }
        } catch (error) {
            console.error('Error fetching recommendations:', error);
            toast.error('Failed to fetch pharmacy recommendations');
        } finally {
            setLoadingRecommendations(false);
        }
    };

    const handleCreateOrder = async (recommendation) => {
        if (!selectedPrescription) { toast.error('No prescription selected'); return; }
        if (selectedPrescription.status !== 'active') { toast.info('Only active prescriptions can be ordered'); return; }
        if (userData?.user_type !== 'patient') { toast.error('Only patients can place orders'); return; }

        const payload = {
            pharmacy_id: recommendation.pharmacy.user?.id,
            prescription_id: selectedPrescription.id,
            patient_id: selectedPrescription.patient.user?.id,
            doctor_id: selectedPrescription.doctor.user?.id ?? null,
            total_amount: recommendation.total_cost,
        };

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

    const formatDateTime = (dateString) => new Date(dateString).toLocaleString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    const formatCurrency = (amount) => new Intl.NumberFormat('en-RW', {
        style: 'currency', currency: 'RWF', currencyDisplay: 'code'
    }).format(amount);

    const getAvailabilityStyle = (score) => {
        const s = parseFloat(score);
        if (s >= 80) return { badge: 'bg-green-100 text-green-800', bar: 'bg-green-500' };
        if (s >= 50) return { badge: 'bg-yellow-100 text-yellow-800', bar: 'bg-yellow-500' };
        return { badge: 'bg-red-100 text-red-800', bar: 'bg-red-400' };
    };

    // ── Loading ──────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="flex flex-col items-center space-y-4">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    <p className="text-gray-600">Loading prescription...</p>
                </div>
            </div>
        );
    }

    if (!appointmentId) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="bg-white p-8 rounded-xl shadow-md text-center">
                    <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                    <h2 className="text-lg font-semibold text-gray-800 mb-1">No Appointment Selected</h2>
                    <p className="text-sm text-gray-500">Please select an appointment to view its prescription.</p>
                </div>
            </div>
        );
    }

    if (!selectedPrescription) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="bg-white p-8 rounded-xl shadow-md text-center">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h2 className="text-lg font-semibold text-gray-800 mb-1">No Prescription Found</h2>
                    <p className="text-sm text-gray-500">There is no prescription associated with this appointment.</p>
                    <button onClick={() => window.history.back()}
                        className="mt-4 inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
                        <ArrowLeft className="w-4 h-4" /> Go Back
                    </button>
                </div>
            </div>
        );
    }

    const statusInfo = statusConfig[selectedPrescription.status] || statusConfig.active;

    return (
        <div className="space-y-6 p-6 max-w-5xl mx-auto">

            {/* ── Header ──────────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Prescription</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Appointment prescription and pharmacy options</p>
                </div>
                <button onClick={() => window.history.back()}
                    className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Back
                </button>
            </div>

            {/* ── Status Banner ────────────────────────────────────────────────── */}
            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${statusInfo.bgColor} ${statusInfo.borderColor}`}>
                <statusInfo.icon className={`w-5 h-5 flex-shrink-0 ${statusInfo.textColor}`} />
                <div>
                    <span className={`text-sm font-semibold ${statusInfo.textColor}`}>{statusInfo.label}</span>
                    <span className={`text-sm ${statusInfo.textColor} ml-2 opacity-80`}>— {statusInfo.description}</span>
                </div>
                {selectedPrescription.is_ordered && (
                    <span className="ml-auto text-xs font-medium bg-green-600 text-white px-2.5 py-1 rounded-full">
                        Order placed ✓
                    </span>
                )}
            </div>

            {/* ── Patient + Prescription Info ──────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Patient */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
                    <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                        <User className="w-4 h-4 text-purple-500" /> Patient Information
                    </h4>
                    <div className="space-y-2">
                        {[
                            ['Name', `${selectedPrescription.patient?.user?.first_name} ${selectedPrescription.patient?.user?.last_name}`],
                            ['Email', selectedPrescription.patient?.user?.email],
                            ['Phone', selectedPrescription.patient?.user?.phone_number || 'N/A'],
                            ['Blood Group', selectedPrescription.patient?.blood_group || 'N/A'],
                        ].map(([label, value]) => (
                            <div key={label} className="flex justify-between text-sm">
                                <span className="text-gray-500 font-medium">{label}</span>
                                <span className="text-gray-900">{value}</span>
                            </div>
                        ))}
                    </div>
                    {selectedPrescription.patient?.allergies && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-xs font-semibold text-red-700">Allergies</p>
                                <p className="text-xs text-red-600 mt-0.5">{selectedPrescription.patient.allergies}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Prescription meta + appointment */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
                    <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                        <Pill className="w-4 h-4 text-blue-500" /> Prescription Details
                    </h4>
                    <div className="space-y-2">
                        {[
                            ['Doctor', `Dr. ${selectedPrescription.doctor?.user?.first_name} ${selectedPrescription.doctor?.user?.last_name}`],
                            ['Specialization', selectedPrescription.doctor?.specialization || 'N/A'],
                            ['Created', formatDateTime(selectedPrescription.created_at)],
                            ['Updated', formatDateTime(selectedPrescription.updated_at)],
                        ].map(([label, value]) => (
                            <div key={label} className="flex justify-between text-sm">
                                <span className="text-gray-500 font-medium">{label}</span>
                                <span className="text-gray-900 text-right">{value}</span>
                            </div>
                        ))}
                    </div>
                    {selectedPrescription.appointment && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-xs font-semibold text-blue-700 mb-1 flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" /> Related Appointment
                            </p>
                            <p className="text-xs text-blue-600">{formatDateTime(selectedPrescription.appointment.appointment_date)}</p>
                            <p className="text-xs text-blue-600 mt-0.5">Reason: {selectedPrescription.appointment.reason}</p>
                            <p className="text-xs text-blue-600 mt-0.5">Hospital: {selectedPrescription.appointment.hospital?.name}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Diagnosis ───────────────────────────────────────────────────── */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2 mb-3">
                    <FileText className="w-4 h-4 text-gray-500" /> Diagnosis
                </h4>
                <p className="text-sm text-gray-700 leading-relaxed bg-blue-50 border border-blue-100 rounded-lg p-3">
                    {selectedPrescription.diagnosis}
                </p>
                {selectedPrescription.notes && (
                    <div className="mt-3">
                        <p className="text-xs font-medium text-gray-500 mb-1">Additional Notes</p>
                        <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{selectedPrescription.notes}</p>
                    </div>
                )}
            </div>

            {/* ── Medications ─────────────────────────────────────────────────── */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <button onClick={() => setExpandedItems(p => !p)}
                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
                    <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                        <Pill className="w-4 h-4 text-green-500" />
                        Medications
                        <span className="ml-1 text-xs font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                            {selectedPrescription.items?.length || 0}
                        </span>
                    </h4>
                    {expandedItems ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </button>

                {expandedItems && (
                    <div className="divide-y divide-gray-100">
                        {selectedPrescription.items?.map((item, index) => (
                            <div key={index} className="px-5 py-4">
                                <div className="flex items-start justify-between gap-4 mb-2">
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900">
                                            {item.drug?.name || item.drug_name || 'Unknown Drug'}
                                        </p>
                                        {item.drug?.generic_name && (
                                            <p className="text-xs text-gray-400">{item.drug.generic_name}</p>
                                        )}
                                        {!item.drug && item.drug_name && (
                                            <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                                                Manual entry
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full flex-shrink-0">
                                        #{index + 1}
                                    </span>
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        ['Quantity', item.quantity],
                                        ['Dosage', item.dosage],
                                        ['Duration', item.duration],
                                    ].map(([label, value]) => (
                                        <div key={label} className="bg-gray-50 rounded-lg px-3 py-2">
                                            <p className="text-xs font-medium text-gray-400 uppercase">{label}</p>
                                            <p className="text-sm text-gray-800 mt-0.5">{value}</p>
                                        </div>
                                    ))}
                                </div>
                                {item.instructions && (
                                    <div className="mt-2 text-xs text-gray-500 bg-yellow-50 border border-yellow-100 rounded-lg px-3 py-2">
                                        <span className="font-medium text-yellow-700">Instructions: </span>
                                        {item.instructions}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Pharmacy Recommendations ─────────────────────────────────────── */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                        <Store className="w-4 h-4 text-purple-500" /> Pharmacy Recommendations
                        {recommendations.length > 0 && (
                            <span className="ml-1 text-xs font-bold bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                                {recommendations.length}
                            </span>
                        )}
                    </h4>
                    {loadingRecommendations && (
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading…
                        </div>
                    )}
                    {!loadingRecommendations && (
                        <button onClick={() => fetchRecommendations(selectedPrescription.id)}
                            className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1">
                            <RefreshCw className="w-3 h-3" /> Refresh
                        </button>
                    )}
                </div>

                {loadingRecommendations ? (
                    <div className="flex flex-col items-center py-10 gap-3">
                        <Loader2 className="w-7 h-7 animate-spin text-purple-500" />
                        <p className="text-sm text-gray-400">Checking pharmacy availability…</p>
                    </div>
                ) : recommendations.length === 0 ? (
                    <div className="py-12 text-center px-6">
                        <Store className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                        <p className="text-sm font-medium text-gray-600 mb-1">No pharmacy recommendations yet</p>
                        <p className="text-xs text-gray-400 max-w-xs mx-auto">
                            Recommendations are generated automatically when the prescription is created.
                            If this is a new prescription, they may take a moment to appear.
                        </p>
                        <button onClick={() => fetchRecommendations(selectedPrescription.id)}
                            className="mt-4 inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                            <RefreshCw className="w-3.5 h-3.5" /> Try again
                        </button>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {[...recommendations]
                            .sort((a, b) => parseFloat(b.availability_score) - parseFloat(a.availability_score) || parseFloat(a.total_cost) - parseFloat(b.total_cost))
                            .map((rec, index) => {
                                const avail = parseFloat(rec.availability_score);
                                const style = getAvailabilityStyle(avail);
                                const isBest = index === 0;
                                return (
                                    <div key={rec.id} className={`p-5 ${isBest ? 'bg-green-50' : ''}`}>
                                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                            {/* Pharmacy info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isBest ? 'bg-green-200' : 'bg-gray-100'}`}>
                                                        <Store className={`w-4 h-4 ${isBest ? 'text-green-700' : 'text-gray-500'}`} />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-sm font-semibold text-gray-900">{rec.pharmacy?.pharmacy_name}</p>
                                                            {isBest && (
                                                                <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded-full">Best match</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-gray-500 ml-10">
                                                    {rec.pharmacy?.address && (
                                                        <span className="flex items-center gap-1 truncate">
                                                            <MapPin className="w-3 h-3 flex-shrink-0" />{rec.pharmacy.address}
                                                        </span>
                                                    )}
                                                    {rec.pharmacy?.user?.phone_number && (
                                                        <span className="flex items-center gap-1">
                                                            <Phone className="w-3 h-3" />{rec.pharmacy.user.phone_number}
                                                        </span>
                                                    )}
                                                    {rec.pharmacy?.location && (
                                                        <span className="flex items-center gap-1 truncate">
                                                            <MapPin className="w-3 h-3 flex-shrink-0" />{rec.pharmacy.location}
                                                        </span>
                                                    )}
                                                    {rec.distance_km && (
                                                        <span className="flex items-center gap-1">
                                                            <TrendingUp className="w-3 h-3" />{parseFloat(rec.distance_km).toFixed(1)} km away
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Availability bar */}
                                                <div className="mt-3 ml-10">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-xs text-gray-500">Drug availability</span>
                                                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${style.badge}`}>{avail.toFixed(0)}%</span>
                                                    </div>
                                                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                                                        <div className={`h-1.5 rounded-full ${style.bar}`} style={{ width: `${Math.min(avail, 100)}%` }} />
                                                    </div>
                                                </div>

                                                {avail < 100 && (
                                                    <div className="mt-2 ml-10 flex items-start gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
                                                        <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                                                        May not stock all medications — call ahead to confirm.
                                                    </div>
                                                )}
                                            </div>

                                            {/* Cost + action */}
                                            <div className="flex-shrink-0 flex flex-col items-end gap-3">
                                                <div className="text-right">
                                                    <p className="text-lg font-bold text-gray-900">{formatCurrency(rec.total_cost)}</p>
                                                    <p className="text-xs text-gray-400">estimated total</p>
                                                </div>

                                                {!selectedPrescription.is_ordered ? (
                                                    <button
                                                        onClick={() => handleCreateOrder(rec)}
                                                        disabled={creatingOrderId === rec.id || selectedPrescription.status !== 'active'}
                                                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                                                        {creatingOrderId === rec.id
                                                            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Placing order…</>
                                                            : <><Plus className="w-3.5 h-3.5" /> Order here</>
                                                        }
                                                    </button>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-100 text-green-700 border border-green-200">
                                                        <CheckCircle className="w-3.5 h-3.5" /> Order placed
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                )}
            </div>

            {/* ── Medical History ──────────────────────────────────────────────── */}
            {selectedPrescription.patient?.medical_history && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                    <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2 mb-3">
                        <Activity className="w-4 h-4 text-gray-400" /> Patient Medical History
                    </h4>
                    <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 leading-relaxed">
                        {selectedPrescription.patient.medical_history}
                    </p>
                </div>
            )}
        </div>
    );
};

export default AppointmentPrescriptions;