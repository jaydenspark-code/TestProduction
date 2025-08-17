type StorageType = 'local' | 'session';

type StorageValue<T = any> = {
  data: T;
  timestamp: number;
  expiry?: number;
  compressed?: boolean;
  encrypted?: boolean;
};

type StorageOptions = {
  expiry?: number; // Time in milliseconds
  compress?: boolean;
  encrypt?: boolean;
  encryptionKey?: string;
};

type StorageStats = {
  itemCount: number;
  totalSize: number;
  remainingSpace: number;
  oldestItem: { key: string; timestamp: number } | null;
  newestItem: { key: string; timestamp: number } | null;
};

export class WebStorageManager {
  private static instance: WebStorageManager;
  private readonly compressionThreshold = 1024; // 1KB
  private readonly maxStorageSize = 5 * 1024 * 1024; // 5MB
  private readonly defaultEncryptionKey = 'default-key';

  private constructor() {}

  static getInstance(): WebStorageManager {
    if (!WebStorageManager.instance) {
      WebStorageManager.instance = new WebStorageManager();
    }
    return WebStorageManager.instance;
  }

  // Set item in storage
  async setItem<T>(
    key: string,
    value: T,
    type: StorageType = 'local',
    options: StorageOptions = {}
  ): Promise<void> {
    const storage = this.getStorage(type);
    if (!storage) return;

    try {
      let processedData: T = value;

      // Compress data if needed
      if (options.compress && this.shouldCompress(processedData)) {
        processedData = await this.compress(processedData) as T;
      }

      // Encrypt data if needed
      if (options.encrypt) {
        processedData = this.encrypt(
          processedData,
          options.encryptionKey || this.defaultEncryptionKey
        ) as T;
      }

      const storageValue: StorageValue<T> = {
        data: processedData,
        timestamp: Date.now(),
        expiry: options.expiry,
        compressed: options.compress,
        encrypted: options.encrypt
      };

      const serializedValue = JSON.stringify(storageValue);

      // Check if we have enough space
      if (!this.hasEnoughSpace(type, key, serializedValue)) {
        await this.makeSpace(type, serializedValue.length);
      }

      storage.setItem(key, serializedValue);
    } catch (error) {
      console.error('Error setting storage item:', error);
      throw error;
    }
  }

  // Get item from storage
  async getItem<T>(
    key: string,
    type: StorageType = 'local',
    options: StorageOptions = {}
  ): Promise<T | null> {
    const storage = this.getStorage(type);
    if (!storage) return null;

    try {
      const value = storage.getItem(key);
      if (!value) return null;

      const storageValue: StorageValue<T> = JSON.parse(value);

      // Check expiry
      if (
        storageValue.expiry &&
        Date.now() > storageValue.timestamp + storageValue.expiry
      ) {
        storage.removeItem(key);
        return null;
      }

      let processedData: T = storageValue.data;

      // Decrypt data if needed
      if (storageValue.encrypted) {
        processedData = this.decrypt(
          processedData,
          options.encryptionKey || this.defaultEncryptionKey
        ) as T;
      }

      // Decompress data if needed
      if (storageValue.compressed) {
        processedData = await this.decompress(processedData) as T;
      }

      return processedData;
    } catch (error) {
      console.error('Error getting storage item:', error);
      return null;
    }
  }

  // Remove item from storage
  removeItem(key: string, type: StorageType = 'local'): void {
    const storage = this.getStorage(type);
    if (storage) {
      storage.removeItem(key);
    }
  }

  // Clear all items from storage
  clear(type: StorageType = 'local'): void {
    const storage = this.getStorage(type);
    if (storage) {
      storage.clear();
    }
  }

  // Get all keys from storage
  keys(type: StorageType = 'local'): string[] {
    const storage = this.getStorage(type);
    return storage ? Object.keys(storage) : [];
  }

