import React, { useState, useEffect, useRef } from 'react';
import {
    Search, Filter, RefreshCw, Eye, Loader2, Calendar, Clock, User,
    Pill, FileText, AlertCircle, CheckCircle, Building2, Phone, Mail,
    CreditCard, DollarSign, Package, ArrowLeft, MapPin, Activity,
    TrendingUp, X, AlertTriangle, Stethoscope, Edit, Save, ChevronDown, Printer, Download,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { orderService, getCurrentUser } from '../../api';

const PharmacyOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showOrderModal, setShowOrderModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [selectedPaymentStatus, setSelectedPaymentStatus] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [userData, setUserData] = useState(null);
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [editingStatus, setEditingStatus] = useState(false);
    const [newStatus, setNewStatus] = useState('');
    const [newPaymentStatus, setNewPaymentStatus] = useState(false);
    const [showInvoice, setShowInvoice] = useState(false);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const invoiceRef = useRef();
    const ordersPerPage = 10;

    const statusConfig = {
        pending: {
            color: 'yellow',
            icon: Clock,
            label: 'Pending',
            bgColor: 'bg-yellow-100',
            textColor: 'text-yellow-800',
            description: 'Order awaiting pharmacy confirmation'
        },
        processing: {
            color: 'blue',
            icon: Activity,
            label: 'Processing',
            bgColor: 'bg-blue-100',
            textColor: 'text-blue-800',
            description: 'Order is being prepared'
        },
        completed: {
            color: 'green',
            icon: CheckCircle,
            label: 'Completed',
            bgColor: 'bg-green-100',
            textColor: 'text-green-800',
            description: 'Order has been fulfilled'
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

    const statusOptions = [
        { value: 'pending', label: 'Pending' },
        { value: 'processing', label: 'Processing' },
        { value: 'completed', label: 'Completed' },
        { value: 'cancelled', label: 'Cancelled' }
    ];

    useEffect(() => {
        initializePage();
    }, [currentPage, selectedStatus, selectedPaymentStatus, searchTerm]);

    const initializePage = async () => {
        try {
            const user = getCurrentUser();
            if (!user) {
                toast.error('Please log in to view orders');
                return;
            }
            setUserData(user);
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
                setNewStatus(response.data.status);
                setNewPaymentStatus(response.data.is_paid);
                setShowOrderModal(true);
            } else {
                toast.error('Failed to load order details');
            }
        } catch (error) {
            console.error('Error fetching order details:', error);
            toast.error('Failed to load order details');
        }
    };

    const handleUpdateStatus = async () => {
        if (!selectedOrder) return;

        try {
            setUpdatingStatus(true);
            const payload = {
                status: newStatus,
                is_paid: newPaymentStatus
            };

            const response = await orderService.updateStatus(selectedOrder.id, payload);

            if (response.success) {
                toast.success('Order status updated successfully');
                setSelectedOrder({ ...selectedOrder, ...payload });
                setEditingStatus(false);
                // Refresh orders list
                await fetchOrders();
            } else {
                toast.error(response.error?.message || 'Failed to update order status');
            }
        } catch (error) {
            console.error('Error updating order status:', error);
            toast.error('Failed to update order status');
        } finally {
            setUpdatingStatus(false);
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

    // Generate invoice number based on order ID and date
    const generateInvoiceNumber = (order) => {
        const date = new Date(order.created_at);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        return `INV-${year}${month}-${String(order.id).padStart(4, '0')}`;
    };

    const handlePrint = () => {
        window.print();
    };

    const handleDownloadPDF = async () => {
        setIsGeneratingPDF(true);
        try {
            const printWindow = window.open('', '_blank');
            const invoiceContent = invoiceRef.current.innerHTML;

            printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Invoice - ${generateInvoiceNumber(selectedOrder)}</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        .invoice-container { max-width: 800px; margin: 0 auto; }
                        .invoice-header { display: flex; justify-content: space-between; margin-bottom: 30px; }
                        .invoice-details { margin-bottom: 30px; }
                        .invoice-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                        .invoice-table th, .invoice-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                        .invoice-table th { background-color: #f8f9fa; }
                        .invoice-total { text-align: right; margin-top: 20px; }
                        .print-only { display: block; }
                        @media screen { .print-only { display: none; } }
                    </style>
                </head>
                <body>
                    ${invoiceContent}
                </body>
                </html>
            `);

            printWindow.document.close();
            printWindow.focus();

            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 1000);

        } catch (error) {
            console.error('Error generating PDF:', error);
            toast.error('Failed to generate PDF');
        } finally {
            setIsGeneratingPDF(false);
        }
    };

    const closeModal = () => {
        setShowOrderModal(false);
        setSelectedOrder(null);
        setEditingStatus(false);
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
                    <p className="text-gray-600">Loading orders...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
                    <p className="text-sm text-gray-600 mt-1">
                        Manage and track prescription orders for your pharmacy
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
                        label: 'Processing Orders',
                        value: orders.filter(o => o.status === 'processing').length,
                        icon: Activity,
                        color: 'blue'
                    },
                    {
                        label: 'Completed Orders',
                        value: orders.filter(o => o.status === 'completed').length,
                        icon: CheckCircle,
                        color: 'green'
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
                        <option value="all">All Statuses</option>
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
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {orders.length > 0 ? (
                                orders.map((order, index) => (
                                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                                                    <Package className="w-5 h-5 text-white" />
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        Order #{index + 1}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {order.prescription?.items?.length || 0} items
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <User className="w-4 h-4 text-gray-400 mr-2" />
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {order.patient?.user?.first_name} {order.patient?.user?.last_name}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {order.patient?.user?.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <Stethoscope className="w-4 h-4 text-gray-400 mr-2" />
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {order.doctor ?
                                                            `Dr. ${order.doctor.user?.first_name} ${order.doctor.user?.last_name}` :
                                                            'N/A'
                                                        }
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {order.doctor?.specialization || 'N/A'}
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
                    <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        Order #{selectedOrder.id} Management
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
                            {/* Status Management Section */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-lg font-medium text-gray-900">Status Management</h4>
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={() => setShowInvoice(true)}
                                            className="inline-flex items-center px-3 py-1 border border-blue-300 rounded-lg text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                                        >
                                            <FileText className="w-4 h-4 mr-1" />
                                            Generate Invoice
                                        </button>
                                        {!editingStatus && (
                                            <button
                                                onClick={() => setEditingStatus(true)}
                                                className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                                            >
                                                <Edit className="w-4 h-4 mr-1" />
                                                Edit Status
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {editingStatus ? (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Order Status
                                            </label>
                                            <select
                                                value={newStatus}
                                                onChange={(e) => setNewStatus(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            >
                                                {statusOptions.map(option => (
                                                    <option key={option.value} value={option.value}>
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Payment Status
                                            </label>
                                            <select
                                                value={newPaymentStatus}
                                                onChange={(e) => setNewPaymentStatus(e.target.value === 'true')}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            >
                                                <option value={false}>Unpaid</option>
                                                <option value={true}>Paid</option>
                                            </select>
                                        </div>

                                        <div className="flex items-end space-x-2">
                                            <button
                                                onClick={handleUpdateStatus}
                                                disabled={updatingStatus}
                                                className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
                                            >
                                                {updatingStatus ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                                        Updating...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Save className="w-4 h-4 mr-2" />
                                                        Update
                                                    </>
                                                )}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setEditingStatus(false);
                                                    setNewStatus(selectedOrder.status);
                                                    setNewPaymentStatus(selectedOrder.is_paid);
                                                }}
                                                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className={`p-3 rounded-lg ${statusConfig[selectedOrder.status]?.bgColor}`}>
                                            <div className="flex items-center">
                                                {React.createElement(statusConfig[selectedOrder.status]?.icon, {
                                                    className: `w-5 h-5 mr-2 ${statusConfig[selectedOrder.status]?.textColor}`
                                                })}
                                                <span className={`font-medium ${statusConfig[selectedOrder.status]?.textColor}`}>
                                                    {statusConfig[selectedOrder.status]?.label}
                                                </span>
                                            </div>
                                        </div>
                                        <div className={`p-3 rounded-lg ${selectedOrder.is_paid ? 'bg-green-100' : 'bg-red-100'}`}>
                                            <div className="flex items-center">
                                                <CreditCard className={`w-5 h-5 mr-2 ${selectedOrder.is_paid ? 'text-green-600' : 'text-red-600'}`} />
                                                <span className={`font-medium ${selectedOrder.is_paid ? 'text-green-600' : 'text-red-600'}`}>
                                                    {selectedOrder.is_paid ? 'Paid' : 'Unpaid'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Patient Information */}
                                <div className="space-y-4">
                                    <h4 className="text-lg font-medium text-gray-900 flex items-center">
                                        <User className="w-5 h-5 mr-2 text-purple-600" />
                                        Patient Information
                                    </h4>
                                    <div className="bg-purple-50 p-4 rounded-lg space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-sm font-medium text-gray-600">Name:</span>
                                            <span className="text-sm text-gray-900">
                                                {selectedOrder.patient?.user?.first_name} {selectedOrder.patient?.user?.last_name}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm font-medium text-gray-600">Email:</span>
                                            <span className="text-sm text-gray-900">{selectedOrder.patient?.user?.email}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm font-medium text-gray-600">Phone:</span>
                                            <span className="text-sm text-gray-900">{selectedOrder.patient?.user?.phone_number || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm font-medium text-gray-600">Blood Group:</span>
                                            <span className="text-sm text-gray-900">{selectedOrder.patient?.blood_group || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm font-medium text-gray-600">Location:</span>
                                            <span className="text-sm text-gray-900">{selectedOrder.patient?.user?.location || 'N/A'}</span>
                                        </div>
                                    </div>

                                    {/* Patient Allergies Warning */}
                                    {selectedOrder.patient?.allergies && (
                                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                            <div className="flex items-start">
                                                <AlertTriangle className="w-5 h-5 text-red-600 mr-2 mt-0.5" />
                                                <div>
                                                    <h5 className="text-sm font-medium text-red-800">⚠️ Patient Allergies</h5>
                                                    <p className="text-sm text-red-700 mt-1">{selectedOrder.patient.allergies}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Order Summary */}
                                <div className="space-y-4">
                                    <h4 className="text-lg font-medium text-gray-900 flex items-center">
                                        <DollarSign className="w-5 h-5 mr-2 text-green-600" />
                                        Order Summary
                                    </h4>
                                    <div className="bg-green-50 p-4 rounded-lg space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-sm font-medium text-gray-600">Order ID:</span>
                                            <span className="text-sm font-medium text-gray-900">#{selectedOrder.id}</span>
                                        </div>
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
                                                    Dr. {selectedOrder.doctor?.user?.first_name} {selectedOrder.doctor?.user?.last_name}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="font-medium text-gray-600">Email:</span>
                                                <span className="ml-2 text-gray-900">{selectedOrder.doctor?.user?.email || 'N/A'}</span>
                                            </div>
                                            <div>
                                                <span className="font-medium text-gray-600">Phone:</span>
                                                <span className="ml-2 text-gray-900">{selectedOrder.doctor?.user?.phone_number || 'N/A'}</span>
                                            </div>
                                            <div>
                                                <span className="font-medium text-gray-600">Specialization:</span>
                                                <span className="ml-2 text-gray-900">{selectedOrder.doctor?.specialization || 'N/A'}</span>
                                            </div>
                                            <div>
                                                <span className="font-medium text-gray-600">Hospital:</span>
                                                <span className="ml-2 text-gray-900">{selectedOrder.doctor?.hospital_name || 'N/A'}</span>
                                            </div>
                                            <div>
                                                <span className="font-medium text-gray-600">License:</span>
                                                <span className="ml-2 text-gray-900">{selectedOrder.doctor?.license_number || 'N/A'}</span>
                                            </div>
                                            <div>
                                                <span className="font-medium text-gray-600">Experience:</span>
                                                <span className="ml-2 text-gray-900">
                                                    {selectedOrder.doctor?.experience_years ? `${selectedOrder.doctor.experience_years} years` : 'N/A'}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="font-medium text-gray-600">Verified:</span>
                                                <span className={`ml-2 font-medium ${selectedOrder.doctor?.is_verified ? 'text-green-600' : 'text-yellow-600'}`}>
                                                    {selectedOrder.doctor?.is_verified ? 'Verified' : 'Pending'}
                                                </span>
                                            </div>
                                        </div>
                                        {selectedOrder.doctor?.bio && (
                                            <div className="mt-3 pt-3 border-t border-blue-200">
                                                <span className="font-medium text-gray-600 text-sm">Bio:</span>
                                                <p className="text-sm text-gray-900 mt-1">{selectedOrder.doctor.bio}</p>
                                            </div>
                                        )}
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
                                                <div className="space-y-3">
                                                    {selectedOrder.prescription.items.map((item, index) => (
                                                        <div key={index} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                                                <div>
                                                                    <span className="font-medium text-gray-500 block">Drug:</span>
                                                                    <p className="text-gray-900 font-medium">{item.drug?.name || 'N/A'}</p>
                                                                    {item.drug?.strength && (
                                                                        <p className="text-xs text-gray-500">{item.drug.strength}</p>
                                                                    )}
                                                                </div>
                                                                <div>
                                                                    <span className="font-medium text-gray-500 block">Quantity:</span>
                                                                    <p className="text-gray-900">{item.quantity}</p>
                                                                </div>
                                                                <div>
                                                                    <span className="font-medium text-gray-500 block">Dosage:</span>
                                                                    <p className="text-gray-900">{item.dosage}</p>
                                                                </div>
                                                                <div>
                                                                    <span className="font-medium text-gray-500 block">Duration:</span>
                                                                    <p className="text-gray-900">{item.duration} days</p>
                                                                </div>
                                                            </div>
                                                            {item.instructions && (
                                                                <div className="mt-3 pt-3 border-t border-gray-100">
                                                                    <span className="font-medium text-gray-500 text-sm block">Instructions:</span>
                                                                    <p className="text-sm text-gray-700 mt-1">{item.instructions}</p>
                                                                </div>
                                                            )}
                                                            {item.drug?.price && (
                                                                <div className="mt-2 pt-2 border-t border-gray-100">
                                                                    <span className="font-medium text-gray-500 text-sm">Unit Price:</span>
                                                                    <span className="ml-2 text-sm font-medium text-green-600">
                                                                        {formatCurrency(item.drug.price)}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {selectedOrder.prescription.notes && (
                                            <div>
                                                <span className="text-sm font-medium text-gray-600">Additional Notes:</span>
                                                <p className="text-sm text-gray-900 mt-1">
                                                    {selectedOrder.prescription.notes}
                                                </p>
                                            </div>
                                        )}

                                        {/* Prescription Status */}
                                        <div className="pt-3 border-t border-green-200">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-medium text-gray-600">Prescription Status:</span>
                                                <span className={`text-sm font-medium px-2 py-1 rounded-full ${selectedOrder.prescription.status === 'active' ? 'bg-blue-100 text-blue-800' :
                                                    selectedOrder.prescription.status === 'filled' ? 'bg-green-100 text-green-800' :
                                                        'bg-red-100 text-red-800'
                                                    }`}>
                                                    {selectedOrder.prescription.status || 'Unknown'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Appointment Information */}
                            {selectedOrder.prescription?.appointment && (
                                <div>
                                    <h4 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                                        <Calendar className="w-5 h-5 mr-2 text-indigo-600" />
                                        Related Appointment
                                    </h4>
                                    <div className="bg-indigo-50 p-4 rounded-lg">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <span className="font-medium text-gray-600">Date:</span>
                                                <span className="ml-2 text-gray-900">
                                                    {formatDateTime(selectedOrder.prescription.appointment.appointment_date)}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="font-medium text-gray-600">Reason:</span>
                                                <span className="ml-2 text-gray-900">
                                                    {selectedOrder.prescription.appointment.reason || 'N/A'}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="font-medium text-gray-600">Status:</span>
                                                <span className="ml-2 text-gray-900">
                                                    {selectedOrder.prescription.appointment.status || 'N/A'}
                                                </span>
                                            </div>
                                            {selectedOrder.prescription.appointment.hospital && (
                                                <div>
                                                    <span className="font-medium text-gray-600">Hospital:</span>
                                                    <span className="ml-2 text-gray-900">
                                                        {selectedOrder.prescription.appointment.hospital.name || 'N/A'}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Patient Medical History */}
                            {selectedOrder.patient?.medical_history && (
                                <div>
                                    <h4 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                                        <FileText className="w-5 h-5 mr-2 text-orange-600" />
                                        Patient Medical History
                                    </h4>
                                    <div className="bg-orange-50 p-4 rounded-lg">
                                        <p className="text-sm text-gray-700">
                                            {selectedOrder.patient.medical_history}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Invoice Modal */}
            {showInvoice && selectedOrder && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200 flex items-center justify-between print-hide">
                            <h3 className="text-lg font-semibold text-gray-900">Invoice</h3>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={handlePrint}
                                    className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                                >
                                    <Printer className="w-4 h-4 mr-1" />
                                    Print
                                </button>
                                <button
                                    onClick={handleDownloadPDF}
                                    disabled={isGeneratingPDF}
                                    className="inline-flex items-center px-3 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50"
                                >
                                    {isGeneratingPDF ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin mr-1" />
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            <Download className="w-4 h-4 mr-1" />
                                            Download PDF
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={() => setShowInvoice(false)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        <div ref={invoiceRef} className="invoice-container p-8">
                            {/* Invoice Header */}
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900 mb-2">INVOICE</h1>
                                    <div className="text-sm text-gray-600">
                                        <p>Date: {formatDateTime(selectedOrder.created_at)}</p>
                                        <p>Due Date: {formatDateTime(selectedOrder.created_at)}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className=" text-black p-4 rounded-lg">
                                        <Building2 className="w-8 h-8 mx-auto mb-2" />
                                        <h2 className="text-lg font-bold">Smart Medical</h2>
                                        <p className="text-sm">Pharmacy Network</p>
                                    </div>
                                </div>
                            </div>

                            {/* Billing Information */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                                {/* Bill From - Pharmacy */}
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Bill From:</h3>
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <h4 className="font-medium text-gray-900">{selectedOrder.pharmacy?.pharmacy_name}</h4>
                                        <p className="text-sm text-gray-600 mt-1">{selectedOrder.pharmacy?.address}</p>
                                        <div className="mt-2 space-y-1 text-sm text-gray-600">
                                            <div className="flex items-center">
                                                <Phone className="w-4 h-4 mr-2" />
                                                {selectedOrder.pharmacy?.user?.phone_number || 'N/A'}
                                            </div>
                                            <div className="flex items-center">
                                                <Mail className="w-4 h-4 mr-2" />
                                                {selectedOrder.pharmacy?.user?.email || 'N/A'}
                                            </div>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-2">
                                            License: {selectedOrder.pharmacy?.license_number || 'N/A'}
                                        </p>
                                    </div>
                                </div>

                                {/* Bill To - Patient */}
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Bill To:</h3>
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <h4 className="font-medium text-gray-900">
                                            {selectedOrder.patient?.user?.first_name} {selectedOrder.patient?.user?.last_name}
                                        </h4>
                                        <p className="text-sm text-gray-600 mt-1">{selectedOrder.patient?.user?.location || 'N/A'}</p>
                                        <div className="mt-2 space-y-1 text-sm text-gray-600">
                                            <div className="flex items-center">
                                                <Phone className="w-4 h-4 mr-2" />
                                                {selectedOrder.patient?.user?.phone_number || 'N/A'}
                                            </div>
                                            <div className="flex items-center">
                                                <Mail className="w-4 h-4 mr-2" />
                                                {selectedOrder.patient?.user?.email}
                                            </div>
                                        </div>
                                        {selectedOrder.patient?.blood_group && (
                                            <p className="text-xs text-gray-500 mt-2">
                                                Blood Group: {selectedOrder.patient.blood_group}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Items Table */}
                            <div className="mb-8">
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">Prescription Items:</h3>
                                <div className="overflow-x-auto">
                                    <table className="invoice-table w-full border-collapse">
                                        <thead>
                                            <tr className="bg-gray-50">
                                                <th className="border border-gray-300 px-4 py-3 text-left">#</th>
                                                <th className="border border-gray-300 px-4 py-3 text-left">Drug Name</th>
                                                <th className="border border-gray-300 px-4 py-3 text-center">Quantity</th>
                                                <th className="border border-gray-300 px-4 py-3 text-center">Dosage</th>
                                                <th className="border border-gray-300 px-4 py-3 text-center">Duration</th>

                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedOrder.prescription?.items?.map((item, index) => {


                                                return (
                                                    <tr key={index}>
                                                        <td className="border border-gray-300 px-4 py-3">{index + 1}</td>
                                                        <td className="border border-gray-300 px-4 py-3">
                                                            <div>
                                                                <div className="font-medium">{item.drug?.name || 'N/A'}</div>
                                                                {item.drug?.strength && (
                                                                    <div className="text-sm text-gray-500">{item.drug.strength}</div>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="border border-gray-300 px-4 py-3 text-center">{item.quantity}</td>
                                                        <td className="border border-gray-300 px-4 py-3 text-center">{item.dosage}</td>
                                                        <td className="border border-gray-300 px-4 py-3 text-center">{item.duration} days</td>

                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Total */}
                            <div className="border-t border-gray-300 pt-6">
                                <div className="flex justify-center">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-50 text-sm text-gray-600">
                                        <div>
                                            <h4 className="font-medium text-gray-900 mb-2">Payment Information:</h4>
                                            <p>Status: <span className={selectedOrder.is_paid ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                                                {selectedOrder.is_paid ? 'PAID' : 'PENDING'}
                                            </span></p>
                                            <p>Payment Method: Cash/Mobile Money</p>
                                        </div>

                                        <div className="w-64">
                                            <div className="flex justify-between items-center py-2">
                                                <span className="text-gray-600">Subtotal:</span>
                                                <span className="font-medium">{formatCurrency(selectedOrder.total_amount)}</span>
                                            </div>
                                            <div className="flex justify-between items-center py-2">
                                                <span className="text-gray-600">Tax (0%):</span>
                                                <span className="font-medium">{formatCurrency(0)}</span>
                                            </div>
                                            <div className="border-t border-gray-300 pt-2">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-lg font-semibold text-gray-900">Total:</span>
                                                    <span className="text-xl font-bold text-blue-600">{formatCurrency(selectedOrder.total_amount)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="mt-12 pt-6 border-t border-gray-200">



                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PharmacyOrders;