import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { supabase } from '../lib/supabase';
import { authEmailService } from '../services/authEmailService-standalone';
import { UserIdSynchronizer } from '../utils/userIdSynchronizer';
import { showToast } from '../utils/toast';
import { handleApiError, getErrorMessage } from '../utils/errorHandling';
import { useAsyncOperation } from '../hooks/useAsyncOperation';

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

  const updateUser = async (updates: Partial<User>): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!supabase || !user) {
        throw new Error('No active session or database connection');
      }

      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id)
        .single();

      if (error) throw error;

      setUser(prev => prev ? { ...prev, ...updates } : null);
      return { success: true };
    } catch (error) {
      console.error('Failed to update user:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' };
    }
  };

  const refreshUser = async (): Promise<{ success: boolean; error?: string }> => {
    if (!supabase) {
      console.log('🧪 TESTING MODE: Refreshing user data');
      
      if (user) {
        // In testing mode, check if this user has been approved as an agent
        const approvedAgents = JSON.parse(localStorage.getItem('approvedAgents') || '[]');
        const isApprovedAgent = approvedAgents.includes(user.email);
        
        if (isApprovedAgent && user.role !== 'agent') {
          console.log('🎯 User has been approved as agent, updating role...');
          const updatedUser = {
            ...user,
            role: 'agent' as any,
            isAgent: true
          };
          setUser(updatedUser);
          console.log('✅ User role updated to agent in testing mode');
        }
      }
      
      return { success: true };
    }

    try {
      const { data: { user: authUser }, error } = await supabase.auth.getUser();
      if (error) throw error;

      if (authUser) {
        console.log('🔍 Auth user found:', authUser.id);

        // Fetch user data from your public users table
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single();

        let finalUserData = userData;

        if (userError) {
          console.error('❌ Error fetching user data:', userError);
          console.log('🔍 Attempting to fix user ID mismatch...');
          
          // Use the synchronizer to fix ID mismatch
          const syncResult = await UserIdSynchronizer.fixSingleUser(authUser.email!);
          
          if (syncResult.success) {
            console.log('✅ Fixed user ID mismatch:', syncResult.message);
            
            // Try fetching user data again with the corrected ID
            const { data: correctedUserData, error: correctedError } = await supabase
              .from('users')
              .select('*')
              .eq('id', authUser.id)
              .single();
              
            if (correctedError) {
              console.error('❌ Still cannot fetch user data after sync:', correctedError);
              return { success: false, error: correctedError.message };
            }
            
            finalUserData = correctedUserData;
          } else {
            console.error('❌ Failed to sync user ID:', syncResult.message);
            return { success: false, error: syncResult.message };
          }
        }

        if (finalUserData) {
          console.log('✅ User data fetched:', {
            id: finalUserData.id,
            email: finalUserData.email,
            is_verified: finalUserData.is_verified,
            is_paid: finalUserData.is_paid
          });

          setUser({
            id: finalUserData.id,
            email: finalUserData.email,
            fullName: finalUserData.full_name,
            country: finalUserData.country,
            currency: finalUserData.currency,
            isVerified: finalUserData.is_verified,
            isPaidUser: finalUserData.is_paid,
            referralCode: finalUserData.referral_code,
            role: finalUserData.role,
            isAdvertiser: finalUserData.role === 'advertiser',
            isAgent: finalUserData.role === 'agent',
            createdAt: finalUserData.created_at,
          });
          return { success: true };
        }
      }
      return { success: true };
    } catch (error) {
      console.error('❌ Error refreshing user:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' };
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

    if (!supabase) {
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
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

  const { execute: login } = useAsyncOperation(async (email: string, password: string): Promise<{ success: boolean, requires2FA?: boolean, error?: string }> => {
    // Check for test accounts first
    const testAccounts = [
      { email: 'thearnest7@gmail.com', password: '1234567890', role: 'superadmin', fullName: 'The Earnest' },
      { email: 'ijaydenspark@gmail.com', password: '1234567890', role: 'agent', fullName: 'Jayden Spark' },
      { email: 'princeedie142@gmail.com', password: '1234567890', role: 'advertiser', fullName: 'Prince Edie' },
      { email: 'noguyliketrey@gmail.com', password: '1234567890', role: 'user', fullName: 'Noguyliketrey Trey' }
    ];

    const testAccount = testAccounts.find(acc => acc.email === email && acc.password === password);
    
    if (testAccount) {
      console.log('🧪 TEST ACCOUNT LOGIN:', testAccount.email);
      // Create a mock user for testing
      const mockUser: User = {
        id: `test-${Date.now()}`,
        email: testAccount.email,
        fullName: testAccount.fullName,
        country: 'US',
        currency: 'USD',
        isVerified: true, // Auto-verify test accounts
        isPaidUser: true, // Auto-mark as paid for test accounts
        referralCode: `TEST${Date.now()}`,
        role: testAccount.role as any,
        isAdvertiser: testAccount.role === 'advertiser',
        isAgent: testAccount.role === 'agent',
        createdAt: new Date(),
      };
      
      setUser(mockUser);
      return { success: true };
    }

    if (!supabase) {
      console.log('🧪 TESTING MODE: Login simulated');
      return { success: true };
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error:', error);
        return { success: false, error: error.message };
      }

      if (data.user) {
        await refreshUser();
        return { success: true };
      }

      return { success: false, error: 'Login failed' };
    } catch (error) {
      const apiError = handleApiError(error, { context: 'login' });
      const errorMessage = getErrorMessage(apiError);
      showToast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  });


  const verify2FA = async (token: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // For now, we'll use a simple token verification
      // In a real implementation, you'd verify the token against your backend
      console.log('2FA verification with token:', token);
      
      if (!token || token.length !== 6) {
        return { success: false, error: 'Invalid 2FA token format' };
      }
      
      // Simulate 2FA verification - replace with actual implementation
      return { success: true };
    } catch (error) {
      const apiError = handleApiError(error, { context: '2FA verification' });
      return { success: false, error: getErrorMessage(apiError) };
    }
  };

  interface RegisterData extends Partial<User> {
    password: string;
    email: string;
  }

  const { execute: register } = useAsyncOperation(async (userData: RegisterData): Promise<{ success: boolean; error?: string }> => {
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

      // Check if email already exists to prevent duplicate error
      console.log('🔍 Step 1: Checking for existing user...');
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', userData.email)
        .single();

      if (existingUser) {
        console.log('⚠️ User already exists:', existingUser);
        return { success: false, error: 'Email already registered. Please try logging in instead.' };
      }
      console.log('✅ Step 1 complete: No existing user found');

      console.log('🔍 Step 2: Creating auth user WITHOUT auto email...');
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/verify-email?confirmed=true`,
          data: {
            full_name: userData.fullName,
            country: userData.country
          }
        }
      });

      if (error) {
        console.error('❌ Auth registration error:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Step 2 complete: Auth user created:', data.user?.id);

      if (data.user) {
        console.log('🔍 Step 3: Generating referral code...');
        // Simplified referral code generation to avoid potential hanging
        const referralCode = `USR${Date.now().toString(36).toUpperCase()}`;
        console.log('✅ Step 3 complete: Referral code generated:', referralCode);

        console.log('🔍 Creating user profile with data:', {
          id: data.user.id,
          email: data.user.email,
          fullName: userData.fullName,
          country: userData.country,
          currency: userData.currency || 'USD',
          referralCode,
          referredBy: userData.referredBy
        });

        const profileData = {
          id: data.user.id,
          email: data.user.email,
          full_name: userData.fullName,
          country: userData.country,
          currency: userData.currency || 'USD',
          referral_code: referralCode,
          referred_by: userData.referredBy || null,
        };

        console.log('🔍 Step 4: Creating user profile...');
        const { error: profileError } = await supabase
          .from('users')
          .insert(profileData);
        
        console.log('✅ Step 4 complete: Profile insertion result:', profileError ? 'ERROR' : 'SUCCESS');

        if (profileError) {
          console.error('❌ Profile creation error details:', {
            message: profileError.message,
            details: profileError.details,
            hint: profileError.hint,
            code: profileError.code,
            profileData
          });
          
          // Clean up if profile creation fails
          try {
            await supabase.auth.admin.deleteUser(data.user.id);
            console.log('🧹 Cleaned up auth user after profile creation failure');
          } catch (cleanupError) {
            console.error('⚠️ Failed to cleanup auth user:', cleanupError);
          }
          
          return { success: false, error: `Failed to create user profile: ${profileError.message}` };
        }    
        
        console.log('📧 Step 5: Sending verification email via standalone service...');
        
        // Use standalone email service to avoid circular imports
        const emailResult = await authEmailService.sendEmailVerification({
          email: data.user.email!,
          fullName: userData.fullName,
          userId: data.user.id
        });
        
        if (emailResult.success) {
          console.log('✅ Email sent successfully via standalone service');
        } else {
          console.warn('⚠️ Email sending failed, but user account created:', emailResult.error);
          // Don't fail registration if email fails - user can resend later
        }

        console.log('✅ User registered successfully and profile created');
        
        // Set user in context (but not verified yet)
        const newUser: User = {
          id: data.user.id,
          email: data.user.email!,
          fullName: userData.fullName,
          country: userData.country,
          currency: userData.currency || 'USD',
          isVerified: false, // Will be true after email verification
          isPaidUser: false,
          referralCode,
          role: 'user',
          isAdvertiser: false,
          isAgent: false,
          createdAt: new Date(),
        };
        
        console.log('💾 Setting user in context:', {
          id: newUser.id,
          email: newUser.email,
          fullName: newUser.fullName,
          isVerified: newUser.isVerified
        });
        
        setUser(newUser);
        
        // Store user email in localStorage for resend functionality
        localStorage.setItem('registrationEmail', data.user.email!);
        localStorage.setItem('registrationFullName', userData.fullName);
        return { success: true };
      }

      return { success: false, error: 'Registration failed - no user data returned' };
    } catch (error: any) {
      console.error('💥 Unexpected registration error:', error);
      return { success: false, error: `An unexpected error occurred: ${error.message}` };
    }
  });

  const { execute: logout } = useAsyncOperation(async () => {
    if (!supabase) {
      console.log('🧪 TESTING MODE: Logout simulated');
      setUser(null);
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  });

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

export default AuthProvider;
