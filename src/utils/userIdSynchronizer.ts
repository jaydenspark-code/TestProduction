import { supabase } from '../lib/supabaseClient';

interface UserSyncResult {
  success: boolean;
  message: string;
  fixed?: number;
  errors?: string[];
}

interface UserRecord {
  id: string;
  email: string;
  full_name: string;
  country: string;
  currency: string;
  is_verified: boolean;
  is_paid: boolean;
  role: string;
  balance: number;
  pending_earnings: number;
  total_earned: number;
  referral_code: string;
  referred_by: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Synchronizes user IDs between Supabase auth and the custom users table
 * This fixes the root cause of authentication and verification issues
 */
export class UserIdSynchronizer {
  /**
   * Main synchronization function that fixes ID mismatches
   */
  static async synchronizeUserIds(): Promise<UserSyncResult> {
    if (!supabase) {
      return {
        success: false,
        message: 'Supabase client not available'
      };
    }

    try {
      console.log('🔄 Starting user ID synchronization...');

      // Get all users from auth.users (requires service role key)
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) {
        console.error('❌ Failed to fetch auth users:', authError);
        return {
          success: false,
          message: `Failed to fetch auth users: ${authError.message}`
        };
      }

      // Get all users from public.users table
      const { data: publicUsers, error: publicError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: true });

      if (publicError) {
        console.error('❌ Failed to fetch public users:', publicError);
        return {
          success: false,
          message: `Failed to fetch public users: ${publicError.message}`
        };
      }

      console.log(`📊 Found ${authUsers.users.length} auth users and ${publicUsers.length} public users`);

      let fixedCount = 0;
      const errors: string[] = [];

      // Process each auth user
      for (const authUser of authUsers.users) {
        try {
          // Find corresponding public user by email
          const publicUser = publicUsers.find(pu => pu.email === authUser.email);
          
          if (!publicUser) {
            console.log(`⚠️ No public user found for auth user: ${authUser.email}`);
            continue;
          }

          // Check if IDs match
          if (publicUser.id === authUser.id) {
            console.log(`✅ User ${authUser.email} already has matching IDs`);
            continue;
          }

          console.log(`🔧 Fixing ID mismatch for ${authUser.email}: ${publicUser.id} -> ${authUser.id}`);

          // Update the public user record with the correct auth ID
          const { error: updateError } = await supabase
            .from('users')
            .update({ id: authUser.id })
            .eq('email', authUser.email);

          if (updateError) {
            const errorMsg = `Failed to update user ${authUser.email}: ${updateError.message}`;
            console.error('❌', errorMsg);
            errors.push(errorMsg);
            continue;
          }

          // Update all related records that reference the old user ID
          await this.updateRelatedRecords(publicUser.id, authUser.id);

          fixedCount++;
          console.log(`✅ Fixed user ${authUser.email}`);

        } catch (error: any) {
          const errorMsg = `Error processing user ${authUser.email}: ${error.message}`;
          console.error('❌', errorMsg);
          errors.push(errorMsg);
        }
      }

      const result: UserSyncResult = {
        success: true,
        message: `Synchronization completed. Fixed ${fixedCount} users.`,
        fixed: fixedCount,
        errors: errors.length > 0 ? errors : undefined
      };

      console.log('🎉 User ID synchronization completed:', result);
      return result;

    } catch (error: any) {
      console.error('💥 Unexpected error during synchronization:', error);
      return {
        success: false,
        message: `Unexpected error: ${error.message}`
      };
    }
  }

  /**
   * Updates all related records when a user ID changes
   */
  private static async updateRelatedRecords(oldId: string, newId: string): Promise<void> {
    const updates = [
      // Update withdrawal_requests
      supabase.from('withdrawal_requests').update({ user_id: newId }).eq('user_id', oldId),
      
      // Update transactions
      supabase.from('transactions').update({ user_id: newId }).eq('user_id', oldId),
      
      // Update agent_applications
      supabase.from('agent_applications').update({ user_id: newId }).eq('user_id', oldId),
      supabase.from('agent_applications').update({ reviewed_by: newId }).eq('reviewed_by', oldId),
      
      // Update advertiser_applications
      supabase.from('advertiser_applications').update({ user_id: newId }).eq('user_id', oldId),
      supabase.from('advertiser_applications').update({ reviewed_by: newId }).eq('reviewed_by', oldId),
      
      // Update campaigns
      supabase.from('campaigns').update({ advertiser_id: newId }).eq('advertiser_id', oldId),
      
      // Update referrals
      supabase.from('referrals').update({ referrer_id: newId }).eq('referrer_id', oldId),
      supabase.from('referrals').update({ referred_id: newId }).eq('referred_id', oldId),
      
      // Update notifications
      supabase.from('notifications').update({ user_id: newId }).eq('user_id', oldId),
      
      // Update user_sessions
      supabase.from('user_sessions').update({ user_id: newId }).eq('user_id', oldId),
      
      // Update users.referred_by
      supabase.from('users').update({ referred_by: newId }).eq('referred_by', oldId),
    ];

    const results = await Promise.allSettled(updates);
    
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.warn(`⚠️ Failed to update related records for table ${index}:`, result.reason);
      }
    });
  }

  /**
   * Validates that a user's auth ID matches their public profile ID
   */
  static async validateUserIdConsistency(email: string): Promise<{
    isConsistent: boolean;
    authId?: string;
    publicId?: string;
    message: string;
  }> {
    if (!supabase) {
      return {
        isConsistent: false,
        message: 'Supabase client not available'
      };
    }

    try {
      // Get auth user by email
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) {
        return {
          isConsistent: false,
          message: `Failed to fetch auth user: ${authError.message}`
        };
      }

      const authUser = authUsers.users.find(u => u.email === email);
      if (!authUser) {
        return {
          isConsistent: false,
          message: 'Auth user not found'
        };
      }

      // Get public user by email
      const { data: publicUser, error: publicError } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      if (publicError) {
        return {
          isConsistent: false,
          authId: authUser.id,
          message: `Failed to fetch public user: ${publicError.message}`
        };
      }

      const isConsistent = authUser.id === publicUser.id;

      return {
        isConsistent,
        authId: authUser.id,
        publicId: publicUser.id,
        message: isConsistent 
          ? 'User IDs are consistent' 
          : `ID mismatch: auth=${authUser.id}, public=${publicUser.id}`
      };

    } catch (error: any) {
      return {
        isConsistent: false,
        message: `Validation error: ${error.message}`
      };
    }
  }

  /**
   * Fixes a single user's ID mismatch
   */
  static async fixSingleUser(email: string): Promise<UserSyncResult> {
    if (!supabase) {
      return {
        success: false,
        message: 'Supabase client not available'
      };
    }

    try {
      const validation = await this.validateUserIdConsistency(email);
      
      if (validation.isConsistent) {
        return {
          success: true,
          message: 'User IDs are already consistent'
        };
      }

      if (!validation.authId || !validation.publicId) {
        return {
          success: false,
          message: validation.message
        };
      }

      // Update the public user record
      const { error: updateError } = await supabase
        .from('users')
        .update({ id: validation.authId })
        .eq('email', email);

      if (updateError) {
        return {
          success: false,
          message: `Failed to update user: ${updateError.message}`
        };
      }

      // Update related records
      await this.updateRelatedRecords(validation.publicId, validation.authId);

      return {
        success: true,
        message: `Successfully fixed user ${email}`,
        fixed: 1
      };

    } catch (error: any) {
      return {
        success: false,
        message: `Error fixing user: ${error.message}`
      };
    }
  }
}
