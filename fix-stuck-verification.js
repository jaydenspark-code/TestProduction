// Quick fix script to manually verify user if they're stuck
// This handles the case where email is confirmed but user profile isn't updated

console.log('🔧 User verification fix script loaded');

async function fixStuckVerification() {
  try {
    console.log('🔍 Checking current user status...');
    
    // Get current user
    const { data: { user }, error: authError } = await window.supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('❌ No authenticated user found');
      return;
    }
    
    console.log('✅ Found user:', user.email);
    
    // Check if email is confirmed in auth but profile not verified
    if (user.email_confirmed_at) {
      console.log('✅ Email is confirmed in auth system');
      
      // Update profile verification status
      const { error: updateError } = await window.supabase
        .from('users')
        .update({ 
          is_verified: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
      
      if (updateError) {
        console.error('❌ Failed to update verification status:', updateError);
        return;
      }
      
      console.log('✅ User verification status updated successfully!');
      console.log('🔄 Refreshing page to apply changes...');
      
      // Refresh the page to trigger proper routing
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } else {
      console.log('⚠️ Email not confirmed in auth system. User needs to click verification link.');
    }
    
  } catch (error) {
    console.error('❌ Error fixing verification:', error);
  }
}

// Make function available globally
window.fixStuckVerification = fixStuckVerification;

console.log('💡 To fix verification status, run: fixStuckVerification()');
