type CookieOptions = {
  expires?: number | Date;
  path?: string;
  domain?: string;
  secure?: boolean;
  sameSite?: 'Strict' | 'Lax' | 'None';
  encrypt?: boolean;
};

export class Cookie {
  private static readonly ENCRYPTION_KEY = 'your-secret-key'; // Should be environment variable

  // Set a cookie
  static set(name: string, value: string, options: CookieOptions = {}): void {
    const {
      expires,
      path = '/',
      domain,
      secure = true,
      sameSite = 'Strict',
      encrypt = false
    } = options;

    let cookieValue = encrypt ? this.encrypt(value) : value;
    cookieValue = encodeURIComponent(cookieValue);

    let cookieString = `${name}=${cookieValue}`;

    if (expires) {
      const expirationDate = typeof expires === 'number'
        ? new Date(Date.now() + expires)
        : expires;
      cookieString += `; expires=${expirationDate.toUTCString()}`;
    }

    if (path) cookieString += `; path=${path}`;
    if (domain) cookieString += `; domain=${domain}`;
    if (secure) cookieString += '; secure';
    if (sameSite) cookieString += `; samesite=${sameSite}`;

    document.cookie = cookieString;
  }

  // Get a cookie
  static get(name: string, decrypt = false): string | null {
    const cookies = document.cookie.split('; ');
    const cookie = cookies.find(c => c.startsWith(`${name}=`));

    if (!cookie) return null;

    let value = decodeURIComponent(cookie.split('=')[1]);
    return decrypt ? this.decrypt(value) : value;
  }

  // Remove a cookie
  static remove(name: string, options: Omit<CookieOptions, 'expires' | 'encrypt'> = {}): void {
    const {
      path = '/',
      domain,
      secure = true,
      sameSite = 'Strict'
    } = options;

    this.set(name, '', {
      ...options,
      expires: new Date(0)
    });
  }

  // Check if a cookie exists
  static has(name: string): boolean {
    return this.get(name) !== null;
  }

  // Get all cookies
  static getAll(): { [key: string]: string } {
    return document.cookie
      .split('; ')
      .reduce((acc, cookie) => {
        if (cookie) {
          const [name, value] = cookie.split('=');
          acc[name] = decodeURIComponent(value);
        }
        return acc;
      }, {} as { [key: string]: string });
  }

  // Remove all cookies
  static clear(options: Omit<CookieOptions, 'expires' | 'encrypt'> = {}): void {
    const cookies = this.getAll();
    Object.keys(cookies).forEach(name => {
      this.remove(name, options);
    });
  }

  // Set multiple cookies at once
  static setMultiple(
    cookies: { [key: string]: string },
    options: CookieOptions = {}
  ): void {
    Object.entries(cookies).forEach(([name, value]) => {
      this.set(name, value, options);
    });
  }

  // Get multiple cookies at once
  static getMultiple(
    names: string[],
    decrypt = false
  ): { [key: string]: string | null } {
    return names.reduce((acc, name) => {
      acc[name] = this.get(name, decrypt);
      return acc;
    }, {} as { [key: string]: string | null });
  }

  // Remove multiple cookies at once
  static removeMultiple(
    names: string[],
    options: Omit<CookieOptions, 'expires' | 'encrypt'> = {}
  ): void {
    names.forEach(name => {
      this.remove(name, options);
    });
  }

  // Private encryption method
  private static encrypt(value: string): string {
    try {
      // Simple XOR encryption for demo purposes
      // In production, use a proper encryption library
      return value
        .split('')
        .map(char =>
          String.fromCharCode(
            char.charCodeAt(0) ^ this.ENCRYPTION_KEY.charCodeAt(0)
          )
        )
        .join('');
    } catch (error) {
      console.error('Cookie encryption error:', error);
      return value;
    }
  }

  // Private decryption method
  private static decrypt(value: string): string {
    try {
      // Simple XOR decryption (same as encryption)
      return this.encrypt(value);
    } catch (error) {
      console.error('Cookie decryption error:', error);
      return value;
    }
  }
}

// Example usage:
/*
// Set individual cookies
Cookie.set('userId', '123', {
  expires: 7 * 24 * 60 * 60 * 1000, // 7 days
  secure: true,
  sameSite: 'Strict',
  encrypt: true
});

Cookie.set('theme', 'dark', {
  expires: new Date('2024-12-31'),
  path: '/'
});

// Get cookies
const userId = Cookie.get('userId', true); // decrypt=true
const theme = Cookie.get('theme');

// Check cookie existence
const hasUserId = Cookie.has('userId');

// Set multiple cookies
Cookie.setMultiple({
  lang: 'en',
  region: 'US'
}, {
  secure: true,
  sameSite: 'Strict'
});

// Get multiple cookies
const values = Cookie.getMultiple(['lang', 'region']);

// Remove specific cookies
Cookie.remove('userId');
Cookie.removeMultiple(['lang', 'region']);

// Get all cookies
const allCookies = Cookie.getAll();

// Clear all cookies
Cookie.clear();
*/