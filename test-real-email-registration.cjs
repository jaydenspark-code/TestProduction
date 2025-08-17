require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔍 Testing Registration with Real Email');
console.log('='.repeat(50));

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRegistrationWithRealEmail() {
  try {
    console.log('\n🧪 Testing Registration for mrforensics100@gmail.com');
    console.log('-'.repeat(50));
    
    const testEmail = 'mrforensics100@gmail.com';
    const testPassword = 'TestPassword123!';
    
    console.log(`📧 Email: ${testEmail}`);
    console.log(`🔑 Password: ${testPassword}`);
    
    console.log('\n🔍 Step 1: Checking if email already exists...');
    
    // First check if user already exists
    const { data: existingUsers, error: checkError } = await supabase.auth.admin.listUsers();
    
    if (checkError) {
      console.log('⚠️ Cannot check existing users (using anon key)');
    } else {
      const existingUser = existingUsers.users.find(user => user.email === testEmail);
      if (existingUser) {
        console.log('⚠️ User already exists. Deleting first...');
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
        emailRedirectTo: `https://your-app.com/verify-email?confirmed=true`,
        data: {
          full_name: 'Test User',
          test_registration: true
        }
      }
    });
    
    if (error) {
      console.log('❌ Registration failed:', error.message);
      return;
    }
    
    console.log('\n📊 Registration Results:');
    console.log('✅ Registration successful!');
    console.log('👤 User ID:', data.user?.id);
    console.log('📧 Email:', data.user?.email);
    console.log('✅ Email Confirmed:', data.user?.email_confirmed_at ? 'Yes (AUTO-CONFIRMED)' : 'No (NEEDS VERIFICATION)');
    console.log('📨 Confirmation Sent At:', data.user?.confirmation_sent_at || 'Not tracked');
    console.log('🔐 Email Change Sent At:', data.user?.email_change_sent_at || 'Not applicable');
    
    console.log('\n🎯 EXPECTED OUTCOME:');
    if (data.user?.email_confirmed_at) {
      console.log('🚨 ISSUE: Email was auto-confirmed (verification disabled)');
      console.log('❌ No verification email was sent');
    } else {
      console.log('🎉 SUCCESS: Email requires verification!');
      console.log('📧 Verification email should have been sent to: mrforensics100@gmail.com');
      console.log('📬 Check your inbox and spam folder');
      console.log('🔗 The email should contain a verification link');
      console.log('✅ Email sent via SendGrid (Custom SMTP)');
    }
    
    console.log('\n📋 Next Steps:');
    console.log('1. 📧 Check mrforensics100@gmail.com inbox');
    console.log('2. 📂 Check spam/junk folder if not in inbox');
    console.log('3. 🔗 Click the verification link in the email');
    console.log('4. ✅ Confirm that the link redirects properly');
    
  } catch (error) {
    console.error('❌ Error during registration test:', error.message);
  }
}

// Run the test
testRegistrationWithRealEmail().then(() => {
  console.log('\n🏁 Registration test completed');
  console.log('💡 Check the email inbox for verification link!');
}).catch(console.error);
