import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { supabase } from '../lib/supabaseClient';
import { authEmailService } from '../services/authEmailService';
import { UserIdSynchronizer } from '../utils/userIdSynchronizer';

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

  const updateUser = (updates: Partial<User>) => {
    console.log('🧪 TESTING MODE: Updating user with:', updates);
    setUser(prev => prev ? { ...prev, ...updates } : null);
  };

  const refreshUser = async () => {
    if (!supabase) {
      console.log('🧪 TESTING MODE: Skipping user refresh');
      return;
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
              return;
            }
            
            finalUserData = correctedUserData;
          } else {
            console.error('❌ Failed to sync user ID:', syncResult.message);
            return;
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
        }
      }
    } catch (error) {
      console.error('❌ Error refreshing user:', error);
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

  const login = async (email: string, password: string): Promise<{ success: boolean, requires2FA?: boolean, error?: string }> => {
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
      console.error('Login error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    } finally {
      setLoading(false);
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
    if (!supabase) {
      console.log('🧪 TESTING MODE: Registration simulated');
      return { success: true };
    }

    try {
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

      console.log('🔍 Step 2: Creating auth user...');
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
      });

      if (error) {
        console.error('❌ Auth registration error:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Step 2 complete: Auth user created:', data.user.id);

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
        // Add delay to ensure auth user is fully created
        await new Promise(resolve => setTimeout(resolve, 1000));

        // First check if profile already exists
        const { data: existingProfile } = await supabase
          .from('users')
          .select('id')
          .eq('id', data.user.id)
          .single();

        if (existingProfile) {
          console.log('⚠️ Profile already exists, skipping creation');
        } else {
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
            
            // Clean up auth user if profile creation fails
            try {
              await supabase.auth.admin.deleteUser(data.user.id);
              console.log('🧹 Cleaned up auth user after profile creation failure');
            } catch (cleanupError) {
              console.error('⚠️ Failed to cleanup auth user:', cleanupError);
            }
            
            return { success: false, error: `Failed to create user profile: ${profileError.message}` };
          }
        }

        console.log('🔍 Step 5: Sending email verification...');
        try {
          const verificationToken = authEmailService.generateVerificationToken();
          
          console.log('📝 Storing verification token...');
          const storeResult = await authEmailService.storeVerificationToken(data.user.id, data.user.email!, verificationToken);
          if (!storeResult.success) {
            console.error('❌ Failed to store verification token:', storeResult.error);
            // Continue registration even if token storage fails
          } else {
            console.log('✅ Verification token stored successfully');
          }
          
          console.log('📧 Sending verification email...');
          const emailResult = await authEmailService.sendEmailVerification({
            email: data.user.email!,
            fullName: userData.fullName,
            verificationToken,
            userId: data.user.id
          });
          
          if (emailResult.success) {
            console.log('✅ Step 5 complete: Verification email sent successfully');
          } else {
            console.error('⚠️ Failed to send verification email:', emailResult.error);
            // Continue registration even if email sending fails
          }
        } catch (emailError: any) {
          console.error('💥 Unexpected error during email verification:', emailError.message);
          // Continue registration even if email verification fails completely
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
        
        setUser(newUser);
        return { success: true };
      }

      return { success: false, error: 'Registration failed - no user data returned' };
    } catch (error: any) {
      console.error('💥 Unexpected registration error:', error);
      return { success: false, error: `An unexpected error occurred: ${error.message}` };
    }
  };

  const logout = async () => {
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
