import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { CreditCard, Check, AlertCircle, DollarSign, Loader } from 'lucide-react';
import { formatDualCurrency } from '../../utils/currency';

const PaymentSetup: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const { user, refreshUser } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

  const BASE_ACTIVATION_FEE = 15.00;

  // Redirect if user is already paid
  useEffect(() => {
    if (user?.isPaidUser) {
      navigate('/dashboard');
    }
  }, [user?.isPaidUser, navigate]);

  const handlePayment = async () => {
    if (!user) {
      setError('User not found. Please log in again.');
      return;
    }

    setError('');
    setProcessing(true);

    try {
      // Create payment reference
      const reference = `EPRO-${user.id}-${Date.now()}`;
      
      // Initialize Paystack payment
      const handler = (window as any).PaystackPop.setup({
        key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_a2d30b8bcd09fd282b564a3530da7e500522d523',
        email: user.email,
        amount: BASE_ACTIVATION_FEE * 100, // Convert to kobo
        currency: 'USD',
        ref: reference,
        callback: async function(response: any) {
          console.log('Payment successful:', response);
          
          try {
            // Confirm payment with backend
            const confirmResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/paystack-confirm`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
              },
              body: JSON.stringify({
                reference: response.reference,
                userId: user.id
              })
            });

            const result = await confirmResponse.json();
            
            if (result.success) {
              // Refresh user data to get updated payment status
              await refreshUser();
              
              // Show success message briefly then redirect
              setProcessing(false);
              navigate('/dashboard');
            } else {
              throw new Error(result.error || 'Payment confirmation failed');
            }
          } catch (confirmError: any) {
            console.error('Payment confirmation error:', confirmError);
            setError('Payment successful but confirmation failed. Please contact support.');
            setProcessing(false);
          }
        },
        onClose: function() {
          console.log('Payment popup closed');
          setProcessing(false);
        }
      });

      handler.openIframe();
    } catch (error: any) {
      console.error('Payment initialization error:', error);
      setError('Failed to initialize payment. Please try again.');
      setProcessing(false);
    }
  };

  // Load Paystack script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

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
            <div className={`w-16 h-16 ${theme === 'professional' ? 'bg-gradient-to-br from-cyan-500 to-blue-500' : 'bg-gradient-to-br from-purple-500 to-blue-500'} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
              <CreditCard className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Activate Your Account</h1>
            <p className="text-white/70">Complete your payment to start earning</p>
          </div>

          <div className="space-y-6">
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

            <button
              onClick={handlePayment}
              disabled={processing}
              className={`w-full ${buttonPrimaryClass} text-white py-3 rounded-lg font-medium focus:outline-none focus:ring-2 ${theme === 'professional' ? 'focus:ring-cyan-500' : 'focus:ring-purple-500'} focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2`}
            >
              {processing ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Processing Payment...</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  <span>Pay ${BASE_ACTIVATION_FEE.toFixed(2)} USD</span>
                </>
              )}
            </button>

            <div className="text-center">
              <p className="text-white/70 text-xs">
                Secure payment processing via Paystack. Your card details are encrypted and never stored.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSetup;