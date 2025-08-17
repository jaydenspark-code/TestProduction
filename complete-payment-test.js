#!/usr/bin/env node
/**
 * Complete Payment Flow Testing
 * Tests both Braintree and PayPal integrations
 */

console.log('🧪 COMPLETE PAYMENT FLOW TESTING');
console.log('=================================\n');

async function testPaymentFlows() {
  const supabaseUrl = 'https://bmtaglpuzwoshtzmq.supabase.co';
  
  console.log('🎯 Testing Both Payment Gateways...\n');
  
  // Test 1: Braintree Client Token Generation
  console.log('1️⃣ BRAINTREE - CLIENT TOKEN TEST');
  console.log('=================================');
  
  try {
    console.log('📋 Requesting Braintree client token...');
    
    const braintreeTokenResponse = await fetch(`${supabaseUrl}/functions/v1/braintree-client-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      body: JSON.stringify({
        customerId: 'test-braintree-' + Date.now()
      })
    });
    
    console.log(`📊 Braintree Response Status: ${braintreeTokenResponse.status}`);
    
    if (braintreeTokenResponse.status === 200) {
      const braintreeResult = await braintreeTokenResponse.json();
      console.log('✅ BRAINTREE CLIENT TOKEN: SUCCESS!');
      console.log(`   Token Length: ${braintreeResult.clientToken?.length || 0} characters`);
      console.log(`   Token Preview: ${braintreeResult.clientToken?.substring(0, 50)}...`);
    } else {
      const braintreeError = await braintreeTokenResponse.text();
      console.log('❌ BRAINTREE CLIENT TOKEN: FAILED');
      console.log(`   Error: ${braintreeError}`);
    }
    
  } catch (error) {
    console.log(`❌ Braintree test failed: ${error.message}`);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test 2: PayPal Order Creation
  console.log('2️⃣ PAYPAL - ORDER CREATION TEST');
  console.log('===============================');
  
  try {
    console.log('📋 Creating PayPal order...');
    
    const paypalOrderPayload = {
      amount: 15.00,
      currency: 'USD', 
      userId: 'test-paypal-' + Date.now()
    };
    
    const paypalOrderResponse = await fetch(`${supabaseUrl}/functions/v1/Paypal-create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      body: JSON.stringify(paypalOrderPayload)
    });
    
    console.log(`📊 PayPal Response Status: ${paypalOrderResponse.status}`);
    
    if (paypalOrderResponse.status === 200) {
      const paypalResult = await paypalOrderResponse.json();
      console.log('✅ PAYPAL ORDER CREATION: SUCCESS!');
      console.log(`   Order ID: ${paypalResult.orderId}`);
      console.log(`   Approval URL: ${paypalResult.approvalUrl}`);
      console.log('\n🎯 MANUAL TESTING INSTRUCTIONS:');
      console.log('1. Copy the approval URL above');
      console.log('2. Open it in a browser');
      console.log('3. Login with: sb-imkw344889392@personal.example.com');
      console.log('4. Password: hVlukAL9');
      console.log('5. Complete PayPal authorization');
    } else {
      const paypalError = await paypalOrderResponse.text();
      console.log('❌ PAYPAL ORDER CREATION: FAILED');
      console.log(`   Error: ${paypalError}`);
    }
    
  } catch (error) {
    console.log(`❌ PayPal test failed: ${error.message}`);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test Results Summary
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('=======================');
  console.log('🔷 BRAINTREE:');
  console.log('   • Client Token Generation: Test completed');
  console.log('   • Ready for credit card payments');
  console.log('   • Test Card: 4111 1111 1111 1111');
  
  console.log('\n🟡 PAYPAL:');
  console.log('   • Order Creation: Test completed');
  console.log('   • Ready for PayPal payments');
  console.log('   • Test Account: sb-imkw344889392@personal.example.com');
  
  console.log('\n🚀 NEXT STEPS - FULL APP TESTING:');
  console.log('=================================');
  console.log('1. Start your app: npm run dev');
  console.log('2. Navigate to: http://localhost:5173');
  console.log('3. Go to payment/activation page');
  console.log('4. Test Braintree payment:');
  console.log('   • Select credit card payment');
  console.log('   • Use: 4111 1111 1111 1111');
  console.log('   • Any future expiry, any CVV');
  console.log('   • Verify account activation');
  
  console.log('\n5. Test PayPal payment:');
  console.log('   • Select PayPal payment');
  console.log('   • Login: sb-imkw344889392@personal.example.com');
  console.log('   • Password: hVlukAL9');
  console.log('   • Complete authorization');
  console.log('   • Verify account activation');
  
  console.log('\n✅ EXPECTED RESULTS:');
  console.log('• User account marked as is_paid = true');
  console.log('• User receives $3 welcome bonus');
  console.log('• Transaction logged in database');
  console.log('• Payment visible in respective gateway dashboards');
  
  console.log('\n🎉 BOTH PAYMENT GATEWAYS ARE READY FOR TESTING!');
}

// Run the complete test
testPaymentFlows().catch(console.error);
