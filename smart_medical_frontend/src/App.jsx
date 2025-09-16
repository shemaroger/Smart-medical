import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import LandingPpage from './pages/Home';
import Login from './pages/autho/Login';
import SignUp from './pages/autho/Signup';
import Dashboard from './pages/layout/MedicalDashboard';
import UsersManagement from './pages/Users/UsersManagement';
import ProfileCompletion from './pages/Users/ProfileCompletion';
function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPpage />} />

          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/complete-profile" element={<ProfileCompletion />} />

          <Route path="/dashboard" element={<Dashboard />}>
            <Route path="overview" element={<Dashboard />}></Route>
            <Route path="users/list" element={<UsersManagement />}></Route>
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














