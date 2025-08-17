// Diagnose Google OAuth User Creation Issues
import { supabase } from '../lib/supabase';

export const diagnoseGoogleOAuthIssue = async () => {
  console.log('🔍 Diagnosing Google OAuth user creation issues...');
  
  try {
    // 1. Check current session
    const { data: session, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Session Error:', sessionError);
      return { success: false, error: 'Session error', details: sessionError };
    }

    if (!session.session?.user) {
      console.log('ℹ️ No active session found');
      return { success: false, error: 'No active session' };
    }

    const user = session.session.user;
    console.log('✅ Active user session:', {
      id: user.id,
      email: user.email,
      provider: user.app_metadata?.provider,
      email_verified: user.email_confirmed_at !== null
    });

    // 2. Check if user exists in public users table
    const { data: existingUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (userError && userError.code !== 'PGRST116') {
      console.error('❌ Error checking existing user:', userError);
      return { success: false, error: 'Database query error', details: userError };
    }

    if (existingUser) {
      console.log('✅ User exists in public table:', existingUser);
      return { success: true, message: 'User already exists in public table', user: existingUser };
    }

    console.log('❌ User NOT found in public users table');

    // 3. Try to create the user record
    const userData = {
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || user.user_metadata?.name || 'Google User',
      is_verified: true,
      is_paid: false,
      country: 'US',
      currency: 'USD',
      role: 'user',
      referral_code: 'REF' + Math.random().toString(36).substr(2, 8).toUpperCase(),
      updated_at: new Date().toISOString()
    };

    console.log('📝 Attempting to create user with data:', userData);

    const { data: insertData, error: insertError } = await supabase
      .from('users')
      .insert([userData])
      .select()
      .single();

    if (insertError) {
      console.error('❌ Insert Error:', insertError);
      
      // Check specific error types
      if (insertError.code === '42501') {
        console.error('🔒 RLS Policy Error - User not allowed to insert');
        
        // Try with service role to bypass RLS
        console.log('🔧 Attempting with service role...');
        
        // Note: This would require service role key which should not be in frontend
        // This is just for diagnosis - we'll fix the RLS policy instead
        
        return { 
          success: false, 
          error: 'RLS Policy prevents user insertion',
          details: insertError,
          solution: 'Need to fix RLS policies for users table'
        };
      }
      
      return { success: false, error: 'Insert failed', details: insertError };
    }

    console.log('✅ User created successfully:', insertData);
    return { success: true, message: 'User created successfully', user: insertData };

  } catch (error) {
    console.error('❌ Diagnosis error:', error);
    return { success: false, error: 'Unexpected error', details: error };
  }
};

// Check RLS policies (this would need admin access)
export const checkRLSPolicies = async () => {
  console.log('🔍 Checking RLS policies...');
  
  try {
    // This query would need admin access to work
    const { data, error } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'users');

    if (error) {
      console.error('❌ Cannot check RLS policies (need admin access):', error);
      return { success: false, error: 'Need admin access to check policies' };
    }

    console.log('📋 RLS Policies for users table:', data);
    return { success: true, policies: data };

  } catch (error) {
    console.error('❌ RLS check error:', error);
    return { success: false, error: 'RLS check failed' };
  }
};

// Export for console access
if (typeof window !== 'undefined') {
  window.diagnoseGoogleOAuthIssue = diagnoseGoogleOAuthIssue;
  window.checkRLSPolicies = checkRLSPolicies;
}
