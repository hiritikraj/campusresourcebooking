import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, profile, loading, isSupabaseConfigured } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner fullScreen label="Verifying your session..." />;
  }

  if (!isSupabaseConfigured) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    if (!profile) {
      return <LoadingSpinner fullScreen label="Loading account permissions..." />;
    }
    if (!allowedRoles.includes(profile.role)) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
}
