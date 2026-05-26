import React, { useState, useEffect } from 'react';
import {
    Search, Filter, RefreshCw, Eye, Loader2, Calendar, Clock, User,
    Pill, FileText, AlertCircle, CheckCircle, Building2, Phone, Mail,
    CreditCard, DollarSign, Package, ArrowLeft, MapPin, Activity,
    TrendingUp, X, AlertTriangle, Stethoscope
} from 'lucide-react';
import { toast } from 'react-toastify';
import { orderService, getCurrentUser } from '../../api';

const PatientOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showOrderModal, setShowOrderModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [selectedPaymentStatus, setSelectedPaymentStatus] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const ordersPerPage = 10;

    const statusConfig = {
        pending: {
            color: 'yellow',
            icon: Clock,
            label: 'Pending',
            bgColor: 'bg-yellow-100',
            textColor: 'text-yellow-800',
            description: 'Order is awaiting pharmacy confirmation'
        },
        processing: {
            color: 'blue',
            icon: Activity,
            label: 'Processing',
            bgColor: 'bg-blue-100',
            textColor: 'text-blue-800',
            description: 'Order is being prepared by pharmacy'
        },
        completed: {
            color: 'green',
            icon: CheckCircle,
            label: 'Completed',
            bgColor: 'bg-green-100',
            textColor: 'text-green-800',
            description: 'Order has been fulfilled and delivered'
        },
        cancelled: {
            color: 'red',
            icon: X,
            label: 'Cancelled',
            bgColor: 'bg-red-100',
            textColor: 'text-red-800',
            description: 'Order has been cancelled'
        }
    };

    useEffect(() => {
        initializePage();
    }, [currentPage, selectedStatus, selectedPaymentStatus, searchTerm]);

    const initializePage = async () => {
        try {
            const user = getCurrentUser();
            if (!user) {
                toast.error('Please log in to view your orders');
                return;
            }

            await fetchOrders();
        } catch (error) {
            console.error('Error initializing page:', error);
            toast.error('Failed to load page data');
        }
    };

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const filters = {
                page: currentPage,
                page_size: ordersPerPage,
                search: searchTerm,
            };

            if (selectedStatus !== 'all') {
                filters.status = selectedStatus;
            }

            if (selectedPaymentStatus !== 'all') {
                filters.is_paid = selectedPaymentStatus === 'paid';
            }

            const response = await orderService.getAll(filters);

            console.log(response)
            if (response.success) {
                setOrders(response.data || []);
                setTotalPages(Math.ceil((response.data.count || 0) / ordersPerPage));
            } else {
                toast.error('Failed to fetch orders');
                setOrders([]);
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
            toast.error('Failed to fetch orders');
            setOrders([]);
        } finally {
            setLoading(false);
        }
    };

    const handleViewOrder = async (order) => {
        try {
            const response = await orderService.getById(order.id);
            if (response.success) {
                setSelectedOrder(response.data);
                setShowOrderModal(true);
            } else {
                toast.error('Failed to load order details');
            }
        } catch (error) {
            console.error('Error fetching order details:', error);
            toast.error('Failed to load order details');
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

    const formatCurrency = (amount) => {
        return `${parseFloat(amount).toLocaleString()} RWF`;
    };

    const closeModal = () => {
        setShowOrderModal(false);
        setSelectedOrder(null);
    };

    const handleRefresh = () => {
        setCurrentPage(1);
        fetchOrders();
    };

    if (loading && orders.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="flex flex-col items-center space-y-4">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    <p className="text-gray-600">Loading your orders...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">My Drug Requests</h1>
                    <p className="text-sm text-gray-600 mt-1">
                        View and track your prescription drug Requests
                    </p>
                </div>
                <div className="flex items-center space-x-3 mt-4 sm:mt-0">
                    <button
                        onClick={handleRefresh}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    {
                        label: 'Total Orders',
                        value: orders.length,
                        icon: Package,
                        color: 'blue'
                    },
                    {
                        label: 'Pending Orders',
                        value: orders.filter(o => o.status === 'pending').length,
                        icon: Clock,
                        color: 'yellow'
                    },
                    {
                        label: 'Completed Orders',
                        value: orders.filter(o => o.status === 'completed').length,
                        icon: CheckCircle,
                        color: 'green'
                    },
                    {
                        label: 'Unpaid Orders',
                        value: orders.filter(o => !o.is_paid).length,
                        icon: CreditCard,
                        color: 'red'
                    }
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
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search orders..."
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
                        <option value="all">Status</option>
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>

                    <select
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={selectedPaymentStatus}
                        onChange={(e) => setSelectedPaymentStatus(e.target.value)}
                    >
                        <option value="all">All Payment Status</option>
                        <option value="paid">Paid</option>
                        <option value="unpaid">Unpaid</option>
                    </select>

                    <div className="text-sm text-gray-500 flex items-center">
                        Showing {orders.length} orders
                    </div>
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pharmacy</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {orders.length > 0 ? (
                                orders.map((order) => (
                                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                                                    <Package className="w-5 h-5 text-white" />
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        Order#
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {order.prescription?.items?.length || 0} items
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <Building2 className="w-4 h-4 text-gray-400 mr-2" />
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {order.pharmacy?.pharmacy_name || 'Unknown Pharmacy'}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {order.pharmacy?.address}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {formatCurrency(order.total_amount)}
                                            </div>
                                            <div className={`text-sm ${order.is_paid ? 'text-green-600' : 'text-red-600'}`}>
                                                {order.is_paid ? 'Paid' : 'Unpaid'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig[order.status]?.bgColor} ${statusConfig[order.status]?.textColor}`}>
                                                {React.createElement(statusConfig[order.status]?.icon, {
                                                    className: "w-3 h-3 mr-1"
                                                })}
                                                {statusConfig[order.status]?.label}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            <div className="flex items-center">
                                                <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                                                {formatDateTime(order.created_at)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => handleViewOrder(order)}
                                                className="text-blue-600 hover:text-blue-900 p-1 rounded-lg hover:bg-blue-50 transition-colors"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center">
                                        <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Requests found</h3>
                                        <p className="text-gray-500">No orders match your current filters</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="bg-white px-6 py-3 flex items-center justify-between border-t border-gray-200">
                        <div className="flex items-center text-sm text-gray-700">
                            Showing page {currentPage} of {totalPages}
                        </div>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>

                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                const page = i + 1;
                                return (
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
                                );
                            })}

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

            {/* Order Detail Modal */}
            {showOrderModal && selectedOrder && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        Order # Details
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                        Created on {formatDateTime(selectedOrder.created_at)}
                                    </p>
                                </div>
                                <button
                                    onClick={closeModal}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Status Banner */}
                            <div className={`p-4 rounded-lg ${statusConfig[selectedOrder.status]?.bgColor}`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        {React.createElement(statusConfig[selectedOrder.status]?.icon, {
                                            className: `w-5 h-5 mr-2 ${statusConfig[selectedOrder.status]?.textColor}`
                                        })}
                                        <span className={`font-medium ${statusConfig[selectedOrder.status]?.textColor}`}>
                                            Status: {statusConfig[selectedOrder.status]?.label}
                                        </span>
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${selectedOrder.is_paid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                        }`}>
                                        {selectedOrder.is_paid ? 'Paid' : 'Unpaid'}
                                    </div>
                                </div>
                                <p className={`text-sm ${statusConfig[selectedOrder.status]?.textColor} mt-1`}>
                                    {statusConfig[selectedOrder.status]?.description}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Pharmacy Information */}
                                <div className="space-y-4">
                                    <h4 className="text-lg font-medium text-gray-900 flex items-center">
                                        <Building2 className="w-5 h-5 mr-2 text-purple-600" />
                                        Pharmacy Information
                                    </h4>
                                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-sm font-medium text-gray-600">Name:</span>
                                            <span className="text-sm text-gray-900">
                                                {selectedOrder.pharmacy?.pharmacy_name || 'N/A'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm font-medium text-gray-600">Address:</span>
                                            <span className="text-sm text-gray-900">{selectedOrder.pharmacy.address || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm font-medium text-gray-600">Phone:</span>
                                            <span className="text-sm text-gray-900">{selectedOrder.pharmacy.user?.phone_number || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm font-medium text-gray-600">Operating Hours:</span>
                                            <span className="text-sm text-gray-900">{selectedOrder.pharmacy?.operating_hours || '24/7'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Order Summary */}
                                <div className="space-y-4">
                                    <h4 className="text-lg font-medium text-gray-900 flex items-center">
                                        <DollarSign className="w-5 h-5 mr-2 text-green-600" />
                                        Order Summary
                                    </h4>
                                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-sm font-medium text-gray-600">Total Amount:</span>
                                            <span className="text-lg font-semibold text-gray-900">
                                                {formatCurrency(selectedOrder.total_amount)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm font-medium text-gray-600">Payment Status:</span>
                                            <span className={`text-sm font-medium ${selectedOrder.is_paid ? 'text-green-600' : 'text-red-600'
                                                }`}>
                                                {selectedOrder.is_paid ? 'Paid' : 'Unpaid'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm font-medium text-gray-600">Order Date:</span>
                                            <span className="text-sm text-gray-900">
                                                {formatDateTime(selectedOrder.created_at)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm font-medium text-gray-600">Last Updated:</span>
                                            <span className="text-sm text-gray-900">
                                                {formatDateTime(selectedOrder.updated_at)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Doctor Information */}
                            {selectedOrder.doctor && (
                                <div>
                                    <h4 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                                        <Stethoscope className="w-5 h-5 mr-2 text-blue-600" />
                                        Prescribing Doctor
                                    </h4>
                                    <div className="bg-blue-50 p-4 rounded-lg">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <span className="font-medium text-gray-600">Name:</span>
                                                <span className="ml-2 text-gray-900">
                                                    Dr. {selectedOrder.doctor.user?.first_name} {selectedOrder.doctor.user?.last_name}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="font-medium text-gray-600">Specialization:</span>
                                                <span className="ml-2 text-gray-900">{selectedOrder.doctor.specialization || 'N/A'}</span>
                                            </div>
                                            <div>
                                                <span className="font-medium text-gray-600">Hospital:</span>
                                                <span className="ml-2 text-gray-900">{selectedOrder.doctor.hospital?.name || 'N/A'}</span>
                                            </div>
                                            <div>
                                                <span className="font-medium text-gray-600">License:</span>
                                                <span className="ml-2 text-gray-900">{selectedOrder.doctor.license_number || 'N/A'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Prescription Details */}
                            {selectedOrder.prescription && (
                                <div>
                                    <h4 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                                        <FileText className="w-5 h-5 mr-2 text-green-600" />
                                        Prescription Details
                                    </h4>
                                    <div className="bg-green-50 p-4 rounded-lg space-y-4">
                                        <div>
                                            <span className="text-sm font-medium text-gray-600">Diagnosis:</span>
                                            <p className="text-sm text-gray-900 mt-1">
                                                {selectedOrder.prescription.diagnosis || 'Not specified'}
                                            </p>
                                        </div>

                                        {selectedOrder.prescription.items && selectedOrder.prescription.items.length > 0 && (
                                            <div>
                                                <span className="text-sm font-medium text-gray-600 block mb-2">
                                                    Medications ({selectedOrder.prescription.items.length}):
                                                </span>
                                                <div className="space-y-2">
                                                    {selectedOrder.prescription.items.map((item, index) => (
                                                        <div key={index} className="bg-white p-3 rounded border border-gray-200">
                                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                                                                <div>
                                                                    <span className="font-medium text-gray-500">Drug:</span>
                                                                    <p className="text-gray-900">{item.drug?.name || item.drug_name || 'N/A'}</p>
                                                                </div>
                                                                <div>
                                                                    <span className="font-medium text-gray-500">Quantity:</span>
                                                                    <p className="text-gray-900">{item.quantity}</p>
                                                                </div>
                                                                <div>
                                                                    <span className="font-medium text-gray-500">Dosage:</span>
                                                                    <p className="text-gray-900">{item.dosage}</p>
                                                                </div>
                                                                <div>
                                                                    <span className="font-medium text-gray-500">Duration:</span>
                                                                    <p className="text-gray-900">{item.duration}</p>
                                                                </div>
                                                            </div>
                                                            {item.instructions && (
                                                                <div className="mt-2 pt-2 border-t border-gray-100">
                                                                    <span className="font-medium text-gray-500 text-xs">Instructions:</span>
                                                                    <p className="text-xs text-gray-600 mt-1">{item.instructions}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {selectedOrder.prescription.notes && (
                                            <div>
                                                <span className="text-sm font-medium text-gray-600">Notes:</span>
                                                <p className="text-sm text-gray-900 mt-1">
                                                    {selectedOrder.prescription.notes}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PatientOrders;