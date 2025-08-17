// Simple database test using app's supabase client
import { createClient } from '@supabase/supabase-js';

// Use the same config as your app
const supabaseUrl = 'https://bmtaqilpuszwoshtizmq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtdGFxaWxwdXN6d29zaHRpem1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwOTQwNjQsImV4cCI6MjA2ODY3MDA2NH0.QdtF2IFukonNWslwkUV1oQbpYBgdYhtekvjCywKR0vA';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function quickDatabaseTest() {
  console.log('🔍 Quick database test...\n');

  const testEmails = [
    'ernest.debrah@bluecrest.edu.gh',
    'thearnest7@gmail.com'
  ];

  for (const email of testEmails) {
    console.log(`📧 Testing: ${email}`);
    
    // Test 1: Try to authenticate
    console.log('1️⃣ Testing authentication...');
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: email === 'ernest.debrah@bluecrest.edu.gh' ? '123456789' : '1234567890'
      });

      if (error) {
        console.log('❌ Auth failed:', error.message);
      } else {
        console.log('✅ Auth successful for:', data.user?.email);
        
        // Test 2: Check profile table
        console.log('2️⃣ Checking profile...');
        const { data: profiles, error: profileError } = await supabase
          .from('users')
          .select('id, email, fullName, full_name, isVerified, is_verified, role')
          .eq('email', email);

        if (profileError) {
          console.log('❌ Profile query error:', profileError.message);
        } else {
          console.log(`✅ Found ${profiles?.length || 0} profile(s)`);
          profiles?.forEach((profile, i) => {
            console.log(`   Profile ${i + 1}: ID=${profile.id.substring(0, 8)}...`);
            console.log(`   Name: ${profile.fullName || profile.full_name}`);
            console.log(`   Verified: ${profile.isVerified || profile.is_verified}`);
            console.log(`   Role: ${profile.role}`);
          });
        }

        // Sign out
        await supabase.auth.signOut();
        console.log('🚪 Signed out\n');
      }
    } catch (error) {
      console.log('❌ Test error:', error.message);
    }
  }

  // Test 3: Check overall database connectivity
  console.log('3️⃣ Testing database connectivity...');
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (error) {
      console.log('❌ Database connection error:', error.message);
    } else {
      console.log('✅ Database connection working');
    }
  } catch (error) {
    console.log('❌ Connection test error:', error.message);
  }
}

quickDatabaseTest().catch(console.error);
