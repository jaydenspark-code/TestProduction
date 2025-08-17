// Test script to check auth user creation
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rnogyhfzlbvlrvqhtaoo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJub2d5aGZ6bGJ2bHJ2cWh0YW9vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTk5NjEwMzMsImV4cCI6MjAzNTUzNzAzM30.bNQu8MYzOeVjFFZKRUOqbJVqFXfKZ4hzf6LH5lKGNwU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAuthCreation() {
  console.log('🔍 Testing auth user creation process...');
  
  try {
    // First, let's check if we have any users in the users table
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, full_name, is_verified, temp_password, auth_user_id')
      .eq('is_verified', true)
      .is('auth_user_id', null)
      .limit(1);
    
    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      return;
    }
    
    console.log('📊 Verified users without auth_user_id:', users);
    
    if (users && users.length > 0) {
      const user = users[0];
      console.log(`🔐 Found user to test: ${user.email}`);
      
      if (user.temp_password) {
        console.log('🚀 Testing Edge Function call...');
        
        // Call the Edge Function
        const { data: authResult, error: authError } = await supabase.functions.invoke('create-auth-user-after-verification', {
          body: {
            email: user.email,
            password: user.temp_password,
            fullName: user.full_name,
            userId: user.id
          }
        });
        
        if (authError) {
          console.error('❌ Edge Function error:', authError);
        } else {
          console.log('✅ Edge Function result:', authResult);
        }
      } else {
        console.log('⚠️ User has no temp_password - cannot create auth user');
      }
    } else {
      console.log('ℹ️ No verified users without auth_user_id found');
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testAuthCreation();
