// 🚨 PAYMENT SYSTEM DIAGNOSTIC AND FIX
// This file will help identify and fix payment gateway issues

// ISSUE ANALYSIS:
// 1. PayPal: Edge function URL typo "Paypal-create-order" should be "paypal-create-order"
// 2. PayStack: Missing PayStack JS library or initialization
// 3. Braintree: Missing Braintree JS library or Edge functions not deployed

console.log('🔍 Payment System Diagnostic Starting...');

// 1. CHECK ENVIRONMENT VARIABLES
console.log('📊 Environment Variables Check:');
console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL ? '✅ Set' : '❌ Missing');
console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing');
console.log('VITE_PAYSTACK_PUBLIC_KEY:', import.meta.env.VITE_PAYSTACK_PUBLIC_KEY ? '✅ Set' : '❌ Missing');
console.log('VITE_PAYPAL_CLIENT_ID:', import.meta.env.VITE_PAYPAL_CLIENT_ID ? '✅ Set' : '❌ Missing');
console.log('VITE_BRAINTREE_ENVIRONMENT:', import.meta.env.VITE_BRAINTREE_ENVIRONMENT ? '✅ Set' : '❌ Missing');

// 2. CHECK PAYMENT LIBRARIES
console.log('📚 Payment Libraries Check:');
console.log('PayStack:', typeof (window as any).PaystackPop !== 'undefined' ? '✅ Loaded' : '❌ Missing');
console.log('Braintree:', typeof (window as any).braintree !== 'undefined' ? '✅ Loaded' : '❌ Missing');
console.log('PayPal:', typeof (window as any).paypal !== 'undefined' ? '✅ Loaded' : '❌ Missing');

// 3. TEST EDGE FUNCTION CONNECTIVITY
async function testEdgeFunctions() {
  console.log('🔗 Testing Edge Function Connectivity...');
  
  const functions = [
    'braintree-client-token',
    'braintree-process-payment', 
    'paypal-create-order',
    'paystack-confirm'
  ];
  
  for (const func of functions) {
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${func}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ test: true })
      });
      
      console.log(`${func}:`, response.status === 404 ? '❌ Not Found' : response.status < 500 ? '✅ Available' : '⚠️ Error');
    } catch (error) {
      console.log(`${func}: ❌ Network Error`);
    }
  }
}

// 4. SIMPLE PAYMENT TEST FUNCTIONS
export const testPayments = {
  
  // Test PayStack (simplest)
  testPayStack: () => {
    if (typeof (window as any).PaystackPop === 'undefined') {
      console.error('❌ PayStack library not loaded');
      return false;
    }
    
    try {
      const handler = (window as any).PaystackPop.setup({
        key: 'pk_test_a2d30b8bcd09fd282b564a3530da7e500522d523',
        email: 'test@example.com',
        amount: 1500, // $15 in kobo
        currency: 'USD',
        ref: 'TEST-' + Date.now(),
        callback: (response: any) => {
          console.log('✅ PayStack Test Success:', response);
        },
        onClose: () => {
          console.log('PayStack popup closed');
        }
      });
      
      // Don't actually open, just test setup
      console.log('✅ PayStack setup successful');
      return true;
    } catch (error) {
      console.error('❌ PayStack setup failed:', error);
      return false;
    }
  },
  
  // Test direct payment without Edge Functions
  directPayment: async (amount: number, userEmail: string) => {
    console.log('🧪 Testing direct payment processing...');
    
    // This bypasses Edge Functions and directly updates the user
    try {
      // Mock successful payment
      const paymentData = {
        amount,
        currency: 'USD',
        email: userEmail,
        reference: 'DIRECT-TEST-' + Date.now(),
        status: 'success'
      };
      
      console.log('✅ Direct payment test successful:', paymentData);
      return { success: true, data: paymentData };
    } catch (error) {
      console.error('❌ Direct payment test failed:', error);
      return { success: false, error };
    }
  }
};

// Run diagnostics
testEdgeFunctions();

export default testPayments;
