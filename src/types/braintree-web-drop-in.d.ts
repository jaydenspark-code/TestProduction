declare module 'braintree-web-drop-in' {
  interface DropinOptions {
    authorization: string;
    container: HTMLElement | string;
    card?: {
      cardholderName?: {
        required?: boolean;
      };
    };
    paypal?: {
      flow: string;
      amount: string;
      currency: string;
    };
  }

  interface PaymentMethodPayload {
    nonce: string;
    type: string;
    details?: any;
  }

  interface DropinInstance {
    requestPaymentMethod(callback: (error: any, payload: PaymentMethodPayload) => void): void;
    teardown(callback?: () => void): void;
  }

  export function create(
    options: DropinOptions,
    callback: (error: any, instance: DropinInstance) => void
  ): void;
}
