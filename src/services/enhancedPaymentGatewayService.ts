import { braintreeService } from './braintreeService';
import { earningsEngine } from './earningsEngine';
import { supabase } from '../lib/supabase';

export interface PaymentGatewayConfig {
  primary: 'stripe' | 'paystack' | 'braintree';
  fallback: ('stripe' | 'paystack' | 'braintree')[];
  regional: {
    [country: string]: 'stripe' | 'paystack' | 'braintree';
  };
}

export interface PaymentRequest {
  amount: number;
  currency: string;
  userId: string;
  description?: string;
  metadata?: any;
  preferredGateway?: string;
  userCountry?: string;
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  gateway?: string;
  paymentMethod?: any;
  error?: string;
  requiresAction?: boolean;
  actionUrl?: string;
}

export interface PayoutRequest {
  amount: number;
  currency: string;
  userId: string;
  recipientDetails: any;
  paymentMethod: string;
  description?: string;
}

export interface PayoutResult {
  success: boolean;
  payoutId?: string;
  gateway?: string;
  reference?: string;
  error?: string;
  estimatedArrival?: string;
}

class EnhancedPaymentGatewayService {
  private config: PaymentGatewayConfig;

  constructor() {
    this.config = {
      primary: 'braintree', // Braintree as primary with embedded PayPal
      fallback: ['stripe', 'paystack'],
      regional: {
        'NG': 'paystack', // Nigeria
        'GH': 'paystack', // Ghana
        'KE': 'paystack', // Kenya
        'ZA': 'paystack', // South Africa
        'US': 'braintree', // United States
        'GB': 'braintree', // United Kingdom
        'CA': 'braintree', // Canada
        'AU': 'braintree', // Australia
        'DE': 'stripe',    // Germany
        'FR': 'stripe',    // France
        'IT': 'stripe',    // Italy
        'ES': 'stripe',    // Spain
        'NL': 'stripe',    // Netherlands
      },
    };
  }

  /**
   * Process deposit payment with optimal gateway selection
   */
  async processDeposit(paymentRequest: PaymentRequest): Promise<PaymentResult> {
    try {
      console.log(`💳 Processing deposit: $${paymentRequest.amount} for user ${paymentRequest.userId}`);

      // Select optimal gateway
      const gateway = this.selectOptimalGateway(paymentRequest);
      console.log(`🎯 Selected gateway: ${gateway}`);

      let result: PaymentResult;

      // Process payment based on selected gateway
      switch (gateway) {
        case 'braintree':
          result = await this.processBraintreeDeposit(paymentRequest);
          break;
        case 'stripe':
          result = await this.processStripeDeposit(paymentRequest);
          break;
        case 'paystack':
          result = await this.processPaystackDeposit(paymentRequest);
          break;
        default:
          throw new Error(`Unsupported gateway: ${gateway}`);
      }

      // If payment successful, process referral commission
      if (result.success && result.transactionId) {
        await this.processDepositCommissions(paymentRequest.userId, paymentRequest.amount);
      }

      return result;
    } catch (error: any) {
      console.error('❌ Deposit processing failed:', error);
      return {
        success: false,
        error: error.message || 'Payment processing failed',
      };
    }
  }

  /**
   * Process withdrawal payout with optimal gateway selection
   */
  async processWithdrawal(payoutRequest: PayoutRequest): Promise<PayoutResult> {
    try {
      console.log(`💸 Processing withdrawal: $${payoutRequest.amount} for user ${payoutRequest.userId}`);

      // Check withdrawal eligibility
      const eligibility = await earningsEngine.checkWithdrawalEligibility(
        payoutRequest.userId,
        payoutRequest.amount
      );

      if (!eligibility.eligible) {
        return {
          success: false,
          error: eligibility.reason || 'Withdrawal not eligible',
        };
      }

      // Select gateway for payout (Braintree or Paystack preferred)
      const gateway = this.selectPayoutGateway(payoutRequest);
      console.log(`🎯 Selected payout gateway: ${gateway}`);

      // Create withdrawal request in earnings engine
      const withdrawalResult = await earningsEngine.processWithdrawal(
        payoutRequest.userId,
        payoutRequest.amount,
        payoutRequest.paymentMethod,
        payoutRequest.recipientDetails
      );

      if (!withdrawalResult.success) {
        return {
          success: false,
          error: withdrawalResult.error || 'Withdrawal request failed',
        };
      }

      let result: PayoutResult;

      // Process payout based on selected gateway
      switch (gateway) {
        case 'braintree':
          result = await this.processBraintreePayout(payoutRequest);
          break;
        case 'paystack':
          result = await this.processPaystackPayout(payoutRequest);
          break;
        default:
          throw new Error(`Payout not supported for gateway: ${gateway}`);
      }

      // Update withdrawal request status
      if (result.success) {
        await this.updateWithdrawalStatus(withdrawalResult.withdrawalId!, 'processing', result.reference);
      } else {
        await this.updateWithdrawalStatus(withdrawalResult.withdrawalId!, 'failed', undefined, result.error);
      }

      return result;
    } catch (error: any) {
      console.error('❌ Withdrawal processing failed:', error);
      return {
        success: false,
        error: error.message || 'Withdrawal processing failed',
      };
    }
  }

