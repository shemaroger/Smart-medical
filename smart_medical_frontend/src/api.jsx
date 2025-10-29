import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 30000,
});

// Request interceptor to add token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Token ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('access_token');
            localStorage.removeItem('user_data');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

const handleError = (error) => {
    if (error.response) {
        const { status, data } = error.response;

        if (status === 400) {
            return {
                message: data.error || 'Validation failed',
                details: data.details || data,
                status: 400
            };
        } else if (status === 401) {
            return {
                message: 'Unauthorized access',
                status: 401
            };
        } else if (status === 403) {
            return {
                message: 'Access forbidden',
                status: 403
            };
        } else if (status === 404) {
            return {
                message: 'Resource not found',
                status: 404
            };
        } else if (status === 500) {
            return {
                message: 'Internal server error',
                status: 500
            };
        } else {
            return {
                message: data.error || data.message || 'An error occurred',
                details: data.details || data,
                status: status
            };
        }
    } else if (error.request) {
        return {
            message: 'Network error. Please check your connection.',
            status: 0
        };
    } else {
        return {
            message: error.message || 'An unexpected error occurred',
            status: 0
        };
    }
};

// =============================================================================
// AUTHENTICATION SERVICES
// =============================================================================

export const otpService = {
    async verify(otp, email) {
        try {
            const response = await api.post('/verify-otp/', {
                otp: otp,
                email: email
            });

            if (response.data.data.token) {
                localStorage.setItem('access_token', response.data.data.token);
                localStorage.setItem('user_data', JSON.stringify(response.data.data.user));
            }

            return {
                success: true,
                isVerified: true,
                message: response.data.message || "OTP verified successfully",
                data: response.data.data
            };
        } catch (error) {
            const errorMessage = handleError(error);
            return {
                success: false,
                isVerified: false,
                error: errorMessage ||
                    (error.response?.data?.error || "OTP verification failed")
            };
        }
    }
};
export const authService = {
    // User Registration
    async register(userData) {
        try {
            const response = await api.post('/auth/register/', userData);
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: handleError(error) };
        }
    },

    // User Login
    async login(email, password) {
        try {
            const response = await api.post('/auth/login/', {
                email,
                password
            });
            if (response.data.token) {
                localStorage.setItem('access_token', response.data.token);
                localStorage.setItem('user_data', JSON.stringify(response.data.user));
            }
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: handleError(error) };
        }
    },

    // User Logout
    async logout() {
        try {
            localStorage.removeItem('access_token');
            localStorage.removeItem('user_data');
            return { success: true };
        } catch (error) {
            return { success: false, error: handleError(error) };
        }
    },

    // ✅ NEW: Fetch all users
    async getAllUsers() {
        try {
            const response = await api.get('/users/'); // endpoint from Django urls
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: handleError(error) };
        }
    }
};


// =============================================================================
// PROFILE SERVICES
// =============================================================================
export const profileService = {
    // -------- CREATE --------
    async createDoctorProfile(profileData) {
        try {
            const response = await api.post('/profiles/doctor/create/', profileData);
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: handleError(error) };
        }
    },

    async createPatientProfile(profileData) {
        try {
            const response = await api.post('/profiles/patient/create/', profileData);
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: handleError(error) };
        }
    },

    async createPharmacyProfile(profileData) {
        try {
            const response = await api.post('/profiles/pharmacy/create/', profileData);
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: handleError(error) };
        }
    },

    // -------- CURRENT USER PROFILE --------
    async getCurrentProfile() {
        try {
            const user = getCurrentUser();
            if (!user) throw new Error('No user data found');

            let endpoint = '';
            switch (user.user_type) {
                case 'doctor':
                    endpoint = '/profiles/doctor/me/';
                    break;
                case 'patient':
                    endpoint = '/profiles/patient/me/';
                    break;
                case 'pharmacy':
                    endpoint = '/profiles/pharmacy/me/';
                    break;
                default:
                    throw new Error('Invalid user type');
            }

            const response = await api.get(endpoint);
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: handleError(error) };
        }
    },

    // =======================
    //        DOCTORS
    // =======================

    /**
     * List doctors (optional filters)
     * @param {Object} params
     * @param {string} [params.id] - doctor/user id (PK)
     * @param {string} [params.hospital_id] - hospital UUID
     * @param {boolean|string} [params.is_verified] - true/false
     */
    async listDoctorProfiles(params = {}) {
        try {
            const response = await api.get('/profiles/doctors/', { params });
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: handleError(error) };
        }
    },

    async getDoctorById(id) {
        try {
            const response = await api.get(`/profiles/doctors/${id}/`);
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: handleError(error) };
        }
    },

    // =======================
    //        PATIENTS
    // =======================

    /**
     * List patients (optional filter by id)
     */
    async listPatientProfiles(params = {}) {
        try {
            const response = await api.get('/profiles/patients/', { params });
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: handleError(error) };
        }
    },

    async getPatientById(id) {
        try {
            const response = await api.get(`/profiles/patients/${id}/`);
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: handleError(error) };
        }
    },

    // =======================
    //       PHARMACIES
    // =======================

    /**
     * List pharmacies (optional filter by id)
     */
    async listPharmacyProfiles(params = {}) {
        try {
            const response = await api.get('/profiles/pharmacies/', { params });
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: handleError(error) };
        }
    },

    async getPharmacyById(id) {
        try {
            const response = await api.get(`/profiles/pharmacies/${id}/`);
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: handleError(error) };
        }
    },
};





