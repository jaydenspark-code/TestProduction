type HashAlgorithm = 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512';

type EncryptionAlgorithm = {
  name: string;
  length?: number;
  hash?: HashAlgorithm;
};

type KeyPair = {
  publicKey: CryptoKey;
  privateKey: CryptoKey;
};

type SecurityConfig = {
  defaultHashAlgorithm: HashAlgorithm;
  defaultEncryptionAlgorithm: EncryptionAlgorithm;
  defaultKeyLength: number;
  defaultIterations: number;
  defaultSaltLength: number;
};

export class SecurityManager {
  private static instance: SecurityManager;
  private config: SecurityConfig = {
    defaultHashAlgorithm: 'SHA-256',
    defaultEncryptionAlgorithm: {
      name: 'AES-GCM',
      length: 256
    },
    defaultKeyLength: 256,
    defaultIterations: 100000,
    defaultSaltLength: 16
  };

  private constructor() {}

  static getInstance(): SecurityManager {
    if (!SecurityManager.instance) {
      SecurityManager.instance = new SecurityManager();
    }
    return SecurityManager.instance;
  }

  // Configure security settings
  configure(config: Partial<SecurityConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // Generate random bytes
  async generateRandomBytes(length: number): Promise<Uint8Array> {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return array;
  }

  // Generate random string
  async generateRandomString(length: number): Promise<string> {
    const bytes = await this.generateRandomBytes(length);
    return Array.from(bytes)
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('');
  }

  // Generate salt
  async generateSalt(length = this.config.defaultSaltLength): Promise<Uint8Array> {
    return this.generateRandomBytes(length);
  }

  // Hash data
  async hash(
    data: string | ArrayBuffer,
    algorithm: HashAlgorithm = this.config.defaultHashAlgorithm
  ): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = data instanceof ArrayBuffer ? data : encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest(algorithm, dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Generate key from password
  async generateKeyFromPassword(
    password: string,
    salt: Uint8Array,
    iterations = this.config.defaultIterations,
    keyLength = this.config.defaultKeyLength
  ): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations,
        hash: this.config.defaultHashAlgorithm
      },
      keyMaterial,
      this.config.defaultEncryptionAlgorithm,
      false,
      ['encrypt', 'decrypt']
    );
  }

  // Generate key pair
  async generateKeyPair(): Promise<KeyPair> {
    const keyPair = await crypto.subtle.generateKey(
      {
        name: 'RSA-OAEP',
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: this.config.defaultHashAlgorithm
      },
      true,
      ['encrypt', 'decrypt']
    );

    return {
      publicKey: keyPair.publicKey,
      privateKey: keyPair.privateKey
    };
  }

  // Export key
  async exportKey(key: CryptoKey, format: 'jwk' | 'raw' | 'spki' | 'pkcs8'): Promise<JsonWebKey | ArrayBuffer> {
    return crypto.subtle.exportKey(format, key);
  }

  // Import key
  async importKey(
    format: 'jwk' | 'raw' | 'spki' | 'pkcs8',
    keyData: JsonWebKey | ArrayBuffer,
    algorithm: EncryptionAlgorithm,
    extractable: boolean,
    keyUsages: KeyUsage[]
  ): Promise<CryptoKey> {
    return crypto.subtle.importKey(
      format,
      keyData,
      algorithm,
      extractable,
      keyUsages
    );
  }

  // Encrypt data
  async encrypt(data: string | ArrayBuffer, key: CryptoKey): Promise<ArrayBuffer> {
    const encoder = new TextEncoder();
    const iv = await this.generateRandomBytes(12);
    const dataBuffer = data instanceof ArrayBuffer ? data : encoder.encode(data);

    const encryptedData = await crypto.subtle.encrypt(
      {
        name: this.config.defaultEncryptionAlgorithm.name,
        iv
      },
      key,
      dataBuffer
    );

    const result = new Uint8Array(iv.length + encryptedData.byteLength);
    result.set(iv);
    result.set(new Uint8Array(encryptedData), iv.length);

    return result.buffer;
  }

  // Decrypt data
  async decrypt(encryptedData: ArrayBuffer, key: CryptoKey): Promise<string> {
    const iv = new Uint8Array(encryptedData, 0, 12);
    const data = new Uint8Array(encryptedData, 12);

    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: this.config.defaultEncryptionAlgorithm.name,
        iv
      },
      key,
      data
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  }

  // Sign data
  async sign(data: string | ArrayBuffer, key: CryptoKey): Promise<ArrayBuffer> {
    const encoder = new TextEncoder();
    const dataBuffer = data instanceof ArrayBuffer ? data : encoder.encode(data);

    return crypto.subtle.sign(
      {
        name: 'RSASSA-PKCS1-v1_5',
        hash: this.config.defaultHashAlgorithm
      },
      key,
      dataBuffer
    );
  }

  // Verify signature
  async verify(
    signature: ArrayBuffer,
    data: string | ArrayBuffer,
    key: CryptoKey
  ): Promise<boolean> {
    const encoder = new TextEncoder();
    const dataBuffer = data instanceof ArrayBuffer ? data : encoder.encode(data);

    return crypto.subtle.verify(
      {
        name: 'RSASSA-PKCS1-v1_5',
        hash: this.config.defaultHashAlgorithm
      },
      key,
      signature,
      dataBuffer
    );
  }

  // Generate UUID
  generateUUID(): string {
    return crypto.randomUUID();
  }

  // Generate secure token (for email verification, etc.)
  async generateSecureToken(length: number = 32): Promise<string> {
    return this.generateRandomString(length);
  }

  // Check if Web Crypto API is supported
  static isSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      'crypto' in window &&
      'subtle' in window.crypto &&
      'randomUUID' in window.crypto
    );
  }
}

// Export convenience functions
export const generateSecureToken = async (length: number = 32): Promise<string> => {
  const securityManager = SecurityManager.getInstance();
  return securityManager.generateSecureToken(length);
};

export const generateUUID = (): string => {
  const securityManager = SecurityManager.getInstance();
  return securityManager.generateUUID();
};

export const hashData = async (data: string): Promise<string> => {
  const securityManager = SecurityManager.getInstance();
  return securityManager.hash(data);
};

// Example usage:
/*
// Create security manager instance
const securityManager = SecurityManager.getInstance();

// Configure security settings
securityManager.configure({
  defaultHashAlgorithm: 'SHA-512',
  defaultIterations: 200000
});

// Generate random string
const randomString = await securityManager.generateRandomString(32);

// Hash data
const hash = await securityManager.hash('sensitive data');

// Generate key from password
const salt = await securityManager.generateSalt();
const key = await securityManager.generateKeyFromPassword('password123', salt);

// Encrypt and decrypt data
const encryptedData = await securityManager.encrypt('secret message', key);
const decryptedData = await securityManager.decrypt(encryptedData, key);

// Generate key pair
const keyPair = await securityManager.generateKeyPair();

// Sign and verify data
const signature = await securityManager.sign('message', keyPair.privateKey);
const isValid = await securityManager.verify(
  signature,
  'message',
  keyPair.publicKey
);

// Generate UUID
const uuid = securityManager.generateUUID();
*/