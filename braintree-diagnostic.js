// Braintree Diagnostic Script
// Use this in browser console to debug Braintree Drop-in issues

console.log('🔍 BRAINTREE DIAGNOSTIC START');

// Check 1: Braintree SDK availability
console.log('1. Braintree SDK Check:');
if (typeof window !== 'undefined' && window.braintree) {
  console.log('✅ Braintree SDK is loaded');
  console.log('   - Version:', window.braintree.VERSION || 'Unknown');
  console.log('   - Available modules:', Object.keys(window.braintree));
} else {
  console.log('❌ Braintree SDK is NOT loaded');
  console.log('   - Check if Braintree script is included in HTML');
}

// Check 2: DOM container
console.log('2. DOM Container Check:');
const container = document.getElementById('braintree-drop-in-container');
if (container) {
  console.log('✅ Braintree container found');
  console.log('   - Container HTML:', container.outerHTML);
  console.log('   - Container visible:', container.offsetParent !== null);
} else {
  console.log('❌ Braintree container NOT found');
  console.log('   - Make sure div with id="braintree-drop-in-container" exists');
}

// Check 3: Test client token request
console.log('3. Client Token Test:');
async function testClientToken() {
  try {
    const response = await fetch(`${window.location.origin.replace('5173', '54321')}/functions/v1/braintree-client-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtdGFxaWxwdXN6d29zaHRpem1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwOTQwNjQsImV4cCI6MjA2ODY3MDA2NH0.MgbMwFJz_VRtIl3WQZyfYBpEJqJgP-T1K2dTNc-D8JQ`,
      },
      body: JSON.stringify({
        customerId: 'test-user-id',
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Client token request successful');
      console.log('   - Response:', data);
      return data.clientToken;
    } else {
      const errorText = await response.text();
      console.log('❌ Client token request failed');
      console.log('   - Status:', response.status);
      console.log('   - Error:', errorText);
      return null;
    }
  } catch (error) {
    console.log('❌ Client token request error');
    console.log('   - Error:', error.message);
    return null;
  }
}

// Check 4: Test Drop-in creation with minimal config
async function testDropinCreation() {
  const clientToken = await testClientToken();
  
  if (!clientToken) {
    console.log('❌ Cannot test Drop-in creation without client token');
    return;
  }

  if (!window.braintree || !window.braintree.dropin) {
    console.log('❌ Braintree Drop-in module not available');
    return;
  }

  const container = document.getElementById('braintree-drop-in-container');
  if (!container) {
    console.log('❌ Cannot test Drop-in creation without container');
    return;
  }

  console.log('4. Drop-in Creation Test:');
  try {
    container.innerHTML = ''; // Clear container
    
    const dropin = await window.braintree.dropin.create({
      authorization: clientToken,
      container: '#braintree-drop-in-container',
      // Minimal configuration to isolate issues
    });

    console.log('✅ Drop-in created successfully with minimal config');
    console.log('   - Drop-in instance:', dropin);
    
    // Test with PayPal config
    container.innerHTML = ''; // Clear container
    const dropinWithPayPal = await window.braintree.dropin.create({
      authorization: clientToken,
      container: '#braintree-drop-in-container',
      paypal: {
        flow: 'checkout',
        amount: '15.00',
        currency: 'USD',
      }
    });
    
    console.log('✅ Drop-in created successfully with PayPal config');
    console.log('   - Drop-in with PayPal:', dropinWithPayPal);
    
  } catch (error) {
    console.log('❌ Drop-in creation failed');
    console.log('   - Error:', error.message);
    console.log('   - Full error:', error);
  }
}

// Run the tests
testDropinCreation();

console.log('🔍 BRAINTREE DIAGNOSTIC END');
console.log('');
console.log('📋 NEXT STEPS:');
console.log('1. Run this script in browser console on payment page');
console.log('2. Check all ✅/❌ results above');
console.log('3. Fix any ❌ issues found');
console.log('4. Common fixes:');
console.log('   - Reload page if SDK not loaded');
console.log('   - Check Braintree credentials in environment');
console.log('   - Verify Edge Function is deployed and working');
