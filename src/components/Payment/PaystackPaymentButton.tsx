import React from 'react';
import { DollarSign } from 'lucide-react';

interface PaystackPaymentButtonProps {
  amount: number;
  currency: string;
  onSuccess: (transaction: any) => void;
  onError: (error: any) => void;
  disabled?: boolean;
  userEmail?: string;
}

const PaystackPaymentButton: React.FC<PaystackPaymentButtonProps> = ({
  amount,
  currency,
  onSuccess,
  onError,
  disabled = false,
  userEmail
}) => {
  const handlePaystackPayment = () => {
    // For now, let's show a placeholder
    console.log('Paystack payment initiated for:', { amount, currency, userEmail });
    
    // Simulate successful payment for testing
    setTimeout(() => {
      onSuccess({
        reference: 'paystack_' + Date.now(),
        status: 'success',
        trans: Date.now().toString(),
        transaction: Date.now().toString(),
        trxref: 'paystack_' + Date.now(),
        message: 'Payment successful via Paystack'
      });
    }, 2000);
  };

  return (
    <button
      onClick={handlePaystackPayment}
      disabled={disabled}
      className={`w-full flex items-center justify-center space-x-3 px-6 py-4 rounded-lg border-2 transition-all duration-200 ${
        disabled
          ? 'bg-gray-300 border-gray-300 cursor-not-allowed'
          : 'bg-green-600 hover:bg-green-700 border-green-600 hover:border-green-700 text-white'
      }`}
    >
      <DollarSign className="w-5 h-5" />
      <span className="font-medium">
        Pay {currency} {amount.toFixed(2)} with Paystack
      </span>
    </button>
  );
};

export default PaystackPaymentButton;
