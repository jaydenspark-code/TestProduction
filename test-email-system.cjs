// Test email verification system with proper environment loading
require('dotenv').config();

console.log('🔍 Testing Email Verification System...\n');

// Check environment variables after loading dotenv
console.log('📧 Email System Configuration:');
console.log('- VITE_SENDGRID_API_KEY:', process.env.VITE_SENDGRID_API_KEY ? '✅ Set' : '❌ Missing');
console.log('- VITE_SENDGRID_FROM_EMAIL:', process.env.VITE_SENDGRID_FROM_EMAIL ? '✅ Set' : '❌ Missing');
console.log('- VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? '✅ Set' : '❌ Missing');
console.log('- VITE_SUPABASE_ANON_KEY:', process.env.VITE_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing');

if (process.env.VITE_SENDGRID_API_KEY) {
  console.log('✅ SendGrid configuration found - emails should work!');
} else {
  console.log('❌ SendGrid API key missing - emails will not be sent');
}

// Test if variables are properly formatted
if (process.env.VITE_SENDGRID_API_KEY && !process.env.VITE_SENDGRID_API_KEY.startsWith('SG.')) {
  console.log('⚠️  Warning: SendGrid API key should start with "SG."');
}

console.log('\n🎯 The issue might be that Supabase is trying to send emails using its own SMTP settings');
console.log('   instead of your custom SendGrid integration in the frontend.');
console.log('\n💡 Solutions:');
console.log('1. Make sure your registration flow uses the custom email service');
console.log('2. Bypass Supabase email confirmation and use custom verification');
console.log('3. Configure Supabase SMTP to use SendGrid (recommended for production)');
