type PaymentOptions = {
  supportedMethods: string[];
  supportedNetworks?: string[];
  merchantId?: string;
  merchantName?: string;
  requestPayerName?: boolean;
  requestPayerEmail?: boolean;
  requestPayerPhone?: boolean;
  requestShipping?: boolean;
  shippingType?: 'shipping' | 'delivery' | 'pickup';
};

type PaymentDetails = {
  total: PaymentItem;
  displayItems?: PaymentItem[];
  shippingOptions?: PaymentShippingOption[];
  modifiers?: PaymentDetailsModifier[];
};

type PaymentItem = {
  label: string;
  amount: PaymentCurrencyAmount;
  pending?: boolean;
};

type PaymentCurrencyAmount = {
  currency: string;
  value: string;
};

type PaymentShippingOption = {
  id: string;
  label: string;
  amount: PaymentCurrencyAmount;
  selected?: boolean;
};

type PaymentDetailsModifier = {
  supportedMethods: string[];
  total?: PaymentItem;
  additionalDisplayItems?: PaymentItem[];
  data?: any;
};

type PaymentState = {
  available: boolean;
  processing: boolean;
  lastResponse: PaymentResponse | null;
};

type PaymentCallback = (state: PaymentState) => void;

export class PaymentManager {
  private static instance: PaymentManager;
  private state: PaymentState;
  private options: Required<PaymentOptions>;
  private onStateChangeCallbacks: Set<PaymentCallback>;
  private onErrorCallbacks: Set<(error: Error) => void>;
  private onShippingAddressChangeCallbacks: Set<(event: PaymentRequestEvent) => void>;
  private onShippingOptionChangeCallbacks: Set<(event: PaymentRequestEvent) => void>;

  private constructor() {
    this.state = {
      available: false,
      processing: false,
      lastResponse: null
    };

    this.options = {
      supportedMethods: ['basic-card'],
      supportedNetworks: ['visa', 'mastercard', 'amex'],
      merchantId: '',
      merchantName: '',
      requestPayerName: false,
      requestPayerEmail: false,
      requestPayerPhone: false,
      requestShipping: false,
      shippingType: 'shipping'
    };

    this.onStateChangeCallbacks = new Set();
    this.onErrorCallbacks = new Set();
    this.onShippingAddressChangeCallbacks = new Set();
    this.onShippingOptionChangeCallbacks = new Set();

    this.checkAvailability();
  }

  static getInstance(): PaymentManager {
    if (!PaymentManager.instance) {
      PaymentManager.instance = new PaymentManager();
    }
    return PaymentManager.instance;
  }

  private updateState(newState: Partial<PaymentState>): void {
    this.state = { ...this.state, ...newState };
    this.notifyStateChange();
  }

  private notifyStateChange(): void {
    this.onStateChangeCallbacks.forEach(callback => callback(this.state));
  }

  private notifyError(error: Error): void {
    this.onErrorCallbacks.forEach(callback => callback(error));
  }

  private checkAvailability(): void {
    const available = this.isSupported();
    this.updateState({ available });
  }

  private createPaymentRequest(details: PaymentDetails): PaymentRequest {
    const methodData = this.options.supportedMethods.map(method => {
      const data: any = {};

      if (method === 'basic-card') {
        data.supportedNetworks = this.options.supportedNetworks;
      }

      return {
        supportedMethods: method,
        data
      };
    });

    const options: PaymentOptions = {
      ...this.options,
      requestShipping: details.shippingOptions ? true : this.options.requestShipping
    };

    return new PaymentRequest(methodData, details, options);
  }

  async requestPayment(details: PaymentDetails): Promise<PaymentResponse | null> {
    if (!this.isSupported()) {
      throw new Error('Payment Request API is not supported');
    }

    if (this.state.processing) {
      throw new Error('Payment is already in progress');
    }

    try {
      this.updateState({ processing: true });

      const request = this.createPaymentRequest(details);

      // Set up shipping address change handler
      if (this.options.requestShipping) {
        request.onshippingaddresschange = (event) => {
          this.onShippingAddressChangeCallbacks.forEach(callback => callback(event));
        };
      }

      // Set up shipping option change handler
      if (details.shippingOptions) {
        request.onshippingoptionchange = (event) => {
          this.onShippingOptionChangeCallbacks.forEach(callback => callback(event));
        };
      }

      // Show payment sheet
      const response = await request.show();

      // Store response
      this.updateState({
        processing: false,
        lastResponse: response
      });

      return response;
    } catch (error) {
      this.updateState({ processing: false });
      this.notifyError(error as Error);
      return null;
    }
  }

