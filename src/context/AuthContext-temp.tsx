import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { supabase } from '../lib/supabase';
// import { authEmailService } from '../services/authEmailService';  // TEMPORARILY COMMENTED OUT
// import { hybridEmailService } from '../services/hybridEmailService';  // TEMPORARILY COMMENTED OUT
import { UserIdSynchronizer } from '../utils/userIdSynchronizer';
import { showToast } from '../utils/toast';
import { handleApiError, getErrorMessage } from '../utils/errorHandling';
import { useAsyncOperation } from '../hooks/useAsyncOperation';
// import CustomEmailVerificationService from '../services/customEmailVerificationService';  // TEMPORARILY COMMENTED OUT

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; requires2FA?: boolean; error?: string }>;
  verify2FA: (token: string) => Promise<{ success: boolean; error?: string }>;
  register: (userData: Partial<User> & { password: string; email: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<{ success: boolean; error?: string }>;
  isAuthenticated: boolean;
  loading: boolean;
  refreshUser: () => Promise<{ success: boolean; error?: string }>;
  updateUser: (updates: Partial<User>) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Simplified functions for now
  const login = async (email: string, password: string) => {
    console.log('🔍 LOGIN ATTEMPT (Temporary):', email);
    showToast.info('Login functionality temporarily disabled');
    return { success: false, error: 'Login temporarily disabled' };
  };

  const verify2FA = async (token: string) => {
    console.log('🔍 2FA VERIFICATION (Temporary):', token);
    return { success: false, error: '2FA temporarily disabled' };
  };

  const register = async (userData: Partial<User> & { password: string; email: string }) => {
    console.log('🔍 REGISTRATION ATTEMPT (Temporary):', userData.email);
    showToast.info('Registration functionality temporarily disabled');
    return { success: false, error: 'Registration temporarily disabled' };
  };

  const logout = async () => {
    console.log('🔍 LOGOUT ATTEMPT (Temporary)');
    setUser(null);
    return { success: true };
  };

  const refreshUser = async () => {
    console.log('🔍 REFRESH USER (Temporary)');
    return { success: true };
  };

  const updateUser = async (updates: Partial<User>) => {
    console.log('🔍 UPDATE USER (Temporary):', updates);
    return { success: true };
  };

  useEffect(() => {
    // Initialize without problematic imports
    console.log('🚀 AuthProvider initializing (temporary mode)');
    setLoading(false);
  }, []);

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{
      user,
      login,
      verify2FA,
      register,
      logout,
      isAuthenticated,
      loading,
      refreshUser,
      updateUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
