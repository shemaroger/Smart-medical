import React, { useState, useEffect } from 'react';
import {
    Package, DollarSign, TrendingUp, TrendingDown, Pill, Users,
    Calendar, Clock, Building2, RefreshCw, AlertTriangle, CheckCircle,
    XCircle, Activity, BarChart3, PieChart, LineChart, ArrowUpRight,
    ArrowDownRight, Loader2, Eye, ShoppingCart, AlertCircle,
    Factory, Shield, Heart, Stethoscope, FileText, MapPin,
    Phone, Mail, Star, Award, Target, Zap
} from 'lucide-react';
import {
    LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer, BarChart, Bar,
    PieChart as RechartsPieChart, Cell, Pie, Area, AreaChart
} from 'recharts';
import { toast } from 'react-toastify';
import { inventoryService, orderService, drugService, getCurrentUser } from '../../api';

const PharmacyDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [inventory, setInventory] = useState([]);
    const [orders, setOrders] = useState([]);
    const [drugs, setDrugs] = useState([]);
    const [userData, setUserData] = useState(null);
    const [selectedTimeframe, setSelectedTimeframe] = useState('30');

    // Stats states
    const [stats, setStats] = useState({
        totalInventoryItems: 0,
        lowStockItems: 0,
        expiringItems: 0,
        expiredItems: 0,
        totalOrders: 0,
        pendingOrders: 0,
        completedOrders: 0,
        totalRevenue: 0,
        monthlyRevenue: 0,
        inventoryValue: 0,
        averageOrderValue: 0,
        revenueGrowth: 0
    });

    // Chart data states
    const [revenueData, setRevenueData] = useState([]);
    const [orderTrends, setOrderTrends] = useState([]);
    const [stockLevels, setStockLevels] = useState([]);
    const [categoryDistribution, setCategoryDistribution] = useState([]);
    const [orderStatusData, setOrderStatusData] = useState([]);
    const [lowStockAlerts, setLowStockAlerts] = useState([]);
    const [expiringDrugs, setExpiringDrugs] = useState([]);
    const [topSellingDrugs, setTopSellingDrugs] = useState([]);

    const statusConfig = {
        pending: { color: '#EAB308', label: 'Pending', bg: 'bg-yellow-100', text: 'text-yellow-800' },
        processing: { color: '#3B82F6', label: 'Processing', bg: 'bg-blue-100', text: 'text-blue-800' },
        completed: { color: '#10B981', label: 'Completed', bg: 'bg-green-100', text: 'text-green-800' },
        cancelled: { color: '#EF4444', label: 'Cancelled', bg: 'bg-red-100', text: 'text-red-800' }
    };

    const COLORS = ['#3B82F6', '#10B981', '#EAB308', '#EF4444', '#8B5CF6', '#F59E0B'];

    useEffect(() => {
        initializeDashboard();
    }, [selectedTimeframe]);

    const initializeDashboard = async () => {
        try {
            const user = getCurrentUser();
            if (!user) {
                toast.error('Please log in to access dashboard');
                return;
            }
            setUserData(user);

            setLoading(true);
            await Promise.all([
                fetchInventory(),
                fetchOrders(),
                fetchDrugs()
            ]);
        } catch (error) {
            console.error('Error initializing dashboard:', error);
            toast.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const fetchInventory = async () => {
        try {
            const response = await inventoryService.getAll();
            if (response.success) {
                const inventoryData = response.data.results || response.data || [];
                setInventory(inventoryData);
                processInventoryData(inventoryData);
            }
        } catch (error) {
            console.error('Error fetching inventory:', error);
        }
    };

    const fetchOrders = async () => {
        try {
            const response = await orderService.getAll({ page_size: 100 });
            if (response.success) {
                const orderData = response.data || [];
                setOrders(orderData);
                processOrderData(orderData);
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
        }
    };

    const fetchDrugs = async () => {
        try {
            const response = await drugService.getAll();
            if (response.success) {
                const drugData = response.data.results || response.data || [];
                setDrugs(drugData);
                processDrugData(drugData);
            }
        } catch (error) {
            console.error('Error fetching drugs:', error);
        }
    };

    const processInventoryData = (inventoryData) => {
        const now = new Date();

        // Calculate inventory stats
        const totalInventoryItems = inventoryData.length;
        const lowStockItems = inventoryData.filter(item =>
            item.quantity_available <= item.low_stock_threshold
        ).length;

        const expiringItems = inventoryData.filter(item => {
            const expiryDate = new Date(item.expiry_date);
            const daysUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
            return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
        }).length;

        const expiredItems = inventoryData.filter(item => {
            const expiryDate = new Date(item.expiry_date);
            return expiryDate <= now;
        }).length;

        const inventoryValue = inventoryData.reduce((sum, item) =>
            sum + (item.quantity_available * parseFloat(item.price_per_unit || 0)), 0
        );

        // Get low stock alerts (top 5)
        const lowStockAlerts = inventoryData
            .filter(item => item.quantity_available <= item.low_stock_threshold)
            .sort((a, b) => a.quantity_available - b.quantity_available)
            .slice(0, 5);

        // Get expiring drugs (top 5)
        const expiringDrugs = inventoryData
            .filter(item => {
                const expiryDate = new Date(item.expiry_date);
                const daysUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
                return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
            })
            .sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date))
            .slice(0, 5);

        // Stock levels for chart
        const stockLevels = [
            { name: 'In Stock', value: totalInventoryItems - lowStockItems - expiredItems, color: '#10B981' },
            { name: 'Low Stock', value: lowStockItems, color: '#F59E0B' },
            { name: 'Expired', value: expiredItems, color: '#EF4444' }
        ];

        setStats(prev => ({
            ...prev,
            totalInventoryItems,
            lowStockItems,
            expiringItems,
            expiredItems,
            inventoryValue
        }));

        setStockLevels(stockLevels);
        setLowStockAlerts(lowStockAlerts);
        setExpiringDrugs(expiringDrugs);
    };

    const processOrderData = (orderData) => {
        const now = new Date();
        const timeframeDays = parseInt(selectedTimeframe);
        const startDate = new Date(now.getTime() - (timeframeDays * 24 * 60 * 60 * 1000));

        // Filter orders within timeframe
        const filteredOrders = orderData.filter(order =>
            new Date(order.created_at) >= startDate
        );

        // Calculate order stats
        const totalOrders = orderData.length;
        const pendingOrders = orderData.filter(order => order.status === 'pending').length;
        const completedOrders = orderData.filter(order => order.status === 'completed').length;

        const totalRevenue = orderData
            .filter(order => order.status === 'completed')
            .reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0);

        const monthlyRevenue = orderData
            .filter(order => {
                const orderDate = new Date(order.created_at);
                const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
                return orderDate >= thirtyDaysAgo && order.status === 'completed';
            })
            .reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0);

        const averageOrderValue = totalOrders > 0 ? totalRevenue / completedOrders : 0;

        // Calculate revenue growth (compare last 30 days with previous 30 days)
        const previousMonthRevenue = orderData
            .filter(order => {
                const orderDate = new Date(order.created_at);
                const sixtyDaysAgo = new Date(now.getTime() - (60 * 24 * 60 * 60 * 1000));
                const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
                return orderDate >= sixtyDaysAgo && orderDate < thirtyDaysAgo && order.status === 'completed';
            })
            .reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0);

        const revenueGrowth = previousMonthRevenue > 0 ?
            ((monthlyRevenue - previousMonthRevenue) / previousMonthRevenue) * 100 : 0;

        // Process order status distribution
        const statusCounts = orderData.reduce((acc, order) => {
            acc[order.status] = (acc[order.status] || 0) + 1;
            return acc;
        }, {});

        const orderStatusData = Object.entries(statusCounts).map(([status, count]) => ({
            name: statusConfig[status]?.label || status,
            value: count,
            color: statusConfig[status]?.color || '#6B7280'
        }));

        // Process order trends (last 14 days)
        const trendData = {};
        const last14Days = new Date(now.getTime() - (14 * 24 * 60 * 60 * 1000));

        orderData.filter(order => new Date(order.created_at) >= last14Days)
            .forEach(order => {
                const date = new Date(order.created_at).toLocaleDateString();
                if (!trendData[date]) {
                    trendData[date] = { orders: 0, revenue: 0 };
                }
                trendData[date].orders += 1;
                if (order.status === 'completed') {
                    trendData[date].revenue += parseFloat(order.total_amount || 0);
                }
            });

        const orderTrends = Object.entries(trendData)
            .sort(([a], [b]) => new Date(a) - new Date(b))
            .map(([date, data]) => ({
                date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                orders: data.orders,
                revenue: Math.round(data.revenue)
            }));

        // Process monthly revenue data (last 6 months)
        const monthlyData = {};
        orderData.forEach(order => {
            if (order.status === 'completed') {
                const month = new Date(order.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short'
                });
                monthlyData[month] = (monthlyData[month] || 0) + parseFloat(order.total_amount || 0);
            }
        });

        const revenueData = Object.entries(monthlyData)
            .sort(([a], [b]) => new Date(a) - new Date(b))
            .slice(-6)
            .map(([month, amount]) => ({
                month,
                revenue: Math.round(amount)
            }));

        setStats(prev => ({
            ...prev,
            totalOrders,
            pendingOrders,
            completedOrders,
            totalRevenue,
            monthlyRevenue,
            averageOrderValue,
            revenueGrowth
        }));

        setOrderStatusData(orderStatusData);
        setOrderTrends(orderTrends);
        setRevenueData(revenueData);
    };

    const processDrugData = (drugData) => {
        // Process drug category distribution
        const categoryCount = drugData.reduce((acc, drug) => {
            acc[drug.category] = (acc[drug.category] || 0) + 1;
            return acc;
        }, {});

        const categoryDistribution = Object.entries(categoryCount).map(([category, count]) => ({
            name: category.charAt(0).toUpperCase() + category.slice(1).replace('_', ' '),
            value: count,
            color: COLORS[Object.keys(categoryCount).indexOf(category) % COLORS.length]
        }));

        setCategoryDistribution(categoryDistribution);
    };

    const formatCurrency = (amount) => {
        return `${Math.round(parseFloat(amount || 0)).toLocaleString()} RWF`;
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
    };

    const getRecentOrders = () => {
        return orders
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 5);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="flex flex-col items-center space-y-4">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    <p className="text-gray-600">Loading pharmacy dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Pharmacy Dashboard
                    </h1>
                    <p className="text-sm text-gray-600 mt-1">
                        Monitor your pharmacy operations, inventory, and performance
                    </p>
                </div>
                <div className="flex items-center space-x-3 mt-4 sm:mt-0">
                    <select
                        value={selectedTimeframe}
                        onChange={(e) => setSelectedTimeframe(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="7">Last 7 days</option>
                        <option value="30">Last 30 days</option>
                        <option value="90">Last 90 days</option>
                    </select>
                    <button
                        onClick={initializeDashboard}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                            <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-green-100">
                            <DollarSign className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm">
                        {stats.revenueGrowth >= 0 ? (
                            <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                        ) : (
                            <TrendingDown className="w-4 h-4 text-red-600 mr-1" />
                        )}
                        <span className={stats.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {Math.abs(stats.revenueGrowth).toFixed(1)}% vs last month
                        </span>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Orders</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-blue-100">
                            <ShoppingCart className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm">
                        <span className="text-yellow-600 font-medium">
                            {stats.pendingOrders} pending
                        </span>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Inventory Items</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.totalInventoryItems}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-purple-100">
                            <Package className="w-6 h-6 text-purple-600" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm">
                        <span className="text-orange-600 font-medium">
                            {stats.lowStockItems} low stock
                        </span>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Inventory Value</p>
                            <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.inventoryValue)}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-indigo-100">
                            <Pill className="w-6 h-6 text-indigo-600" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm">
                        <span className="text-red-600 font-medium">
                            {stats.expiredItems} expired items
                        </span>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Trends */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-gray-900">Revenue Trends</h3>
                        <TrendingUp className="w-5 h-5 text-gray-400" />
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={revenueData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip formatter={(value) => [formatCurrency(value), 'Revenue']} />
                            <Area type="monotone" dataKey="revenue" stroke="#10B981" fill="#10B981" fillOpacity={0.3} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Order Trends */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-gray-900">Daily Order Trends</h3>
                        <BarChart3 className="w-5 h-5 text-gray-400" />
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <RechartsLineChart data={orderTrends}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Line type="monotone" dataKey="orders" stroke="#3B82F6" strokeWidth={2} />
                        </RechartsLineChart>
                    </ResponsiveContainer>
                </div>

                {/* Stock Status Distribution */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-gray-900">Stock Status</h3>
                        <PieChart className="w-5 h-5 text-gray-400" />
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <RechartsPieChart>
                            <Pie
                                data={stockLevels}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {stockLevels.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </RechartsPieChart>
                    </ResponsiveContainer>
                </div>

                {/* Order Status Distribution */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-gray-900">Order Status</h3>
                        <Activity className="w-5 h-5 text-gray-400" />
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={orderStatusData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="value" fill="#8884d8">
                                {orderStatusData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Alerts and Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Low Stock Alerts */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-gray-900">Low Stock Alerts</h3>
                        <AlertTriangle className="w-5 h-5 text-orange-500" />
                    </div>
                    <div className="space-y-4">
                        {lowStockAlerts.length > 0 ? (
                            lowStockAlerts.map((item) => (
                                <div key={item.id} className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                                        <Pill className="w-5 h-5 text-orange-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-900">{item.drug?.name}</p>
                                        <p className="text-xs text-orange-600">
                                            Only {item.quantity_available} left (Threshold: {item.low_stock_threshold})
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center text-gray-500 py-4">
                                <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                                <p className="text-sm">All items well stocked</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Expiring Items */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-gray-900">Expiring Soon</h3>
                        <Clock className="w-5 h-5 text-red-500" />
                    </div>
                    <div className="space-y-4">
                        {expiringDrugs.length > 0 ? (
                            expiringDrugs.map((item) => (
                                <div key={item.id} className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg border border-red-200">
                                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                                        <Clock className="w-5 h-5 text-red-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-900">{item.drug?.name}</p>
                                        <p className="text-xs text-red-600">
                                            Expires: {formatDate(item.expiry_date)}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center text-gray-500 py-4">
                                <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                                <p className="text-sm">No items expiring soon</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent Orders */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
                        <ShoppingCart className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="space-y-4">
                        {getRecentOrders().length > 0 ? (
                            getRecentOrders().map((order) => (
                                <div key={order.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                        <Users className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-900">
                                            {order.patient?.user?.first_name} {order.patient?.user?.last_name}
                                        </p>
                                        <p className="text-xs text-gray-500">{formatCurrency(order.total_amount)}</p>
                                        <p className="text-xs text-gray-500">{formatDate(order.created_at)}</p>
                                    </div>
                                    <span className={`px-2 py-1 text-xs rounded-full ${statusConfig[order.status]?.bg} ${statusConfig[order.status]?.text}`}>
                                        {statusConfig[order.status]?.label || order.status}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div className="text-center text-gray-500 py-4">
                                <ShoppingCart className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                <p className="text-sm">No recent orders</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Performance Insights */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-6 shadow-sm border border-blue-200">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Performance Insights</h3>
                    <Activity className="w-5 h-5 text-blue-600" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white rounded-lg p-4">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                <Target className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-900">Order Completion</p>
                                <p className="text-xs text-gray-500">
                                    {stats.totalOrders > 0 ? Math.round((stats.completedOrders / stats.totalOrders) * 100) : 0}% completion rate
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg p-4">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <DollarSign className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-900">Avg Order Value</p>
                                <p className="text-xs text-gray-500">
                                    {formatCurrency(stats.averageOrderValue)}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg p-4">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-900">Stock Alerts</p>
                                <p className="text-xs text-gray-500">
                                    {stats.lowStockItems + stats.expiringItems} items need attention
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg p-4">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                <Zap className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-900">Monthly Growth</p>
                                <p className="text-xs text-gray-500">
                                    {stats.revenueGrowth >= 0 ? '+' : ''}{stats.revenueGrowth.toFixed(1)}% revenue
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
                    <Zap className="w-5 h-5 text-gray-400" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <button className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <Package className="w-8 h-8 text-blue-600 mb-2" />
                        <span className="text-sm font-medium text-gray-900">Add Inventory</span>
                        <span className="text-xs text-gray-500">Add new stock</span>
                    </button>

                    <button className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <Eye className="w-8 h-8 text-green-600 mb-2" />
                        <span className="text-sm font-medium text-gray-900">View Orders</span>
                        <span className="text-xs text-gray-500">Manage requests</span>
                    </button>

                    <button className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <BarChart3 className="w-8 h-8 text-purple-600 mb-2" />
                        <span className="text-sm font-medium text-gray-900">View Reports</span>
                        <span className="text-xs text-gray-500">Detailed analytics</span>
                    </button>

                    <button className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <Pill className="w-8 h-8 text-indigo-600 mb-2" />
                        <span className="text-sm font-medium text-gray-900">Drug Catalog</span>
                        <span className="text-xs text-gray-500">Browse medications</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PharmacyDashboard;