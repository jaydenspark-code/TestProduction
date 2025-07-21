import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function testRegister() {
  const { supabase } = await import('../src/lib/supabaseClient.ts');
  console.log('Attempting to register a test user...');
  try {
    const { data, error } = await supabase.auth.signUp({
      email: `testuser_${Date.now()}@example.com`,
      password: 'password123',
    });

    if (error) {
      console.error('Registration failed:', error);
      return;
    }

    console.log('User registration successful:', data);

    if (data.user) {
        const { error: profileError } = await supabase
          .from('users')
          .insert([
            {
              id: data.user.id,
              email: data.user.email,
              fullName: 'Test User',
              country: 'US',
              currency: 'USD',
              isVerified: false,
              isPaidUser: false,
              referralCode: `REF${Date.now()}`,
              role: 'user',
              isAgent: false,
              createdAt: new Date().toISOString(),
            }
          ]);
          
        if (profileError) {
            console.error('Error creating profile:', profileError);
            return;
        }
        console.log('User profile created successfully');
    }


  } catch (err) {
    console.error('An unexpected error occurred:', err);
  }
}

testRegister();