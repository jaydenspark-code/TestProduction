import { Client, PayPalCheckout, HostedFields, ThreeDSecure, ApplePay, GooglePay } from 'braintree-web';

export interface BraintreeClientConfig {
  authorization: string;
  locale?: string;
  enablePayPal?: boolean;
  enableApplePay?: boolean;
  enableGooglePay?: boolean;
  enable3DSecure?: boolean;
}

export interface PaymentOptions {
  amount: number;
  currency?: string;
  description?: string;
  orderId?: string;
}

export interface PaymentResult {
  success: boolean;
  nonce?: string;
  paymentMethod?: any;
  error?: string;
}

class BraintreeClientService {
  private client: Client | null = null;
  private paypalCheckout: PayPalCheckout | null = null;
  private hostedFields: HostedFields | null = null;
  private threeDSecure: ThreeDSecure | null = null;
  private applePay: ApplePay | null = null;
  private googlePay: GooglePay | null = null;
  private isInitialized = false;

  /**
   * Initialize Braintree client with authorization token
   */
  async initialize(config: BraintreeClientConfig): Promise<boolean> {
    try {
      // Create Braintree client
      this.client = await Client.create({
        authorization: config.authorization,
      });

      console.log('✅ Braintree client initialized');

      // Initialize PayPal if enabled
      if (config.enablePayPal) {
        await this.initializePayPal();
      }

      // Initialize Apple Pay if enabled and supported
      if (config.enableApplePay && this.isApplePaySupported()) {
        await this.initializeApplePay();
      }

      // Initialize Google Pay if enabled and supported
      if (config.enableGooglePay && this.isGooglePaySupported()) {
        await this.initializeGooglePay();
      }

      // Initialize 3D Secure if enabled
      if (config.enable3DSecure) {
        await this.initialize3DSecure();
      }

      this.isInitialized = true;
      return true;
    } catch (error: any) {
      console.error('❌ Braintree client initialization failed:', error);
      return false;
    }
  }

  /**
   * Initialize PayPal checkout
   */
  private async initializePayPal(): Promise<void> {
    try {
      if (!this.client) throw new Error('Client not initialized');

      this.paypalCheckout = await PayPalCheckout.create({
        client: this.client,
      });

      console.log('✅ PayPal checkout initialized');
    } catch (error: any) {
      console.error('❌ PayPal initialization failed:', error);
      throw error;
    }
  }

  /**
   * Initialize hosted fields for credit card input
   */
  async initializeHostedFields(containerId: string): Promise<boolean> {
    try {
      if (!this.client) throw new Error('Client not initialized');

      this.hostedFields = await HostedFields.create({
        client: this.client,
        styles: {
          'input': {
            'font-size': '16px',
            'font-family': 'Inter, system-ui, sans-serif',
            'color': '#374151',
          },
          'input.invalid': {
            'color': '#EF4444',
          },
          'input.valid': {
            'color': '#10B981',
          },
        },
        fields: {
          number: {
            container: `#${containerId}-card-number`,
            placeholder: '1111 1111 1111 1111',
          },
          cvv: {
            container: `#${containerId}-cvv`,
            placeholder: '123',
          },
          expirationDate: {
            container: `#${containerId}-expiration`,
            placeholder: 'MM/YY',
          },
          postalCode: {
            container: `#${containerId}-postal-code`,
            placeholder: '12345',
          },
        },
      });

      console.log('✅ Hosted fields initialized');
      return true;
    } catch (error: any) {
      console.error('❌ Hosted fields initialization failed:', error);
      return false;
    }
  }

  /**
   * Initialize 3D Secure
   */
  private async initialize3DSecure(): Promise<void> {
    try {
      if (!this.client) throw new Error('Client not initialized');

      this.threeDSecure = await ThreeDSecure.create({
        client: this.client,
        version: 2,
      });

      console.log('✅ 3D Secure initialized');
    } catch (error: any) {
      console.error('❌ 3D Secure initialization failed:', error);
    }
  }

  /**
   * Initialize Apple Pay
   */
  private async initializeApplePay(): Promise<void> {
    try {
      if (!this.client) throw new Error('Client not initialized');

      this.applePay = await ApplePay.create({
        client: this.client,
      });

      console.log('✅ Apple Pay initialized');
    } catch (error: any) {
      console.error('❌ Apple Pay initialization failed:', error);
    }
  }

  /**
   * Initialize Google Pay
   */
  private async initializeGooglePay(): Promise<void> {
    try {
      if (!this.client) throw new Error('Client not initialized');

      this.googlePay = await GooglePay.create({
        client: this.client,
        googlePayVersion: 2,
        googleMerchantId: import.meta.env.VITE_GOOGLE_MERCHANT_ID,
      });

      console.log('✅ Google Pay initialized');
    } catch (error: any) {
      console.error('❌ Google Pay initialization failed:', error);
    }
  }

  /**
   * Process PayPal payment
   */
  async processPayPalPayment(options: PaymentOptions): Promise<PaymentResult> {
    try {
      if (!this.paypalCheckout) {
        throw new Error('PayPal not initialized');
      }

      const tokenizePayload = await this.paypalCheckout.tokenize({
        flow: 'checkout',
        amount: options.amount,
        currency: options.currency || 'USD',
        intent: 'sale',
        enableShippingAddress: false,
        userAction: 'commit',
      });

      console.log('✅ PayPal payment tokenized');

      return {
        success: true,
        nonce: tokenizePayload.nonce,
        paymentMethod: {
          type: 'paypal',
          details: tokenizePayload.details,
        },
      };
    } catch (error: any) {
      console.error('❌ PayPal payment failed:', error);
      return {
        success: false,
        error: error.message || 'PayPal payment failed',
      };
    }
  }

