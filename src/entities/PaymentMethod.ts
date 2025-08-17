
// src/entities/PaymentMethod.ts

export type PaymentMethodType = 'card' | 'bank_account' | 'crypto_wallet';

export interface PaymentMethod {
  id: string;
  userId: string;
  type: PaymentMethodType;
  isDefault: boolean;
  details: CardDetails | BankAccountDetails | CryptoWalletDetails;
  createdAt: Date;
  updatedAt: Date;
}

export interface CardDetails {
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  country: string;
}

export interface BankAccountDetails {
  bankName: string;
  accountNumberLast4: string;
  routingNumber: string;
}

export interface CryptoWalletDetails {
  walletAddress: string;
  network: string;
}

