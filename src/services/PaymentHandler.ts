// Payment Handler using existing deployed Edge Functions

interface PaymentResult {
  success: boolean;
  error?: string;
  transactionId?: string;
}

class PaymentHandler {
  // PayStack payment using existing paystack-confirm Edge Function
  static async handlePayStackPayment(amount: number, planType: string, userId: string): Promise<PaymentResult> {
    try {
      console.log('🟢 PayStack Payment initiated:', { amount, planType, userId });
      
      // Check if PayStack library is loaded
      if (typeof window === 'undefined' || !window.PaystackPop) {
        throw new Error('PayStack library not loaded. Please refresh the page.');
      }

      // Detect user's currency based on their country or use USD as default
      const getUserCurrency = async () => {
        try {
          // First, try to get user's country from their profile
          const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/users?id=eq.${userId}&select=country,currency`, {
            headers: {
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            const userData = await response.json();
            if (userData[0]?.country) {
              const userCountry = userData[0].country;
              console.log('User country from profile:', userCountry);
              
              // PayStack supported currencies with more accurate rates
              const countryToCurrency: { [key: string]: { currency: string; rate: number } } = {
                'NG': { currency: 'NGN', rate: 1600 }, // Nigeria
                'GH': { currency: 'GHS', rate: 15 },   // Ghana
                'ZA': { currency: 'ZAR', rate: 18 },   // South Africa
                'KE': { currency: 'KES', rate: 130 },  // Kenya
                'EG': { currency: 'EGP', rate: 49 },   // Egypt
                'US': { currency: 'USD', rate: 1 },    // United States
                'GB': { currency: 'GBP', rate: 0.79 }, // United Kingdom
              };
              
              if (countryToCurrency[userCountry]) {
                return countryToCurrency[userCountry];
              }
            }
          }
          
          // Fallback to timezone detection
          const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
          
          // PayStack supported currencies and their timezones
          const timezoneMap: { [key: string]: { currency: string; rate: number } } = {
            'Africa/Lagos': { currency: 'NGN', rate: 1600 }, // Nigeria
            'Africa/Accra': { currency: 'GHS', rate: 15 },   // Ghana
            'Africa/Johannesburg': { currency: 'ZAR', rate: 18 }, // South Africa
            'Africa/Nairobi': { currency: 'KES', rate: 130 }, // Kenya
            'Africa/Cairo': { currency: 'EGP', rate: 49 },   // Egypt
            'Europe/London': { currency: 'GBP', rate: 0.79 }, // UK
            'America/New_York': { currency: 'USD', rate: 1 }, // USA
          };

          // Check if user's timezone matches supported currencies
          if (timezoneMap[timezone]) {
            return timezoneMap[timezone];
          }

          // Default to USD if no match
          return { currency: 'USD', rate: 1 };
        } catch (error) {
          console.warn('Could not detect user currency, defaulting to USD:', error);
          return { currency: 'USD', rate: 1 };
        }
      };

      const { currency, rate } = await getUserCurrency();
      const localAmount = amount * rate;
      
      console.log(`💰 PayStack: Converting $${amount} USD to ${localAmount} ${currency}`);

      return new Promise((resolve) => {
        // PayStack callback must be a regular function, not async
        const paymentCallback = (response: any) => {
          console.log('✅ PayStack payment successful:', response.reference);
          
          // Handle the async confirmation in a separate promise
          fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/paystack-confirm`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({
              reference: response.reference,
              userId: userId
            })
          })
          .then(confirmResponse => confirmResponse.json())
          .then(result => {
            if (result.success) {
              resolve({ success: true, transactionId: response.reference });
            } else {
              resolve({ success: false, error: result.error || 'Payment confirmation failed' });
            }
          })
          .catch(confirmError => {
            console.error('PayStack confirmation error:', confirmError);
            resolve({ success: false, error: `Payment confirmation failed: ${confirmError.message}` });
          });
        };

        // Define close handler function
        const closeHandler = () => {
          resolve({ success: false, error: 'Payment cancelled by user' });
        };

        // Validate PayStack is available
        if (!window.PaystackPop || typeof window.PaystackPop.setup !== 'function') {
          resolve({ success: false, error: 'PayStack library not loaded properly' });
          return;
        }

        try {
          const handler = window.PaystackPop.setup({
            key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
            email: `user-${userId}@earnpro.org`,
            amount: Math.round(localAmount * 100), // Convert to minor currency unit (kobo/pesewas/cents)
            currency: currency,
            callback: paymentCallback,
            onClose: closeHandler
          });

          if (handler && typeof handler.openIframe === 'function') {
            handler.openIframe();
          } else {
            resolve({ success: false, error: 'Failed to initialize PayStack payment handler' });
          }
        } catch (setupError: any) {
          console.error('PayStack setup error:', setupError);
          resolve({ success: false, error: 'PayStack initialization failed: ' + setupError.message });
        }
      });

    } catch (error: any) {
      console.error('❌ PayStack error:', error);
      return { success: false, error: error.message };
    }
  }

  // Braintree payment using NPM packages (bypasses CDN issues)
  static async handleBraintreePayment(amount: number, planType: string, userId: string): Promise<PaymentResult> {
    try {
      console.log('🔧 NPM BRAINTREE PAYMENT INITIATED (BYPASSING CDN)');
      console.log('================================================');
      console.log('Payment details:', { amount, planType, userId });

      // Import and use the NPM Braintree handler
      const { npmBraintreeHandler } = await import('../components/NPMBraintreePaymentHandler');
      
      // Initialize the handler
      await npmBraintreeHandler.initialize();
      
      // Process the payment
      const result = await npmBraintreeHandler.processPayment(amount.toString());
      
      if (result.success) {
        console.log('✅ NPM Braintree payment successful!');
        return { 
          success: true, 
          transactionId: result.transaction?.id || 'npm-braintree-success' 
        };
      } else {
        console.error('❌ NPM Braintree payment failed:', result.error);
        return { 
          success: false, 
          error: result.error || 'NPM Braintree payment failed' 
        };
      }
    } catch (error: any) {
      console.error('❌ Failed to load NPM Braintree handler:', error);
      
      // Enhanced error message with CDN context
      return { 
        success: false, 
        error: `Braintree payment unavailable (CDN blocked): ${error.message}. Please try PayStack or PayPal instead.` 
      };
    }
  }

  // PayPal payment using existing paypal-create-order Edge Function
  static async handlePayPalPayment(amount: number, planType: string, userId: string): Promise<PaymentResult> {
    try {
      console.log('🔵 PayPal Payment initiated:', { amount, planType, userId });
      
      // Check if PayPal SDK is loaded
      if (typeof window === 'undefined' || !window.paypal) {
        throw new Error('PayPal SDK not loaded. Please refresh the page.');
      }

      return new Promise((resolve) => {
        // Set a timeout to prevent hanging
        const timeoutId = setTimeout(() => {
          resolve({ 
            success: false, 
            error: 'PayPal setup timed out. Please try again.' 
          });
        }, 30000); // 30 seconds timeout

        // Ensure PayPal container exists
        let paypalContainer = document.getElementById('paypal-button-container');
        if (!paypalContainer) {
          // Create container if it doesn't exist
          paypalContainer = document.createElement('div');
          paypalContainer.id = 'paypal-button-container';
          document.body.appendChild(paypalContainer);
        }
        
        // Clear existing content
        paypalContainer.innerHTML = '';
        
        console.log('🔵 Setting up PayPal buttons...');

        // Create PayPal Buttons
        if (window.paypal && window.paypal.Buttons) {

          window.paypal.Buttons({
            // Set up the payment
            createOrder: async () => {
              try {
                console.log('🔵 Creating PayPal order...');
                
                // Use existing paypal-create-order Edge Function
                const orderResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/paypal-create-order`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
                  },
                  body: JSON.stringify({
                    amount: amount,
                    currency: 'USD',
                    userId: userId
                  })
                });

                if (!orderResponse.ok) {
                  const errorText = await orderResponse.text();
                  throw new Error(`Failed to create PayPal order: ${errorText}`);
                }

                const orderData = await orderResponse.json();
                
                if (orderData.orderId) {
                  console.log('✅ PayPal order created:', orderData.orderId);
                  return orderData.orderId; // Return the order ID directly
                } else {
                  throw new Error('No order ID received from PayPal order creation');
                }
              } catch (error: any) {
                console.error('❌ PayPal order creation error:', error);
                throw error; // Let PayPal SDK handle the error
              }
            },

            // Handle payment approval
            onApprove: async (data: any, actions: any) => {
              try {
                clearTimeout(timeoutId); // Clear the timeout
                console.log('✅ PayPal payment approved:', data.orderID);
                
                // Capture the payment (this would typically be done on the server)
                const captureResponse = await actions.order.capture();
                console.log('✅ PayPal payment captured:', captureResponse);
                
                resolve({ 
                  success: true, 
                  transactionId: data.orderID 
                });
              } catch (error: any) {
                console.error('❌ PayPal capture error:', error);
                resolve({ 
                  success: false, 
                  error: 'Payment approval failed: ' + error.message 
                });
              }
            },

            // Handle payment cancellation
            onCancel: (data: any) => {
              clearTimeout(timeoutId); // Clear the timeout
              console.log('⚠️ PayPal payment cancelled:', data);
              resolve({ 
                success: false, 
                error: 'Payment was cancelled by user' 
              });
            },

            // Handle errors
            onError: (err: any) => {
              clearTimeout(timeoutId); // Clear the timeout
              console.error('❌ PayPal payment error:', err);
              resolve({ 
                success: false, 
                error: 'PayPal payment error: ' + (err.message || 'Unknown error') 
              });
            }
          }).render('#paypal-button-container').then(() => {
            console.log('✅ PayPal buttons rendered successfully');
          }).catch((error: any) => {
            console.error('❌ PayPal button render error:', error);
            resolve({ 
              success: false, 
              error: 'Failed to render PayPal buttons: ' + (error.message || 'Unknown error')
            });
          });
        } else {
          resolve({ 
            success: false, 
            error: 'PayPal SDK not properly loaded' 
          });
        }
      });

    } catch (error: any) {
      console.error('❌ PayPal error:', error);
      return { success: false, error: error.message };
    }
  }
}

export default PaymentHandler;
