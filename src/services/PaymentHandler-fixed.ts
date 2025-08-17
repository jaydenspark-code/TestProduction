// Payment Handler using existing deployed Edge Functions
import { supabase } from '../lib/supabase';

interface PaymentResult {
  success: boolean;
  error?: string;
  transactionId?: string;
}

class PaymentHandler {
  // PayStack payment using existing paystack-confirm Edge Function
  static async handlePayStackPayment(amount: number, planType: string, userId: string): Promise<PaymentResult> {
    try {
      console.log('🟢 PayStack Payment initiated:', { amount, planType, userId });
      
      // Check if PayStack library is loaded
      if (typeof window === 'undefined' || !window.PaystackPop) {
        throw new Error('PayStack library not loaded. Please refresh the page.');
      }

      return new Promise((resolve) => {
        const handler = window.PaystackPop.setup({
          key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
          email: `user-${userId}@earnpro.org`, // Placeholder email
          amount: amount * 100, // Convert to kobo
          currency: 'NGN',
          callback: async (response: any) => {
            console.log('✅ PayStack payment successful:', response.reference);
            
            try {
              // Use existing paystack-confirm Edge Function
              const confirmResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/paystack-confirm`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
                },
                body: JSON.stringify({
                  reference: response.reference,
                  userId: userId
                })
              });

              const result = await confirmResponse.json();
              
              if (result.success) {
                resolve({ success: true, transactionId: response.reference });
              } else {
                resolve({ success: false, error: result.error || 'Payment confirmation failed' });
              }
            } catch (confirmError: any) {
              resolve({ success: false, error: `Payment confirmation failed: ${confirmError.message}` });
            }
          },
          onClose: () => {
            resolve({ success: false, error: 'Payment cancelled by user' });
          }
        });

        handler.openIframe();
      });

    } catch (error: any) {
      console.error('❌ PayStack error:', error);
      return { success: false, error: error.message };
    }
  }

  // Braintree payment using existing braintree Edge Functions
  static async handleBraintreePayment(amount: number, planType: string, userId: string): Promise<PaymentResult> {
    try {
      console.log('🟡 Braintree Payment initiated:', { amount, planType, userId });
      
      // Check if Braintree library is loaded
      if (typeof window === 'undefined' || !window.braintree) {
        throw new Error('Braintree SDK not loaded. Please refresh the page.');
      }

      // Step 1: Get client token from existing braintree-client-token Edge Function
      const tokenResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/braintree-client-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          customerId: userId,
        }),
      });

      if (!tokenResponse.ok) {
        throw new Error('Failed to get Braintree client token');
      }

      const tokenData = await tokenResponse.json();
      
      // Step 2: Create Braintree Drop-in UI
      const dropin = await window.braintree.dropin.create({
        authorization: tokenData.clientToken,
        container: '#braintree-drop-in-container',
        paypal: {
          flow: 'checkout',
          amount: amount,
          currency: 'USD',
        },
      });

      // Step 3: Get payment method and process via existing braintree-process-payment Edge Function
      const { nonce } = await dropin.requestPaymentMethod();

      const paymentResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/braintree-process-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          paymentMethodNonce: nonce,
          amount: amount,
          customerId: userId,
          orderId: `EPRO-${userId}-${Date.now()}`,
          description: `${planType} Plan Activation`,
        }),
      });

      const paymentResult = await paymentResponse.json();

      if (paymentResult.success) {
        console.log('✅ Braintree payment successful');
        return { success: true, transactionId: paymentResult.transactionId };
      } else {
        return { success: false, error: paymentResult.error || 'Braintree payment failed' };
      }

    } catch (error: any) {
      console.error('❌ Braintree error:', error);
      return { success: false, error: error.message };
    }
  }

  // PayPal payment using existing paypal-create-order Edge Function
  static async handlePayPalPayment(amount: number, planType: string, userId: string): Promise<PaymentResult> {
    try {
      console.log('🔵 PayPal Payment initiated:', { amount, planType, userId });
      
      // Check if PayPal SDK is loaded
      if (typeof window === 'undefined' || !window.paypal) {
        throw new Error('PayPal SDK not loaded. Please refresh the page.');
      }

      // Use existing paypal-create-order Edge Function
      const orderResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/paypal-create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          amount: amount,
          currency: 'USD',
          userId: userId
        })
      });

      if (!orderResponse.ok) {
        throw new Error('Failed to create PayPal order');
      }

      const orderData = await orderResponse.json();
      
      if (orderData.orderId) {
        console.log('✅ PayPal order created:', orderData.orderId);
        
        // Return success with order ID - PayPal will handle the payment flow
        return { success: true, transactionId: orderData.orderId };
      } else {
        return { success: false, error: 'Failed to create PayPal order' };
      }

    } catch (error: any) {
      console.error('❌ PayPal error:', error);
      return { success: false, error: error.message };
    }
  }
}

export default PaymentHandler;