  /**
   * Select optimal gateway for deposit based on user location and preferences
   */
  private selectOptimalGateway(paymentRequest: PaymentRequest): string {
    // Check user preference
    if (paymentRequest.preferredGateway) {
      return paymentRequest.preferredGateway;
    }

    // Check regional optimization
    if (paymentRequest.userCountry && this.config.regional[paymentRequest.userCountry]) {
      return this.config.regional[paymentRequest.userCountry];
    }

    // Use primary gateway
    return this.config.primary;
  }

  /**
   * Select optimal gateway for payout
   */
  private selectPayoutGateway(payoutRequest: PayoutRequest): string {
    // For PayPal, use Braintree (embedded PayPal)
    if (payoutRequest.paymentMethod === 'paypal') {
      return 'braintree';
    }

    // For African mobile money, use Paystack
    if (payoutRequest.paymentMethod.includes('mobile_money')) {
      return 'paystack';
    }

    // For bank transfers in supported regions
    if (payoutRequest.paymentMethod === 'bank_transfer') {
      // Check if user is in Africa (Paystack regions)
      const africanCountries = ['NG', 'GH', 'KE', 'ZA'];
      // This would need user country info - for now default to Braintree
      return 'braintree';
    }

    // Default to Braintree for most payouts
    return 'braintree';
  }

  /**
   * Process Braintree deposit
   */
  private async processBraintreeDeposit(paymentRequest: PaymentRequest): Promise<PaymentResult> {
    try {
      // This would typically receive a payment nonce from the frontend
      // For now, this is a placeholder implementation
      console.log('🔄 Processing Braintree deposit (placeholder)');
      
      return {
        success: true,
        transactionId: `bt_${Date.now()}`,
        gateway: 'braintree',
        paymentMethod: { type: 'braintree', last4: '****' },
      };
    } catch (error: any) {
      console.error('❌ Braintree deposit failed:', error);
      return {
        success: false,
        error: error.message || 'Braintree payment failed',
      };
    }
  }

  /**
   * Process Stripe deposit
   */
  private async processStripeDeposit(paymentRequest: PaymentRequest): Promise<PaymentResult> {
    try {
      // Placeholder for Stripe integration
      console.log('🔄 Processing Stripe deposit (placeholder)');
      
      return {
        success: true,
        transactionId: `pi_${Date.now()}`,
        gateway: 'stripe',
        paymentMethod: { type: 'stripe', last4: '****' },
      };
    } catch (error: any) {
      console.error('❌ Stripe deposit failed:', error);
      return {
        success: false,
        error: error.message || 'Stripe payment failed',
      };
    }
  }

  /**
   * Process Paystack deposit
   */
  private async processPaystackDeposit(paymentRequest: PaymentRequest): Promise<PaymentResult> {
    try {
      // Placeholder for Paystack integration
      console.log('🔄 Processing Paystack deposit (placeholder)');
      
      return {
        success: true,
        transactionId: `ps_${Date.now()}`,
        gateway: 'paystack',
        paymentMethod: { type: 'paystack', last4: '****' },
      };
    } catch (error: any) {
      console.error('❌ Paystack deposit failed:', error);
      return {
        success: false,
        error: error.message || 'Paystack payment failed',
      };
    }
  }

