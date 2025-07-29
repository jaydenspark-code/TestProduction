import { loadStripe, Stripe } from '@stripe/stripe-js';
import { supabase } from '../lib/supabaseClient';

export type PaymentGateway = 'paystack' | 'stripe' | 'paypal';
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface PaymentGatewayConfig {
  paystack: {
    publicKey: string;
    secretKey: string;
  };
  stripe: {
    publicKey: string;
    secretKey: string;
  };
  paypal: {
    clientId: string;
    clientSecret: string;
  };
}

export interface PaymentTransaction {
  id: string;
  gateway: PaymentGateway;
  amount: number;
  currency: string;
  status: PaymentStatus;
  reference: string;
  gatewayReference?: string;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentInitRequest {
  amount: number;
  currency: string;
  email: string;
  reference: string;
  gateway: PaymentGateway;
  metadata?: any;
  callbackUrl?: string;
}

export interface GatewayResponse {
  success: boolean;
  data?: any;
  error?: string;
  authorizationUrl?: string;
  accessCode?: string;
}

class PaymentGatewayService {
  private stripe: Promise<Stripe | null>;
  private config: PaymentGatewayConfig;

  constructor() {
    this.config = {
      paystack: {
        publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || '',
        secretKey: import.meta.env.VITE_PAYSTACK_SECRET_KEY || '',
      },
      stripe: {
        publicKey: import.meta.env.VITE_STRIPE_PUBLIC_KEY || '',
        secretKey: import.meta.env.VITE_STRIPE_SECRET_KEY || '',
      },
      paypal: {
        clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID || '',
        clientSecret: import.meta.env.VITE_PAYPAL_CLIENT_SECRET || '',
      },
    };

    // Initialize Stripe
    this.stripe = loadStripe(this.config.stripe.publicKey);
  }

  /**
   * Get available payment gateways based on currency and region
   */
  getAvailableGateways(currency: string, country?: string): PaymentGateway[] {
    const gateways: PaymentGateway[] = [];

    // Paystack - Best for African countries
    if (['NGN', 'GHS', 'KES', 'ZAR'].includes(currency)) {
      gateways.push('paystack');
    }

    // Stripe - Global support
    if (this.config.stripe.publicKey) {
      gateways.push('stripe');
    }

    // PayPal - Global support
    if (this.config.paypal.clientId) {
      gateways.push('paypal');
    }

    return gateways;
  }

  /**
   * Initialize payment with specified gateway
   */
  async initializePayment(request: PaymentInitRequest): Promise<GatewayResponse> {
    try {
      console.log(`🔄 Initializing payment with ${request.gateway}:`, {
        amount: request.amount,
        currency: request.currency,
        email: request.email,
        reference: request.reference
      });

      switch (request.gateway) {
        case 'paystack':
          return await this.initializePaystackPayment(request);
        case 'stripe':
          return await this.initializeStripePayment(request);
        case 'paypal':
          return await this.initializePayPalPayment(request);
        default:
          throw new Error(`Unsupported payment gateway: ${request.gateway}`);
      }
    } catch (error: any) {
      console.error('❌ Payment initialization failed:', error);
      return {
        success: false,
        error: error.message || 'Payment initialization failed'
      };
    }
  }

