import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiresPaid?: boolean;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiresPaid = false, 
  allowedRoles = [] 
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
    </div>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If user is not verified, redirect to email verification
  if (!user.isVerified) {
    return <Navigate to="/verify-email" replace />;
  }

  // If route requires paid user and user hasn't paid, redirect to payment
  if (requiresPaid && !user.isPaidUser) {
    return <Navigate to="/payment" replace />;
  }

  // Check role-based access
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role || '')) {
    return <Navigate to="/dashboard" replace />;
  }

  // User meets all requirements, allow access
  return <>{children}</>;
};

export default ProtectedRoute;
