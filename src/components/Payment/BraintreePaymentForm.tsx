import React, { useState, useEffect, useRef } from 'react';
import * as dropin from 'braintree-web-drop-in';
import '../../styles/braintree-override.css';

interface BraintreePaymentFormProps {
  amount: number;
  onPaymentSuccess: (nonce: string) => void;
  onPaymentError: (error: string) => void;
  disabled?: boolean;
  className?: string;
}

const BraintreePaymentForm: React.FC<BraintreePaymentFormProps> = ({
  amount,
  onPaymentSuccess,
  onPaymentError,
  disabled = false,
  className = ''
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  
  const dropinInstance = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const maxRetries = 3;

  useEffect(() => {
    let isMounted = true;
    
    const initializeOnce = async () => {
      if (!disabled && !isInitialized && isMounted) {
        setIsInitialized(true);
        await initializeBraintree();
      }
    };
    
    initializeOnce();
    
    return () => {
      isMounted = false;
      // Cleanup on unmount
      if (dropinInstance.current) {
        dropinInstance.current.teardown(() => {
          console.log('🧹 Braintree Drop-in cleaned up on unmount');
          dropinInstance.current = null;
        });
      }
    };
  }, []); // Empty dependency array to run only once

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

  const initializeBraintree = async (isRetry = false) => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (isRetry) {
        setIsRetrying(true);
        // Add exponential backoff for retries
        const delay = Math.min(1000 * Math.pow(2, retryCount), 5000);
        console.log(`⏳ Retrying Braintree initialization in ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      if (!containerRef.current) {
        throw new Error('Container not found');
      }
      
      // Clean up any existing instance first
      if (dropinInstance.current) {
        try {
          await new Promise<void>((resolve) => {
            dropinInstance.current.teardown(() => {
              console.log('🧹 Previous Drop-in instance cleaned up');
              dropinInstance.current = null;
              resolve();
            });
          });
        } catch (teardownError) {
          console.warn('⚠️ Teardown warning:', teardownError);
          dropinInstance.current = null;
        }
      }
      
      // Get properly encoded token
      const encodedToken = await getProperlyEncodedToken();
      
      // Ensure container is completely empty - multiple approaches
      const container = containerRef.current;
      container.innerHTML = '';
      container.textContent = '';
      
      // Remove any child nodes that might still exist
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
      
      // Add a small delay to ensure DOM is ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('🎨 Creating Braintree Drop-in with clean container...');
      
      // Create Drop-in with working configuration
      dropinInstance.current = await new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error('Drop-in creation timeout after 30 seconds'));
        }, 30000);
        
        dropin.create({
          authorization: encodedToken,
          container: container,
          // Configuration to minimize security warnings in development
          card: {
            cardholderName: {
              required: false
            },
            vault: false
          },
          paypal: {
            flow: 'checkout',
            amount: amount.toString(),
            currency: 'USD',
            vault: false
          },
          venmo: false,
          applePay: false,
          googlePay: false,
          // Disable data collector to reduce security warnings
          dataCollector: false
        }, (createError: any, instance: any) => {
          clearTimeout(timeoutId);
          if (createError) {
            console.error('❌ Drop-in creation failed:', createError);
            reject(createError);
          } else {
            console.log('✅ Braintree Drop-in created successfully');
            resolve(instance);
          }
        });
      });
      
      setIsReady(true);
      setIsLoading(false);
      setIsRetrying(false);
      setRetryCount(0); // Reset retry count on success
      
    } catch (error: any) {
      console.error('❌ Braintree initialization failed:', error);
      setIsLoading(false);
      setIsRetrying(false);
      
      // Auto-retry logic with exponential backoff
      if (retryCount < maxRetries && !isRetry) {
        console.log(`🔄 Auto-retrying initialization (${retryCount + 1}/${maxRetries})`);
        setRetryCount(prev => prev + 1);
        setTimeout(() => {
          initializeBraintree(true);
        }, 1000 * Math.pow(2, retryCount));
      } else {
        setError(`Initialization failed after ${maxRetries} attempts: ${error.message}`);
        onPaymentError(error.message);
      }
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
      onPaymentSuccess((payload as any).nonce);
      
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
    if (retryCount >= maxRetries) {
      console.log('🔄 Manual retry - resetting retry count');
      setRetryCount(0);
    }
    setError(null);
    setIsReady(false);
    setIsInitialized(false);
    setIsRetrying(false);
    initializeBraintree(false);
  };

  if (disabled) {
    return (
      <div className={`braintree-payment-form ${className}`}>
        <div className="bg-gray-100 p-4 rounded-lg text-center text-gray-600">
          Payment form disabled during processing...
        </div>
      </div>
    );
  }

  return (
    <div className={`braintree-payment-form ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white mb-2">💳 Secure Payment</h3>
        <p className="text-white/70">Amount: <strong className="text-white">${amount.toFixed(2)} USD</strong></p>
        
        {/* Development Notice */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-3 bg-blue-500/20 border border-blue-500/50 rounded-lg p-3 text-blue-200 text-xs">
            <strong>ℹ️ Development Mode:</strong> If you see security warnings in the payment form, this is normal for HTTP development servers. 
            In production with HTTPS, these warnings will not appear.
          </div>
        )}
      </div>
      
      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-200 text-sm mb-4">
          <strong>Payment Error:</strong> {error}
          <button 
            onClick={retryInitialization}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded ml-3 text-xs"
          >
            Retry
          </button>
        </div>
      )}
      
      {isLoading && (
        <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-3 text-blue-200 text-sm mb-4 text-center">
          🔄 {isRetrying 
            ? `Retrying initialization (${retryCount}/${maxRetries})...` 
            : isReady 
              ? 'Processing payment...' 
              : 'Initializing secure payment form...'
          }
        </div>
      )}
      
      <div 
        ref={containerRef}
        id={`braintree-container-${Math.random().toString(36).substr(2, 9)}`}
        className="braintree-container min-h-[300px] border-2 border-gray-600/30 rounded-lg p-5 bg-gray-800/50 mb-5"
      />
      
      {isReady && !isLoading && !error && (
        <button
          onClick={handlePayment}
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-4 rounded-lg font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          {isLoading ? '🔄 Processing...' : `💳 Pay $${amount.toFixed(2)}`}
        </button>
      )}
      
      <div className="mt-4 text-xs text-white/60 text-center">
        🔒 Secured by Braintree • Your payment information is encrypted and secure
      </div>
    </div>
  );
};

export default BraintreePaymentForm;
