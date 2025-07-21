import React from 'react';
import { Navigate } from 'react-router-dom';
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
  const { user, isAuthenticated, loading } = useAuth();

  // Debug logging
  console.log('ProtectedRoute - User state:', {
    user: user ? {
      id: user.id,
      email: user.email,
      isVerified: user.isVerified,
      isPaidUser: user.isPaidUser,
      role: user.role
    } : null,
    isAuthenticated,
    loading,
    requiresPaid,
    allowedRoles
  });

  if (loading) {
    console.log('ProtectedRoute - Loading state, showing spinner');
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('ProtectedRoute - Not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  if (requiresPaid && !user?.isPaidUser) {
    console.log('ProtectedRoute - Requires paid but user not paid, redirecting to payment');
    return <Navigate to="/payment" replace />;
  }

  if (!user?.isVerified) {
    console.log('ProtectedRoute - User not verified, redirecting to verify-email');
    return <Navigate to="/verify-email" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role || '')) {
    console.log('ProtectedRoute - User role not allowed, redirecting to dashboard');
    return <Navigate to="/dashboard" replace />;
  }

  console.log('ProtectedRoute - All checks passed, rendering children');
  return <>{children}</>;
};

export default ProtectedRoute;