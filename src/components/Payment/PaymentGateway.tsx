import React, { useState, useEffect } from 'react';
import { CreditCard, Wallet, Shield, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { paymentGatewayService, PaymentGateway as PaymentGatewayType } from '../../services/paymentGatewayService';
import { packageService } from '../../services/packageService';
import { AdvertisingPackage } from '../../types/package';

interface PaymentGatewayProps {
  type: 'deposit' | 'package_purchase';
  amount?: number;
  packageDetails?: AdvertisingPackage;
  onSuccess: (data: any) => void;
  onError: (error: string) => void;
  onCancel: () => void;
}

const PaymentGateway: React.FC<PaymentGatewayProps> = ({
  type,
  amount: propAmount,
  packageDetails,
  onSuccess,
  onError,
  onCancel,
}) => {
  const { user } = useAuth();
  const { theme } = useTheme();
  
  const [selectedGateway, setSelectedGateway] = useState<PaymentGatewayType>('paystack');
  const [amount, setAmount] = useState(propAmount || 0);
  const [availableGateways, setAvailableGateways] = useState<PaymentGatewayType[]>([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'gateway' | 'processing' | 'verification'>('gateway');

  useEffect(() => {
    // Get available gateways based on user's currency and location
    const currency = user?.currency || 'NGN';
    const gateways = paymentGatewayService.getAvailableGateways(currency);
    setAvailableGateways(gateways);
    
    if (gateways.length > 0) {
      setSelectedGateway(paymentGatewayService.getRecommendedGateway(currency, user?.country, amount));
    }
  }, [user, amount]);

  const handlePayment = async () => {
    if (!user) {
      onError('User not authenticated');
      return;
    }

    setLoading(true);
    setStep('processing');

    try {
      let paymentResult;

      if (type === 'package_purchase' && packageDetails) {
        // Handle package purchase
        paymentResult = await packageService.purchasePackage(
          user.id,
          packageDetails.id,
          user.email,
          selectedGateway,
          `${window.location.origin}/advertiser/payment/success`
        );
      } else {
        // Handle wallet deposit
        const reference = `DEP-${user.id}-${Date.now()}`;
        paymentResult = await paymentGatewayService.initializePayment({
          amount,
          currency: user.currency || 'NGN',
          email: user.email,
          reference,
          gateway: selectedGateway,
          callbackUrl: `${window.location.origin}/payment/success`,
          metadata: {
            userId: user.id,
            type: 'wallet_deposit',
          },
        });
      }

      if (paymentResult.success && paymentResult.authorizationUrl) {
        setStep('verification');
        // Redirect to payment gateway
        window.location.href = paymentResult.authorizationUrl;
      } else {
        onError(paymentResult.error || 'Payment initialization failed');
        setStep('gateway');
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      onError(error.message || 'Payment failed');
      setStep('gateway');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency = 'NGN') => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const getGatewayIcon = (gateway: PaymentGatewayType) => {
    switch (gateway) {
      case 'paystack':
        return '🇳🇬';
      case 'stripe':
        return '💳';
      case 'paypal':
        return '🅿️';
      default:
        return '💳';
    }
  };

  const getGatewayName = (gateway: PaymentGatewayType) => {
    switch (gateway) {
      case 'paystack':
        return 'Paystack';
      case 'stripe':
        return 'Stripe';
      case 'paypal':
        return 'PayPal';
      default:
        return gateway;
    }
  };

  const bgClass = theme === 'professional'
    ? 'bg-gradient-to-br from-gray-900 via-black to-gray-800'
    : 'bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900';

  const cardClass = theme === 'professional'
    ? 'bg-gray-800/50 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-gray-700/50'
    : 'bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-white/20';

  const inputClass = theme === 'professional'
    ? 'bg-gray-700/50 border-gray-600 text-white'
    : 'bg-white/10 border-white/20 text-white';

  const buttonClass = theme === 'professional'
    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700'
    : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700';

  if (step === 'verification') {
    return (
      <div className={`${bgClass} min-h-screen flex items-center justify-center p-4`}>
        <div className={`${cardClass} max-w-md w-full text-center`}>
          <div className="mb-6">
            <Loader2 className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-spin" />
            <h2 className="text-2xl font-bold text-white mb-2">Redirecting to Payment</h2>
            <p className="text-white/70">
              You are being redirected to complete your payment securely.
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-center space-x-2 text-white/60">
              <Shield className="w-4 h-4" />
              <span className="text-sm">Secure payment processing</span>
            </div>
            
            <button
              onClick={onCancel}
              className="w-full py-2 px-4 border border-gray-600 rounded-lg text-white hover:bg-gray-700/50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${bgClass} min-h-screen flex items-center justify-center p-4`}>
      <div className={`${cardClass} max-w-lg w-full`}>
        <div className="mb-8">
          <div className="flex items-center mb-4">
            {type === 'package_purchase' ? (
              <CreditCard className="w-8 h-8 text-blue-500 mr-3" />
            ) : (
              <Wallet className="w-8 h-8 text-green-500 mr-3" />
            )}
            <h2 className="text-2xl font-bold text-white">
              {type === 'package_purchase' ? 'Purchase Package' : 'Add Funds'}
            </h2>
          </div>
          
          {type === 'package_purchase' && packageDetails ? (
            <div className={`${theme === 'professional' ? 'bg-gray-700/30' : 'bg-white/5'} rounded-lg p-4 border ${theme === 'professional' ? 'border-gray-600/30' : 'border-white/10'} mb-6`}>
              <h3 className="text-lg font-semibold text-white mb-2">{packageDetails.name} Package</h3>
              <p className="text-white/70 text-sm mb-3">{packageDetails.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-white/60">Total Amount:</span>
                <span className="text-2xl font-bold text-white">
                  {formatCurrency(packageDetails.price, packageDetails.currency)}
                </span>
              </div>
            </div>
          ) : (
            <div className="mb-6">
              <label className="block text-white/70 text-sm mb-2">Amount</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className={`w-full px-4 py-3 rounded-lg border ${inputClass} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="Enter amount"
                min="100"
                step="100"
              />
            </div>
          )}
        </div>

        {/* Payment Gateway Selection */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">Select Payment Method</h3>
          <div className="space-y-3">
            {availableGateways.map((gateway) => (
              <div key={gateway} className="relative">
                <input
                  type="radio"
                  id={gateway}
                  name="gateway"
                  value={gateway}
                  checked={selectedGateway === gateway}
                  onChange={(e) => setSelectedGateway(e.target.value as PaymentGatewayType)}
                  className="sr-only"
                />
                <label
                  htmlFor={gateway}
                  className={`flex items-center p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                    selectedGateway === gateway
                      ? theme === 'professional'
                        ? 'border-cyan-500 bg-cyan-500/10'
                        : 'border-purple-500 bg-purple-500/10'
                      : theme === 'professional'
                      ? 'border-gray-600 hover:border-gray-500'
                      : 'border-white/20 hover:border-white/30'
                  }`}
                >
                  <div className="flex items-center flex-1">
                    <span className="text-2xl mr-3">{getGatewayIcon(gateway)}</span>
                    <div>
                      <h4 className="text-white font-medium">{getGatewayName(gateway)}</h4>
                      <p className="text-white/60 text-sm">
                        {gateway === 'paystack' && 'Best for Nigerian transactions'}
                        {gateway === 'stripe' && 'Global payment processing'}
                        {gateway === 'paypal' && 'Worldwide digital payments'}
                      </p>
                    </div>
                  </div>
                  {selectedGateway === gateway && (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Security Notice */}
        <div className={`${theme === 'professional' ? 'bg-gray-700/30' : 'bg-white/5'} rounded-lg p-4 border ${theme === 'professional' ? 'border-gray-600/30' : 'border-white/10'} mb-6`}>
          <div className="flex items-center">
            <Shield className="w-5 h-5 text-green-500 mr-2" />
            <span className="text-white/70 text-sm">
              Your payment is secured with 256-bit SSL encryption
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4">
          <button
            onClick={onCancel}
            className="flex-1 py-3 px-6 border border-gray-600 rounded-lg text-white hover:bg-gray-700/50 transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handlePayment}
            disabled={loading || (!amount && type === 'deposit') || !selectedGateway}
            className={`flex-1 py-3 px-6 rounded-lg text-white font-medium transition-all duration-200 ${buttonClass} disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </div>
            ) : (
              `Pay ${formatCurrency(type === 'package_purchase' && packageDetails ? packageDetails.price : amount, user?.currency || 'NGN')}`
            )}
          </button>
        </div>

        {/* Additional Information */}
        <div className="mt-6 text-center">
          <p className="text-white/50 text-xs">
            By proceeding, you agree to our{' '}
            <a href="/terms" className="text-blue-400 hover:underline">Terms of Service</a>{' '}
            and{' '}
            <a href="/privacy" className="text-blue-400 hover:underline">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentGateway;