// =============================================================================
// HOSPITAL SERVICES
// =============================================================================

export const hospitalService = {
    // Get all hospitals
    async getAll() {
        try {
            const response = await api.get('/hospitals/');
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: handleError(error) };
        }
    },

    // Get specific hospital
    async getById(id) {
        try {
            const response = await api.get(`/hospitals/${id}/`);
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: handleError(error) };
        }
    },

    // Create hospital (admin only)
    async create(hospitalData) {
        try {
            const response = await api.post('/hospitals/', hospitalData);
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: handleError(error) };
        }
    },

    // Update hospital
    async update(id, hospitalData) {
        try {
            const response = await api.put(`/hospitals/${id}/`, hospitalData);
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: handleError(error) };
        }
    }
};

// =============================================================================
// DRUG SERVICES
// =============================================================================
export const drugService = {
    // Get all drugs with filters
    async getAll(filters = {}) {
        try {
            const params = new URLSearchParams();

            if (filters.category) params.append('category', filters.category);
            if (filters.name) params.append('name', filters.name);
            if (filters.manufacturer) params.append('manufacturer', filters.manufacturer);
            if (filters.requires_prescription !== undefined) {
                params.append('requires_prescription', filters.requires_prescription);
            }

            const queryString = params.toString();
            const url = queryString ? `/drugs/?${queryString}` : '/drugs/';

            const response = await api.get(url);
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: handleError(error) };
        }
    },

    // Get specific drug
    async getById(id) {
        try {
            const response = await api.get(`/drugs/${id}/`);
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: handleError(error) };
        }
    },

    // Create drug (admin only)
    async create(drugData) {
        try {
            const response = await api.post('/drugs/', drugData);
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: handleError(error) };
        }
    },

    // Update drug
    async update(id, drugData) {
        try {
            const response = await api.put(`/drugs/${id}/`, drugData);
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: handleError(error) };
        }
    }
};

// =============================================================================
// APPOINTMENT SERVICES
// =============================================================================
export const appointmentService = {
    // Get all appointments for current user
    async getAll(filters = {}) {
        try {
            const params = new URLSearchParams();

            if (filters.status) params.append('status', filters.status);
            if (filters.date_from) params.append('date_from', filters.date_from);
            if (filters.date_to) params.append('date_to', filters.date_to);

            const queryString = params.toString();
            const url = queryString ? `/appointments/?${queryString}` : '/appointments/';

            const response = await api.get(url);
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: handleError(error) };
        }
    },

    async autoUpdateStatuses() {
        try {
            const response = await api.post('/appointments/auto-update-status/');
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: handleError(error) };
        }
    },

    // Create appointment (patient only)
    async create(appointmentData) {
        try {
            const response = await api.post('/appointments/create/', appointmentData);
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: handleError(error) };
        }
    },

    // Update appointment status (doctor only)
    async updateStatus(appointmentId, statusData) {
        try {
            const response = await api.put(`/appointments/${appointmentId}/status/`, statusData);
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: handleError(error) };
        }
    },

    // Get appointment by ID
    async getById(id) {
        try {
            const response = await api.get(`/appointments/${id}/`);
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: handleError(error) };
        }
    }
};

