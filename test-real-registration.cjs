require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔍 Testing Registration with Real Email');
console.log('='.repeat(50));

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRealRegistration() {
  try {
    console.log('\n🧪 Testing Registration for: mrforencics100@gmail.com');
    console.log('-'.repeat(50));
    
    const testEmail = 'mrforencics100@gmail.com';
    const testPassword = 'TestPassword123!';
    
    console.log(`📧 Email: ${testEmail}`);
    console.log(`🔑 Password: ${testPassword}`);
    
    console.log('\n🔍 Step 1: Checking if user already exists...');
    
    // First check if user already exists
    const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.log('⚠️ Cannot check existing users (using anon key)');
    } else {
      const existingUser = existingUsers.users.find(user => user.email === testEmail);
      if (existingUser) {
        console.log('⚠️ User already exists! Deleting first...');
        await supabase.auth.admin.deleteUser(existingUser.id);
        console.log('✅ Existing user deleted');
      } else {
        console.log('✅ No existing user found');
      }
    }
    
    console.log('\n🔍 Step 2: Attempting registration...');
    
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        emailRedirectTo: `https://your-app.vercel.app/verify-email?confirmed=true`
      }
    });
    
    if (error) {
      console.log('❌ Registration failed:', error.message);
      return;
    }
    
    console.log('\n📊 Registration Results:');
    console.log('👤 User ID:', data.user?.id);
    console.log('📧 Email:', data.user?.email);
    console.log('✅ Email Confirmed:', data.user?.email_confirmed_at ? 'Yes (AUTO-CONFIRMED)' : 'No (VERIFICATION REQUIRED)');
    console.log('📨 Confirmation Sent At:', data.user?.confirmation_sent_at || 'Not sent');
    
    if (!data.user?.email_confirmed_at) {
      console.log('\n🎉 SUCCESS! Email verification is required!');
      
      if (data.user?.confirmation_sent_at) {
        console.log('📧 ✅ Verification email SENT via SendGrid!');
        console.log('📬 Check mrforencics100@gmail.com inbox for verification email');
        console.log('📝 Look for email from: noreply@earnpro.org');
        console.log('📂 Check spam/junk folder if not in inbox');
      } else {
        console.log('📧 ❌ Verification email NOT sent');
        console.log('🔧 There might be an issue with SMTP configuration');
      }
    } else {
      console.log('\n🚨 ISSUE: Email was auto-confirmed (no verification required)');
      console.log('❌ This means email confirmations might still be disabled');
    }
    
    console.log('\n🔍 Step 3: Verifying user in auth table...');
    
    if (data.user) {
      try {
        const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(data.user.id);
        
        if (authUser) {
          console.log('📊 User found in auth table:');
          console.log('- ID:', authUser.user.id);
          console.log('- Email:', authUser.user.email);
          console.log('- Email Confirmed At:', authUser.user.email_confirmed_at || 'NOT CONFIRMED');
          console.log('- Confirmation Sent At:', authUser.user.confirmation_sent_at || 'NOT SENT');
          console.log('- Created At:', authUser.user.created_at);
        }
      } catch (authCheckError) {
        console.log('⚠️ Cannot access auth user details (need service role key)');
      }
    }
    
  } catch (error) {
    console.error('❌ Error during registration test:', error.message);
  }
}

console.log('🚀 Starting registration test with real email...');
console.log('📧 Email verification should be sent to: mrforencics100@gmail.com');
console.log('⏰ Starting in 3 seconds...\n');

setTimeout(() => {
  testRealRegistration().then(() => {
    console.log('\n🏁 Registration test completed');
    console.log('📧 Please check mrforencics100@gmail.com for verification email!');
  }).catch(console.error);
}, 3000);