  /**
   * Process credit card payment with hosted fields
   */
  async processCreditCardPayment(options: PaymentOptions & { billingAddress?: any }): Promise<PaymentResult> {
    try {
      if (!this.hostedFields) {
        throw new Error('Hosted fields not initialized');
      }

      // Validate fields
      const state = await this.hostedFields.getState();
      const isValid = Object.keys(state.fields).every(field => 
        state.fields[field].isValid || !state.fields[field].isRequired
      );

      if (!isValid) {
        return {
          success: false,
          error: 'Please check your card details',
        };
      }

      // Tokenize the card
      const tokenizeOptions: any = {};
      
      if (options.billingAddress) {
        tokenizeOptions.billingAddress = options.billingAddress;
      }

      const tokenizePayload = await this.hostedFields.tokenize(tokenizeOptions);

      // Apply 3D Secure if available and required
      let finalNonce = tokenizePayload.nonce;
      
      if (this.threeDSecure && options.amount > 30) { // Apply 3DS for amounts > $30
        try {
          const threeDSResult = await this.threeDSecure.verifyCard({
            nonce: tokenizePayload.nonce,
            amount: options.amount,
            billingAddress: options.billingAddress,
          });

          if (threeDSResult.liabilityShifted || threeDSResult.liabilityShiftPossible) {
            finalNonce = threeDSResult.nonce;
            console.log('✅ 3D Secure verification completed');
          }
        } catch (threeDSError) {
          console.warn('⚠️ 3D Secure verification failed, proceeding without:', threeDSError);
        }
      }

      console.log('✅ Credit card payment tokenized');

      return {
        success: true,
        nonce: finalNonce,
        paymentMethod: {
          type: 'credit_card',
          details: tokenizePayload.details,
        },
      };
    } catch (error: any) {
      console.error('❌ Credit card payment failed:', error);
      return {
        success: false,
        error: error.message || 'Credit card payment failed',
      };
    }
  }

  /**
   * Process Apple Pay payment
   */
  async processApplePayPayment(options: PaymentOptions): Promise<PaymentResult> {
    try {
      if (!this.applePay) {
        throw new Error('Apple Pay not initialized');
      }

      const paymentRequest = {
        total: {
          label: 'EarnPro Deposit',
          amount: options.amount.toString(),
        },
        currencyCode: options.currency || 'USD',
        countryCode: 'US',
        supportedNetworks: ['visa', 'mastercard', 'amex', 'discover'],
        merchantCapabilities: ['supports3DS'],
      };

      const tokenizePayload = await this.applePay.tokenize(paymentRequest);

      console.log('✅ Apple Pay payment tokenized');

      return {
        success: true,
        nonce: tokenizePayload.nonce,
        paymentMethod: {
          type: 'apple_pay',
          details: tokenizePayload.details,
        },
      };
    } catch (error: any) {
      console.error('❌ Apple Pay payment failed:', error);
      return {
        success: false,
        error: error.message || 'Apple Pay payment failed',
      };
    }
  }

  /**
   * Process Google Pay payment
   */
  async processGooglePayPayment(options: PaymentOptions): Promise<PaymentResult> {
    try {
      if (!this.googlePay) {
        throw new Error('Google Pay not initialized');
      }

      const paymentDataRequest = {
        transactionInfo: {
          totalPriceStatus: 'FINAL',
          totalPrice: options.amount.toString(),
          currencyCode: options.currency || 'USD',
        },
        merchantInfo: {
          merchantId: import.meta.env.VITE_GOOGLE_MERCHANT_ID,
          merchantName: 'EarnPro',
        },
      };

      const tokenizePayload = await this.googlePay.tokenize(paymentDataRequest);

      console.log('✅ Google Pay payment tokenized');

      return {
        success: true,
        nonce: tokenizePayload.nonce,
        paymentMethod: {
          type: 'google_pay',
          details: tokenizePayload.details,
        },
      };
    } catch (error: any) {
      console.error('❌ Google Pay payment failed:', error);
      return {
        success: false,
        error: error.message || 'Google Pay payment failed',
      };
    }
  }

  /**
   * Check if Apple Pay is supported
   */
  isApplePaySupported(): boolean {
    return !!(window as any).ApplePaySession && !!(ApplePay as any).supportsApplePay;
  }

  /**
   * Check if Google Pay is supported
   */
  isGooglePaySupported(): boolean {
    return !!(window as any).google?.payments?.api?.PaymentsClient;
  }

  /**
   * Get available payment methods
   */
  getAvailablePaymentMethods(): string[] {
    const methods = ['credit_card', 'paypal'];
    
    if (this.isApplePaySupported()) {
      methods.push('apple_pay');
    }
    
    if (this.isGooglePaySupported()) {
      methods.push('google_pay');
    }
    
    return methods;
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    try {
      if (this.hostedFields) {
        await this.hostedFields.teardown();
        this.hostedFields = null;
      }

      if (this.paypalCheckout) {
        await this.paypalCheckout.teardown();
        this.paypalCheckout = null;
      }

      if (this.threeDSecure) {
        await this.threeDSecure.teardown();
        this.threeDSecure = null;
      }

      if (this.applePay) {
        await this.applePay.teardown();
        this.applePay = null;
      }

      if (this.googlePay) {
        await this.googlePay.teardown();
        this.googlePay = null;
      }

      this.client = null;
      this.isInitialized = false;

      console.log('✅ Braintree client cleaned up');
    } catch (error) {
      console.error('❌ Cleanup failed:', error);
    }
  }

  /**
   * Get current initialization status
   */
  isReady(): boolean {
    return this.isInitialized && this.client !== null;
  }
}

// Export singleton instance
export const braintreeClientService = new BraintreeClientService();
export default BraintreeClientService;
