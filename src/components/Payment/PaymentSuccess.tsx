import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { CheckCircle, Loader, Gift } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';

const PaymentSuccess: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshUser, user } = useAuth();
  const { theme } = useTheme();
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState('');

  const reference = searchParams.get('reference') || searchParams.get('trxref');
  const paypalOrderId = searchParams.get('token'); // PayPal order ID

  useEffect(() => {
    const verifyPayment = async () => {
      if (!reference && !paypalOrderId && !searchParams.get('payment_intent')) {
        setError('No payment reference found');
        setVerifying(false);
        return;
      }

      try {
        let response;
        
        if (reference) {
          // Verify Paystack payment
          response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/paystack-confirm`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({
              reference,
              userId: user?.id
            })
          });
        } else if (paypalOrderId) {
          // Verify PayPal payment
          response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/paypal-capture-order`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({
              orderId: paypalOrderId,
              userId: user?.id
            })
          });
        } else if (searchParams.get('payment_intent')) {
          // Verify Stripe payment
          const stripe = await loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);
          if (!stripe) {
            throw new Error('Failed to load Stripe');
          }

          const clientSecret = searchParams.get('payment_intent_client_secret');
          const { paymentIntent } = await stripe.retrievePaymentIntent(clientSecret);

          if (paymentIntent.status !== 'succeeded') {
            throw new Error('Payment was not successful');
          }

          await refreshUser();
          setVerifying(false);
          return;
        }

        const result = await response.json();
        
        if (result.success) {
          await refreshUser();
          setVerifying(false);
        } else {
          setError(result.error || 'Payment verification failed');
          setVerifying(false);
        }
      } catch (error: any) {
        console.error('Payment verification error:', error);
        setError('Failed to verify payment');
        setVerifying(false);
      }
    };

    verifyPayment();
  }, [reference, user?.id, refreshUser]);

  const bgClass = theme === 'professional'
    ? 'min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800'
    : 'min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900';

  const cardClass = theme === 'professional'
    ? 'bg-gray-800/50 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-gray-700/50'
    : 'bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20';

  if (error) {
    return (
      <div className={`${bgClass} flex items-center justify-center p-4`}>
        <div className={`w-full max-w-md ${cardClass} text-center`}>
          <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl">✕</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Payment Error</h1>
          <p className="text-white/70 mb-6">{error}</p>
          <button
            onClick={() => navigate('/payment')}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (verifying) {
    return (
      <div className={`${bgClass} flex items-center justify-center p-4`}>
        <div className={`w-full max-w-md ${cardClass} text-center`}>
          <Loader className="w-12 h-12 text-blue-400 mx-auto mb-4 animate-spin" />
          <h1 className="text-2xl font-bold text-white mb-2">Verifying Payment...</h1>
          <p className="text-white/70">Please wait while we confirm your payment</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${bgClass} flex items-center justify-center p-4`}>
      <div className={`w-full max-w-md ${cardClass} text-center`}>
        <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-12 h-12 text-white" />
        </div>
        
        <h1 className="text-3xl font-bold text-white mb-4">Payment Successful! 🎉</h1>
        
        <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Gift className="w-5 h-5 text-green-300" />
            <span className="text-green-300 font-medium">Welcome Bonus Activated!</span>
          </div>
          <p className="text-white/80 text-sm">
            You've received a $3.00 welcome bonus in your account!
          </p>
        </div>
        
        <p className="text-white/70 mb-6">
          Your account has been activated successfully. You now have full access to the EarnPro platform.
        </p>
        
        <div className="bg-white/5 rounded-lg p-4 mb-6">
          <h3 className="text-white font-medium mb-2">What's Next?</h3>
          <ul className="text-white/70 text-sm space-y-1 text-left">
            <li>• Start sharing your referral link</li>
            <li>• Complete daily tasks to earn more</li>
            <li>• Apply for the Agent Program</li>
            <li>• Explore advertising opportunities</li>
          </ul>
        </div>
        
        <p className="text-white/50 text-sm">Redirecting to dashboard...</p>
      </div>
    </div>
  );
};

export default PaymentSuccess;
