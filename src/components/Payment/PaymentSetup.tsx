import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { usePaymentReady } from '../../hooks/usePaymentReady';
import { CreditCard, CheckCircle, AlertCircle, DollarSign, Check, Loader2, Star } from 'lucide-react';
import PaymentHandler from '../../services/PaymentHandler';
import BraintreePaymentForm from './BraintreePaymentForm';
import PaystackPaymentButton from './PaystackPaymentButton';

// PaymentGateway type definition
type PaymentGateway = 'braintree' | 'paystack' | 'stripe' | 'paypal' | 'crypto';

const PaymentSetup: React.FC = () => {
  // ✅ SIMPLIFIED HOOK STRUCTURE TO ISOLATE THE ISSUE
  const [userLoaded, setUserLoaded] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [selectedGateway, setSelectedGateway] = useState<PaymentGateway>('braintree');
  const [availableGateways] = useState<PaymentGateway[]>(['braintree', 'paystack', 'paypal']);
  
  // Context hooks
  const { user, refreshUser } = useAuth();
  const { markAsPaid } = usePaymentReady(); // RESTORED - The issue was hooks order, not this hook
  const { theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  // All useEffect hooks together
  useEffect(() => {
    console.log('🟣 PaymentSetup: user =', user);
    console.log('🟣 PaymentSetup: location.state =', location.state);
    if (typeof user !== 'undefined') setUserLoaded(true);
  }, [user, location.state]);

  useEffect(() => {
    if (user?.isPaidUser) {
      navigate('/dashboard');
    }
  }, [user?.isPaidUser, navigate]);

  // Check payment libraries availability - MOVED UP WITH OTHER HOOKS
  useEffect(() => {
    // Scripts are now loaded via index.html - no need to load dynamically
    console.log('🔍 Payment libraries should be loaded from index.html');
    console.log('PayStack available:', typeof window !== 'undefined' && !!window.PaystackPop);
    console.log('Braintree available:', typeof window !== 'undefined' && !!window.braintree);
    console.log('PayPal available:', typeof window !== 'undefined' && !!window.paypal);
  }, []);

  // Check if user came from OAuth with error handling - MOVED AFTER HOOKS
  let fromOAuth, oauthEmail, oauthProvider, customMessage;
  try {
    fromOAuth = location.state?.fromOAuth;
    oauthEmail = location.state?.email;
    oauthProvider = location.state?.provider;
    customMessage = location.state?.message;
  } catch (err) {
    console.error('Error accessing location state:', err);
    fromOAuth = false;
    oauthEmail = null;
    oauthProvider = null;
    customMessage = null;
  }

  console.log('🟣 PaymentSetup OAuth state:', { fromOAuth, oauthEmail, oauthProvider, customMessage });

  // ✅ CONDITIONAL RETURNS AFTER ALL HOOKS
  // Show loading spinner if user context is not loaded
  if (!userLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        <p className="text-white mt-4">Loading your account...</p>
      </div>
    );
  }

  const BASE_ACTIVATION_FEE = 15.00;

  // Define the plan object that the payment handlers expect
  const plan = {
    price: BASE_ACTIVATION_FEE,
    type: 'activation',
    name: 'Account Activation',
    description: 'Activate your EarnPro account to start earning'
  };

  // Handle successful payment
  const handlePaymentSuccess = async () => {
    setSuccess(true);
    setProcessing(false);
    
    try {
      // Update user status to paid
      if (user) {
        await markAsPaid(); // RESTORED
        await refreshUser();
        
        // Show success message and redirect
        setTimeout(() => {
          navigate('/dashboard', { 
            state: { 
              message: 'Payment successful! Welcome to EarnPro!',
              showWelcomeBonus: true 
            } 
          });
        }, 2000);
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      // Still redirect even if status update fails
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    }
  };

  const handleBraintreePayment = async (paymentNonce: string) => {
    if (!user) {
      setError('User not found. Please log in again.');
      return;
    }

    setError('');
    setProcessing(true);

    try {
      console.log('🔷 Processing Braintree payment with nonce:', paymentNonce);
      
      // Process the payment on your server with the nonce
      const response = await fetch('http://localhost:3001/api/process-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentNonce,
          amount: plan.price,
          userId: user.id,
          planType: plan.type
        })
      });

      const result = await response.json();

      if (result.success) {
        console.log('✅ Braintree payment successful');
        handlePaymentSuccess();
      } else {
        throw new Error(result.error || 'Payment processing failed');
      }

    } catch (error: any) {
      console.error('❌ Braintree payment error:', error);
      setError(error.message || 'Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handlePayPalPayment = async () => {
    if (!user) {
      setError('User not found. Please log in again.');
      return;
    }

    setError('');
    setProcessing(true);

    try {
      console.log('🔵 Setting up PayPal payment...');
      
      // Just call the PayPal handler to set up the buttons
      // The actual payment will be handled by the PayPal SDK
      const result = await PaymentHandler.handlePayPalPayment(
        plan.price,
        plan.type,
        user.id
      );

      if (result.success) {
        console.log('✅ PayPal payment completed');
        handlePaymentSuccess();
      } else {
        throw new Error(result.error || 'PayPal payment failed');
      }

    } catch (error: any) {
      console.error('❌ PayPal payment error:', error);
      setError(error.message || 'PayPal payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handlePaystackPayment = async () => {
    if (!user) {
      setError('User not found. Please log in again.');
      return;
    }

    setError('');
    setProcessing(true);

    try {
      console.log('🟢 Starting PayStack payment...');
      
      const result = await PaymentHandler.handlePayStackPayment(
        plan.price,
        plan.type,
        user.id
      );

      if (result.success) {
        console.log('✅ PayStack payment successful');
        handlePaymentSuccess();
      } else {
        throw new Error(result.error || 'PayStack payment failed');
      }

    } catch (error: any) {
      console.error('❌ PayStack payment error:', error);
      setError(error.message || 'PayStack payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const bgClass = theme === 'professional'
    ? 'min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800'
    : 'min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900';

  const cardClass = theme === 'professional'
    ? 'bg-gray-800/50 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-gray-700/50'
    : 'bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20';

  const buttonPrimaryClass = theme === 'professional'
    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700'
    : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700';

  return (
    <div className={`${bgClass} flex items-center justify-center p-4`}>
      <div className="w-full max-w-md">
        <div className={cardClass}>
          <div className="text-center mb-8">
            {/* OAuth Welcome Message */}
            {fromOAuth && oauthProvider && (
              <div className={`${theme === 'professional' ? 'bg-cyan-500/20 border-cyan-500/50' : 'bg-purple-500/20 border-purple-500/50'} border rounded-lg p-4 mb-6`}>
                <div className="flex items-center justify-center mb-2">
                  <Star className={`w-5 h-5 mr-2 ${theme === 'professional' ? 'text-cyan-400' : 'text-purple-400'}`} />
                  <span className="text-white font-medium">Welcome via {oauthProvider === 'google' ? 'Google' : 'OAuth'}!</span>
                </div>
                <p className="text-white/80 text-sm">
                  Your email ({oauthEmail}) is already verified. Complete payment to activate your account instantly!
                </p>
              </div>
            )}
            
            <div className={`w-16 h-16 ${theme === 'professional' ? 'bg-gradient-to-br from-cyan-500 to-blue-500' : 'bg-gradient-to-br from-purple-500 to-blue-500'} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
              <CreditCard className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Activate Your Account</h1>
            {customMessage ? (
              <p className="text-white/80 text-base mb-2">{customMessage}</p>
            ) : (
              <p className="text-white/70">
                {fromOAuth ? 'Complete your payment to start earning immediately' : 'Complete your payment to start earning'}
              </p>
            )}
          </div>

          <div className="space-y-6">
            <div className="space-y-6">
              <div className={`${theme === 'professional' ? 'bg-gray-700/30' : 'bg-white/5'} rounded-lg p-6 border ${theme === 'professional' ? 'border-gray-600/30' : 'border-white/10'}`}>
                <h3 className="text-white font-medium mb-4">Select Payment Method</h3>
                <div className="grid grid-cols-3 gap-4">
                  {availableGateways.map((gateway) => (
                    <button
                      key={gateway}
                      onClick={() => setSelectedGateway(gateway)}
                      className={`${selectedGateway === gateway 
                        ? theme === 'professional' 
                          ? 'bg-cyan-500/20 border-cyan-500/50' 
                          : 'bg-purple-500/20 border-purple-500/50'
                        : theme === 'professional'
                          ? 'bg-gray-800/50 border-gray-600/30 hover:bg-gray-700/30'
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      } p-4 rounded-lg border transition-all duration-200 flex flex-col items-center justify-center space-y-2`}
                    >
                      <div className="text-2xl">
                        {gateway === 'braintree' && '🔷'}
                        {gateway === 'paypal' && '🅿️'}
                        {gateway === 'paystack' && '🇳🇬'}
                      </div>
                      <span className="text-white capitalize text-sm font-medium">
                        {gateway === 'braintree' ? 'Braintree' : gateway === 'paystack' ? 'Paystack' : 'PayPal'}
                      </span>
                      <span className="text-white/60 text-xs text-center">
                        {gateway === 'braintree' && 'Cards, PayPal, Apple/Google Pay'}
                        {gateway === 'paypal' && 'PayPal Account Required'}
                        {gateway === 'paystack' && 'Best for Nigerian Users'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              <div className={`${theme === 'professional' ? 'bg-gray-700/30' : 'bg-white/5'} rounded-lg p-6 border ${theme === 'professional' ? 'border-gray-600/30' : 'border-white/10'}`}>
              <h3 className="text-white font-medium mb-4 flex items-center">
                <DollarSign className="w-5 h-5 mr-2" />
                Activation Fee
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-white/70">Activation Amount:</span>
                  <span className="text-white">${BASE_ACTIVATION_FEE.toFixed(2)} USD</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/70">Welcome Bonus:</span>
                  <span className="text-green-300">+$3.00 USD</span>
                </div>
                <div className={`border-t ${theme === 'professional' ? 'border-gray-600/50' : 'border-white/20'} pt-2`}>
                  <div className="flex justify-between items-center text-lg font-medium">
                    <span className="text-white">You Pay:</span>
                    <span className={`${theme === 'professional' ? 'text-cyan-300' : 'text-purple-300'}`}>
                      ${BASE_ACTIVATION_FEE.toFixed(2)} USD
                    </span>
                  </div>
                </div>
              </div>
            </div>
            </div>

            <div className={`${theme === 'professional' ? 'bg-gray-700/30' : 'bg-white/5'} rounded-lg p-4 border ${theme === 'professional' ? 'border-gray-600/30' : 'border-white/10'}`}>
              <h4 className="text-white font-medium mb-2">What You Get:</h4>
              <ul className="text-white/70 text-sm space-y-1">
                <li className="flex items-center">
                  <Check className="w-4 h-4 mr-2 text-green-400" />
                  Full access to referral system
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 mr-2 text-green-400" />
                  $3.00 instant welcome bonus
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 mr-2 text-green-400" />
                  Earn from direct referrals
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 mr-2 text-green-400" />
                  Multi-level indirect earnings
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 mr-2 text-green-400" />
                  Access to daily tasks
                </li>
                <li className="flex items-center">
                  <Check className="w-4 h-4 mr-2 text-green-400" />
                  24/7 support and guidance
                </li>
              </ul>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-200 text-sm flex items-center">
                <AlertCircle className="w-5 h-5 mr-2" />
                {error}
              </div>
            )}

            {/* Braintree Payment Form */}
            {selectedGateway === 'braintree' && (
              <div className="space-y-4">
                <BraintreePaymentForm
                  amount={plan.price}
                  onPaymentSuccess={handleBraintreePayment}
                  onPaymentError={(error: string) => setError(error)}
                  disabled={processing}
                />
              </div>
            )}

            {/* Show regular payment button for PayStack only */}
            {selectedGateway === 'paystack' && (
              <button
                onClick={handlePaystackPayment}
                disabled={processing}
                className={`w-full ${buttonPrimaryClass} text-white py-3 rounded-lg font-medium focus:outline-none focus:ring-2 ${theme === 'professional' ? 'focus:ring-cyan-500' : 'focus:ring-purple-500'} focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2`}
              >
                {processing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Processing Payment...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    <span>Pay ${BASE_ACTIVATION_FEE.toFixed(2)} USD</span>
                  </>
                )}
              </button>
            )}

            {/* Show PayPal setup button */}
            {selectedGateway === 'paypal' && (
              <button
                onClick={handlePayPalPayment}
                disabled={processing}
                className={`w-full ${buttonPrimaryClass} text-white py-3 rounded-lg font-medium focus:outline-none focus:ring-2 ${theme === 'professional' ? 'focus:ring-cyan-500' : 'focus:ring-purple-500'} focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2`}
              >
                {processing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Setting up PayPal...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    <span>Set up PayPal Payment</span>
                  </>
                )}
              </button>
            )}

            {/* Success Message */}
            {success && (
              <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4 text-green-200 text-center">
                <CheckCircle className="w-8 h-8 mx-auto mb-2" />
                <h3 className="font-semibold">Payment Successful!</h3>
                <p className="text-sm">Redirecting to your dashboard...</p>
              </div>
            )}

            {/* PayPal Button Container */}
            {selectedGateway === 'paypal' && (
              <div id="paypal-button-container" className="mt-4"></div>
            )}

            <div className="text-center">
              <p className="text-white/70 text-xs">
                {selectedGateway === 'braintree' 
                  ? 'Secure payment via Braintree. Supports credit cards, PayPal, Apple Pay, and Google Pay.'
                  : selectedGateway === 'paystack'
                  ? 'Secure payment processing via Paystack. Your card details are encrypted and never stored.'
                  : 'Secure payment processing via PayPal. Redirects to PayPal for secure checkout.'
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSetup;