  /**
   * Process Braintree payout
   */
  private async processBraintreePayout(payoutRequest: PayoutRequest): Promise<PayoutResult> {
    try {
      const result = await braintreeService.processPayout({
        amount: payoutRequest.amount,
        recipientId: payoutRequest.userId,
        description: payoutRequest.description,
      });

      if (result.success) {
        return {
          success: true,
          payoutId: result.payout?.id,
          gateway: 'braintree',
          reference: result.reference,
          estimatedArrival: this.getEstimatedArrival('braintree', payoutRequest.paymentMethod),
        };
      } else {
        return {
          success: false,
          error: result.error,
        };
      }
    } catch (error: any) {
      console.error('❌ Braintree payout failed:', error);
      return {
        success: false,
        error: error.message || 'Braintree payout failed',
      };
    }
  }

  /**
   * Process Paystack payout
   */
  private async processPaystackPayout(payoutRequest: PayoutRequest): Promise<PayoutResult> {
    try {
      // Placeholder for Paystack payout integration
      console.log('🔄 Processing Paystack payout (placeholder)');
      
      return {
        success: true,
        payoutId: `payout_${Date.now()}`,
        gateway: 'paystack',
        reference: `ref_${Date.now()}`,
        estimatedArrival: this.getEstimatedArrival('paystack', payoutRequest.paymentMethod),
      };
    } catch (error: any) {
      console.error('❌ Paystack payout failed:', error);
      return {
        success: false,
        error: error.message || 'Paystack payout failed',
      };
    }
  }

  /**
   * Process referral commissions after successful deposit
   */
  private async processDepositCommissions(userId: string, depositAmount: number): Promise<void> {
    try {
      // Get user's referrer
      const { data: userProfile, error } = await supabase
        .from('user_profiles')
        .select('referred_by')
        .eq('user_id', userId)
        .single();

      if (error || !userProfile?.referred_by) {
        console.log('ℹ️ No referrer found for user, skipping commission');
        return;
      }

      // Process referral commission
      await earningsEngine.processReferralCommission(
        userProfile.referred_by,
        depositAmount,
        userId
      );

      console.log('✅ Referral commission processed');
    } catch (error: any) {
      console.error('❌ Error processing referral commission:', error);
    }
  }

  /**
   * Update withdrawal request status
   */
  private async updateWithdrawalStatus(
    withdrawalId: string,
    status: string,
    reference?: string,
    failureReason?: string
  ): Promise<void> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (reference) {
        updateData.gateway_transaction_id = reference;
      }

      if (failureReason) {
        updateData.failure_reason = failureReason;
      }

      if (status === 'processing' || status === 'completed') {
        updateData.processed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('withdrawal_requests')
        .update(updateData)
        .eq('id', withdrawalId);

      if (error) {
        console.error('❌ Failed to update withdrawal status:', error);
      } else {
        console.log(`✅ Withdrawal ${withdrawalId} status updated to ${status}`);
      }
    } catch (error: any) {
      console.error('❌ Error updating withdrawal status:', error);
    }
  }

  /**
   * Get estimated arrival time for payout
   */
  private getEstimatedArrival(gateway: string, paymentMethod: string): string {
    const estimations = {
      braintree: {
        paypal: '1-3 business days',
        bank_transfer: '3-5 business days',
        crypto: '10-30 minutes',
      },
      paystack: {
        bank_transfer: '1-2 business days',
        mobile_money: '5-15 minutes',
      },
    };

    return estimations[gateway as keyof typeof estimations]?.[paymentMethod as keyof any] || '3-5 business days';
  }

  /**
   * Get supported payment methods by gateway
   */
  getSupportedPaymentMethods(gateway: string): string[] {
    const methods = {
      braintree: ['credit_card', 'paypal', 'apple_pay', 'google_pay', 'crypto'],
      stripe: ['credit_card', 'bank_transfer', 'apple_pay', 'google_pay'],
      paystack: ['credit_card', 'bank_transfer', 'mobile_money', 'ussd'],
    };

    return methods[gateway as keyof typeof methods] || [];
  }

  /**
   * Get supported payout methods by gateway
   */
  getSupportedPayoutMethods(gateway: string): string[] {
    const methods = {
      braintree: ['paypal', 'bank_transfer', 'crypto'],
      paystack: ['bank_transfer', 'mobile_money'],
    };

    return methods[gateway as keyof typeof methods] || [];
  }

  /**
   * Get gateway configuration
   */
  getConfig(): PaymentGatewayConfig {
    return { ...this.config };
  }

  /**
   * Update gateway configuration
   */
  updateConfig(newConfig: Partial<PaymentGatewayConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('✅ Payment gateway configuration updated');
  }
}

// Export singleton instance
export const enhancedPaymentGatewayService = new EnhancedPaymentGatewayService();
export default EnhancedPaymentGatewayService;
