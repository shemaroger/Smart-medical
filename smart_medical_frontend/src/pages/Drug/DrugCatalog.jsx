import React, { useState, useEffect } from 'react';
import {
    Pill, Search, Eye, RefreshCw, Download, X, Loader2,
    Building, Factory, Shield, CheckCircle, Filter,
    FileText, Package
} from 'lucide-react';
import { toast } from 'react-toastify';
import { drugService, getCurrentUser } from '../../api';

const DrugCatalog = () => {
    const [drugs, setDrugs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedDrug, setSelectedDrug] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [prescriptionFilter, setPrescriptionFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [drugsPerPage] = useState(12);


    const drugCategories = [
        { value: 'antibiotic', label: 'Antibiotic' },
        { value: 'painkiller', label: 'Painkiller' },
        { value: 'vitamin', label: 'Vitamin' },
        { value: 'prescription', label: 'Prescription' },
        { value: 'over_counter', label: 'Over The Counter' }
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
                toast.error('Please log in to access drug catalog');
                return;
            }
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
                    <p className="text-gray-600">Loading drug catalog...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Drug Catalog</h1>
                    <p className="text-sm text-gray-600 mt-1">
                        Browse available pharmaceutical products and medication information
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

                    <div className="text-sm text-gray-500 flex items-center">
                        Showing {filteredDrugs.length} of {drugs.length} drugs
                    </div>
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
                                <button
                                    onClick={() => handleViewDetails(drug)}
                                    className="text-blue-600 hover:text-blue-900 p-1 rounded-lg hover:bg-blue-50 transition-colors"
                                    title="View Details"
                                >
                                    <Eye className="w-4 h-4" />
                                </button>
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

            {/* Empty State */}
            {filteredDrugs.length === 0 && !loading && (
                <div className="text-center py-12">
                    <Pill className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No drugs found</h3>
                    <p className="text-gray-500">Try adjusting your search or filter criteria</p>
                </div>
            )}

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

            {/* Drug Details Modal */}
            {showDetailsModal && selectedDrug && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900">Drug Information</h3>
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
                                            <span className="text-sm font-medium text-gray-600">Added:</span>
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
                                <p>Added to catalog: {formatDate(selectedDrug.created_at)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DrugCatalog;