// =============================================================================
// PRESCRIPTION SERVICES
// =============================================================================
export const prescriptionService = {
    // Get all prescriptions for current user
    async getAll(filters = {}) {
        try {
            const params = new URLSearchParams();

            if (filters.status) params.append('status', filters.status);
            if (filters.date_from) params.append('date_from', filters.date_from);
            if (filters.date_to) params.append('date_to', filters.date_to);

            const queryString = params.toString();
            const url = queryString ? `/prescriptions/?${queryString}` : '/prescriptions/';

            const response = await api.get(url);
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: handleError(error) };
        }
    },

    // Create prescription (doctor only)
    async create(prescriptionData) {
        try {
            const response = await api.post('/prescriptions/create/', prescriptionData);
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: handleError(error) };
        }
    },

    // Get prescription by ID
    async getById(id) {
        try {
            const response = await api.get(`/prescriptions/${id}/`);
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: handleError(error) };
        }
    },

    // Get pharmacy recommendations for prescription
    async getRecommendations(prescriptionId) {
        try {
            const response = await api.get(`/prescriptions/${prescriptionId}/recommendations/`);
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: handleError(error) };
        }
    },
    async getByAppointment(appointmentId) {
        try {
            const response = await api.get(`/prescriptions/by-appointment/${appointmentId}/`);
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: handleError(error) };
        }
    },
};



// =============================================================================
// ORDER SERVICES
// =============================================================================

export const orderService = {
    // Get all orders (with optional filters)
    async getAll(filters = {}) {
        try {
            const params = new URLSearchParams();
            if (filters.status) params.append('status', filters.status);
            if (filters.is_paid !== undefined && filters.is_paid !== null) params.append('is_paid', filters.is_paid);
            if (filters.date_from) params.append('date_from', filters.date_from);
            if (filters.date_to) params.append('date_to', filters.date_to);
            if (filters.search) params.append('search', filters.search);
            if (filters.page) params.append('page', filters.page);
            if (filters.page_size) params.append('page_size', filters.page_size);

            const queryString = params.toString();
            const url = queryString ? `/orders/?${queryString}` : '/orders/';

            const response = await api.get(url);
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: handleError(error) };
        }
    },

    // Create order
    async create(orderData) {
        try {
            const response = await api.post('/orders/create/', orderData);
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: handleError(error) };
        }
    },

    // Get order by ID
    async getById(id) {
        try {
            const response = await api.get(`/orders/${id}/`);
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: handleError(error) };
        }
    },

    // Update order status / payment (PATCH)
    // Allowed fields server-side: { status, is_paid }
    async updateStatus(id, payload) {
        try {
            const response = await api.patch(`/orders/${id}/update-status/`, payload);
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: handleError(error) };
        }
    }
};


// =============================================================================
// PHARMACY INVENTORY SERVICES
// =============================================================================
export const inventoryService = {
    // Get pharmacy inventory (pharmacy users only)
    async getAll(filters = {}) {
        try {
            const params = new URLSearchParams();

            if (filters.drug_name) params.append('drug_name', filters.drug_name);
            if (filters.category) params.append('category', filters.category);
            if (filters.low_stock) params.append('low_stock', filters.low_stock);

            const queryString = params.toString();
            const url = queryString ? `/pharmacy/inventory/?${queryString}` : '/pharmacy/inventory/';

            const response = await api.get(url);
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: handleError(error) };
        }
    },

    // Add inventory item
    async create(inventoryData) {
        try {
            const response = await api.post('/pharmacy/inventory/', inventoryData);
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: handleError(error) };
        }
    },

    // Update inventory item
    async update(itemId, inventoryData) {
        try {
            const response = await api.put(`/pharmacy/inventory/${itemId}/`, inventoryData);
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: handleError(error) };
        }
    },

    // Delete inventory item
    async delete(itemId) {
        try {
            await api.delete(`/pharmacy/inventory/${itemId}/`);
            return { success: true };
        } catch (error) {
            return { success: false, error: handleError(error) };
        }
    },

    // Get low stock items
    async getLowStock() {
        try {
            const response = await api.get('/pharmacy/inventory/?low_stock=true');
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: handleError(error) };
        }
    }
};

// =============================================================================
// PAYMENT SERVICES
// =============================================================================
export const paymentService = {
    // Get all payments for current user
    async getAll(filters = {}) {
        try {
            const params = new URLSearchParams();

            if (filters.status) params.append('status', filters.status);
            if (filters.payment_method) params.append('payment_method', filters.payment_method);
            if (filters.date_from) params.append('date_from', filters.date_from);
            if (filters.date_to) params.append('date_to', filters.date_to);

            const queryString = params.toString();
            const url = queryString ? `/payments/?${queryString}` : '/payments/';

            const response = await api.get(url);
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: handleError(error) };
        }
    },

    // Create payment (patient only)
    async create(paymentData) {
        try {
            const response = await api.post('/payments/create/', paymentData);
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: handleError(error) };
        }
    },

    // Get payment by ID
    async getById(id) {
        try {
            const response = await api.get(`/payments/${id}/`);
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: handleError(error) };
        }
    }
};

