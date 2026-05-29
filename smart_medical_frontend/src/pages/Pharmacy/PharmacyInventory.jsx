import React, { useState, useEffect } from 'react';
import {
    Package, Search, Plus, Eye, Edit, Trash2, RefreshCw, Download,
    Save, X, Loader2, AlertCircle, AlertTriangle, DollarSign,
    Calendar, TrendingDown, TrendingUp, Pill, Building2, Filter, XCircle
} from 'lucide-react';
import { toast } from 'react-toastify';
import { inventoryService, drugService, getCurrentUser } from '../../api';

const PharmacyInventory = () => {
    const [inventory, setInventory] = useState([]);
    const [drugs, setDrugs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [loadingDrugs, setLoadingDrugs] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [stockFilter, setStockFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(12);

    const [createFormData, setCreateFormData] = useState({
        drug: '',
        quantity_available: '',
        price_per_unit: '',
        expiry_date: '',
        low_stock_threshold: '10'
    });

    const [editFormData, setEditFormData] = useState({
        drug: '',
        quantity_available: '',
        price_per_unit: '',
        expiry_date: '',
        low_stock_threshold: '10'
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

    useEffect(() => {
        initializePage();
    }, []);

    const initializePage = async () => {
        try {
            const user = getCurrentUser();
            if (!user) {
                toast.error('Please log in to access inventory management');
                return;
            }
            await Promise.all([fetchInventory(), fetchDrugs()]);
        } catch (error) {
            console.error('Error initializing page:', error);
            toast.error('Failed to load page data');
        } finally {
            setLoading(false);
        }
    };

    const fetchInventory = async () => {
        try {
            const response = await inventoryService.getAll();
            if (response.success) {
                setInventory(response.data.results || response.data || []);
            } else {
                toast.error('Failed to fetch inventory');
            }
        } catch (error) {
            console.error('Error fetching inventory:', error);
            toast.error('Failed to fetch inventory');
        }
    };

    const fetchDrugs = async () => {
        setLoadingDrugs(true);
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
        } finally {
            setLoadingDrugs(false);
        }
    };

    const resetCreateForm = () => {
        setCreateFormData({ drug: '', quantity_available: '', price_per_unit: '', expiry_date: '', low_stock_threshold: '10' });
        setCreateErrors({});
    };

    const resetEditForm = () => {
        setEditFormData({ drug: '', quantity_available: '', price_per_unit: '', expiry_date: '', low_stock_threshold: '10' });
        setEditErrors({});
    };

    const validateCreateForm = () => {
        const newErrors = {};
        if (!createFormData.drug) newErrors.drug = 'Drug selection is required';
        if (!createFormData.quantity_available || createFormData.quantity_available <= 0)
            newErrors.quantity_available = 'Quantity must be greater than 0';
        if (!createFormData.price_per_unit || createFormData.price_per_unit <= 0)
            newErrors.price_per_unit = 'Price must be greater than 0';
        if (!createFormData.expiry_date) newErrors.expiry_date = 'Expiry date is required';
        if (!createFormData.low_stock_threshold || createFormData.low_stock_threshold < 0)
            newErrors.low_stock_threshold = 'Low stock threshold must be 0 or greater';
        const today = new Date();
        const expiryDate = new Date(createFormData.expiry_date);
        if (expiryDate <= today) newErrors.expiry_date = 'Expiry date must be in the future';
        setCreateErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateEditForm = () => {
        const newErrors = {};
        if (!editFormData.drug) newErrors.drug = 'Drug selection is required';
        if (!editFormData.quantity_available || editFormData.quantity_available < 0)
            newErrors.quantity_available = 'Quantity cannot be negative';
        if (!editFormData.price_per_unit || editFormData.price_per_unit <= 0)
            newErrors.price_per_unit = 'Price must be greater than 0';
        if (!editFormData.expiry_date) newErrors.expiry_date = 'Expiry date is required';
        if (!editFormData.low_stock_threshold || editFormData.low_stock_threshold < 0)
            newErrors.low_stock_threshold = 'Low stock threshold must be 0 or greater';
        setEditErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleCreateItem = async (e) => {
        e.preventDefault();
        if (!validateCreateForm()) return;
        setSubmitting(true);
        try {
            const itemData = {
                drug_id: createFormData.drug,
                quantity_available: parseInt(createFormData.quantity_available),
                price_per_unit: parseFloat(createFormData.price_per_unit),
                expiry_date: createFormData.expiry_date,
                low_stock_threshold: parseInt(createFormData.low_stock_threshold)
            };
            const response = await inventoryService.create(itemData);
            if (response.success) {
                toast.success('Inventory item added successfully');
                setShowCreateModal(false);
                resetCreateForm();
                fetchInventory();
            } else {
                toast.error(response.error || 'Failed to add inventory item');
            }
        } catch (error) {
            console.error('Error creating inventory item:', error);
            toast.error('Failed to add inventory item');
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateItem = async (e) => {
        e.preventDefault();
        if (!validateEditForm()) return;
        setSubmitting(true);
        try {
            const itemData = {
                drug_id: editFormData.drug,
                quantity_available: parseInt(editFormData.quantity_available),
                price_per_unit: parseFloat(editFormData.price_per_unit),
                expiry_date: editFormData.expiry_date,
                low_stock_threshold: parseInt(editFormData.low_stock_threshold)
            };
            const response = await inventoryService.update(selectedItem.id, itemData);
            if (response.success) {
                toast.success('Inventory item updated successfully');
                setShowEditModal(false);
                resetEditForm();
                fetchInventory();
            } else {
                toast.error(response.error || 'Failed to update inventory item');
            }
        } catch (error) {
            console.error('Error updating inventory item:', error);
            toast.error('Failed to update inventory item');
        } finally {
            setSubmitting(false);
        }
    };

    // ── Delete handlers ──────────────────────────────────────────────────────
    const handleDeleteClick = (item) => {
        setItemToDelete(item);
        setShowDeleteModal(true);
    };

    const handleDeleteCancel = () => {
        setItemToDelete(null);
        setShowDeleteModal(false);
    };

    const handleDeleteConfirm = async () => {
        if (!itemToDelete) return;
        setDeleting(true);
        try {
            const response = await inventoryService.delete(itemToDelete.id);
            if (response.success || response.status === 204) {
                toast.success(`"${itemToDelete.drug?.name}" removed from inventory`);
                setInventory(prev => prev.filter(i => i.id !== itemToDelete.id));
                setShowDeleteModal(false);
                setItemToDelete(null);
                if (showDetailsModal && selectedItem?.id === itemToDelete.id) {
                    setShowDetailsModal(false);
                    setSelectedItem(null);
                }
            } else {
                toast.error('Failed to delete inventory item');
            }
        } catch (error) {
            console.error('Error deleting inventory item:', error);
            toast.error('Failed to delete inventory item');
        } finally {
            setDeleting(false);
        }
    };
    // ─────────────────────────────────────────────────────────────────────────

    const handleViewDetails = (item) => {
        setSelectedItem(item);
        setShowDetailsModal(true);
    };

    const handleEditItem = (item) => {
        setSelectedItem(item);
        setEditFormData({
            drug: item.drug?.id || '',
            quantity_available: item.quantity_available.toString(),
            price_per_unit: item.price_per_unit.toString(),
            expiry_date: item.expiry_date,
            low_stock_threshold: item.low_stock_threshold.toString()
        });
        setShowEditModal(true);
    };

    const handleCreateInputChange = (e) => {
        const { name, value } = e.target;
        setCreateFormData(prev => ({ ...prev, [name]: value }));
        if (createErrors[name]) setCreateErrors(prev => ({ ...prev, [name]: '' }));
    };

    const handleEditInputChange = (e) => {
        const { name, value } = e.target;
        setEditFormData(prev => ({ ...prev, [name]: value }));
        if (editErrors[name]) setEditErrors(prev => ({ ...prev, [name]: '' }));
    };

    const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric'
    });

    const formatCurrency = (amount) => new Intl.NumberFormat('en-RW', {
        style: 'currency', currency: 'RWF', currencyDisplay: 'code'
    }).format(amount);

    const isLowStock = (item) => item.quantity_available <= item.low_stock_threshold;

    const isExpiringSoon = (item) => {
        const today = new Date();
        const expiryDate = new Date(item.expiry_date);
        const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
        return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
    };

    const isExpired = (item) => new Date(item.expiry_date) <= new Date();

    const getStockStatus = (item) => {
        if (isExpired(item)) return { label: 'Expired', color: 'red', icon: XCircle };
        if (isExpiringSoon(item)) return { label: 'Expiring Soon', color: 'yellow', icon: AlertTriangle };
        if (isLowStock(item)) return { label: 'Low Stock', color: 'orange', icon: TrendingDown };
        return { label: 'In Stock', color: 'green', icon: Package };
    };

    const filteredInventory = inventory.filter(item => {
        const matchesSearch =
            item.drug?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.drug?.generic_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.drug?.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = categoryFilter === 'all' || item.drug?.category === categoryFilter;
        let matchesStock = true;
        if (stockFilter === 'low_stock') matchesStock = isLowStock(item);
        else if (stockFilter === 'expiring') matchesStock = isExpiringSoon(item);
        else if (stockFilter === 'expired') matchesStock = isExpired(item);
        return matchesSearch && matchesCategory && matchesStock;
    });

    const totalPages = Math.ceil(filteredInventory.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedInventory = filteredInventory.slice(startIndex, startIndex + itemsPerPage);

    const getStats = () => {
        const totalItems = inventory.length;
        const lowStockItems = inventory.filter(isLowStock).length;
        const expiringItems = inventory.filter(isExpiringSoon).length;
        const expiredItems = inventory.filter(isExpired).length;
        const totalValue = inventory.reduce((sum, item) =>
            sum + (item.quantity_available * parseFloat(item.price_per_unit)), 0);
        return { totalItems, lowStockItems, expiringItems, expiredItems, totalValue };
    };

    const stats = getStats();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="flex flex-col items-center space-y-4">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    <p className="text-gray-600">Loading inventory...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Pharmacy Inventory</h1>
                    <p className="text-sm text-gray-600 mt-1">Manage your pharmacy's drug inventory and stock levels</p>
                </div>
                <div className="flex items-center space-x-3 mt-4 sm:mt-0">
                    <button onClick={fetchInventory}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors">
                        <RefreshCw className="w-4 h-4 mr-2" /> Refresh
                    </button>
                    <button onClick={() => { resetCreateForm(); setShowCreateModal(true); }}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        <Plus className="w-4 h-4 mr-2" /> Add Item
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: 'Total Items', value: stats.totalItems, icon: Package, color: 'blue' },
                    { label: 'Low Stock', value: stats.lowStockItems, icon: TrendingDown, color: 'orange' },
                    { label: 'Expiring Soon', value: stats.expiringItems, icon: AlertTriangle, color: 'yellow' },
                    { label: 'Expired', value: stats.expiredItems, icon: XCircle, color: 'red' },
                ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                        <div className="flex items-center">
                            <div className={`p-3 rounded-lg bg-${color}-100`}>
                                <Icon className={`w-6 h-6 text-${color}-600`} />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">{label}</p>
                                <p className="text-2xl font-bold text-gray-900">{value}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input type="text" placeholder="Search inventory..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                    <select className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                        <option value="all">All Categories</option>
                        {drugCategories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                    <select className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={stockFilter} onChange={(e) => setStockFilter(e.target.value)}>
                        <option value="all">All Stock Levels</option>
                        <option value="low_stock">Low Stock</option>
                        <option value="expiring">Expiring Soon</option>
                        <option value="expired">Expired</option>
                    </select>
                    <button className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors">
                        <Download className="w-4 h-4 mr-2" /> Export
                    </button>
                </div>
            </div>

            {/* Inventory Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {paginatedInventory.length > 0 ? (
                    paginatedInventory.map((item) => {
                        const status = getStockStatus(item);
                        return (
                            <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                                <div className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                                            <Pill className="w-6 h-6 text-white" />
                                        </div>
                                        <div className="flex space-x-1">
                                            <button onClick={() => handleViewDetails(item)}
                                                className="text-blue-600 hover:text-blue-900 p-1 rounded-lg hover:bg-blue-50 transition-colors" title="View Details">
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleEditItem(item)}
                                                className="text-green-600 hover:text-green-900 p-1 rounded-lg hover:bg-green-50 transition-colors" title="Edit Item">
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleDeleteClick(item)}
                                                className="text-red-500 hover:text-red-700 p-1 rounded-lg hover:bg-red-50 transition-colors" title="Delete Item">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div>
                                            <h3 className="font-semibold text-gray-900 truncate" title={item.drug?.name}>{item.drug?.name}</h3>
                                            <p className="text-sm text-gray-500 truncate" title={item.drug?.generic_name}>{item.drug?.generic_name}</p>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-${status.color}-100 text-${status.color}-800`}>
                                                <status.icon className="w-3 h-3 mr-1" /> {status.label}
                                            </span>
                                            <span className="text-lg font-bold text-gray-900">{formatCurrency(item.price_per_unit)}</span>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600">Stock:</span>
                                                <span className={`font-medium ${isLowStock(item) ? 'text-red-600' : 'text-gray-900'}`}>
                                                    {item.quantity_available} units
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600">Threshold:</span>
                                                <span className="text-gray-900">{item.low_stock_threshold}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600">Expires:</span>
                                                <span className={`${isExpiringSoon(item) || isExpired(item) ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                                                    {formatDate(item.expiry_date)}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="pt-2 border-t border-gray-100">
                                            <div className="flex justify-between text-xs text-gray-400">
                                                <span>Value: {formatCurrency(item.quantity_available * parseFloat(item.price_per_unit))}</span>
                                                <span>Updated: {formatDate(item.last_updated)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
            </div>
                        );
                    })
                ) : (
                    <div className="col-span-full text-center py-12">
                        <Pill className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No inventory items found</h3>
                        <p className="text-gray-500">Try adjusting your search or filter criteria</p>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center text-sm text-gray-700">
                            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredInventory.length)} of {filteredInventory.length} items
                        </div>
                        <div className="flex items-center space-x-2">
                            <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}
                                className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                                Previous
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                <button key={page} onClick={() => setCurrentPage(page)}
                                    className={`px-3 py-1 border rounded-md text-sm font-medium ${currentPage === page ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'}`}>
                                    {page}
                                </button>
                            ))}
                            <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}
                                className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Delete Confirmation Modal ─────────────────────────────────────── */}
            {showDeleteModal && itemToDelete && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl max-w-md w-full shadow-xl">
                        <div className="p-6">
                            <div className="flex items-center space-x-4 mb-4">
                                <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                                    <AlertTriangle className="w-6 h-6 text-red-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Remove Inventory Item</h3>
                                    <p className="text-sm text-gray-500">This action cannot be undone</p>
                                </div>
                            </div>

                            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                                <p className="text-sm text-gray-700">
                                    You are about to permanently remove{' '}
                                    <span className="font-semibold text-gray-900">"{itemToDelete.drug?.name}"</span>
                                    {' '}from your inventory. Current stock of{' '}
                                    <span className="font-semibold">{itemToDelete.quantity_available} units</span>
                                    {' '}will be lost.
                                </p>
                            </div>

                            <div className="flex justify-end space-x-3">
                                <button onClick={handleDeleteCancel} disabled={deleting}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors">
                                    Cancel
                                </button>
                                <button onClick={handleDeleteConfirm} disabled={deleting}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center">
                                    {deleting ? (
                                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Removing...</>
                                    ) : (
                                        <><Trash2 className="w-4 h-4 mr-2" /> Remove Item</>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Create Inventory Item Modal ───────────────────────────────────── */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900">Add Inventory Item</h3>
                                <button onClick={() => { setShowCreateModal(false); resetCreateForm(); }} className="text-gray-400 hover:text-gray-600">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>
                        <div className="p-6">
                            <form onSubmit={handleCreateItem} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Drug *</label>
                                        <select name="drug" value={createFormData.drug} onChange={handleCreateInputChange} disabled={loadingDrugs}
                                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${createErrors.drug ? 'border-red-300' : 'border-gray-300'} ${loadingDrugs ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                            <option value="">{loadingDrugs ? 'Loading drugs...' : 'Select Drug'}</option>
                                            {drugs.map(drug => (
                                                <option key={drug.id} value={drug.id}>{drug.name} ({drug.generic_name})</option>
                                            ))}
                                        </select>
                                        {createErrors.drug && <p className="text-red-500 text-sm mt-1">{createErrors.drug}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Quantity Available *</label>
                                        <input type="number" name="quantity_available" value={createFormData.quantity_available}
                                            onChange={handleCreateInputChange} min="0"
                                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${createErrors.quantity_available ? 'border-red-300' : 'border-gray-300'}`}
                                            placeholder="Enter quantity" />
                                        {createErrors.quantity_available && <p className="text-red-500 text-sm mt-1">{createErrors.quantity_available}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Price per Unit *</label>
                                        <input type="number" name="price_per_unit" value={createFormData.price_per_unit}
                                            onChange={handleCreateInputChange} min="0" step="0.01"
                                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${createErrors.price_per_unit ? 'border-red-300' : 'border-gray-300'}`}
                                            placeholder="0.00" />
                                        {createErrors.price_per_unit && <p className="text-red-500 text-sm mt-1">{createErrors.price_per_unit}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date *</label>
                                        <input type="date" name="expiry_date" value={createFormData.expiry_date}
                                            onChange={handleCreateInputChange} min={new Date().toISOString().split('T')[0]}
                                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${createErrors.expiry_date ? 'border-red-300' : 'border-gray-300'}`} />
                                        {createErrors.expiry_date && <p className="text-red-500 text-sm mt-1">{createErrors.expiry_date}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Low Stock Threshold *</label>
                                        <input type="number" name="low_stock_threshold" value={createFormData.low_stock_threshold}
                                            onChange={handleCreateInputChange} min="0"
                                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${createErrors.low_stock_threshold ? 'border-red-300' : 'border-gray-300'}`}
                                            placeholder="10" />
                                        {createErrors.low_stock_threshold && <p className="text-red-500 text-sm mt-1">{createErrors.low_stock_threshold}</p>}
                                    </div>
                                </div>
                                <div className="flex justify-end space-x-3 pt-4">
                                    <button type="button" onClick={() => { setShowCreateModal(false); resetCreateForm(); }}
                                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
                                    <button type="submit" disabled={submitting}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center">
                                        {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Adding...</> : <><Save className="w-4 h-4 mr-2" />Add Item</>}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Edit Inventory Item Modal ─────────────────────────────────────── */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900">Edit Inventory Item</h3>
                                <button onClick={() => { setShowEditModal(false); resetEditForm(); }} className="text-gray-400 hover:text-gray-600">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>
                        <div className="p-6">
                            <form onSubmit={handleUpdateItem} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Drug *</label>
                                        <select name="drug" value={editFormData.drug} onChange={handleEditInputChange} disabled={loadingDrugs}
                                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${editErrors.drug ? 'border-red-300' : 'border-gray-300'} ${loadingDrugs ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                            <option value="">{loadingDrugs ? 'Loading drugs...' : 'Select Drug'}</option>
                                            {drugs.map(drug => (
                                                <option key={drug.id} value={drug.id}>{drug.name} ({drug.generic_name})</option>
                                            ))}
                                        </select>
                                        {editErrors.drug && <p className="text-red-500 text-sm mt-1">{editErrors.drug}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Quantity Available *</label>
                                        <input type="number" name="quantity_available" value={editFormData.quantity_available}
                                            onChange={handleEditInputChange} min="0"
                                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${editErrors.quantity_available ? 'border-red-300' : 'border-gray-300'}`}
                                            placeholder="Enter quantity" />
                                        {editErrors.quantity_available && <p className="text-red-500 text-sm mt-1">{editErrors.quantity_available}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Price per Unit *</label>
                                        <input type="number" name="price_per_unit" value={editFormData.price_per_unit}
                                            onChange={handleEditInputChange} min="0" step="0.01"
                                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${editErrors.price_per_unit ? 'border-red-300' : 'border-gray-300'}`}
                                            placeholder="0.00" />
                                        {editErrors.price_per_unit && <p className="text-red-500 text-sm mt-1">{editErrors.price_per_unit}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date *</label>
                                        <input type="date" name="expiry_date" value={editFormData.expiry_date}
                                            onChange={handleEditInputChange}
                                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${editErrors.expiry_date ? 'border-red-300' : 'border-gray-300'}`} />
                                        {editErrors.expiry_date && <p className="text-red-500 text-sm mt-1">{editErrors.expiry_date}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Low Stock Threshold *</label>
                                        <input type="number" name="low_stock_threshold" value={editFormData.low_stock_threshold}
                                            onChange={handleEditInputChange} min="0"
                                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${editErrors.low_stock_threshold ? 'border-red-300' : 'border-gray-300'}`}
                                            placeholder="10" />
                                        {editErrors.low_stock_threshold && <p className="text-red-500 text-sm mt-1">{editErrors.low_stock_threshold}</p>}
                                    </div>
                                </div>
                                <div className="flex justify-end space-x-3 pt-4">
                                    <button type="button" onClick={() => { setShowEditModal(false); resetEditForm(); }}
                                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
                                    <button type="submit" disabled={submitting}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center">
                                        {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Updating...</> : <><Save className="w-4 h-4 mr-2" />Update Item</>}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Item Details Modal ────────────────────────────────────────────── */}
            {showDetailsModal && selectedItem && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900">Inventory Item Details</h3>
                                <button onClick={() => setShowDetailsModal(false)} className="text-gray-400 hover:text-gray-600">
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
                                    <h4 className="text-xl font-bold text-gray-900">{selectedItem.drug?.name}</h4>
                                    <p className="text-sm text-gray-500">{selectedItem.drug?.generic_name}</p>
                                    <div className="flex items-center space-x-2 mt-2">
                                        {(() => {
                                            const status = getStockStatus(selectedItem);
                                            return (
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-${status.color}-100 text-${status.color}-800`}>
                                                    <status.icon className="w-3 h-3 mr-1" /> {status.label}
                                                </span>
                                            );
                                        })()}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <h5 className="font-medium text-gray-900">Stock Information</h5>
                                    <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                                        {[
                                            ['Available Quantity', `${selectedItem.quantity_available} units`],
                                            ['Price per Unit', formatCurrency(selectedItem.price_per_unit)],
                                            ['Total Value', formatCurrency(selectedItem.quantity_available * parseFloat(selectedItem.price_per_unit))],
                                            ['Low Stock Threshold', selectedItem.low_stock_threshold],
                                        ].map(([label, value]) => (
                                            <div key={label} className="flex justify-between">
                                                <span className="text-sm font-medium text-gray-600">{label}:</span>
                                                <span className="text-sm text-gray-900">{value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h5 className="font-medium text-gray-900">Drug Information</h5>
                                    <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                                        {[
                                            ['Category', drugCategories.find(c => c.value === selectedItem.drug?.category)?.label || selectedItem.drug?.category],
                                            ['Dosage Form', selectedItem.drug?.dosage_form],
                                            ['Manufacturer', selectedItem.drug?.manufacturer],
                                            ['Prescription Required', selectedItem.drug?.requires_prescription ? 'Yes' : 'No'],
                                        ].map(([label, value]) => (
                                            <div key={label} className="flex justify-between">
                                                <span className="text-sm font-medium text-gray-600">{label}:</span>
                                                <span className="text-sm text-gray-900">{value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <h5 className="font-medium text-gray-900">Dates</h5>
                                    <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                                        <div className="flex items-center text-sm">
                                            <Calendar className="w-4 h-4 text-blue-600 mr-3" />
                                            <div>
                                                <span className="font-medium text-gray-600">Expiry Date: </span>
                                                <span className={`${isExpiringSoon(selectedItem) || isExpired(selectedItem) ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                                                    {formatDate(selectedItem.expiry_date)}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center text-sm">
                                            <AlertCircle className="w-4 h-4 text-blue-600 mr-3" />
                                            <div>
                                                <span className="font-medium text-gray-600">Last Updated: </span>
                                                <span className="text-gray-900">{formatDate(selectedItem.last_updated)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h5 className="font-medium text-gray-900">Alerts</h5>
                                    <div className="space-y-2">
                                        {isExpired(selectedItem) && (
                                            <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                                                <div className="flex items-center"><XCircle className="w-4 h-4 text-red-600 mr-2" /><span className="text-sm font-medium text-red-800">Product Expired</span></div>
                                                <p className="text-xs text-red-600 mt-1">This item has passed its expiry date and should be removed from inventory.</p>
                                            </div>
                                        )}
                                        {isExpiringSoon(selectedItem) && !isExpired(selectedItem) && (
                                            <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                                                <div className="flex items-center"><AlertTriangle className="w-4 h-4 text-yellow-600 mr-2" /><span className="text-sm font-medium text-yellow-800">Expiring Soon</span></div>
                                                <p className="text-xs text-yellow-600 mt-1">This item will expire within 30 days.</p>
                                            </div>
                                        )}
                                        {isLowStock(selectedItem) && (
                                            <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                                                <div className="flex items-center"><TrendingDown className="w-4 h-4 text-orange-600 mr-2" /><span className="text-sm font-medium text-orange-800">Low Stock</span></div>
                                                <p className="text-xs text-orange-600 mt-1">Stock level is below threshold. Consider reordering.</p>
                                            </div>
                                        )}
                                        {!isLowStock(selectedItem) && !isExpiringSoon(selectedItem) && !isExpired(selectedItem) && (
                                            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                                                <div className="flex items-center"><Package className="w-4 h-4 text-green-600 mr-2" /><span className="text-sm font-medium text-green-800">Stock OK</span></div>
                                                <p className="text-xs text-green-600 mt-1">Item is in good condition and adequately stocked.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {selectedItem.drug?.description && (
                                <div>
                                    <h5 className="font-medium text-gray-900 mb-2">Drug Description</h5>
                                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{selectedItem.drug.description}</p>
                                </div>
                            )}

                            <div className="text-xs text-gray-500 pt-4 border-t border-gray-200">
                                <p>Item ID: {selectedItem.id}</p>
                                <p>Drug ID: {selectedItem.drug?.id}</p>
                            </div>

                            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                                <button
                                    onClick={() => { setShowDetailsModal(false); handleDeleteClick(selectedItem); }}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center">
                                    <Trash2 className="w-4 h-4 mr-2" /> Remove Item
                                </button>
                                <button
                                    onClick={() => { setShowDetailsModal(false); handleEditItem(selectedItem); }}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center">
                                    <Edit className="w-4 h-4 mr-2" /> Edit Item
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PharmacyInventory;