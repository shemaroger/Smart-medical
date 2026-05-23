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
    Pill,
    Package,
    Factory
} from 'lucide-react';
import { drugService } from '../../api';

const DrugAnalyticsReportPage = () => {
    const navigate = useNavigate();
    const [drugs, setDrugs] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filter states
    const [filters, setFilters] = useState({
        category: 'all',
        prescriptionType: 'all',
        dosageForm: 'all',
        createdDateFrom: '',
        createdDateTo: '',
        searchTerm: '',
        manufacturer: 'all'
    });

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

    // Get user data and verify admin role
    const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
    const isAdmin = userData?.user_type === 'admin';

    useEffect(() => {
        if (!isAdmin) {
            toast.error('Access denied. Administrator privileges required.');
            navigate('/dashboard');
            return;
        }
        fetchAllDrugs();
    }, [isAdmin, navigate]);

    const fetchAllDrugs = async () => {
        setLoading(true);
        try {
            const result = await drugService.getAll();
            if (result.success) {
                const drugsData = result.data.results || result.data || [];
                setDrugs(drugsData);
            } else {
                toast.error('Failed to fetch drugs');
                setDrugs([]);
            }
        } catch (error) {
            console.error('Error fetching drugs:', error);
            toast.error('Error loading drugs');
            setDrugs([]);
        } finally {
            setLoading(false);
        }
    };

    // Data Processing
    const getFilteredDrugs = () => {
        return drugs.filter(drug => {
            if (filters.category !== 'all' && drug.category !== filters.category) return false;

            if (filters.prescriptionType !== 'all') {
                const requiresPrescription = filters.prescriptionType === 'prescription';
                if (drug.requires_prescription !== requiresPrescription) return false;
            }

            if (filters.dosageForm !== 'all' && drug.dosage_form !== filters.dosageForm) return false;

            if (filters.createdDateFrom) {
                const createdDate = new Date(drug.created_at);
                const fromDate = new Date(filters.createdDateFrom);
                if (createdDate < fromDate) return false;
            }

            if (filters.createdDateTo) {
                const createdDate = new Date(drug.created_at);
                const toDate = new Date(filters.createdDateTo);
                if (createdDate > toDate) return false;
            }

            if (filters.manufacturer !== 'all' && drug.manufacturer !== filters.manufacturer) return false;

            if (filters.searchTerm) {
                const searchTerm = filters.searchTerm.toLowerCase();
                const drugName = drug.name?.toLowerCase() || '';
                const genericName = drug.generic_name?.toLowerCase() || '';
                const manufacturer = drug.manufacturer?.toLowerCase() || '';
                const description = drug.description?.toLowerCase() || '';

                if (!drugName.includes(searchTerm) &&
                    !genericName.includes(searchTerm) &&
                    !manufacturer.includes(searchTerm) &&
                    !description.includes(searchTerm)) {
                    return false;
                }
            }

            return true;
        });
    };

    const calculateStats = () => {
        const filteredDrugs = getFilteredDrugs();
        const stats = {
            totalDrugs: filteredDrugs.length,
            prescriptionDrugs: filteredDrugs.filter(d => d.requires_prescription).length,
            overCounterDrugs: filteredDrugs.filter(d => !d.requires_prescription).length,

            // Category breakdown
            antibiotics: filteredDrugs.filter(d => d.category === 'antibiotic').length,
            painkillers: filteredDrugs.filter(d => d.category === 'painkiller').length,
            vitamins: filteredDrugs.filter(d => d.category === 'vitamin').length,
            prescriptions: filteredDrugs.filter(d => d.category === 'prescription').length,
            overCounter: filteredDrugs.filter(d => d.category === 'over_counter').length,

            // Time trends
            thisMonth: 0,
            lastMonth: 0,
            thisYear: 0,

            // Manufacturer diversity
            totalManufacturers: 0,

            // Dosage form diversity
            totalDosageForms: 0,

            // Prescription rate
            prescriptionRate: 0
        };

        if (filteredDrugs.length > 0) {
            // Time trends
            const now = new Date();
            const thisMonth = now.getMonth();
            const thisYear = now.getFullYear();
            const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;

            stats.thisMonth = filteredDrugs.filter(d => {
                const createdDate = new Date(d.created_at);
                return createdDate.getMonth() === thisMonth && createdDate.getFullYear() === thisYear;
            }).length;

            stats.lastMonth = filteredDrugs.filter(d => {
                const createdDate = new Date(d.created_at);
                return createdDate.getMonth() === lastMonth &&
                    createdDate.getFullYear() === (thisMonth === 0 ? thisYear - 1 : thisYear);
            }).length;

            stats.thisYear = filteredDrugs.filter(d => {
                const createdDate = new Date(d.created_at);
                return createdDate.getFullYear() === thisYear;
            }).length;

            // Manufacturer diversity
            const uniqueManufacturers = new Set(filteredDrugs.map(d => d.manufacturer).filter(Boolean));
            stats.totalManufacturers = uniqueManufacturers.size;

            // Dosage form diversity
            const uniqueDosageForms = new Set(filteredDrugs.map(d => d.dosage_form).filter(Boolean));
            stats.totalDosageForms = uniqueDosageForms.size;

            // Prescription rate
            stats.prescriptionRate = (stats.prescriptionDrugs / stats.totalDrugs) * 100;
        }

        return stats;
    };

    // Get unique manufacturers for filter
    const getUniqueManufacturers = () => {
        const manufacturers = [...new Set(drugs.map(d => d.manufacturer).filter(Boolean))];
        return manufacturers.sort();
    };

    // Get unique dosage forms for filter
    const getUniqueDosageForms = () => {
        const forms = [...new Set(drugs.map(d => d.dosage_form).filter(Boolean))];
        return forms.sort();
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
            console.log(error)
            return 'Invalid Date';
        }
    };

    const clearFilters = () => {
        setFilters({
            category: 'all',
            prescriptionType: 'all',
            dosageForm: 'all',
            createdDateFrom: '',
            createdDateTo: '',
            searchTerm: '',
            manufacturer: 'all'
        });
    };

    const hasActiveFilters = () => {
        return filters.category !== 'all' || filters.prescriptionType !== 'all' ||
            filters.dosageForm !== 'all' || filters.createdDateFrom ||
            filters.createdDateTo || filters.searchTerm || filters.manufacturer !== 'all';
    };

    const generatePDFReport = () => {
        const filteredDrugs = getFilteredDrugs();

        if (filteredDrugs.length === 0) {
            alert('No data to export. Please adjust your filters.');
            return;
        }

        const printWindow = window.open('', '_blank');
        const reportHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Drug Management Analytics Report - Healthcare System</title>
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
                            <h1> Drug Management Analytics Report</h1>
                            <p>Drug Analytics & Pharmaceutical Management Platform</p>
                            <p>Healthcare Drug Inventory & Distribution Insights</p>
                        </div>
                       
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
                                    <th>Dosage Form</th>
                                    <th>Manufacturer</th>
                                    <th>Prescription Required</th>
                                    <th>Added Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${filteredDrugs.map(drug => `
                                    <tr>
                                        <td>${drug.name || 'Unknown Drug'}</td>
                                        <td>${drug.generic_name || 'N/A'}</td>
                                        <td>${drug.category ? drug.category.toUpperCase() : 'N/A'}</td>
                                        <td>${drug.dosage_form || 'N/A'}</td>
                                        <td>${drug.manufacturer || 'N/A'}</td>
                                        <td>${drug.requires_prescription ? 'YES' : 'NO'}</td>
                                        <td>${formatDate(drug.created_at)}</td>
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
                                    <div class="signature-label">Pharmacy Manager</div>
                                    <div class="signature-title">Drug Inventory & Compliance</div>
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
    const filteredDrugs = getFilteredDrugs();
    const stats = calculateStats();
    const uniqueManufacturers = getUniqueManufacturers();
    const uniqueDosageForms = getUniqueDosageForms();

    // Show loading state while data is being fetched
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex items-center space-x-3">
                    <Loader className="w-8 h-8 animate-spin text-blue-600" />
                    <span className="text-gray-600">Loading drug analytics...</span>
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
                                <Pill className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-black uppercase">
                                    Drug Management Analytics Report
                                </h1>
                                <p className="text-black text-sm font-medium">Comprehensive healthcare drug inventory analysis</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={generatePDFReport}
                                disabled={loading || filteredDrugs.length === 0}
                                className="bg-black hover:bg-gray-800 text-white px-6 py-3 border border-black font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                            >
                                <Download className="w-4 h-4" />
                                <span>Download PDF</span>
                            </button>
                            <button
                                onClick={fetchAllDrugs}
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
                                    Prescription Type
                                </label>
                                <select
                                    value={filters.prescriptionType}
                                    onChange={(e) => setFilters({ ...filters, prescriptionType: e.target.value })}
                                    className="w-full px-3 py-2 bg-white border-2 border-black focus:outline-none"
                                >
                                    <option value="all">All Types</option>
                                    <option value="prescription">Prescription Only</option>
                                    <option value="over_counter">Over The Counter</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-black mb-2 uppercase">
                                    Dosage Form
                                </label>
                                <select
                                    value={filters.dosageForm}
                                    onChange={(e) => setFilters({ ...filters, dosageForm: e.target.value })}
                                    className="w-full px-3 py-2 bg-white border-2 border-black focus:outline-none"
                                >
                                    <option value="all">All Forms</option>
                                    {uniqueDosageForms.map(form => (
                                        <option key={form} value={form}>
                                            {form}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-black mb-2 uppercase">
                                    Manufacturer
                                </label>
                                <select
                                    value={filters.manufacturer}
                                    onChange={(e) => setFilters({ ...filters, manufacturer: e.target.value })}
                                    className="w-full px-3 py-2 bg-white border-2 border-black focus:outline-none"
                                >
                                    <option value="all">All Manufacturers</option>
                                    {uniqueManufacturers.map(manufacturer => (
                                        <option key={manufacturer} value={manufacturer}>
                                            {manufacturer}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                            <div>
                                <label className="block text-sm font-bold text-black mb-2 uppercase">
                                    Created Date From
                                </label>
                                <input
                                    type="date"
                                    value={filters.createdDateFrom}
                                    onChange={(e) => setFilters({ ...filters, createdDateFrom: e.target.value })}
                                    className="w-full px-3 py-2 bg-white border-2 border-black focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-black mb-2 uppercase">
                                    Created Date To
                                </label>
                                <input
                                    type="date"
                                    value={filters.createdDateTo}
                                    onChange={(e) => setFilters({ ...filters, createdDateTo: e.target.value })}
                                    className="w-full px-3 py-2 bg-white border-2 border-black focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-black mb-2 uppercase">
                                    Search Drugs
                                </label>
                                <input
                                    type="text"
                                    placeholder="Search by name, generic, manufacturer..."
                                    value={filters.searchTerm}
                                    onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
                                    className="w-full px-3 py-2 bg-white border-2 border-black focus:outline-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Analytics Summary Report */}
                <div className="bg-gray-50 border-2 border-black p-6">
                    <div className="border-b border-black pb-4 mb-6">
                        <h3 className="text-lg font-bold text-black uppercase">Drug Analytics Summary</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                        {/* Drug Inventory */}
                        <div className="bg-white border border-black p-4">
                            <h4 className="font-bold text-black mb-3 uppercase flex items-center">
                                <Package className="w-4 h-4 mr-2" />
                                Drug Inventory
                            </h4>
                            <div className="space-y-2 text-sm text-black">
                                <div className="flex justify-between">
                                    <span>Total Drugs:</span>
                                    <span className="font-bold">{stats.totalDrugs}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Prescription Only:</span>
                                    <span className="font-bold text-red-600">{stats.prescriptionDrugs}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Over The Counter:</span>
                                    <span className="font-bold text-green-600">{stats.overCounterDrugs}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Manufacturers:</span>
                                    <span className="font-bold text-blue-600">{stats.totalManufacturers}</span>
                                </div>
                            </div>
                        </div>

                        {/* Addition Trends */}
                        <div className="bg-white border border-black p-4">
                            <h4 className="font-bold text-black mb-3 uppercase flex items-center">
                                <TrendingUp className="w-4 h-4 mr-2" />
                                Addition Trends
                            </h4>
                            <div className="space-y-2 text-sm text-black">
                                <div className="flex justify-between">
                                    <span>This Month:</span>
                                    <span className="font-bold">{stats.thisMonth} drugs</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Last Month:</span>
                                    <span className="font-bold">{stats.lastMonth} drugs</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>This Year:</span>
                                    <span className="font-bold">{stats.thisYear} drugs</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Growth Rate:</span>
                                    <span className="font-bold">{stats.lastMonth > 0 ? ((stats.thisMonth - stats.lastMonth) / stats.lastMonth * 100).toFixed(1) : 0}%</span>
                                </div>
                            </div>
                        </div>

                        {/* Drug Categories */}
                        <div className="bg-white border border-black p-4">
                            <h4 className="font-bold text-black mb-3 uppercase flex items-center">
                                <Target className="w-4 h-4 mr-2" />
                                Drug Categories
                            </h4>
                            <div className="space-y-2 text-sm text-black">
                                <div className="flex justify-between">
                                    <span>Antibiotics:</span>
                                    <span className="font-bold text-blue-600">{stats.antibiotics}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Painkillers:</span>
                                    <span className="font-bold text-red-600">{stats.painkillers}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Vitamins:</span>
                                    <span className="font-bold text-green-600">{stats.vitamins}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Dosage Forms:</span>
                                    <span className="font-bold">{stats.totalDosageForms} forms</span>
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
                                    {stats.totalDrugs > 0 ? ((stats.antibiotics / stats.totalDrugs) * 100).toFixed(1) : 0}%
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-red-600 mb-1">{stats.painkillers}</div>
                                <div className="text-xs text-black uppercase font-bold">Painkillers</div>
                                <div className="text-xs text-black">
                                    {stats.totalDrugs > 0 ? ((stats.painkillers / stats.totalDrugs) * 100).toFixed(1) : 0}%
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-600 mb-1">{stats.vitamins}</div>
                                <div className="text-xs text-black uppercase font-bold">Vitamins</div>
                                <div className="text-xs text-black">
                                    {stats.totalDrugs > 0 ? ((stats.vitamins / stats.totalDrugs) * 100).toFixed(1) : 0}%
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-purple-600 mb-1">{stats.prescriptions}</div>
                                <div className="text-xs text-black uppercase font-bold">Prescription</div>
                                <div className="text-xs text-black">
                                    {stats.totalDrugs > 0 ? ((stats.prescriptions / stats.totalDrugs) * 100).toFixed(1) : 0}%
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-yellow-600 mb-1">{stats.overCounter}</div>
                                <div className="text-xs text-black uppercase font-bold">Over Counter</div>
                                <div className="text-xs text-black">
                                    {stats.totalDrugs > 0 ? ((stats.overCounter / stats.totalDrugs) * 100).toFixed(1) : 0}%
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Prescription Analytics */}
                    <div className="bg-white border border-black p-4 mb-6">
                        <h4 className="font-bold text-black mb-4 uppercase">Prescription Analytics</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-red-600 mb-1">
                                    {stats.prescriptionRate.toFixed(1)}%
                                </div>
                                <div className="text-sm text-black uppercase font-bold">Prescription Rate</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600 mb-1">
                                    {stats.prescriptionDrugs}
                                </div>
                                <div className="text-sm text-black uppercase font-bold">Prescription Drugs</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-600 mb-1">
                                    {stats.overCounterDrugs}
                                </div>
                                <div className="text-sm text-black uppercase font-bold">Over Counter Drugs</div>
                            </div>
                        </div>
                    </div>

                    {/* Manufacturing Analytics */}
                    <div className="bg-white border border-black p-4 mb-6">
                        <h4 className="font-bold text-black mb-4 uppercase">Manufacturing & Distribution</h4>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-purple-600 mb-1">
                                    {stats.totalManufacturers}
                                </div>
                                <div className="text-sm text-black uppercase font-bold">Total Manufacturers</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-orange-600 mb-1">
                                    {stats.totalDosageForms}
                                </div>
                                <div className="text-sm text-black uppercase font-bold">Dosage Forms</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-indigo-600 mb-1">
                                    {drugCategories.length}
                                </div>
                                <div className="text-sm text-black uppercase font-bold">Drug Categories</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-teal-600 mb-1">
                                    {stats.totalDrugs}
                                </div>
                                <div className="text-sm text-black uppercase font-bold">Total Inventory</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DrugAnalyticsReportPage;