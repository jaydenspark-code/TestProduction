// Debug login flow step by step
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bmtaqilpuszwoshtizmq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtdGFxaWxwdXN6d29zaHRpem1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwOTQwNjQsImV4cCI6MjA2ODY3MDA2NH0.QdtF2IFukonNWslwkUV1oQbpYBgdYhtekvjCywKR0vA';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugLogin() {
  console.log('🔍 Debugging login flow...');
  
  const testCredentials = [
    { email: 'ernest.debrah@bluecrest.edu.gh', password: '123456789' },
    { email: 'thearnest7@gmail.com', password: '1234567890' }
  ];

  for (const creds of testCredentials) {
    console.log(`\n📧 Testing login for: ${creds.email}`);
    
    try {
      // Step 1: Try authentication
      console.log('1️⃣ Attempting Supabase auth...');
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: creds.email,
        password: creds.password,
      });

      if (authError) {
        console.error('❌ Auth failed:', authError.message);
        continue;
      }

      if (!authData.user) {
        console.error('❌ No user data returned');
        continue;
      }

      console.log('✅ Auth successful:', {
        userId: authData.user.id,
        email: authData.user.email,
        emailConfirmed: authData.user.email_confirmed_at,
      });

      // Step 2: Try to fetch profile by ID
      console.log('2️⃣ Fetching profile by ID...');
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileError) {
        console.log('⚠️ Profile fetch by ID failed:', profileError.message);
        
        // Step 3: Try to fetch profile by email
        console.log('3️⃣ Fetching profile by email...');
        const { data: emailData, error: emailError } = await supabase
          .from('users')
          .select('*')
          .eq('email', authData.user.email)
          .single();

        if (emailError) {
          console.error('❌ Profile fetch by email also failed:', emailError.message);
          continue;
        }

        console.log('✅ Profile found by email:', {
          id: emailData.id,
          email: emailData.email,
          is_verified: emailData.is_verified,
          is_paid: emailData.is_paid,
          role: emailData.role
        });

        // Step 4: Try to update the ID
        console.log('4️⃣ Attempting to fix ID mismatch...');
        const { error: updateError } = await supabase
          .from('users')
          .update({ id: authData.user.id })
          .eq('email', authData.user.email);

        if (updateError) {
          console.error('❌ ID update failed:', updateError.message);
        } else {
          console.log('✅ ID updated successfully');
        }

      } else {
        console.log('✅ Profile found by ID:', {
          id: profileData.id,
          email: profileData.email,
          is_verified: profileData.is_verified,
          is_paid: profileData.is_paid,
          role: profileData.role
        });
      }

      // Step 5: Test sign out
      console.log('5️⃣ Signing out...');
      await supabase.auth.signOut();
      console.log('✅ Signed out successfully');

    } catch (error) {
      console.error('❌ Unexpected error:', error);
    }
  }

  console.log('\n🎯 Debug complete. Check the results above.');
}

debugLogin().catch(console.error);
