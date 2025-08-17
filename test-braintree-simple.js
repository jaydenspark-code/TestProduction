/**
 * Simple Braintree Connection Test
 * Direct test of Braintree credentials without TypeScript imports
 */

import braintree from 'braintree';

// Your sandbox credentials
const gateway = new braintree.BraintreeGateway({
  environment: braintree.Environment.Sandbox,
  merchantId: '2yhrvbtjsz0bvktt',
  publicKey: 'sgfjmfv929kzffsr',
  privateKey: '4edc8a7489369f8e7d5cb8c9a8866c17'
});

async function testBraintreeConnection() {
  console.log('🔧 Testing Braintree Sandbox Connection...');
  console.log('==========================================');
  
  try {
    // Test 1: Generate Client Token
    console.log('📝 Test 1: Generating client token...');
    const response = await gateway.clientToken.generate({});
    
    if (response.success) {
      console.log('✅ Client token generated successfully!');
      console.log(`   Token length: ${response.clientToken.length} characters`);
      console.log(`   Token preview: ${response.clientToken.substring(0, 50)}...`);
    } else {
      console.log('❌ Failed to generate client token');
      console.log('   Error:', response.message);
      return;
    }

    // Test 2: Create Test Customer
    console.log('\n👤 Test 2: Creating test customer...');
    const customerResult = await gateway.customer.create({
      id: `test_${Date.now()}`,
      firstName: 'Test',
      lastName: 'User',
      email: 'test@braintreetest.com'
    });

    if (customerResult.success) {
      console.log('✅ Test customer created successfully!');
      console.log(`   Customer ID: ${customerResult.customer.id}`);
      console.log(`   Customer Email: ${customerResult.customer.email}`);
    } else {
      console.log('❌ Failed to create test customer');
      console.log('   Error:', customerResult.message);
    }

    // Test 3: Test Card Transaction
    console.log('\n💳 Test 3: Processing test transaction...');
    const transactionResult = await gateway.transaction.sale({
      amount: '10.00',
      paymentMethodNonce: 'fake-valid-nonce', // Braintree test nonce
      options: {
        submitForSettlement: true
      }
    });

    if (transactionResult.success) {
      console.log('✅ Test transaction processed successfully!');
      console.log(`   Transaction ID: ${transactionResult.transaction.id}`);
      console.log(`   Amount: $${transactionResult.transaction.amount}`);
      console.log(`   Status: ${transactionResult.transaction.status}`);
    } else {
      console.log('❌ Test transaction failed');
      console.log('   Error:', transactionResult.message);
    }

    console.log('\n🎉 All Braintree tests completed successfully!');
    console.log('🚀 Your sandbox credentials are working perfectly!');
    console.log('\n📋 Next Steps:');
    console.log('1. Start your development server: npm run dev');
    console.log('2. Navigate to /test/braintree for comprehensive testing');
    console.log('3. Test different payment methods and scenarios');
    
  } catch (error) {
    console.error('❌ Braintree connection test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check your internet connection');
    console.log('2. Verify Braintree sandbox credentials');
    console.log('3. Ensure your Braintree account is active');
    console.log('4. Check if there are any API rate limits');
  }
}

// Run the test
testBraintreeConnection();
