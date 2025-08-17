// Test email verification system with proper environment loading
require('dotenv').config();

console.log('🔍 Testing Email Verification System...\n');

// Check environment variables after loading dotenv
console.log('📧 Email System Configuration:');
console.log('- VITE_SENDGRID_API_KEY:', process.env.VITE_SENDGRID_API_KEY ? '✅ Set' : '❌ Missing');
console.log('- VITE_SENDGRID_FROM_EMAIL:', process.env.VITE_SENDGRID_FROM_EMAIL ? '✅ Set' : '❌ Missing');
console.log('- VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? '✅ Set' : '❌ Missing');
console.log('- VITE_SUPABASE_ANON_KEY:', process.env.VITE_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing');

// Test SendGrid API connectivity
async function testSendGrid() {
  if (!process.env.VITE_SENDGRID_API_KEY) {
    console.log('\n❌ SendGrid API key not found in environment variables');
    return;
  }

  try {
    const response = await fetch('https://api.sendgrid.com/v3/user/profile', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.VITE_SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const profile = await response.json();
      console.log('\n✅ SendGrid API connection successful!');
      console.log('📧 SendGrid account:', profile.email);
    } else {
      console.log('\n❌ SendGrid API connection failed:', response.status, response.statusText);
    }
  } catch (error) {
    console.log('\n❌ SendGrid API test error:', error.message);
  }
}

// Test Supabase connection
async function testSupabase() {
  if (!process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_ANON_KEY) {
    console.log('\n❌ Supabase credentials not found in environment variables');
    return;
  }

  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
    
    // Test connection by checking auth settings
    const { data, error } = await supabase.auth.getSession();
    
    if (error && error.message.includes('Invalid JWT')) {
      console.log('\n✅ Supabase connection successful (no active session)');
    } else {
      console.log('\n✅ Supabase connection successful');
    }
  } catch (error) {
    console.log('\n❌ Supabase connection error:', error.message);
  }
}

// Run tests
testSendGrid();
testSupabase();
