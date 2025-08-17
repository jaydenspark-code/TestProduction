import axios from 'axios';

// Primary API (free, no API key required)
const PRIMARY_API_URL = 'https://cdn.jsdelivr.net/gh/fawazahmed0/currency-api@1/latest/currencies';

// Fallback API
const FALLBACK_API_URL = 'https://api.exchangerate-api.com/v4/latest';

// Cache for exchange rates (valid for 1 hour)
interface ExchangeRateCache {
  rates: { [key: string]: number };
  timestamp: number;
  baseCurrency: string;
}

const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds
const rateCache = new Map<string, ExchangeRateCache>();

// Fallback rates (updated as of February 2025 - current accurate rates)
const FALLBACK_RATES: { [key: string]: number } = {
  'USD': 1.0000,
  'EUR': 0.9270,
  'GBP': 0.7530,  // Updated: $15 = £11.30
  'CAD': 1.4350,
  'AUD': 1.6180,
  'JPY': 156.20,
  'CNY': 7.2850,
  'INR': 85.40,
  'BRL': 6.1250,
  'MXN': 20.450,
  'ZAR': 18.750,
  'NGN': 1529.01, // Updated: $15 = ₦22,935.15
  'KES': 129.85,
  'GHS': 10.45,   // Updated: $15 = GH₵156.75
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
  'RON': 4.9750,
  'BGN': 1.8140,
  'HRK': 6.9850,  // Note: Croatia uses EUR now, but keeping for reference
  'ISK': 141.50,
  'NZD': 1.7280,
  'CLP': 985.50,
  'COP': 4385.0,
  'PEN': 3.7850,
  'UYU': 43.950,
  'BOB': 6.9100,
  'GTQ': 7.7450,
  'HNL': 25.150,
  'NIO': 36.850,
  'CRC': 512.50,
  'PAB': 1.0000,
  'DOP': 60.450,
  'JMD': 157.85,
  'TTD': 6.7850,
  'BBD': 2.0000,
  'BZD': 2.0150,
  'SRD': 35.850,
  'GYD': 209.50,
  'FJD': 2.2950,
  'PGK': 4.0150,
  'SBD': 8.4250,
  'TOP': 2.3850,
  'VUV': 122.50,
  'WST': 2.7350,
  // Additional African currencies
  'XOF': 606.50,  // West African CFA Franc
  'XAF': 606.50,  // Central African CFA Franc
  'MAD': 10.125,  // Moroccan Dirham
  'TND': 3.1850,  // Tunisian Dinar
  'DZD': 135.50,  // Algerian Dinar
  'ETB': 127.50,  // Ethiopian Birr
  'UGX': 3685.0,  // Ugandan Shilling
  'TZS': 2485.0,  // Tanzanian Shilling
  'RWF': 1385.0,  // Rwandan Franc
  'MWK': 1735.0,  // Malawian Kwacha
  'ZMW': 27.850,  // Zambian Kwacha
  'BWP': 13.950,  // Botswana Pula
  'SZL': 18.750,  // Swazi Lilangeni
  'LSL': 18.750,  // Lesotho Loti
  'NAD': 18.750,  // Namibian Dollar
  'MZN': 63.850,  // Mozambican Metical
  'AOA': 927.50,  // Angolan Kwanza
  'GMD': 71.250,  // Gambian Dalasi
  'SLL': 22150,   // Sierra Leonean Leone
  'LRD': 193.50,  // Liberian Dollar
  'CVE': 102.15   // Cape Verdean Escudo
};

export class ExchangeRateService {
  private static getCacheKey(baseCurrency: string): string {
    return `rates_${baseCurrency.toUpperCase()}`;
  }

  private static isValidCache(cache: ExchangeRateCache): boolean {
    return Date.now() - cache.timestamp < CACHE_DURATION;
  }

