// Check database schema and fix column names
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bmtaqilpuszwoshtizmq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtdGFxaWxwdXN6d29zaHRpem1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwOTQwNjQsImV4cCI6MjA2ODY3MDA2NH0.QdtF2IFukonNWslwkUV1oQbpYBgdYhtekvjCywKR0vA';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkDatabaseSchema() {
  console.log('🔍 Checking database schema and fixing issues...\n');

  // Test authentication for working user
  console.log('1️⃣ Testing authentication with thearnest7@gmail.com...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'thearnest7@gmail.com',
    password: '1234567890'
  });

  if (authError) {
    console.log('❌ Auth failed:', authError.message);
    return;
  }

  console.log('✅ Auth successful');
  console.log('Auth User ID:', authData.user.id);

  // Check what columns exist in users table
  console.log('\n2️⃣ Checking users table structure...');
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    if (error) {
      console.log('❌ Users query error:', error.message);
    } else if (users && users.length > 0) {
      console.log('✅ Sample user record columns:');
      console.log(Object.keys(users[0]).join(', '));
    }
  } catch (error) {
    console.log('❌ Schema check error:', error.message);
  }

  // Check profiles for the authenticated user with correct column names
  console.log('\n3️⃣ Checking profile with correct column names...');
  try {
    const { data: profiles, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'thearnest7@gmail.com');

    if (profileError) {
      console.log('❌ Profile query error:', profileError.message);
    } else {
      console.log(`✅ Found ${profiles?.length || 0} profile(s):`);
      profiles?.forEach((profile, i) => {
        console.log(`\nProfile ${i + 1}:`);
        console.log(`- ID: ${profile.id}`);
        console.log(`- Email: ${profile.email}`);
        console.log(`- Full Name: ${profile.full_name || profile.fullName || 'Not set'}`);
        console.log(`- Country: ${profile.country || 'Not set'}`);
        console.log(`- Role: ${profile.role || 'Not set'}`);
        console.log(`- Verified: ${profile.is_verified || profile.isVerified || false}`);
        console.log(`- Paid: ${profile.is_paid || profile.isPaidUser || false}`);
        console.log(`- Auth User ID: ${authData.user.id}`);
        console.log(`- Profile User ID: ${profile.id}`);
        console.log(`- IDs Match: ${authData.user.id === profile.id ? 'YES' : 'NO'}`);
      });
    }
  } catch (error) {
    console.log('❌ Profile check error:', error.message);
  }

  // Sign out
  await supabase.auth.signOut();
  console.log('\n🚪 Signed out');

  // Provide recommendations
  console.log('\n🛠️ RECOMMENDED FIXES:');
  console.log('\n1. For ernest.debrah@bluecrest.edu.gh:');
  console.log('   - User needs to be re-created in Supabase');
  console.log('   - Or verify the correct password');
  
  console.log('\n2. For thearnest7@gmail.com:');
  console.log('   - Fix column name mismatch in AuthContext');
  console.log('   - Update queries to use correct database column names');
  console.log('   - Handle ID mismatch between auth and profile tables');
}

checkDatabaseSchema().catch(console.error);
