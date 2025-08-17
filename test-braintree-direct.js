// Direct Braintree API Test
// This will test our credentials directly without the Edge Function

async function testBraintreeCredentials() {
  console.log('🔧 TESTING BRAINTREE CREDENTIALS DIRECTLY...');
  
  // Real credentials from your Braintree dashboard
  const merchantId = '2yhrvbtjszdbvxtt';
  const publicKey = 'sgfjmfv929kzffsr';
  const privateKey = '4edc8a7489369f8e7d5cb8c9a8066c17';
  
  console.log('📊 Using credentials:');
  console.log('Merchant ID:', merchantId);
  console.log('Public Key:', publicKey);
  console.log('Private Key:', privateKey ? '[PRESENT]' : '[MISSING]');
  
  try {
    // Create basic auth header
    const credentials = btoa(`${publicKey}:${privateKey}`);
    
    // Create request body for client token
    const requestBody = {
      client_token: {
        // No customer_id for one-time payments
      }
    };
    
    console.log('🌐 Making request to Braintree API...');
    console.log('URL:', `https://api.sandbox.braintreegateway.com/merchants/${merchantId}/client_token`);
    
    const response = await fetch(`https://api.sandbox.braintreegateway.com/merchants/${merchantId}/client_token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Braintree-Version': '2019-01-01'
      },
      body: JSON.stringify(requestBody)
    });
    
    console.log('📡 Response Status:', response.status);
    console.log('📡 Response Headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('📡 Response Body:', responseText);
    
    if (!response.ok) {
      console.error('❌ API Error:', response.status, responseText);
      return;
    }
    
    // Try to parse as JSON
    let tokenData;
    try {
      tokenData = JSON.parse(responseText);
      console.log('✅ Parsed JSON Response:', tokenData);
      
      // Extract client token
      const clientToken = tokenData.client_token || tokenData.clientToken;
      if (clientToken) {
        console.log('🎯 SUCCESS! Client Token Generated:');
        console.log('Token Length:', clientToken.length);
        console.log('Token Preview:', clientToken.substring(0, 50) + '...');
        
        // Test with Braintree Drop-in
        console.log('🧪 Testing with Braintree Drop-in...');
        await testDropinWithToken(clientToken);
      } else {
        console.error('❌ No client token found in response');
      }
    } catch (parseError) {
      console.log('📄 Response is not JSON, might be token directly:', responseText);
      if (responseText.length > 10) {
        await testDropinWithToken(responseText);
      }
    }
    
  } catch (error) {
    console.error('❌ Network/Request Error:', error);
  }
}

async function testDropinWithToken(clientToken) {
  console.log('🎨 Testing Braintree Drop-in creation...');
  
  try {
    // Load Braintree SDK if not already loaded
    if (!window.braintree) {
      console.log('📦 Loading Braintree SDK...');
      const script = document.createElement('script');
      script.src = 'https://js.braintreegateway.com/web/3.97.2/js/client.min.js';
      document.head.appendChild(script);
      
      await new Promise((resolve, reject) => {
        script.onload = resolve;
        script.onerror = reject;
      });
      
      const dropinScript = document.createElement('script');
      dropinScript.src = 'https://js.braintreegateway.com/web/3.97.2/js/dropin.min.js';
      document.head.appendChild(dropinScript);
      
      await new Promise((resolve, reject) => {
        dropinScript.onload = resolve;
        dropinScript.onerror = reject;
      });
    }
    
    console.log('🔧 Creating Braintree Drop-in...');
    console.log('Using token:', clientToken.substring(0, 50) + '...');
    
    // Create container if it doesn't exist
    let container = document.getElementById('braintree-test-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'braintree-test-container';
      container.style.padding = '20px';
      container.style.border = '2px solid #4CAF50';
      container.style.borderRadius = '8px';
      container.style.margin = '20px';
      container.innerHTML = '<h3>Braintree Drop-in Test</h3>';
      document.body.appendChild(container);
    }
    
    const dropinInstance = await braintree.dropin.create({
      authorization: clientToken,
      container: '#braintree-test-container',
      paypal: {
        flow: 'checkout',
        amount: '10.00',
        currency: 'USD'
      }
    });
    
    console.log('✅ SUCCESS! Drop-in created successfully!');
    console.log('Drop-in instance:', dropinInstance);
    
    // Add success message to the page
    const successMsg = document.createElement('div');
    successMsg.innerHTML = `
      <div style="background: #4CAF50; color: white; padding: 10px; margin: 10px 0; border-radius: 4px;">
        ✅ <strong>SUCCESS!</strong> Braintree Drop-in created successfully!<br>
        Token works properly. Check console for details.
      </div>
    `;
    container.appendChild(successMsg);
    
    return dropinInstance;
    
  } catch (error) {
    console.error('❌ Drop-in Creation Failed:', error);
    
    // Add error message to the page
    let container = document.getElementById('braintree-test-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'braintree-test-container';
      document.body.appendChild(container);
    }
    
    const errorMsg = document.createElement('div');
    errorMsg.innerHTML = `
      <div style="background: #f44336; color: white; padding: 10px; margin: 10px 0; border-radius: 4px;">
        ❌ <strong>ERROR:</strong> ${error.message}<br>
        Check console for details.
      </div>
    `;
    container.appendChild(errorMsg);
    
    throw error;
  }
}

// Auto-run when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', testBraintreeCredentials);
} else {
  testBraintreeCredentials();
}

console.log('🚀 Braintree Direct Test Script Loaded');
