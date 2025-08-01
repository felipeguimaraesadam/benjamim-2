import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Add a prop for admin routes
const ProtectedRoute = ({ children, isAdminRoute = false }) => {
  const auth = useAuth();
  const location = useLocation();

  if (!auth) {
    console.error(
      'Auth context is not available in ProtectedRoute. Ensure AuthProvider is correctly set up.'
    );
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const { user, isAuthenticated, isLoading } = auth;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-xl">Carregando autenticação...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check for admin access if it's an admin route
  if (isAdminRoute && (!user || user.nivel_acesso !== 'admin')) {
    // User is authenticated but not an admin. Redirect to dashboard or an access denied page.
    // For simplicity, redirecting to dashboard.
    console.warn(
      `Access denied for user ${user?.login} to admin route ${location.pathname}.`
    );
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return children ? children : <Outlet />; // Render children if passed, otherwise Outlet
};

export default ProtectedRoute;
