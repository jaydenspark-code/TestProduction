// Fixed AuthContext.tsx - removes useAsyncOperation and simplifies error handling
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { supabase } from '../lib/supabase';
import { authEmailService } from '../services/authEmailService-standalone';
import { UserIdSynchronizer } from '../utils/userIdSynchronizer';
import { showToast } from '../utils/toast';
import { handleApiError, getErrorMessage } from '../utils/errorHandling';

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
  ensureUserProfileExists: () => Promise<{ success: boolean; error?: string }>;
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

  // Helper function to ensure user profile exists in database
  const ensureUserProfileExists = async (): Promise<{ success: boolean; error?: string }> => {
    if (!supabase || !user) {
      return { success: false, error: 'No active session' };
    }

    try {
      // Check if profile exists
      const { data: existingProfile, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('❌ Error checking profile existence:', checkError);
        return { success: false, error: checkError.message };
      }

      if (existingProfile) {
        console.log('✅ User profile already exists');
        return { success: true };
      }

      // Profile doesn't exist, create it
      console.log('📝 Creating user profile...');
      const profileData = {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        country: user.country,
        currency: user.currency || 'USD',
        referralCode: user.referralCode,
        role: user.role || 'user',
        isVerified: user.isVerified,
        isPaidUser: user.isPaidUser || false,
        isAdvertiser: user.isAdvertiser || false,
        isAgent: user.isAgent || false,
        createdAt: user.createdAt || new Date()
      };

      const { error: createError } = await supabase
        .from('users')
        .insert([profileData]);

      if (createError) {
        console.error('❌ Error creating user profile:', createError);
        return { success: false, error: createError.message };
      }

      console.log('✅ User profile created successfully');
      return { success: true };

    } catch (error) {
      console.error('❌ Unexpected error in ensureUserProfileExists:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  };

  // Update user data
  const updateUser = async (updates: Partial<User>): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!user) {
        return { success: false, error: 'No user logged in' };
      }

      console.log('📝 Updating user data:', updates);

      // Update in database if we have Supabase
      if (supabase) {
        const { error } = await supabase
          .from('users')
          .update(updates)
          .eq('id', user.id);

        if (error) {
          console.error('❌ Database update error:', error);
          
          // If user doesn't exist, try to create profile
          if (error.code === 'PGRST116') {
            console.log('🔧 User profile missing, creating...');
            try {
              const profileData = {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                country: user.country,
                currency: user.currency || 'USD',
                referralCode: user.referralCode,
                role: user.role || 'user',
                isVerified: user.isVerified,
                isPaidUser: user.isPaidUser || false,
                isAdvertiser: user.isAdvertiser || false,
                isAgent: user.isAgent || false,
                createdAt: user.createdAt || new Date(),
                ...updates
              };

              const { error: createError } = await supabase
                .from('users')
                .insert([profileData]);

              if (createError) {
                console.error('❌ Profile creation failed:', createError);
                return { success: false, error: createError.message };
              }

              console.log('✅ Profile created with updates');
            } catch (createError) {
              console.error('❌ Profile creation error:', createError);
              return { success: false, error: getErrorMessage(createError) };
            }
          } else {
            return { success: false, error: error.message };
          }
        }
      }

      // Update local state
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      console.log('✅ User updated successfully');
      return { success: true };

    } catch (error) {
      console.error('❌ Update user error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  };

  // Refresh user data from database
  const refreshUser = async (): Promise<{ success: boolean; error?: string }> => {
    if (!user?.id || !supabase) {
      return { success: false, error: 'No user session' };
    }

    try {
      console.log('🔄 Refreshing user data...');
      
      // Get current auth user
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        console.log('⚠️ No auth user found');
        setUser(null);
        return { success: false, error: 'No authentication session' };
      }

      // Try to get profile from database
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('❌ Error fetching profile:', error);
        return { success: false, error: error.message };
      }

      let userData: User;

      if (profile) {
        // Use database profile
        userData = {
          id: profile.id,
          email: profile.email,
          fullName: profile.fullName || profile.full_name,
          country: profile.country,
          currency: profile.currency || 'USD',
          isVerified: profile.isVerified || profile.is_verified || !!authUser.email_confirmed_at,
          isPaidUser: profile.isPaidUser || profile.is_paid_user || false,
          referralCode: profile.referralCode || profile.referral_code,
          role: profile.role || 'user',
          isAdvertiser: profile.isAdvertiser || profile.is_advertiser || false,
          isAgent: profile.isAgent || profile.is_agent || false,
          createdAt: profile.createdAt ? new Date(profile.createdAt) : new Date(profile.created_at || authUser.created_at)
        };
      } else {
        // Create from auth metadata
        const metadata = authUser.user_metadata || {};
        userData = {
          id: authUser.id,
          email: authUser.email!,
          fullName: metadata.full_name || metadata.name || '',
          country: metadata.country || '',
          currency: metadata.currency || 'USD',
          isVerified: !!authUser.email_confirmed_at,
          isPaidUser: false,
          referralCode: metadata.referral_code || `USR${Date.now().toString(36).toUpperCase()}`,
          role: 'user',
          isAdvertiser: false,
          isAgent: false,
          createdAt: new Date(authUser.created_at)
        };

        // Try to create profile in database
        try {
          const { error: createError } = await supabase
            .from('users')
            .insert([userData]);

          if (createError) {
            console.warn('⚠️ Could not create profile:', createError);
          } else {
            console.log('✅ Profile created during refresh');
          }
        } catch (createError) {
          console.warn('⚠️ Profile creation warning:', createError);
        }
      }

      setUser(userData);
      console.log('✅ User refreshed successfully');
      return { success: true };

    } catch (error) {
      console.error('❌ Refresh user error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  };

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        if (!supabase) {
          console.log('🧪 TESTING MODE: Auth initialization simulated');
          setLoading(false);
          return;
        }

        // Get initial session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          await refreshUser();
        }
      } catch (error) {
        console.error('❌ Auth initialization error:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('🔄 Auth state change:', event);
        
        if (event === 'SIGNED_IN' && session?.user) {
          await refreshUser();
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      });

      return () => subscription.unsubscribe();
    }
  }, []);

  // Login function
  const login = async (email: string, password: string): Promise<{ success: boolean; requires2FA?: boolean; error?: string }> => {
    setLoading(true);
    
    try {
      if (!supabase) {
        console.log('🧪 TESTING MODE: Login simulated');
        return { success: true };
      }

      console.log('🔐 Attempting login for:', email);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ Login error:', error.message);
        return { success: false, error: error.message };
      }

      if (!data.user) {
        return { success: false, error: 'Login failed - no user data' };
      }

      console.log('✅ Login successful');
      await refreshUser();
      return { success: true };

    } catch (error) {
      console.error('❌ Login error:', error);
      return { success: false, error: getErrorMessage(error) };
    } finally {
      setLoading(false);
    }
  };

  // 2FA verification
  const verify2FA = async (token: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // 2FA implementation would go here
      console.log('🔐 2FA verification for token:', token);
      return { success: true };
    } catch (error) {
      console.error('❌ 2FA verification error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  };

  // Registration function
  const register = async (userData: Partial<User> & { password: string; email: string }): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    
    try {
      if (!supabase) {
        console.log('🧪 TESTING MODE: Registration simulated');
        return { success: true };
      }

      // Validate required fields
      if (!userData.email) {
        return { success: false, error: 'Email is required' };
      }
      if (!userData.fullName) {
        return { success: false, error: 'Full name is required' };
      }
      if (!userData.country) {
        return { success: false, error: 'Country is required' };
      }

      console.log('📝 Starting registration for:', userData.email);

      // Check if email already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', userData.email)
        .single();

      if (existingUser) {
        return { success: false, error: 'Email already registered. Please try logging in instead.' };
      }

      // Generate referral code
      const referralCode = `USR${Date.now().toString(36).toUpperCase()}`;
      
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/verify-email?redirect_to=payment`,
          data: {
            full_name: userData.fullName,
            country: userData.country,
            currency: userData.currency || 'USD',
            referral_code: referralCode,
            role: 'user'
          },
        },
      });

      if (error) {
        console.error('❌ Registration error:', error);
        return { success: false, error: error.message };
      }

      if (data.user) {
        // Send verification email
        try {
          const emailResult = await authEmailService.sendVerificationEmail(
            data.user.email!,
            userData.fullName
          );
          
          if (emailResult.success) {
            console.log('✅ Email sent successfully');
          } else {
            console.warn('⚠️ Email sending failed:', emailResult.error);
          }
        } catch (emailError) {
          console.warn('⚠️ Email service error:', emailError);
        }

        // Set user in context
        const newUser: User = {
          id: data.user.id,
          email: data.user.email!,
          fullName: userData.fullName,
          country: userData.country,
          currency: userData.currency || 'USD',
          isVerified: !!data.user.email_confirmed_at,
          isPaidUser: false,
          referralCode,
          role: 'user',
          isAdvertiser: false,
          isAgent: false,
          createdAt: new Date(),
        };
        
        setUser(newUser);
        
        // Store for resend functionality
        localStorage.setItem('registrationEmail', data.user.email!);
        localStorage.setItem('registrationFullName', userData.fullName);
        
        return { success: true };
      }

      return { success: false, error: 'Registration failed - no user data returned' };
      
    } catch (error) {
      console.error('❌ Registration error:', error);
      return { success: false, error: getErrorMessage(error) };
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!supabase) {
        console.log('🧪 TESTING MODE: Logout simulated');
        setUser(null);
        return { success: true };
      }

      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('❌ Logout error:', error);
        return { success: false, error: error.message };
      }

      setUser(null);
      localStorage.removeItem('registrationEmail');
      localStorage.removeItem('registrationFullName');
      console.log('✅ Logout successful');
      return { success: true };
      
    } catch (error) {
      console.error('❌ Logout error:', error);
      return { success: false, error: getErrorMessage(error) };
    }
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        verify2FA,
        register,
        logout,
        isAuthenticated,
        loading,
        refreshUser,
        updateUser,
        ensureUserProfileExists,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
