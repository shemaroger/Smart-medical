import React, { useState, useEffect } from 'react';
import {
    Building2, Search, Plus, Eye, Edit, Trash2, Phone, Mail, MapPin,
    Calendar, CheckCircle, XCircle, RefreshCw, Download, Save, X,
    AlertCircle, Users, Activity
} from 'lucide-react';
import { hospitalService } from '../../api';

const HospitalManagement = () => {
    const [hospitals, setHospitals] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [hospitalsPerPage] = useState(10);
    const [selectedHospital, setSelectedHospital] = useState(null);
    const [showHospitalModal, setShowHospitalModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [loading, setLoading] = useState(false);

    // Separate form data for create modal
    const [createFormData, setCreateFormData] = useState({
        name: '',
        address: '',
        phone: '',
        email: '',
        location: '',
        is_active: true
    });

    // Separate form data for edit modal
    const [editFormData, setEditFormData] = useState({
        name: '',
        address: '',
        phone: '',
        email: '',
        location: '',
        is_active: true
    });

    const [createErrors, setCreateErrors] = useState({});
    const [editErrors, setEditErrors] = useState({});

    useEffect(() => {
        fetchHospitals();
    }, []);

    const fetchHospitals = async () => {
        setLoading(true);
        try {
            const response = await hospitalService.getAll();
            if (response.success) {
                setHospitals(response.data.results || response.data);
            } else {
                showToast('Failed to fetch hospitals', 'error');
            }
        } catch (error) {
            console.error('Error fetching hospitals:', error);
            showToast('Failed to fetch hospitals', 'error');
        } finally {
            setLoading(false);
        }
    };

    const showToast = (message, type = 'info') => {
        const toast = document.createElement('div');
        toast.className = `fixed top-4 right-4 p-4 rounded-lg text-white z-50 ${type === 'success' ? 'bg-green-500' :
            type === 'error' ? 'bg-red-500' : 'bg-blue-500'
            }`;
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => document.body.removeChild(toast), 3000);
    };

    const filteredHospitals = hospitals.filter(hospital => {
        const matchesSearch =
            hospital.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            hospital.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
            hospital.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            hospital.phone.includes(searchTerm);

        const matchesStatus =
            selectedStatus === 'all' ||
            (selectedStatus === 'active' && hospital.is_active) ||
            (selectedStatus === 'inactive' && !hospital.is_active);

        return matchesSearch && matchesStatus;
    });

    const totalPages = Math.ceil(filteredHospitals.length / hospitalsPerPage);
    const startIndex = (currentPage - 1) * hospitalsPerPage;
    const paginatedHospitals = filteredHospitals.slice(startIndex, startIndex + hospitalsPerPage);

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const resetCreateForm = () => {
        setCreateFormData({
            name: '',
            address: '',
            phone: '',
            email: '',
            location: '',
            is_active: true
        });
        setCreateErrors({});
    };

    const resetEditForm = () => {
        setEditFormData({
            name: '',
            address: '',
            phone: '',
            email: '',
            location: '',
            is_active: true
        });
        setEditErrors({});
    };

    const validateCreateForm = () => {
        const newErrors = {};

        if (!createFormData.name.trim()) newErrors.name = 'Hospital name is required';
        if (!createFormData.address.trim()) newErrors.address = 'Address is required';
        if (!createFormData.phone.trim()) newErrors.phone = 'Phone number is required';
        if (!createFormData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(createFormData.email)) {
            newErrors.email = 'Email is invalid';
        }
        if (!createFormData.location.trim()) newErrors.location = 'Location is required';

        setCreateErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateEditForm = () => {
        const newErrors = {};

        if (!editFormData.name.trim()) newErrors.name = 'Hospital name is required';
        if (!editFormData.address.trim()) newErrors.address = 'Address is required';
        if (!editFormData.phone.trim()) newErrors.phone = 'Phone number is required';
        if (!editFormData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(editFormData.email)) {
            newErrors.email = 'Email is invalid';
        }
        if (!editFormData.location.trim()) newErrors.location = 'Location is required';

        setEditErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleCreateHospital = async (e) => {
        e.preventDefault();
        if (!validateCreateForm()) return;
        setLoading(true);
        try {
            const response = await hospitalService.create(createFormData);
            if (response.success) {
                showToast('Hospital created successfully', 'success');
                setShowCreateModal(false);
                resetCreateForm();
                fetchHospitals();
            } else {
                showToast('Failed to create hospital', 'error');
            }
        } catch (error) {
            console.error('Error creating hospital:', error);
            showToast('Failed to create hospital', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateHospital = async (e) => {
        e.preventDefault();
        if (!validateEditForm()) return;
        setLoading(true);
        try {
            const response = await hospitalService.update(selectedHospital.id, editFormData);
            if (response.success) {
                showToast('Hospital updated successfully', 'success');
                setShowEditModal(false);
                resetEditForm();
                fetchHospitals();
            } else {
                showToast('Failed to update hospital', 'error');
            }
        } catch (error) {
            console.error('Error updating hospital:', error);
            showToast('Failed to update hospital', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleViewHospital = (hospital) => {
        setSelectedHospital(hospital);
        setShowHospitalModal(true);
    };

    const handleEditHospital = (hospital) => {
        setSelectedHospital(hospital);
        setEditFormData({
            name: hospital.name,
            address: hospital.address,
            phone: hospital.phone,
            email: hospital.email,
            location: hospital.location,
            is_active: hospital.is_active
        });
        setShowEditModal(true);
    };

    const handleCreateClick = () => {
        resetCreateForm();
        setShowCreateModal(true);
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

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Hospital Management</h1>
                    <p className="text-sm text-gray-600 mt-1">
                        Manage hospitals and their information
                    </p>
                </div>
                <div className="flex items-center space-x-3 mt-4 sm:mt-0">
                    <button
                        onClick={fetchHospitals}
                        disabled={loading}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                    <button
                        onClick={handleCreateClick}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Hospital
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Total Hospitals', value: hospitals.length, icon: Building2, color: 'blue' },
                    { label: 'Active Hospitals', value: hospitals.filter(h => h.is_active).length, icon: CheckCircle, color: 'green' },
                    { label: 'Inactive Hospitals', value: hospitals.filter(h => !h.is_active).length, icon: XCircle, color: 'red' },
                    { label: 'This Month', value: hospitals.filter(h => new Date(h.created_at).getMonth() === new Date().getMonth()).length, icon: Calendar, color: 'purple' }
                ].map((stat, index) => (
                    <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                        <div className="flex items-center">
                            <div className={`p-3 rounded-lg bg-${stat.color}-100`}>
                                <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search hospitals..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                    >
                        <option value="all">All Statuses</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                    <button className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors">
                        <Download className="w-4 h-4 mr-2" />
                        Export
                    </button>
                </div>
            </div>

            {/* Hospitals Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hospital</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {paginatedHospitals.map((hospital) => (
                                <tr key={hospital.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                                                <Building2 className="w-5 h-5 text-white" />
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {hospital.name}
                                                </div>

                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        <div className="space-y-1">
                                            <div className="flex items-center">
                                                <Mail className="w-4 h-4 text-gray-400 mr-2" />
                                                {hospital.email}
                                            </div>
                                            <div className="flex items-center">
                                                <Phone className="w-4 h-4 text-gray-400 mr-2" />
                                                {hospital.phone}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        <div className="flex items-center">
                                            <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                                            <span className="max-w-xs truncate">{hospital.location}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${hospital.is_active
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                            }`}>
                                            {hospital.is_active ? (
                                                <>
                                                    <CheckCircle className="w-3 h-3 mr-1" />
                                                    Active
                                                </>
                                            ) : (
                                                <>
                                                    <XCircle className="w-3 h-3 mr-1" />
                                                    Inactive
                                                </>
                                            )}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        <div className="flex items-center">
                                            <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                                            {formatDate(hospital.created_at)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex items-center justify-end space-x-2">
                                            <button
                                                onClick={() => handleViewHospital(hospital)}
                                                className="text-blue-600 hover:text-blue-900 p-1 rounded-lg hover:bg-blue-50 transition-colors"
                                                title="View Details"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleEditHospital(hospital)}
                                                className="text-green-600 hover:text-green-900 p-1 rounded-lg hover:bg-green-50 transition-colors"
                                                title="Edit Hospital"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="bg-white px-6 py-3 flex items-center justify-between border-t border-gray-200">
                        <div className="flex items-center text-sm text-gray-700">
                            Showing {startIndex + 1} to {Math.min(startIndex + hospitalsPerPage, filteredHospitals.length)} of {filteredHospitals.length} hospitals
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

            {/* Create Hospital Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900">Add New Hospital</h3>
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
                            <form onSubmit={handleCreateHospital} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Hospital Name *
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={createFormData.name}
                                            onChange={handleCreateInputChange}
                                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${createErrors.name ? 'border-red-300' : 'border-gray-300'}`}
                                            placeholder="Enter hospital name"
                                        />
                                        {createErrors.name && <p className="text-red-500 text-sm mt-1">{createErrors.name}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Location *
                                        </label>
                                        <input
                                            type="text"
                                            name="location"
                                            value={createFormData.location}
                                            onChange={handleCreateInputChange}
                                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${createErrors.location ? 'border-red-300' : 'border-gray-300'}`}
                                            placeholder="Enter location"
                                        />
                                        {createErrors.location && <p className="text-red-500 text-sm mt-1">{createErrors.location}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Phone Number *
                                        </label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={createFormData.phone}
                                            onChange={handleCreateInputChange}
                                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${createErrors.phone ? 'border-red-300' : 'border-gray-300'}`}
                                            placeholder="Enter phone number"
                                        />
                                        {createErrors.phone && <p className="text-red-500 text-sm mt-1">{createErrors.phone}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Email Address *
                                        </label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={createFormData.email}
                                            onChange={handleCreateInputChange}
                                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${createErrors.email ? 'border-red-300' : 'border-gray-300'}`}
                                            placeholder="Enter email address"
                                        />
                                        {createErrors.email && <p className="text-red-500 text-sm mt-1">{createErrors.email}</p>}
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Address *
                                        </label>
                                        <textarea
                                            name="address"
                                            value={createFormData.address}
                                            onChange={handleCreateInputChange}
                                            rows={3}
                                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${createErrors.address ? 'border-red-300' : 'border-gray-300'}`}
                                            placeholder="Enter full address"
                                        />
                                        {createErrors.address && <p className="text-red-500 text-sm mt-1">{createErrors.address}</p>}
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="flex items-center">
                                            <input
                                                type="checkbox"
                                                name="is_active"
                                                checked={createFormData.is_active}
                                                onChange={handleCreateInputChange}
                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <span className="ml-2 text-sm text-gray-700">Active Hospital</span>
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
                                        disabled={loading}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
                                    >
                                        {loading ? (
                                            <>
                                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="w-4 h-4 mr-2" />
                                                Create Hospital
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Hospital Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900">Edit Hospital</h3>
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
                            <form onSubmit={handleUpdateHospital} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Hospital Name *
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={editFormData.name}
                                            onChange={handleEditInputChange}
                                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${editErrors.name ? 'border-red-300' : 'border-gray-300'}`}
                                            placeholder="Enter hospital name"
                                        />
                                        {editErrors.name && <p className="text-red-500 text-sm mt-1">{editErrors.name}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Location *
                                        </label>
                                        <input
                                            type="text"
                                            name="location"
                                            value={editFormData.location}
                                            onChange={handleEditInputChange}
                                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${editErrors.location ? 'border-red-300' : 'border-gray-300'}`}
                                            placeholder="Enter location"
                                        />
                                        {editErrors.location && <p className="text-red-500 text-sm mt-1">{editErrors.location}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Phone Number *
                                        </label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={editFormData.phone}
                                            onChange={handleEditInputChange}
                                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${editErrors.phone ? 'border-red-300' : 'border-gray-300'}`}
                                            placeholder="Enter phone number"
                                        />
                                        {editErrors.phone && <p className="text-red-500 text-sm mt-1">{editErrors.phone}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Email Address *
                                        </label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={editFormData.email}
                                            onChange={handleEditInputChange}
                                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${editErrors.email ? 'border-red-300' : 'border-gray-300'}`}
                                            placeholder="Enter email address"
                                        />
                                        {editErrors.email && <p className="text-red-500 text-sm mt-1">{editErrors.email}</p>}
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Address *
                                        </label>
                                        <textarea
                                            name="address"
                                            value={editFormData.address}
                                            onChange={handleEditInputChange}
                                            rows={3}
                                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${editErrors.address ? 'border-red-300' : 'border-gray-300'}`}
                                            placeholder="Enter full address"
                                        />
                                        {editErrors.address && <p className="text-red-500 text-sm mt-1">{editErrors.address}</p>}
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="flex items-center">
                                            <input
                                                type="checkbox"
                                                name="is_active"
                                                checked={editFormData.is_active}
                                                onChange={handleEditInputChange}
                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <span className="ml-2 text-sm text-gray-700">Active Hospital</span>
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
                                        disabled={loading}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
                                    >
                                        {loading ? (
                                            <>
                                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="w-4 h-4 mr-2" />
                                                Update Hospital
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Hospital Detail Modal */}
            {showHospitalModal && selectedHospital && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900">Hospital Details</h3>
                                <button
                                    onClick={() => setShowHospitalModal(false)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="flex items-center space-x-4">
                                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                                    <Building2 className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                    <h4 className="text-xl font-bold text-gray-900">{selectedHospital.name}</h4>
                                    <p className="text-sm text-gray-500">ID: {selectedHospital.id}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <h5 className="font-medium text-gray-900">Hospital Details</h5>
                                    <div className="space-y-2">
                                        <div className="flex items-center text-sm">
                                            <CheckCircle className="w-4 h-4 text-gray-400 mr-3" />
                                            <span>Status: {selectedHospital.is_active ? 'Active' : 'Inactive'}</span>
                                        </div>
                                        <div className="flex items-center text-sm">
                                            <Calendar className="w-4 h-4 text-gray-400 mr-3" />
                                            <span>Created: {formatDate(selectedHospital.created_at)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h5 className="font-medium text-gray-900">Contact Information</h5>
                                    <div className="space-y-2">
                                        <div className="flex items-center text-sm">
                                            <Mail className="w-4 h-4 text-gray-400 mr-3" />
                                            <span>{selectedHospital.email}</span>
                                        </div>
                                        <div className="flex items-center text-sm">
                                            <Phone className="w-4 h-4 text-gray-400 mr-3" />
                                            <span>{selectedHospital.phone}</span>
                                        </div>
                                        <div className="flex items-start text-sm">
                                            <MapPin className="w-4 h-4 text-gray-400 mr-3 mt-0.5" />
                                            <span>{selectedHospital.location}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h5 className="font-medium text-gray-900 mb-2">Full Address</h5>
                                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                                    {selectedHospital.address}
                                </p>
                            </div>

                            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                                <button
                                    onClick={() => {
                                        setShowHospitalModal(false);
                                        handleEditHospital(selectedHospital);
                                    }}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
                                >
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit Hospital
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HospitalManagement;