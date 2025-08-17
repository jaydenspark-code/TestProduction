// Real-time payment system test with existing Edge Functions
console.log('🚀 Testing Payment System with Deployed Edge Functions...\n');

// Test environment setup
const testConfig = {
  supabaseUrl: 'https://bmtaqilpuszwoshtizmq.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtdGFxaWxwdXN6d29zaHRpem1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwOTQwNjQsImV4cCI6MjA2ODY3MDA2NH0.QdtF2IFukonNWslwkUV1oQbpYBgdYhtekvjCywKR0vA',
  testUserId: 'test-user-' + Date.now(),
  testAmount: 15.00
};

// Test Edge Functions
async function testEdgeFunction(functionName, payload = {}) {
  try {
    console.log(`🔧 Testing ${functionName}...`);
    
    const response = await fetch(`${testConfig.supabaseUrl}/functions/v1/${functionName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testConfig.anonKey}`,
      },
      body: JSON.stringify(payload)
    });

    const status = response.status;
    const isSuccess = status < 400;
    
    console.log(`  Status: ${status} ${isSuccess ? '✅' : '❌'}`);
    
    if (isSuccess) {
      const data = await response.json();
      console.log(`  Response: ${JSON.stringify(data).substring(0, 100)}...`);
      return { success: true, data };
    } else {
      const error = await response.text();
      console.log(`  Error: ${error.substring(0, 100)}...`);
      return { success: false, error };
    }

  } catch (error) {
    console.log(`  ❌ Network error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Test PayStack Edge Function
async function testPayStackConfirm() {
  const payload = {
    reference: `TEST_REF_${Date.now()}`,
    userId: testConfig.testUserId
  };
  
  // Note: This will fail because it's a test reference, but we can see if the function responds
  return await testEdgeFunction('paystack-confirm', payload);
}

// Test Braintree Client Token
async function testBraintreeClientToken() {
  const payload = {
    customerId: testConfig.testUserId
  };
  
  return await testEdgeFunction('braintree-client-token', payload);
}

// Test PayPal Order Creation
async function testPayPalCreateOrder() {
  const payload = {
    amount: testConfig.testAmount,
    currency: 'USD',
    userId: testConfig.testUserId
  };
  
  return await testEdgeFunction('paypal-create-order', payload);
}

// Check payment library availability
function checkPaymentLibraries() {
  console.log('\n💳 Checking Payment Libraries...');
  
  const libraries = [
    { name: 'PayStack', check: () => typeof window !== 'undefined' && !!window.PaystackPop },
    { name: 'Braintree', check: () => typeof window !== 'undefined' && !!window.braintree },
    { name: 'PayPal', check: () => typeof window !== 'undefined' && !!window.paypal }
  ];

  libraries.forEach(lib => {
    const available = lib.check();
    console.log(`  ${lib.name}: ${available ? '✅' : '❌'}`);
  });

  return libraries.every(lib => lib.check());
}

// Main test runner
async function runPaymentSystemTests() {
  console.log('🔍 PAYMENT SYSTEM DIAGNOSTIC REPORT');
  console.log('=====================================\n');

  // Test 1: Payment Libraries
  const librariesOk = checkPaymentLibraries();
  
  // Test 2: Edge Functions
  console.log('\n🔧 Testing Edge Functions...');
  
  const tests = [
    { name: 'PayStack Confirm', test: testPayStackConfirm },
    { name: 'Braintree Client Token', test: testBraintreeClientToken },
    { name: 'PayPal Create Order', test: testPayPalCreateOrder }
  ];

  const results = [];
  
  for (const test of tests) {
    const result = await test.test();
    results.push({ name: test.name, ...result });
    await new Promise(resolve => setTimeout(resolve, 500)); // Throttle requests
  }

  // Summary
  console.log('\n📊 TEST RESULTS SUMMARY');
  console.log('========================');
  console.log(`Payment Libraries: ${librariesOk ? '✅ All Loaded' : '❌ Missing Libraries'}`);
  
  results.forEach(result => {
    console.log(`${result.name}: ${result.success ? '✅ Responding' : '❌ Error'}`);
  });

  const allFunctionsResponding = results.every(r => r.success);
  
  console.log('\n🎯 OVERALL STATUS');
  console.log('==================');
  if (librariesOk && allFunctionsResponding) {
    console.log('✅ Payment system is READY for testing!');
    console.log('💡 You can now test payments on: http://localhost:5175/');
  } else {
    console.log('⚠️ Payment system has issues:');
    if (!librariesOk) console.log('  - Payment libraries not loaded');
    if (!allFunctionsResponding) console.log('  - Some Edge Functions not responding');
  }

  console.log('\n🔗 Next Steps:');
  console.log('1. Navigate to http://localhost:5175/');
  console.log('2. Register a new account');
  console.log('3. Go to payment setup');
  console.log('4. Test each payment method');
}

// Run tests when script loads
if (typeof window !== 'undefined') {
  // Browser environment - run immediately
  runPaymentSystemTests();
} else {
  // Node environment - export for later use
  module.exports = { runPaymentSystemTests };
}
