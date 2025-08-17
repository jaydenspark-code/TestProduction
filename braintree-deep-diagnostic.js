// BRAINTREE DROP-IN CREATION DEEP DIAGNOSTIC
// Let's find out exactly why Drop-in creation is failing

console.log('🔍 BRAINTREE DROP-IN CREATION DEEP DIAGNOSTIC');
console.log('============================================');

// Create a real-time diagnostic that we can inject into the browser
const diagnosticScript = `
// INJECT THIS INTO BROWSER CONSOLE TO DEBUG BRAINTREE
window.debugBraintree = async function() {
  console.log('🔍 STARTING BRAINTREE DEEP DIAGNOSTIC');
  console.log('====================================');
  
  // Step 1: Check if Braintree SDK is loaded
  console.log('STEP 1: Checking Braintree SDK...');
  if (typeof window.braintree === 'undefined') {
    console.error('❌ window.braintree is undefined');
    return;
  }
  
  if (typeof window.braintree.dropin === 'undefined') {
    console.error('❌ window.braintree.dropin is undefined');
    return;
  }
  
  if (typeof window.braintree.dropin.create !== 'function') {
    console.error('❌ window.braintree.dropin.create is not a function');
    return;
  }
  
  console.log('✅ Braintree SDK is properly loaded');
  console.log('SDK version:', window.braintree.VERSION || 'unknown');
  
  // Step 2: Check container
  console.log('\\nSTEP 2: Checking container...');
  const container = document.getElementById('braintree-drop-in-container');
  if (!container) {
    console.error('❌ Container not found');
    return;
  }
  console.log('✅ Container found:', container);
  
  // Step 3: Test with a simple token first
  console.log('\\nSTEP 3: Testing with basic configuration...');
  
  // Clear container
  container.innerHTML = '';
  
  try {
    // Use a real client token from your Edge Function
    console.log('Getting client token from Edge Function...');
    const response = await fetch(\`\${window.location.origin.replace('5174', '54321')}/functions/v1/braintree-client-token\`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ customerId: 'test-user' }),
    });
    
    if (!response.ok) {
      throw new Error(\`Edge Function failed: \${response.status}\`);
    }
    
    const data = await response.json();
    const clientToken = data.clientToken;
    
    if (!clientToken) {
      throw new Error('No client token received');
    }
    
    console.log('✅ Got client token:', clientToken.substring(0, 50) + '...');
    
    // Try minimal configuration
    console.log('\\nAttempting Drop-in creation with minimal config...');
    const dropinInstance = await window.braintree.dropin.create({
      authorization: clientToken,
      container: '#braintree-drop-in-container'
    });
    
    console.log('✅ SUCCESS! Drop-in created:', dropinInstance);
    
  } catch (error) {
    console.error('❌ Drop-in creation failed:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    // Try with hardcoded test token as fallback
    console.log('\\nTrying with Braintree test token...');
    try {
      const testToken = 'sandbox_8hxpnkwq_dc8k2px7wzxr4jdv';
      const fallbackInstance = await window.braintree.dropin.create({
        authorization: testToken,
        container: '#braintree-drop-in-container'
      });
      console.log('✅ SUCCESS with test token!', fallbackInstance);
    } catch (fallbackError) {
      console.error('❌ Even test token failed:', fallbackError);
    }
  }
};

// Run the diagnostic
window.debugBraintree();
`;

