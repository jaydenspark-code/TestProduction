// Test Braintree client token Edge Function
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://bmtaqilpuszwoshtizmq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtdGFxaWxwdXN6d29zaHRpem1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwOTQwNjQsImV4cCI6MjA2ODY3MDA2NH0.QdtF2IFukonNWslwkUV1oQbpYBgdYhtekvjCywKR0vA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testBraintreeClientToken() {
  console.log('🔍 Testing Braintree client token Edge Function...');
  
  try {
    const { data, error } = await supabase.functions.invoke('braintree-client-token', {
      body: {
        customerId: 'test-user-123'
      }
    });

    if (error) {
      console.error('❌ Edge Function error:', error);
    } else {
      console.log('✅ Edge Function response:', data);
      
      if (data?.clientToken) {
        console.log('✅ Client token received');
        console.log('📏 Token length:', data.clientToken.length);
        console.log('🔤 Token preview:', data.clientToken.substring(0, 20) + '...');
      } else {
        console.log('⚠️ No client token in response');
      }
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testBraintreeClientToken();
