import React, { useState, useEffect } from 'react';
import {
    Users, Search, Filter, Plus, Eye, Edit, Trash2, Phone, Mail, MapPin,
    Calendar, Clock, Shield, AlertCircle, CheckCircle, XCircle, User,
    Stethoscope, Building2, Pill, MoreVertical, Download, RefreshCw
} from 'lucide-react';
import { toast } from 'react-toastify';
import { authService } from '../../api';

const UsersManagement = () => {
    const [users, setUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUserType, setSelectedUserType] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [usersPerPage] = useState(10);
    const [selectedUser, setSelectedUser] = useState(null);
    const [showUserModal, setShowUserModal] = useState(false);
    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {

        try {

            const response = await authService.getAllUsers();
            console.log(response)
            if (response.success) {
                setUsers(response.data.results);
            } else {
                toast.error('Failed to fetch users');
            }


        } catch (error) {
            console.error('Error fetching users:', error);
            toast.error('Failed to fetch users');

        }
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch =
            user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.phone_number.includes(searchTerm);

        const matchesUserType = selectedUserType === 'all' || user.user_type === selectedUserType;

        const matchesStatus =
            selectedStatus === 'all' ||
            (selectedStatus === 'active' && user.is_active) ||
            (selectedStatus === 'inactive' && !user.is_active) ||
            (selectedStatus === 'verified' && user.is_phone_verified) ||
            (selectedStatus === 'unverified' && !user.is_phone_verified);

        return matchesSearch && matchesUserType && matchesStatus;
    });

    const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
    const startIndex = (currentPage - 1) * usersPerPage;
    const paginatedUsers = filteredUsers.slice(startIndex, startIndex + usersPerPage);

    const getUserTypeIcon = (userType) => {
        switch (userType) {
            case 'doctor': return <Stethoscope className="w-4 h-4" />;
            case 'pharmacy': return <Building2 className="w-4 h-4" />;
            case 'patient': return <User className="w-4 h-4" />;
            case 'admin': return <Shield className="w-4 h-4" />;
            default: return <User className="w-4 h-4" />;
        }
    };

    const getUserTypeColor = (userType) => {
        switch (userType) {
            case 'doctor': return 'bg-blue-100 text-blue-800';
            case 'pharmacy': return 'bg-green-100 text-green-800';
            case 'patient': return 'bg-purple-100 text-purple-800';
            case 'admin': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const handleViewUser = (user) => {
        setSelectedUser(user);
        setShowUserModal(true);
    };



    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Users Management</h1>
                    <p className="text-sm text-gray-600 mt-1">
                        Manage all system users and their profiles
                    </p>
                </div>
                <div className="flex items-center space-x-3 mt-4 sm:mt-0">
                    <button
                        onClick={fetchUsers}
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
                    { label: 'Total Users', value: users.length, icon: Users, color: 'blue' },
                    { label: 'Active Users', value: users.filter(u => u.is_active).length, icon: CheckCircle, color: 'green' },
                    { label: 'Verified Users', value: users.filter(u => u.is_phone_verified).length, icon: Shield, color: 'purple' },
                    { label: 'Doctors', value: users.filter(u => u.user_type === 'doctor').length, icon: Stethoscope, color: 'indigo' }
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
                            placeholder="Search users..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <select
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={selectedUserType}
                        onChange={(e) => setSelectedUserType(e.target.value)}
                    >
                        <option value="all">All User Types</option>
                        <option value="patient">Patients</option>
                        <option value="doctor">Doctors</option>
                        <option value="pharmacy">Pharmacies</option>
                        <option value="admin">Admins</option>
                    </select>

                    <select
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                    >
                        <option value="all">All Statuses</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="verified">Verified</option>
                        <option value="unverified">Unverified</option>
                    </select>

                    <button className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors">
                        <Download className="w-4 h-4 mr-2" />
                        Export
                    </button>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {paginatedUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                                                <span className="text-white text-sm font-medium">
                                                    {user.first_name[0]}{user.last_name[0]}
                                                </span>
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {user.first_name} {user.last_name}
                                                </div>
                                                <div className="text-sm text-gray-500">@{user.username}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getUserTypeColor(user.user_type)}`}>
                                            {getUserTypeIcon(user.user_type)}
                                            <span className="ml-1 capitalize">{user.user_type}</span>
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        <div className="space-y-1">
                                            <div className="flex items-center">
                                                <Mail className="w-4 h-4 text-gray-400 mr-2" />
                                                {user.email}
                                            </div>
                                            <div className="flex items-center">
                                                <Phone className="w-4 h-4 text-gray-400 mr-2" />
                                                {user.phone_number}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        <div className="flex items-center">
                                            <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                                            {user.location || 'Not specified'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="space-y-1">
                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                }`}>
                                                {user.is_active ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                                                {user.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                            {user.is_phone_verified && (
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    <Shield className="w-3 h-3 mr-1" />
                                                    Verified
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        <div className="flex items-center">
                                            <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                                            {formatDate(user.created_at)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex items-center justify-end space-x-2">
                                            <button
                                                onClick={() => handleViewUser(user)}
                                                className="text-blue-600 hover:text-blue-900 p-1 rounded-lg hover:bg-blue-50 transition-colors"
                                            >
                                                <Eye className="w-4 h-4" />
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
                            Showing {startIndex + 1} to {Math.min(startIndex + usersPerPage, filteredUsers.length)} of {filteredUsers.length} users
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

            {/* User Detail Modal */}
            {showUserModal && selectedUser && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900">User Details</h3>
                                <button
                                    onClick={() => setShowUserModal(false)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <XCircle className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Basic Info */}
                            <div>
                                <h4 className="text-md font-medium text-gray-900 mb-3">Basic Information</h4>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div><span className="font-medium">Name:</span> {selectedUser.first_name} {selectedUser.last_name}</div>
                                    <div><span className="font-medium">Username:</span> {selectedUser.username}</div>
                                    <div><span className="font-medium">Email:</span> {selectedUser.email}</div>
                                    <div><span className="font-medium">Phone:</span> {selectedUser.phone_number}</div>
                                    <div><span className="font-medium">Location:</span> {selectedUser.location}</div>
                                    <div><span className="font-medium">User Type:</span> {selectedUser.user_type}</div>
                                    <div><span className="font-medium">Joined:</span> {formatDate(selectedUser.created_at)}</div>
                                    <div><span className="font-medium">Status:</span> {selectedUser.is_active ? 'Active' : 'Inactive'}</div>
                                </div>
                            </div>

                            {/* Type-specific Information */}
                            {selectedUser.doctor_profile && (
                                <div>
                                    <h4 className="text-md font-medium text-gray-900 mb-3">Doctor Profile</h4>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div><span className="font-medium">License:</span> {selectedUser.doctor_profile.license_number}</div>
                                        <div><span className="font-medium">Specialization:</span> {selectedUser.doctor_profile.specialization}</div>
                                        <div><span className="font-medium">Hospital:</span> {selectedUser.doctor_profile.hospital_name}</div>
                                        <div><span className="font-medium">Experience:</span> {selectedUser.doctor_profile.experience_years} years</div>
                                        <div><span className="font-medium">Verified:</span> {selectedUser.doctor_profile.is_verified ? 'Yes' : 'No'}</div>
                                    </div>
                                </div>
                            )}

                            {selectedUser.patient_profile && (
                                <div>
                                    <h4 className="text-md font-medium text-gray-900 mb-3">Patient Profile</h4>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div><span className="font-medium">Date of Birth:</span> {selectedUser.patient_profile.date_of_birth}</div>
                                        <div><span className="font-medium">Blood Group:</span> {selectedUser.patient_profile.blood_group}</div>
                                        <div><span className="font-medium">Emergency Contact:</span> {selectedUser.patient_profile.emergency_contact}</div>
                                        <div><span className="font-medium">Allergies:</span> {selectedUser.patient_profile.allergies || 'None'}</div>
                                        <div className="col-span-2"><span className="font-medium">Medical History:</span> {selectedUser.patient_profile.medical_history || 'None'}</div>
                                    </div>
                                </div>
                            )}

                            {selectedUser.pharmacy_profile && (
                                <div>
                                    <h4 className="text-md font-medium text-gray-900 mb-3">Pharmacy Profile</h4>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div><span className="font-medium">License:</span> {selectedUser.pharmacy_profile.license_number}</div>
                                        <div><span className="font-medium">Name:</span> {selectedUser.pharmacy_profile.pharmacy_name}</div>
                                        <div><span className="font-medium">Address:</span> {selectedUser.pharmacy_profile.address}</div>
                                        <div><span className="font-medium">Verified:</span> {selectedUser.pharmacy_profile.is_verified ? 'Yes' : 'No'}</div>
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

export default UsersManagement;