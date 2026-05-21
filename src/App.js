import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Context
import { AuthProvider } from './context/AuthContext';

// Layouts
import PublicLayout from './layouts/PublicLayout';
import DashboardLayout from './layouts/DashboardLayout';

// Route Guards
import ProtectedRoute from './routes/ProtectedRoute';
import PublicRoute from './routes/PublicRoute';

// Home
import HomePage from './pages/HomePage';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Chat
import ChatListPage from './pages/chat/ChatListPage';
import ChatPage     from './pages/chat/ChatPage';

// Dashboard Pages
import DashboardPage from './pages/dashboard/DashboardPage';
import ProfilePage from './pages/dashboard/ProfilePage';

// Module 2 — Hospital Pages
import HospitalRegisterPage from './pages/hospitals/HospitalRegisterPage';
import HospitalListPage from './pages/hospitals/HospitalListPage';
import HospitalDetailPage from './pages/hospitals/HospitalDetailPage';
import HospitalBlacklistPage from './pages/hospitals/HospitalBlacklistPage';
import UserListPage from './pages/admin/UserListPage';

// Module 3 — Doctor Pages
import DoctorRegisterPage from './pages/doctors/DoctorRegisterPage';
import DoctorListPage from './pages/doctors/DoctorListPage';
import DoctorManagePage from './pages/doctors/DoctorManagePage';
import DoctorDetailPage from './pages/doctors/DoctorDetailPage';
import DoctorMyProfilePage from './pages/doctors/DoctorMyProfilePage';
import DoctorMyLeavePage from './pages/doctors/DoctorMyLeavePage';
import AdminLeavePage from './pages/doctors/AdminLeavePage';
import DoctorPatientsPage from './pages/doctors/DoctorPatientsPage';
import PatientDetailPage from './pages/doctors/PatientDetailPage';
import ReviewPage from './pages/reviews/ReviewPage';

// Module 4 — Appointment Pages
import BookAppointmentPage from './pages/appointments/BookAppointmentPage';
import AppointmentListPage from './pages/appointments/AppointmentListPage';
import AppointmentDetailPage from './pages/appointments/AppointmentDetailPage';
import RescheduleAppointmentPage from './pages/appointments/RescheduleAppointmentPage';

// Module 5 — Prescriptions & Records
import PrescriptionListPage from './pages/prescriptions/PrescriptionListPage';
import PrescriptionDetailPage from './pages/prescriptions/PrescriptionDetailPage';
import CreatePrescriptionPage from './pages/prescriptions/CreatePrescriptionPage';
import MedicalRecordListPage from './pages/records/MedicalRecordListPage';
import MedicalRecordUploadPage from './pages/records/MedicalRecordUploadPage';

// Module 5 — Video Call
import VideoCallPage from './pages/appointments/VideoCallPage';

// 404
import NotFoundPage from './pages/NotFoundPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1f2937',
              color: '#f9fafb',
              borderRadius: '10px',
              fontSize: '13px',
            },
            success: { iconTheme: { primary: '#10b981', secondary: '#f9fafb' } },
            error:   { iconTheme: { primary: '#ef4444', secondary: '#f9fafb' } },
          }}
        />

        <Routes>

          {/* ── Home Page ── */}
          <Route path="/" element={<HomePage />} />

          {/* ── Public Routes (Login / Register) ── */}
          <Route element={<PublicLayout />}>
            <Route path="/login"    element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
          </Route>

          {/* ── Video Call — full screen ── */}
          <Route
            path="/appointments/:id/video-call"
            element={<ProtectedRoute><VideoCallPage /></ProtectedRoute>}
          />

          {/* ── Protected Routes (with Sidebar) ── */}
          <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>

            {/* Module 1 — Auth */}
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/profile"   element={<ProfilePage />} />

            {/* Module 2 — Hospitals */}
            <Route path="/hospital"          element={<HospitalListPage />} />
            <Route path="/hospital/register" element={<HospitalRegisterPage />} />
            <Route path="/hospitals"         element={<HospitalListPage />} />
            <Route path="/admin/blacklist"   element={<HospitalBlacklistPage />} />
            <Route path="/admin/users"       element={<UserListPage />} />
            <Route path="/hospitals/:id"     element={<HospitalDetailPage />} />
            <Route path="/admin/hospitals"   element={<HospitalListPage />} />
            <Route path="/admin/approvals"   element={<Navigate to="/admin/hospitals?tab=pending" replace />} />

            {/* Module 3 — Doctors */}
            <Route path="/doctors"            element={<DoctorListPage />} />
            <Route path="/doctors/register"   element={<DoctorRegisterPage />} />
            <Route path="/doctors/my-profile" element={<DoctorMyProfilePage />} />
            <Route path="/doctors/my-leaves"  element={<DoctorMyLeavePage />} />
            <Route path="/doctors/manage"     element={<DoctorManagePage />} />
            <Route path="/admin/leaves"       element={<AdminLeavePage />} />
            <Route path="/doctors/:id"        element={<DoctorDetailPage />} />
            <Route path="/search"             element={<DoctorListPage />} />
            <Route path="/doctors/:id/reviews" element={<ReviewPage />} />
            <Route path="/patients"           element={<DoctorPatientsPage />} />
            <Route path="/patients/:patientId" element={<PatientDetailPage />} />

            {/* Module 5 — Prescriptions */}
            <Route path="/prescriptions"        element={<PrescriptionListPage />} />
            <Route path="/prescriptions/create" element={<CreatePrescriptionPage />} />
            <Route path="/prescriptions/:id"    element={<PrescriptionDetailPage />} />

            {/* Module 5 — Medical Records */}
            <Route path="/records"        element={<MedicalRecordListPage />} />
            <Route path="/records/upload" element={<MedicalRecordUploadPage />} />

            {/* Module 4 — Appointments */}
            <Route path="/appointments"                element={<AppointmentListPage />} />
            <Route path="/appointments/book/:doctorId" element={<BookAppointmentPage />} />
            <Route path="/appointments/:id"            element={<AppointmentDetailPage />} />
            <Route path="/appointments/:id/reschedule" element={<RescheduleAppointmentPage />} />

            {/* Chat */}
            <Route path="/chat"         element={<ChatListPage />} />
            <Route path="/chat/:roomId" element={<ChatPage />} />

          </Route>

          {/* ── 404 ── */}
          <Route path="*" element={<NotFoundPage />} />

        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;