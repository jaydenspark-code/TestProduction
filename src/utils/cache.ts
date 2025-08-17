type CacheOptions = {
  storage?: 'memory' | 'indexeddb';
  expires?: number | Date;
  version?: number;
  compress?: boolean;
};

type CacheItem<T = any> = {
  value: T;
  expires?: number;
  version: number;
  compressed?: boolean;
  timestamp: number;
};

export class Cache {
  private static instance: Cache;
  private readonly memoryStore: Map<string, CacheItem>;
  private readonly dbName = 'app_cache';
  private readonly dbVersion = 1;
  private db: IDBDatabase | null = null;
  private dbReady: Promise<void>;

  private constructor() {
    this.memoryStore = new Map();
    this.dbReady = this.initIndexedDB();
  }

  static getInstance(): Cache {
    if (!Cache.instance) {
      Cache.instance = new Cache();
    }
    return Cache.instance;
  }

  // Set cache item
  async set<T>(
    key: string,
    value: T,
    options: CacheOptions = {}
  ): Promise<void> {
    const {
      storage = 'memory',
      expires,
      version = 1,
      compress = false
    } = options;

    const item: CacheItem<T> = {
      value,
      expires: expires ? this.getExpirationTime(expires) : undefined,
      version,
      compressed: compress,
      timestamp: Date.now()
    };

    if (compress) {
      item.value = await this.compress(value);
    }

    if (storage === 'memory') {
      this.memoryStore.set(key, item);
    } else {
      await this.setInIndexedDB(key, item);
    }
  }

  // Get cache item
  async get<T>(
    key: string,
    options: Omit<CacheOptions, 'expires'> = {}
  ): Promise<T | null> {
    const { storage = 'memory', version = 1 } = options;

    let item: CacheItem<T> | null = null;

    if (storage === 'memory') {
      item = this.memoryStore.get(key) as CacheItem<T> || null;
    } else {
      item = await this.getFromIndexedDB<T>(key);
    }

    if (!item) return null;

    // Check expiration
    if (item.expires && Date.now() > item.expires) {
      await this.remove(key, { storage });
      return null;
    }

    // Check version
    if (item.version !== version) {
      await this.remove(key, { storage });
      return null;
    }

    // Decompress if needed
    if (item.compressed) {
      return this.decompress(item.value);
    }

    return item.value;
  }

  // Remove cache item
  async remove(key: string, options: Pick<CacheOptions, 'storage'> = {}): Promise<void> {
    const { storage = 'memory' } = options;

    if (storage === 'memory') {
      this.memoryStore.delete(key);
    } else {
      await this.removeFromIndexedDB(key);
    }
  }

  // Clear all cache items
  async clear(options: Pick<CacheOptions, 'storage'> = {}): Promise<void> {
    const { storage = 'memory' } = options;

    if (storage === 'memory') {
      this.memoryStore.clear();
    } else {
      await this.clearIndexedDB();
    }
  }

  // Get all cache keys
  async keys(options: Pick<CacheOptions, 'storage'> = {}): Promise<string[]> {
    const { storage = 'memory' } = options;

    if (storage === 'memory') {
      return Array.from(this.memoryStore.keys());
    } else {
      return this.getIndexedDBKeys();
    }
  }

  // Get cache size
  async size(options: Pick<CacheOptions, 'storage'> = {}): Promise<number> {
    const { storage = 'memory' } = options;

    if (storage === 'memory') {
      return this.memoryStore.size;
    } else {
      const keys = await this.getIndexedDBKeys();
      return keys.length;
    }
  }

  // Check if key exists
  async has(key: string, options: Pick<CacheOptions, 'storage'> = {}): Promise<boolean> {
    const { storage = 'memory' } = options;

    if (storage === 'memory') {
      return this.memoryStore.has(key);
    } else {
      const value = await this.getFromIndexedDB(key);
      return value !== null;
    }
  }

  // Get cache statistics
  async getStats(options: Pick<CacheOptions, 'storage'> = {}): Promise<{
    size: number;
    oldestItem: Date | null;
    newestItem: Date | null;
  }> {
    const { storage = 'memory' } = options;

    let items: CacheItem[];
    if (storage === 'memory') {
      items = Array.from(this.memoryStore.values());
    } else {
      items = await this.getAllFromIndexedDB();
    }

    if (items.length === 0) {
      return {
        size: 0,
        oldestItem: null,
        newestItem: null
      };
    }

    const timestamps = items.map(item => item.timestamp);
    return {
      size: items.length,
      oldestItem: new Date(Math.min(...timestamps)),
      newestItem: new Date(Math.max(...timestamps))
    };
  }

  // Private methods
  private async initIndexedDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('cache')) {
          db.createObjectStore('cache');
        }
      };
    });
  }

  private async setInIndexedDB(key: string, value: CacheItem): Promise<void> {
    await this.dbReady;
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('IndexedDB not initialized'));
        return;
      }

      const transaction = this.db.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const request = store.put(value, key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  private async getFromIndexedDB<T>(key: string): Promise<CacheItem<T> | null> {
    await this.dbReady;
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('IndexedDB not initialized'));
        return;
      }

      const transaction = this.db.transaction(['cache'], 'readonly');
      const store = transaction.objectStore('cache');
      const request = store.get(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  private async removeFromIndexedDB(key: string): Promise<void> {
    await this.dbReady;
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('IndexedDB not initialized'));
        return;
      }

      const transaction = this.db.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const request = store.delete(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  private async clearIndexedDB(): Promise<void> {
    await this.dbReady;
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('IndexedDB not initialized'));
        return;
      }

      const transaction = this.db.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  private async getIndexedDBKeys(): Promise<string[]> {
    await this.dbReady;
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('IndexedDB not initialized'));
        return;
      }

      const transaction = this.db.transaction(['cache'], 'readonly');
      const store = transaction.objectStore('cache');
      const request = store.getAllKeys();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result as string[]);
    });
  }

  private async getAllFromIndexedDB(): Promise<CacheItem[]> {
    await this.dbReady;
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('IndexedDB not initialized'));
        return;
      }

      const transaction = this.db.transaction(['cache'], 'readonly');
      const store = transaction.objectStore('cache');
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  private getExpirationTime(expires: number | Date): number {
    if (expires instanceof Date) {
      return expires.getTime();
    }
    return Date.now() + expires;
  }

  private async compress(data: any): Promise<string> {
    // In a real implementation, use a compression library
    // For demo purposes, just stringify
    return JSON.stringify(data);
  }

  private async decompress<T>(data: string): Promise<T> {
    // In a real implementation, use a compression library
    // For demo purposes, just parse
    return JSON.parse(data);
  }
}

// Example usage:
/*
const cache = Cache.getInstance();

// Store in memory cache
await cache.set('user', { id: 1, name: 'John' }, {
  expires: 24 * 60 * 60 * 1000, // 24 hours
  version: 1
});

// Store in IndexedDB with compression
await cache.set('settings', { theme: 'dark' }, {
  storage: 'indexeddb',
  compress: true
});

// Retrieve from cache
const user = await cache.get('user');
const settings = await cache.get('settings', { storage: 'indexeddb' });

// Check cache status
const hasUser = await cache.has('user');
const stats = await cache.getStats();

// Clear specific storage
await cache.clear({ storage: 'memory' });
await cache.clear({ storage: 'indexeddb' });
*/