  // Get storage statistics
  async getStats(type: StorageType = 'local'): Promise<StorageStats> {
    const storage = this.getStorage(type);
    if (!storage) {
      return {
        itemCount: 0,
        totalSize: 0,
        remainingSpace: 0,
        oldestItem: null,
        newestItem: null
      };
    }

    let totalSize = 0;
    let oldestTimestamp = Infinity;
    let newestTimestamp = 0;
    let oldestKey = '';
    let newestKey = '';

    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key) {
        const value = storage.getItem(key);
        if (value) {
          totalSize += value.length;
          try {
            const parsed: StorageValue = JSON.parse(value);
            if (parsed.timestamp < oldestTimestamp) {
              oldestTimestamp = parsed.timestamp;
              oldestKey = key;
            }
            if (parsed.timestamp > newestTimestamp) {
              newestTimestamp = parsed.timestamp;
              newestKey = key;
            }
          } catch {}
        }
      }
    }

    return {
      itemCount: storage.length,
      totalSize,
      remainingSpace: this.maxStorageSize - totalSize,
      oldestItem: oldestKey ? { key: oldestKey, timestamp: oldestTimestamp } : null,
      newestItem: newestKey ? { key: newestKey, timestamp: newestTimestamp } : null
    };
  }

  // Check if storage is supported
  static isSupported(type: StorageType = 'local'): boolean {
    try {
      const storage = type === 'local' ? localStorage : sessionStorage;
      const testKey = '__storage_test__';
      storage.setItem(testKey, testKey);
      storage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  // Private methods
  private getStorage(type: StorageType): Storage | null {
    try {
      return type === 'local' ? localStorage : sessionStorage;
    } catch {
      return null;
    }
  }

  private shouldCompress(data: any): boolean {
    return (
      typeof data === 'string' &&
      data.length > this.compressionThreshold
    );
  }

  private async compress(data: any): Promise<any> {
    if (typeof data !== 'string') {
      data = JSON.stringify(data);
    }

    // Simple compression example (in real-world, use proper compression library)
    // This is just a placeholder implementation
    return data.split('').reduce((acc, char) => {
      const count = acc.length > 0 && acc[acc.length - 1][0] === char
        ? acc[acc.length - 1][1] + 1
        : 1;
      if (count === 1) {
        acc.push([char, count]);
      } else {
        acc[acc.length - 1][1] = count;
      }
      return acc;
    }, [] as [string, number][]).map(([char, count]) => 
      count > 1 ? `${char}${count}` : char
    ).join('');
  }

  private async decompress(data: any): Promise<any> {
    // Simple decompression example (in real-world, use proper compression library)
    // This is just a placeholder implementation
    const decompressed = data.replace(/([a-zA-Z0-9])(\d+)/g, (_, char, count) =>
      char.repeat(parseInt(count))
    );

    try {
      return JSON.parse(decompressed);
    } catch {
      return decompressed;
    }
  }

  private encrypt(data: any, key: string): any {
    // Simple XOR encryption (in real-world, use proper encryption library)
    // This is just a placeholder implementation
    const text = typeof data === 'string' ? data : JSON.stringify(data);
    return text
      .split('')
      .map((char, index) =>
        String.fromCharCode(char.charCodeAt(0) ^ key.charCodeAt(index % key.length))
      )
      .join('');
  }

  private decrypt(data: any, key: string): any {
    // Simple XOR decryption (in real-world, use proper encryption library)
    // This is just a placeholder implementation
    const decrypted = this.encrypt(data, key); // XOR encryption is its own inverse
    try {
      return JSON.parse(decrypted);
    } catch {
      return decrypted;
    }
  }

  private hasEnoughSpace(
    type: StorageType,
    key: string,
    value: string
  ): boolean {
    const storage = this.getStorage(type);
    if (!storage) return false;

    const currentSize = this.calculateStorageSize(storage);
    const existingItemSize = storage.getItem(key)?.length || 0;
    const newSize = currentSize - existingItemSize + value.length;

    return newSize <= this.maxStorageSize;
  }

  private async makeSpace(
    type: StorageType,
    requiredSpace: number
  ): Promise<void> {
    const storage = this.getStorage(type);
    if (!storage) return;

    const stats = await this.getStats(type);
    if (!stats.oldestItem) return;

    // Remove items starting from the oldest until we have enough space
    let currentSpace = stats.remainingSpace;
    const items = this.keys(type)
      .map(key => ({
        key,
        value: storage.getItem(key) || '',
        timestamp: 0
      }))
      .sort((a, b) => {
        try {
          const aValue: StorageValue = JSON.parse(a.value);
          const bValue: StorageValue = JSON.parse(b.value);
          return aValue.timestamp - bValue.timestamp;
        } catch {
          return 0;
        }
      });

    for (const item of items) {
      if (currentSpace >= requiredSpace) break;
      storage.removeItem(item.key);
      currentSpace += item.value.length;
    }
  }

  private calculateStorageSize(storage: Storage): number {
    let size = 0;
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key) {
        const value = storage.getItem(key);
        if (value) {
          size += value.length;
        }
      }
    }
    return size;
  }
}

// Example usage:
/*
// Create web storage manager instance
const storageManager = WebStorageManager.getInstance();

// Check if storage is supported
if (WebStorageManager.isSupported('local')) {
  // Store data with compression and encryption
  await storageManager.setItem(
    'user-preferences',
    {
      theme: 'dark',
      fontSize: 16,
      notifications: true
    },
    'local',
    {
      expiry: 24 * 60 * 60 * 1000, // 24 hours
      compress: true,
      encrypt: true,
      encryptionKey: 'my-secret-key'
    }
  );

  // Retrieve data
  const preferences = await storageManager.getItem(
    'user-preferences',
    'local',
    {
      encrypt: true,
      encryptionKey: 'my-secret-key'
    }
  );
  console.log('User preferences:', preferences);

  // Get storage statistics
  const stats = await storageManager.getStats('local');
  console.log('Storage stats:', stats);

  // Remove item
  storageManager.removeItem('user-preferences', 'local');

  // Clear all items
  storageManager.clear('local');
}
*/