import React, { useState, useEffect } from 'react';
import {
    ArrowLeft, Plus, X, Save, Loader2, User, Stethoscope, Calendar,
    Clock, Building2, AlertCircle, Check, Trash2, Search, Pill,
    FileText, Eye, AlertTriangle
} from 'lucide-react';
import { toast } from 'react-toastify';
import { prescriptionService, appointmentService, drugService, getCurrentUser } from '../../api';

const CreatePrescription = () => {
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [appointment, setAppointment] = useState(null);
    const [userData, setUserData] = useState(null);

    const [prescriptionData, setPrescriptionData] = useState({
        appointment: '',
        patient: '',
        doctor: '',
        diagnosis: '',
        notes: '',
        status: 'active'
    });

    const [prescriptionItems, setPrescriptionItems] = useState([
        {
            id: Date.now(),
            drug: '',
            drug_name: '',
            quantity: '',
            dosage: '',
            duration: '',
            instructions: ''
        }
    ]);

    const [drugSearch, setDrugSearch] = useState('');
    const [availableDrugs, setAvailableDrugs] = useState([]);
    const [drugSearchResults, setDrugSearchResults] = useState([]);
    const [loadingDrugs, setLoadingDrugs] = useState(false);

    const statusChoices = [
        { value: 'active', label: 'Active' },
        { value: 'filled', label: 'Filled' },
        { value: 'expired', label: 'Expired' }
    ];

    useEffect(() => {
        initializePage();
        fetchDrugs(); // Load initial drug data
    }, []);

    const fetchDrugs = async () => {
        try {
            const response = await drugService.getAll();
            if (response.success) {
                const drugData = response.data.results || response.data || [];
                setAvailableDrugs(drugData);
            }
        } catch (error) {
            console.error('Error fetching drugs:', error);
        }
    };

    const searchDrugs = async (searchTerm) => {
        if (!searchTerm || searchTerm.length < 2) {
            setDrugSearchResults([]);
            return;
        }

        setLoadingDrugs(true);
        try {
            const response = await drugService.getAll({ name: searchTerm });
            if (response.success) {
                const results = response.data.results || response.data || [];
                setDrugSearchResults(results);
            }
        } catch (error) {
            console.error('Error searching drugs:', error);
            toast.error('Failed to search drugs');
        } finally {
            setLoadingDrugs(false);
        }
    };

    const initializePage = async () => {
        try {
            const user = getCurrentUser();
            if (!user) {
                toast.error('Please log in to create prescriptions');
                return;
            }
            setUserData(user);

            // Get appointment ID from URL parameters
            const urlParams = new URLSearchParams(window.location.search);
            const appointmentId = urlParams.get('appointment');

            if (appointmentId) {
                await fetchAppointmentDetails(appointmentId);
            }
        } catch (error) {
            console.error('Error initializing page:', error);
            toast.error('Failed to load page data');
        } finally {
            setLoading(false);
        }
    };

    const fetchAppointmentDetails = async (appointmentId) => {
        try {
            const response = await appointmentService.getById(appointmentId);
            if (response.success) {
                setAppointment(response.data);
                setPrescriptionData(prev => ({
                    ...prev,
                    appointment: response.data.id,
                    patient: response.data.patient.id,
                    doctor: response.data.doctor.id
                }));
            } else {
                toast.error('Failed to fetch appointment details');
            }
        } catch (error) {
            console.error('Error fetching appointment details:', error);
            toast.error('Failed to fetch appointment details');
        }
    };

    const handleAddItem = () => {
        setPrescriptionItems(prev => [
            ...prev,
            {
                id: Date.now(),
                drug: '',
                drug_name: '',
                quantity: '',
                dosage: '',
                duration: '',
                instructions: ''
            }
        ]);
    };

    const handleRemoveItem = (itemId) => {
        if (prescriptionItems.length === 1) {
            toast.warning('At least one prescription item is required');
            return;
        }
        setPrescriptionItems(prev => prev.filter(item => item.id !== itemId));
    };

    const handleItemChange = (itemId, field, value) => {
        setPrescriptionItems(prev => prev.map(item =>
            item.id === itemId
                ? { ...item, [field]: value }
                : item
        ));
    };

    const handleDrugInputChange = (itemId, value) => {
        handleItemChange(itemId, 'drug_name', value);
        setDrugSearch(value);

        // Debounce search to avoid too many API calls
        clearTimeout(window.drugSearchTimeout);
        window.drugSearchTimeout = setTimeout(() => {
            searchDrugs(value);
        }, 300);
    };

    const handleDrugSelect = (itemId, drug) => {
        handleItemChange(itemId, 'drug', drug.id);
        handleItemChange(itemId, 'drug_name', drug.name);
        setDrugSearchResults([]);
        setDrugSearch('');
    };

    const handleSubmit = async () => {
        // Validation
        if (!prescriptionData.diagnosis.trim()) {
            toast.error('Diagnosis is required');
            return;
        }

        const validItems = prescriptionItems.filter(item =>
            item.drug && item.quantity && item.dosage && item.duration
        );

        if (validItems.length === 0) {
            toast.error('At least one complete prescription item is required');
            return;
        }

        setSubmitting(true);
        try {
            const prescriptionPayload = {
                appointment_id: prescriptionData.appointment, // <-- as required
                diagnosis: prescriptionData.diagnosis,
                notes: prescriptionData.notes || '',
                status: prescriptionData.status || 'active',
                items: validItems.map(item => ({
                    drug_id: item.drug,                 // <-- map to drug_id
                    quantity: parseInt(item.quantity, 10),
                    dosage: item.dosage,
                    duration: item.duration,
                    instructions: item.instructions || ''
                }))
            };

            const response = await prescriptionService.create(prescriptionPayload);

            if (response.success) {
                toast.success('Prescription created successfully!');
                // Redirect back to appointments
                window.history.back();
            } else {
                toast.error(response.error || 'Failed to create prescription');
            }
        } catch (error) {
            console.error('Error creating prescription:', error);
            toast.error('Failed to create prescription');
        } finally {
            setSubmitting(false);
        }
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

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="flex flex-col items-center space-y-4">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    <p className="text-gray-600">Loading appointment details...</p>
                </div>
            </div>
        );
    }

    if (!appointment) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="text-center">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Appointment Not Found</h2>
                    <p className="text-gray-600 mb-4">Unable to load appointment details for prescription creation.</p>
                    <button
                        onClick={() => window.history.back()}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <div className="max-w-6xl mx-auto py-8 px-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => window.history.back()}
                            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Create Prescription</h1>
                            <p className="text-sm text-gray-600">Create a new prescription for completed appointment</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <span className="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full">
                            Appointment Completed
                        </span>
                    </div>
                </div>

                {/* Appointment Summary */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <FileText className="w-5 h-5 mr-2 text-blue-600" />
                        Appointment Summary
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Patient Info */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-medium text-gray-700 flex items-center">
                                <User className="w-4 h-4 mr-2 text-purple-600" />
                                Patient Information
                            </h3>
                            <div className="bg-gray-50 p-3 rounded-lg space-y-1">
                                <p className="text-sm font-medium text-gray-900">
                                    {appointment.patient?.user?.first_name} {appointment.patient?.user?.last_name}
                                </p>
                                <p className="text-sm text-gray-600">{appointment.patient?.user?.email}</p>
                                <p className="text-sm text-gray-600">
                                    Blood Group: {appointment.patient?.blood_group || 'N/A'}
                                </p>
                            </div>
                        </div>

                        {/* Doctor & Hospital Info */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-medium text-gray-700 flex items-center">
                                <Stethoscope className="w-4 h-4 mr-2 text-blue-600" />
                                Doctor & Hospital
                            </h3>
                            <div className="bg-gray-50 p-3 rounded-lg space-y-1">
                                <p className="text-sm font-medium text-gray-900">
                                    Dr. {appointment.doctor?.user?.first_name} {appointment.doctor?.user?.last_name}
                                </p>
                                <p className="text-sm text-gray-600">{appointment.doctor?.specialization}</p>
                                <p className="text-sm text-gray-600 flex items-center">
                                    <Building2 className="w-3 h-3 mr-1" />
                                    {appointment.hospital?.name}
                                </p>
                            </div>
                        </div>

                        {/* Appointment Details */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-medium text-gray-700 flex items-center">
                                <Calendar className="w-4 h-4 mr-2 text-green-600" />
                                Appointment Details
                            </h3>
                            <div className="bg-gray-50 p-3 rounded-lg space-y-1">
                                <p className="text-sm text-gray-600 flex items-center">
                                    <Calendar className="w-3 h-3 mr-1" />
                                    {formatDate(appointment.appointment_date)}
                                </p>
                                <p className="text-sm text-gray-600 flex items-center">
                                    <Clock className="w-3 h-3 mr-1" />
                                    {formatTime(appointment.appointment_date)}
                                </p>
                                <p className="text-sm text-gray-600">
                                    Reason: {appointment.reason}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Patient Allergies Alert */}
                    {appointment.patient?.allergies && (
                        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
                            <div className="flex items-start">
                                <AlertTriangle className="w-5 h-5 text-red-600 mr-2 mt-0.5" />
                                <div>
                                    <h4 className="text-sm font-medium text-red-800">Patient Allergies</h4>
                                    <p className="text-sm text-red-700 mt-1">{appointment.patient.allergies}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Prescription Form */}
                <div className="space-y-8">
                    {/* Basic Prescription Info */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                            <Pill className="w-5 h-5 mr-2 text-purple-600" />
                            Prescription Details
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Diagnosis *
                                </label>
                                <textarea
                                    value={prescriptionData.diagnosis}
                                    onChange={(e) => setPrescriptionData(prev => ({ ...prev, diagnosis: e.target.value }))}
                                    rows={4}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Enter detailed diagnosis..."
                                    required
                                />
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Status
                                    </label>
                                    <select
                                        value={prescriptionData.status}
                                        onChange={(e) => setPrescriptionData(prev => ({ ...prev, status: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        {statusChoices.map(status => (
                                            <option key={status.value} value={status.value}>{status.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Additional Notes
                                    </label>
                                    <textarea
                                        value={prescriptionData.notes}
                                        onChange={(e) => setPrescriptionData(prev => ({ ...prev, notes: e.target.value }))}
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Additional notes or instructions..."
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Prescription Items */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                                <Pill className="w-5 h-5 mr-2 text-green-600" />
                                Prescription Items
                            </h2>
                            <button
                                type="button"
                                onClick={handleAddItem}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center text-sm"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Add Item
                            </button>
                        </div>

                        <div className="space-y-6">
                            {prescriptionItems.map((item, index) => (
                                <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-sm font-medium text-gray-900">Item #{index + 1}</h3>
                                        {prescriptionItems.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveItem(item.id)}
                                                className="text-red-600 hover:text-red-800 p-1"
                                                title="Remove item"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {/* Drug Selection */}
                                        <div className="md:col-span-2 lg:col-span-1">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Drug/Medicine *
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={item.drug_name}
                                                    onChange={(e) => handleDrugInputChange(item.id, e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    placeholder="Search for drug..."
                                                    required
                                                />
                                                {(drugSearchResults.length > 0 || loadingDrugs) && item.drug_name && (
                                                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                                        {loadingDrugs ? (
                                                            <div className="px-3 py-2 text-center text-gray-500">
                                                                <Loader2 className="w-4 h-4 animate-spin inline-block mr-2" />
                                                                Searching drugs...
                                                            </div>
                                                        ) : drugSearchResults.length > 0 ? (
                                                            drugSearchResults.map(drug => (
                                                                <button
                                                                    key={drug.id}
                                                                    type="button"
                                                                    onClick={() => handleDrugSelect(item.id, drug)}
                                                                    className="w-full text-left px-3 py-2 hover:bg-gray-100 focus:bg-gray-100 border-b border-gray-100 last:border-b-0"
                                                                >
                                                                    <div className="font-medium text-gray-900">
                                                                        {drug.name} {drug.strength && `- ${drug.strength}`}
                                                                    </div>
                                                                    <div className="text-sm text-gray-500 flex items-center justify-between">
                                                                        <span>{drug.category?.name || 'No category'}</span>
                                                                        {drug.requires_prescription && (
                                                                            <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded">
                                                                                Prescription Required
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    {drug.manufacturer && (
                                                                        <div className="text-xs text-gray-400">
                                                                            by {drug.manufacturer}
                                                                        </div>
                                                                    )}
                                                                </button>
                                                            ))
                                                        ) : item.drug_name.length >= 2 && (
                                                            <div className="px-3 py-2 text-center text-gray-500">
                                                                No drugs found matching "{item.drug_name}"
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Quantity */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Quantity *
                                            </label>
                                            <input
                                                type="number"
                                                value={item.quantity}
                                                onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="e.g., 30"
                                                min="1"
                                                required
                                            />
                                        </div>

                                        {/* Dosage */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Dosage *
                                            </label>
                                            <input
                                                type="text"
                                                value={item.dosage}
                                                onChange={(e) => handleItemChange(item.id, 'dosage', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="e.g., 2 tablets twice daily"
                                                required
                                            />
                                        </div>

                                        {/* Duration */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Duration *
                                            </label>
                                            <input
                                                type="text"
                                                value={item.duration}
                                                onChange={(e) => handleItemChange(item.id, 'duration', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="e.g., 7 days"
                                                required
                                            />
                                        </div>

                                        {/* Instructions */}
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Special Instructions
                                            </label>
                                            <input
                                                type="text"
                                                value={item.instructions}
                                                onChange={(e) => handleItemChange(item.id, 'instructions', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="e.g., Take after meals, avoid alcohol"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex justify-end space-x-4">
                        <button
                            type="button"
                            onClick={() => window.history.back()}
                            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Creating Prescription...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    Create Prescription
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreatePrescription;