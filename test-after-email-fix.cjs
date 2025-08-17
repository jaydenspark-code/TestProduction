require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔍 Testing Email Verification After Settings Fix');
console.log('='.repeat(50));

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAfterFix() {
  try {
    console.log('\n🧪 Testing Registration with Email Verification...');
    console.log('-'.repeat(45));
    
    // Use a real email for testing (you can change this to your email)
    const testEmail = `test.verification.${Date.now()}@gmail.com`;
    const testPassword = 'TestPassword123!';
    
    console.log(`📧 Test Email: ${testEmail}`);
    console.log(`🔑 Test Password: ${testPassword}`);
    
    console.log('\n🔍 Attempting registration...');
    
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        emailRedirectTo: `${window?.location?.origin || 'https://localhost:5173'}/verify-email?confirmed=true`
      }
    });
    
    if (error) {
      console.log('❌ Registration failed:', error.message);
      return;
    }
    
    console.log('\n📊 Registration Results:');
    console.log('👤 User ID:', data.user?.id);
    console.log('📧 Email:', data.user?.email);
    console.log('✅ Email Confirmed:', data.user?.email_confirmed_at ? 'Yes (BAD)' : 'No (GOOD)');
    console.log('📨 Confirmation Sent At:', data.user?.confirmation_sent_at || 'Not sent');
    
    if (!data.user?.email_confirmed_at && data.user?.confirmation_sent_at) {
      console.log('\n🎉 SUCCESS! Email verification is now working!');
      console.log('📧 Verification email should have been sent via SendGrid');
      console.log('💡 Check the email inbox for the verification link');
    } else if (!data.user?.email_confirmed_at && !data.user?.confirmation_sent_at) {
      console.log('\n⚠️ Email confirmation required but no email sent');
      console.log('🔧 Check your Custom SMTP configuration in Supabase');
    } else {
      console.log('\n🚨 Still auto-confirming emails!');
      console.log('❌ Email confirmations are still disabled in Supabase');
    }
    
  } catch (error) {
    console.error('❌ Error during test:', error.message);
  }
}

console.log('⚠️  IMPORTANT: Before running this test, make sure you have:');
console.log('   1. ✅ Enabled "Enable email confirmations" in Supabase Dashboard');
console.log('   2. ✅ Verified Custom SMTP settings are correct');
console.log('   3. ✅ Saved the authentication settings');
console.log('\nPress Ctrl+C to cancel if you haven\'t done these steps yet...');
console.log('Or wait 5 seconds for the test to run automatically...\n');

// Wait 5 seconds then run test
setTimeout(() => {
  testAfterFix().then(() => {
    console.log('\n🏁 Test completed');
  }).catch(console.error);
}, 5000);