  private static async fetchFromPrimaryAPI(baseCurrency: string): Promise<{ [key: string]: number } | null> {
    try {
      const url = `${PRIMARY_API_URL}/${baseCurrency.toLowerCase()}.json`;
      console.log(`Fetching from primary API: ${url}`);
      
      const response = await axios.get(url, { timeout: 5000 });
      
      console.log('Primary API response structure:', Object.keys(response.data || {}));
      
      if (response.data && response.data[baseCurrency.toLowerCase()]) {
        console.log(`Primary API returned rates for ${baseCurrency}:`, Object.keys(response.data[baseCurrency.toLowerCase()]).slice(0, 5));
        return response.data[baseCurrency.toLowerCase()];
      }
      
      console.warn('Primary API: No data found for currency', baseCurrency);
      return null;
    } catch (error) {
      console.warn('Primary exchange rate API failed:', error.message);
      return null;
    }
  }

  private static async fetchFromFallbackAPI(baseCurrency: string): Promise<{ [key: string]: number } | null> {
    try {
      const response = await axios.get(
        `${FALLBACK_API_URL}/${baseCurrency.toUpperCase()}`,
        { timeout: 5000 }
      );
      
      if (response.data && response.data.rates) {
        return response.data.rates;
      }
      return null;
    } catch (error) {
      console.warn('Fallback exchange rate API failed:', error);
      return null;
    }
  }

  private static getFallbackRates(baseCurrency: string): { [key: string]: number } {
    const baseRate = FALLBACK_RATES[baseCurrency.toUpperCase()] || 1;
    const rates: { [key: string]: number } = {};
    
    Object.entries(FALLBACK_RATES).forEach(([currency, rate]) => {
      rates[currency] = rate / baseRate;
    });
    
    return rates;
  }

  static async getAllRates(baseCurrency: string = 'USD'): Promise<{ [key: string]: number }> {
    const cacheKey = this.getCacheKey(baseCurrency);
    const cached = rateCache.get(cacheKey);

    // Return cached rates if still valid
    if (cached && this.isValidCache(cached)) {
      return cached.rates;
    }

    // Try primary API first
    let rates = await this.fetchFromPrimaryAPI(baseCurrency);
    
    // Try fallback API if primary fails
    if (!rates) {
      rates = await this.fetchFromFallbackAPI(baseCurrency);
    }

    // Use fallback rates if both APIs fail
    if (!rates) {
      console.warn('Both exchange rate APIs failed, using fallback rates');
      rates = this.getFallbackRates(baseCurrency);
    }

    // Cache the rates
    rateCache.set(cacheKey, {
      rates,
      timestamp: Date.now(),
      baseCurrency: baseCurrency.toUpperCase()
    });

    return rates;
  }

  static async getConversionRate(baseCurrency: string, targetCurrency: string): Promise<number> {
    try {
      if (baseCurrency.toUpperCase() === targetCurrency.toUpperCase()) {
        return 1;
      }

      const rates = await this.getAllRates(baseCurrency);
      const rate = rates[targetCurrency.toUpperCase()];
      
      if (rate && !isNaN(rate) && rate > 0) {
        return rate;
      }

      // If direct rate not found, try reverse conversion
      if (baseCurrency.toUpperCase() !== 'USD') {
        const usdRates = await this.getAllRates('USD');
        const baseToUSD = usdRates[baseCurrency.toUpperCase()];
        const targetToUSD = usdRates[targetCurrency.toUpperCase()];
        
        if (baseToUSD && targetToUSD && baseToUSD > 0) {
          return targetToUSD / baseToUSD;
        }
      }

      console.warn(`No conversion rate found for ${baseCurrency} to ${targetCurrency}`);
      return 1; // Fallback to 1:1
    } catch (error) {
      console.error('Error fetching conversion rate:', error);
      return 1;
    }
  }

  static async convertAmount(amount: number, fromCurrency: string, toCurrency: string): Promise<number> {
    const rate = await this.getConversionRate(fromCurrency, toCurrency);
    return Math.round((amount * rate) * 100) / 100; // Round to 2 decimal places
  }

  static clearCache(): void {
    rateCache.clear();
  }

  static getCacheInfo(): { size: number; entries: Array<{ key: string; timestamp: Date; baseCurrency: string }> } {
    const entries = Array.from(rateCache.entries()).map(([key, cache]) => ({
      key,
      timestamp: new Date(cache.timestamp),
      baseCurrency: cache.baseCurrency
    }));

    return {
      size: rateCache.size,
      entries
    };
  }
}

