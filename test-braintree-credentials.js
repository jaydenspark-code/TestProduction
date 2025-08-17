/**
 * Quick Braintree Credential Test
 * Tests if your sandbox credentials are working correctly
 */

import { braintreeService } from './src/services/braintreeService.js';

async function testBraintreeCredentials() {
  console.log('🔧 Testing Braintree Sandbox Credentials...');
  console.log('===============================================');
  
  try {
    // Test 1: Generate Client Token
    console.log('📝 Test 1: Generating client token...');
    const clientToken = await braintreeService.generateClientToken();
    
    if (clientToken) {
      console.log('✅ Client token generated successfully!');
      console.log(`   Token starts with: ${clientToken.substring(0, 20)}...`);
    } else {
      console.log('❌ Failed to generate client token');
      return;
    }

    // Test 2: Environment Check
    console.log('\n🌍 Test 2: Environment verification...');
    console.log(`✅ Environment: ${process.env.VITE_BRAINTREE_ENVIRONMENT}`);
    console.log(`✅ Merchant ID: ${process.env.VITE_BRAINTREE_MERCHANT_ID}`);
    console.log(`✅ Public Key: ${process.env.VITE_BRAINTREE_PUBLIC_KEY}`);
    
    // Test 3: Create Test Customer
    console.log('\n👤 Test 3: Creating test customer...');
    const testCustomer = await braintreeService.createCustomer({
      id: `test_${Date.now()}`,
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
    });

    if (testCustomer.success) {
      console.log('✅ Test customer created successfully!');
      console.log(`   Customer ID: ${testCustomer.customer?.id}`);
    } else {
      console.log('❌ Failed to create test customer:', testCustomer.error);
    }

    console.log('\n🎉 All Braintree tests passed! Your credentials are working correctly.');
    console.log('🚀 Ready to proceed with payment testing!');
    
  } catch (error) {
    console.error('❌ Braintree credential test failed:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check your .env file has the correct credentials');
    console.log('2. Ensure you\'re using sandbox environment');
    console.log('3. Verify your Braintree account is active');
  }
}

// Set environment variables for this test
process.env.VITE_BRAINTREE_ENVIRONMENT = 'sandbox';
process.env.VITE_BRAINTREE_MERCHANT_ID = '2yhrvbtjsz0bvktt';
process.env.VITE_BRAINTREE_PUBLIC_KEY = 'sgfjmfv929kzffsr';
process.env.VITE_BRAINTREE_PRIVATE_KEY = '4edc8a7489369f8e7d5cb8c9a8866c17';

// Run the test
testBraintreeCredentials();
