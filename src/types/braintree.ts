/**
 * Braintree TypeScript Interfaces
 */

export interface BraintreeConfig {
  environment: 'sandbox' | 'production';
  merchantId: string;
  publicKey: string;
  privateKey: string;
}

export interface BraintreeClientConfig {
  authorization: string;
  enablePayPal?: boolean;
  enableApplePay?: boolean;
  enableGooglePay?: boolean;
  enable3DSecure?: boolean;
}

export interface PaymentResult {
  success: boolean;
  nonce?: string;
  paymentMethod?: any;
  error?: string;
}

export interface CustomerData {
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

export interface PaymentMethodNonce {
  nonce: string;
  type: string;
  details: any;
}

export interface TransactionResult {
  success: boolean;
  transaction?: any;
  error?: string;
}

export interface TestCard {
  number: string;
  type: string;
  description: string;
  expectedResult: 'success' | 'decline' | 'error';
}
