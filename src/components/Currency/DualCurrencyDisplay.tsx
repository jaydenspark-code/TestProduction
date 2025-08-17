import React from 'react';
import { Currency, DualCurrencyDisplayProps } from '../../utils/currency';

// Dual Currency Display Component
export const DualCurrencyDisplay: React.FC<DualCurrencyDisplayProps> = ({
  usdAmount,
  userCurrency = 'USD',
  className = '',
  showApproximate = true
}) => {
  if (userCurrency === 'USD') {
    return (
      <span className={className}>
        {Currency.format(usdAmount, { currency: 'USD' })}
      </span>
    );
  }
  
  const conversionRates: { [key: string]: number } = {
    'EUR': 0.85,
    'GBP': 0.73,
    'CAD': 1.25,
    'AUD': 1.35,
    'JPY': 110,
    'CNY': 6.4,
    'INR': 74,
    'BRL': 5.2,
    'MXN': 20,
    'ZAR': 14.5,
    'NGN': 411,
    'KES': 108
  };
  
  const rate = conversionRates[userCurrency] || 1;
  const convertedAmount = usdAmount * rate;
  
  return (
    <span className={className}>
      <span className="font-semibold">
        {Currency.format(convertedAmount, { currency: userCurrency })}
      </span>
      {showApproximate && (
        <span className="text-sm opacity-75 ml-2">
          {Currency.format(usdAmount, { currency: 'USD' })}
        </span>
      )}
    </span>
  );
};

export default DualCurrencyDisplay;
