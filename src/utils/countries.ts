import countries from 'world-countries';
import { parsePhoneNumber, getCountryCallingCode } from 'libphonenumber-js';

export interface Country {
  code: string;
  name: string;
  flag: string;
  phoneCode: string;
  currency: string;
}

const getCountryFlag = (countryCode: string): string => {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

export const getAllCountries = (): Country[] => {
  return countries
    .map(country => {
      let phoneCode = '';
      try {
        phoneCode = '+' + getCountryCallingCode(country.cca2 as any);
      } catch (error) {
        phoneCode = '';
      }

      return {
        code: country.cca2,
        name: country.name.common,
        flag: getCountryFlag(country.cca2),
        phoneCode,
        currency: country.currencies ? Object.keys(country.currencies)[0] : 'USD'
      };
    })
    .filter(country => country.phoneCode !== '')
    .sort((a, b) => a.name.localeCompare(b.name));
};

export const detectUserCountry = (): string => {
  try {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const countryFromTimezone = getCountryFromTimezone(timeZone);
    if (countryFromTimezone) {
      return countryFromTimezone;
    }

    const userLanguages = navigator.languages;
    for (const language of userLanguages) {
      const parts = language.split('-');
      if (parts.length > 1) {
        const countryCode = parts[1].toUpperCase();
        const country = getAllCountries().find(c => c.code === countryCode);
        if (country) {
          return countryCode;
        }
      }
    }
    return 'US';
  } catch (error) {
    console.error('Error detecting user country:', error);
    return 'US';
  }
};

const getCountryFromTimezone = (timeZone: string): string | null => {
  const timezoneToCountry: { [key: string]: string } = {
    'America/New_York': 'US',
    'America/Chicago': 'US',
    'America/Denver': 'US',
    'America/Los_Angeles': 'US',
    'America/Toronto': 'CA',
    'America/Vancouver': 'CA',
    'Europe/London': 'GB',
    'Europe/Paris': 'FR',
    'Europe/Berlin': 'DE',
    'Europe/Rome': 'IT',
    'Europe/Madrid': 'ES',
    'Europe/Amsterdam': 'NL',
    'Europe/Brussels': 'BE',
    'Europe/Zurich': 'CH',
    'Europe/Stockholm': 'SE',
    'Europe/Oslo': 'NO',
    'Europe/Copenhagen': 'DK',
    'Asia/Tokyo': 'JP',
    'Asia/Seoul': 'KR',
    'Asia/Shanghai': 'CN',
    'Asia/Kolkata': 'IN',
    'Asia/Dubai': 'AE',
    'Asia/Singapore': 'SG',
    'Asia/Hong_Kong': 'HK',
    'Australia/Sydney': 'AU',
    'Australia/Melbourne': 'AU',
    'Africa/Cairo': 'EG',
    'Africa/Lagos': 'NG',
    'Africa/Nairobi': 'KE',
    'Africa/Johannesburg': 'ZA',
    'America/Sao_Paulo': 'BR',
    'America/Mexico_City': 'MX',
    'America/Argentina/Buenos_Aires': 'AR'
  };

  return timezoneToCountry[timeZone] || null;
};

export const validatePhoneNumber = (phoneNumber: string, countryCode: string): boolean => {
  try {
    const parsed = parsePhoneNumber(phoneNumber, countryCode as any);
    return parsed ? parsed.isValid() : false;
  } catch (error) {
    return false;
  }
};

export const formatPhoneNumber = (phoneNumber: string, countryCode: string): string => {
  try {
    const parsed = parsePhoneNumber(phoneNumber, countryCode as any);
    return parsed ? parsed.formatInternational() : phoneNumber;
  } catch (error) {
    return phoneNumber;
  }
};
