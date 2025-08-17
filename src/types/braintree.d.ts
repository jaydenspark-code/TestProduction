// Additional TypeScript declarations for Braintree and browser APIs

declare global {
  interface Window {
    ApplePaySession?: any;
    google?: {
      payments?: {
        api?: {
          PaymentsClient: any;
        };
      };
    };
  }
}

// Extend Braintree types if needed
declare module 'braintree-web' {
  export interface ApplePay {
    supportsApplePay(): boolean;
  }
}

export {};
