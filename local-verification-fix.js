// LOCAL DEVELOPMENT VERIFICATION FIX
// This script works when running on localhost (development mode)

console.log('🔧 Local Development Verification Fix - Starting...');

// Import Supabase directly since window.supabase isn't available locally
async function localVerificationFix() {
  try {
    console.log('🔍 Checking local development environment...');
    
    // Check if we're on localhost
    if (!window.location.href.includes('localhost')) {
      console.log('⚠️ This script is for local development only.');
      console.log('🌐 You appear to be on a live website. Use the regular fix script instead.');
      return;
    }
    
    console.log('✅ Local development detected');
    
    // Try to access Supabase from React DevTools or global objects
    let supabaseConfig;
    
    // Method 1: Try to get Supabase from React component tree
    console.log('🔍 Searching for Supabase client...');
    
    // Look for React Fiber
    const reactFiber = document.querySelector('#root')?._reactInternalInstance ||
                       document.querySelector('#root')?._reactInternals ||
                       document.querySelector('[data-reactroot]')?._reactInternalInstance;
    
    if (reactFiber) {
      console.log('✅ React Fiber found, searching for Supabase context...');
    }
    
    // Method 2: Direct API calls using environment variables from the page
    console.log('🔧 Using direct API approach...');
    
    // Get the environment variables that should be available
    const supabaseUrl = 'https://bmtaqilpuszwoshtizmq.supabase.co';
    const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtdGFxaWxwdXN6d29zaHRpem1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NDI1ODYsImV4cCI6MjA1MDUxODU4Nn0.4gYp6Vp8IonMhSKOcvK0rJjNfN0QQNkm15JM3Zu9c28';
    
    console.log('🔗 Making direct API calls to Supabase...');
    
    // Get current session
    const sessionResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'apikey': supabaseAnonKey,
        'Content-Type': 'application/json'
      }
    });
    
    if (!sessionResponse.ok) {
      console.log('❌ No active session found. Please log in first.');
      console.log('🔄 Try logging in through the website, then run this script again.');
      return;
    }
    
    const userData = await sessionResponse.json();
    console.log('✅ User found:', userData.email);
    console.log('📧 Email confirmed:', !!userData.email_confirmed_at);
    
    // Check user profile in database
    const profileResponse = await fetch(`${supabaseUrl}/rest/v1/users?id=eq.${userData.id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'apikey': supabaseAnonKey,
        'Content-Type': 'application/json'
      }
    });
    
    if (!profileResponse.ok) {
      console.error('❌ Failed to fetch profile:', profileResponse.status);
      return;
    }
    
    const profiles = await profileResponse.json();
    
    if (profiles.length === 0) {
      console.log('⚠️ No profile found in users table. This might be the issue.');
      console.log('🔧 The user creation trigger might not have run properly.');
      return;
    }
    
    const profile = profiles[0];
    console.log('✅ User profile found:', {
      email: profile.email,
      is_verified: profile.is_verified,
      is_paid: profile.is_paid
    });
    
    // Fix verification status if needed
    if (userData.email_confirmed_at && !profile.is_verified) {
      console.log('🔧 FIXING: Email confirmed but profile not verified');
      
      const updateResponse = await fetch(`${supabaseUrl}/rest/v1/users?id=eq.${userData.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'apikey': supabaseAnonKey,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          is_verified: true,
          updated_at: new Date().toISOString()
        })
      });
      
      if (updateResponse.ok) {
        console.log('✅ Profile verification updated!');
        console.log('🔄 Redirecting to payment page...');
        
        setTimeout(() => {
          window.location.href = '/payment';
        }, 1000);
      } else {
        console.error('❌ Failed to update profile:', updateResponse.status);
      }
      
    } else if (profile.is_verified && !profile.is_paid) {
      console.log('✅ Already verified! Redirecting to payment...');
      window.location.href = '/payment';
      
    } else if (profile.is_verified && profile.is_paid) {
      console.log('✅ Verified and paid! Redirecting to dashboard...');
      window.location.href = '/dashboard';
      
    } else {
      console.log('⚠️ Email not confirmed yet.');
      console.log('📧 Check your email for the verification link.');
      console.log('💡 Or try clicking "Resend Verification Email" on the page.');
    }
    
  } catch (error) {
    console.error('❌ Error in local verification fix:', error);
    console.log('🔄 Try refreshing the page and logging in again.');
  }
}

// Alternative: Simple redirect solution
function simpleRedirectToPayment() {
  console.log('🚀 Simple redirect to payment page...');
  window.location.href = '/payment';
}

// Run the fix
localVerificationFix();

console.log('💡 Available commands:');
console.log('   - localVerificationFix() - Run the full local verification fix');
console.log('   - simpleRedirectToPayment() - Just redirect to payment page');

// Make functions available globally
window.localVerificationFix = localVerificationFix;
window.simpleRedirectToPayment = simpleRedirectToPayment;
