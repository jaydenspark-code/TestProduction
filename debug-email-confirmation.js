// Comprehensive test to debug email confirmation issues
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bmtaqilpuszwoshtizmq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtdGFxaWxwdXN6d29zaHRpem1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwOTQwNjQsImV4cCI6MjA2ODY3MDA2NH0.QdtF2IFukonNWslwkUV1oQbpYBgdYhtekvjCywKR0vA';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
});

async function debugEmailConfirmation() {
  console.log('🔧 COMPREHENSIVE EMAIL CONFIRMATION DEBUG');
  console.log('=========================================\n');
  
  try {
    // Test 1: Sign up with explicit email redirect
    console.log('🧪 Test 1: Signup with explicit email confirmation...');
    const testEmail = `debug-${Date.now()}@example.com`;
    
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: 'TestPassword123!',
      options: {
        emailRedirectTo: 'http://localhost:5173/verify-email',
        data: {
          full_name: 'Test User'
        }
      }
    });

    if (error) {
      console.error('❌ Signup failed:', error.message);
      console.error('Error details:', error);
      return;
    }

    console.log('\n📊 DETAILED RESULTS:');
    console.log('====================');
    console.log('✓ Signup call successful');
    console.log('✓ User created:', !!data.user);
    console.log('✓ User ID:', data.user?.id);
    console.log('✓ User email:', data.user?.email);
    console.log('✓ Email confirmed at:', data.user?.email_confirmed_at || 'NOT CONFIRMED');
    console.log('✓ Session created:', !!data.session);
    console.log('✓ Access token:', data.session?.access_token ? 'Present' : 'None');

    // Test 2: Check user confirmation status
    console.log('\n🔍 Test 2: Checking user confirmation status...');
    
    if (data.session) {
      console.log('⚠️  ISSUE: Session was created immediately');
      console.log('   This means email confirmation was bypassed');
      
      // Let's check what the user object shows
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userData.user) {
        console.log('   User confirmation timestamp:', userData.user.email_confirmed_at);
        console.log('   User metadata:', userData.user.user_metadata);
      }
    } else {
      console.log('✅ CORRECT: No session created, email confirmation required');
    }

    // Test 3: Try to resend confirmation email
    console.log('\n🔍 Test 3: Testing resend confirmation email...');
    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email: testEmail,
      options: {
        emailRedirectTo: 'http://localhost:5173/verify-email'
      }
    });

    if (resendError) {
      console.log('❌ Resend failed:', resendError.message);
      if (resendError.message.includes('already confirmed')) {
        console.log('   → This confirms email was auto-confirmed on signup');
      }
    } else {
      console.log('✅ Resend successful (email should be sent)');
    }

    // Test 4: Check if there are any auth state listeners
    console.log('\n🔍 Test 4: Setting up auth state listener...');
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(`🔔 Auth event: ${event}`);
      if (session) {
        console.log('   Session user:', session.user.email);
        console.log('   Email confirmed:', session.user.email_confirmed_at ? 'YES' : 'NO');
      }
    });

    // Clean up
    setTimeout(() => {
      subscription.unsubscribe();
      console.log('\n🧹 Cleaned up auth listener');
    }, 1000);

    // Recommendations
    console.log('\n💡 TROUBLESHOOTING RECOMMENDATIONS:');
    console.log('====================================');
    
    if (data.session) {
      console.log('1. ❗ Check your Supabase dashboard settings:');
      console.log('   → Authentication → Settings → Site URL');
      console.log('   → Make sure it matches: http://localhost:5173');
      console.log('');
      console.log('2. ❗ Check Email Templates:');
      console.log('   → Authentication → Settings → Email Templates');
      console.log('   → Ensure "Confirm signup" template is enabled');
      console.log('');
      console.log('3. ❗ Check if you have any RLS policies that might interfere');
      console.log('');
      console.log('4. ❗ Try clearing your browser cache and localStorage');
      console.log('');
      console.log('5. ❗ Check if there are any custom auth hooks or triggers');
    } else {
      console.log('✅ Email confirmation appears to be working correctly!');
    }

  } catch (error) {
    console.error('💥 Debug test failed:', error);
  }
}

debugEmailConfirmation();
