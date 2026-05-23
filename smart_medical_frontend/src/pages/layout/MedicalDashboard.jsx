import React, { useState, useEffect } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import {
    Users, BarChart2, Menu, X, Bell, Search, Settings, LogOut, User, ChevronDown,
    Home, ChevronRight, Trophy, ChevronUp, Calendar, Package, TrendingUp,
    FileText, CreditCard, Target, PlusCircle, List, Eye, DollarSign,
    BarChart3, Clock, AlertCircle, UserCheck, Building2, Pill, Stethoscope
} from 'lucide-react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { getCurrentUser } from '../../api';


const MedicalDashboard = ({ activePage, onPageChange }) => {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [activeMenuItem, setActiveMenuItem] = useState(activePage || '/dashboard/overview');
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [expandedMenus, setExpandedMenus] = useState({});
    const [hoveredItem, setHoveredItem] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // User Data Management
    const getUserData = () => {
        try {
            const storedUserData = getCurrentUser();

            if (storedUserData) {
                const userData = storedUserData;
                return {
                    first_name: userData.first_name || userData.email.split('@')[0],
                    last_name: userData.last_name || '',
                    email: userData.email || 'john@smartmedical.rw',
                    role: userData.user_type || '',
                    user_type: userData.user_type?.toLowerCase() || ''
                };
            }
            return {
                first_name: '',
                last_name: '',
                email: 'demo@smartmedical.rw',
                role: '',
                user_type: ''
            };
        } catch (error) {
            console.error('Error getting user data:', error);
            return {
                first_name: '',
                last_name: '',
                email: 'demo@smartmedical.rw',
                role: '',
                user_type: ''
            };
        }
    };

    const userdata = getUserData();

    // Menu Configuration
    const coreMenuItems = [
        {
            name: 'Dashboard Overview',
            icon: <Home className="w-5 h-5" />,
            path: '/dashboard/system/overview',
            description: 'Main Dashboard',
            badge: null,
            color: 'from-blue-500 to-blue-600',
            roles: ['admin'],
            hasSubItems: false,
        },
        {
            name: 'Dashboard Overview',
            icon: <Home className="w-5 h-5" />,
            path: '/dashboard/pharmacy/overview',
            description: 'Main Dashboard',
            badge: null,
            color: 'from-blue-500 to-blue-600',
            roles: ['pharmacy'],
            hasSubItems: false,
        },
        {
            name: 'Dashboard Overview',
            icon: <Home className="w-5 h-5" />,
            path: '/dashboard/patient/overview',
            description: 'Main Dashboard',
            badge: null,
            color: 'from-blue-500 to-blue-600',
            roles: ['patient'],
            hasSubItems: false,
        },
        {
            name: 'Dashboard Overview',
            icon: <Home className="w-5 h-5" />,
            path: '/dashboard/doctor/overview',
            description: 'Main Dashboard',
            badge: null,
            color: 'from-blue-500 to-blue-600',
            roles: ['doctor'],
            hasSubItems: false,
        },
        {
            name: 'Appointments',
            icon: <Calendar className="w-5 h-5" />,
            path: '/dashboard/appointments',
            description: 'Medical Appointments',
            badge: null,
            color: 'from-green-500 to-green-600',
            roles: ['patient', 'doctor'],
            hasSubItems: true,
            subItems: [
                {
                    name: 'View Appointments',
                    path: '/dashboard/appointments/list',
                    icon: <List className="w-4 h-4" />,
                    description: 'View all appointments',
                    roles: ['doctor']
                },
                {
                    name: 'Book Appointment',
                    path: '/dashboard/appointments/book',
                    icon: <PlusCircle className="w-4 h-4" />,
                    description: 'Schedule new appointment',
                    roles: ['patient']
                },
                {
                    name: 'Pending Requests',
                    path: '/dashboard/appointments/pending/list',
                    icon: <Clock className="w-4 h-4" />,
                    description: 'Appointment requests',
                    roles: ['doctor']
                },
                {
                    name: 'Appointment Report',
                    path: '/dashboard/patient/appointment/report',
                    icon: <Users className="w-4 h-4" />,
                    description: 'Drugs Report',
                    roles: ['patient']
                },
                {
                    name: 'Appointment Report',
                    path: '/dashboard/doctor/appointment/report',
                    icon: <Users className="w-4 h-4" />,
                    description: 'Drugs Report',
                    roles: ['doctor']
                },
            ]
        },
        {
            name: 'Prescriptions',
            icon: <Pill className="w-5 h-5" />,
            path: '/dashboard/prescriptions',
            description: 'Prescription Analytics',         
            color: 'from-purple-500 to-purple-600',
            roles: ['doctor'],
            hasSubItems: true,
            subItems: [
                {
                    name: 'View Prescriptions',
                    path: '/dashboard/prescriptions/list',
                    icon: <List className="w-4 h-4" />,
                    description: 'View all prescriptions',
                    roles: ['doctor']
                },

            ]
        },
        {
            name: 'Pharmacy Inventory',
            icon: <Package className="w-5 h-5" />,
            path: '/dashboard/inventory',
            description: 'Drug Stock Management',
            badge: null,
            color: 'from-orange-500 to-orange-600',
            roles: ['pharmacy'],
            hasSubItems: true,
            subItems: [
                {
                    name: 'View Inventory',
                    path: '/dashboard/inventory/list',
                    icon: <List className="w-4 h-4" />,
                    description: 'Manage drug inventory',
                    roles: ['pharmacy']
                },
                {
                    name: 'Inventory Report',
                    path: '/dashboard/invetory/report',
                    icon: <Users className="w-4 h-4" />,
                    description: 'Inventory Report',
                    roles: ['pharmacy']
                },
            ]
        },
        {
            name: 'Drugs Requests',
            icon: <CreditCard className="w-5 h-5" />,
            path: '/dashboard/payments',
            description: 'Financial Transactions',
            badge: 'NEW',
            color: 'from-emerald-500 to-emerald-600',
            roles: ['patient', 'pharmacy'],
            hasSubItems: true,
            subItems: [
                {
                    name: 'Requests',
                    path: '/dashboard/patients/request/list',
                    icon: <List className="w-4 h-4" />,
                    description: 'View payment records',
                    roles: ['patient']
                },
                {
                    name: 'Requests',
                    path: '/dashboard/pharmacy/request/list',
                    icon: <List className="w-4 h-4" />,
                    description: 'View payment records',
                    roles: ['pharmacy']
                },
                {
                    name: 'Drugs Report',
                    path: '/dashboard/drugs/report',
                    icon: <Users className="w-4 h-4" />,
                    description: 'Drugs Report',
                    roles: ['admin']
                },
                {
                    name: 'Request Report',
                    path: '/dashboard/request/report',
                    icon: <Users className="w-4 h-4" />,
                    description: 'Request Report',
                    roles: ['pharmacy']
                },
            ]
        },

        {
            name: 'User Management',
            icon: <Users className="w-5 h-5" />,
            path: '/dashboard/users',
            description: 'System Administration',
            badge: null,
            color: 'from-red-500 to-red-600',
            roles: ['admin'],
            hasSubItems: true,
            subItems: [
                {
                    name: 'All Users',
                    path: '/dashboard/users/list',
                    icon: <Users className="w-4 h-4" />,
                    description: 'User management',
                    roles: ['admin']
                },
                {
                    name: 'Users Report',
                    path: '/dashboard/users/report',
                    icon: <Users className="w-4 h-4" />,
                    description: 'User Report',
                    roles: ['admin']
                },


            ]
        },
        {
            name: 'Healthcare Providers',
            icon: <Building2 className="w-5 h-5" />,
            path: '/dashboard/providers',
            description: 'Hospitals & Doctors',
            badge: null,
            color: 'from-cyan-500 to-cyan-600',
            roles: ['patient', 'admin'],
            hasSubItems: true,
            subItems: [
                {
                    name: 'Manage Providers',
                    path: '/dashboard/providers/manage',
                    icon: <Settings className="w-4 h-4" />,
                    description: 'Provider management',
                    roles: ['admin']
                }
            ]
        },
        {
            name: 'Drugs Management',
            icon: <Pill className="w-5 h-5" />,
            path: '/dashboard/drugs',
            description: 'Medication Repository',
            badge: null,
            color: 'from-pink-500 to-pink-600',
            roles: ['admin', 'doctor', 'pharmacy'],
            hasSubItems: true,
            subItems: [
                {
                    name: 'Browse Drugs',
                    path: '/dashboard/all/drugs/list',
                    icon: <Search className="w-4 h-4" />,
                    description: 'Search medication database',
                    roles: ['doctor', 'pharmacy']
                },
                {
                    name: 'Browse Drugs',
                    path: '/dashboard/drugs/list',
                    icon: <Search className="w-4 h-4" />,
                    description: 'Search medication database',
                    roles: ['admin']
                },

            ]
        }
    ];

    // Filter menu items based on user role
    const getFilteredMenuItems = () => {
        return coreMenuItems.filter(item => {
            if (item.hasSubItems && item.subItems) {
                item.subItems = item.subItems.filter(subItem =>
                    subItem.roles.includes(userdata.user_type)
                );
                return item.subItems.length > 0;
            }
            return item.roles.includes(userdata.user_type);
        });
    };

    const menuItems = getFilteredMenuItems();

    // Effects and Handlers
    useEffect(() => {
        const timer = setTimeout(() => {
            setLoading(false);
        }, 1000);
        return () => clearTimeout(timer);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_data');
        toast.success('Logged out successfully');
        navigate('/login', { replace: true });
    };

    const handleMenuClick = (path, hasSubItems = false, isExternal = false) => {
        if (hasSubItems) {
            setExpandedMenus(prev => ({
                ...prev,
                [path]: !prev[path]
            }));
        } else {
            setActiveMenuItem(path);
            if (onPageChange) {
                const pageId = path.split('/').pop();
                onPageChange(pageId);
            }
            if (!isExternal) {
                navigate(path);
            }
        }
    };

    const handleSubMenuClick = (path) => {
        setActiveMenuItem(path);
        if (onPageChange) {
            const pageId = path.split('/').pop();
            onPageChange(pageId);
        }
        navigate(path);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="flex flex-col items-center space-y-4">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-600">Loading Smart Medical Dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Sidebar */}
            <div className={`fixed inset-y-0 left-0 z-50 w-80 bg-gradient-to-b from-blue-900 to-blue-800 border-r border-blue-700 transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 shadow-xl`}>
                {/* Logo Section */}
                <div className="flex items-center justify-center h-40 px-6 border-b border-green-700 bg-gradient-to-r from-green-900 to-green-900">
                    <div className="flex items-center text-white justify-center">
                        <div className="relative group">
                            <img
                                src="/public/Images/log4.jpeg"
                                alt="Smart Medical Logo"
                                className="w-28 h-20 rounded-full"
                            />
                        </div>
                        <div className="ml-3">
                            <h1 className="text-xl font-bold text-white">Smart Medical</h1>
                            <p className="text-xs text-green-200">Prescription Management System</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="lg:hidden absolute top-4 right-4 p-2 text-green-100 hover:text-white hover:bg-green-700 rounded-lg transition-all duration-200"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="mt-6 px-4 space-y-1 h-[78vh] overflow-auto">
                    <div className="mb-6">
                        <h3 className="text-xs font-semibold text-green-200 uppercase tracking-wider px-3 mb-3">
                            Main Menu ({userdata.role})
                        </h3>
                    </div>

                    <div className="space-y-1">
                        {menuItems.map((item, index) => (
                            <div key={`${item.path}-${index}`} className="relative group">
                                <div
                                    className="relative group"
                                    onMouseEnter={() => setHoveredItem(`${item.path}-${index}`)}
                                    onMouseLeave={() => setHoveredItem(null)}
                                >
                                    <button
                                        onClick={() => handleMenuClick(item.path, item.hasSubItems, item.isExternal)}
                                        className={`    
                                            w-full flex items-center justify-between p-3 rounded-xl text-left
                                            transition-all duration-300 ease-out relative overflow-hidden
                                            transform hover:scale-[1.02] hover:shadow-lg
                                            ${(activeMenuItem === item.path || (item.subItems && item.subItems.some(sub => sub.path === activeMenuItem)))
                                                ? 'bg-white text-green-900 shadow-md shadow-white/10 border border-gray-200'
                                                : 'text-green-100 hover:bg-green-800/50 hover:text-white hover:shadow-md'
                                            }
                                        `}
                                    >
                                        <div className={`
                                            absolute inset-0 bg-gradient-to-r ${item.color} opacity-0
                                            transition-opacity duration-300 rounded-xl
                                            ${hoveredItem === `${item.path}-${index}` && activeMenuItem !== item.path ? 'opacity-10' : ''}
                                        `}></div>

                                        <div className="flex items-center space-x-3 relative z-10">
                                            <div className={`
                                                relative p-2 rounded-lg transition-all duration-300
                                                ${(activeMenuItem === item.path || (item.subItems && item.subItems.some(sub => sub.path === activeMenuItem)))
                                                    ? `bg-gradient-to-br ${item.color} text-white shadow-lg shadow-green-500/25`
                                                    : 'bg-green-800/50 text-green-200 group-hover:bg-green-700/60 group-hover:shadow-md'
                                                }
                                            `}>
                                                {item.icon}
                                                {(activeMenuItem === item.path || (item.subItems && item.subItems.some(sub => sub.path === activeMenuItem))) && (
                                                    <div className="absolute inset-0 bg-white/20 rounded-lg animate-pulse"></div>
                                                )}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center space-x-2">
                                                    <span className={`
                                                        font-semibold text-sm transition-colors duration-200
                                                        ${(activeMenuItem === item.path || (item.subItems && item.subItems.some(sub => sub.path === activeMenuItem))) ? 'text-green-900' : 'text-green-100'}
                                                    `}>
                                                        {item.name}
                                                    </span>
                                                    {(activeMenuItem === item.path || (item.subItems && item.subItems.some(sub => sub.path === activeMenuItem))) && (
                                                        <Trophy className="w-3 h-3 text-green-300 animate-pulse" />
                                                    )}
                                                </div>
                                                {item.description && (
                                                    <p className={`
                                                        text-xs transition-colors duration-200 mt-0.5
                                                        ${(activeMenuItem === item.path || (item.subItems && item.subItems.some(sub => sub.path === activeMenuItem))) ? 'text-gray-600' : 'text-blue-300'}
                                                    `}>
                                                        {item.description}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-2 relative z-10">
                                            {item.badge && (
                                                <span className={`
                                                    px-2 py-1 rounded-full text-xs font-bold transition-all duration-200
                                                    ${item.badge === 'HOT'
                                                        ? 'bg-red-500/80 text-white shadow-sm animate-pulse'
                                                        : item.badge === 'NEW'
                                                            ? 'bg-green-500/80 text-white shadow-sm'
                                                            : (activeMenuItem === item.path || (item.subItems && item.subItems.some(sub => sub.path === activeMenuItem)))
                                                                ? 'bg-blue-400/30 text-white shadow-sm'
                                                                : 'bg-blue-600/80 text-white group-hover:bg-blue-500'
                                                    }
                                                `}>
                                                    {item.badge}
                                                </span>
                                            )}
                                            {item.hasSubItems ? (
                                                expandedMenus[item.path] ? (
                                                    <ChevronUp className="w-4 h-4 text-blue-200 transition-all duration-300" />
                                                ) : (
                                                    <ChevronDown className="w-4 h-4 text-blue-300 transition-all duration-300" />
                                                )
                                            ) : (
                                                <ChevronRight className={`
                                                    w-4 h-4 transition-all duration-300
                                                    ${(activeMenuItem === item.path || (item.subItems && item.subItems.some(sub => sub.path === activeMenuItem)))
                                                        ? 'text-blue-200 transform translate-x-1'
                                                        : 'text-blue-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-1'
                                                    }
                                                `} />
                                            )}
                                        </div>

                                        {(activeMenuItem === item.path || (item.subItems && item.subItems.some(sub => sub.path === activeMenuItem))) && (
                                            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-white to-blue-200 rounded-r-full shadow-lg shadow-white/50"></div>
                                        )}
                                    </button>

                                    {hoveredItem === `${item.path}-${index}` && activeMenuItem !== item.path && !item.subItems?.some(sub => sub.path === activeMenuItem) && (
                                        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-0.5 h-6 bg-gradient-to-b from-blue-300 to-blue-200 rounded-r-full transition-all duration-300"></div>
                                    )}
                                </div>

                                {item.hasSubItems && expandedMenus[item.path] && (
                                    <div className="ml-6 mt-2 space-y-1 animate-in slide-in-from-top-2 duration-200">
                                        {item.subItems.map((subItem, subIndex) => (
                                            <button
                                                key={`${subItem.path}-${subIndex}`}
                                                onClick={() => handleSubMenuClick(subItem.path)}
                                                className={`
                                                    w-full flex items-center justify-between p-3 rounded-lg text-left
                                                    transition-all duration-200 relative border-l-2 mb-2
                                                    ${activeMenuItem === subItem.path
                                                        ? 'bg-blue-500/20 text-white border-blue-300 shadow-sm'
                                                        : 'text-blue-200 hover:bg-blue-700/30 hover:text-white border-blue-600 hover:border-blue-400'
                                                    }
                                                `}
                                            >
                                                <div className="flex items-center space-x-3">
                                                    <div className={`
                                                        p-1.5 rounded-md transition-all duration-200
                                                        ${activeMenuItem === subItem.path
                                                            ? 'bg-blue-400/30 text-white'
                                                            : 'bg-blue-800/40 text-blue-200 group-hover:bg-blue-700/50'
                                                        }
                                                    `}>
                                                        {subItem.icon}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center space-x-2">
                                                            <span className={`
                                                                font-medium text-sm transition-colors duration-200
                                                                ${activeMenuItem === subItem.path ? 'text-white' : 'text-blue-200'}
                                                            `}>
                                                                {subItem.name}
                                                            </span>
                                                            {activeMenuItem === subItem.path && (
                                                                <div className="w-1.5 h-1.5 bg-blue-300 rounded-full animate-pulse"></div>
                                                            )}
                                                        </div>
                                                        {subItem.description && (
                                                            <p className={`
                                                                text-xs transition-colors duration-200 mt-0.5
                                                                ${activeMenuItem === subItem.path ? 'text-blue-200' : 'text-blue-400'}
                                                            `}>
                                                                {subItem.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                <ChevronRight className={`
                                                    w-3 h-3 transition-all duration-300
                                                    ${activeMenuItem === subItem.path
                                                        ? 'text-blue-200 transform translate-x-0.5'
                                                        : 'text-blue-300 opacity-0 group-hover:opacity-100'
                                                    }
                                                `} />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </nav>
            </div>

            {/* Main Content */}
            <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-80' : 'ml-0'}`}>
                {/* Header */}
                <header className="bg-white backdrop-blur-md border-b border-gray-100 px-6 py-4 shadow-sm sticky top-0 z-40">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-6">
                            {/* <button
                                onClick={() => setSidebarOpen(!sidebarOpen)}
                                className="p-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all duration-200"
                            >
                                <Menu className="w-5 h-5" />
                            </button> */}

                            <div className="relative hidden md:flex items-center">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Search className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    className="w-80 pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm placeholder-gray-500 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-200"
                                    placeholder="Search appointments, prescriptions, drugs..."
                                />
                            </div>

                            <div className="hidden lg:flex items-center space-x-2 text-sm text-gray-500">
                                <span>Smart Medical</span>
                                <span>/</span>
                                <span className="text-gray-900 font-medium">
                                    {(() => {
                                        const mainItem = menuItems.find(item => item.path === activeMenuItem);
                                        if (mainItem) return mainItem.name;

                                        for (const item of menuItems) {
                                            if (item.subItems) {
                                                const subItem = item.subItems.find(sub => sub.path === activeMenuItem);
                                                if (subItem) return `${item.name} / ${subItem.name}`;
                                            }
                                        }
                                        return 'Dashboard';
                                    })()}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center space-x-3">
                         
                          
                            <div className="relative">
                                <button
                                    onClick={() => setDropdownOpen(!dropdownOpen)}
                                    className="flex items-center space-x-3 pl-3 pr-2 py-2 text-sm rounded-xl hover:bg-gray-50 transition-all duration-200 border border-transparent hover:border-gray-200"
                                >
                                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center ring-2 ring-white shadow-sm">
                                        <span className="text-white text-sm font-medium">
                                            {userdata.first_name?.[0]?.toUpperCase()}{userdata.last_name?.[0]?.toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="hidden md:block text-left">
                                        <p className="font-medium text-gray-900 leading-tight">
                                            {userdata.first_name} {userdata.last_name}
                                        </p>
                                        <p className="text-xs text-gray-500">{userdata.role}</p>
                                    </div>
                                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {dropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-in slide-in-from-top-2 duration-200">
                                        <div className="px-4 py-3 border-b border-gray-50">
                                            <p className="font-medium text-gray-900">
                                                {userdata.first_name} {userdata.last_name}
                                            </p>
                                            <p className="text-sm text-gray-500">{userdata.email}</p>
                                            <p className="text-xs text-blue-600 font-medium">{userdata.role}</p>
                                        </div>

                                        <div className="py-1">
                                            <button
                                                onClick={() => {
                                                    setDropdownOpen(false);
                                                    navigate('/dashboard/user/profile');
                                                }}
                                                className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer w-full text-left"
                                            >
                                                <User className="w-4 h-4 mr-3" />
                                                Profile Settings
                                            </button>

                                        </div>

                                        <div className="border-t border-gray-50 py-1">
                                            <button
                                                onClick={handleLogout}
                                                className="flex items-center px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer w-full text-left"
                                            >
                                                <LogOut className="w-4 h-4 mr-3" />
                                                Sign Out
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="py-6 px-6 max-w-8xl mx-auto">
                    <Outlet />
                </main>
            </div>

            {/* Mobile Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                ></div>
            )}
        </div>
    );
};

export default MedicalDashboard;