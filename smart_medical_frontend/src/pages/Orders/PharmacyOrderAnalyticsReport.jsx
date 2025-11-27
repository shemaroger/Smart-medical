import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
    Search,
    Filter,
    Eye,
    X,
    Loader,
    ArrowUpDown,
    ArrowDown,
    ArrowUp,
    Users,
    User,
    Calendar,
    Flag,
    AlertCircle,
    Shield,
    Database,
    FileText,
    Download,
    Target,
    Star,
    Hash,
    Activity,
    BarChart3,
    TrendingUp,
    Stethoscope,
    Building2,
    UserCheck,
    UserX,
    Phone,
    Mail,
    MapPin,
    CheckCircle,
    XCircle,
    Clock,
    Package,
    DollarSign,
    CreditCard,
    Pill
} from 'lucide-react';
import { orderService } from '../../api';

const PharmacyOrderAnalyticsReportPage = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const [filters, setFilters] = useState({
        status: 'all',
        paymentStatus: 'all',
        pharmacyId: 'all',
        orderDateFrom: '',
        orderDateTo: '',
        searchTerm: '',
        totalAmountMin: '',
        totalAmountMax: ''
    });

    const orderStatuses = [
        { value: 'pending', label: 'Pending' },
        { value: 'processing', label: 'Processing' },
        { value: 'completed', label: 'Completed' },
        { value: 'cancelled', label: 'Cancelled' }
    ];

    const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
    const isAdmin = userData?.user_type === 'pharmacy';

    useEffect(() => {
        if (!isAdmin) {
            toast.error('Access denied. Administrator privileges required.');
            navigate('/dashboard');
            return;
        }
        fetchAllOrders();
    }, [isAdmin, navigate]);

    const fetchAllOrders = async () => {
        setLoading(true);
        try {
            const result = await orderService.getAll();
            if (result.success) {
                const ordersData = result.data.results || result.data || [];
                setOrders(ordersData);
            } else {
                toast.error('Failed to fetch orders');
                setOrders([]);
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
            toast.error('Error loading orders');
            setOrders([]);
        } finally {
            setLoading(false);
        }
    };
    const getFilteredOrders = () => {
        return orders.filter(order => {
            if (filters.status !== 'all' && order.status !== filters.status) return false;

            if (filters.paymentStatus !== 'all') {
                const isPaid = filters.paymentStatus === 'paid';
                if (order.is_paid !== isPaid) return false;
            }

            if (filters.pharmacyId !== 'all' && order.pharmacy?.id !== parseInt(filters.pharmacyId)) return false;

            if (filters.orderDateFrom) {
                const orderDate = new Date(order.created_at);
                const fromDate = new Date(filters.orderDateFrom);
                if (orderDate < fromDate) return false;
            }

            if (filters.orderDateTo) {
                const orderDate = new Date(order.created_at);
                const toDate = new Date(filters.orderDateTo);
                if (orderDate > toDate) return false;
            }

            if (filters.totalAmountMin) {
                if (parseFloat(order.total_amount) < parseFloat(filters.totalAmountMin)) return false;
            }

            if (filters.totalAmountMax) {
                if (parseFloat(order.total_amount) > parseFloat(filters.totalAmountMax)) return false;
            }

            if (filters.searchTerm) {
                const searchTerm = filters.searchTerm.toLowerCase();
                const patientName = `${order.patient?.user?.first_name || ''} ${order.patient?.user?.last_name || ''}`.toLowerCase();
                const pharmacyName = order.pharmacy?.pharmacy_name?.toLowerCase() || '';
                const orderId = order.id?.toString().toLowerCase() || '';

                if (!patientName.includes(searchTerm) &&
                    !pharmacyName.includes(searchTerm) &&
                    !orderId.includes(searchTerm)) {
                    return false;
                }
            }

            return true;
        });
    };

    const calculateStats = () => {
        const filteredOrders = getFilteredOrders();
        const stats = {
            totalOrders: filteredOrders.length,
            pendingOrders: filteredOrders.filter(o => o.status === 'pending').length,
            processingOrders: filteredOrders.filter(o => o.status === 'processing').length,
            completedOrders: filteredOrders.filter(o => o.status === 'completed').length,
            cancelledOrders: filteredOrders.filter(o => o.status === 'cancelled').length,
            paidOrders: filteredOrders.filter(o => o.is_paid).length,
            unpaidOrders: filteredOrders.filter(o => !o.is_paid).length,
            totalRevenue: 0,
            averageOrderValue: 0,
            paidRevenue: 0,
            pendingRevenue: 0,
            thisMonth: 0,
            lastMonth: 0,
            thisYear: 0,
            totalPharmacies: 0,
            totalPatients: 0,
            completionRate: 0,
            paymentRate: 0
        };

        if (filteredOrders.length > 0) {
            stats.totalRevenue = filteredOrders.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0);
            stats.averageOrderValue = stats.totalRevenue / stats.totalOrders;
            stats.paidRevenue = filteredOrders.filter(o => o.is_paid).reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0);
            stats.pendingRevenue = stats.totalRevenue - stats.paidRevenue;

            const now = new Date();
            const thisMonth = now.getMonth();
            const thisYear = now.getFullYear();
            const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;

            stats.thisMonth = filteredOrders.filter(o => {
                const orderDate = new Date(o.created_at);
                return orderDate.getMonth() === thisMonth && orderDate.getFullYear() === thisYear;
            }).length;

            stats.lastMonth = filteredOrders.filter(o => {
                const orderDate = new Date(o.created_at);
                return orderDate.getMonth() === lastMonth &&
                    orderDate.getFullYear() === (thisMonth === 0 ? thisYear - 1 : thisYear);
            }).length;

            stats.thisYear = filteredOrders.filter(o => {
                const orderDate = new Date(o.created_at);
                return orderDate.getFullYear() === thisYear;
            }).length;
            const uniquePharmacies = new Set(filteredOrders.map(o => o.pharmacy?.id).filter(Boolean));
            stats.totalPharmacies = uniquePharmacies.size;
            const uniquePatients = new Set(filteredOrders.map(o => o.patient?.id).filter(Boolean));
            stats.totalPatients = uniquePatients.size;
            stats.completionRate = (stats.completedOrders / stats.totalOrders) * 100;
            stats.paymentRate = (stats.paidOrders / stats.totalOrders) * 100;
        }

        return stats;
    };

    const getUniquePharmacies = () => {
        const pharmacies = [...new Set(orders.map(o => ({
            id: o.pharmacy?.id,
            name: o.pharmacy?.pharmacy_name
        })).filter(p => p.id && p.name))];
        return pharmacies.sort((a, b) => a.name.localeCompare(b.name));
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (error) {
            console.log(error)
            return 'Invalid Date';
        }
    };

    const formatCurrency = (amount) => {
        return `${parseFloat(amount || 0).toLocaleString()} RWF`;
    };

    const clearFilters = () => {
        setFilters({
            status: 'all',
            paymentStatus: 'all',
            pharmacyId: 'all',
            orderDateFrom: '',
            orderDateTo: '',
            searchTerm: '',
            totalAmountMin: '',
            totalAmountMax: ''
        });
    };

    const hasActiveFilters = () => {
        return filters.status !== 'all' || filters.paymentStatus !== 'all' ||
            filters.pharmacyId !== 'all' || filters.orderDateFrom ||
            filters.orderDateTo || filters.searchTerm ||
            filters.totalAmountMin || filters.totalAmountMax;
    };

    const generatePDFReport = () => {
        const filteredOrders = getFilteredOrders();

        if (filteredOrders.length === 0) {
            alert('No data to export. Please adjust your filters.');
            return;
        }

        const printWindow = window.open('', '_blank');
        const reportHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Pharmacy Order Analytics Report - Healthcare System</title>
                <style>
                    body { 
                        font-family: Arial, sans-serif; 
                        margin: 0; 
                        padding: 20px; 
                        color: #000; 
                        line-height: 1.4; 
                        background: white;
                    }
                    .container {
                        max-width: 1200px;
                        margin: 0 auto;
                        background: white;
                        border: 2px solid #000;
                    }
                    .header { 
                        background: #f5f5f5;
                        color: #000;
                        padding: 30px;
                        text-align: center;
                        
                    }
                    .system-info {
                        margin-bottom: 20px;
                    }
                    .system-info h1 {
                        margin: 0;
                        font-size: 28px;
                        font-weight: bold;
                        text-transform: uppercase;
                    }
                    .system-info p {
                        margin: 5px 0;
                        font-size: 14px;
                    }
                    .report-title {
                        font-size: 20px;
                        font-weight: bold;
                        margin: 20px 0 10px 0;
                        text-transform: uppercase;
                        letter-spacing: 1px;
                        
                        padding-bottom: 5px;
                    }
                    .report-date {
                        font-size: 12px;
                    }
                    .content {
                        padding: 20px;
                    }
                    .section-title {
                        font-size: 16px;
                        font-weight: bold;
                        margin: 20px 0 15px 0;
                        padding-bottom: 5px;
                        
                        text-transform: uppercase;
                    }
                    .stats-grid {
                        display: grid;
                        grid-template-columns: repeat(4, 1fr);
                        gap: 15px;
                        margin: 20px 0;
                    }
                    .stat-box {
                        border: 1px solid #000;
                        padding: 15px;
                        text-align: center;
                        background: #f9f9f9;
                    }
                    .stat-value {
                        font-size: 24px;
                        font-weight: bold;
                        margin-bottom: 5px;
                    }
                    .stat-label {
                        font-size: 12px;
                        text-transform: uppercase;
                        font-weight: bold;
                    }
                    .table { 
                        width: 100%; 
                        border-collapse: collapse; 
                        margin-top: 15px;
                        border: 2px solid #000;
                    }
                    .table th, .table td { 
                        border: 1px solid #000; 
                        padding: 10px 8px; 
                        text-align: left; 
                        font-size: 11px; 
                    }
                    .table th { 
                        background: #f5f5f5;
                        font-weight: bold; 
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    }
                    .table tr:nth-child(even) { 
                        background: #fafafa; 
                    }
                    .footer { 
                        margin-top: 10px; 
                        padding: 10px;
                        background: #f5f5f5;
                    }
                    .signature-section {
                        padding-top: 10px;
                        margin-top: 10px;
                    }
                    .signature-grid {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 60px;
                    }
                    .signature-box {
                        text-align: center;
                    }
                    .signature-line {
                        border-bottom: 1px solid #000;
                        margin: 40px 0 10px 0;
                        height: 1px;
                    }
                    .signature-label {
                        font-weight: bold;
                        font-size: 12px;
                        text-transform: uppercase;
                    }
                    .signature-title {
                        font-size: 10px;
                        margin-top: 5px;
                    }
                    @media print {
                        body { 
                            background: white !important; 
                        }
                        .container {
                            border: none;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div class="system-info">
                            <h1>Healthcare Management System</h1>
                            <p>Pharmacy Order Analytics & Management Platform</p>
                            <p>Healthcare Prescription Order & Revenue Insights</p>
                        </div>
                        <div class="report-title">Pharmacy Order Analytics Report</div>
                        <div class="report-date">Generated on ${new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })}</div>
                    </div>
                    
                    <div class="content">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Order ID</th>
                                    <th>Patient Name</th>
                                    <th>Pharmacy Name</th>
                                    <th>Total Amount</th>
                                    <th>Payment Status</th>
                                    <th>Order Status</th>
                                    <th>Order Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${filteredOrders.map(order => `
                                    <tr>
                                        <td>#${order.id || 'N/A'}</td>
                                        <td>${order.patient?.user?.first_name || ''} ${order.patient?.user?.last_name || 'Unknown Patient'}</td>
                                        <td>${order.pharmacy?.pharmacy_name || 'Unknown Pharmacy'}</td>
                                        <td>${formatCurrency(order.total_amount)}</td>
                                        <td>${order.is_paid ? 'PAID' : 'UNPAID'}</td>
                                        <td>${order.status ? order.status.toUpperCase() : 'N/A'}</td>
                                        <td>${formatDate(order.created_at)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                    
                    <div class="footer">
                       
                        <div class="signature-section">
                            <div class="signature-grid">
                                <div class="signature-box">
                                    <div class="signature-line"></div>
                                    <div class="signature-label">System Administrator</div>
                                    <div class="signature-title">Healthcare Management System</div>
                                    <div style="font-size: 10px; margin-top: 5px;">
                                        Date: ${new Date().toLocaleDateString('en-US')}
                                    </div>
                                </div>
                                <div class="signature-box">
                                    <div class="signature-line"></div>
                                    <div class="signature-label">Pharmacy Operations Manager</div>
                                    <div class="signature-title">Order & Revenue Management</div>
                                    <div style="font-size: 10px; margin-top: 5px;">
                                        Date: _________________
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `;

        printWindow.document.write(reportHTML);
        printWindow.document.close();
        setTimeout(() => {
            printWindow.print();
        }, 500);
    };

    const filteredOrders = getFilteredOrders();
    const stats = calculateStats();
    const uniquePharmacies = getUniquePharmacies();
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex items-center space-x-3">
                    <Loader className="w-8 h-8 animate-spin text-blue-600" />
                    <span className="text-gray-600">Loading pharmacy order analytics...</span>
                </div>
            </div>
        );
    }
    if (!isAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
                    <p className="text-gray-600 mb-4">
                        You need administrator privileges to access this page.
                    </p>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Go to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            <div className="bg-gray-100 border-b-2 border-black">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="bg-blue-100 p-2 rounded-lg">
                                <Package className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-black uppercase">
                                    Pharmacy Order Analytics Report
                                </h1>
                                <p className="text-black text-sm font-medium">Comprehensive healthcare pharmacy order and revenue analysis</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={generatePDFReport}
                                disabled={loading || filteredOrders.length === 0}
                                className="bg-black hover:bg-gray-800 text-white px-6 py-3 border border-black font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                            >
                                <Download className="w-4 h-4" />
                                <span>Download PDF</span>
                            </button>
                            <button
                                onClick={fetchAllOrders}
                                className="bg-white hover:bg-gray-100 text-black px-6 py-3 border-2 border-black font-semibold"
                            >
                                Refresh Data
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-6">
                <div className="bg-gray-50 border-2 border-black mb-6">
                    <div className="p-6 border-b border-black">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-black uppercase">Analytics Filters</h3>
                            {hasActiveFilters() && (
                                <button
                                    onClick={clearFilters}
                                    className="text-sm px-4 py-2 text-black border border-black hover:bg-gray-100"
                                >
                                    Clear All Filters
                                </button>
                            )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-black mb-2 uppercase">
                                    Order Status
                                </label>
                                <select
                                    value={filters.status}
                                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                    className="w-full px-3 py-2 bg-white border-2 border-black focus:outline-none"
                                >
                                    <option value="all">All Statuses</option>
                                    {orderStatuses.map(status => (
                                        <option key={status.value} value={status.value}>
                                            {status.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-black mb-2 uppercase">
                                    Payment Status
                                </label>
                                <select
                                    value={filters.paymentStatus}
                                    onChange={(e) => setFilters({ ...filters, paymentStatus: e.target.value })}
                                    className="w-full px-3 py-2 bg-white border-2 border-black focus:outline-none"
                                >
                                    <option value="all">All Payment Status</option>
                                    <option value="paid">Paid</option>
                                    <option value="unpaid">Unpaid</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-black mb-2 uppercase">
                                    Min Amount (RWF)
                                </label>
                                <input
                                    type="number"
                                    placeholder="0"
                                    value={filters.totalAmountMin}
                                    onChange={(e) => setFilters({ ...filters, totalAmountMin: e.target.value })}
                                    className="w-full px-3 py-2 bg-white border-2 border-black focus:outline-none"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                            <div>
                                <label className="block text-sm font-bold text-black mb-2 uppercase">
                                    Order Date From
                                </label>
                                <input
                                    type="date"
                                    value={filters.orderDateFrom}
                                    onChange={(e) => setFilters({ ...filters, orderDateFrom: e.target.value })}
                                    className="w-full px-3 py-2 bg-white border-2 border-black focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-black mb-2 uppercase">
                                    Order Date To
                                </label>
                                <input
                                    type="date"
                                    value={filters.orderDateTo}
                                    onChange={(e) => setFilters({ ...filters, orderDateTo: e.target.value })}
                                    className="w-full px-3 py-2 bg-white border-2 border-black focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-black mb-2 uppercase">
                                    Max Amount (RWF)
                                </label>
                                <input
                                    type="number"
                                    placeholder="999999"
                                    value={filters.totalAmountMax}
                                    onChange={(e) => setFilters({ ...filters, totalAmountMax: e.target.value })}
                                    className="w-full px-3 py-2 bg-white border-2 border-black focus:outline-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="bg-gray-50 border-2 border-black p-6">
                    <div className="border-b border-black pb-4 mb-6">
                        <h3 className="text-lg font-bold text-black uppercase">Pharmacy Order Analytics Summary</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                        <div className="bg-white border border-black p-4">
                            <h4 className="font-bold text-black mb-3 uppercase flex items-center">
                                <Package className="w-4 h-4 mr-2" />
                                Order Overview
                            </h4>
                            <div className="space-y-2 text-sm text-black">
                                <div className="flex justify-between">
                                    <span>Total Orders:</span>
                                    <span className="font-bold">{stats.totalOrders}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Completed:</span>
                                    <span className="font-bold text-green-600">{stats.completedOrders}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Processing:</span>
                                    <span className="font-bold text-blue-600">{stats.processingOrders}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Pending:</span>
                                    <span className="font-bold text-yellow-600">{stats.pendingOrders}</span>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white border border-black p-4">
                            <h4 className="font-bold text-black mb-3 uppercase flex items-center">
                                <DollarSign className="w-4 h-4 mr-2" />
                                Revenue Analytics
                            </h4>
                            <div className="space-y-2 text-sm text-black">
                                <div className="flex justify-between">
                                    <span>Total Revenue:</span>
                                    <span className="font-bold">{formatCurrency(stats.totalRevenue)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Paid Revenue:</span>
                                    <span className="font-bold text-green-600">{formatCurrency(stats.paidRevenue)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Pending Revenue:</span>
                                    <span className="font-bold text-orange-600">{formatCurrency(stats.pendingRevenue)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Avg Order Value:</span>
                                    <span className="font-bold">{formatCurrency(stats.averageOrderValue)}</span>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white border border-black p-4">
                            <h4 className="font-bold text-black mb-3 uppercase flex items-center">
                                <Building2 className="w-4 h-4 mr-2" />
                                Business Metrics
                            </h4>
                            <div className="space-y-2 text-sm text-black">
                                <div className="flex justify-between">
                                    <span>Active Pharmacies:</span>
                                    <span className="font-bold text-blue-600">{stats.totalPharmacies}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Total Patients:</span>
                                    <span className="font-bold text-purple-600">{stats.totalPatients}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Completion Rate:</span>
                                    <span className="font-bold text-green-600">{stats.completionRate.toFixed(1)}%</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Payment Rate:</span>
                                    <span className="font-bold text-indigo-600">{stats.paymentRate.toFixed(1)}%</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border border-black p-4 mb-6">
                        <h4 className="font-bold text-black mb-4 uppercase">Order Status Distribution</h4>
                        <div className="grid grid-cols-4 gap-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-yellow-600 mb-1">{stats.pendingOrders}</div>
                                <div className="text-xs text-black uppercase font-bold">Pending</div>
                                <div className="text-xs text-black">
                                    {stats.totalOrders > 0 ? ((stats.pendingOrders / stats.totalOrders) * 100).toFixed(1) : 0}%
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600 mb-1">{stats.processingOrders}</div>
                                <div className="text-xs text-black uppercase font-bold">Processing</div>
                                <div className="text-xs text-black">
                                    {stats.totalOrders > 0 ? ((stats.processingOrders / stats.totalOrders) * 100).toFixed(1) : 0}%
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-600 mb-1">{stats.completedOrders}</div>
                                <div className="text-xs text-black uppercase font-bold">Completed</div>
                                <div className="text-xs text-black">
                                    {stats.totalOrders > 0 ? ((stats.completedOrders / stats.totalOrders) * 100).toFixed(1) : 0}%
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-red-600 mb-1">{stats.cancelledOrders}</div>
                                <div className="text-xs text-black uppercase font-bold">Cancelled</div>
                                <div className="text-xs text-black">
                                    {stats.totalOrders > 0 ? ((stats.cancelledOrders / stats.totalOrders) * 100).toFixed(1) : 0}%
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border border-black p-4 mb-6">
                        <h4 className="font-bold text-black mb-4 uppercase">Payment Analytics</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-600 mb-1">
                                    {stats.paidOrders}
                                </div>
                                <div className="text-sm text-black uppercase font-bold">Paid Orders</div>
                                <div className="text-xs text-black">
                                    {formatCurrency(stats.paidRevenue)}
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-orange-600 mb-1">
                                    {stats.unpaidOrders}
                                </div>
                                <div className="text-sm text-black uppercase font-bold">Unpaid Orders</div>
                                <div className="text-xs text-black">
                                    {formatCurrency(stats.pendingRevenue)}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white border border-black p-4 mb-6">
                        <h4 className="font-bold text-black mb-4 uppercase">Monthly Trend Analysis</h4>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-indigo-600 mb-1">
                                    {stats.thisMonth}
                                </div>
                                <div className="text-sm text-black uppercase font-bold">This Month</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-gray-600 mb-1">
                                    {stats.lastMonth}
                                </div>
                                <div className="text-sm text-black uppercase font-bold">Last Month</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-teal-600 mb-1">
                                    {stats.thisYear}
                                </div>
                                <div className="text-sm text-black uppercase font-bold">Year to Date</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-orange-600 mb-1">
                                    {stats.lastMonth > 0 ? ((stats.thisMonth - stats.lastMonth) / stats.lastMonth * 100).toFixed(1) : 0}%
                                </div>
                                <div className="text-sm text-black uppercase font-bold">Growth Rate</div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white border border-black p-4 mb-6">
                        <h4 className="font-bold text-black mb-4 uppercase">Financial Performance</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-600 mb-1">
                                    {formatCurrency(stats.totalRevenue)}
                                </div>
                                <div className="text-sm text-black uppercase font-bold">Total Revenue</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600 mb-1">
                                    {formatCurrency(stats.averageOrderValue)}
                                </div>
                                <div className="text-sm text-black uppercase font-bold">Average Order Value</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-purple-600 mb-1">
                                    {stats.paymentRate.toFixed(1)}%
                                </div>
                                <div className="text-sm text-black uppercase font-bold">Payment Collection Rate</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PharmacyOrderAnalyticsReportPage;