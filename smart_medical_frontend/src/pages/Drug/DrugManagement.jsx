import React, { useState, useEffect } from 'react';
import {
    Pill, Search, Plus, Eye, Edit, Trash2, RefreshCw, Download,
    Save, X, Loader2, AlertCircle, Building, Factory, Shield,
    CheckCircle, XCircle, Filter, FileText, Package
} from 'lucide-react';
import { toast } from 'react-toastify';
import { drugService, getCurrentUser } from '../../api';

const DrugManagement = () => {
    const [drugs, setDrugs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedDrug, setSelectedDrug] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [prescriptionFilter, setPrescriptionFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [drugsPerPage] = useState(12);
    const [userData, setUserData] = useState(null);

    const [createFormData, setCreateFormData] = useState({
        name: '',
        generic_name: '',
        category: '',
        description: '',
        dosage_form: '',
        manufacturer: '',
        requires_prescription: true
    });

    const [editFormData, setEditFormData] = useState({
        name: '',
        generic_name: '',
        category: '',
        description: '',
        dosage_form: '',
        manufacturer: '',
        requires_prescription: true
    });

    const [createErrors, setCreateErrors] = useState({});
    const [editErrors, setEditErrors] = useState({});

    const drugCategories = [
        { value: 'antibiotic', label: 'Antibiotic' },
        { value: 'painkiller', label: 'Painkiller' },
        { value: 'vitamin', label: 'Vitamin' },
        { value: 'prescription', label: 'Prescription' },
        { value: 'over_counter', label: 'Over The Counter' }
    ];

    const dosageForms = [
        'Tablet', 'Capsule', 'Syrup', 'Injection', 'Cream', 'Ointment',
        'Drop', 'Inhaler', 'Patch', 'Suppository', 'Powder', 'Suspension'
    ];

    const categoryColors = {
        antibiotic: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
        painkiller: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' },
        vitamin: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' },
        prescription: { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200' },
        over_counter: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' }
    };

    useEffect(() => {
        initializePage();
    }, []);

    const initializePage = async () => {
        try {
            const user = getCurrentUser();
            if (!user) {
                toast.error('Please log in to access drug management');
                return;
            }
            setUserData(user);
            await fetchDrugs();
        } catch (error) {
            console.error('Error initializing page:', error);
            toast.error('Failed to load page data');
        } finally {
            setLoading(false);
        }
    };

    const fetchDrugs = async () => {
        try {
            const response = await drugService.getAll();
            if (response.success) {
                setDrugs(response.data.results || response.data || []);
            } else {
                toast.error('Failed to fetch drugs');
            }
        } catch (error) {
            console.error('Error fetching drugs:', error);
            toast.error('Failed to fetch drugs');
        }
    };

    const resetCreateForm = () => {
        setCreateFormData({
            name: '',
            generic_name: '',
            category: '',
            description: '',
            dosage_form: '',
            manufacturer: '',
            requires_prescription: true
        });
        setCreateErrors({});
    };

    const resetEditForm = () => {
        setEditFormData({
            name: '',
            generic_name: '',
            category: '',
            description: '',
            dosage_form: '',
            manufacturer: '',
            requires_prescription: true
        });
        setEditErrors({});
    };

    const validateCreateForm = () => {
        const newErrors = {};

        if (!createFormData.name.trim()) newErrors.name = 'Drug name is required';
        if (!createFormData.generic_name.trim()) newErrors.generic_name = 'Generic name is required';
        if (!createFormData.category) newErrors.category = 'Category is required';
        if (!createFormData.description.trim()) newErrors.description = 'Description is required';
        if (!createFormData.dosage_form.trim()) newErrors.dosage_form = 'Dosage form is required';
        if (!createFormData.manufacturer.trim()) newErrors.manufacturer = 'Manufacturer is required';

        setCreateErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateEditForm = () => {
        const newErrors = {};

        if (!editFormData.name.trim()) newErrors.name = 'Drug name is required';
        if (!editFormData.generic_name.trim()) newErrors.generic_name = 'Generic name is required';
        if (!editFormData.category) newErrors.category = 'Category is required';
        if (!editFormData.description.trim()) newErrors.description = 'Description is required';
        if (!editFormData.dosage_form.trim()) newErrors.dosage_form = 'Dosage form is required';
        if (!editFormData.manufacturer.trim()) newErrors.manufacturer = 'Manufacturer is required';

        setEditErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleCreateDrug = async (e) => {
        e.preventDefault();
        if (!validateCreateForm()) return;

        setSubmitting(true);
        try {
            const response = await drugService.create(createFormData);
            if (response.success) {
                toast.success('Drug created successfully');
                setShowCreateModal(false);
                resetCreateForm();
                fetchDrugs();
            } else {
                toast.error(response.error || 'Failed to create drug');
            }
        } catch (error) {
            console.error('Error creating drug:', error);
            toast.error('Failed to create drug');
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateDrug = async (e) => {
        e.preventDefault();
        if (!validateEditForm()) return;

        setSubmitting(true);
        try {
            const response = await drugService.update(selectedDrug.id, editFormData);
            if (response.success) {
                toast.success('Drug updated successfully');
                setShowEditModal(false);
                resetEditForm();
                fetchDrugs();
            } else {
                toast.error(response.error || 'Failed to update drug');
            }
        } catch (error) {
            console.error('Error updating drug:', error);
            toast.error('Failed to update drug');
        } finally {
            setSubmitting(false);
        }
    };

    const handleViewDetails = async (drug) => {
        try {
            const response = await drugService.getById(drug.id);
            if (response.success) {
                setSelectedDrug(response.data);
                setShowDetailsModal(true);
            } else {
                toast.error('Failed to fetch drug details');
            }
        } catch (error) {
            console.error('Error fetching drug details:', error);
            toast.error('Failed to fetch drug details');
        }
    };

    const handleEditDrug = (drug) => {
        setSelectedDrug(drug);
        setEditFormData({
            name: drug.name,
            generic_name: drug.generic_name,
            category: drug.category,
            description: drug.description,
            dosage_form: drug.dosage_form,
            manufacturer: drug.manufacturer,
            requires_prescription: drug.requires_prescription
        });
        setShowEditModal(true);
    };

    const handleCreateInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setCreateFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));

        if (createErrors[name]) {
            setCreateErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const handleEditInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setEditFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));

        if (editErrors[name]) {
            setEditErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getCategoryDisplay = (category) => {
        const categoryObj = drugCategories.find(c => c.value === category);
        return categoryObj ? categoryObj.label : category;
    };

    const getCategoryBadge = (category) => {
        const colors = categoryColors[category] || { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200' };
        return (
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text} ${colors.border} border`}>
                {getCategoryDisplay(category)}
            </span>
        );
    };

    const filteredDrugs = drugs.filter(drug => {
        const matchesSearch =
            drug.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            drug.generic_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            drug.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()) ||
            drug.description.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCategory = categoryFilter === 'all' || drug.category === categoryFilter;

        let matchesPrescription = true;
        if (prescriptionFilter === 'prescription') {
            matchesPrescription = drug.requires_prescription;
        } else if (prescriptionFilter === 'over_counter') {
            matchesPrescription = !drug.requires_prescription;
        }

        return matchesSearch && matchesCategory && matchesPrescription;
    });

    const totalPages = Math.ceil(filteredDrugs.length / drugsPerPage);
    const startIndex = (currentPage - 1) * drugsPerPage;
    const paginatedDrugs = filteredDrugs.slice(startIndex, startIndex + drugsPerPage);

    const getStats = () => {
        const total = drugs.length;
        const prescription = drugs.filter(d => d.requires_prescription).length;
        const overCounter = drugs.filter(d => !d.requires_prescription).length;
        const categories = {};

        drugCategories.forEach(cat => {
            categories[cat.value] = drugs.filter(d => d.category === cat.value).length;
        });

        return { total, prescription, overCounter, categories };
    };

    const stats = getStats();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="flex flex-col items-center space-y-4">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    <p className="text-gray-600">Loading drugs...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Drug Management</h1>
                    <p className="text-sm text-gray-600 mt-1">
                        Manage pharmaceutical inventory and drug information
                    </p>
                </div>
                <div className="flex items-center space-x-3 mt-4 sm:mt-0">
                    <button
                        onClick={fetchDrugs}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </button>
                    <button
                        onClick={() => {
                            resetCreateForm();
                            setShowCreateModal(true);
                        }}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Drug
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center">
                        <div className="p-3 rounded-lg bg-blue-100">
                            <Package className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Total Drugs</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center">
                        <div className="p-3 rounded-lg bg-purple-100">
                            <Shield className="w-6 h-6 text-purple-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Prescription</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.prescription}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center">
                        <div className="p-3 rounded-lg bg-green-100">
                            <CheckCircle className="w-6 h-6 text-green-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Over Counter</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.overCounter}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center">
                        <div className="p-3 rounded-lg bg-yellow-100">
                            <Factory className="w-6 h-6 text-yellow-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Categories</p>
                            <p className="text-2xl font-bold text-gray-900">{drugCategories.length}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search drugs..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <select
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                    >
                        <option value="all">All Categories</option>
                        {drugCategories.map(category => (
                            <option key={category.value} value={category.value}>{category.label}</option>
                        ))}
                    </select>

                    <select
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={prescriptionFilter}
                        onChange={(e) => setPrescriptionFilter(e.target.value)}
                    >
                        <option value="all">All Types</option>
                        <option value="prescription">Prescription Only</option>
                        <option value="over_counter">Over The Counter</option>
                    </select>

                    <button className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors">
                        <Download className="w-4 h-4 mr-2" />
                        Export
                    </button>
                </div>
            </div>

            {/* Drugs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {paginatedDrugs.map((drug) => (
                    <div key={drug.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                        <div className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                                    <Pill className="w-6 h-6 text-white" />
                                </div>
                                <div className="flex space-x-1">
                                    <button
                                        onClick={() => handleViewDetails(drug)}
                                        className="text-blue-600 hover:text-blue-900 p-1 rounded-lg hover:bg-blue-50 transition-colors"
                                        title="View Details"
                                    >
                                        <Eye className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleEditDrug(drug)}
                                        className="text-green-600 hover:text-green-900 p-1 rounded-lg hover:bg-green-50 transition-colors"
                                        title="Edit Drug"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <h3 className="font-semibold text-gray-900 truncate" title={drug.name}>
                                        {drug.name}
                                    </h3>
                                    <p className="text-sm text-gray-500 truncate" title={drug.generic_name}>
                                        {drug.generic_name}
                                    </p>
                                </div>

                                <div className="flex items-center justify-between">
                                    {getCategoryBadge(drug.category)}
                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${drug.requires_prescription
                                        ? 'bg-red-100 text-red-800'
                                        : 'bg-green-100 text-green-800'}`}>
                                        {drug.requires_prescription ? (
                                            <>
                                                <Shield className="w-3 h-3 mr-1" />
                                                Rx
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle className="w-3 h-3 mr-1" />
                                                OTC
                                            </>
                                        )}
                                    </span>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center text-sm text-gray-600">
                                        <Package className="w-4 h-4 mr-2" />
                                        <span className="truncate">{drug.dosage_form}</span>
                                    </div>
                                    <div className="flex items-center text-sm text-gray-600">
                                        <Factory className="w-4 h-4 mr-2" />
                                        <span className="truncate" title={drug.manufacturer}>{drug.manufacturer}</span>
                                    </div>
                                </div>

                                <p className="text-sm text-gray-600 line-clamp-2" title={drug.description}>
                                    {drug.description}
                                </p>

                                <div className="pt-2 border-t border-gray-100">
                                    <p className="text-xs text-gray-400">
                                        Added {formatDate(drug.created_at)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center text-sm text-gray-700">
                            Showing {startIndex + 1} to {Math.min(startIndex + drugsPerPage, filteredDrugs.length)} of {filteredDrugs.length} drugs
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

            {/* Create Drug Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900">Add New Drug</h3>
                                <button
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        resetCreateForm();
                                    }}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>
                        <div className="p-6">
                            <form onSubmit={handleCreateDrug} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Drug Name *
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={createFormData.name}
                                            onChange={handleCreateInputChange}
                                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${createErrors.name ? 'border-red-300' : 'border-gray-300'}`}
                                            placeholder="Enter drug name"
                                        />
                                        {createErrors.name && <p className="text-red-500 text-sm mt-1">{createErrors.name}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Generic Name *
                                        </label>
                                        <input
                                            type="text"
                                            name="generic_name"
                                            value={createFormData.generic_name}
                                            onChange={handleCreateInputChange}
                                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${createErrors.generic_name ? 'border-red-300' : 'border-gray-300'}`}
                                            placeholder="Enter generic name"
                                        />
                                        {createErrors.generic_name && <p className="text-red-500 text-sm mt-1">{createErrors.generic_name}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Category *
                                        </label>
                                        <select
                                            name="category"
                                            value={createFormData.category}
                                            onChange={handleCreateInputChange}
                                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${createErrors.category ? 'border-red-300' : 'border-gray-300'}`}
                                        >
                                            <option value="">Select Category</option>
                                            {drugCategories.map(category => (
                                                <option key={category.value} value={category.value}>{category.label}</option>
                                            ))}
                                        </select>
                                        {createErrors.category && <p className="text-red-500 text-sm mt-1">{createErrors.category}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Dosage Form *
                                        </label>
                                        <select
                                            name="dosage_form"
                                            value={createFormData.dosage_form}
                                            onChange={handleCreateInputChange}
                                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${createErrors.dosage_form ? 'border-red-300' : 'border-gray-300'}`}
                                        >
                                            <option value="">Select Dosage Form</option>
                                            {dosageForms.map(form => (
                                                <option key={form} value={form}>{form}</option>
                                            ))}
                                        </select>
                                        {createErrors.dosage_form && <p className="text-red-500 text-sm mt-1">{createErrors.dosage_form}</p>}
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Manufacturer *
                                        </label>
                                        <input
                                            type="text"
                                            name="manufacturer"
                                            value={createFormData.manufacturer}
                                            onChange={handleCreateInputChange}
                                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${createErrors.manufacturer ? 'border-red-300' : 'border-gray-300'}`}
                                            placeholder="Enter manufacturer name"
                                        />
                                        {createErrors.manufacturer && <p className="text-red-500 text-sm mt-1">{createErrors.manufacturer}</p>}
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Description *
                                        </label>
                                        <textarea
                                            name="description"
                                            value={createFormData.description}
                                            onChange={handleCreateInputChange}
                                            rows={3}
                                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${createErrors.description ? 'border-red-300' : 'border-gray-300'}`}
                                            placeholder="Enter drug description and usage information"
                                        />
                                        {createErrors.description && <p className="text-red-500 text-sm mt-1">{createErrors.description}</p>}
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="flex items-center">
                                            <input
                                                type="checkbox"
                                                name="requires_prescription"
                                                checked={createFormData.requires_prescription}
                                                onChange={handleCreateInputChange}
                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <span className="ml-2 text-sm text-gray-700">Requires Prescription</span>
                                        </label>
                                    </div>
                                </div>

                                <div className="flex justify-end space-x-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowCreateModal(false);
                                            resetCreateForm();
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
                                                Creating...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="w-4 h-4 mr-2" />
                                                Create Drug
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Drug Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900">Edit Drug</h3>
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
                            <form onSubmit={handleUpdateDrug} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Drug Name *
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={editFormData.name}
                                            onChange={handleEditInputChange}
                                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${editErrors.name ? 'border-red-300' : 'border-gray-300'}`}
                                            placeholder="Enter drug name"
                                        />
                                        {editErrors.name && <p className="text-red-500 text-sm mt-1">{editErrors.name}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Generic Name *
                                        </label>
                                        <input
                                            type="text"
                                            name="generic_name"
                                            value={editFormData.generic_name}
                                            onChange={handleEditInputChange}
                                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${editErrors.generic_name ? 'border-red-300' : 'border-gray-300'}`}
                                            placeholder="Enter generic name"
                                        />
                                        {editErrors.generic_name && <p className="text-red-500 text-sm mt-1">{editErrors.generic_name}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Category *
                                        </label>
                                        <select
                                            name="category"
                                            value={editFormData.category}
                                            onChange={handleEditInputChange}
                                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${editErrors.category ? 'border-red-300' : 'border-gray-300'}`}
                                        >
                                            <option value="">Select Category</option>
                                            {drugCategories.map(category => (
                                                <option key={category.value} value={category.value}>{category.label}</option>
                                            ))}
                                        </select>
                                        {editErrors.category && <p className="text-red-500 text-sm mt-1">{editErrors.category}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Dosage Form *
                                        </label>
                                        <select
                                            name="dosage_form"
                                            value={editFormData.dosage_form}
                                            onChange={handleEditInputChange}
                                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${editErrors.dosage_form ? 'border-red-300' : 'border-gray-300'}`}
                                        >
                                            <option value="">Select Dosage Form</option>
                                            {dosageForms.map(form => (
                                                <option key={form} value={form}>{form}</option>
                                            ))}
                                        </select>
                                        {editErrors.dosage_form && <p className="text-red-500 text-sm mt-1">{editErrors.dosage_form}</p>}
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Manufacturer *
                                        </label>
                                        <input
                                            type="text"
                                            name="manufacturer"
                                            value={editFormData.manufacturer}
                                            onChange={handleEditInputChange}
                                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${editErrors.manufacturer ? 'border-red-300' : 'border-gray-300'}`}
                                            placeholder="Enter manufacturer name"
                                        />
                                        {editErrors.manufacturer && <p className="text-red-500 text-sm mt-1">{editErrors.manufacturer}</p>}
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Description *
                                        </label>
                                        <textarea
                                            name="description"
                                            value={editFormData.description}
                                            onChange={handleEditInputChange}
                                            rows={3}
                                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${editErrors.description ? 'border-red-300' : 'border-gray-300'}`}
                                            placeholder="Enter drug description and usage information"
                                        />
                                        {editErrors.description && <p className="text-red-500 text-sm mt-1">{editErrors.description}</p>}
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="flex items-center">
                                            <input
                                                type="checkbox"
                                                name="requires_prescription"
                                                checked={editFormData.requires_prescription}
                                                onChange={handleEditInputChange}
                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <span className="ml-2 text-sm text-gray-700">Requires Prescription</span>
                                        </label>
                                    </div>
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
                                        type="submit"
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
                                                Update Drug
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Drug Details Modal */}
            {showDetailsModal && selectedDrug && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900">Drug Details</h3>
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
                                    <Pill className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                    <h4 className="text-xl font-bold text-gray-900">{selectedDrug.name}</h4>
                                    <p className="text-sm text-gray-500">{selectedDrug.generic_name}</p>
                                    <div className="flex items-center space-x-2 mt-2">
                                        {getCategoryBadge(selectedDrug.category)}
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${selectedDrug.requires_prescription
                                            ? 'bg-red-100 text-red-800'
                                            : 'bg-green-100 text-green-800'}`}>
                                            {selectedDrug.requires_prescription ? (
                                                <>
                                                    <Shield className="w-3 h-3 mr-1" />
                                                    Prescription Required
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle className="w-3 h-3 mr-1" />
                                                    Over The Counter
                                                </>
                                            )}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <h5 className="font-medium text-gray-900">Drug Information</h5>
                                    <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                                        <div className="flex justify-between">
                                            <span className="text-sm font-medium text-gray-600">Brand Name:</span>
                                            <span className="text-sm text-gray-900">{selectedDrug.name}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm font-medium text-gray-600">Generic Name:</span>
                                            <span className="text-sm text-gray-900">{selectedDrug.generic_name}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm font-medium text-gray-600">Category:</span>
                                            <span className="text-sm text-gray-900">{getCategoryDisplay(selectedDrug.category)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm font-medium text-gray-600">Dosage Form:</span>
                                            <span className="text-sm text-gray-900">{selectedDrug.dosage_form}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm font-medium text-gray-600">Created:</span>
                                            <span className="text-sm text-gray-900">{formatDate(selectedDrug.created_at)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h5 className="font-medium text-gray-900">Manufacturing Details</h5>
                                    <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                                        <div className="flex items-center text-sm">
                                            <Factory className="w-4 h-4 text-gray-400 mr-3" />
                                            <span className="font-medium text-gray-600">Manufacturer:</span>
                                        </div>
                                        <p className="text-sm text-gray-900 ml-7">{selectedDrug.manufacturer}</p>

                                        <div className="flex items-center text-sm pt-2">
                                            <Shield className="w-4 h-4 text-gray-400 mr-3" />
                                            <span className="font-medium text-gray-600">Prescription Status:</span>
                                        </div>
                                        <p className="text-sm text-gray-900 ml-7">
                                            {selectedDrug.requires_prescription
                                                ? 'Prescription Required - This medication requires a valid prescription from a licensed healthcare provider'
                                                : 'Over The Counter - This medication can be purchased without a prescription'
                                            }
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h5 className="font-medium text-gray-900 mb-3">Description & Usage</h5>
                                <div className="bg-blue-50 p-4 rounded-lg">
                                    <div className="flex items-start">
                                        <FileText className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
                                        <p className="text-sm text-gray-700 leading-relaxed">{selectedDrug.description}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="text-xs text-gray-500 pt-4 border-t border-gray-200">
                                <p>Drug ID: {selectedDrug.id}</p>
                                <p>Added to system: {formatDate(selectedDrug.created_at)}</p>
                            </div>

                            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                                <button
                                    onClick={() => {
                                        setShowDetailsModal(false);
                                        handleEditDrug(selectedDrug);
                                    }}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
                                >
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit Drug
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DrugManagement;