// =============================================================================
// MEDICAL REPORT SERVICES
// =============================================================================
export const medicalReportService = {
    // Get all medical reports for current user
    async getAll(filters = {}) {
        try {
            const params = new URLSearchParams();

            if (filters.date_from) params.append('date_from', filters.date_from);
            if (filters.date_to) params.append('date_to', filters.date_to);
            if (filters.patient_id) params.append('patient_id', filters.patient_id);

            const queryString = params.toString();
            const url = queryString ? `/medical-reports/?${queryString}` : '/medical-reports/';

            const response = await api.get(url);
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: handleError(error) };
        }
    },

    // Create medical report (doctor only)
    async create(reportData) {
        try {
            const response = await api.post('/medical-reports/create/', reportData);
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: handleError(error) };
        }
    },

    // Get medical report by ID
    async getById(id) {
        try {
            const response = await api.get(`/medical-reports/${id}/`);
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: handleError(error) };
        }
    },

    // Update medical report
    async update(id, reportData) {
        try {
            const response = await api.put(`/medical-reports/${id}/`, reportData);
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: handleError(error) };
        }
    }
};

// =============================================================================
// NOTIFICATION SERVICES
// =============================================================================
export const notificationService = {
    // Get all notifications
    async getAll(filters = {}) {
        try {
            const params = new URLSearchParams();

            if (filters.is_read !== undefined) params.append('is_read', filters.is_read);
            if (filters.notification_type) params.append('notification_type', filters.notification_type);

            const queryString = params.toString();
            const url = queryString ? `/notifications/?${queryString}` : '/notifications/';

            const response = await api.get(url);
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: handleError(error) };
        }
    },

    // Mark notification as read
    async markAsRead(notificationId) {
        try {
            const response = await api.put(`/notifications/${notificationId}/read/`);
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: handleError(error) };
        }
    },

    // Get unread count
    async getUnreadCount() {
        try {
            const response = await api.get('/notifications/?is_read=false');
            return {
                success: true,
                data: {
                    unread_count: response.data.results ? response.data.results.length : response.data.length
                }
            };
        } catch (error) {
            return { success: false, error: handleError(error) };
        }
    },

    // Mark all notifications as read
    async markAllAsRead() {
        try {
            const unreadResponse = await this.getAll({ is_read: false });
            if (unreadResponse.success) {
                const notifications = unreadResponse.data.results || unreadResponse.data;
                const promises = notifications.map(notification =>
                    this.markAsRead(notification.id)
                );
                await Promise.all(promises);
                return { success: true };
            }
            return unreadResponse;
        } catch (error) {
            return { success: false, error: handleError(error) };
        }
    }
};

// =============================================================================
// DASHBOARD SERVICES
// =============================================================================
export const dashboardService = {
    // Get dashboard data for current user
    async getData() {
        try {
            const response = await api.get('/dashboard/');
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: handleError(error) };
        }
    },

    // Get statistics for different user types
    async getStatistics() {
        try {
            const response = await api.get('/dashboard/statistics/');
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: handleError(error) };
        }
    }
};

// =============================================================================
// SYSTEM ADMIN SERVICES
// =============================================================================
export const adminService = {
    // Approve user (admin only)
    async approveUser(userId) {
        try {
            const response = await api.patch(`/admin/users/${userId}/approve/`);
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: handleError(error) };
        }
    },

    // Get pending user approvals
    async getPendingUsers() {
        try {
            const response = await api.get('/admin/users/pending/');
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: handleError(error) };
        }
    },

    // Get all users
    async getAllUsers(filters = {}) {
        try {
            const params = new URLSearchParams();

            if (filters.user_type) params.append('user_type', filters.user_type);
            if (filters.is_active !== undefined) params.append('is_active', filters.is_active);
            if (filters.is_verified !== undefined) params.append('is_verified', filters.is_verified);

            const queryString = params.toString();
            const url = queryString ? `/admin/users/?${queryString}` : '/admin/users/';

            const response = await api.get(url);
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: handleError(error) };
        }
    },

    // Update user status
    async updateUserStatus(userId, statusData) {
        try {
            const response = await api.patch(`/admin/users/${userId}/`, statusData);
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: handleError(error) };
        }
    },

    // System monitoring - check low stock
    async checkLowStock() {
        try {
            const response = await api.post('/system/check-low-stock/');
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: handleError(error) };
        }
    },

    // Get system reports
    async getSystemReports() {
        try {
            const response = await api.get('/admin/reports/');
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: handleError(error) };
        }
    }
};

