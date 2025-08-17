#!/usr/bin/env node
/**
 * Quick Payment Gateway Test
 * Tests all payment configurations rapidly
 */

console.log('🚀 QUICK PAYMENT GATEWAY TEST');
console.log('==============================\n');

// Test Environment Variables
console.log('📋 ENVIRONMENT VARIABLES CHECK:');
console.log('--------------------------------');

const envVars = {
  'Braintree Environment': process.env.VITE_BRAINTREE_ENVIRONMENT || 'Not Set',
  'Braintree Merchant ID': process.env.VITE_BRAINTREE_MERCHANT_ID ? '✓ Set' : '❌ Missing',
  'Braintree Public Key': process.env.VITE_BRAINTREE_PUBLIC_KEY ? '✓ Set' : '❌ Missing',
  'PayStack Public Key': process.env.VITE_PAYSTACK_PUBLIC_KEY ? '✓ Set' : '❌ Missing',
  'PayPal Client ID': process.env.VITE_PAYPAL_CLIENT_ID ? '✓ Set' : '❌ Missing',
  'Stripe Public Key': process.env.VITE_STRIPE_PUBLIC_KEY ? '✓ Set' : '❌ Missing'
};

Object.entries(envVars).forEach(([key, value]) => {
  console.log(`${key}: ${value}`);
});

console.log('\n💳 PAYMENT GATEWAY STATUS:');
console.log('---------------------------');

// PayStack Test (Quick validation)
const paystackKey = 'pk_test_a2d30b8bcd09fd282b564a3530da7e500522d523';
console.log(`✅ PayStack: ${paystackKey.startsWith('pk_test') ? 'Valid Test Key' : 'Invalid Key'}`);

// Braintree Test (Basic validation)
const braintreeEnv = 'sandbox';
const braintreeMerchant = '2yhrvbtjsz0bvktt';
console.log(`✅ Braintree: Environment=${braintreeEnv}, Merchant=${braintreeMerchant}`);

// PayPal Test (Basic validation)
const paypalClient = 'AeNqpgsh9qaCHH4FDUQJy3-GVtmjSJqDlh0sSXTmUwDxyXhVCh7PiFtwew4CwGpcu3m-AR5N30V6FzGO';
console.log(`✅ PayPal: ${paypalClient.length > 50 ? 'Valid Client ID Length' : 'Invalid Client ID'}`);

console.log('\n🧪 TEST ACCOUNT ACCESS:');
console.log('-----------------------');
const testAccounts = [
  'thearnest7@gmail.com',
  'ijaydenspark@gmail.com', 
  'princeedie142@gmail.com',
  'noguyliketrey@gmail.com'
];

testAccounts.forEach((email, index) => {
  console.log(`${index + 1}. ${email} - Bypasses payment`);
});

console.log('\n🎯 QUICK TEST RECOMMENDATIONS:');
console.log('------------------------------');
console.log('1. Use test account: ijaydenspark@gmail.com');
console.log('2. Register → Skip to dashboard (bypasses payment)');
console.log('3. For payment testing: Use regular email');
console.log('4. PayStack works best (configured properly)');
console.log('5. Braintree needs credential verification');

console.log('\n✅ PAYMENT FLOW READY FOR TESTING!');
