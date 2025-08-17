// Debug script to check current user verification status
// Run this in the browser console to see what's happening

console.log('🔍 Starting user status diagnostics...');

// Function to check user status
async function checkUserStatus() {
  try {
    // Check if we're logged in with Supabase
    const { data: { user }, error: authError } = await window.supabase.auth.getUser();
    
    if (authError) {
      console.error('❌ Auth error:', authError);
      return;
    }
    
    if (!user) {
      console.log('❌ No authenticated user found');
      return;
    }
    
    console.log('✅ Auth user found:', {
      id: user.id,
      email: user.email,
      email_confirmed_at: user.email_confirmed_at,
      confirmed_at: user.confirmed_at,
      last_sign_in_at: user.last_sign_in_at
    });
    
    // Check user profile in public.users table
    const { data: profile, error: profileError } = await window.supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (profileError) {
      console.error('❌ Profile error:', profileError);
      return;
    }
    
    if (!profile) {
      console.log('❌ No profile found in public.users table');
      return;
    }
    
    console.log('✅ User profile found:', {
      id: profile.id,
      email: profile.email,
      full_name: profile.full_name,
      is_verified: profile.is_verified,
      is_paid: profile.is_paid,
      role: profile.role,
      created_at: profile.created_at
    });
    
    // Determine what should happen next
    if (user.email_confirmed_at && !profile.is_verified) {
      console.log('🔧 ISSUE DETECTED: Email is confirmed in auth.users but is_verified=false in public.users');
      console.log('💡 SOLUTION: Need to update public.users.is_verified to true');
      
      // Offer to fix this
      console.log('🛠️ Would you like to fix this? Run: fixUserVerification()');
      window.fixUserVerification = async function() {
        const { error } = await window.supabase
          .from('users')
          .update({ is_verified: true })
          .eq('id', user.id);
        
        if (error) {
          console.error('❌ Fix failed:', error);
        } else {
          console.log('✅ User verification status fixed! Refresh the page.');
        }
      };
    } else if (profile.is_verified && !profile.is_paid) {
      console.log('✅ User is verified. Should redirect to payment page.');
    } else if (profile.is_verified && profile.is_paid) {
      console.log('✅ User is verified and paid. Should be on dashboard.');
    } else {
      console.log('⚠️ User needs email verification.');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the check
checkUserStatus();
