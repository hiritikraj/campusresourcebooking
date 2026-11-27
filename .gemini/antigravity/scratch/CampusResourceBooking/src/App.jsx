import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from './context/AuthContext';

// Public pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

// Protected user pages
import DashboardPage from './pages/DashboardPage';
import ResourcesPage from './pages/ResourcesPage';
import BookResourcePage from './pages/BookResourcePage';
import MyBookingsPage from './pages/MyBookingsPage';
import ProfilePage from './pages/ProfilePage';

// Admin pages
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminResourcesPage from './pages/admin/AdminResourcesPage';
import AdminBookingsPage from './pages/admin/AdminBookingsPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminUtilizationPage from './pages/admin/AdminUtilizationPage';

// Guards
import ProtectedRoute from './components/ProtectedRoute';

// Auto-redirect from /dashboard based on role
function RoleRedirect() {
  const { profile, loading } = useAuth();

  if (loading) return null;

  if (profile?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }
  return <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <Routes>
      {/* ── Public ── */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* ── Auto role redirect ── */}
      <Route
        path="/home"
        element={
          <ProtectedRoute>
            <RoleRedirect />
          </ProtectedRoute>
        }
      />

      {/* ── Student / Faculty Protected ── */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={['student', 'faculty']}>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/resources"
        element={
          <ProtectedRoute allowedRoles={['student', 'faculty']}>
            <ResourcesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/book"
        element={
          <ProtectedRoute allowedRoles={['student', 'faculty']}>
            <BookResourcePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-bookings"
        element={
          <ProtectedRoute allowedRoles={['student', 'faculty']}>
            <MyBookingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute allowedRoles={['student', 'faculty', 'admin']}>
            <ProfilePage />
          </ProtectedRoute>
        }
      />

      {/* ── Admin Protected ── */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/resources"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminResourcesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/bookings"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminBookingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminUsersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/utilization"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminUtilizationPage />
          </ProtectedRoute>
        }
      />

      {/* ── 404 Fallback ── */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
