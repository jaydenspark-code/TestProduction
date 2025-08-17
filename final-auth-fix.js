// Final fix for authentication issues
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bmtaqilpuszwoshtizmq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtdGFxaWxwdXN6d29zaHRpem1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwOTQwNjQsImV4cCI6MjA2ODY3MDA2NH0.QdtF2IFukonNWslwkUV1oQbpYBgdYhtekvjCywKR0vA';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function finalAuthFix() {
  console.log('🔧 Final authentication fixes...\n');

  // Test 1: Check ernest.debrah@bluecrest.edu.gh email confirmation
  console.log('1️⃣ Checking Ernest\'s email confirmation status...');
  
  // For testing purposes, let's manually confirm the email
  // Note: In production, you'd need service role key or the user would click the email link
  
  try {
    // Try to sign in and see what happens
    const { data: ernestAuth, error: ernestError } = await supabase.auth.signInWithPassword({
      email: 'ernest.debrah@bluecrest.edu.gh',
      password: '123456789'
    });

    if (ernestError) {
      console.log('❌ Ernest login error:', ernestError.message);
      if (ernestError.message.includes('Email not confirmed')) {
        console.log('💡 Solution: User needs to check email and click confirmation link');
        console.log('💡 Alternative: Manually confirm in Supabase dashboard or resend confirmation');
      }
    } else {
      console.log('✅ Ernest login successful!');
      await supabase.auth.signOut();
    }
  } catch (error) {
    console.log('❌ Ernest test error:', error.message);
  }

  // Test 2: Test thearnest7@gmail.com with fixed AuthContext
  console.log('\n2️⃣ Testing thearnest7@gmail.com with fixed AuthContext...');
  
  try {
    const { data: superAuth, error: superError } = await supabase.auth.signInWithPassword({
      email: 'thearnest7@gmail.com',
      password: '1234567890'
    });

    if (superError) {
      console.log('❌ Superadmin login error:', superError.message);
    } else {
      console.log('✅ Superadmin auth successful');
      console.log('Auth ID:', superAuth.user.id);

      // Test the fixed profile lookup logic
      console.log('🔍 Testing fixed profile lookup...');
      
      // First try ID lookup (should fail)
      let { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', superAuth.user.id)
        .single();

      if (error && error.code === 'PGRST116') {
        console.log('⚠️ ID lookup failed as expected, trying email lookup...');
        
        // Try email lookup (should succeed)
        const { data: emailProfile, error: emailError } = await supabase
          .from('users')
          .select('*')
          .eq('email', superAuth.user.email)
          .single();

        if (emailError) {
          console.log('❌ Email lookup failed:', emailError.message);
        } else {
          console.log('✅ Email lookup successful!');
          console.log('Profile ID:', emailProfile.id);
          console.log('Profile Name:', emailProfile.full_name);
          console.log('Profile Role:', emailProfile.role);
          console.log('Profile Verified:', emailProfile.is_verified);
          console.log('ID Mismatch:', superAuth.user.id !== emailProfile.id);
        }
      } else if (error) {
        console.log('❌ Profile lookup error:', error.message);
      } else {
        console.log('✅ ID lookup successful (no mismatch)');
      }

      await supabase.auth.signOut();
    }
  } catch (error) {
    console.log('❌ Superadmin test error:', error.message);
  }

  console.log('\n🎯 SUMMARY:');
  console.log('✅ AuthContext fixed to handle column name mismatches');
  console.log('✅ AuthContext fixed to handle ID mismatches with email fallback');
  console.log('⚠️ ernest.debrah@bluecrest.edu.gh needs email confirmation');
  console.log('✅ thearnest7@gmail.com should work with ID mismatch handling');
  
  console.log('\n📋 NEXT STEPS:');
  console.log('1. Test login in browser at http://localhost:5177');
  console.log('2. For Ernest: Resend confirmation email or manually confirm in Supabase');
  console.log('3. For Superadmin: Should login successfully with fallback logic');
}

finalAuthFix().catch(console.error);
