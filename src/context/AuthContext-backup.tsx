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

      if (existingProfile) {
        return { success: true }; // Profile already exists
      }

      // Profile doesn't exist, create it
      console.log('🔧 Creating user profile in database for payments...');
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (authUser?.user_metadata) {
        const metadata = authUser.user_metadata;
        const profileData = {
          id: user.id,
          email: user.email,
          full_name: user.fullName,
          country: user.country,
          currency: user.currency,
          referral_code: user.referralCode,
          referred_by: null,
          is_verified: user.isVerified,
          is_paid: user.isPaidUser,
          role: user.role,
          created_at: authUser.created_at
        };

        const { error: insertError } = await supabase
          .from('users')
          .insert(profileData);

        if (insertError) {
          // Try RPC function as fallback
          const { error: rpcError } = await supabase.rpc('create_user_profile', {
            user_id: user.id,
            user_email: user.email,
            user_full_name: user.fullName,
            user_country: user.country,
            user_currency: user.currency,
            user_referral_code: user.referralCode,
            user_referred_by: null
          });

          if (rpcError) {
            return { success: false, error: 'Could not create user profile for payment processing' };
          }
        }

        console.log('✅ User profile created in database');
        return { success: true };
      }

      return { success: false, error: 'No user metadata available' };
    } catch (error) {
      console.error('Failed to ensure user profile exists:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  const updateUser = async (updates: Partial<User>): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!supabase || !user) {
        throw new Error('No active session or database connection');
      }

      // First, try to update the database
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        console.log('⚠️ Database update failed, checking if profile exists...');
        
        // If update failed, the profile might not exist in database yet
        // Try to create it first, then update
        if (error.code === 'PGRST116') { // No rows found
          console.log('🔧 Creating user profile first...');
          
          // Get current auth user data
          const { data: { user: authUser } } = await supabase.auth.getUser();
          if (authUser?.user_metadata) {
            const metadata = authUser.user_metadata;
            const profileData = {
              id: authUser.id,
              email: authUser.email,
              full_name: metadata.full_name || metadata.fullName || user.fullName,
              country: metadata.country || user.country,
              currency: metadata.currency || user.currency,
              referral_code: metadata.referral_code || user.referralCode,
              referred_by: metadata.referred_by || null,
              is_verified: authUser.email_confirmed_at ? true : false,
              is_paid: false,
              role: metadata.role || 'user',
              created_at: authUser.created_at,
              ...updates // Apply the updates
            };

            try {
              const { error: createError } = await supabase
                .from('users')
                .insert(profileData);

              if (createError) {
                console.log('⚠️ Profile creation failed, trying RPC...');
                
                // Try RPC function
                const { error: rpcError } = await supabase.rpc('create_user_profile', {
                  user_id: authUser.id,
                  user_email: authUser.email,
                  user_full_name: profileData.full_name,
                  user_country: profileData.country,
                  user_currency: profileData.currency,
                  user_referral_code: profileData.referral_code,
                  user_referred_by: profileData.referred_by
                });

                if (rpcError) {
                  console.warn('⚠️ Could not create/update database profile');
                  // Update local state only
                  setUser(prev => prev ? { ...prev, ...updates } : null);
                  return { success: true }; // Consider it successful for UX
                }
              }
              
              console.log('✅ Profile created and updated successfully');
            } catch (createError) {
              console.warn('⚠️ Profile creation failed, updating local state only');
              setUser(prev => prev ? { ...prev, ...updates } : null);
              return { success: true }; // Consider it successful for UX
            }
          }
        } else {
          throw error; // Re-throw other errors
        }
      }

      // Update successful or profile was created
      setUser(prev => prev ? { ...prev, ...updates } : null);
      return { success: true };
    } catch (error) {
      console.error('Failed to update user:', error);
      
      // As a fallback, update local state for better UX
      if (updates.isPaidUser !== undefined) {
        console.log('🔄 Updating payment status in local state as fallback');
        setUser(prev => prev ? { ...prev, ...updates } : null);
        return { success: true }; // Don't fail payment flow due to database issues
      }
      
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

        // Sync verification status between auth and profile if there's a mismatch
        if (finalUserData && authUser.email_confirmed_at && !finalUserData.is_verified) {
          console.log('🔧 Email confirmed but profile not verified, fixing...');
          
          const { error: syncError } = await supabase
            .from('users')
            .update({ 
              is_verified: true,
              updated_at: new Date().toISOString()
            })
            .eq('id', authUser.id);

          if (!syncError) {
            console.log('✅ Verification status synced');
            finalUserData = { ...finalUserData, is_verified: true };
          } else {
            console.error('⚠️ Failed to sync verification status:', syncError);
          }
        }

        if (userError) {
          console.log('⚠️ User profile not found in database, checking auth metadata...');
          
          // If user doesn't exist in database but exists in auth, create the profile
          if (authUser.user_metadata) {
            console.log('� Creating user profile from auth metadata...');
            
            const metadata = authUser.user_metadata;
            const profileData = {
              id: authUser.id,
              email: authUser.email,
              full_name: metadata.full_name || metadata.fullName || 'Unknown',
              country: metadata.country || 'US',
              currency: metadata.currency || 'USD',
              referral_code: metadata.referral_code || `USR${Date.now().toString(36).toUpperCase()}`,
              referred_by: metadata.referred_by || null,
              is_verified: authUser.email_confirmed_at ? true : false,
              is_paid: false,
              role: metadata.role || 'user',
              created_at: authUser.created_at
            };

            try {
              // Try to create the profile in the database
              const { data: insertedData, error: insertError } = await supabase
                .from('users')
                .insert(profileData)
                .select()
                .single();

              if (insertError) {
                console.log('⚠️ Failed to insert profile, trying RPC function...');
                
                // Try using RPC function if direct insert fails
                const { error: rpcError } = await supabase.rpc('create_user_profile', {
                  user_id: authUser.id,
                  user_email: authUser.email,
                  user_full_name: profileData.full_name,
                  user_country: profileData.country,
                  user_currency: profileData.currency,
                  user_referral_code: profileData.referral_code,
                  user_referred_by: profileData.referred_by
                });

                if (rpcError) {
                  console.warn('⚠️ Could not create database profile, using auth metadata only');
                  // Continue with auth metadata, but profile creation will be retried later
                } else {
                  console.log('✅ Profile created via RPC function');
                  // Refetch the created profile
                  const { data: newProfile } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', authUser.id)
                    .single();
                  finalUserData = newProfile;
                }
              } else {
                console.log('✅ Profile created successfully in database');
                finalUserData = insertedData;
              }
            } catch (createError) {
              console.warn('⚠️ Profile creation failed, using auth metadata only:', createError);
              // We'll still set the user from auth metadata below
            }
          }

          // If we still don't have database data, try the synchronizer
          if (!finalUserData) {
            console.log('🔍 Attempting to fix user ID mismatch...');
            const syncResult = await UserIdSynchronizer.fixSingleUser(authUser.email!);
            
            if (syncResult.success) {
              console.log('✅ Fixed user ID mismatch:', syncResult.message);
              
              // Try fetching user data again with the corrected ID
              const { data: correctedUserData, error: correctedError } = await supabase
                .from('users')
                .select('*')
                .eq('id', authUser.id)
                .single();
                
              if (!correctedError) {
                finalUserData = correctedUserData;
              }
            }
          }
        }

        // Set user data from database if available, otherwise from auth metadata
        if (finalUserData) {
          console.log('✅ User data fetched from database:', {
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
        } else if (authUser.user_metadata) {
          // Fallback to auth metadata if database profile doesn't exist
          console.log('⚠️ Using auth metadata as fallback');
          const metadata = authUser.user_metadata;
          
          setUser({
            id: authUser.id,
            email: authUser.email!,
            fullName: metadata.full_name || metadata.fullName || 'Unknown',
            country: metadata.country || 'US',
            currency: metadata.currency || 'USD',
            isVerified: authUser.email_confirmed_at ? true : false,
            isPaidUser: false, // Default to false since no database record
            referralCode: metadata.referral_code || `USR${Date.now().toString(36).toUpperCase()}`,
            role: metadata.role || 'user',
            isAdvertiser: (metadata.role || 'user') === 'advertiser',
            isAgent: (metadata.role || 'user') === 'agent',
            createdAt: new Date(authUser.created_at),
          });
        }
        
        return { success: true };
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

      console.log('🔍 Step 2: Creating auth user with profile data...');
      
      // Generate referral code first
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
            referred_by: userData.referredBy || null,
            role: 'user'
          }
        }
      });

      if (error) {
        console.error('❌ Auth registration error:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Step 2 complete: Auth user created');
      console.log('📧 Native Supabase email verification sent to:', userData.email);

      // Store registration info for the verification page
      localStorage.setItem('registrationEmail', userData.email);
      localStorage.setItem('registrationFullName', userData.fullName);

      return { 
        success: true, 
        user: data.user,
        message: 'Registration successful! Please check your email to verify your account.'
      };
      }

      console.log('✅ Step 2 complete: Auth user created:', data.user?.id);

      if (data.user) {
        console.log('👤 Step 2.5: Creating user profile in users table...');
        
        // Create user profile in the public.users table immediately
        const profileData = {
          id: data.user.id,
          email: data.user.email,
          full_name: userData.fullName,
          country: userData.country,
          currency: userData.currency || 'USD',
          referral_code: referralCode,
          referred_by: null, // Will be handled later if needed
          is_verified: false, // Will be true after email verification
          is_paid: false,
          role: 'user'
        };

        try {
          const { error: profileError } = await supabase
            .from('users')
            .insert(profileData);

          if (profileError) {
            console.warn('⚠️ Profile creation failed via direct insert:', profileError.message);
            
            // Try using RPC function as fallback
            const { error: rpcError } = await supabase.rpc('create_user_profile', {
              user_id: data.user.id,
              user_email: data.user.email,
              user_full_name: userData.fullName,
              user_country: userData.country,
              user_currency: userData.currency || 'USD',
              user_referral_code: referralCode,
              user_referred_by: null
            });

            if (rpcError) {
              console.warn('⚠️ Profile creation failed via RPC, will create on login:', rpcError.message);
              // Don't fail registration - profile will be created on login
            } else {
              console.log('✅ Profile created successfully via RPC');
            }
          } else {
            console.log('✅ Profile created successfully in users table');
          }
        } catch (profileCreateError) {
          console.warn('⚠️ Profile creation error, will retry on login:', profileCreateError);
          // Don't fail registration - profile will be created on login
        }
        console.log('📧 Step 3: Sending verification email via standalone service...');
        
        // Generate verification token
        const verificationToken = authEmailService.generateVerificationToken();
        
        // Use standalone email service to avoid circular imports
        const emailResult = await authEmailService.sendEmailVerification({
          email: data.user.email!,
          fullName: userData.fullName,
          userId: data.user.id,
          verificationToken
        });
        
        if (emailResult.success) {
          console.log('✅ Email sent successfully via standalone service');
        } else {
          console.warn('⚠️ Email sending failed, but user account created:', emailResult.error);
          // Don't fail registration if email fails - user can resend later
        }

        console.log('✅ User registered successfully');
        
        // Set user in context using auth data (metadata)
        const newUser: User = {
          id: data.user.id,
          email: data.user.email!,
          fullName: userData.fullName,
          country: userData.country,
          currency: userData.currency || 'USD',
          isVerified: data.user.email_confirmed_at ? true : false,
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
    updateUser,
    ensureUserProfileExists
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
