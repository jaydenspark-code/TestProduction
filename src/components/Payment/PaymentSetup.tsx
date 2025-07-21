import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { CreditCard, Check, AlertCircle, DollarSign } from 'lucide-react';

const PaymentSetup: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const { user, updateUser } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

  const BASE_ACTIVATION_FEE = 15.00;

  // Mock payment info - no API calls
  const mockPaymentInfo = {
    amount: BASE_ACTIVATION_FEE,
    currency: user?.currency || 'USD',
    exchangeRate: 1.00,
    localAmount: BASE_ACTIVATION_FEE
  };

  useEffect(() => {
    // Remove all API calls - just set mock data
    console.log('🧪 TESTING MODE: Using mock payment data');
    setLoading(false);
  }, [user?.currency]);

  const handlePayment = async () => {
    setError('');
    setProcessing(true);

    // Check if we're in testing mode
    if (!supabase) {
      console.log('🧪 TESTING MODE: Payment simulation started');
      
      // Simulate payment processing delay
      setTimeout(() => {
        console.log('✅ Payment simulation completed successfully');
        setProcessing(false);
        
        // Update user to paid status
        if (user) {
          updateUser({ isPaidUser: true });
          console.log('✅ User updated to paid status');
          navigate('/dashboard');
        }
      }, 3000);
      return;
    }

    try {
      // In production, integrate with actual payment service (Paystack, Stripe, etc.)
      // For now, simulate successful payment
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update user payment status in database
      const { error } = await supabase
        .from('users')
        .update({ is_paid: true })
        .eq('id', user?.id);

      if (error) {
        throw error;
      }

      // Refresh user data
      await refreshUser();
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Payment error:', error);
      setError(error.message || 'Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const formatDualCurrency = (amount: number, currency: string) => {
    return `$${amount.toFixed(2)} USD`;
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

  if (loading) {
    return (
      <div className={`${bgClass} flex items-center justify-center p-4`}>
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading payment information...</p>
        </div>
      </div>
    );
  }

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

          {mockPaymentInfo && (
            <div className="space-y-6">
              <div className={`${theme === 'professional' ? 'bg-gray-700/30' : 'bg-white/5'} rounded-lg p-6 border ${theme === 'professional' ? 'border-gray-600/30' : 'border-white/10'}`}>
                <h3 className="text-white font-medium mb-4 flex items-center">
                  <DollarSign className="w-5 h-5 mr-2" />
                  Activation Fee
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-white/70">Base Amount (USD):</span>
                    <span className="text-white">${mockPaymentInfo.amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/70">Exchange Rate:</span>
                    <span className="text-white">1 USD = {mockPaymentInfo.exchangeRate.toFixed(2)} {mockPaymentInfo.currency}</span>
                  </div>
                  <div className={`border-t ${theme === 'professional' ? 'border-gray-600/50' : 'border-white/20'} pt-2`}>
                    <div className="flex justify-between items-center text-lg font-medium">
                      <span className="text-white">You Pay:</span>
                      <span className={`${theme === 'professional' ? 'text-cyan-300' : 'text-purple-300'}`}>
                        {formatDualCurrency(mockPaymentInfo.amount, mockPaymentInfo.currency)}
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
                className={`w-full ${buttonPrimaryClass} text-white py-3 rounded-lg font-medium focus:outline-none focus:ring-2 ${theme === 'professional' ? 'focus:ring-cyan-500' : 'focus:ring-purple-500'} focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {processing ? 'Processing Payment...' : `Pay ${formatDualCurrency(mockPaymentInfo.amount, mockPaymentInfo.currency)}`}
              </button>

              <div className="text-center">
                <p className="text-white/70 text-xs">
                  Secure payment processing. Your card details are encrypted and never stored.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentSetup;