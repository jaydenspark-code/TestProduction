// PAYMENT DEBUGGING COMPONENT
// Add this to see what's happening with the payment setup

import React, { useEffect } from 'react';

const PaymentDebugger: React.FC = () => {
  useEffect(() => {
    console.log('🔍 PAYMENT DEBUG - Checking payment libraries...');
    
    // Check if payment libraries are available
    console.log('Window object:', {
      hasPaystackPop: typeof window !== 'undefined' && !!window.PaystackPop,
      hasBraintree: typeof window !== 'undefined' && !!window.braintree,
      hasPaypal: typeof window !== 'undefined' && !!window.paypal,
      windowKeys: typeof window !== 'undefined' ? Object.keys(window).filter(key => 
        key.toLowerCase().includes('pay') || 
        key.toLowerCase().includes('brain') || 
        key.toLowerCase().includes('stripe')
      ) : []
    });

    // Check for containers
    const paypalContainer = document.getElementById('paypal-button-container');
    console.log('PayPal container found:', !!paypalContainer);
    
    // Check for any script loading errors
    const scripts = document.querySelectorAll('script');
    const paymentScripts = Array.from(scripts).filter(script => 
      script.src && (
        script.src.includes('paystack') || 
        script.src.includes('braintree') || 
        script.src.includes('paypal')
      )
    );
    
    console.log('Payment scripts loaded:', paymentScripts.map(script => ({
      src: script.src,
      loaded: !script.hasAttribute('data-loading-error')
    })));

    // Check environment variables
    console.log('Environment check:', {
      nodeEnv: process.env.NODE_ENV,
      hasPaystackKey: !!process.env.REACT_APP_PAYSTACK_PUBLIC_KEY,
      hasBraintreeEnv: !!process.env.REACT_APP_BRAINTREE_ENVIRONMENT,
      braintreeEnv: process.env.REACT_APP_BRAINTREE_ENVIRONMENT
    });

  }, []);

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      background: 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '8px',
      fontSize: '12px',
      zIndex: 9999,
      maxWidth: '300px'
    }}>
      <div>Payment Debug Active</div>
      <div>Check browser console for details</div>
    </div>
  );
};

export default PaymentDebugger;
