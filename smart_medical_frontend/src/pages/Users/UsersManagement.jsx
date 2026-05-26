import React, { useState, useEffect } from 'react';
import {
    Users, Search, Filter, Plus, Eye, Edit, Trash2, Phone, Mail, MapPin,
    Calendar, Clock, Shield, AlertCircle, CheckCircle, XCircle, User,
    Stethoscope, Building2, Pill, MoreVertical, Download, RefreshCw,
    Loader
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

import { authService, profileService } from '../../api';

const UsersManagement = () => {
    const [users, setUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUserType, setSelectedUserType] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [usersPerPage] = useState(5);
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedUserProfile, setSelectedUserProfile] = useState(null);
    const [showUserModal, setShowUserModal] = useState(false);
    const [loadingProfile, setLoadingProfile] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await authService.getAllUsers();
            console.log(response);
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

    const fetchUserProfile = async (user) => {
        setLoadingProfile(true);
        try {
            let profileResponse = { success: false };

            switch (user.user_type) {
                case 'doctor':
                    profileResponse = await profileService.getDoctorById(user.id);
                    break;
                case 'patient':
                    profileResponse = await profileService.getPatientById(user.id);
                    break;
                case 'pharmacy':
                    profileResponse = await profileService.getPharmacyById(user.id);
                    break;
                default:
                    // For admin users or other types without specific profiles
                    setSelectedUserProfile(null);
                    setLoadingProfile(false);
                    return;
            }

            if (profileResponse.success) {
                setSelectedUserProfile(profileResponse.data);
            } else {
                console.error('Failed to fetch profile:', profileResponse.error);
                setSelectedUserProfile(null);
            }
        } catch (error) {
            console.error('Error fetching user profile:', error);
            setSelectedUserProfile(null);
        } finally {
            setLoadingProfile(false);
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

    const handleViewUser = async (user) => {
        setSelectedUser(user);
        setSelectedUserProfile(null);
        setShowUserModal(true);

        // Fetch detailed profile information
        await fetchUserProfile(user);
    };

    const handleAddUser = () => {
        console.log('Navigate to add user page');

        navigate('/dashboard/users/add');
    };

    const closeModal = () => {
        setShowUserModal(false);
        setSelectedUser(null);
        setSelectedUserProfile(null);
        setLoadingProfile(false);
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
                        onClick={handleAddUser}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add User
                    </button>
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
                        <option value="all">User Type</option>
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
                        <option value="all">Status</option>
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
                    <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900">User Details</h3>
                                <button
                                    onClick={closeModal}
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
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div><span className="font-medium text-gray-600">Name:</span> {selectedUser.first_name} {selectedUser.last_name}</div>
                                    <div><span className="font-medium text-gray-600">Username:</span> {selectedUser.username}</div>
                                    <div><span className="font-medium text-gray-600">Email:</span> {selectedUser.email}</div>
                                    <div><span className="font-medium text-gray-600">Phone:</span> {selectedUser.phone_number}</div>
                                    <div><span className="font-medium text-gray-600">Location:</span> {selectedUser.location || 'Not specified'}</div>
                                    <div><span className="font-medium text-gray-600">User Type:</span> <span className="capitalize">{selectedUser.user_type}</span></div>
                                    <div><span className="font-medium text-gray-600">Joined:</span> {formatDate(selectedUser.created_at)}</div>
                                    <div><span className="font-medium text-gray-600">Status:</span>
                                        <span className={`ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${selectedUser.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {selectedUser.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Loading Profile */}
                            {loadingProfile && (
                                <div className="flex items-center justify-center py-8">
                                    <Loader className="w-6 h-6 animate-spin text-blue-600 mr-2" />
                                    <span className="text-gray-600">Loading profile details...</span>
                                </div>
                            )}

                            {/* Profile-specific Information */}
                            {!loadingProfile && selectedUserProfile && selectedUser.user_type === 'doctor' && (
                                <div>
                                    <h4 className="text-md font-medium text-gray-900 mb-3">Doctor Profile</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm bg-blue-50 p-4 rounded-lg">
                                        <div><span className="font-medium text-gray-600">License Number:</span> {selectedUserProfile.license_number || 'Not provided'}</div>
                                        <div><span className="font-medium text-gray-600">Specialization:</span> {selectedUserProfile.specialization || 'Not specified'}</div>
                                        <div><span className="font-medium text-gray-600">Hospital:</span> {selectedUserProfile.hospital_name || 'Not specified'}</div>
                                        <div><span className="font-medium text-gray-600">Experience:</span> {selectedUserProfile.experience_years ? `${selectedUserProfile.experience_years} years` : 'Not specified'}</div>
                                        <div><span className="font-medium text-gray-600">Consultation Fee:</span> {selectedUserProfile.consultation_fee ? `$${selectedUserProfile.consultation_fee}` : 'Not set'}</div>
                                        <div><span className="font-medium text-gray-600">Verified:</span>
                                            <span className={`ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${selectedUserProfile.is_verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                {selectedUserProfile.is_verified ? 'Verified' : 'Pending'}
                                            </span>
                                        </div>
                                        {selectedUserProfile.bio && (
                                            <div className="col-span-2"><span className="font-medium text-gray-600">Bio:</span> {selectedUserProfile.bio}</div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {!loadingProfile && selectedUserProfile && selectedUser.user_type === 'patient' && (
                                <div>
                                    <h4 className="text-md font-medium text-gray-900 mb-3">Patient Profile</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm bg-purple-50 p-4 rounded-lg">
                                        <div><span className="font-medium text-gray-600">Date of Birth:</span> {selectedUserProfile.date_of_birth ? formatDate(selectedUserProfile.date_of_birth) : 'Not provided'}</div>
                                        <div><span className="font-medium text-gray-600">Gender:</span> {selectedUserProfile.gender || 'Not specified'}</div>
                                        <div><span className="font-medium text-gray-600">Blood Group:</span> {selectedUserProfile.blood_group || 'Not specified'}</div>
                                        <div><span className="font-medium text-gray-600">Emergency Contact:</span> {selectedUserProfile.emergency_contact || 'Not provided'}</div>
                                        <div><span className="font-medium text-gray-600">Height:</span> {selectedUserProfile.height ? `${selectedUserProfile.height} cm` : 'Not provided'}</div>
                                        <div><span className="font-medium text-gray-600">Weight:</span> {selectedUserProfile.weight ? `${selectedUserProfile.weight} kg` : 'Not provided'}</div>
                                        {selectedUserProfile.allergies && (
                                            <div className="col-span-2"><span className="font-medium text-gray-600">Allergies:</span> {selectedUserProfile.allergies}</div>
                                        )}
                                        {selectedUserProfile.medical_history && (
                                            <div className="col-span-2"><span className="font-medium text-gray-600">Medical History:</span> {selectedUserProfile.medical_history}</div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {!loadingProfile && selectedUserProfile && selectedUser.user_type === 'pharmacy' && (
                                <div>
                                    <h4 className="text-md font-medium text-gray-900 mb-3">Pharmacy Profile</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm bg-green-50 p-4 rounded-lg">
                                        <div><span className="font-medium text-gray-600">License Number:</span> {selectedUserProfile.license_number || 'Not provided'}</div>
                                        <div><span className="font-medium text-gray-600">Pharmacy Name:</span> {selectedUserProfile.pharmacy_name || 'Not specified'}</div>
                                        <div><span className="font-medium text-gray-600">Address:</span> {selectedUserProfile.address || 'Not provided'}</div>
                                        <div><span className="font-medium text-gray-600">Operating Hours:</span> {selectedUserProfile.operating_hours || 'Not specified'}</div>
                                        <div><span className="font-medium text-gray-600">Contact Person:</span> {selectedUserProfile.contact_person || 'Not specified'}</div>
                                        <div><span className="font-medium text-gray-600">Verified:</span>
                                            <span className={`ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${selectedUserProfile.is_verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                {selectedUserProfile.is_verified ? 'Verified' : 'Pending'}
                                            </span>
                                        </div>
                                        {selectedUserProfile.description && (
                                            <div className="col-span-2"><span className="font-medium text-gray-600">Description:</span> {selectedUserProfile.description}</div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {!loadingProfile && !selectedUserProfile && selectedUser.user_type !== 'admin' && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                    <div className="flex items-center">
                                        <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
                                        <span className="text-yellow-800 text-sm">No detailed profile information available for this user.</span>
                                    </div>
                                </div>
                            )}

                            {selectedUser.user_type === 'admin' && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                    <div className="flex items-center">
                                        <Shield className="w-5 h-5 text-red-600 mr-2" />
                                        <span className="text-red-800 text-sm font-medium">Administrator Account</span>
                                    </div>
                                    <p className="text-red-700 text-sm mt-1">This user has administrative privileges in the system.</p>
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