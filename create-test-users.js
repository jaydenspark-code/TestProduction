// Create test user accounts for testing
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bmtaqilpuszwoshtizmq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtdGFxaWxwdXN6d29zaHRpem1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwOTQwNjQsImV4cCI6MjA2ODY3MDA2NH0.QdtF2IFukonNWslwkUV1oQbpYBgdYhtekvjCywKR0vA';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createTestUsers() {
  console.log('🔧 Creating test user accounts...');

  const testUsers = [
    {
      email: 'ernest.debrah@bluecrest.edu.gh',
      password: '123456789',
      fullName: 'Ernest Debrah',
      role: 'user'
    },
    {
      email: 'thearnest7@gmail.com', 
      password: '1234567890',
      fullName: 'The Arnest Admin',
      role: 'admin'
    }
  ];

  for (const testUser of testUsers) {
    try {
      console.log(`\n📧 Creating user: ${testUser.email}`);

      // Try to sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: testUser.email,
        password: testUser.password,
      });

      if (authError) {
        if (authError.message.includes('already registered')) {
          console.log('⚠️ User already exists, that\'s fine!');
          continue;
        } else {
          console.error('❌ Auth signup failed:', authError.message);
          continue;
        }
      }

      if (authData.user) {
        console.log('✅ Auth user created:', authData.user.id);

        // Check if profile exists
        const { data: existingProfile } = await supabase
          .from('users')
          .select('id')
          .eq('email', testUser.email)
          .single();

        if (!existingProfile) {
          // Create user profile
          const { data: profileData, error: profileError } = await supabase
            .from('users')
            .insert({
              id: authData.user.id,
              email: testUser.email,
              full_name: testUser.fullName,
              country: 'US',
              currency: 'USD',
              referral_code: Math.random().toString(36).substr(2, 8).toUpperCase(),
              role: testUser.role,
              is_verified: true,
              is_paid: true,
              balance: 0,
              pending_earnings: 0,
              total_earned: 0
            })
            .select()
            .single();

          if (profileError) {
            console.error('❌ Profile creation failed:', profileError.message);
          } else {
            console.log('✅ Profile created successfully');
          }
        } else {
          console.log('✅ Profile already exists');
        }
      }

    } catch (error) {
      console.error(`❌ Error creating user ${testUser.email}:`, error);
    }
  }

  console.log('\n🎉 Test user creation complete!');
  console.log('\n📝 Test Credentials:');
  console.log('User: ernest.debrah@bluecrest.edu.gh / 123456789');
  console.log('Admin: thearnest7@gmail.com / 1234567890');
}

createTestUsers().catch(console.error);
