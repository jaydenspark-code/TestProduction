// Enhanced verification fix script
// This handles multiple verification issues including URL parsing and status sync

console.log('🔧 Enhanced Verification Fix Script v2.0');

// Enhanced user verification diagnostics and fixes
async function enhancedVerificationFix() {
  try {
    console.log('🔍 Running enhanced verification diagnostics...');
    
    // Step 1: Check if Supabase is available
    if (typeof window.supabase === 'undefined') {
      console.error('❌ Supabase not available on window object');
      
      // Try to get Supabase from the React context
      console.log('🔄 Attempting to access Supabase from React context...');
      
      // Create a script to inject Supabase globally
      const script = document.createElement('script');
      script.textContent = `
        if (window.React && window.React.createElement) {
          console.log('✅ React detected, attempting to access Supabase context');
        }
      `;
      document.head.appendChild(script);
      
      return;
    }
    
    // Step 2: Get current user authentication status
    console.log('📋 Checking authentication status...');
    const { data: { user }, error: authError } = await window.supabase.auth.getUser();
    
    if (authError) {
      console.error('❌ Authentication error:', authError);
      return;
    }
    
    if (!user) {
      console.log('❌ No authenticated user found. Please log in first.');
      return;
    }
    
    console.log('✅ User authenticated:', {
      id: user.id,
      email: user.email,
      email_confirmed_at: user.email_confirmed_at,
      phone_confirmed_at: user.phone_confirmed_at,
      confirmed_at: user.confirmed_at,
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at
    });
    
    // Step 3: Check profile in public.users table
    console.log('👤 Checking user profile...');
    const { data: profile, error: profileError } = await window.supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (profileError) {
      console.error('❌ Profile query error:', profileError);
      
      if (profileError.code === 'PGRST116') {
        console.log('📝 No profile found. Creating user profile...');
        
        // Create user profile
        const { error: createError } = await window.supabase
          .from('users')
          .insert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || user.user_metadata?.name || 'User',
            country: user.user_metadata?.country || 'US',
            currency: user.user_metadata?.currency || 'USD',
            referral_code: 'USR' + user.id.replace(/-/g, '').substring(0, 10).toUpperCase(),
            is_verified: user.email_confirmed_at ? true : false,
            is_paid: false,
            role: 'user',
            created_at: user.created_at,
            updated_at: new Date().toISOString()
          });
        
        if (createError) {
          console.error('❌ Failed to create profile:', createError);
          return;
        }
        
        console.log('✅ User profile created successfully');
        
        // Refetch the profile
        const { data: newProfile } = await window.supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (newProfile) {
          console.log('✅ New profile:', newProfile);
        }
      }
      
      return;
    }
    
    console.log('✅ User profile found:', {
      id: profile.id,
      email: profile.email,
      full_name: profile.full_name,
      is_verified: profile.is_verified,
      is_paid: profile.is_paid,
      role: profile.role,
      country: profile.country,
      currency: profile.currency,
      referral_code: profile.referral_code,
      created_at: profile.created_at
    });
    
    // Step 4: Analyze verification status and fix if needed
    const emailConfirmed = !!user.email_confirmed_at;
    const profileVerified = !!profile.is_verified;
    
    console.log('🔍 Verification Analysis:');
    console.log(`   Email confirmed in auth: ${emailConfirmed}`);
    console.log(`   Profile verified in users: ${profileVerified}`);
    
    if (emailConfirmed && !profileVerified) {
      console.log('🔧 ISSUE DETECTED: Email confirmed but profile not verified');
      console.log('💡 FIXING: Updating profile verification status...');
      
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
      
      console.log('✅ Verification status updated successfully!');
      console.log('🔄 Refreshing page to apply routing changes...');
      
      setTimeout(() => {
        window.location.reload();
      }, 1500);
      
    } else if (!emailConfirmed && !profileVerified) {
      console.log('⚠️ Email not confirmed. You need to click the verification link.');
      console.log('📧 Check your email inbox (and spam folder) for the verification email.');
      
      // Offer to resend verification email
      console.log('💡 To resend verification email, run: resendVerificationEmail()');
      window.resendVerificationEmail = async function() {
        console.log('📧 Attempting to resend verification email...');
        
        const { error: resendError } = await window.supabase.auth.resend({
          type: 'signup',
          email: user.email,
          options: {
            emailRedirectTo: `${window.location.origin}/verify-email`
          }
        });
        
        if (resendError) {
          console.error('❌ Failed to resend email:', resendError);
        } else {
          console.log('✅ Verification email resent successfully');
        }
      };
      
    } else if (profileVerified && !profile.is_paid) {
      console.log('✅ User is verified! Should redirect to payment page.');
      console.log('🔄 Navigating to payment page...');
      window.location.href = '/payment';
      
    } else if (profileVerified && profile.is_paid) {
      console.log('✅ User is verified and paid! Should be on dashboard.');
      console.log('🔄 Navigating to dashboard...');
      window.location.href = '/dashboard';
      
    } else {
      console.log('✅ Everything looks correct! Current status:');
      console.log(`   - Email confirmed: ${emailConfirmed}`);
      console.log(`   - Profile verified: ${profileVerified}`);
      console.log(`   - Account paid: ${profile.is_paid}`);
    }
    
  } catch (error) {
    console.error('❌ Unexpected error in verification fix:', error);
    console.log('🔄 Try refreshing the page and running the script again.');
  }
}

// Function to fix URL-related verification issues
async function fixVerificationURL() {
  console.log('🔗 Checking verification URL...');
  
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  const accessToken = urlParams.get('access_token');
  const refreshToken = urlParams.get('refresh_token');
  
  console.log('URL Parameters:', {
    token,
    accessToken: accessToken ? '✅ Present' : '❌ Missing',
    refreshToken: refreshToken ? '✅ Present' : '❌ Missing'
  });
  
  if (accessToken && refreshToken) {
    console.log('🔧 Setting session from URL tokens...');
    
    try {
      const { error } = await window.supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      });
      
      if (error) {
        console.error('❌ Session setup failed:', error);
      } else {
        console.log('✅ Session set successfully');
        console.log('🔄 Running verification fix...');
        await enhancedVerificationFix();
      }
    } catch (error) {
      console.error('❌ Error setting session:', error);
    }
  } else {
    console.log('ℹ️ No URL tokens found, checking current auth status...');
    await enhancedVerificationFix();
  }
}

// Clear any URL params that might be causing issues
function cleanURL() {
  const url = new URL(window.location);
  if (url.search) {
    console.log('🧹 Cleaning URL parameters...');
    url.search = '';
    window.history.replaceState({}, document.title, url.pathname);
    console.log('✅ URL cleaned');
  }
}

// Main execution
console.log('🚀 Starting enhanced verification fix...');
fixVerificationURL();

// Make functions available globally
window.enhancedVerificationFix = enhancedVerificationFix;
window.fixVerificationURL = fixVerificationURL;
window.cleanURL = cleanURL;

console.log('💡 Available commands:');
console.log('   - enhancedVerificationFix() - Run full verification check and fix');
console.log('   - fixVerificationURL() - Fix URL-based verification issues');
console.log('   - cleanURL() - Clean problematic URL parameters');
