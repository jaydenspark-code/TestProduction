require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Checking Supabase Authentication Configuration');
console.log('='.repeat(50));

console.log('📋 Environment Check:');
console.log('Supabase URL:', supabaseUrl ? '✅ Present' : '❌ Missing');
console.log('Service Role Key:', supabaseServiceKey ? '✅ Present' : '❌ Missing');

if (!supabaseUrl) {
  console.log('❌ Missing Supabase URL. Cannot proceed.');
  process.exit(1);
}

if (!supabaseServiceKey) {
  console.log('⚠️ Service role key not found. Using anon key for limited access.');
}

// Initialize Supabase client with service role for admin access
const supabase = createClient(
  supabaseUrl, 
  supabaseServiceKey || process.env.VITE_SUPABASE_ANON_KEY
);

async function checkAuthSettings() {
  try {
    console.log('\n🔍 Checking Authentication Settings...');
    console.log('-'.repeat(40));
    
    // Try to get auth config (requires service role)
    if (supabaseServiceKey) {
      console.log('🔧 Using service role key to check settings...');
      
      // Check current auth configuration
      const { data: settings, error } = await supabase.auth.admin.listUsers({
        page: 1,
        perPage: 1
      });
      
      if (error) {
        console.log('❌ Error accessing auth admin:', error.message);
      } else {
        console.log('✅ Auth admin access working');
        console.log('👥 Total users in auth table:', settings.length || 0);
      }
    }
    
    // Test registration with email confirmation explicitly
    console.log('\n🧪 Testing with manual email confirmation requirement...');
    
    const testEmail = `verify.test.${Date.now()}@example.com`;
    const testPassword = 'VerifyTest123!';
    
    console.log(`📧 Test Email: ${testEmail}`);
    
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        emailRedirectTo: `${supabaseUrl.replace('/rest/v1', '')}/auth/v1/verify?token={token}&type=signup&redirect_to=https://your-app.com/verify-email`,
        data: {
          test: true
        }
      }
    });
    
    if (error) {
      console.log('❌ Registration error:', error.message);
      return;
    }
    
    console.log('\n📊 Registration Results:');
    console.log('👤 User ID:', data.user?.id);
    console.log('📧 Email:', data.user?.email);
    console.log('✅ Email Confirmed:', data.user?.email_confirmed_at ? 'Yes' : 'No');
    console.log('📨 Confirmation Sent At:', data.user?.confirmation_sent_at || 'Not sent');
    console.log('🔐 Email Change Sent At:', data.user?.email_change_sent_at || 'Not sent');
    
    // Check what's in the auth.users table
    if (supabaseServiceKey && data.user) {
      console.log('\n🔍 Checking user in auth table...');
      const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(data.user.id);
      
      if (authUser) {
        console.log('📊 Auth User Details:');
        console.log('- ID:', authUser.user.id);
        console.log('- Email:', authUser.user.email);
        console.log('- Confirmed At:', authUser.user.email_confirmed_at || 'Not confirmed');
        console.log('- Last Sign In:', authUser.user.last_sign_in_at || 'Never');
        console.log('- Created At:', authUser.user.created_at);
      }
    }
    
    console.log('\n💡 DIAGNOSIS:');
    if (data.user?.email_confirmed_at) {
      console.log('🚨 ISSUE FOUND: Supabase is AUTO-CONFIRMING emails!');
      console.log('🔧 This means email verification is DISABLED in your project settings.');
      console.log('📋 To fix this:');
      console.log('   1. Go to Supabase Dashboard > Authentication > Settings');
      console.log('   2. Find "Enable email confirmations" and make sure it\'s CHECKED');
      console.log('   3. Save the settings');
      console.log('   4. Test registration again');
    } else {
      console.log('✅ Email confirmation is required (good!)');
      console.log('📧 Verification email should have been sent via your Custom SMTP');
    }
    
  } catch (error) {
    console.error('❌ Error during check:', error.message);
  }
}

// Run the check
checkAuthSettings().then(() => {
  console.log('\n🏁 Configuration check completed');
}).catch(console.error);
