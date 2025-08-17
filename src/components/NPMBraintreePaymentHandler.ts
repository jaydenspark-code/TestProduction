// NPM-based Braintree Payment Handler
// This version uses NPM packages instead of CDN to bypass network issues

import * as dropin from 'braintree-web-drop-in';

export class NPMBraintreePaymentHandler {
  constructor() {
    this.dropinInstance = null;
    this.isInitialized = false;
  }

  async initialize() {
    console.log('🔧 NPM BRAINTREE PAYMENT HANDLER INITIALIZING...');
    
    try {
      // Get fresh client token from our Edge Function
      const clientToken = await this.getFreshClientToken();
      
      console.log('✅ Got fresh client token:', clientToken.length, 'characters');
      
      // Create container if it doesn't exist
      this.ensureContainer();
      
      // Create Drop-in using NPM package
      console.log('🎨 Creating Drop-in with NPM package...');
      this.dropinInstance = await dropin.create({
        authorization: clientToken,
        container: '#braintree-dropin-container',
        paypal: {
          flow: 'checkout',
          amount: '10.00',
          currency: 'USD'
        },
        card: {
          cardholderName: {
            required: false
          }
        }
      });
      
      this.isInitialized = true;
      console.log('✅ NPM Braintree Drop-in created successfully!');
      
      return this.dropinInstance;
      
    } catch (error) {
      console.error('❌ NPM Braintree initialization failed:', error);
      throw new Error(`NPM Braintree initialization failed: ${error.message}`);
    }
  }

  async getFreshClientToken() {
    console.log('🌐 Requesting fresh client token from Braintree API...');
    
    try {
      // BREAKTHROUGH FIX: Direct API call with proper base64 encoding
      const credentials = btoa('sgfjmfv929kzffsr:4edc8a7489369f8e7d5cb8c9a8066c17');
      const requestBody = `<?xml version="1.0" encoding="UTF-8"?><client-token></client-token>`;
      const apiUrl = 'https://api.sandbox.braintreegateway.com/merchants/2yhrvbtjszdbvxtt/client_token';
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/xml',
          'Accept': 'application/xml',
          'Braintree-Version': '2019-01-01'
        },
        body: requestBody
      });

      if (!response.ok) {
        throw new Error(`Braintree API error: ${response.status} ${response.statusText}`);
      }

      const responseText = await response.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(responseText, 'text/xml');
      const clientTokenElement = xmlDoc.querySelector('client-token');
      
      if (!clientTokenElement) {
        throw new Error('No client token found in response');
      }

      // CRITICAL FIX: Base64 encode the JSON token
      const rawJsonToken = clientTokenElement.textContent.trim();
      const encodedToken = btoa(rawJsonToken);
      
      console.log('✅ Client token obtained and base64 encoded successfully');
      console.log(`🔑 Token length: ${encodedToken.length} characters`);
      
      return encodedToken;
      
    } catch (error) {
      console.error('❌ Token generation failed:', error);
      throw new Error(`Unable to get fresh client token: ${error.message}`);
    }
  }

  ensureContainer() {
    let container = document.getElementById('braintree-dropin-container');
    
    if (!container) {
      console.log('📦 Creating Braintree container...');
      container = document.createElement('div');
      container.id = 'braintree-dropin-container';
      container.style.cssText = `
        min-height: 200px;
        padding: 20px;
        border: 2px solid #4CAF50;
        border-radius: 8px;
        background-color: #f9f9f9;
        margin: 20px 0;
      `;
      
      // Find a good place to insert it
      const paymentSection = document.querySelector('.payment-section') || 
                            document.querySelector('#payment') || 
                            document.querySelector('main') || 
                            document.body;
      
      paymentSection.appendChild(container);
    }
    
    // CRITICAL FIX: Ensure completely empty container for Drop-in
    console.log('🧹 Clearing container completely for Drop-in...');
    container.innerHTML = '';
    
    return container;
  }

  async requestPaymentMethod() {
    if (!this.isInitialized || !this.dropinInstance) {
      throw new Error('Drop-in not initialized');
    }

    console.log('💳 Requesting payment method...');
    
    try {
      const payload = await new Promise((resolve, reject) => {
        this.dropinInstance.requestPaymentMethod((err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        });
      });

      console.log('✅ Payment method obtained:', payload);
      return payload;
      
    } catch (error) {
      console.error('❌ Payment method request failed:', error);
      throw error;
    }
  }

  async processPayment(amount = '10.00') {
    console.log('💰 Processing payment...');
    
    try {
      const paymentMethod = await this.requestPaymentMethod();
      
      // Send to server for processing
      const response = await fetch('/api/process-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentMethodNonce: paymentMethod.nonce,
          amount: amount
        })
      });

      if (!response.ok) {
        throw new Error(`Payment processing failed: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Payment processed successfully:', result);
      
      return result;
      
    } catch (error) {
      console.error('❌ Payment processing failed:', error);
      throw error;
    }
  }

  teardown() {
    if (this.dropinInstance) {
      console.log('🧹 Tearing down Drop-in...');
      this.dropinInstance.teardown(() => {
        console.log('✅ Drop-in torn down successfully');
      });
      this.dropinInstance = null;
      this.isInitialized = false;
    }
  }
}

// Export default instance
export const npmBraintreeHandler = new NPMBraintreePaymentHandler();
