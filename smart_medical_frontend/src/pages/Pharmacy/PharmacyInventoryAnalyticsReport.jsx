import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
    Search, Filter, Eye, X, Loader, ArrowUpDown, ArrowDown, ArrowUp,
    Users, User, Calendar, Flag, AlertCircle, Shield, Database, FileText,
    Download, Target, Star, Hash, Activity, BarChart3, TrendingUp,
    Stethoscope, Building2, UserCheck, UserX, Phone, Mail, MapPin,
    CheckCircle, XCircle, Clock, Package, DollarSign, CreditCard, Pill,
    TrendingDown, AlertTriangle
} from 'lucide-react';
import { inventoryService } from '../../api';

const PharmacyInventoryAnalyticsReportPage = () => {
    const navigate = useNavigate();
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filter states
    const [filters, setFilters] = useState({
        category: 'all',
        stockStatus: 'all',
        expiryStatus: 'all',
        priceRangeMin: '',
        priceRangeMax: '',
        searchTerm: '',
        quantityMin: '',
        quantityMax: ''
    });

    const drugCategories = [
        { value: 'antibiotic', label: 'Antibiotic' },
        { value: 'painkiller', label: 'Painkiller' },
        { value: 'vitamin', label: 'Vitamin' },
        { value: 'prescription', label: 'Prescription' },
        { value: 'over_counter', label: 'Over The Counter' }
    ];

    const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
    const isAdmin = userData?.user_type === 'pharmacy';

    useEffect(() => {
        if (!isAdmin) {
            toast.error('Access denied. Administrator privileges required.');
            navigate('/dashboard');
            return;
        }
        fetchAllInventory();
    }, [isAdmin, navigate]);

    const fetchAllInventory = async () => {
        setLoading(true);
        try {
            const result = await inventoryService.getAll();
            if (result.success) {
                const inventoryData = result.data.results || result.data || [];
                setInventory(inventoryData);
            } else {
                toast.error('Failed to fetch inventory');
                setInventory([]);
            }
        } catch (error) {
            console.error('Error fetching inventory:', error);
            toast.error('Error loading inventory');
            setInventory([]);
        } finally {
            setLoading(false);
        }
    };

    const isLowStock = (item) => {
        return item.quantity_available <= item.low_stock_threshold;
    };

    const isExpiringSoon = (item) => {
        const today = new Date();
        const expiryDate = new Date(item.expiry_date);
        const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
        return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
    };

    const isExpired = (item) => {
        const today = new Date();
        const expiryDate = new Date(item.expiry_date);
        return expiryDate <= today;
    };

    const getFilteredInventory = () => {
        return inventory.filter(item => {
            if (filters.category !== 'all' && item.drug?.category !== filters.category) return false;
            if (filters.stockStatus !== 'all') {
                if (filters.stockStatus === 'low_stock' && !isLowStock(item)) return false;
                if (filters.stockStatus === 'in_stock' && isLowStock(item)) return false;
            }
            if (filters.expiryStatus !== 'all') {
                if (filters.expiryStatus === 'expired' && !isExpired(item)) return false;
                if (filters.expiryStatus === 'expiring_soon' && !isExpiringSoon(item)) return false;
                if (filters.expiryStatus === 'valid' && (isExpired(item) || isExpiringSoon(item))) return false;
            }
            if (filters.priceRangeMin) {
                if (parseFloat(item.price_per_unit) < parseFloat(filters.priceRangeMin)) return false;
            }
            if (filters.priceRangeMax) {
                if (parseFloat(item.price_per_unit) > parseFloat(filters.priceRangeMax)) return false;
            }
            if (filters.quantityMin) {
                if (item.quantity_available < parseInt(filters.quantityMin)) return false;
            }
            if (filters.quantityMax) {
                if (item.quantity_available > parseInt(filters.quantityMax)) return false;
            }
            if (filters.searchTerm) {
                const searchTerm = filters.searchTerm.toLowerCase();
                const drugName = item.drug?.name?.toLowerCase() || '';
                const genericName = item.drug?.generic_name?.toLowerCase() || '';
                const manufacturer = item.drug?.manufacturer?.toLowerCase() || '';
                if (!drugName.includes(searchTerm) &&
                    !genericName.includes(searchTerm) &&
                    !manufacturer.includes(searchTerm)) {
                    return false;
                }
            }
            return true;
        });
    };

    const calculateStats = () => {
        const filteredInventory = getFilteredInventory();
        const stats = {
            totalItems: filteredInventory.length,
            lowStockItems: filteredInventory.filter(item => isLowStock(item)).length,
            expiringItems: filteredInventory.filter(item => isExpiringSoon(item)).length,
            expiredItems: filteredInventory.filter(item => isExpired(item)).length,
            inStockItems: filteredInventory.filter(item => !isLowStock(item) && !isExpired(item)).length,
            // Category breakdown
            antibiotics: filteredInventory.filter(item => item.drug?.category === 'antibiotic').length,
            painkillers: filteredInventory.filter(item => item.drug?.category === 'painkiller').length,
            vitamins: filteredInventory.filter(item => item.drug?.category === 'vitamin').length,
            prescriptions: filteredInventory.filter(item => item.drug?.category === 'prescription').length,
            overCounter: filteredInventory.filter(item => item.drug?.category === 'over_counter').length,
            // Financial metrics
            totalInventoryValue: 0,
            averageItemValue: 0,
            highestValueItem: 0,
            lowestValueItem: 0,
            // Stock metrics
            totalQuantity: 0,
            averageQuantity: 0,
            averagePrice: 0,
            // Risk metrics
            riskRate: 0,
            stockTurnoverItems: 0
        };

        if (filteredInventory.length > 0) {
            // Financial calculations
            const itemValues = filteredInventory.map(item =>
                item.quantity_available * parseFloat(item.price_per_unit || 0)
            );
            const prices = filteredInventory.map(item => parseFloat(item.price_per_unit || 0));

            stats.totalInventoryValue = itemValues.reduce((sum, value) => sum + value, 0);
            stats.averageItemValue = stats.totalInventoryValue / stats.totalItems;
            stats.highestValueItem = Math.max(...itemValues);
            stats.lowestValueItem = Math.min(...itemValues);

            // Stock metrics
            stats.totalQuantity = filteredInventory.reduce((sum, item) => sum + item.quantity_available, 0);
            stats.averageQuantity = stats.totalQuantity / stats.totalItems;
            stats.averagePrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;

            // Risk calculations
            const riskItems = stats.lowStockItems + stats.expiringItems + stats.expiredItems;
            stats.riskRate = (riskItems / stats.totalItems) * 100;
            stats.stockTurnoverItems = filteredInventory.filter(item =>
                item.quantity_available > (item.low_stock_threshold * 2)
            ).length;
        }
        return stats;
    };

    // Utility Functions
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (error) {
            console.log(error);
            return 'Invalid Date';
        }
    };

    const formatCurrency = (amount) => {
        return `${parseFloat(amount || 0).toLocaleString()} RWF`;
    };

    const clearFilters = () => {
        setFilters({
            category: 'all',
            stockStatus: 'all',
            expiryStatus: 'all',
            priceRangeMin: '',
            priceRangeMax: '',
            searchTerm: '',
            quantityMin: '',
            quantityMax: ''
        });
    };

    const hasActiveFilters = () => {
        return filters.category !== 'all' || filters.stockStatus !== 'all' ||
            filters.expiryStatus !== 'all' || filters.priceRangeMin ||
            filters.priceRangeMax || filters.searchTerm ||
            filters.quantityMin || filters.quantityMax;
    };

    const generatePDFReport = () => {
        const filteredInventory = getFilteredInventory();
        if (filteredInventory.length === 0) {
            alert('No data to export. Please adjust your filters.');
            return;
        }

        const printWindow = window.open('', '_blank');
        const reportHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Pharmacy Inventory Analytics Report - Healthcare System</title>
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
                            <p>Pharmacy Inventory Analytics & Management Platform</p>
                            <p>Healthcare Drug Stock & Financial Performance Insights</p>
                        </div>
                        <div class="report-title">Pharmacy Inventory Analytics Report</div>
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
                                    <th>Drug Name</th>
                                    <th>Generic Name</th>
                                    <th>Category</th>
                                    <th>Quantity</th>
                                    <th>Price per Unit</th>
                                    <th>Total Value</th>
                                    <th>Expiry Date</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${filteredInventory.map(item => {
            const totalValue = item.quantity_available * parseFloat(item.price_per_unit || 0);
            let status = 'IN STOCK';
            if (isExpired(item)) status = 'EXPIRED';
            else if (isExpiringSoon(item)) status = 'EXPIRING SOON';
            else if (isLowStock(item)) status = 'LOW STOCK';

            return `
                                        <tr>
                                            <td>${item.drug?.name || 'Unknown Drug'}</td>
                                            <td>${item.drug?.generic_name || 'N/A'}</td>
                                            <td>${item.drug?.category ? item.drug.category.toUpperCase() : 'N/A'}</td>
                                            <td>${item.quantity_available || 0}</td>
                                            <td>${formatCurrency(item.price_per_unit)}</td>
                                            <td>${formatCurrency(totalValue)}</td>
                                            <td>${formatDate(item.expiry_date)}</td>
                                            <td>${status}</td>
                                        </tr>
                                    `;
        }).join('')}
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
                                    <div class="signature-label">Inventory Manager</div>
                                    <div class="signature-title">Stock & Supply Management</div>
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

    // Computed Values
    const filteredInventory = getFilteredInventory();
    const stats = calculateStats();

    // Show loading state while data is being fetched
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex items-center space-x-3">
                    <Loader className="w-8 h-8 animate-spin text-blue-600" />
                    <span className="text-gray-600">Loading inventory analytics...</span>
                </div>
            </div>
        );
    }

    // Show access denied if not admin
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
            {/* Header */}
            <div className="bg-gray-100 border-b-2 border-black">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="bg-blue-100 p-2 rounded-lg">
                                <Package className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-black uppercase">
                                    Pharmacy Inventory Analytics Report
                                </h1>
                                <p className="text-black text-sm font-medium">Comprehensive healthcare inventory stock and financial analysis</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={generatePDFReport}
                                disabled={loading || filteredInventory.length === 0}
                                className="bg-black hover:bg-gray-800 text-white px-6 py-3 border border-black font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                            >
                                <Download className="w-4 h-4" />
                                <span>Download PDF</span>
                            </button>
                            <button
                                onClick={fetchAllInventory}
                                className="bg-white hover:bg-gray-100 text-black px-6 py-3 border-2 border-black font-semibold"
                            >
                                Refresh Data
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-6">
                {/* Filters Section */}
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
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-black mb-2 uppercase">
                                    Drug Category
                                </label>
                                <select
                                    value={filters.category}
                                    onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                                    className="w-full px-3 py-2 bg-white border-2 border-black focus:outline-none"
                                >
                                    <option value="all">All Categories</option>
                                    {drugCategories.map(category => (
                                        <option key={category.value} value={category.value}>
                                            {category.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-black mb-2 uppercase">
                                    Stock Status
                                </label>
                                <select
                                    value={filters.stockStatus}
                                    onChange={(e) => setFilters({ ...filters, stockStatus: e.target.value })}
                                    className="w-full px-3 py-2 bg-white border-2 border-black focus:outline-none"
                                >
                                    <option value="all">All Stock Levels</option>
                                    <option value="low_stock">Low Stock</option>
                                    <option value="in_stock">In Stock</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-black mb-2 uppercase">
                                    Expiry Status
                                </label>
                                <select
                                    value={filters.expiryStatus}
                                    onChange={(e) => setFilters({ ...filters, expiryStatus: e.target.value })}
                                    className="w-full px-3 py-2 bg-white border-2 border-black focus:outline-none"
                                >
                                    <option value="all">All Expiry Status</option>
                                    <option value="expired">Expired</option>
                                    <option value="expiring_soon">Expiring Soon</option>
                                    <option value="valid">Valid</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-black mb-2 uppercase">
                                    Search Inventory
                                </label>
                                <input
                                    type="text"
                                    placeholder="Search by drug name, generic..."
                                    value={filters.searchTerm}
                                    onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
                                    className="w-full px-3 py-2 bg-white border-2 border-black focus:outline-none"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                            <div>
                                <label className="block text-sm font-bold text-black mb-2 uppercase">
                                    Min Price (RWF)
                                </label>
                                <input
                                    type="number"
                                    placeholder="0"
                                    value={filters.priceRangeMin}
                                    onChange={(e) => setFilters({ ...filters, priceRangeMin: e.target.value })}
                                    className="w-full px-3 py-2 bg-white border-2 border-black focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-black mb-2 uppercase">
                                    Max Price (RWF)
                                </label>
                                <input
                                    type="number"
                                    placeholder="999999"
                                    value={filters.priceRangeMax}
                                    onChange={(e) => setFilters({ ...filters, priceRangeMax: e.target.value })}
                                    className="w-full px-3 py-2 bg-white border-2 border-black focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-black mb-2 uppercase">
                                    Min Quantity
                                </label>
                                <input
                                    type="number"
                                    placeholder="0"
                                    value={filters.quantityMin}
                                    onChange={(e) => setFilters({ ...filters, quantityMin: e.target.value })}
                                    className="w-full px-3 py-2 bg-white border-2 border-black focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-black mb-2 uppercase">
                                    Max Quantity
                                </label>
                                <input
                                    type="number"
                                    placeholder="999999"
                                    value={filters.quantityMax}
                                    onChange={(e) => setFilters({ ...filters, quantityMax: e.target.value })}
                                    className="w-full px-3 py-2 bg-white border-2 border-black focus:outline-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Analytics Summary Report */}
                <div className="bg-gray-50 border-2 border-black p-6">
                    <div className="border-b border-black pb-4 mb-6">
                        <h3 className="text-lg font-bold text-black uppercase">Inventory Analytics Summary</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                        {/* Stock Overview */}
                        <div className="bg-white border border-black p-4">
                            <h4 className="font-bold text-black mb-3 uppercase flex items-center">
                                <Package className="w-4 h-4 mr-2" />
                                Stock Overview
                            </h4>
                            <div className="space-y-2 text-sm text-black">
                                <div className="flex justify-between">
                                    <span>Total Items:</span>
                                    <span className="font-bold">{stats.totalItems}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>In Stock:</span>
                                    <span className="font-bold text-green-600">{stats.inStockItems}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Low Stock:</span>
                                    <span className="font-bold text-orange-600">{stats.lowStockItems}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Total Quantity:</span>
                                    <span className="font-bold">{stats.totalQuantity}</span>
                                </div>
                            </div>
                        </div>

                        {/* Financial Metrics */}
                        <div className="bg-white border border-black p-4">
                            <h4 className="font-bold text-black mb-3 uppercase flex items-center">
                                <DollarSign className="w-4 h-4 mr-2" />
                                Financial Metrics
                            </h4>
                            <div className="space-y-2 text-sm text-black">
                                <div className="flex justify-between">
                                    <span>Total Value:</span>
                                    <span className="font-bold">{formatCurrency(stats.totalInventoryValue)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Avg Item Value:</span>
                                    <span className="font-bold text-green-600">{formatCurrency(stats.averageItemValue)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Avg Price:</span>
                                    <span className="font-bold text-blue-600">{formatCurrency(stats.averagePrice)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Highest Value:</span>
                                    <span className="font-bold">{formatCurrency(stats.highestValueItem)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Risk Analytics */}
                        <div className="bg-white border border-black p-4">
                            <h4 className="font-bold text-black mb-3 uppercase flex items-center">
                                <AlertTriangle className="w-4 h-4 mr-2" />
                                Risk Analytics
                            </h4>
                            <div className="space-y-2 text-sm text-black">
                                <div className="flex justify-between">
                                    <span>Expiring Soon:</span>
                                    <span className="font-bold text-yellow-600">{stats.expiringItems}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Expired Items:</span>
                                    <span className="font-bold text-red-600">{stats.expiredItems}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Risk Rate:</span>
                                    <span className="font-bold text-orange-600">{stats.riskRate.toFixed(1)}%</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Over Stocked:</span>
                                    <span className="font-bold">{stats.stockTurnoverItems}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Drug Category Distribution Chart */}
                    <div className="bg-white border border-black p-4 mb-6">
                        <h4 className="font-bold text-black mb-4 uppercase">Drug Category Distribution</h4>
                        <div className="grid grid-cols-5 gap-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600 mb-1">{stats.antibiotics}</div>
                                <div className="text-xs text-black uppercase font-bold">Antibiotics</div>
                                <div className="text-xs text-black">
                                    {stats.totalItems > 0 ? ((stats.antibiotics / stats.totalItems) * 100).toFixed(1) : 0}%
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-red-600 mb-1">{stats.painkillers}</div>
                                <div className="text-xs text-black uppercase font-bold">Painkillers</div>
                                <div className="text-xs text-black">
                                    {stats.totalItems > 0 ? ((stats.painkillers / stats.totalItems) * 100).toFixed(1) : 0}%
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-600 mb-1">{stats.vitamins}</div>
                                <div className="text-xs text-black uppercase font-bold">Vitamins</div>
                                <div className="text-xs text-black">
                                    {stats.totalItems > 0 ? ((stats.vitamins / stats.totalItems) * 100).toFixed(1) : 0}%
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-purple-600 mb-1">{stats.prescriptions}</div>
                                <div className="text-xs text-black uppercase font-bold">Prescription</div>
                                <div className="text-xs text-black">
                                    {stats.totalItems > 0 ? ((stats.prescriptions / stats.totalItems) * 100).toFixed(1) : 0}%
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-yellow-600 mb-1">{stats.overCounter}</div>
                                <div className="text-xs text-black uppercase font-bold">Over Counter</div>
                                <div className="text-xs text-black">
                                    {stats.totalItems > 0 ? ((stats.overCounter / stats.totalItems) * 100).toFixed(1) : 0}%
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stock Status Analytics */}
                    <div className="bg-white border border-black p-4 mb-6">
                        <h4 className="font-bold text-black mb-4 uppercase">Stock Status Analytics</h4>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-600 mb-1">
                                    {stats.inStockItems}
                                </div>
                                <div className="text-sm text-black uppercase font-bold">In Stock</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-orange-600 mb-1">
                                    {stats.lowStockItems}
                                </div>
                                <div className="text-sm text-black uppercase font-bold">Low Stock</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-yellow-600 mb-1">
                                    {stats.expiringItems}
                                </div>
                                <div className="text-sm text-black uppercase font-bold">Expiring Soon</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-red-600 mb-1">
                                    {stats.expiredItems}
                                </div>
                                <div className="text-sm text-black uppercase font-bold">Expired</div>
                            </div>
                        </div>
                    </div>

                    {/* Financial Performance */}
                    <div className="bg-white border border-black p-4 mb-6">
                        <h4 className="font-bold text-black mb-4 uppercase">Financial Performance</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-600 mb-1">
                                    {formatCurrency(stats.totalInventoryValue)}
                                </div>
                                <div className="text-sm text-black uppercase font-bold">Total Inventory Value</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600 mb-1">
                                    {formatCurrency(stats.averageItemValue)}
                                </div>
                                <div className="text-sm text-black uppercase font-bold">Average Item Value</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-purple-600 mb-1">
                                    {formatCurrency(stats.averagePrice)}
                                </div>
                                <div className="text-sm text-black uppercase font-bold">Average Unit Price</div>
                            </div>
                        </div>
                    </div>

                    {/* Inventory Efficiency Metrics */}
                    <div className="bg-white border border-black p-4 mb-6">
                        <h4 className="font-bold text-black mb-4 uppercase">Inventory Efficiency Metrics</h4>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-indigo-600 mb-1">
                                    {stats.totalQuantity}
                                </div>
                                <div className="text-sm text-black uppercase font-bold">Total Stock Units</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-teal-600 mb-1">
                                    {stats.averageQuantity.toFixed(0)}
                                </div>
                                <div className="text-sm text-black uppercase font-bold">Average Quantity</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-pink-600 mb-1">
                                    {stats.riskRate.toFixed(1)}%
                                </div>
                                <div className="text-sm text-black uppercase font-bold">Risk Rate</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-cyan-600 mb-1">
                                    {stats.stockTurnoverItems}
                                </div>
                                <div className="text-sm text-black uppercase font-bold">Overstocked Items</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PharmacyInventoryAnalyticsReportPage;
