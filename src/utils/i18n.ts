type TranslationKey = string;
type TranslationValue = string | Record<string, string>;
type Translations = Record<string, Record<TranslationKey, TranslationValue>>;

type I18nConfig = {
  defaultLocale: string;
  fallbackLocale: string;
  supportedLocales: string[];
  translations: Translations;
  interpolation?: {
    prefix?: string;
    suffix?: string;
  };
  numberFormat?: Intl.NumberFormatOptions;
  dateTimeFormat?: Intl.DateTimeFormatOptions;
  pluralRules?: Intl.PluralRulesOptions;
};

export class I18nManager {
  private static instance: I18nManager;
  private config: I18nConfig;
  private currentLocale: string;
  private numberFormatters: Map<string, Intl.NumberFormat> = new Map();
  private dateTimeFormatters: Map<string, Intl.DateTimeFormat> = new Map();
  private pluralRules: Map<string, Intl.PluralRules> = new Map();

  private constructor(config: I18nConfig) {
    this.config = {
      interpolation: {
        prefix: '{{',
        suffix: '}}',
        ...config.interpolation
      },
      numberFormat: {
        style: 'decimal',
        ...config.numberFormat
      },
      dateTimeFormat: {
        dateStyle: 'medium',
        timeStyle: 'medium',
        ...config.dateTimeFormat
      },
      pluralRules: {
        type: 'cardinal',
        ...config.pluralRules
      },
      ...config
    };
    this.currentLocale = this.config.defaultLocale;
    this.initializeFormatters();
  }

  static getInstance(config?: I18nConfig): I18nManager {
    if (!I18nManager.instance && config) {
      I18nManager.instance = new I18nManager(config);
    }
    return I18nManager.instance;
  }

  // Initialize formatters for the current locale
  private initializeFormatters(): void {
    this.config.supportedLocales.forEach(locale => {
      this.numberFormatters.set(
        locale,
        new Intl.NumberFormat(locale, this.config.numberFormat)
      );
      this.dateTimeFormatters.set(
        locale,
        new Intl.DateTimeFormat(locale, this.config.dateTimeFormat)
      );
      this.pluralRules.set(
        locale,
        new Intl.PluralRules(locale, this.config.pluralRules)
      );
    });
  }

  // Get current locale
  getCurrentLocale(): string {
    return this.currentLocale;
  }

  // Set current locale
  setLocale(locale: string): void {
    if (!this.config.supportedLocales.includes(locale)) {
      console.warn(`Locale ${locale} is not supported. Using fallback locale.`);
      locale = this.config.fallbackLocale;
    }
    this.currentLocale = locale;
  }

  // Get supported locales
  getSupportedLocales(): string[] {
    return this.config.supportedLocales;
  }

  // Add translations for a locale
  addTranslations(locale: string, translations: Record<TranslationKey, TranslationValue>): void {
    if (!this.config.translations[locale]) {
      this.config.translations[locale] = {};
    }
    this.config.translations[locale] = {
      ...this.config.translations[locale],
      ...translations
    };
  }

  // Get translation
  private getTranslation(key: TranslationKey, locale: string): TranslationValue | undefined {
    return (
      this.config.translations[locale]?.[key] ||
      this.config.translations[this.config.fallbackLocale]?.[key]
    );
  }

  // Interpolate variables in translation
  private interpolate(text: string, variables?: Record<string, any>): string {
    if (!variables) return text;

    const { prefix, suffix } = this.config.interpolation;
    return text.replace(
      new RegExp(`${prefix}\\s*([\\w.]+)\\s*${suffix}`, 'g'),
      (_, key) => variables[key]?.toString() ?? ''
    );
  }

  // Translate text
  translate(
    key: TranslationKey,
    variables?: Record<string, any>,
    locale?: string
  ): string {
    const targetLocale = locale || this.currentLocale;
    const translation = this.getTranslation(key, targetLocale);

    if (!translation) {
      console.warn(`Translation not found for key: ${key}`);
      return key;
    }

    if (typeof translation === 'string') {
      return this.interpolate(translation, variables);
    }

    // Handle plural forms
    if (variables?.count !== undefined) {
      const pluralRule = this.pluralRules
        .get(targetLocale)
        ?.select(variables.count);
      return this.interpolate(translation[pluralRule] || translation.other, variables);
    }

    return this.interpolate(translation.other || Object.values(translation)[0], variables);
  }