// =============================================================================
// DOCTOR SPECIFIC SERVICES
// =============================================================================
export const doctorService = {
    // Get all doctors
    async getAll(filters = {}) {
        try {
            const params = new URLSearchParams();

            if (filters.specialization) params.append('specialization', filters.specialization);
            if (filters.hospital_id) params.append('hospital_id', filters.hospital_id);
            if (filters.is_verified !== undefined) params.append('is_verified', filters.is_verified);

            const queryString = params.toString();
            const url = queryString ? `/doctors/?${queryString}` : '/doctors/';

            const response = await api.get(url);
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: handleError(error) };
        }
    },

    // Get doctor by ID
    async getById(id) {
        try {
            const response = await api.get(`/doctors/${id}/`);
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: handleError(error) };
        }
    },

    // Get doctors by hospital
    async getByHospital(hospitalId) {
        try {
            const response = await api.get(`/doctors/?hospital_id=${hospitalId}`);
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: handleError(error) };
        }
    }
};

// =============================================================================
// PHARMACY SPECIFIC SERVICES
// =============================================================================
export const pharmacyService = {
    // Get all pharmacies
    async getAll(filters = {}) {
        try {
            const params = new URLSearchParams();

            if (filters.location) params.append('location', filters.location);
            if (filters.is_verified !== undefined) params.append('is_verified', filters.is_verified);

            const queryString = params.toString();
            const url = queryString ? `/pharmacies/?${queryString}` : '/pharmacies/';

            const response = await api.get(url);
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: handleError(error) };
        }
    },

    // Get pharmacy by ID
    async getById(id) {
        try {
            const response = await api.get(`/pharmacies/${id}/`);
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: handleError(error) };
        }
    },

    // Search pharmacies by drug availability
    async searchByDrug(drugId) {
        try {
            const response = await api.get(`/pharmacies/search/?drug_id=${drugId}`);
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: handleError(error) };
        }
    }
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

// Get current user data from localStorage
export const getCurrentUser = () => {
    try {
        const userData = localStorage.getItem('user_data');
        return userData ? JSON.parse(userData) : null;
    } catch (error) {
        console.error('Error parsing user data:', error);
        return null;
    }
};

// Check if user is authenticated
export const isAuthenticated = () => {
    const token = localStorage.getItem('access_token');
    return !!token;
};

// Check user types
export const isPatient = () => {
    const user = getCurrentUser();
    return user?.user_type === 'patient';
};

export const isDoctor = () => {
    const user = getCurrentUser();
    return user?.user_type === 'doctor';
};

export const isPharmacy = () => {
    const user = getCurrentUser();
    return user?.user_type === 'pharmacy';
};

export const isAdmin = () => {
    const user = getCurrentUser();
    return user?.user_type === 'admin';
};

// Clear all authentication data
export const clearAuthData = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_data');
};

// Format error message for display
export const getErrorMessage = (error) => {
    if (typeof error === 'string') return error;
    if (error?.message) return error.message;
    if (error?.details) {
        if (typeof error.details === 'string') return error.details;
        if (typeof error.details === 'object') {
            return Object.values(error.details).flat().join(', ');
        }
    }
    return 'An unexpected error occurred';
};

// API status checker
export const checkApiStatus = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/health/`, { timeout: 5000 });
        return { success: true, data: response.data };
    } catch (error) {
        console.log(error)
        return { success: false, error: 'API server is not responding' };
    }
};

// Format currency
export const formatCurrency = (amount, currency = 'RWF') => {
    return new Intl.NumberFormat('en-RW', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }).format(amount);
};

// Format date
export const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-RW', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

// Format datetime
export const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-RW', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

// Get user type display name
export const getUserTypeDisplayName = (userType) => {
    const displayNames = {
        'patient': 'Patient',
        'doctor': 'Doctor',
        'pharmacy': 'Pharmacy',
        'admin': 'Administrator'
    };
    return displayNames[userType] || userType;
};

// Get status color class
export const getStatusColor = (status) => {
    const colorMap = {
        'pending': 'text-yellow-600 bg-yellow-100',
        'approved': 'text-green-600 bg-green-100',
        'completed': 'text-blue-600 bg-blue-100',
        'cancelled': 'text-red-600 bg-red-100',
        'active': 'text-green-600 bg-green-100',
        'filled': 'text-blue-600 bg-blue-100',
        'expired': 'text-gray-600 bg-gray-100',
        'failed': 'text-red-600 bg-red-100'
    };
    return colorMap[status] || 'text-gray-600 bg-gray-100';
};

export default api;