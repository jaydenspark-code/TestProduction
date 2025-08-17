import React, { useState, useEffect, useRef } from 'react';
import * as dropin from 'braintree-web-drop-in';

// Global declarations for payment APIs
declare global {
  interface Window {
    ApplePaySession?: any;
    google?: {
      payments?: any;
    };
  }
}

interface BraintreePaymentFormProps {
  amount: number;
  onPaymentSuccess: (nonce: string, amount: number) => void;
  onPaymentError: (error: string) => void;
  className?: string;
}

const BraintreePaymentForm: React.FC<BraintreePaymentFormProps> = ({
  amount,
  onPaymentSuccess,
  onPaymentError,
  className = ''
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const dropinInstance = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initializeBraintree();
    
    return () => {
      // Cleanup on unmount
      if (dropinInstance.current) {
        dropinInstance.current.teardown(() => {
          console.log('🧹 Braintree Drop-in cleaned up');
        });
      }
    };
  }, []);

  const getProperlyEncodedToken = async (): Promise<string> => {
    try {
      console.log('🎫 Getting Braintree client token...');
      
      // Use your real Braintree credentials
      const credentials = btoa('sgfjmfv929kzffsr:4edc8a7489369f8e7d5cb8c9a8066c17');
      const requestBody = `<?xml version="1.0" encoding="UTF-8"?><client-token></client-token>`;
      const apiUrl = 'https://api.sandbox.braintreegateway.com/merchants/2yhrvbtjszdbvxtt/client_token';
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/xml',
          'Accept': 'application/xml',
          'Braintree-Version': '2019-01-01'
        },
        body: requestBody
      });
      
      if (!response.ok) {
        throw new Error(`Braintree API error: ${response.status}`);
      }
      
      const responseText = await response.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(responseText, 'text/xml');
      const clientTokenElement = xmlDoc.querySelector('client-token');
      
      if (!clientTokenElement) {
        throw new Error('No client token found in response');
      }
      
      // CRITICAL: Base64 encode the JSON token
      const rawJsonToken = clientTokenElement.textContent.trim();
      const encodedToken = btoa(rawJsonToken);
      
      console.log('✅ Client token obtained and encoded successfully');
      return encodedToken;
      
    } catch (error: any) {
      console.error('❌ Token generation failed:', error);
      throw new Error(`Failed to get client token: ${error.message}`);
    }
  };

  const initializeBraintree = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (!containerRef.current) {
        throw new Error('Container not found');
      }
      
      // Get properly encoded token
      const encodedToken = await getProperlyEncodedToken();
      
      // Ensure container is completely empty
      containerRef.current.innerHTML = '';
      
      console.log('🎨 Creating Braintree Drop-in...');
      
      // Create Drop-in with dynamic payment methods based on what's enabled
      const dropinConfig: any = {
        authorization: encodedToken,
        container: containerRef.current!,
        card: {
          cardholderName: {
            required: false
          },
          overrides: {
            fields: {
              number: {
                placeholder: '1111 1111 1111 1111'
              },
              cvv: {
                placeholder: '123'
              },
              expirationDate: {
                placeholder: 'MM/YY'
              }
            }
          }
        },
        paypal: {
          flow: 'checkout',
          amount: amount.toString(),
          currency: 'USD',
          buttonStyle: {
            color: 'gold',
            shape: 'rect',
            size: 'responsive'
          }
        },
        dataCollector: {
          kount: true // Keep fraud protection
        },
        locale: 'en_US'
      };

      // Add Apple Pay if running on Safari/iOS and enabled in production
      if (window.ApplePaySession && 
          window.ApplePaySession.canMakePayments() && 
          process.env.NODE_ENV === 'production') {
        dropinConfig.applePay = {
          displayName: 'EarnPro',
          paymentRequest: {
            total: {
              label: 'EarnPro Payment',
              amount: amount.toString()
            },
            countryCode: 'US',
            currencyCode: 'USD',
            supportedNetworks: ['visa', 'mastercard', 'amex', 'discover'],
            merchantCapabilities: ['supports3DS']
          }
        };
      }

      // Add Google Pay if running on Chrome/Android and enabled in production
      if (window.google && 
          window.google.payments && 
          process.env.NODE_ENV === 'production') {
        dropinConfig.googlePay = {
          merchantId: '2yhrvbtjszdbvxtt', // Your merchant ID
          paymentRequest: {
            transactionInfo: {
              totalPriceStatus: 'FINAL',
              totalPrice: amount.toString(),
              currencyCode: 'USD'
            },
            allowedPaymentMethods: [{
              type: 'CARD',
              parameters: {
                allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
                allowedCardNetworks: ['VISA', 'MASTERCARD', 'AMEX', 'DISCOVER']
              }
            }]
          }
        };
      }

      // Add Venmo if enabled in production
      if (process.env.NODE_ENV === 'production') {
        dropinConfig.venmo = {
          allowDesktop: true
        };
      }

      dropinInstance.current = await new Promise((resolve, reject) => {
        dropin.create(dropinConfig, (createError, instance) => {
          if (createError) {
            console.error('❌ Drop-in creation failed:', createError);
            console.error('Full error details:', createError);
            reject(createError);
          } else {
            console.log('✅ Braintree Drop-in created successfully');
            console.log('Available payment methods:', instance.getPaymentMethodTypes());
            resolve(instance);
          }
        });
      });
      
      setIsReady(true);
      setIsLoading(false);
      
    } catch (error: any) {
      console.error('❌ Braintree initialization failed:', error);
      setError(error.message);
      setIsLoading(false);
      onPaymentError(error.message);
    }
  };

  const handlePayment = async () => {
    if (!dropinInstance.current) {
      onPaymentError('Payment form not initialized');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('💳 Requesting payment method...');
      
      const payload = await new Promise((resolve, reject) => {
        dropinInstance.current.requestPaymentMethod((err: any, result: any) => {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        });
      });
      
      console.log('✅ Payment method obtained:', payload);
      onPaymentSuccess((payload as any).nonce, amount);
      
    } catch (error: any) {
      console.error('❌ Payment request failed:', error);
      
      let errorMessage = error.message;
      if (error.message.includes('No payment method is available')) {
        errorMessage = 'Please fill in your payment information';
      }
      
      setError(errorMessage);
      onPaymentError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const retryInitialization = () => {
    setError(null);
    initializeBraintree();
  };

  return (
    <div className={`braintree-payment-form ${className}`}>
      <div className="payment-header">
        <h3>💳 Secure Payment</h3>
        <p>Amount: <strong>${amount.toFixed(2)} USD</strong></p>
      </div>
      
      {error && (
        <div className="error-message" style={{
          background: '#ffebee',
          color: '#c62828',
          padding: '12px',
          borderRadius: '4px',
          marginBottom: '16px',
          border: '1px solid #ffcdd2'
        }}>
          <strong>Payment Error:</strong> {error}
          <button 
            onClick={retryInitialization}
            style={{
              background: '#1976d2',
              color: 'white',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '4px',
              marginLeft: '12px',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      )}
      
      {isLoading && (
        <div className="loading-message" style={{
          background: '#e3f2fd',
          color: '#1976d2',
          padding: '12px',
          borderRadius: '4px',
          marginBottom: '16px',
          textAlign: 'center'
        }}>
          🔄 {isReady ? 'Processing payment...' : 'Initializing secure payment form...'}
        </div>
      )}
      
      <div 
        ref={containerRef}
        className="braintree-container"
        style={{
          minHeight: '300px',
          border: '2px solid #e0e0e0',
          borderRadius: '8px',
          padding: '20px',
          backgroundColor: '#fafafa',
          marginBottom: '20px'
        }}
      />
      
      {isReady && !isLoading && !error && (
        <button
          onClick={handlePayment}
          disabled={isLoading}
          style={{
            width: '100%',
            background: '#4caf50',
            color: 'white',
            border: 'none',
            padding: '16px',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.6 : 1
          }}
        >
          {isLoading ? '🔄 Processing...' : `💳 Pay $${amount.toFixed(2)}`}
        </button>
      )}
      
      <div className="payment-security" style={{
        marginTop: '16px',
        fontSize: '12px',
        color: '#666',
        textAlign: 'center'
      }}>
        🔒 Secured by Braintree • Your payment information is encrypted and secure
      </div>
    </div>
  );
};

export default BraintreePaymentForm;
