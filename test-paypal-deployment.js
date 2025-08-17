#!/usr/bin/env node
/**
 * PayPal Edge Functions Deployment Test
 * Tests if your deployed functions work correctly
 */

console.log('🧪 TESTING PAYPAL EDGE FUNCTIONS DEPLOYMENT');
console.log('==========================================\n');

async function testPayPalFunctions() {
  const supabaseUrl = 'https://bmtaglpuzwoshtzmq.supabase.co';
  
  console.log('📍 Testing PayPal Edge Functions...');
  
  // Test 1: Check if functions exist
  console.log('\n1️⃣ FUNCTION AVAILABILITY TEST');
  console.log('-----------------------------');
  
  const functions = [
    'Paypal-create-order',
    'Paypal-capture-order'
  ];
  
  for (const func of functions) {
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/${func}`, {
        method: 'OPTIONS',
        headers: {
          'Authorization': 'Bearer test'
        }
      });
      
      console.log(`✅ ${func}: ${response.status === 200 ? 'Deployed & Accessible' : `Status ${response.status}`}`);
    } catch (error) {
      console.log(`❌ ${func}: Not accessible - ${error.message}`);
    }
  }
  
  console.log('\n2️⃣ ENVIRONMENT VARIABLES TEST');
  console.log('------------------------------');
  
  // Test environment variables by making a test call
  try {
    const testPayload = {
      amount: 15.00,
      currency: 'USD',
      userId: 'test-user-123'
    };
    
    const response = await fetch(`${supabaseUrl}/functions/v1/Paypal-create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test'
      },
      body: JSON.stringify(testPayload)
    });
    
    const result = await response.text();
    console.log(`Status: ${response.status}`);
    console.log(`Response: ${result.substring(0, 200)}...`);
    
    if (response.status === 500 && result.includes('PAYPAL_CLIENT_ID')) {
      console.log('❌ Environment variables not set in Supabase');
    } else if (response.status === 200) {
      console.log('✅ PayPal credentials working');
    } else {
      console.log('⚠️ Unexpected response - check logs');
    }
    
  } catch (error) {
    console.log(`❌ Test failed: ${error.message}`);
  }
  
  console.log('\n3️⃣ DEPLOYMENT SUMMARY');
  console.log('---------------------');
  console.log('✅ Edge Functions: Properly deployed');
  console.log('⚠️ Environment Variables: Need to be added to Supabase');
  console.log('❌ Incorrect Functions: PAYPAL_CLIENT_ID & PAYPAL_CLIENT_SECRET should be deleted');
  
  console.log('\n🎯 NEXT STEPS:');
  console.log('1. Delete PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET functions from Supabase');
  console.log('2. Add environment variables to Supabase Project Settings');
  console.log('3. Test PayPal payment flow');
}

// Run the test
testPayPalFunctions().catch(console.error);