  /**
   * Paystack payment initialization
   */
  private async initializePaystackPayment(request: PaymentInitRequest): Promise<GatewayResponse> {
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.paystack.secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: request.email,
        amount: request.amount * 100, // Convert to kobo
        reference: request.reference,
        currency: request.currency,
        callback_url: request.callbackUrl,
        metadata: request.metadata,
      }),
    });

    const data = await response.json();

    if (response.ok && data.status) {
      // Store transaction in database
      await this.storeTransaction({
        reference: request.reference,
        gateway: 'paystack',
        amount: request.amount,
        currency: request.currency,
        status: 'pending',
        gatewayReference: data.data.access_code,
        metadata: request.metadata,
      });

      return {
        success: true,
        data: data.data,
        authorizationUrl: data.data.authorization_url,
        accessCode: data.data.access_code,
      };
    }

    throw new Error(data.message || 'Paystack initialization failed');
  }

  /**
   * Stripe payment initialization
   */
  private async initializeStripePayment(request: PaymentInitRequest): Promise<GatewayResponse> {
    // Create payment intent
    const response = await fetch('/api/stripe/create-payment-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: request.amount * 100, // Convert to cents
        currency: request.currency.toLowerCase(),
        metadata: {
          reference: request.reference,
          email: request.email,
          ...request.metadata,
        },
      }),
    });

    const data = await response.json();

    if (response.ok) {
      // Store transaction in database
      await this.storeTransaction({
        reference: request.reference,
        gateway: 'stripe',
        amount: request.amount,
        currency: request.currency,
        status: 'pending',
        gatewayReference: data.id,
        metadata: request.metadata,
      });

      return {
        success: true,
        data: {
          client_secret: data.client_secret,
          payment_intent_id: data.id,
        },
      };
    }

    throw new Error(data.error || 'Stripe initialization failed');
  }

  /**
   * PayPal payment initialization
   */
  private async initializePayPalPayment(request: PaymentInitRequest): Promise<GatewayResponse> {
    // Create PayPal order
    const response = await fetch('/api/paypal/create-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: request.amount,
        currency: request.currency,
        reference: request.reference,
        return_url: request.callbackUrl,
        metadata: request.metadata,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      // Store transaction in database
      await this.storeTransaction({
        reference: request.reference,
        gateway: 'paypal',
        amount: request.amount,
        currency: request.currency,
        status: 'pending',
        gatewayReference: data.id,
        metadata: request.metadata,
      });

      return {
        success: true,
        data: data,
        authorizationUrl: data.links?.find((link: any) => link.rel === 'approve')?.href,
      };
    }

    throw new Error(data.error || 'PayPal initialization failed');
  }

  /**
   * Verify payment status
   */
  async verifyPayment(reference: string, gateway: PaymentGateway): Promise<GatewayResponse> {
    try {
      switch (gateway) {
        case 'paystack':
          return await this.verifyPaystackPayment(reference);
        case 'stripe':
          return await this.verifyStripePayment(reference);
        case 'paypal':
          return await this.verifyPayPalPayment(reference);
        default:
          throw new Error(`Unsupported gateway for verification: ${gateway}`);
      }
    } catch (error: any) {
      console.error('❌ Payment verification failed:', error);
      return {
        success: false,
        error: error.message || 'Payment verification failed'
      };
    }
  }

  /**
   * Verify Paystack payment
   */
  private async verifyPaystackPayment(reference: string): Promise<GatewayResponse> {
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        'Authorization': `Bearer ${this.config.paystack.secretKey}`,
      },
    });

    const data = await response.json();

    if (response.ok && data.status) {
      const isSuccessful = data.data.status === 'success';
      
      // Update transaction status
      await this.updateTransactionStatus(reference, isSuccessful ? 'completed' : 'failed');

      return {
        success: isSuccessful,
        data: data.data,
      };
    }

    throw new Error(data.message || 'Paystack verification failed');
  }

  /**
   * Verify Stripe payment
   */
  private async verifyStripePayment(reference: string): Promise<GatewayResponse> {
    const response = await fetch(`/api/stripe/verify-payment/${reference}`, {
      method: 'GET',
    });

    const data = await response.json();

    if (response.ok) {
      const isSuccessful = data.status === 'succeeded';
      
      // Update transaction status
      await this.updateTransactionStatus(reference, isSuccessful ? 'completed' : 'failed');

      return {
        success: isSuccessful,
        data: data,
      };
    }

    throw new Error(data.error || 'Stripe verification failed');
  }

  /**
   * Verify PayPal payment
   */
  private async verifyPayPalPayment(reference: string): Promise<GatewayResponse> {
    const response = await fetch(`/api/paypal/verify-payment/${reference}`, {
      method: 'GET',
    });

    const data = await response.json();

    if (response.ok) {
      const isSuccessful = data.status === 'COMPLETED';
      
      // Update transaction status
      await this.updateTransactionStatus(reference, isSuccessful ? 'completed' : 'failed');

      return {
        success: isSuccessful,
        data: data,
      };
    }

    throw new Error(data.error || 'PayPal verification failed');
  }

  /**
   * Store transaction in database
   */
  private async storeTransaction(transaction: Partial<PaymentTransaction & { gatewayReference?: string }>): Promise<void> {
    const { error } = await supabase
      .from('transactions')
      .insert([
        {
          user_id: transaction.metadata?.userId,
          type: 'payment',
          amount: transaction.amount,
          description: `Payment via ${transaction.gateway}`,
          reference: transaction.reference,
          // Fix: Use appropriate field based on gateway
          paystack_reference: transaction.gateway === 'paystack' ? transaction.gatewayReference : null,
          stripe_reference: transaction.gateway === 'stripe' ? transaction.gatewayReference : null,
          status: transaction.status,
          metadata: {
            gateway: transaction.gateway,
            currency: transaction.currency,
            ...transaction.metadata,
          },
        },
      ]);
  
    if (error) {
      console.error('❌ Failed to store transaction:', error);
      throw new Error('Failed to store transaction');
    }
  }

  /**
   * Update transaction status
   */
  private async updateTransactionStatus(reference: string, status: PaymentStatus): Promise<void> {
    const { error } = await supabase
      .from('transactions')
      .update({ status })
      .eq('reference', reference);

    if (error) {
      console.error('❌ Failed to update transaction status:', error);
    }
  }

  /**
   * Get payment history for user
   */
  async getPaymentHistory(userId: string, limit = 50): Promise<PaymentTransaction[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .eq('type', 'payment')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('❌ Failed to fetch payment history:', error);
      return [];
    }

    return data?.map(transaction => ({
      id: transaction.id,
      gateway: transaction.metadata?.gateway || 'paystack',
      amount: transaction.amount,
      currency: transaction.metadata?.currency || 'USD',
      status: transaction.status,
      reference: transaction.reference,
      gatewayReference: transaction.paystack_reference,
      metadata: transaction.metadata,
      createdAt: new Date(transaction.created_at),
      updatedAt: new Date(transaction.updated_at || transaction.created_at),
    })) || [];
  }

  /**
   * Get recommended payment gateway based on user location and preferences
   */
  getRecommendedGateway(currency: string, country?: string, amount?: number): PaymentGateway {
    // For African countries, prefer Paystack
    if (['NGN', 'GHS', 'KES', 'ZAR'].includes(currency)) {
      return 'paystack';
    }

    // For USD and large amounts, prefer Stripe
    if (currency === 'USD' && amount && amount > 100) {
      return 'stripe';
    }

    // Default to Stripe for international payments
    return 'stripe';
  }
}

export const paymentGatewayService = new PaymentGatewayService();
export default paymentGatewayService;
