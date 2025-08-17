// Fixed AuthContext.tsx - simplified error handling and removed problematic dependencies
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { supabase } from '../lib/supabase';
import { UserIdSynchronizer } from '../utils/userIdSynchronizer';
import { showToast } from '../utils/toast';
import { handleApiError, getErrorMessage } from '../utils/errorHandling';
import { envConfig } from '../config/environment';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; requires2FA?: boolean; error?: string; user?: User }>;
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
  // Global loading guard: block all children rendering until loading is false
  // Import LoadingSpinner dynamically to avoid circular deps
  const LoadingSpinner = React.useMemo(() => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      return require('../components/Layout/LoadingSpinner').default;
    } catch {
      return () => <div>Loading...</div>;
    }
  }, []);

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
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
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
              return { success: false, error: createError instanceof Error ? createError.message : 'Profile creation failed' };
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
      return { success: false, error: error instanceof Error ? error.message : 'Update failed' };
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
      let { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        // If ID lookup fails, try email lookup for cases where IDs don't match
        console.warn('⚠️ ID lookup failed, trying email lookup:', error.message);
        const { data: emailProfile, error: emailError } = await supabase
          .from('users')
          .select('*')
          .eq('email', authUser.email)
          .single();
          
        if (emailError) {
          console.error('❌ Error fetching profile by email:', emailError);
          return { success: false, error: emailError.message };
        }
        
        // Use the email-based profile but log the ID mismatch
        if (emailProfile && emailProfile.id !== authUser.id) {
          console.warn('⚠️ ID mismatch detected:', {
            authId: authUser.id,
            profileId: emailProfile.id,
            email: authUser.email
          });
        }
        
        profile = emailProfile;
      }

      let userData: User;

      if (profile) {
        // Use database profile with correct column mapping
        userData = {
          id: profile.id,
          email: profile.email,
          fullName: profile.full_name || profile.fullName || '', // Handle both column names
          country: profile.country || '',
          currency: profile.currency || 'USD',
          isVerified: profile.is_verified || profile.isVerified || !!authUser.email_confirmed_at,
          isPaidUser: profile.is_paid || profile.isPaidUser || false,
          referralCode: profile.referral_code || profile.referralCode || '',
          role: profile.role || 'user',
          isAdvertiser: profile.is_advertiser || profile.isAdvertiser || false,
          isAgent: profile.is_agent || profile.isAgent || false,
          createdAt: profile.created_at ? new Date(profile.created_at) : new Date(authUser.created_at)
        };
      } else {
        // If we still don't have database data, try the synchronizer
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
            profile = correctedUserData;
          }
        }

        // Create from auth metadata if still no profile
        if (!profile) {
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
        } else {
          // Use the fixed profile data
          userData = {
            id: profile.id,
            email: profile.email,
            fullName: profile.full_name || profile.fullName || '',
            country: profile.country || '',
            currency: profile.currency || 'USD',
            isVerified: profile.is_verified || profile.isVerified || !!authUser.email_confirmed_at,
            isPaidUser: profile.is_paid || profile.isPaidUser || false,
            referralCode: profile.referral_code || profile.referralCode || '',
            role: profile.role || 'user',
            isAdvertiser: profile.is_advertiser || profile.isAdvertiser || false,
            isAgent: profile.is_agent || profile.isAgent || false,
            createdAt: profile.created_at ? new Date(profile.created_at) : new Date(authUser.created_at)
          };
        }
      }

      setUser(userData);
      console.log('✅ User refreshed successfully');
      return { success: true };

    } catch (error) {
      console.error('❌ Refresh user error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Refresh failed' };
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
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: string, session: any) => {
        console.log('🔄 Auth state change:', event);
        
        if (event === 'SIGNED_IN' && session?.user) {
          await refreshUser();
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
        setLoading(false);
      });

      return () => subscription.unsubscribe();
    }
    
    // Return empty cleanup function if no supabase
    return () => {};
  }, []);

  // Login function
  const login = async (email: string, password: string): Promise<{ success: boolean; requires2FA?: boolean; error?: string; user?: User }> => {
    setLoading(true);
    
    try {
      // Check for test accounts first
      const testAccounts = [
        { email: 'thearnest7@gmail.com', password: '1234567890', role: 'superadmin', fullName: 'The Earnest' },
        { email: 'ijaydenspark@gmail.com', password: '1234567890', role: 'agent', fullName: 'Jayden Spark' },
        { email: 'princeedie142@gmail.com', password: '1234567890', role: 'advertiser', fullName: 'Prince Edie' },
        { email: 'noguyliketrey@gmail.com', password: '1234567890', role: 'user', fullName: 'Noguyliketrey Trey' },
        { email: 'ernest.debrah@bluecrest.edu.gh', password: '1234567890', role: 'user', fullName: 'Ernest Debrah' }
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
        showToast.success(`Welcome back, ${testAccount.fullName}!`);
        return { success: true, user: mockUser };
      }

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
        showToast.error(error.message);
        return { success: false, error: error.message };
      }

      if (!data.user) {
        return { success: false, error: 'Login failed - no user data' };
      }

      console.log('✅ Login successful - fetching user profile...');
      
      // Immediately fetch user profile data
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      let userData: User;
      
      if (profile) {
        userData = {
          id: profile.id,
          email: profile.email,
          fullName: profile.full_name || profile.fullName || '',
          country: profile.country || '',
          currency: profile.currency || 'USD',
          isVerified: profile.is_verified || profile.isVerified || !!data.user.email_confirmed_at,
          isPaidUser: profile.is_paid || profile.isPaidUser || false,
          referralCode: profile.referral_code || profile.referralCode || '',
          role: profile.role || 'user',
          isAdvertiser: profile.is_advertiser || profile.isAdvertiser || false,
          isAgent: profile.is_agent || profile.isAgent || false,
          createdAt: profile.created_at ? new Date(profile.created_at) : new Date()
        };
      } else {
        // Create user data from auth if no profile found
        userData = {
          id: data.user.id,
          email: data.user.email!,
          fullName: data.user.user_metadata?.full_name || '',
          country: '',
          currency: 'USD',
          isVerified: !!data.user.email_confirmed_at,
          isPaidUser: false, // Default to not paid
          referralCode: '',
          role: 'user',
          isAdvertiser: false,
          isAgent: false,
          createdAt: new Date()
        };
      }

      setUser(userData);
      console.log('✅ User data set:', userData);
      showToast.success('Welcome back!');
      return { success: true, user: userData };

    } catch (error) {
      console.error('❌ Login error:', error);
      const apiError = handleApiError(error, { context: 'login' });
      const errorMessage = getErrorMessage(apiError);
      showToast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // 2FA verification
  const verify2FA = async (token: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // For now, we'll use a simple token verification
      console.log('🔐 2FA verification for token:', token);
      
      if (!token || token.length !== 6) {
        const errorMessage = 'Invalid 2FA token format';
        showToast.error(errorMessage);
        return { success: false, error: errorMessage };
      }
      
      // Simulate 2FA verification - replace with actual implementation
      showToast.success('2FA verification successful');
      return { success: true };
    } catch (error) {
      console.error('❌ 2FA verification error:', error);
      const apiError = handleApiError(error, { context: '2FA verification' });
      const errorMessage = getErrorMessage(apiError);
      showToast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Registration function - uses existing Edge Functions
  const register = async (userData: Partial<User> & { password: string; email: string }): Promise<{ success: boolean; error?: string }> => {
    console.log('🎯 AuthContext register function called!');
    console.log('📝 Registration data received:', userData);
    
    setLoading(true);
    
    try {
      if (!supabase) {
        console.error('❌ Supabase client not available');
        return { success: false, error: 'Authentication service unavailable' };
      }

      console.log('🚀 Starting custom registration flow for:', userData.email);

      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('email')
        .eq('email', userData.email)
        .single();

      if (existingUser) {
        return { success: false, error: 'This email is already registered. Please try logging in instead.' };
      }

      // Generate user ID and referral code
      const userId = crypto.randomUUID();
      const referralCode = `USR${Date.now().toString(36).toUpperCase()}`;
      
      console.log('👤 Generated user ID:', userId);
      console.log('🔗 Generated referral code:', referralCode);

      // Step 1: Create user profile in database using your function
      console.log('� Creating user profile in database...');
      
      const { data: profileResult, error: profileError } = await supabase.rpc('create_user_profile', {
        p_user_id: userId,
        p_email: userData.email,
        p_full_name: userData.fullName || '',
        p_country: userData.country || 'US',
        p_currency: userData.currency || 'USD',
        p_phone: userData.phoneNumber || null,
        p_referral_code: referralCode,
        p_referred_by: userData.referredBy || null
      });

      if (profileError) {
        console.error('❌ Error creating user profile:', profileError);
        return { success: false, error: 'Failed to create user profile: ' + profileError.message };
      }

      console.log('✅ User profile created:', profileResult);

      // Step 2: Send verification email using your existing Edge Function
      console.log('📧 Sending verification email...');
      
      const emailResponse = await fetch(`${envConfig.supabase.url}/functions/v1/send-verification-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${envConfig.supabase.anonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: userData.email,
          userId: userId
        })
      });

      if (!emailResponse.ok) {
        const emailError = await emailResponse.text();
        console.error('❌ Email sending failed:', emailError);
        // Don't fail registration if email fails - user is already created
        console.warn('⚠️ User created but email failed. They can request new verification later.');
      } else {
        const emailResult = await emailResponse.json();
        console.log('✅ Verification email sent:', emailResult);
      }

      // Step 3: Store user data temporarily for verification page
      localStorage.setItem('registrationEmail', userData.email);
      localStorage.setItem('registrationUserId', userId);
      localStorage.setItem('registrationFullName', userData.fullName || '');

      // Step 4: Set user in context (unverified)
      const newUser: User = {
        id: userId,
        email: userData.email,
        fullName: userData.fullName || '',
        country: userData.country || 'US',
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

      console.log('🎉 Registration completed successfully!');
      console.log('📬 User should check email for verification code');
      
      showToast.success('Registration successful! Please check your email for verification code.');
      
      return { success: true };
      
    } catch (error) {
      console.error('❌ Registration error:', error);
      const apiError = handleApiError(error, { context: 'registration' });
      const errorMessage = getErrorMessage(apiError);
      showToast.error(errorMessage);
      return { success: false, error: errorMessage };
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
        showToast.success('Logged out successfully');
        return { success: true };
      }

      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('❌ Logout error:', error);
        showToast.error(error.message);
        return { success: false, error: error.message };
      }

      setUser(null);
      localStorage.removeItem('registrationEmail');
      localStorage.removeItem('registrationUserId');
      localStorage.removeItem('registrationFullName');
      console.log('✅ Logout successful');
      showToast.success('Logged out successfully');
      return { success: true };
      
    } catch (error) {
      console.error('❌ Logout error:', error);
      const apiError = handleApiError(error, { context: 'logout' });
      const errorMessage = getErrorMessage(apiError);
      showToast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const isAuthenticated = !!user;

  if (loading) {
    // Block all children rendering until loading is false
    return <LoadingSpinner message="Loading your account..." />;
  }

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
