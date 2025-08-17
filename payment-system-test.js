// Payment System Diagnostic and Fix Script
// This script will test all payment gateways and Edge Functions

console.log('🔍 Starting Payment System Diagnosis...\n');

// Test environment variables
const requiredEnvVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'VITE_PAYPAL_CLIENT_ID',
  'VITE_PAYSTACK_PUBLIC_KEY',
  'VITE_BRAINTREE_ENVIRONMENT',
  'VITE_BRAINTREE_MERCHANT_ID'
];

console.log('📋 Environment Variables Check:');
requiredEnvVars.forEach(varName => {
  const value = process.env[varName] || 'MISSING';
  console.log(`  ${varName}: ${value.substring(0, 20)}${value.length > 20 ? '...' : ''}`);
});

// Test Edge Functions availability
async function testEdgeFunctions() {
  console.log('\n🔧 Testing Edge Functions...');
  
  const baseUrl = process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
  
  if (!baseUrl || !anonKey) {
    console.log('❌ Missing Supabase credentials');
    return false;
  }

  const functionsToTest = [
    'braintree-client-token',
    'paypal-create-order', 
    'paystack-confirm'
  ];

  for (const functionName of functionsToTest) {
    try {
      console.log(`  Testing ${functionName}...`);
      
      const response = await fetch(`${baseUrl}/functions/v1/${functionName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${anonKey}`,
        },
        body: JSON.stringify({ test: true })
      });

      const status = response.status;
      console.log(`    Status: ${status} ${status < 400 ? '✅' : '❌'}`);
      
      if (status >= 400) {
        const errorText = await response.text();
        console.log(`    Error: ${errorText.substring(0, 100)}`);
      }

    } catch (error) {
      console.log(`    ❌ Network error: ${error.message}`);
    }
  }
}

// Test PayStack library loading
function testPayStackLibrary() {
  console.log('\n💳 Testing PayStack Library...');
  
  if (typeof window !== 'undefined' && window.PaystackPop) {
    console.log('  ✅ PayStack library loaded');
    return true;
  } else {
    console.log('  ❌ PayStack library not loaded');
    console.log('  💡 Solution: Add <script src="https://js.paystack.co/v1/inline.js"></script> to index.html');
    return false;
  }
}

// Test Braintree library loading
function testBraintreeLibrary() {
  console.log('\n🧠 Testing Braintree Library...');
  
  if (typeof window !== 'undefined' && window.braintree) {
    console.log('  ✅ Braintree library loaded');
    return true;
  } else {
    console.log('  ❌ Braintree library not loaded');
    console.log('  💡 Solution: Add Braintree SDK script to index.html');
    return false;
  }
}

// Main diagnostic function
async function runDiagnostics() {
  console.log('🚀 Payment System Full Diagnostic\n');
  
  // Test Edge Functions
  await testEdgeFunctions();
  
  // Test client-side libraries (only in browser)
  if (typeof window !== 'undefined') {
    testPayStackLibrary();
    testBraintreeLibrary();
  }
  
  console.log('\n📊 Diagnostic Complete!');
  console.log('\n🔧 Recommended Fixes:');
  console.log('1. Deploy Edge Functions: supabase functions deploy');
  console.log('2. Add payment libraries to index.html');
  console.log('3. Verify environment variables');
  console.log('4. Test payment flows individually');
}

// Run diagnostics
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runDiagnostics };
} else {
  runDiagnostics();
}
