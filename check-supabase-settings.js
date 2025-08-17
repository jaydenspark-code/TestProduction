// Script to help diagnose Supabase auth settings
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bmtaqilpuszwoshtizmq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtdGFxaWxwdXN6d29zaHRpem1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwOTQwNjQsImV4cCI6MjA2ODY3MDA2NH0.QdtF2IFukonNWslwkUV1oQbpYBgdYhtekvjCywKR0vA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAuthSettings() {
  console.log('🔍 Checking Supabase Authentication Configuration...\n');
  
  try {
    // Test signup without confirmation
    const testEmail = `test-auth-${Date.now()}@example.com`;
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: 'TestPassword123!'
    });

    if (error) {
      console.error('❌ Signup failed:', error.message);
      return;
    }

    console.log('📊 ANALYSIS RESULTS:');
    console.log('==================');
    console.log('User ID:', data.user?.id);
    console.log('Email:', data.user?.email);
    console.log('Email confirmed:', data.user?.email_confirmed_at ? 'YES' : 'NO');
    console.log('Session created:', data.session ? 'YES (IMMEDIATE LOGIN)' : 'NO (REQUIRES CONFIRMATION)');
    
    if (data.session) {
      console.log('\n❌ PROBLEM DETECTED:');
      console.log('   Email confirmation is DISABLED in your Supabase project.');
      console.log('   Users are being logged in immediately without email verification.');
      console.log('\n🔧 TO FIX THIS:');
      console.log('   1. Go to: https://supabase.com/dashboard/project/bmtaqilpuszwoshtizmq/auth/settings');
      console.log('   2. Under "User Signups", enable "Enable email confirmations"');
      console.log('   3. Save the settings');
      console.log('   4. Test registration again');
    } else {
      console.log('\n✅ CONFIGURATION CORRECT:');
      console.log('   Email confirmation is properly enabled.');
      console.log('   Users must verify their email before logging in.');
    }

    // Check if user appears in auth.users
    console.log('\n📈 User Status:');
    if (data.user?.email_confirmed_at) {
      console.log('   Status: VERIFIED (email confirmed)');
    } else {
      console.log('   Status: PENDING (awaiting email confirmation)');
    }

  } catch (error) {
    console.error('💥 Error checking auth settings:', error);
  }
}

checkAuthSettings();
