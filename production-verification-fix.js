// PRODUCTION-READY VERIFICATION FIX
// This script works in both development and production environments
// It directly accesses localStorage to get the session and makes API calls

console.log('🚀 Production-Ready Verification Fix v3.0');

async function productionVerificationFix() {
  try {
    console.log('🔍 Checking environment and session...');
    
    // Get Supabase configuration from the page
    const SUPABASE_URL = 'https://bmtaqilpuszwoshtizmq.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtdGFxaWxwdXN6d29zaHRpem1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NDI1ODYsImV4cCI6MjA1MDUxODU4Nn0.4gYp6Vp8IonMhSKOcvK0rJjNfN0QQNkm15JM3Zu9c28';
    
    // Get session from localStorage
    const sessionKey = `sb-${SUPABASE_URL.split('//')[1].split('.')[0]}-auth-token`;
    const sessionData = localStorage.getItem(sessionKey);
    
    if (!sessionData) {
      console.log('❌ No active session found. Please log in first.');
      return;
    }
    
    const session = JSON.parse(sessionData);
    const accessToken = session.access_token;
    const user = session.user;
    
    console.log('✅ Session found for:', user.email);
    console.log('📧 Email confirmed in auth:', !!user.email_confirmed_at);
    
    // Check user profile
    const profileResponse = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${user.id}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    if (!profileResponse.ok) {
      console.error('❌ Failed to fetch profile:', profileResponse.status);
      return;
    }
    
    const profiles = await profileResponse.json();
    
    if (profiles.length === 0) {
      console.log('⚠️ No profile found in database');
      console.log('🔧 This usually means the user creation trigger didn\'t run');
      console.log('💡 Try registering again or contact support');
      return;
    }
    
    const profile = profiles[0];
    console.log('✅ Profile found:', {
      email: profile.email,
      is_verified: profile.is_verified,
      is_paid: profile.is_paid
    });
    
    // Check and fix verification status mismatch
    if (user.email_confirmed_at && !profile.is_verified) {
      console.log('🔧 FIXING: Email confirmed but profile not verified');
      
      const updateResponse = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${user.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          is_verified: true,
          updated_at: new Date().toISOString()
        })
      });
      
      if (updateResponse.ok) {
        console.log('✅ Profile verification status updated!');
        
        // Force refresh React context by dispatching a storage event
        window.dispatchEvent(new Event('storage'));
        
        console.log('🔄 Redirecting to payment in 2 seconds...');
        setTimeout(() => {
          window.location.href = '/payment';
        }, 2000);
        
      } else {
        console.error('❌ Failed to update profile:', updateResponse.status);
        const errorText = await updateResponse.text();
        console.error('Error details:', errorText);
      }
      
    } else if (profile.is_verified && !profile.is_paid) {
      console.log('✅ User is verified! Redirecting to payment...');
      window.location.href = '/payment';
      
    } else if (profile.is_verified && profile.is_paid) {
      console.log('✅ User is verified and paid! Redirecting to dashboard...');
      window.location.href = '/dashboard';
      
    } else {
      console.log('⚠️ Email not confirmed yet.');
      console.log('📧 Please check your email for the verification link.');
      console.log('📱 Check your spam/junk folder as well.');
    }
    
  } catch (error) {
    console.error('❌ Error in verification fix:', error);
    console.log('💡 You can try manually navigating to /payment if you believe you are verified');
  }
}

// Also provide a simple redirect function
function forceRedirectToPayment() {
  console.log('🚀 Force redirecting to payment page...');
  window.location.href = '/payment';
}

// Run the fix automatically
console.log('🔄 Auto-running verification fix...');
productionVerificationFix();

// Make functions available globally
window.productionVerificationFix = productionVerificationFix;
window.forceRedirectToPayment = forceRedirectToPayment;

console.log('💡 Available commands:');
console.log('   - productionVerificationFix() - Run full verification check and fix');
console.log('   - forceRedirectToPayment() - Force redirect to payment page');
