// ULTRA-SIMPLE BRAINTREE DROPIN MANAGER
// Strips away all complexity to find the core issue

export class UltraSimpleBraintreeManager {
  private dropinInstance: any = null;

  async createDropin(): Promise<{ success: boolean; error?: string }> {
    console.log('🧪 ULTRA-SIMPLE BRAINTREE TEST');
    console.log('==============================');

    try {
      // Step 1: Basic checks
      if (typeof window === 'undefined') {
        return { success: false, error: 'Not in browser' };
      }

      if (!window.braintree) {
        return { success: false, error: 'window.braintree is undefined' };
      }

      if (!window.braintree.dropin) {
        return { success: false, error: 'window.braintree.dropin is undefined' };
      }

      console.log('✅ Braintree SDK detected');

      // Step 2: Get container
      let container = document.getElementById('braintree-drop-in-container');
      if (!container) {
        console.log('⚠️ Container not found, creating one...');
        container = document.createElement('div');
        container.id = 'braintree-drop-in-container';
        container.style.minHeight = '200px';
        container.style.padding = '20px';
        container.style.border = '1px solid #ccc';
        document.body.appendChild(container);
      }

      container.innerHTML = ''; // Clear existing content
      console.log('✅ Container ready:', container);

      // Step 3: Try absolute minimal configuration
      console.log('🔧 Attempting ultra-simple Drop-in creation...');
      
      const config = {
        authorization: 'sandbox_8hxpnkwq_dc8k2px7wzxr4jdv',
        container: container // Use element directly
      };

      console.log('Config:', config);

      this.dropinInstance = await window.braintree.dropin.create(config);
      
      console.log('✅ SUCCESS! Ultra-simple Drop-in created:', this.dropinInstance);
      return { success: true };

    } catch (error: any) {
      console.error('❌ Ultra-simple creation failed:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack?.substring(0, 500)
      });

      // Try alternative approaches
      return this.tryAlternativeApproaches();
    }
  }

  private async tryAlternativeApproaches(): Promise<{ success: boolean; error?: string }> {
    console.log('🔄 Trying alternative approaches...');

    // Approach 1: Use selector instead of element
    try {
      console.log('Alternative 1: Using CSS selector...');
      this.dropinInstance = await window.braintree.dropin.create({
        authorization: 'sandbox_8hxpnkwq_dc8k2px7wzxr4jdv',
        container: '#braintree-drop-in-container'
      });
      console.log('✅ SUCCESS with CSS selector!');
      return { success: true };
    } catch (error1: any) {
      console.error('❌ CSS selector failed:', error1.message);
    }

    // Approach 2: Try different token
    try {
      console.log('Alternative 2: Using different token...');
      this.dropinInstance = await window.braintree.dropin.create({
        authorization: 'sandbox_g42y39zw_348pk9cgf3bgyw2b',
        container: '#braintree-drop-in-container'
      });
      console.log('✅ SUCCESS with different token!');
      return { success: true };
    } catch (error2: any) {
      console.error('❌ Different token failed:', error2.message);
    }

    // Approach 3: Wait and retry
    try {
      console.log('Alternative 3: Waiting 2 seconds and retrying...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      this.dropinInstance = await window.braintree.dropin.create({
        authorization: 'sandbox_8hxpnkwq_dc8k2px7wzxr4jdv',
        container: '#braintree-drop-in-container'
      });
      console.log('✅ SUCCESS after waiting!');
      return { success: true };
    } catch (error3: any) {
      console.error('❌ Retry after wait failed:', error3.message);
    }

    return { 
      success: false, 
      error: 'All ultra-simple approaches failed. This indicates a fundamental issue.' 
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

// Ultra-simple payment handler
export class UltraSimpleBraintreePaymentHandler {
  private static manager: UltraSimpleBraintreeManager | null = null;

  static async handleBraintreePayment(amount: number, planType: string, userId: string) {
    console.log('🧪 ULTRA-SIMPLE BRAINTREE PAYMENT HANDLER');
    console.log('=========================================');
    console.log('Payment details:', { amount, planType, userId });

    try {
      // Initialize manager
      if (!this.manager) {
        this.manager = new UltraSimpleBraintreeManager();
      }

      // Create Drop-in
      const initResult = await this.manager.createDropin();
      if (!initResult.success) {
        return {
          success: false,
          error: `Ultra-simple Drop-in failed: ${initResult.error}`
        };
      }

      // Get payment method
      const paymentResult = await this.manager.getPaymentMethod();
      if (!paymentResult.success) {
        return {
          success: false,
          error: `Payment method failed: ${paymentResult.error}`
        };
      }

      console.log('✅ Ultra-simple flow completed successfully!');
      return {
        success: true,
        message: 'Ultra-simple Braintree payment ready',
        paymentMethod: paymentResult.paymentMethod
      };

    } catch (error: any) {
      console.error('❌ Ultra-simple handler failed:', error);
      return {
        success: false,
        error: `Ultra-simple handler error: ${error.message}`
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
