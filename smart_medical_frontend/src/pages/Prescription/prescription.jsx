import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    ArrowLeft, Plus, X, Save, Loader2, User, Stethoscope, Calendar,
    Clock, Building2, AlertCircle, Check, Trash2, Pill,
    FileText, AlertTriangle, Database, Type, ClipboardList,
    CheckCircle2, Circle, RefreshCw
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
        { id: Date.now(), drug_id: null, drug_name_display: '', drug_name: '', quantity: '', dosage: '', duration: '', instructions: '' }
    ]);

    const [drugSearchMap, setDrugSearchMap] = useState({});
    const [drugResultsMap, setDrugResultsMap] = useState({});
    const [loadingDrugMap, setLoadingDrugMap] = useState({});
    const [openDropdownId, setOpenDropdownId] = useState(null);
    const searchTimers = useRef({});
    const dropdownRefs = useRef({});

    const statusChoices = [
        { value: 'active', label: 'Active' },
        { value: 'filled', label: 'Filled' },
        { value: 'expired', label: 'Expired' }
    ];

    // ── Fix: split init and click-outside into separate effects ─────────────
    useEffect(() => {
        initializePage();
    }, []); // runs once only

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (
                openDropdownId &&
                dropdownRefs.current[openDropdownId] &&
                !dropdownRefs.current[openDropdownId].contains(e.target)
            ) {
                setOpenDropdownId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [openDropdownId]);

    // ── Close dropdown on Escape ─────────────────────────────────────────────
    useEffect(() => {
        const handleEsc = (e) => { if (e.key === 'Escape') setOpenDropdownId(null); };
        document.addEventListener('keydown', handleEsc);
        return () => document.removeEventListener('keydown', handleEsc);
    }, []);

    const isItemComplete = (item) =>
        (item.drug_id || (item.drug_name && item.drug_name.trim())) &&
        item.quantity && item.dosage && item.duration;

    const completedItems = prescriptionItems.filter(isItemComplete);
    const hasIncomplete = prescriptionItems.some(i => !isItemComplete(i));

    const initializePage = async () => {
        try {
            const user = getCurrentUser();
            if (!user) { toast.error('Please log in to create prescriptions'); return; }
            setUserData(user);
            const urlParams = new URLSearchParams(window.location.search);
            const appointmentId = urlParams.get('appointment');
            if (appointmentId) {
                await fetchAppointmentDetails(appointmentId);
            } else {
                toast.error('No appointment selected');
                setLoading(false);
            }
        } catch {
            toast.error('Failed to load page data');
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
                    patient: response.data.patient?.id,
                    doctor: response.data.doctor?.id
                }));
            } else {
                toast.error('Failed to fetch appointment details');
            }
        } catch {
            toast.error('Failed to fetch appointment details');
        } finally {
            setLoading(false);
        }
    };

    const handleAddItem = () => {
        setPrescriptionItems(prev => [...prev, {
            id: Date.now(), drug_id: null, drug_name_display: '', drug_name: '',
            quantity: '', dosage: '', duration: '', instructions: ''
        }]);
    };

    const handleRemoveItem = (itemId) => {
        if (prescriptionItems.length === 1) { toast.warning('At least one prescription item is required'); return; }
        setPrescriptionItems(prev => prev.filter(item => item.id !== itemId));
        setDrugSearchMap(prev => { const n = { ...prev }; delete n[itemId]; return n; });
        setDrugResultsMap(prev => { const n = { ...prev }; delete n[itemId]; return n; });
        setLoadingDrugMap(prev => { const n = { ...prev }; delete n[itemId]; return n; });
        if (openDropdownId === itemId) setOpenDropdownId(null);
    };

    const handleItemChange = (itemId, field, value) => {
        setPrescriptionItems(prev => prev.map(item => item.id === itemId ? { ...item, [field]: value } : item));
    };

    const handleDrugSearchChange = (itemId, value) => {
        setDrugSearchMap(prev => ({ ...prev, [itemId]: value }));
        handleItemChange(itemId, 'drug_id', null);
        handleItemChange(itemId, 'drug_name_display', '');
        clearTimeout(searchTimers.current[itemId]);
        if (!value || value.length < 2) {
            setDrugResultsMap(prev => ({ ...prev, [itemId]: [] }));
            setOpenDropdownId(null);
            return;
        }
        searchTimers.current[itemId] = setTimeout(async () => {
            setLoadingDrugMap(prev => ({ ...prev, [itemId]: true }));
            setOpenDropdownId(itemId);
            try {
                const response = await drugService.getAll({ search: value });
                if (response.success) {
                    setDrugResultsMap(prev => ({ ...prev, [itemId]: response.data.results || response.data || [] }));
                }
            } catch {
                console.error('Error searching drugs');
            } finally {
                setLoadingDrugMap(prev => ({ ...prev, [itemId]: false }));
            }
        }, 300);
    };

    const handleDrugSelect = (itemId, drug) => {
        const displayName = `${drug.name}${drug.strength ? ` ${drug.strength}` : ''}`;
        setPrescriptionItems(prev => prev.map(item =>
            item.id === itemId ? { ...item, drug_id: drug.id, drug_name_display: displayName, drug_name: '' } : item
        ));
        setDrugSearchMap(prev => ({ ...prev, [itemId]: '' }));
        setDrugResultsMap(prev => ({ ...prev, [itemId]: [] }));
        setOpenDropdownId(null);
        toast.success(`Selected: ${displayName}`);
    };

    const handleManualDrugNameChange = (itemId, value) => {
        setPrescriptionItems(prev => prev.map(item =>
            item.id === itemId ? { ...item, drug_name: value, drug_id: null, drug_name_display: '' } : item
        ));
    };

    const handleClearDrug = (itemId) => {
        handleItemChange(itemId, 'drug_id', null);
        handleItemChange(itemId, 'drug_name_display', '');
        setDrugSearchMap(prev => ({ ...prev, [itemId]: '' }));
    };

    const handleSubmit = async () => {
        if (!prescriptionData.diagnosis.trim()) { toast.error('Diagnosis is required'); return; }
        const validItems = prescriptionItems.filter(isItemComplete);
        if (validItems.length === 0) { toast.error('At least one complete prescription item is required'); return; }

        setSubmitting(true);
        try {
            const payload = {
                appointment_id: prescriptionData.appointment,
                diagnosis: prescriptionData.diagnosis,
                notes: prescriptionData.notes || '',
                status: prescriptionData.status || 'active',
                items: validItems.map(item => ({
                    drug_id: item.drug_id || null,
                    drug_name: item.drug_name || '',
                    quantity: parseInt(item.quantity, 10),
                    dosage: item.dosage,
                    duration: item.duration,
                    instructions: item.instructions || ''
                }))
            };
            const response = await prescriptionService.create(payload);
            if (response.success) {
                toast.success('Prescription created successfully!');
                window.history.back();
            } else {
                toast.error(response.error || 'Failed to create prescription');
            }
        } catch {
            toast.error('Failed to create prescription');
        } finally {
            setSubmitting(false);
        }
    };

    const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A';
    const formatTime = (d) => d ? new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'N/A';

    // ── Loading / error states ───────────────────────────────────────────────
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
                <div className="text-center bg-white rounded-xl p-8 shadow-sm border border-gray-200 max-w-sm">
                    <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                    <h2 className="text-lg font-bold text-gray-900 mb-2">Appointment Not Found</h2>
                    <p className="text-sm text-gray-500 mb-4">Unable to load appointment details for prescription creation.</p>
                    <button onClick={() => window.history.back()} className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <div className="max-w-7xl mx-auto py-8 px-4">

                {/* ── Header ──────────────────────────────────────────────────── */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <button onClick={() => window.history.back()}
                            className="p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Create Prescription</h1>
                            <p className="text-sm text-gray-500">New prescription for completed appointment</p>
                        </div>
                    </div>
                    <span className="bg-green-100 text-green-800 text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Appointment Completed
                    </span>
                </div>

                {/* ── Appointment Summary ──────────────────────────────────────── */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                    <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-600" /> Appointment Summary
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {/* Patient */}
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5 mb-2">
                                <User className="w-3.5 h-3.5 text-purple-500" /> Patient
                            </p>
                            <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                                <p className="text-sm font-medium text-gray-900">
                                    {appointment.patient?.user?.first_name} {appointment.patient?.user?.last_name}
                                </p>
                                <p className="text-xs text-gray-500">{appointment.patient?.user?.email}</p>
                                <p className="text-xs text-gray-500">Blood Group: <span className="font-medium text-gray-700">{appointment.patient?.blood_group || 'N/A'}</span></p>
                            </div>
                        </div>
                        {/* Doctor */}
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5 mb-2">
                                <Stethoscope className="w-3.5 h-3.5 text-blue-500" /> Doctor & Hospital
                            </p>
                            <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                                <p className="text-sm font-medium text-gray-900">
                                    Dr. {appointment.doctor?.user?.first_name} {appointment.doctor?.user?.last_name}
                                </p>
                                <p className="text-xs text-gray-500">{appointment.doctor?.specialization}</p>
                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                    <Building2 className="w-3 h-3" /> {appointment.hospital?.name}
                                </p>
                            </div>
                        </div>
                        {/* Date */}
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5 mb-2">
                                <Calendar className="w-3.5 h-3.5 text-green-500" /> Appointment
                            </p>
                            <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                                <p className="text-xs text-gray-600 flex items-center gap-1">
                                    <Calendar className="w-3 h-3" /> {formatDate(appointment.appointment_date)}
                                </p>
                                <p className="text-xs text-gray-600 flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> {formatTime(appointment.appointment_date)}
                                </p>
                                <p className="text-xs text-gray-600">Reason: {appointment.reason}</p>
                            </div>
                        </div>
                    </div>
                    {appointment.patient?.allergies && (
                        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-xs font-semibold text-red-700">Patient Allergies</p>
                                <p className="text-xs text-red-600 mt-0.5">{appointment.patient.allergies}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Prescription Details ─────────────────────────────────────── */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                    <h2 className="text-base font-semibold text-gray-900 mb-5 flex items-center gap-2">
                        <Pill className="w-4 h-4 text-purple-500" /> Prescription Details
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Diagnosis <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={prescriptionData.diagnosis}
                                onChange={(e) => setPrescriptionData(prev => ({ ...prev, diagnosis: e.target.value }))}
                                rows={5}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                placeholder="Enter detailed diagnosis..."
                            />
                            {!prescriptionData.diagnosis.trim() && (
                                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" /> Diagnosis is required
                                </p>
                            )}
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                                <select
                                    value={prescriptionData.status}
                                    onChange={(e) => setPrescriptionData(prev => ({ ...prev, status: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    {statusChoices.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Additional Notes</label>
                                <textarea
                                    value={prescriptionData.notes}
                                    onChange={(e) => setPrescriptionData(prev => ({ ...prev, notes: e.target.value }))}
                                    rows={4}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                    placeholder="Additional notes or instructions..."
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Items + Cart ─────────────────────────────────────────────── */}
                <div className="flex gap-6 items-start">

                    {/* LEFT: Items */}
                    <div className="flex-1 min-w-0">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center justify-between mb-5">
                                <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                                    <Pill className="w-4 h-4 text-green-600" /> Prescription Items
                                </h2>
                                <button type="button" onClick={handleAddItem}
                                    className="bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 flex items-center gap-1.5 text-sm font-medium">
                                    <Plus className="w-3.5 h-3.5" /> Add Item
                                </button>
                            </div>

                            <div className="space-y-4">
                                {prescriptionItems.map((item, index) => (
                                    <div key={item.id} className="border border-gray-200 rounded-xl overflow-hidden">
                                        {/* Item header */}
                                        <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-200">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-xs font-medium text-gray-500 bg-white border border-gray-200 px-2 py-0.5 rounded-full">
                                                    Item #{index + 1}
                                                </span>
                                                {isItemComplete(item) ? (
                                                    <span className="text-xs text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                        <CheckCircle2 className="w-3 h-3" /> Ready
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                        <Circle className="w-3 h-3" /> Incomplete
                                                    </span>
                                                )}
                                                {(item.drug_name_display || item.drug_name) && (
                                                    <span className="text-xs font-medium text-gray-600 truncate max-w-[180px]">
                                                        — {item.drug_name_display || item.drug_name}
                                                    </span>
                                                )}
                                            </div>
                                            {prescriptionItems.length > 1 && (
                                                <button type="button" onClick={() => handleRemoveItem(item.id)}
                                                    className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors" title="Remove item">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>

                                        <div className="p-4 space-y-4">
                                            {/* Drug row */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {/* Catalog search */}
                                                <div ref={el => dropdownRefs.current[item.id] = el}>
                                                    <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
                                                        <Database className="w-3 h-3 text-blue-500" /> Search Catalog
                                                    </label>
                                                    <div className="relative">
                                                        <input type="text"
                                                            value={drugSearchMap[item.id] || ''}
                                                            onChange={(e) => handleDrugSearchChange(item.id, e.target.value)}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed"
                                                            placeholder="Search existing drugs…"
                                                            disabled={!!item.drug_id}
                                                        />
                                                        {openDropdownId === item.id && (
                                                            <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-52 overflow-y-auto">
                                                                {loadingDrugMap[item.id] ? (
                                                                    <div className="flex items-center justify-center gap-2 py-4 text-sm text-gray-400">
                                                                        <Loader2 className="w-4 h-4 animate-spin" /> Searching…
                                                                    </div>
                                                                ) : (drugResultsMap[item.id] || []).length > 0 ? (
                                                                    (drugResultsMap[item.id] || []).map(drug => (
                                                                        <button key={drug.id} type="button"
                                                                            onClick={() => handleDrugSelect(item.id, drug)}
                                                                            className="w-full text-left px-3 py-2.5 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors">
                                                                            <p className="text-sm font-medium text-gray-900">
                                                                                {drug.name}{drug.strength ? ` — ${drug.strength}` : ''}
                                                                            </p>
                                                                            <p className="text-xs text-gray-400 mt-0.5">
                                                                                {drug.category || 'No category'} · {drug.manufacturer || 'Unknown'}
                                                                            </p>
                                                                        </button>
                                                                    ))
                                                                ) : (
                                                                    <div className="py-4 text-center text-sm text-gray-400">No drugs found</div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                    {item.drug_id && (
                                                        <div className="mt-1.5 flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-lg px-2.5 py-1">
                                                            <Check className="w-3 h-3 text-green-600 flex-shrink-0" />
                                                            <span className="text-xs text-green-700 font-medium flex-1 truncate">{item.drug_name_display}</span>
                                                            <button type="button" onClick={() => handleClearDrug(item.id)}
                                                                className="text-green-400 hover:text-red-500 transition-colors flex-shrink-0">
                                                                <X className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Manual entry */}
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
                                                        <Type className="w-3 h-3 text-amber-500" /> Or Enter Manually
                                                    </label>
                                                    <input type="text"
                                                        value={item.drug_name}
                                                        onChange={(e) => handleManualDrugNameChange(item.id, e.target.value)}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed"
                                                        placeholder="Drug name not in catalog"
                                                        disabled={!!item.drug_id}
                                                    />
                                                    {item.drug_name && !item.drug_id && (
                                                        <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                                                            <AlertCircle className="w-3 h-3" /> Manual entry — not in catalog
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Fields */}
                                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-600 mb-1">
                                                        Quantity <span className="text-red-400">*</span>
                                                    </label>
                                                    <input type="number" value={item.quantity}
                                                        onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                        placeholder="e.g. 30" min="1" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-600 mb-1">
                                                        Dosage <span className="text-red-400">*</span>
                                                    </label>
                                                    <input type="text" value={item.dosage}
                                                        onChange={(e) => handleItemChange(item.id, 'dosage', e.target.value)}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                        placeholder="e.g. 2 tabs twice daily" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-600 mb-1">
                                                        Duration <span className="text-red-400">*</span>
                                                    </label>
                                                    <input type="text" value={item.duration}
                                                        onChange={(e) => handleItemChange(item.id, 'duration', e.target.value)}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                        placeholder="e.g. 7 days" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-600 mb-1">Instructions</label>
                                                    <input type="text" value={item.instructions}
                                                        onChange={(e) => handleItemChange(item.id, 'instructions', e.target.value)}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                        placeholder="e.g. After meals" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: Cart */}
                    <div className="w-72 flex-shrink-0 sticky top-6">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            {/* Header */}
                            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <ClipboardList className="w-4 h-4 text-blue-600" />
                                    <span className="text-sm font-semibold text-gray-900">Rx Summary</span>
                                </div>
                                <span className="text-xs font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                                    {prescriptionItems.length} {prescriptionItems.length === 1 ? 'item' : 'items'}
                                </span>
                            </div>

                            {/* Items list */}
                            {prescriptionItems.length === 0 ? (
                                <div className="py-8 text-center">
                                    <Pill className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                                    <p className="text-xs text-gray-400">No medications added yet</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
                                    {prescriptionItems.map((item, index) => {
                                        const done = isItemComplete(item);
                                        const drugLabel = item.drug_name_display || item.drug_name;
                                        return (
                                            <div key={item.id} className="px-4 py-3">
                                                <div className="flex items-center gap-1.5 mb-1">
                                                    <span className="text-xs text-gray-400">#{index + 1}</span>
                                                    {done ? (
                                                        <span className="text-xs bg-green-50 text-green-700 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                                                            <CheckCircle2 className="w-2.5 h-2.5" /> Ready
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded-full">Incomplete</span>
                                                    )}
                                                </div>
                                                {drugLabel
                                                    ? <p className="text-sm font-medium text-gray-800 truncate">{drugLabel}</p>
                                                    : <p className="text-xs text-gray-400 italic">No drug selected</p>
                                                }
                                                {(item.dosage || item.duration) && (
                                                    <p className="text-xs text-gray-500 mt-0.5 truncate">
                                                        {[item.dosage, item.duration].filter(Boolean).join(' · ')}
                                                    </p>
                                                )}
                                                {item.quantity && <p className="text-xs text-gray-400">Qty: {item.quantity}</p>}
                                                {item.instructions && (
                                                    <p className="text-xs text-gray-400 italic mt-0.5 truncate" title={item.instructions}>
                                                        📝 {item.instructions}
                                                    </p>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Footer */}
                            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 space-y-3">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-gray-500">Ready to submit</span>
                                    <span className={`font-semibold ${completedItems.length === prescriptionItems.length ? 'text-green-600' : 'text-gray-700'}`}>
                                        {completedItems.length} / {prescriptionItems.length}
                                    </span>
                                </div>

                                {hasIncomplete && (
                                    <div className="flex items-start gap-1.5 bg-amber-50 border border-amber-200 rounded-lg p-2">
                                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                                        <p className="text-xs text-amber-700">Incomplete items will be skipped.</p>
                                    </div>
                                )}

                                {!prescriptionData.diagnosis.trim() && (
                                    <div className="flex items-start gap-1.5 bg-red-50 border border-red-200 rounded-lg p-2">
                                        <AlertCircle className="w-3.5 h-3.5 text-red-400 mt-0.5 flex-shrink-0" />
                                        <p className="text-xs text-red-600">Diagnosis is required.</p>
                                    </div>
                                )}

                                <div className="flex flex-col gap-2 pt-1">
                                    <button type="button" onClick={() => window.history.back()}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                                        Cancel
                                    </button>
                                    <button type="button" onClick={handleSubmit}
                                        disabled={submitting || completedItems.length === 0 || !prescriptionData.diagnosis.trim()}
                                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
                                        {submitting
                                            ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</>
                                            : <><Save className="w-4 h-4" /> Create Prescription</>
                                        }
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default CreatePrescription;