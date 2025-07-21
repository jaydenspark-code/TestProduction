import React from 'react';
import { CurrencyRates, PaymentInfo, Country } from '../types';

const CURRENCY_SYMBOLS: { [key: string]: string } = {
  USD: '$',
  GHS: '₵',
  NGN: '₦',
  KES: 'KSh',
  UGX: 'USh',
  TZS: 'TSh',
  ZAR: 'R',
  EGP: 'E£',
  MAD: 'MAD',
  TND: 'TND',
  DZD: 'DZD',
  GBP: '£',
  EUR: '€',
  CAD: 'C$',
  AUD: 'A$',
  INR: '₹'
};

// Fallback exchange rates (USD base)
const FALLBACK_RATES: CurrencyRates = {
  USD: 1,
  GHS: 12.5,
  NGN: 800,
  KES: 150,
  UGX: 3700,
  TZS: 2500,
  ZAR: 18.5,
  EGP: 31,
  MAD: 10.2,
  TND: 3.1,
  DZD: 135,
  GBP: 0.79,
  EUR: 0.85,
  CAD: 1.36,
  AUD: 1.52,
  INR: 83
};

export const COUNTRIES: Country[] = [
  { code: 'US', name: 'United States', currency: 'USD', flag: '🇺🇸', phoneCode: '+1' },
  { code: 'GH', name: 'Ghana', currency: 'GHS', flag: '🇬🇭', phoneCode: '+233' },
  { code: 'NG', name: 'Nigeria', currency: 'NGN', flag: '🇳🇬', phoneCode: '+234' },
  { code: 'KE', name: 'Kenya', currency: 'KES', flag: '🇰🇪', phoneCode: '+254' },
  { code: 'UG', name: 'Uganda', currency: 'UGX', flag: '🇺🇬', phoneCode: '+256' },
  { code: 'TZ', name: 'Tanzania', currency: 'TZS', flag: '🇹🇿', phoneCode: '+255' },
  { code: 'ZA', name: 'South Africa', currency: 'ZAR', flag: '🇿🇦', phoneCode: '+27' },
  { code: 'EG', name: 'Egypt', currency: 'EGP', flag: '🇪🇬', phoneCode: '+20' },
  { code: 'MA', name: 'Morocco', currency: 'MAD', flag: '🇲🇦', phoneCode: '+212' },
  { code: 'TN', name: 'Tunisia', currency: 'TND', flag: '🇹🇳', phoneCode: '+216' },
  { code: 'DZ', name: 'Algeria', currency: 'DZD', flag: '🇩🇿', phoneCode: '+213' },
  { code: 'GB', name: 'United Kingdom', currency: 'GBP', flag: '🇬🇧', phoneCode: '+44' },
  { code: 'EU', name: 'European Union', currency: 'EUR', flag: '🇪🇺', phoneCode: '+33' },
  { code: 'CA', name: 'Canada', currency: 'CAD', flag: '🇨🇦', phoneCode: '+1' },
  { code: 'AU', name: 'Australia', currency: 'AUD', flag: '🇦🇺', phoneCode: '+61' },
  { code: 'IN', name: 'India', currency: 'INR', flag: '🇮🇳', phoneCode: '+91' }
];

export const getCurrencySymbol = (currency: string): string => {
  return CURRENCY_SYMBOLS[currency] || '$';
};

export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  const symbol = getCurrencySymbol(currency);
  return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// Enhanced dual currency display with proper styling
export const formatDualCurrency = (usdAmount: number, userCurrency: string): string => {
  if (userCurrency === 'USD') {
    return formatCurrency(usdAmount, 'USD');
  }
  
  const exchangeRate = FALLBACK_RATES[userCurrency] || 1;
  const localAmount = usdAmount * exchangeRate;
  
  // Return USD as primary, local currency as secondary (smaller)
  return `${formatCurrency(usdAmount, 'USD')} (${formatCurrency(localAmount, userCurrency)})`;
};

// New component for dual currency display with proper styling
export const DualCurrencyDisplay: React.FC<{ 
  usdAmount: number; 
  userCurrency: string; 
  className?: string;
  showLocalFirst?: boolean;
}> = ({ usdAmount, userCurrency, className = "", showLocalFirst = false }) => {
  if (userCurrency === 'USD') {
    return <span className={className}>{formatCurrency(usdAmount, 'USD')}</span>;
  }
  
  const exchangeRate = FALLBACK_RATES[userCurrency] || 1;
  const localAmount = usdAmount * exchangeRate;
  
  if (showLocalFirst) {
    return (
      <span className={className}>
        <span className="text-lg font-bold">{formatCurrency(localAmount, userCurrency)}</span>
        <span className="text-sm text-white/60 ml-2">({formatCurrency(usdAmount, 'USD')})</span>
      </span>
    );
  }
  
  return (
    <span className={className}>
      <span className="text-lg font-bold">{formatCurrency(usdAmount, 'USD')}</span>
      <span className="text-sm text-white/60 ml-2">({formatCurrency(localAmount, userCurrency)})</span>
    </span>
  );
};

export const convertCurrency = async (amount: number, fromCurrency: string, toCurrency: string): Promise<number> => {
  try {
    // Try to fetch real-time rates (simulated)
    const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${fromCurrency}`);
    const data = await response.json();
    const rate = data.rates[toCurrency];
    return amount * rate;
  } catch (error) {
    // Use fallback rates
    const fromRate = FALLBACK_RATES[fromCurrency] || 1;
    const toRate = FALLBACK_RATES[toCurrency] || 1;
    return (amount / fromRate) * toRate;
  }
};

export const getPaymentInfo = async (baseAmount: number, currency: string): Promise<PaymentInfo> => {
  const exchangeRate = FALLBACK_RATES[currency] || 1;
  const localAmount = baseAmount * exchangeRate;
  
  return {
    amount: baseAmount,
    currency,
    localAmount,
    exchangeRate
  };
};

export const detectUserCountry = (): string => {
  // In a real app, this would use IP geolocation
  // For demo purposes, we'll use browser locale
  const locale = navigator.language || 'en-US';
  const countryCode = locale.split('-')[1] || 'US';
  return countryCode;
};

export const getCountryCurrency = (countryCode: string): string => {
  const country = COUNTRIES.find(c => c.code === countryCode);
  return country?.currency || 'USD';
};

export const getCountryByCode = (code: string): Country | undefined => {
  return COUNTRIES.find(c => c.code === code);
};