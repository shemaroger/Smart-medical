import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import React, { useEffect } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import { appointmentService } from './api';
import LandingPpage from './pages/Home';
import Login from './pages/autho/Login';
import SignUp from './pages/autho/Signup';
import Dashboard from './pages/layout/MedicalDashboard';
import UsersManagement from './pages/Users/UsersManagement';
import ProfileCompletion from './pages/Users/ProfileCompletion';
import HospitalManagement from './pages/Hospital/HospitalManagement';
import PatientAppointments from './pages/Appointments/PatientAppointments';
import AdminAppointments from './pages/Appointments/AdminAppointments';
import CreatePrescription from './pages/Prescription/prescription';
import DoctorPrescriptions from './pages/Prescription/DoctorPrescriptions';
import DrugManagement from './pages/Drug/DrugManagement';
import PharmacyInventory from './pages/Pharmacy/PharmacyInventory';
import AddUser from './pages/Users/AddUserForm';
import PatientPrescriptions from './pages/Prescription/PatientPrescriptions';
import PatientOrders from './pages/Orders/PatientOrders';
import PharmacyOrders from './pages/Orders/PharmacyOrders';
import DrugCatalog from './pages/Drug/DrugCatalog';
import PendingAppointments from './pages/Appointments/PendingAppointments';
import PatientDashboard from './pages/Dashboards/PatientDashboard';
import DoctorDashboard from './pages/Dashboards/DoctorDashboard';
import UserProfile from './pages/Users/UserProfile';
import PharmacyDashboard from './pages/Dashboards/PharmacyDashboard';
import AdminDashboard from './pages/Dashboards/AdminDashboard';
import UserAnalyticsReport from './pages/Users/UserAnalyticsReport';
import DrugAnalyticsReportPage from './pages/Drug/DrugAnalyticsReportPage';
import AppointmentAnalyticsReport from './pages/Appointments/AppointmentAnalyticsReport';
import DoctorAppointmentReport from './pages/Appointments/DoctorAppointmentReport';
import PharmacyOrderAnalyticsReport from './pages/Orders/PharmacyOrderAnalyticsReport';
import PharmacyInventoryAnalyticsReport from './pages/Pharmacy/PharmacyInventoryAnalyticsReport';
import DrugBulkImport from './pages/Drug/DrugBulkImport';
function App() {

  useEffect(() => {
    const autoUpdateAppointmentStatus = async () => {
      try {
        const result = await appointmentService.autoUpdateStatuses();

        if (result.success) {
          console.log('Auto-update result:', result.data);

          window.dispatchEvent(new CustomEvent('appointmentsUpdated', {
            detail: result.data
          }));
        } else {
          console.warn('Auto-update failed:', result.error);
        }
      } catch (error) {
        console.error('Auto-update failed:', error);
      }
    };
    autoUpdateAppointmentStatus();
    const interval = setInterval(autoUpdateAppointmentStatus, 1 * 60 * 1000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPpage />} />

          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/complete-profile" element={<ProfileCompletion />} />

          <Route path="/dashboard" element={<Dashboard />}>

            <Route path="system/overview" element={<AdminDashboard />}></Route>
            <Route path="patient/overview" element={<PatientDashboard />}></Route>
            <Route path="doctor/overview" element={<DoctorDashboard />}></Route>
            <Route path="pharmacy/overview" element={<PharmacyDashboard />}></Route>
            <Route path="drugs/add-new" element={<DrugBulkImport />}></Route>

            <Route path="users/list" element={<UsersManagement />}></Route>
            <Route path="providers/manage" element={<HospitalManagement />}></Route>
            <Route path="appointments/book" element={<PatientAppointments />}></Route>
            <Route path="appointments/list" element={<AdminAppointments />}></Route>
            <Route path="appointments/pending/list" element={<PendingAppointments />}></Route>
            <Route path="prescriptions/create" element={<CreatePrescription />} />
            <Route path="prescriptions/list" element={<DoctorPrescriptions />} />
            <Route path="drugs/list" element={<DrugManagement />} />
            <Route path="all/drugs/list" element={<DrugCatalog />} />
            <Route path="inventory/list" element={<PharmacyInventory />} />
            <Route path="users/add" element={<AddUser />} />
            <Route path="prescriptions/patients/list" element={<PatientPrescriptions />} />
            <Route path="patients/request/list" element={<PatientOrders />} />
            <Route path="pharmacy/request/list" element={<PharmacyOrders />} />
            <Route path="user/profile" element={<UserProfile />} />

            {/* Reporting */}
            <Route path="users/report" element={<UserAnalyticsReport />} />
            <Route path="drugs/report" element={<DrugAnalyticsReportPage />} />
            <Route path="patient/appointment/report" element={<AppointmentAnalyticsReport />} />
            <Route path="doctor/appointment/report" element={<DoctorAppointmentReport />} />
            <Route path="request/report" element={<PharmacyOrderAnalyticsReport />} />
            <Route path="invetory/report" element={<PharmacyInventoryAnalyticsReport />} />

          </Route>
        </Routes>
      </Router>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={true}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss={false}
        draggable
        pauseOnHover={false}
        theme="light"
        toastStyle={{
          backgroundColor: '#ffffff',
          color: '#333333',
          borderRadius: '8px',
          border: '1px solid #ddd',
          padding: '20px',
          boxShadow: '0 4px 8px 0 rgba(0, 0, 0, 0.2)',
          maxWidth: '1000px',
          minWidth: '400px',
          fontSize: '14px',
        }}
      />
    </>
  );
}

export default App;














