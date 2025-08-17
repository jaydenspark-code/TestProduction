// src/services/realBackendService.ts
import { supabase } from "../lib/supabase";
import { User as AuthUser } from '@supabase/supabase-js';
import { User } from '../types';

interface DatabaseUser {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  country: string;
  currency: string;
  phone?: string;
  is_verified: boolean;
  is_paid: boolean;
  role: 'user' | 'agent' | 'advertiser' | 'admin' | 'superadmin';
  balance: number;
  pending_earnings: number;
  total_earned: number;
  referral_code: string;
  referred_by?: string;
  created_at: string;
  updated_at: string;
}

export class RealBackendService {
  
  // Test connection to Supabase
  static async testConnection(): Promise<{ success: boolean; message: string; error?: any }> {
    if (!supabase) {
      return {
        success: false,
        message: 'Supabase client not initialized. Check environment variables.'
      };
    }

    try {
      console.log('🔍 Testing Supabase connection...');
      
      // Test 1: Check auth session
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('❌ Session test failed:', sessionError);
        return {
          success: false,
          message: 'Failed to get session',
          error: sessionError
        };
      }

      // Test 2: Try a simple database query
      const { data, error } = await supabase
        .from('users')
        .select('count')
        .limit(1);

      if (error) {
        console.error('❌ Database query failed:', error);
        return {
          success: false,
          message: `Database connection failed: ${error.message}`,
          error
        };
      }

      console.log('✅ Supabase connection successful');
      return {
        success: true,
        message: 'Successfully connected to Supabase'
      };

    } catch (error) {
      console.error('❌ Connection test failed:', error);
      return {
        success: false,
        message: 'Connection test failed',
        error
      };
    }
  }

  // Initialize database schema if needed
  static async initializeSchema(): Promise<{ success: boolean; message: string }> {
    if (!supabase) {
      return { success: false, message: 'Supabase not available' };
    }

    try {
      console.log('🔧 Checking database schema...');
      
      // Skip schema RPC check since it doesn't exist - just test basic connectivity
      // Try to query users table to test connection
      const { error: testError } = await supabase
        .from('users')
        .select('count')
        .limit(1);
      
      if (testError) {
        console.warn('⚠️ Database schema may not be ready:', testError.message);
        return {
          success: false,
          message: 'Database schema not ready. Please apply the database schema first.'
        };
      }

      console.log('✅ Database schema appears to be ready');
      return {
        success: true,
        message: 'Database schema ready'
      };

    } catch (error) {
      console.error('❌ Schema check failed:', error);
      return {
        success: false,
        message: `Schema check failed: ${error}`
      };
    }
  }

  // User authentication methods
  static async signUp(userData: {
    email: string;
    password: string;
    fullName: string;
    country: string;
    currency?: string;
    referredBy?: string;
  }): Promise<{ success: boolean; message: string; user?: User; error?: any }> {
    if (!supabase) {
      return { success: false, message: 'Supabase not available' };
    }

    try {
      console.log('🔐 Creating new user account...');

      // 1. Create auth user with email confirmation disabled for development
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            full_name: userData.fullName,
            country: userData.country
          }
        }
      });

      if (authError) {
        console.error('❌ Auth signup failed:', authError);
        return {
          success: false,
          message: authError.message,
          error: authError
        };
      }

      if (!authData.user) {
        return {
          success: false,
          message: 'Failed to create user account'
        };
      }

      // 2. Generate referral code
      const referralCode = await this.generateReferralCode();

      // 3. Create user profile
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: userData.email,
          full_name: userData.fullName,
          country: userData.country,
          currency: userData.currency || 'USD',
          referral_code: referralCode,
          referred_by: userData.referredBy || null,
          role: 'user',
          is_verified: false,
          is_paid: false,
          balance: 0,
          pending_earnings: 0,
          total_earned: 0
        })
        .select()
        .single();

      if (profileError) {
        console.error('❌ Profile creation failed:', profileError);
        // Clean up auth user if profile creation fails
        await supabase.auth.admin.deleteUser(authData.user.id);
        return {
          success: false,
          message: profileError.message,
          error: profileError
        };
      }

      console.log('✅ User created successfully');

      const user: User = {
        id: profileData.id,
        email: profileData.email,
        fullName: profileData.full_name,
        country: profileData.country,
        currency: profileData.currency,
        isVerified: profileData.is_verified,
        isPaidUser: profileData.is_paid,
        referralCode: profileData.referral_code,
        role: profileData.role,
        isAdvertiser: profileData.role === 'advertiser',
        isAgent: profileData.role === 'agent',
        createdAt: profileData.created_at,
      };

      return {
        success: true,
        message: 'Account created successfully',
        user
      };

    } catch (error) {
      console.error('❌ Signup process failed:', error);
      return {
        success: false,
        message: 'An unexpected error occurred',
        error
      };
    }
  }

  static async signIn(email: string, password: string): Promise<{
    success: boolean;
    message: string;
    user?: User;
    error?: any;
  }> {
    if (!supabase) {
      return { success: false, message: 'Supabase not available' };
    }

    try {
      console.log('🔐 Signing in user...');

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        console.error('❌ Sign in failed:', authError);
        return {
          success: false,
          message: authError.message,
          error: authError
        };
      }

      if (!authData.user) {
        return {
          success: false,
          message: 'Sign in failed'
        };
      }

      // Fetch user profile
      const userProfile = await this.getUserProfile(authData.user.id);
      if (!userProfile.success) {
        return {
          success: false,
          message: 'Failed to load user profile'
        };
      }

      console.log('✅ User signed in successfully');
      return {
        success: true,
        message: 'Signed in successfully',
        user: userProfile.user
      };

    } catch (error) {
      console.error('❌ Sign in process failed:', error);
      return {
        success: false,
        message: 'An unexpected error occurred',
        error
      };
    }
  }

  static async getUserProfile(userId: string): Promise<{
    success: boolean;
    message: string;
    user?: User;
    error?: any;
  }> {
    if (!supabase) {
      return { success: false, message: 'Supabase not available' };
    }

    try {
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('❌ Failed to fetch user profile:', profileError);
        return {
          success: false,
          message: profileError.message,
          error: profileError
        };
      }

      const user: User = {
        id: profileData.id,
        email: profileData.email,
        fullName: profileData.full_name,
        country: profileData.country,
        currency: profileData.currency,
        isVerified: profileData.is_verified,
        isPaidUser: profileData.is_paid,
        referralCode: profileData.referral_code,
        role: profileData.role,
        isAdvertiser: profileData.role === 'advertiser',
        isAgent: profileData.role === 'agent',
        createdAt: profileData.created_at,
      };

      return {
        success: true,
        message: 'User profile loaded',
        user
      };

    } catch (error) {
      console.error('❌ Get user profile failed:', error);
      return {
        success: false,
        message: 'Failed to load user profile',
        error
      };
    }
  }

  // Helper methods
  private static async generateReferralCode(): Promise<string> {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    
    for (let i = 0; i < 8; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    
    // Check if code already exists
    if (supabase) {
      const { data } = await supabase
        .from('users')
        .select('id')
        .eq('referral_code', result)
        .single();
      
      if (data) {
        // Code exists, generate another one
        return this.generateReferralCode();
      }
    }
    
    return result;
  }

  // Transaction methods
  static async createTransaction(userId: string, data: {
    type: 'earning' | 'withdrawal' | 'bonus' | 'referral';
    amount: number;
    description: string;
    reference?: string;
    metadata?: any;
  }): Promise<{ success: boolean; message: string; transaction?: any }> {
    if (!supabase) {
      return { success: false, message: 'Supabase not available' };
    }

    try {
      const reference = data.reference || `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const { data: transaction, error } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          type: data.type,
          amount: data.amount,
          description: data.description,
          reference,
          status: 'completed',
          metadata: data.metadata || {}
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Transaction creation failed:', error);
        return {
          success: false,
          message: error.message
        };
      }

      // Update user balance for earnings
      if (data.type === 'earning' || data.type === 'bonus' || data.type === 'referral') {
        // First get current values
        const { data: currentUser } = await supabase
          .from('users')
          .select('balance, total_earned')
          .eq('id', userId)
          .single();

        if (currentUser) {
          await supabase
            .from('users')
            .update({
              balance: (currentUser.balance || 0) + data.amount,
              total_earned: (currentUser.total_earned || 0) + data.amount
            })
            .eq('id', userId);
        }
      }

      return {
        success: true,
        message: 'Transaction created successfully',
        transaction
      };

    } catch (error) {
      console.error('❌ Transaction creation failed:', error);
      return {
        success: false,
        message: 'Failed to create transaction'
      };
    }
  }

  // Referral methods
  static async createReferral(referrerId: string, referredId: string): Promise<{
    success: boolean;
    message: string;
    referral?: any;
  }> {
    if (!supabase) {
      return { success: false, message: 'Supabase not available' };
    }

    try {
      const { data: referral, error } = await supabase
        .from('referrals')
        .insert({
          referrer_id: referrerId,
          referred_id: referredId,
          status: 'pending',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Referral creation failed:', error);
        return {
          success: false,
          message: error.message
        };
      }

      return {
        success: true,
        message: 'Referral created successfully',
        referral
      };

    } catch (error) {
      console.error('❌ Referral creation failed:', error);
      return {
        success: false,
        message: 'Failed to create referral'
      };
    }
  }
}

// Export singleton instance
export const realBackendService = new RealBackendService();
