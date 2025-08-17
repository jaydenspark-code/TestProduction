// BRAINTREE CLIENT TOKEN TESTER
// This will test the Edge Function directly and diagnose token issues

async function testBraintreeClientToken() {
  console.log('🧪 TESTING BRAINTREE CLIENT TOKEN EDGE FUNCTION');
  console.log('===============================================');

  const supabaseUrl = 'https://ifpyjfytfhtvpwutwbyy.supabase.co';
  const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmcHlqZnl0Zmh0dnB3dXR3Ynl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ0MTMwMTYsImV4cCI6MjA0OTk4OTAxNn0.F47Msr1D3o5H-6q3FJK5PlLRIHIf5w6A2F8WJLNzG_4';

  try {
    console.log('🔄 Calling Braintree client token Edge Function...');
    
    const response = await fetch(`${supabaseUrl}/functions/v1/braintree-client-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({
        customerId: 'test-user-123',
      }),
    });

    console.log('📊 Response Status:', response.status);
    console.log('📊 Response Headers:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('📄 Raw Response:', responseText);

    if (response.ok) {
      try {
        const data = JSON.parse(responseText);
        console.log('✅ Parsed Response:', data);
        
        if (data.clientToken) {
          console.log('🔑 Client Token Found!');
          console.log('   Length:', data.clientToken.length);
          console.log('   First 50 chars:', data.clientToken.substring(0, 50) + '...');
          console.log('   Starts with sandbox_:', data.clientToken.startsWith('sandbox_'));
          
          // Test token format
          if (data.clientToken.length > 20 && typeof data.clientToken === 'string') {
            console.log('✅ Token format appears valid');
            return data.clientToken;
          } else {
            console.log('❌ Token format invalid');
          }
        } else {
          console.log('❌ No clientToken in response');
        }
      } catch (parseError) {
        console.log('❌ Failed to parse JSON response:', parseError);
      }
    } else {
      console.log('❌ Edge Function call failed');
      console.log('Error details:', responseText);
    }
  } catch (error) {
    console.log('❌ Network error calling Edge Function:', error);
  }

  console.log('\n🔧 FALLBACK TOKEN TEST:');
  console.log('=======================');
  
  const fallbackTokens = [
    'sandbox_8hxpnkwq_dc8k2px7wzxr4jdv',
    'sandbox_g42y39zw_348pk9cgf3bgyw2b',
    'sandbox_9dbg82cq_dcpv2brwdjrj3qgd'
  ];

  fallbackTokens.forEach((token, index) => {
    console.log(`Fallback ${index + 1}: ${token}`);
    console.log(`  Length: ${token.length}`);
    console.log(`  Format: ${token.startsWith('sandbox_') ? 'Valid sandbox' : 'Unknown'}`);
  });

  return fallbackTokens[0]; // Return first fallback for testing
}

// Test the function
testBraintreeClientToken().then(token => {
  console.log('\n🎯 FINAL RESULT:');
  console.log('================');
  console.log('Token to use:', token || 'No valid token found');
});