  // Format number
  formatNumber(value: number, options?: Intl.NumberFormatOptions, locale?: string): string {
    const targetLocale = locale || this.currentLocale;
    const formatter = options
      ? new Intl.NumberFormat(targetLocale, { ...this.config.numberFormat, ...options })
      : this.numberFormatters.get(targetLocale);

    return formatter.format(value);
  }

  // Format currency
  formatCurrency(value: number, currency: string, locale?: string): string {
    return this.formatNumber(
      value,
      {
        style: 'currency',
        currency
      },
      locale
    );
  }

  // Format date
  formatDate(
    value: Date | number | string,
    options?: Intl.DateTimeFormatOptions,
    locale?: string
  ): string {
    const targetLocale = locale || this.currentLocale;
    const date = value instanceof Date ? value : new Date(value);
    const formatter = options
      ? new Intl.DateTimeFormat(targetLocale, { ...this.config.dateTimeFormat, ...options })
      : this.dateTimeFormatters.get(targetLocale);

    return formatter.format(date);
  }

  // Format relative time
  formatRelativeTime(
    value: number,
    unit: Intl.RelativeTimeFormatUnit,
    locale?: string
  ): string {
    const targetLocale = locale || this.currentLocale;
    const formatter = new Intl.RelativeTimeFormat(targetLocale, {
      numeric: 'auto'
    });

    return formatter.format(value, unit);
  }

  // Format list
  formatList(items: string[], type: 'conjunction' | 'disjunction' = 'conjunction', locale?: string): string {
    const targetLocale = locale || this.currentLocale;
    const formatter = new Intl.ListFormat(targetLocale, { type });

    return formatter.format(items);
  }

  // Get plural rule
  getPluralRule(count: number, locale?: string): string {
    const targetLocale = locale || this.currentLocale;
    const rules = this.pluralRules.get(targetLocale);
    return rules ? rules.select(count) : 'other';
  }

  // Check if locale is RTL
  isRTL(locale?: string): boolean {
    const targetLocale = locale || this.currentLocale;
    return [
      'ar',
      'fa',
      'he',
      'ps',
      'ur'
    ].some(rtlLocale => targetLocale.startsWith(rtlLocale));
  }

  // Get text direction
  getTextDirection(locale?: string): 'rtl' | 'ltr' {
    return this.isRTL(locale) ? 'rtl' : 'ltr';
  }

  // Check if Web Internationalization API is supported
  static isSupported(): boolean {
    return (
      typeof Intl !== 'undefined' &&
      'NumberFormat' in Intl &&
      'DateTimeFormat' in Intl &&
      'PluralRules' in Intl &&
      'RelativeTimeFormat' in Intl &&
      'ListFormat' in Intl
    );
  }
}

// Example usage:
/*
// Create i18n manager instance
const i18n = I18nManager.getInstance({
  defaultLocale: 'en',
  fallbackLocale: 'en',
  supportedLocales: ['en', 'es', 'fr'],
  translations: {
    en: {
      greeting: 'Hello, {{name}}!',
      items: {
        one: '{{count}} item',
        other: '{{count}} items'
      }
    },
    es: {
      greeting: '¡Hola, {{name}}!',
      items: {
        one: '{{count}} artículo',
        other: '{{count}} artículos'
      }
    }
  }
});

// Set locale
i18n.setLocale('es');

// Translate text
const greeting = i18n.translate('greeting', { name: 'John' });

// Format number
const number = i18n.formatNumber(1234.56);

// Format currency
const price = i18n.formatCurrency(99.99, 'USD');

// Format date
const date = i18n.formatDate(new Date());

// Format relative time
const relativeTime = i18n.formatRelativeTime(-2, 'day');

// Format list
const list = i18n.formatList(['apple', 'banana', 'orange']);

// Get plural rule
const pluralRule = i18n.getPluralRule(5);

// Check if RTL
const isRTL = i18n.isRTL();
*/