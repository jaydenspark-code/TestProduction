// Google OAuth User Verification Script
// This script checks if Google OAuth users are properly saved in both auth and public tables

import { supabase } from '../lib/supabase';

export const verifyGoogleOAuthUsers = async () => {
  console.log('🔍 Starting Google OAuth user verification...');
  
  try {
    // 1. Get all users from Supabase Auth
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Error fetching auth users:', authError);
      return { success: false, error: authError.message };
    }

    console.log(`📊 Found ${authUsers.users.length} users in auth table`);

    // 2. Filter Google OAuth users
    const googleUsers = authUsers.users.filter(user => 
      user.app_metadata?.provider === 'google' || 
      user.user_metadata?.iss?.includes('accounts.google.com')
    );

    console.log(`🎯 Found ${googleUsers.length} Google OAuth users in auth table`);

    // 3. Check if each Google user exists in public users table
    const verificationResults = [];
    
    for (const authUser of googleUsers) {
      console.log(`\n🔍 Checking user: ${authUser.email} (ID: ${authUser.id})`);
      
      // Check public users table
      const { data: publicUser, error: publicError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      const result = {
        email: authUser.email,
        id: authUser.id,
        authExists: true,
        publicExists: !publicError && publicUser !== null,
        publicError: publicError?.message,
        authData: {
          created_at: authUser.created_at,
          email_verified: authUser.email_confirmed_at !== null,
          provider: authUser.app_metadata?.provider,
          full_name: authUser.user_metadata?.full_name || authUser.user_metadata?.name
        },
        publicData: publicUser ? {
          email: publicUser.email,
          full_name: publicUser.full_name,
          is_verified: publicUser.is_verified,
          is_paid: publicUser.is_paid,
          country: publicUser.country,
          currency: publicUser.currency,
          referral_code: publicUser.referral_code,
          created_at: publicUser.created_at
        } : null
      };

      verificationResults.push(result);

      if (result.publicExists) {
        console.log(`✅ ${authUser.email} - EXISTS in both tables`);
      } else {
        console.log(`❌ ${authUser.email} - MISSING from public users table`);
        console.log(`   Error: ${result.publicError}`);
      }
    }

    // 4. Summary Report
    const summary = {
      totalGoogleUsers: googleUsers.length,
      usersInBothTables: verificationResults.filter(r => r.publicExists).length,
      missingFromPublic: verificationResults.filter(r => !r.publicExists).length,
      verificationResults
    };

    console.log('\n📋 VERIFICATION SUMMARY:');
    console.log(`Total Google OAuth users: ${summary.totalGoogleUsers}`);
    console.log(`✅ Exists in both tables: ${summary.usersInBothTables}`);
    console.log(`❌ Missing from public table: ${summary.missingFromPublic}`);

    if (summary.missingFromPublic > 0) {
      console.log('\n⚠️ ISSUES FOUND:');
      verificationResults
        .filter(r => !r.publicExists)
        .forEach(r => {
          console.log(`- ${r.email}: ${r.publicError}`);
        });
    }

    return { success: true, summary, results: verificationResults };

  } catch (error) {
    console.error('❌ Verification script error:', error);
    return { success: false, error: error.message };
  }
};

// Quick check for recent Google OAuth users
export const checkRecentGoogleUsers = async () => {
  console.log('\n🕐 Checking recent Google OAuth users (last 24 hours)...');
  
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: recentPublicUsers, error } = await supabase
      .from('users')
      .select('*')
      .gte('created_at', oneDayAgo)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching recent users:', error);
      return;
    }

    console.log(`📊 Found ${recentPublicUsers.length} recent users in public table`);
    
    recentPublicUsers.forEach(user => {
      console.log(`- ${user.email} (${user.created_at}) - Verified: ${user.is_verified}, Paid: ${user.is_paid}`);
    });

  } catch (error) {
    console.error('❌ Recent users check error:', error);
  }
};

// Export for use in console
if (typeof window !== 'undefined') {
  window.verifyGoogleOAuthUsers = verifyGoogleOAuthUsers;
  window.checkRecentGoogleUsers = checkRecentGoogleUsers;
}
