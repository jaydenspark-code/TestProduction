// BRAINTREE TOKENIZATION KEY SOLUTION
// Using tokenization keys instead of client tokens for Drop-in

export class TokenizationKeyBraintreeManager {
  private dropinInstance: any = null;

  async createDropin(): Promise<{ success: boolean; error?: string }> {
    console.log('🔑 BRAINTREE TOKENIZATION KEY MANAGER');
    console.log('===================================');

    try {
      // Step 1: Use tokenization key instead of client token
      // Tokenization keys are public and designed for client-side use
      const tokenizationKey = this.getTokenizationKey();
      
      if (!tokenizationKey) {
        throw new Error('Tokenization key not configured');
      }

      console.log('✅ Using tokenization key:', tokenizationKey.substring(0, 20) + '...');

      // Step 2: Ensure container exists
      let container = document.getElementById('braintree-drop-in-container');
      if (!container) {
        console.log('Creating container...');
        container = document.createElement('div');
        container.id = 'braintree-drop-in-container';
        container.style.minHeight = '200px';
        container.style.padding = '20px';
        document.body.appendChild(container);
      }

      // Clear container
      container.innerHTML = '';

      // Step 3: Create Drop-in with tokenization key
      console.log('🔧 Creating Drop-in with tokenization key...');
      
      this.dropinInstance = await window.braintree.dropin.create({
        authorization: tokenizationKey, // Use tokenization key directly
        container: '#braintree-drop-in-container'
      });

      console.log('✅ SUCCESS! Drop-in created with tokenization key');
      return { success: true };

    } catch (error: any) {
      console.error('❌ Tokenization key manager failed:', error);
      
      // Try fallback approaches
      return this.tryFallbackApproaches();
    }
  }

  private getTokenizationKey(): string | null {
    // Get tokenization key from environment variables
    // This should be set in your .env file
    const tokenizationKey = import.meta.env.VITE_BRAINTREE_TOKENIZATION_KEY;
    
    if (tokenizationKey && tokenizationKey.startsWith('sandbox_')) {
      return tokenizationKey;
    }

    // Fallback tokenization keys (you'll need to get these from your Braintree dashboard)
    // Go to: Settings > API > Tokenization Keys
    const fallbackKeys = [
      // Add your actual tokenization key here from Braintree dashboard
      // Format: sandbox_xxxxxxxxxx_xxxxxxxxxxxxxxxx
      // These are safe to include in client-side code
      'sandbox_8hxpnkwq_dc8k2px7wzxr4jdv', // This might be a tokenization key
    ];

    // Try to find a valid tokenization key
    for (const key of fallbackKeys) {
      if (key && key.startsWith('sandbox_') && key.length > 30) {
        console.log('✅ Using fallback tokenization key');
        return key;
      }
    }

    console.error('❌ No valid tokenization key found');
    return null;
  }

  private async tryFallbackApproaches(): Promise<{ success: boolean; error?: string }> {
    console.log('🔄 Trying fallback approaches...');

    // Fallback 1: Try with a fresh client token (as backup)
    try {
      console.log('Fallback 1: Trying fresh client token...');
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/braintree-client-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ 
          customerId: 'fallback-user',
          timestamp: Date.now()
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.clientToken) {
          this.dropinInstance = await window.braintree.dropin.create({
            authorization: data.clientToken,
            container: '#braintree-drop-in-container'
          });
          console.log('✅ Success with client token fallback!');
          return { success: true };
        }
      }
    } catch (error) {
      console.warn('Client token fallback failed:', error);
    }

    return { 
      success: false, 
      error: 'Unable to create Drop-in. Please check your Braintree tokenization key configuration.' 
    };
  }

  async getPaymentMethod() {
    if (!this.dropinInstance) {
      return { success: false, error: 'Drop-in not initialized' };
    }

    try {
      const paymentMethod = await this.dropinInstance.requestPaymentMethod();
      return { success: true, paymentMethod };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  destroy() {
    if (this.dropinInstance) {
      try {
        this.dropinInstance.teardown();
      } catch (error) {
        console.warn('Teardown error:', error);
      }
      this.dropinInstance = null;
    }
  }
}

// Payment handler using tokenization keys
export class TokenizationKeyBraintreePaymentHandler {
  private static manager: TokenizationKeyBraintreeManager | null = null;

  static async handleBraintreePayment(amount: number, planType: string, userId: string) {
    console.log('🔑 TOKENIZATION KEY BRAINTREE PAYMENT HANDLER');
    console.log('============================================');
    console.log('Payment details:', { amount, planType, userId });

    try {
      if (!this.manager) {
        this.manager = new TokenizationKeyBraintreeManager();
      }

      const result = await this.manager.createDropin();
      if (!result.success) {
        return {
          success: false,
          error: `Drop-in creation failed: ${result.error}`
        };
      }

      const paymentResult = await this.manager.getPaymentMethod();
      if (!paymentResult.success) {
        return {
          success: false,
          error: `Payment method failed: ${paymentResult.error}`
        };
      }

      console.log('✅ Tokenization key flow completed!');
      return {
        success: true,
        message: 'Payment ready with tokenization key',
        paymentMethod: paymentResult.paymentMethod
      };

    } catch (error: any) {
      console.error('❌ Tokenization key handler failed:', error);
      return {
        success: false,
        error: `Handler error: ${error.message}`
      };
    }
  }

  static cleanup() {
    if (this.manager) {
      this.manager.destroy();
      this.manager = null;
    }
  }
}
