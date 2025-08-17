// Test environment variables loading
console.log('🔍 Testing Environment Variables...\n');

// Check Node.js environment variables (for backend scripts)
console.log('📦 Node.js Environment Variables:');
console.log('- VITE_SENDGRID_API_KEY:', process.env.VITE_SENDGRID_API_KEY ? '✅ Set' : '❌ Missing');
console.log('- VITE_SENDGRID_FROM_EMAIL:', process.env.VITE_SENDGRID_FROM_EMAIL ? '✅ Set' : '❌ Missing');
console.log('- VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? '✅ Set' : '❌ Missing');
console.log('- VITE_SUPABASE_ANON_KEY:', process.env.VITE_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing');

console.log('\n📧 Email System Configuration:');
console.log('- VITE_SENDGRID_API_KEY:', process.env.VITE_SENDGRID_API_KEY ? '✅ Set' : '❌ Missing');
console.log('- VITE_SENDGRID_FROM_EMAIL:', process.env.VITE_SENDGRID_FROM_EMAIL ? '✅ Set' : '❌ Missing');
console.log('- VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? '✅ Set' : '❌ Missing');

// If environment variables are missing, suggest loading them
if (!process.env.VITE_SENDGRID_API_KEY) {
  console.log('\n⚠️ Environment variables are not loaded in Node.js context');
  console.log('💡 For Node.js scripts, you need to use dotenv:');
  console.log('   npm install dotenv');
  console.log('   Add: require("dotenv").config() at the top of your script');
}
