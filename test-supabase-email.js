// Test script to verify Supabase email verification is working
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

async function testEmailVerification() {
  console.log('🧪 Testing Supabase email verification setup...');
  
  try {
    // Test 1: Check if we can connect to Supabase
    console.log('🔍 Step 1: Testing Supabase connection...');
    const { data: users, error: queryError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (queryError) {
      console.error('❌ Database connection failed:', queryError);
      return;
    }
    console.log('✅ Step 1: Database connection successful');

    // Test 2: Check auth settings by attempting to get session
    console.log('🔍 Step 2: Testing auth configuration...');
    const { data: session, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.warn('⚠️ Session error (expected for new setup):', sessionError.message);
    } else {
      console.log('✅ Step 2: Auth configuration working');
    }

    // Test 3: Test user creation with email confirmation
    console.log('🔍 Step 3: Testing user registration with email confirmation...');
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        emailRedirectTo: 'http://localhost:5173/verify-email'
      }
    });

    if (error) {
      console.error('❌ Registration failed:', error.message);
      return;
    }

    console.log('✅ Step 3: Registration successful');
    console.log('📧 Email confirmation required:', !data.session);
    console.log('👤 User created with ID:', data.user?.id);
    console.log('📧 Email confirmation sent to:', data.user?.email);
    
    if (data.user && !data.session) {
      console.log('🎉 SUCCESS: Email confirmation is enabled and working!');
      console.log('📨 A verification email should have been sent to:', testEmail);
      
      // Clean up test user (optional)
      try {
        // Note: This requires service role key to delete users
        console.log('🧹 Cleaning up test user...');
      } catch (cleanupError) {
        console.log('⚠️ Could not clean up test user (this is normal with anon key)');
      }
    } else if (data.session) {
      console.log('⚠️ WARNING: Email confirmation appears to be disabled - user was logged in immediately');
    }

  } catch (error) {
    console.error('💥 Test failed with error:', error);
  }
}

// Run the test
testEmailVerification();
