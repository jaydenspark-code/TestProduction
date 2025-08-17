// Test script to check auth user creation
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://bmtaqilpuszwoshtizmq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtdGFxaWxwdXN6d29zaHRpem1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwOTQwNjQsImV4cCI6MjA2ODY3MDA2NH0.QdtF2IFukonNWslwkUV1oQbpYBgdYhtekvjCywKR0vA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAuthCreation() {
  console.log('🔍 Testing auth user creation process...');
  
  try {
    // First, let's check if we have any users in the users table
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, full_name, is_verified, temp_password, auth_user_id')
      .eq('is_verified', true)
      .limit(5);
    
    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      return;
    }
    
    console.log('📊 Verified users:', users);
    
    // Also check if any users exist at all
    const { data: allUsers, error: allUsersError } = await supabase
      .from('users')
      .select('id, email, full_name, is_verified, temp_password, auth_user_id')
      .limit(5);
    
    console.log('📊 All users:', allUsers);
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testAuthCreation();