console.log(`
🎯 DIAGNOSTIC PLAN:
==================

The enhanced system is still failing, which means we need to dig deeper 
into the actual Braintree SDK behavior.

📋 COPY AND PASTE THIS INTO YOUR BROWSER CONSOLE:
================================================

${diagnosticScript}

🔍 WHAT THIS DIAGNOSTIC WILL TELL US:
====================================

1. Whether Braintree SDK is actually loaded correctly
2. If the container element exists and is accessible
3. Whether the client token is valid
4. The exact error message from Braintree SDK
5. If it's a token issue or a configuration issue

🎮 STEPS TO RUN DIAGNOSTIC:
==========================

1. Open your browser to: http://localhost:5174/payment
2. Open Developer Tools (F12)
3. Go to Console tab
4. Paste the diagnostic script above
5. Press Enter
6. Check the detailed output

📊 POSSIBLE ROOT CAUSES:
=======================

Based on the persistent "There was an error creating Drop-in" message:

1. CLIENT TOKEN ISSUES:
   - Edge Function might not be returning valid tokens
   - Sandbox tokens might be expired or invalid
   - Token format might be incorrect

2. SDK VERSION CONFLICTS:
   - Version 1.41.0 might have compatibility issues
   - Need to check if older version works better

3. CONTAINER/DOM ISSUES:
   - Container might not be properly attached to DOM
   - CSS might be hiding or interfering with container
   - Multiple containers might exist causing conflicts

4. NETWORK/CORS ISSUES:
   - Braintree servers might be blocked
   - CORS issues preventing SDK from working
   - Firewall blocking Braintree API calls

🔧 QUICK FIXES TO TRY:
=====================

Let me also create some immediate fixes to test...
`);

console.log('Creating immediate fix attempts...');

const simplifiedBraintreeTest = `
// SIMPLIFIED BRAINTREE TEST - REPLACE ENHANCED SYSTEM TEMPORARILY

class SimpleBraintreeTest {
  static async testBasicDropin() {
    console.log('🧪 TESTING BASIC BRAINTREE DROP-IN');
    console.log('=================================');
    
    // Wait for SDK
    if (!window.braintree || !window.braintree.dropin) {
      console.error('❌ Braintree SDK not loaded');
      return false;
    }
    
    // Get container
    const container = document.getElementById('braintree-drop-in-container');
    if (!container) {
      console.error('❌ Container not found');
      return false;
    }
    
    // Clear container
    container.innerHTML = '';
    
    // Test with known working token
    try {
      console.log('Testing with basic configuration...');
      
      const dropinInstance = await window.braintree.dropin.create({
        authorization: 'sandbox_8hxpnkwq_dc8k2px7wzxr4jdv',
        container: container // Use element directly, not selector
      });
      
      console.log('✅ SUCCESS! Basic Drop-in works:', dropinInstance);
      return true;
      
    } catch (error) {
      console.error('❌ Basic test failed:', error);
      
      // Try with selector instead
      try {
        console.log('Retrying with selector...');
        const dropinInstance2 = await window.braintree.dropin.create({
          authorization: 'sandbox_8hxpnkwq_dc8k2px7wzxr4jdv',
          container: '#braintree-drop-in-container'
        });
        console.log('✅ SUCCESS with selector!', dropinInstance2);
        return true;
      } catch (error2) {
        console.error('❌ Selector also failed:', error2);
        return false;
      }
    }
  }
}

// Export for testing
window.SimpleBraintreeTest = SimpleBraintreeTest;
`;

console.log(`
📋 ADDITIONAL TEST TO RUN:
=========================

Also paste this simplified test into browser console:

${simplifiedBraintreeTest}

Then run: SimpleBraintreeTest.testBasicDropin()

🎯 NEXT STEPS BASED ON DIAGNOSTIC RESULTS:
=========================================

1. IF SDK NOT LOADED:
   - Check network tab for failed script loads
   - Try different CDN or local hosting
   - Check for ad blockers or security software

2. IF CONTAINER ISSUES:
   - Check CSS display properties
   - Verify container is in correct DOM position
   - Check for conflicting IDs

3. IF TOKEN ISSUES:
   - Test Edge Function directly
   - Use Braintree test tokens
   - Check token format and expiration

4. IF SDK VERSION ISSUES:
   - Downgrade to version 1.33.0
   - Try different Drop-in versions
   - Check compatibility matrix

🚨 IMMEDIATE ACTION REQUIRED:
============================

Run the diagnostic script in your browser console and share the output.
This will tell us exactly where the failure is occurring.
`);

module.exports = {
  diagnosticScript,
  simplifiedBraintreeTest
};
