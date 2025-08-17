// SIMPLE VERIFICATION FIX - Copy and paste this entire script into your browser console

console.log('🔧 Simple Verification Fix - Starting...');

// Simple fix function
async function simpleVerificationFix() {
  try {
    // Check if we can access Supabase
    let supabase;
    if (window.supabase) {
      supabase = window.supabase;
    } else if (window.__SUPABASE_CLIENT__) {
      supabase = window.__SUPABASE_CLIENT__;
    } else {
      console.error('❌ Cannot find Supabase client. Please make sure you are on the EarnPro website.');
      return;
    }

    console.log('✅ Supabase client found');

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('❌ Auth error:', authError.message);
      return;
    }

    if (!user) {
      console.log('❌ No user logged in. Please log in first.');
      return;
    }

    console.log('✅ Current user:', user.email);
    console.log('📧 Email confirmed:', !!user.email_confirmed_at);

    // Check user profile
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id, email, is_verified, is_paid, role')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('❌ Profile error:', profileError.message);
      
      if (profileError.code === 'PGRST116') {
        console.log('⚠️ No profile found. This might be the issue.');
        console.log('🔧 Try registering again or contact support.');
      }
      return;
    }

    console.log('✅ User profile:', {
      email: profile.email,
      is_verified: profile.is_verified,
      is_paid: profile.is_paid
    });

    // The fix: If email is confirmed but profile not verified, fix it
    if (user.email_confirmed_at && !profile.is_verified) {
      console.log('🔧 FIXING: Email confirmed but profile not verified');
      
      const { error: updateError } = await supabase
        .from('users')
        .update({ is_verified: true })
        .eq('id', user.id);

      if (updateError) {
        console.error('❌ Update failed:', updateError.message);
        return;
      }

      console.log('✅ Profile updated! Redirecting to payment...');
      
      // Redirect to payment page
      setTimeout(() => {
        window.location.href = '/payment';
      }, 1000);

    } else if (profile.is_verified && !profile.is_paid) {
      console.log('✅ Already verified! Redirecting to payment...');
      window.location.href = '/payment';

    } else if (profile.is_verified && profile.is_paid) {
      console.log('✅ Verified and paid! Redirecting to dashboard...');
      window.location.href = '/dashboard';

    } else {
      console.log('⚠️ Email not confirmed yet. Check your email for verification link.');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the fix
simpleVerificationFix();

console.log('💡 If this doesn\'t work, try: simpleVerificationFix()');
