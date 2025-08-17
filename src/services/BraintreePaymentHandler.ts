// BULLETPROOF BRAINTREE PAYMENT HANDLER
// This replaces the existing handleBraintreePayment with a robust implementation

import { BraintreeDropinManager } from '../../BraintreeDropinManager';

export class BraintreePaymentHandler {
  private static dropinManager: BraintreeDropinManager | null = null;
  
  static async handleBraintreePayment(amount: number, planType: string, userId: string): Promise<PaymentResult> {
    console.log('🚀 BULLETPROOF BRAINTREE PAYMENT HANDLER');
    console.log('=======================================');
    console.log('Payment details:', { amount, planType, userId });

    try {
      // STEP 1: Initialize Braintree Drop-in
      const initResult = await this.initializeBraintreeDropin(userId);
      if (!initResult.success) {
        return initResult;
      }

      // STEP 2: Get payment method from Drop-in
      const paymentMethodResult = await this.getPaymentMethod();
      if (!paymentMethodResult.success) {
        return paymentMethodResult;
      }

      // STEP 3: Process payment through Edge Function
      const paymentResult = await this.processPayment(
        paymentMethodResult.paymentMethod, 
        amount, 
        planType, 
        userId
      );

      return paymentResult;

    } catch (error: any) {
      console.error('❌ Bulletproof Braintree payment failed:', error);
      return {
        success: false,
        error: `Payment failed: ${error.message || 'Unknown error'}`
      };
    }
  }

  private static async initializeBraintreeDropin(userId: string): Promise<PaymentResult> {
    try {
      console.log('🔧 Initializing Braintree Drop-in...');

      // Create new manager if needed
      if (!this.dropinManager) {
        this.dropinManager = new BraintreeDropinManager();
      }

      const result = await this.dropinManager.createDropin(userId);
      
      if (result.success) {
        console.log('✅ Braintree Drop-in initialized successfully');
        return { success: true, message: 'Drop-in ready' };
      } else {
        console.error('❌ Drop-in initialization failed:', result.error);
        return { success: false, error: result.error || 'Failed to initialize payment form' };
      }
    } catch (error: any) {
      return { success: false, error: `Drop-in initialization error: ${error.message}` };
    }
  }

  private static async getPaymentMethod(): Promise<PaymentResult & { paymentMethod?: any }> {
    try {
      console.log('🔑 Getting payment method from Drop-in...');

      if (!this.dropinManager) {
        return { success: false, error: 'Drop-in not initialized' };
      }

      const result = await this.dropinManager.getPaymentMethod();
      
      if (result.success && result.paymentMethod) {
        console.log('✅ Payment method obtained:', result.paymentMethod.type);
        return { 
          success: true, 
          paymentMethod: result.paymentMethod,
          message: 'Payment method ready'
        };
      } else {
        return { 
          success: false, 
          error: result.error || 'Failed to get payment method. Please fill in payment details.'
        };
      }
    } catch (error: any) {
      return { success: false, error: `Payment method error: ${error.message}` };
    }
  }

  private static async processPayment(
    paymentMethod: any, 
    amount: number, 
    planType: string, 
    userId: string
  ): Promise<PaymentResult> {
    try {
      console.log('💳 Processing Braintree payment...');

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/braintree-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          paymentMethodNonce: paymentMethod.nonce,
          amount: amount,
          planType: planType,
          userId: userId,
          deviceData: paymentMethod.deviceData || null
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        console.log('✅ Braintree payment successful:', data.transactionId);
        
        // Clean up Drop-in after successful payment
        this.cleanup();
        
        return {
          success: true,
          transactionId: data.transactionId,
          message: 'Payment successful! Welcome to EarnPro!'
        };
      } else {
        console.error('❌ Braintree payment failed:', data.error);
        return {
          success: false,
          error: data.error || 'Payment processing failed'
        };
      }
    } catch (error: any) {
      console.error('❌ Payment processing error:', error);
      return {
        success: false,
        error: `Payment processing failed: ${error.message}`
      };
    }
  }

  static cleanup(): void {
    if (this.dropinManager) {
      this.dropinManager.destroy();
      this.dropinManager = null;
    }
  }

  // Diagnostic method to test Braintree functionality
  static async diagnose(): Promise<{ sdk: boolean; container: boolean; token: boolean }> {
    console.log('🔍 BRAINTREE DIAGNOSTIC');
    console.log('=======================');

    const result = {
      sdk: false,
      container: false,
      token: false
    };

    // Check SDK
    if (typeof window !== 'undefined' && window.braintree && window.braintree.dropin) {
      result.sdk = true;
      console.log('✅ Braintree SDK loaded');
    } else {
      console.log('❌ Braintree SDK not loaded');
    }

    // Check container
    const container = document.getElementById('braintree-drop-in-container');
    if (container) {
      result.container = true;
      console.log('✅ Braintree container found');
    } else {
      console.log('❌ Braintree container not found');
    }

    // Test token
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/braintree-client-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ customerId: 'test-user' }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.clientToken) {
          result.token = true;
          console.log('✅ Client token available');
        }
      }
    } catch (error) {
      console.log('❌ Client token test failed:', error);
    }

    console.log('Diagnostic result:', result);
    return result;
  }
}

// Interface for payment results
interface PaymentResult {
  success: boolean;
  message?: string;
  error?: string;
  transactionId?: string;
}
