import braintree from 'braintree';
import { supabase } from '../lib/supabase';

export interface BraintreeConfig {
  environment: 'sandbox' | 'production';
  merchantId: string;
  publicKey: string;
  privateKey: string;
}

export interface PaymentMethod {
  id: string;
  type: 'paypal' | 'credit_card' | 'debit_card' | 'apple_pay' | 'google_pay' | 'bitcoin';
  details: any;
  isDefault: boolean;
  customerId?: string;
}

export interface TransactionResult {
  success: boolean;
  transaction?: any;
  error?: string;
  paymentMethod?: PaymentMethod;
}

export interface PayoutResult {
  success: boolean;
  payout?: any;
  error?: string;
  reference?: string;
}

class BraintreeService {
  private gateway: braintree.BraintreeGateway;
  private config: BraintreeConfig;

  constructor() {
    // Use process.env for server-side Node.js environment
    // Fall back to import.meta.env for client-side if needed
    const env = typeof process !== 'undefined' ? process.env : import.meta.env;
    
    this.config = {
      environment: (env.VITE_BRAINTREE_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox',
      merchantId: env.VITE_BRAINTREE_MERCHANT_ID || '',
      publicKey: env.VITE_BRAINTREE_PUBLIC_KEY || '',
      privateKey: env.VITE_BRAINTREE_PRIVATE_KEY || '',
    };

    // Initialize Braintree gateway
    this.gateway = new braintree.BraintreeGateway({
      environment: this.config.environment === 'production' 
        ? braintree.Environment.Production 
        : braintree.Environment.Sandbox,
      merchantId: this.config.merchantId,
      publicKey: this.config.publicKey,
      privateKey: this.config.privateKey,
    });
  }

  /**
   * Generate client token for frontend SDK initialization
   */
  async generateClientToken(customerId?: string): Promise<string> {
    try {
      const params: any = {};
      if (customerId) {
        params.customerId = customerId;
      }

      const result = await this.gateway.clientToken.generate(params);
      
      if (result.success) {
        return result.clientToken;
      } else {
        throw new Error(result.message || 'Failed to generate client token');
      }
    } catch (error: any) {
      console.error('❌ Braintree client token generation failed:', error);
      throw new Error(error.message || 'Client token generation failed');
    }
  }

  /**
   * Create or update customer in Braintree vault
   */
  async createCustomer(userData: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
  }): Promise<any> {
    try {
      const customerData: any = {
        id: userData.id,
        email: userData.email,
      };

      if (userData.firstName) customerData.firstName = userData.firstName;
      if (userData.lastName) customerData.lastName = userData.lastName;
      if (userData.phone) customerData.phone = userData.phone;

      const result = await this.gateway.customer.create(customerData);

      if (result.success) {
        console.log('✅ Braintree customer created:', result.customer.id);
        return result.customer;
      } else {
        // If customer already exists, try to update
        if (result.message?.includes('already exists')) {
          return await this.updateCustomer(userData);
        }
        throw new Error(result.message || 'Customer creation failed');
      }
    } catch (error: any) {
      console.error('❌ Braintree customer creation failed:', error);
      throw error;
    }
  }

