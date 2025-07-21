import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { supabase } from '../lib/supabaseClient';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean, requires2FA?: boolean, error?: string }>;
  verify2FA: (token: string) => Promise<boolean>;
  register: (userData: Partial<User> & { password: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
  refreshUser: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
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

  const updateUser = (updates: Partial<User>) => {
    console.log('🧪 TESTING MODE: Updating user with:', updates);
    setUser(prev => prev ? { ...prev, ...updates } : null);
  };

  const refreshUser = async () => {
    // Add null check for testing mode
    if (!supabase) {
      console.log('🧪 TESTING MODE: Skipping user refresh');
      return;
    }

    try {
      const { data: { user: authUser }, error } = await supabase.auth.getUser();
      if (error) throw error;

      if (authUser) {
        console.log('Auth user found:', authUser.id);

        // Fetch user data from your public users table
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (userError) {
          console.error('Error fetching user data:', userError);
          throw userError;
        }

        if (userData) {
          console.log('User data fetched:', {
            id: userData.id,
            email: userData.email,
            is_verified: userData.is_verified,
            is_paid: userData.is_paid,
            role: userData.role
          });

          setUser({
            id: userData.id,
            email: userData.email,
            fullName: userData.full_name,
            country: userData.country,
            currency: userData.currency,
            isVerified: userData.is_verified,
            isPaidUser: userData.is_paid,
            referralCode: userData.referral_code,
            role: userData.role,
            isAdvertiser: userData.role === 'advertiser',
            isAgent: userData.role === 'agent',
            createdAt: userData.created_at,
          });
        } else {
          console.log('No user data found in database');
        }
      } else {
        console.log('No auth user found');
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  useEffect(() => {
    const checkSession = async () => {
      if (!supabase) {
        console.log('🧪 TESTING MODE: Skipping session check');
        setLoading(false);
        return;
      }

      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (session?.user) {
          await refreshUser();
        }
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Only set up auth listener if supabase exists
    if (!supabase) {
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          await refreshUser();
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean, requires2FA?: boolean, error?: string }> => {
    // Check if we're in testing mode
    if (!supabase) {
      console.log('🧪 TESTING MODE: Login simulated');
      console.log('Login attempt for:', email);
      
      // Simulate successful login
      const mockUser: User = {
        id: '1',
        email,
        fullName: 'Test User',
        country: 'US',
        currency: 'USD',
        isVerified: true,
        isPaidUser: true, // Set to true for testing
        referralCode: 'TEST123',
        role: 'user',
        isAdvertiser: false,
        isAgent: false,
        createdAt: new Date().toISOString(),
      };
      
      setUser(mockUser);
      return { success: true };
    }

    try {
      console.log('Attempting login for:', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        console.error('Supabase login error:', error);

        // Handle specific error cases
        if (error.message.includes('Email not confirmed') || error.message.includes('Invalid login credentials')) {
          return { success: false, error: 'Please confirm your email address before logging in.' };
        }

        return { success: false, error: error.message };
      }

      if (data.user) {
        console.log('Login successful for user:', data.user.id);
        await refreshUser();
        return { success: true };
      }

      return { success: false, error: 'Login failed: No user data returned.' };
    } catch (error: any) {
      console.error('Unexpected login error:', error);
      return { success: false, error: 'An unexpected error occurred during login.' };
    }
  };

  const verify2FA = async (token: string): Promise<boolean> => {
    try {
      // For now, we'll use a simple token verification
      // In a real implementation, you'd verify the token against your backend
      console.log('2FA verification with token:', token);
      return true;
    } catch (error) {
      console.error('2FA verification error:', error);
      return false;
    }
  };

  const register = async (userData: Partial<User> & { password: string }): Promise<{ success: boolean; error?: string }> => {
    // Complete frontend simulation
    console.log('🧪 TESTING MODE: Registration simulated');
    console.log('Registration data:', { ...userData, password: '[HIDDEN]' });
    
    // Simulate successful registration
    const mockUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      email: userData.email || '',
      fullName: userData.fullName || 'Test User',
      country: userData.country || 'US',
      currency: userData.currency || 'USD',
      isVerified: false, // Start as unverified
      isPaidUser: false,
      referralCode: Math.random().toString(36).substr(2, 8).toUpperCase(),
      role: 'user',
      isAdvertiser: false,
      isAgent: false,
      createdAt: new Date().toISOString(),
    };
    
    setUser(mockUser);
    
    // Simulate email verification needed
    setTimeout(() => {
      console.log('🧪 TESTING MODE: Email verification simulated');
      setUser(prev => prev ? { ...prev, isVerified: true } : null);
    }, 2000);
    
    return { success: true };
  };

  const logout = async () => {
    if (!supabase) {
      console.log('🧪 TESTING MODE: Logout simulated');
      setUser(null);
      return;
    }

    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const value = {
    user,
    login,
    verify2FA,
    register,
    logout,
    isAuthenticated: !!user,
    loading,
    refreshUser,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
