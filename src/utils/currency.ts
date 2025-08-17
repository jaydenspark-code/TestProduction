type CurrencyOptions = {
  locale?: string;
  currency?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  useGrouping?: boolean;
};

type ConversionOptions = {
  from: string;
  to: string;
  amount: number;
};

export class Currency {
  private static readonly DEFAULT_LOCALE = 'en-US';
  private static readonly DEFAULT_CURRENCY = 'USD';
  private static readonly DEFAULT_PRECISION = 2;
  private static readonly DECIMAL_MULTIPLIER = 100;

  // Format amount with currency symbol
  static format(
    amount: number,
    options: CurrencyOptions = {}
  ): string {
    const {
      locale = this.DEFAULT_LOCALE,
      currency = this.DEFAULT_CURRENCY,
      minimumFractionDigits = this.DEFAULT_PRECISION,
      maximumFractionDigits = this.DEFAULT_PRECISION,
      useGrouping = true
    } = options;

    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits,
        maximumFractionDigits,
        useGrouping
      }).format(amount);
    } catch (error) {
      console.error('Currency formatting error:', error);
      return amount.toFixed(this.DEFAULT_PRECISION);
    }
  }

  // Format amount without currency symbol
  static formatNumber(
    amount: number,
    options: Omit<CurrencyOptions, 'currency'> = {}
  ): string {
    const {
      locale = this.DEFAULT_LOCALE,
      minimumFractionDigits = this.DEFAULT_PRECISION,
      maximumFractionDigits = this.DEFAULT_PRECISION,
      useGrouping = true
    } = options;

    try {
      return new Intl.NumberFormat(locale, {
        style: 'decimal',
        minimumFractionDigits,
        maximumFractionDigits,
        useGrouping
      }).format(amount);
    } catch (error) {
      console.error('Number formatting error:', error);
      return amount.toFixed(this.DEFAULT_PRECISION);
    }
  }

  // Parse currency string to number
  static parse(value: string): number {
    if (typeof value !== 'string') {
      return 0;
    }

    // Remove currency symbols, spaces, and group separators
    const cleanValue = value.replace(/[^\d.-]/g, '');

    const parsed = parseFloat(cleanValue);
    return isNaN(parsed) ? 0 : parsed;
  }

  // Round to specific precision
  static round(
    amount: number,
    precision: number = this.DEFAULT_PRECISION
  ): number {
    const multiplier = Math.pow(10, precision);
    return Math.round(amount * multiplier) / multiplier;
  }

  // Convert minor units to major units (e.g., cents to dollars)
  static fromMinorUnits(amount: number): number {
    return amount / this.DECIMAL_MULTIPLIER;
  }

  // Convert major units to minor units (e.g., dollars to cents)
  static toMinorUnits(amount: number): number {
    return Math.round(amount * this.DECIMAL_MULTIPLIER);
  }

  // Add amounts with precision
  static add(...amounts: number[]): number {
    return this.round(
      amounts.reduce((sum, amount) => sum + (amount || 0), 0)
    );
  }

  // Subtract amounts with precision
  static subtract(amount: number, ...deductions: number[]): number {
    return this.round(
      deductions.reduce(
        (result, deduction) => result - (deduction || 0),
        amount || 0
      )
    );
  }

  // Multiply amount by factor with precision
  static multiply(amount: number, factor: number): number {
    return this.round(amount * factor);
  }

  // Divide amount by divisor with precision
  static divide(amount: number, divisor: number): number {
    if (divisor === 0) {
      throw new Error('Division by zero');
    }
    return this.round(amount / divisor);
  }

  // Calculate percentage of amount
  static percentage(amount: number, percent: number): number {
    return this.multiply(amount, percent / 100);
  }

  // Distribute amount among parts maintaining sum
  static distribute(amount: number, parts: number): number[] {
    if (parts <= 0) {
      throw new Error('Number of parts must be positive');
    }

    const base = this.round(amount / parts);
    const remainder = this.round(
      amount - base * parts
    );

    return Array(parts)
      .fill(base)
      .map((value, index) =>
        index === 0 ? this.round(value + remainder) : value
      );
  }

  // Compare amounts with precision
  static compare(a: number, b: number): number {
    const diff = this.round(a - b);
    return Math.sign(diff);
  }

  // Check if amounts are equal within precision
  static equals(a: number, b: number): boolean {
    return this.compare(a, b) === 0;
  }

  // Get currency symbol for locale
  static getSymbol(
    currency: string = this.DEFAULT_CURRENCY,
    locale: string = this.DEFAULT_LOCALE
  ): string {
    try {
      return (0)
        .toLocaleString(locale, {
          style: 'currency',
          currency,
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        })
        .replace(/[0-9]/g, '')
        .trim();
    } catch (error) {
      console.error('Currency symbol error:', error);
      return currency;
    }
  }

  // Convert between currencies using exchange rates
  static async convert(
    options: ConversionOptions
  ): Promise<number> {
    const { from, to, amount } = options;

    if (from === to) {
      return amount;
    }

    try {
      // Import the ExchangeRateService dynamically to avoid circular imports
      const { ExchangeRateService } = await import('../services/ExchangeRateService');
      return await ExchangeRateService.convertAmount(amount, from, to);
    } catch (error) {
      console.error('Currency conversion failed:', error);
      return amount; // Fallback to original amount
    }
  }
}

