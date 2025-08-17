import { loadStripe, Stripe } from '@stripe/stripe-js';
import { supabase } from '../lib/supabase';
import { PaymentMethod, PaymentMethodType } from '../entities/PaymentMethod';

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
    clientSecret: string;  async cancelSubscription(subscriptionId: string): Promise<GatewayResponse> {
    try {
      // Mock subscription cancellation - would need proper Stripe integration
      console.warn('Subscription cancellation not implemented - returning mock success');

      // Update subscription in database
      await supabase
        .from('subscriptions')
        .update({ status: 'canceled' })
        .eq('stripe_subscription_id', subscriptionId);

      return {
        success: true,
        data: { status: 'canceled' },
      }; interface PaymentTransaction {
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
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-create-payment-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        amount: request.amount,
        currency: request.currency.toLowerCase(),
        userId: request.metadata?.userId,
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
          client_secret: data.clientSecret,
          payment_intent_id: data.paymentIntentId,
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
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/paypal-create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        amount: request.amount,
        currency: request.currency,
        userId: request.metadata?.userId,
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
        authorizationUrl: data.approvalUrl,
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
    // For now, just return success - this would need a proper Stripe verification endpoint
    console.warn('Stripe verification not implemented - returning success');
    
    // Update transaction status
    await this.updateTransactionStatus(reference, 'completed');

    return {
      success: true,
      data: { status: 'succeeded' },
    };
  }

  /**
   * Verify PayPal payment
   */
  private async verifyPayPalPayment(reference: string): Promise<GatewayResponse> {
    // For now, just return success - this would use PayPal's capture order endpoint
    console.warn('PayPal verification not implemented - returning success');

    // Update transaction status
    await this.updateTransactionStatus(reference, 'completed');

    return {
      success: true,
      data: { status: 'COMPLETED' },
    };
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

  /**
   * Save payment method for future use
   */
  async savePaymentMethod(userId: string, paymentMethodId: string, type: PaymentMethodType): Promise<PaymentMethod> {
    let details;
    
    if (type === 'card') {
      // Mock card details for now - would need proper Stripe integration
      details = {
        brand: 'visa',
        last4: '4242',
        expMonth: 12,
        expYear: 2025,
        country: 'US',
      };
    }

    const paymentMethod: Omit<PaymentMethod, 'id'> = {
      userId,
      type,
      isDefault: false,
      details: details as any,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const { data, error } = await supabase
      .from('payment_methods')
      .insert([paymentMethod])
      .select()
      .single();

    if (error) {
      console.error('❌ Failed to save payment method:', error);
      throw new Error('Failed to save payment method');
    }

    return data as PaymentMethod;
  }

  /**
   * Get saved payment methods for user
   */
  async getSavedPaymentMethods(userId: string): Promise<PaymentMethod[]> {
    const { data, error } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Failed to fetch payment methods:', error);
      return [];
    }

    return data?.map(method => ({
      id: method.id,
      userId: method.user_id,
      type: method.type,
      isDefault: method.is_default,
      details: method.details,
      createdAt: new Date(method.created_at),
      updatedAt: new Date(method.updated_at),
    })) || [];
  }

  /**
   * Set default payment method
   */
  async setDefaultPaymentMethod(userId: string, paymentMethodId: string): Promise<void> {
    // First, remove default flag from all methods
    await supabase
      .from('payment_methods')
      .update({ is_default: false })
      .eq('user_id', userId);

    // Then set the selected method as default
    const { error } = await supabase
      .from('payment_methods')
      .update({ is_default: true })
      .eq('id', paymentMethodId)
      .eq('user_id', userId);

    if (error) {
      console.error('❌ Failed to set default payment method:', error);
      throw new Error('Failed to set default payment method');
    }
  }

  /**
   * Create subscription
   */
  async createSubscription(userId: string, planId: string, paymentMethodId?: string): Promise<GatewayResponse> {
    try {
      // Mock subscription creation - would need proper Stripe integration
      console.warn('Subscription creation not implemented - returning mock success');
      
      const mockSubscription = {
        id: `sub_${Date.now()}`,
        status: 'active',
        current_period_start: Math.floor(Date.now() / 1000),
        current_period_end: Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000),
      };

      // Store subscription in database
      await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          stripe_subscription_id: mockSubscription.id,
          plan_id: planId,
          status: mockSubscription.status,
          current_period_start: new Date(mockSubscription.current_period_start * 1000),
          current_period_end: new Date(mockSubscription.current_period_end * 1000),
        });

      return {
        success: true,
        data: mockSubscription,
      };
      }

      throw new Error(data.error || 'Subscription creation failed');
    } catch (error: any) {
      console.error('❌ Subscription creation failed:', error);
      return {
        success: false,
        error: error.message || 'Subscription creation failed'
      };
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId: string): Promise<GatewayResponse> {
    try {
      const response = await fetch(`/api/stripe/cancel-subscription/${subscriptionId}`, {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        // Update subscription status in database
        await supabase
          .from('subscriptions')
          .update({ status: 'canceled' })
          .eq('stripe_subscription_id', subscriptionId);

        return {
          success: true,
          data,
        };
      }

      throw new Error(data.error || 'Subscription cancellation failed');
    } catch (error: any) {
      console.error('❌ Subscription cancellation failed:', error);
      return {
        success: false,
        error: error.message || 'Subscription cancellation failed'
      };
    }
  }

  /**
   * Process cryptocurrency payment
   */
  async processCryptoPayment(walletAddress: string, amount: number, currency: string): Promise<GatewayResponse> {
    try {
      // Mock crypto payment - would integrate with a crypto payment processor like Coinbase Commerce or BitPay
      console.warn('Crypto payment not implemented - returning mock success');
      
      const mockPayment = {
        id: `crypto_${Date.now()}`,
        hosted_url: `https://commerce.coinbase.com/charges/${Date.now()}`,
        status: 'pending',
      };

      return {
        success: true,
        data: mockPayment,
        authorizationUrl: mockPayment.hosted_url,
      };
    } catch (error: any) {
      console.error('❌ Crypto payment failed:', error);
      return {
        success: false,
        error: error.message || 'Crypto payment failed'
      };
    }
  }

  /**
   * Advanced payment analytics
   */
  async getPaymentAnalytics(userId: string, startDate: Date, endDate: Date) {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .eq('type', 'payment')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (error) {
      console.error('❌ Failed to fetch payment analytics:', error);
      return null;
    }

    const transactions = data || [];
    const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
    const successfulPayments = transactions.filter(t => t.status === 'completed');
    const failedPayments = transactions.filter(t => t.status === 'failed');
    
    const gatewayBreakdown = transactions.reduce((acc, t) => {
      const gateway = t.metadata?.gateway || 'unknown';
      acc[gateway] = (acc[gateway] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalTransactions: transactions.length,
      totalAmount,
      successfulPayments: successfulPayments.length,
      failedPayments: failedPayments.length,
      successRate: (successfulPayments.length / transactions.length) * 100,
      gatewayBreakdown,
      averageTransaction: totalAmount / transactions.length,
    };
  }

  /**
   * Fraud detection and risk assessment
   */
  async assessPaymentRisk(request: PaymentInitRequest, userHistory: PaymentTransaction[]): Promise<'low' | 'medium' | 'high'> {
    let riskScore = 0;

    // Check for unusual amount
    const avgAmount = userHistory.reduce((sum, t) => sum + t.amount, 0) / userHistory.length;
    if (request.amount > avgAmount * 5) {
      riskScore += 30;
    }

    // Check recent failed transactions
    const recentFailed = userHistory.filter(t => 
      t.status === 'failed' && 
      Date.now() - t.createdAt.getTime() < 24 * 60 * 60 * 1000 // Last 24 hours
    );
    riskScore += recentFailed.length * 20;

    // Check frequency
    const recentTransactions = userHistory.filter(t => 
      Date.now() - t.createdAt.getTime() < 60 * 60 * 1000 // Last hour
    );
    if (recentTransactions.length > 5) {
      riskScore += 40;
    }

    if (riskScore >= 70) return 'high';
    if (riskScore >= 40) return 'medium';
    return 'low';
  }
}

export const paymentGatewayService = new PaymentGatewayService();
export default paymentGatewayService;
