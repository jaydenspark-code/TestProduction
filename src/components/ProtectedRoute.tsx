import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiresPaid?: boolean;
  allowedRoles?: string[];
  allowUnpaidAccess?: boolean; // New prop to explicitly allow unpaid access
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiresPaid = false, 
  allowedRoles = [],
  allowUnpaidAccess = false // Default to false for strict pay-to-access
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

  // Test accounts - bypass all restrictions
  const testEmails = [
    'thearnest7@gmail.com',
    'ijaydenspark@gmail.com', 
    'princeedie142@gmail.com',
    'noguyliketrey@gmail.com'
  ];
  
  const isTestAccount = testEmails.includes(user?.email || '');
  
  if (isTestAccount) {
    // Test accounts have full access - bypass all checks
    return <>{children}</>;
  }

  // If user is not verified, redirect to email verification
  if (!user.isVerified) {
    return <Navigate to="/verify-email" replace />;
  }

  // STRICT PAY-TO-ACCESS MODEL: All routes require payment unless explicitly allowed
  // Only allow unpaid access if allowUnpaidAccess is explicitly set to true
  if (!user.isPaidUser && !allowUnpaidAccess) {
    return <Navigate to="/payment-required" replace />;
  }

  // If route specifically requires paid user and user hasn't paid, redirect to payment-required
  if (requiresPaid && !user.isPaidUser) {
    return <Navigate to="/payment-required" replace />;
  }

  // Check role-based access
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role || '')) {
    return <Navigate to="/dashboard" replace />;
  }

  // User meets all requirements, allow access
  return <>{children}</>;
};

export default ProtectedRoute;