// Countries and utility functions
export const COUNTRIES = [
  { code: 'US', name: 'United States', flag: '🇺🇸', phoneCode: '+1', currency: 'USD' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', phoneCode: '+1', currency: 'CAD' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', phoneCode: '+44', currency: 'GBP' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', phoneCode: '+61', currency: 'AUD' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', phoneCode: '+49', currency: 'EUR' },
  { code: 'FR', name: 'France', flag: '🇫🇷', phoneCode: '+33', currency: 'EUR' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹', phoneCode: '+39', currency: 'EUR' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸', phoneCode: '+34', currency: 'EUR' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱', phoneCode: '+31', currency: 'EUR' },
  { code: 'BE', name: 'Belgium', flag: '🇧🇪', phoneCode: '+32', currency: 'EUR' },
  { code: 'CH', name: 'Switzerland', flag: '🇨🇭', phoneCode: '+41', currency: 'CHF' },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪', phoneCode: '+46', currency: 'SEK' },
  { code: 'NO', name: 'Norway', flag: '🇳🇴', phoneCode: '+47', currency: 'NOK' },
  { code: 'DK', name: 'Denmark', flag: '🇩🇰', phoneCode: '+45', currency: 'DKK' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵', phoneCode: '+81', currency: 'JPY' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷', phoneCode: '+82', currency: 'KRW' },
  { code: 'CN', name: 'China', flag: '🇨🇳', phoneCode: '+86', currency: 'CNY' },
  { code: 'IN', name: 'India', flag: '🇮🇳', phoneCode: '+91', currency: 'INR' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷', phoneCode: '+55', currency: 'BRL' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽', phoneCode: '+52', currency: 'MXN' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷', phoneCode: '+54', currency: 'ARS' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦', phoneCode: '+27', currency: 'ZAR' },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬', phoneCode: '+234', currency: 'NGN' },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪', phoneCode: '+254', currency: 'KES' },
  { code: 'EG', name: 'Egypt', flag: '🇪🇬', phoneCode: '+20', currency: 'EGP' },
  { code: 'RU', name: 'Russia', flag: '🇷🇺', phoneCode: '+7', currency: 'RUB' },
  { code: 'TR', name: 'Turkey', flag: '🇹🇷', phoneCode: '+90', currency: 'TRY' },
  { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦', phoneCode: '+966', currency: 'SAR' },
  { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪', phoneCode: '+971', currency: 'AED' },
  { code: 'IL', name: 'Israel', flag: '🇮🇱', phoneCode: '+972', currency: 'ILS' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬', phoneCode: '+65', currency: 'SGD' },
  { code: 'HK', name: 'Hong Kong', flag: '🇭🇰', phoneCode: '+852', currency: 'HKD' },
  { code: 'MY', name: 'Malaysia', flag: '🇲🇾', phoneCode: '+60', currency: 'MYR' },
  { code: 'TH', name: 'Thailand', flag: '🇹🇭', phoneCode: '+66', currency: 'THB' },
  { code: 'PH', name: 'Philippines', flag: '🇵🇭', phoneCode: '+63', currency: 'PHP' },
  { code: 'ID', name: 'Indonesia', flag: '🇮🇩', phoneCode: '+62', currency: 'IDR' },
  { code: 'VN', name: 'Vietnam', flag: '🇻🇳', phoneCode: '+84', currency: 'VND' }
];

// Detect user country based on timezone/locale (simplified)
export function detectUserCountry(): string {
  try {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const locale = navigator.language;
    
    // Simple mapping based on locale
    if (locale.startsWith('en-US')) return 'US';
    if (locale.startsWith('en-CA')) return 'CA';
    if (locale.startsWith('en-GB')) return 'GB';
    if (locale.startsWith('en-AU')) return 'AU';
    if (locale.startsWith('de')) return 'DE';
    if (locale.startsWith('fr')) return 'FR';
    if (locale.startsWith('es')) return 'ES';
    if (locale.startsWith('it')) return 'IT';
    if (locale.startsWith('nl')) return 'NL';
    if (locale.startsWith('ja')) return 'JP';
    if (locale.startsWith('ko')) return 'KR';
    if (locale.startsWith('zh')) return 'CN';
    if (locale.startsWith('pt-BR')) return 'BR';
    if (locale.startsWith('pt')) return 'BR';
    
    // Fallback to US
    return 'US';
  } catch (error) {
    console.error('Error detecting user country:', error);
    return 'US';
  }
}

// Format currency (simple wrapper for Currency.format)
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return Currency.format(amount, { currency });
}

// Format dual currency display with real-time exchange rates
export async function formatDualCurrency(usdAmount: number, targetCurrency: string = 'USD'): Promise<string> {
  if (targetCurrency === 'USD') {
    return Currency.format(usdAmount, { currency: 'USD' });
  }
  
  try {
    const convertedAmount = await Currency.convert({
      from: 'USD',
      to: targetCurrency,
      amount: usdAmount
    });
    
    const usdFormatted = Currency.format(usdAmount, { currency: 'USD' });
    const targetFormatted = Currency.format(convertedAmount, { currency: targetCurrency });
    
    return `${usdFormatted} (${targetFormatted})`;
  } catch (error) {
    console.error('Error formatting dual currency:', error);
    // Fallback to static rates if real-time conversion fails
    return formatDualCurrencyFallback(usdAmount, targetCurrency);
  }
}

// Fallback function with static rates (updated February 2025)
export function formatDualCurrencyFallback(usdAmount: number, targetCurrency: string = 'USD'): string {
  if (targetCurrency === 'USD') {
    return Currency.format(usdAmount, { currency: 'USD' });
  }
  
  const conversionRates: { [key: string]: number } = {
    'EUR': 0.9270,
    'GBP': 0.7530,    // $15 = £11.30
    'CAD': 1.4350,
    'AUD': 1.6180,
    'JPY': 156.20,
    'CNY': 7.2850,
    'INR': 85.40,
    'BRL': 6.1250,
    'MXN': 20.450,
    'ZAR': 18.750,
    'NGN': 1529.01,   // $15 = ₦22,935.15
    'KES': 129.85,
    'GHS': 10.45,     // $15 = GH₵156.75
    'EGP': 49.850,
    'RUB': 97.650,
    'TRY': 35.280,
    'SAR': 3.7500,
    'AED': 3.6725,
    'ILS': 3.6850,
    'SGD': 1.3685,
    'HKD': 7.7720,
    'MYR': 4.4950,
    'THB': 34.520,
    'PHP': 58.350,
    'IDR': 16240,
    'VND': 24680,
    'KRW': 1445.5,
    'NOK': 11.280,
    'SEK': 11.150,
    'DKK': 6.9140,
    'CHF': 0.9125,
    'PLN': 4.1850,
    'CZK': 24.680,
    'HUF': 393.50,
    'RON': 4.9750
  };
  
  const rate = conversionRates[targetCurrency] || 1;
  const convertedAmount = usdAmount * rate;
  
  const usdFormatted = Currency.format(usdAmount, { currency: 'USD' });
  const targetFormatted = Currency.format(convertedAmount, { currency: targetCurrency });
  
  return `${usdFormatted} (${targetFormatted})`;
}

// Synchronous version for components that can't handle async
export function formatDualCurrencySync(usdAmount: number, targetCurrency: string = 'USD'): string {
  return formatDualCurrencyFallback(usdAmount, targetCurrency);
}

// Dual Currency Display Component Props (for separate component file)
export interface DualCurrencyDisplayProps {
  usdAmount: number;
  userCurrency?: string;
  className?: string;
  showApproximate?: boolean;
}

// Re-export DualCurrencyDisplay from separate component file
export { DualCurrencyDisplay } from '../components/Currency/DualCurrencyDisplay';

// Export Currency class as default
export default Currency;
