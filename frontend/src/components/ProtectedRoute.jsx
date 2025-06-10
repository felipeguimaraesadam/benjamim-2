import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = () => {
  const auth = useAuth();
  const location = useLocation();

  if (!auth) {
    // This case should ideally not happen if AuthProvider wraps the app,
    // but as a fallback or for testing:
    console.error("Auth context is not available in ProtectedRoute. Ensure AuthProvider is correctly set up.");
    // Depending on strictness, could redirect to an error page or login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const { isAuthenticated, isLoading } = auth;

  if (isLoading) {
    // You can replace this with a more sophisticated loading spinner/component
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-xl">Carregando autenticação...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect them to the /login page, but save the current location they were
    // trying to go to when they were redirected. This allows us to send them
    // along to that page after they login, which is a nicer user experience
    // than dropping them off on the home page.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />; // User is authenticated, render the child route component
};

export default ProtectedRoute;
