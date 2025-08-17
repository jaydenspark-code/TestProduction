// BRAINTREE TOKEN FIX - Generate Fresh Client Tokens
// The issue is CLIENT_AUTHORIZATION_INVALID - expired tokens

export class WorkingBraintreeManager {
  private dropinInstance: any = null;

  async createDropin(userId: string): Promise<{ success: boolean; error?: string }> {
    console.log('🔧 WORKING BRAINTREE MANAGER - FRESH TOKENS');
    console.log('==========================================');

    try {
      // Step 1: Get fresh client token from your Edge Function
      const clientToken = await this.getFreshClientToken(userId);
      if (!clientToken) {
        throw new Error('Unable to get fresh client token');
      }

      console.log('✅ Got fresh client token:', clientToken.substring(0, 50) + '...');

      // Step 2: Ensure container exists
      let container = document.getElementById('braintree-drop-in-container');
      if (!container) {
        console.log('Creating container...');
        container = document.createElement('div');
        container.id = 'braintree-drop-in-container';
        container.style.minHeight = '200px';
        document.body.appendChild(container);
      }

      // Clear container
      container.innerHTML = '';

      // Step 3: Create Drop-in with fresh token
      console.log('🔧 Creating Drop-in with fresh token...');
      
      this.dropinInstance = await window.braintree.dropin.create({
        authorization: clientToken,
        container: '#braintree-drop-in-container'
      });

      console.log('✅ SUCCESS! Working Drop-in created with fresh token');
      return { success: true };

    } catch (error: any) {
      console.error('❌ Working manager failed:', error);
      
      // If Edge Function fails, let's try to generate a fresh token another way
      return this.tryAlternativeTokenSources(userId);
    }
  }

  private async getFreshClientToken(userId: string): Promise<string | null> {
    try {
      console.log('🔑 Getting fresh client token from Edge Function...');
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/braintree-client-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ 
          customerId: userId,
          // Add timestamp to ensure fresh token
          timestamp: Date.now()
        }),
      });

      if (!response.ok) {
        throw new Error(`Edge Function failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.clientToken && typeof data.clientToken === 'string') {
        return data.clientToken;
      }

      throw new Error('Invalid token format received');

    } catch (error: any) {
      console.error('❌ Edge Function token failed:', error);
      return null;
    }
  }

  private async tryAlternativeTokenSources(userId: string): Promise<{ success: boolean; error?: string }> {
    console.log('🔄 Trying alternative token sources for user:', userId);

    // Alternative 1: Try direct Braintree sandbox endpoint (if available)
    try {
      console.log('Alternative 1: Trying direct Braintree sandbox...');
      
      // This would require your Braintree sandbox credentials
      // For now, let's try with known working patterns
      
      const testTokens = [
        // These are example patterns - you'd need to replace with actual fresh tokens
        'sandbox_' + Date.now().toString().slice(-10) + '_test',
        // Or use a backup service if available
      ];

      for (const token of testTokens) {
        try {
          this.dropinInstance = await window.braintree.dropin.create({
            authorization: token,
            container: '#braintree-drop-in-container'
          });
          console.log('✅ Success with alternative token!');
          return { success: true };
        } catch (tokenError) {
          console.warn('Alternative token failed:', token.substring(0, 20) + '...');
        }
      }

    } catch (error) {
      console.error('Alternative approaches failed:', error);
    }

    return { 
      success: false, 
      error: 'All client tokens are invalid or expired. Please check your Braintree configuration.' 
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

// Working payment handler
export class WorkingBraintreePaymentHandler {
  private static manager: WorkingBraintreeManager | null = null;

  static async handleBraintreePayment(amount: number, planType: string, userId: string) {
    console.log('🔧 WORKING BRAINTREE PAYMENT HANDLER');
    console.log('===================================');
    console.log('Payment details:', { amount, planType, userId });

    try {
      if (!this.manager) {
        this.manager = new WorkingBraintreeManager();
      }

      const result = await this.manager.createDropin(userId);
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

      console.log('✅ Working Braintree flow completed!');
      return {
        success: true,
        message: 'Payment ready with fresh token',
        paymentMethod: paymentResult.paymentMethod
      };

    } catch (error: any) {
      console.error('❌ Working handler failed:', error);
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