  async abortPayment(): Promise<void> {
    if (this.state.processing && this.state.lastResponse) {
      try {
        await this.state.lastResponse.retry();
        this.updateState({ processing: false, lastResponse: null });
      } catch (error) {
        this.notifyError(error as Error);
      }
    }
  }

  setOptions(options: Partial<PaymentOptions>): void {
    this.options = { ...this.options, ...options };
  }

  getOptions(): Required<PaymentOptions> {
    return { ...this.options };
  }

  isAvailable(): boolean {
    return this.state.available;
  }

  isProcessing(): boolean {
    return this.state.processing;
  }

  getLastResponse(): PaymentResponse | null {
    return this.state.lastResponse;
  }

  onStateChange(callback: PaymentCallback): () => void {
    this.onStateChangeCallbacks.add(callback);

    // Return cleanup function
    return () => {
      this.onStateChangeCallbacks.delete(callback);
    };
  }

  onError(callback: (error: Error) => void): () => void {
    this.onErrorCallbacks.add(callback);

    // Return cleanup function
    return () => {
      this.onErrorCallbacks.delete(callback);
    };
  }

  onShippingAddressChange(callback: (event: PaymentRequestEvent) => void): () => void {
    this.onShippingAddressChangeCallbacks.add(callback);

    // Return cleanup function
    return () => {
      this.onShippingAddressChangeCallbacks.delete(callback);
    };
  }

  onShippingOptionChange(callback: (event: PaymentRequestEvent) => void): () => void {
    this.onShippingOptionChangeCallbacks.add(callback);

    // Return cleanup function
    return () => {
      this.onShippingOptionChangeCallbacks.delete(callback);
    };
  }

  cleanup(): void {
    this.abortPayment();
    this.onStateChangeCallbacks.clear();
    this.onErrorCallbacks.clear();
    this.onShippingAddressChangeCallbacks.clear();
    this.onShippingOptionChangeCallbacks.clear();
  }

  static isSupported(): boolean {
    return typeof window !== 'undefined' && 'PaymentRequest' in window;
  }
}

// Example usage:
/*
const payment = PaymentManager.getInstance();

// Check if Payment Request API is supported
console.log('Payment Request supported:', PaymentManager.isSupported());

// Set up state change listener
const stateCleanup = payment.onStateChange(state => {
  console.log('Payment state changed:', state);
});

// Set up error listener
const errorCleanup = payment.onError(error => {
  console.error('Payment error:', error);
});

// Configure payment options
payment.setOptions({
  supportedMethods: ['basic-card'],
  supportedNetworks: ['visa', 'mastercard'],
  requestPayerName: true,
  requestPayerEmail: true,
  requestShipping: true,
  shippingType: 'delivery'
});

// Set up shipping address change listener
const shippingAddressCleanup = payment.onShippingAddressChange(event => {
  event.updateWith({
    total: {
      label: 'Total',
      amount: { currency: 'USD', value: '20.00' }
    },
    shippingOptions: [
      {
        id: 'standard',
        label: 'Standard Shipping',
        amount: { currency: 'USD', value: '0.00' },
        selected: true
      }
    ]
  });
});

// Request payment
payment.requestPayment({
  total: {
    label: 'Total',
    amount: { currency: 'USD', value: '20.00' }
  },
  displayItems: [
    {
      label: 'Product',
      amount: { currency: 'USD', value: '20.00' }
    }
  ],
  shippingOptions: [
    {
      id: 'standard',
      label: 'Standard Shipping',
      amount: { currency: 'USD', value: '0.00' },
      selected: true
    },
    {
      id: 'express',
      label: 'Express Shipping',
      amount: { currency: 'USD', value: '5.00' }
    }
  ]
}).then(response => {
  if (response) {
    // Process payment
    response.complete('success').then(() => {
      console.log('Payment completed');
    });
  }
});

// Clean up
stateCleanup(); // Remove state change listener
errorCleanup(); // Remove error listener
shippingAddressCleanup(); // Remove shipping address change listener
payment.cleanup(); // Full cleanup
*/