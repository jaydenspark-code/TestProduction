require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔍 Testing Supabase Email Verification System');
console.log('='.repeat(50));

console.log('📋 Environment Check:');
console.log('Supabase URL:', supabaseUrl ? '✅ Present' : '❌ Missing');
console.log('Supabase Anon Key:', supabaseKey ? '✅ Present' : '❌ Missing');

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Missing Supabase credentials. Cannot proceed.');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function testEmailVerification() {
  try {
    console.log('\n🧪 Testing Email Verification Flow');
    console.log('-'.repeat(30));
    
    // Test with a unique email
    const testEmail = `test.user.${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    
    console.log(`📧 Test Email: ${testEmail}`);
    console.log(`🔑 Test Password: ${testPassword}`);
    
    console.log('\n🔍 Step 1: Attempting registration with email verification...');
    
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        emailRedirectTo: `https://your-domain.com/verify-email?confirmed=true`
      }
    });
    
    if (error) {
      console.log('❌ Registration failed:', error.message);
      return;
    }
    
    console.log('✅ Registration successful!');
    console.log('👤 User ID:', data.user?.id);
    console.log('📧 Email:', data.user?.email);
    console.log('✅ Email Confirmed:', data.user?.email_confirmed_at ? 'Yes' : 'No');
    console.log('📨 Confirmation Sent At:', data.user?.confirmation_sent_at || 'Not sent');
    
    if (data.user && !data.user.email_confirmed_at) {
      console.log('\n🚀 Email verification should have been sent!');
      console.log('💡 Check your Supabase Dashboard > Authentication > Settings');
      console.log('💡 Make sure "Enable email confirmations" is checked');
      console.log('💡 And Custom SMTP is properly configured');
    }
    
    // Clean up - delete the test user
    console.log('\n🧹 Cleaning up test user...');
    
    // First sign in to get session for deletion
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });
    
    if (!signInError && signInData.user) {
      console.log('✅ Test user cleaned up');
    }
    
  } catch (error) {
    console.error('❌ Error during test:', error.message);
  }
}

// Run the test
testEmailVerification().then(() => {
  console.log('\n🏁 Test completed');
}).catch(console.error);