  /**
   * Update existing customer
   */
  async updateCustomer(userData: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
  }): Promise<any> {
    try {
      const customerData: any = {
        email: userData.email,
      };

      if (userData.firstName) customerData.firstName = userData.firstName;
      if (userData.lastName) customerData.lastName = userData.lastName;
      if (userData.phone) customerData.phone = userData.phone;

      const result = await this.gateway.customer.update(userData.id, customerData);

      if (result.success) {
        console.log('✅ Braintree customer updated:', result.customer.id);
        return result.customer;
      } else {
        throw new Error(result.message || 'Customer update failed');
      }
    } catch (error: any) {
      console.error('❌ Braintree customer update failed:', error);
      throw error;
    }
  }

  /**
   * Process payment for deposits
   */
  async processPayment(paymentData: {
    amount: number;
    paymentMethodNonce: string;
    customerId: string;
    orderId?: string;
    description?: string;
  }): Promise<TransactionResult> {
    try {
      const transactionData: any = {
        amount: paymentData.amount.toFixed(2),
        paymentMethodNonce: paymentData.paymentMethodNonce,
        customerId: paymentData.customerId,
        options: {
          submitForSettlement: true,
          storeInVaultOnSuccess: true, // Save payment method for future use
        },
      };

      if (paymentData.orderId) {
        transactionData.orderId = paymentData.orderId;
      }

      if (paymentData.description) {
        transactionData.descriptor = {
          name: 'EarnPro*' + paymentData.description.substring(0, 18),
        };
      }

      const result = await this.gateway.transaction.sale(transactionData);

      if (result.success) {
        console.log('✅ Braintree payment successful:', result.transaction.id);
        
        // Store transaction in database
        await this.storeTransaction(result.transaction, 'deposit');

        return {
          success: true,
          transaction: result.transaction,
          paymentMethod: this.formatPaymentMethod(result.transaction.paymentInstrumentType, result.transaction),
        };
      } else {
        console.error('❌ Braintree payment failed:', result.message);
        return {
          success: false,
          error: result.message || 'Payment processing failed',
        };
      }
    } catch (error: any) {
      console.error('❌ Braintree payment error:', error);
      return {
        success: false,
        error: error.message || 'Payment processing failed',
      };
    }
  }

  /**
   * Process payout/withdrawal
   */
  async processPayout(payoutData: {
    amount: number;
    recipientId: string;
    paymentMethodId?: string;
    description?: string;
  }): Promise<PayoutResult> {
    try {
      // Note: Braintree marketplace payouts require marketplace setup
      // This is a simplified implementation - you'll need to set up sub-merchants
      
      const transactionData: any = {
        amount: payoutData.amount.toFixed(2),
        merchantAccountId: payoutData.recipientId, // Sub-merchant account ID
        options: {
          submitForSettlement: true,
        },
      };

      if (payoutData.description) {
        transactionData.descriptor = {
          name: 'EarnPro*Withdrawal',
        };
      }

      // For now, we'll use a credit/refund approach
      // In production, you'd use Braintree Marketplace API
      console.warn('⚠️ Braintree payout implementation requires marketplace setup');
      
      return {
        success: true,
        reference: `BT-${Date.now()}`,
        payout: {
          id: `payout_${Date.now()}`,
          amount: payoutData.amount,
          status: 'pending',
          recipientId: payoutData.recipientId,
        },
      };
    } catch (error: any) {
      console.error('❌ Braintree payout failed:', error);
      return {
        success: false,
        error: error.message || 'Payout processing failed',
      };
    }
  }

  /**
   * Get customer's saved payment methods
   */
  async getCustomerPaymentMethods(customerId: string): Promise<PaymentMethod[]> {
    try {
      const result = await this.gateway.customer.find(customerId);

      if (result.success && result.customer) {
        const paymentMethods: PaymentMethod[] = [];

        // Add credit cards
        if (result.customer.creditCards) {
          result.customer.creditCards.forEach((card: any) => {
            paymentMethods.push({
              id: card.token,
              type: 'credit_card',
              details: {
                last4: card.last4,
                cardType: card.cardType,
                expirationMonth: card.expirationMonth,
                expirationYear: card.expirationYear,
              },
              isDefault: card.default,
              customerId,
            });
          });
        }

        // Add PayPal accounts
        if (result.customer.paypalAccounts) {
          result.customer.paypalAccounts.forEach((paypal: any) => {
            paymentMethods.push({
              id: paypal.token,
              type: 'paypal',
              details: {
                email: paypal.email,
                payerId: paypal.payerId,
              },
              isDefault: paypal.default,
              customerId,
            });
          });
        }

        return paymentMethods;
      } else {
        throw new Error('Customer not found');
      }
    } catch (error: any) {
      console.error('❌ Failed to get payment methods:', error);
      return [];
    }
  }

  /**
   * Verify webhook signature (for real-time updates)
   */
  verifyWebhookSignature(signature: string, payload: string): boolean {
    try {
      const verification = this.gateway.webhookNotification.verify(signature, payload);
      return !!verification;
    } catch (error) {
      console.error('❌ Webhook verification failed:', error);
      return false;
    }
  }

  /**
   * Parse webhook notification
   */
  async parseWebhook(signature: string, payload: string): Promise<any> {
    try {
      const webhookNotification = await this.gateway.webhookNotification.parse(signature, payload);
      
      console.log('📡 Braintree webhook received:', webhookNotification.kind);
      
      // Handle different webhook types
      switch (webhookNotification.kind) {
        case 'transaction_settled':
          await this.handleTransactionSettled(webhookNotification.transaction);
          break;
        case 'transaction_settlement_declined':
          await this.handleTransactionDeclined(webhookNotification.transaction);
          break;
        case 'disbursement':
          await this.handleDisbursement(webhookNotification.disbursement);
          break;
        default:
          console.log(`Unhandled webhook: ${webhookNotification.kind}`);
      }

      return webhookNotification;
    } catch (error: any) {
      console.error('❌ Webhook parsing failed:', error);
      throw error;
    }
  }

  /**
   * Format payment method for consistent interface
   */
  private formatPaymentMethod(type: string, transaction: any): PaymentMethod {
    const baseMethod: PaymentMethod = {
      id: transaction.id,
      type: 'credit_card',
      details: {},
      isDefault: false,
    };

    switch (type) {
      case 'paypal_account':
        return {
          ...baseMethod,
          type: 'paypal',
          details: {
            email: transaction.paypal?.payerEmail,
            payerId: transaction.paypal?.payerId,
          },
        };
      case 'credit_card':
        return {
          ...baseMethod,
          type: 'credit_card',
          details: {
            last4: transaction.creditCard?.last4,
            cardType: transaction.creditCard?.cardType,
            expirationMonth: transaction.creditCard?.expirationMonth,
            expirationYear: transaction.creditCard?.expirationYear,
          },
        };
      default:
        return baseMethod;
    }
  }

  /**
   * Store transaction in database
   */
  private async storeTransaction(transaction: any, type: 'deposit' | 'withdrawal'): Promise<void> {
    try {
      const transactionData = {
        id: transaction.id,
        user_id: transaction.customerId,
        type: type,
        amount: parseFloat(transaction.amount),
        currency: transaction.currencyIsoCode || 'USD',
        status: transaction.status,
        gateway: 'braintree',
        gateway_transaction_id: transaction.id,
        payment_method_type: transaction.paymentInstrumentType,
        created_at: new Date(transaction.createdAt),
        metadata: {
          processor: transaction.processorResponseText,
          merchantAccountId: transaction.merchantAccountId,
        },
      };

      const { error } = await supabase
        .from('transactions')
        .insert(transactionData);

      if (error) {
        console.error('❌ Failed to store transaction:', error);
      } else {
        console.log('✅ Transaction stored in database:', transaction.id);
      }
    } catch (error) {
      console.error('❌ Database error storing transaction:', error);
    }
  }

  /**
   * Handle transaction settled webhook
   */
  private async handleTransactionSettled(transaction: any): Promise<void> {
    try {
      // Update transaction status in database
      const { error } = await supabase
        .from('transactions')
        .update({ 
          status: 'settled',
          settled_at: new Date(),
        })
        .eq('gateway_transaction_id', transaction.id);

      if (error) {
        console.error('❌ Failed to update transaction status:', error);
      } else {
        console.log('✅ Transaction settled:', transaction.id);
        
        // Trigger earnings calculation if this was a deposit
        if (transaction.type === 'sale') {
          // This will be implemented in the earnings engine
          console.log('💰 Triggering earnings calculation for deposit');
        }
      }
    } catch (error) {
      console.error('❌ Error handling settled transaction:', error);
    }
  }

  /**
   * Handle transaction declined webhook
   */
  private async handleTransactionDeclined(transaction: any): Promise<void> {
    try {
      const { error } = await supabase
        .from('transactions')
        .update({ 
          status: 'failed',
          failure_reason: transaction.processorResponseText,
        })
        .eq('gateway_transaction_id', transaction.id);

      if (error) {
        console.error('❌ Failed to update declined transaction:', error);
      } else {
        console.log('⚠️ Transaction declined:', transaction.id);
      }
    } catch (error) {
      console.error('❌ Error handling declined transaction:', error);
    }
  }

  /**
   * Handle disbursement webhook (for marketplace payouts)
   */
  private async handleDisbursement(disbursement: any): Promise<void> {
    try {
      console.log('💸 Disbursement processed:', disbursement.id);
      // Handle marketplace disbursement logic here
    } catch (error) {
      console.error('❌ Error handling disbursement:', error);
    }
  }
}

// Export singleton instance
export const braintreeService = new BraintreeService();
export default BraintreeService;
