// Test login process directly
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bmtaqilpuszwoshtizmq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtdGFxaWxwdXN6d29zaHRpem1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwOTQwNjQsImV4cCI6MjA2ODY3MDA2NH0.QdtF2IFukonNWslwkUV1oQbpYBgdYhtekvjCywKR0vA';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLogin() {
  console.log('🔍 Testing login process...');
  
  const testEmail = 'ernest.debrah@bluecrest.edu.gh';
  const testPassword = 'test123'; // Try with a test password
  
  try {
    console.log(`1. Attempting to sign in with email: ${testEmail}`);
    
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });

    if (authError) {
      console.error('❌ Auth sign in failed:', authError.message);
      
      // Let's try to see what users exist
      console.log('2. Checking existing users...');
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, email, created_at')
        .eq('email', testEmail);
      
      if (usersError) {
        console.error('❌ Users query failed:', usersError);
      } else {
        console.log('📋 Found users with this email:', users);
      }
      
      return;
    }

    if (!authData.user) {
      console.error('❌ No user data returned from auth');
      return;
    }

    console.log('✅ Auth successful! User ID:', authData.user.id);

    // Now fetch user profile
    console.log('3. Fetching user profile...');
    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError) {
      console.error('❌ Profile fetch failed:', profileError);
      
      // Try finding by email instead
      console.log('4. Trying to find user by email...');
      const { data: emailData, error: emailError } = await supabase
        .from('users')
        .select('*')
        .eq('email', authData.user.email)
        .single();
      
      if (emailError) {
        console.error('❌ Email lookup also failed:', emailError);
      } else {
        console.log('✅ Found user by email:', {
          id: emailData.id,
          email: emailData.email,
          is_verified: emailData.is_verified,
          is_paid: emailData.is_paid
        });
      }
    } else {
      console.log('✅ Profile data:', {
        id: profileData.id,
        email: profileData.email,
        is_verified: profileData.is_verified,
        is_paid: profileData.is_paid,
        referral_code: profileData.referral_code
      });
    }

  } catch (error) {
    console.error('❌ Login test failed:', error);
  }
}

testLogin().catch(console.error);
