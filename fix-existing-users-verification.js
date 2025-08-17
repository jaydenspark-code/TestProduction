// Fix existing users verification status
// Run this in browser console or Node.js environment

console.log('🔧 Fixing existing users verification status...');

async function fixExistingUsers() {
  try {
    const SUPABASE_URL = 'https://bmtaqilpuszwoshtizmq.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtdGFxaWxwdXN6d29zaHRpem1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NDI1ODYsImV4cCI6MjA1MDUxODU4Nn0.4gYp6Vp8IonMhSKOcvK0rJjNfN0QQNkm15JM3Zu9c28';
    
    // Get session from localStorage
    const sessionKey = 'sb-bmtaqilpuszwoshtizmq-auth-token';
    const sessionData = localStorage.getItem(sessionKey);
    
    if (!sessionData) {
      console.log('❌ No session found. Please log in first.');
      return;
    }
    
    const session = JSON.parse(sessionData);
    const user = session.user;
    
    console.log('👤 Current user:', user.email);
    console.log('📧 Email confirmed in auth:', !!user.email_confirmed_at);
    
    if (user.email_confirmed_at) {
      console.log('✅ Email is confirmed in auth, updating profile...');
      
      // Update profile to verified
      const updateResponse = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${user.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          is_verified: true,
          updated_at: new Date().toISOString()
        })
      });
      
      if (updateResponse.ok) {
        console.log('✅ Profile updated! User is now verified.');
        console.log('🔄 Redirecting to payment page...');
        
        // Trigger storage event to refresh React context
        window.dispatchEvent(new Event('storage'));
        
        setTimeout(() => {
          window.location.href = '/payment';
        }, 2000);
      } else {
        console.error('❌ Failed to update profile:', updateResponse.status);
      }
    } else {
      console.log('⚠️ Email not confirmed in auth system.');
      console.log('📧 User needs to click the verification link in their email.');
      
      // Try to resend verification email using Supabase's native system
      console.log('🔄 Attempting to resend verification email...');
      
      try {
        // This requires the Supabase client - let's try to get it
        if (window.supabase) {
          const { error } = await window.supabase.auth.resend({
            type: 'signup',
            email: user.email,
            options: {
              emailRedirectTo: `${window.location.origin}/verify-email?redirect_to=payment`
            }
          });
          
          if (error) {
            console.error('❌ Resend failed:', error);
          } else {
            console.log('✅ Verification email resent successfully!');
          }
        } else {
          console.log('⚠️ Supabase client not available for resend');
        }
      } catch (error) {
        console.error('❌ Error resending email:', error);
      }
    }
    
  } catch (error) {
    console.error('❌ Error fixing user verification:', error);
  }
}

// Also manually mark current user as verified (emergency fix)
async function emergencyVerifyUser() {
  try {
    const SUPABASE_URL = 'https://bmtaqilpuszwoshtizmq.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtdGFxaWxwdXN6d29zaHRpem1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NDI1ODYsImV4cCI6MjA1MDUxODU4Nn0.4gYp6Vp8IonMhSKOcvK0rJjNfN0QQNkm15JM3Zu9c28';
    
    const sessionKey = 'sb-bmtaqilpuszwoshtizmq-auth-token';
    const sessionData = localStorage.getItem(sessionKey);
    
    if (!sessionData) {
      console.log('❌ No session found.');
      return;
    }
    
    const session = JSON.parse(sessionData);
    
    console.log('🚨 EMERGENCY: Manually marking user as verified...');
    
    const updateResponse = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${session.user.id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        is_verified: true,
        updated_at: new Date().toISOString()
      })
    });
    
    if (updateResponse.ok) {
      console.log('✅ Emergency verification complete!');
      console.log('🚀 Redirecting to payment...');
      window.location.href = '/payment';
    } else {
      console.error('❌ Emergency verification failed');
    }
    
  } catch (error) {
    console.error('❌ Emergency verification error:', error);
  }
}

// Run the fix
console.log('🚀 Running user verification fix...');
fixExistingUsers();

// Make functions available globally
window.fixExistingUsers = fixExistingUsers;
window.emergencyVerifyUser = emergencyVerifyUser;

console.log('💡 Available commands:');
console.log('   - fixExistingUsers() - Check and fix current user verification');
console.log('   - emergencyVerifyUser() - Force verify current user (emergency use)');
