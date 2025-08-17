// Create test user for ernest.debrah@bluecrest.edu.gh
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bmtaqilpuszwoshtizmq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtdGFxaWxwdXN6d29zaHRpem1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwOTQwNjQsImV4cCI6MjA2ODY3MDA2NH0.QdtF2IFukonNWslwkUV1oQbpYBgdYhtekvjCywKR0vA';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createTestUser() {
  console.log('👤 Creating test user: ernest.debrah@bluecrest.edu.gh');

  try {
    // Step 1: Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: 'ernest.debrah@bluecrest.edu.gh',
      password: '123456789',
      options: {
        data: {
          full_name: 'Ernest Debrah',
          country: 'GH',
          currency: 'GHS',
          role: 'user'
        }
      }
    });

    if (authError) {
      console.error('❌ Auth user creation failed:', authError.message);
      return;
    }

    if (!authData.user) {
      console.error('❌ No user data returned');
      return;
    }

    console.log('✅ Auth user created:', authData.user.id);

    // Step 2: Create profile in users table
    const profileData = {
      id: authData.user.id,
      email: 'ernest.debrah@bluecrest.edu.gh',
      full_name: 'Ernest Debrah',
      country: 'GH',
      currency: 'GHS',
      role: 'user',
      is_verified: false,
      is_paid: false,
      referral_code: `USR${Date.now().toString(36).toUpperCase()}`,
      balance: 0,
      pending_earnings: 0,
      total_earned: 0
    };

    const { data: profileResult, error: profileError } = await supabase
      .from('users')
      .insert([profileData])
      .select();

    if (profileError) {
      console.error('❌ Profile creation failed:', profileError.message);
      // Clean up auth user if profile creation fails
      await supabase.auth.signOut();
      return;
    }

    console.log('✅ Profile created successfully');
    console.log('✅ Test user ready for login with password: 123456789');

    // Sign out
    await supabase.auth.signOut();

  } catch (error) {
    console.error('❌ Error creating test user:', error.message);
  }
}

createTestUser().catch(console.error);
