// Simple registration test - bypasses email verification
// Paste this in the browser console on the registration page to test

async function testRegistration() {
  console.log('🧪 Testing registration directly...');
  
  const testData = {
    email: 'test' + Date.now() + '@example.com',
    password: 'test123456',
    fullName: 'Test User',
    country: 'US',
    currency: 'USD',
    phoneNumber: '1234567890'
  };
  
  console.log('📝 Test data:', testData);
  
  try {
    // Get Supabase client from window
    const supabase = window.supabase || (await import('./src/lib/supabase')).supabase;
    
    console.log('🔄 Attempting auth.signUp...');
    const { data, error } = await supabase.auth.signUp({
      email: testData.email,
      password: testData.password,
      options: {
        data: {
          full_name: testData.fullName,
          country: testData.country,
          currency: testData.currency,
          phone: testData.phoneNumber
        }
      }
    });
    
    if (error) {
      console.error('❌ Registration failed:', error);
      console.error('Error details:', error.message);
    } else {
      console.log('✅ Registration successful!', data);
      console.log('User ID:', data.user?.id);
    }
    
    return { data, error };
  } catch (err) {
    console.error('❌ Test failed with exception:', err);
    return { error: err };
  }
}

// Run the test
testRegistration();
