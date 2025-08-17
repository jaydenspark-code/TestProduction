type StorageType = 'local' | 'session';

interface StorageOptions {
  storage?: StorageType;
  expires?: number; // Time in milliseconds
}

interface StorageItem<T> {
  value: T;
  expires?: number;
}

class StorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StorageError';
  }
}

export class Storage {
  private static getStorage(type: StorageType): globalThis.Storage {
    return type === 'local' ? localStorage : sessionStorage;
  }

  private static isStorageAvailable(type: StorageType): boolean {
    const storage = this.getStorage(type);
    try {
      const x = '__storage_test__';
      storage.setItem(x, x);
      storage.removeItem(x);
      return true;
    } catch (e) {
      return false;
    }
  }

  static set<T>(
    key: string,
    value: T,
    options: StorageOptions = {}
  ): void {
    const { storage = 'local', expires } = options;

    if (!this.isStorageAvailable(storage)) {
      throw new StorageError(`${storage}Storage is not available`);
    }

    try {
      const item: StorageItem<T> = {
        value,
        ...(expires && { expires: Date.now() + expires })
      };

      this.getStorage(storage).setItem(
        key,
        JSON.stringify(item)
      );
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'QuotaExceededError') {
          throw new StorageError('Storage quota exceeded');
        }
        throw new StorageError(`Failed to set item: ${error.message}`);
      }
      throw error;
    }
  }

  static get<T>(
    key: string,
    options: StorageOptions = {}
  ): T | null {
    const { storage = 'local' } = options;

    if (!this.isStorageAvailable(storage)) {
      throw new StorageError(`${storage}Storage is not available`);
    }

    try {
      const item = this.getStorage(storage).getItem(key);
      if (!item) return null;

      const parsed = JSON.parse(item) as StorageItem<T>;

      if (parsed.expires && Date.now() > parsed.expires) {
        this.remove(key, { storage });
        return null;
      }

      return parsed.value;
    } catch (error) {
      if (error instanceof Error) {
        throw new StorageError(`Failed to get item: ${error.message}`);
      }
      throw error;
    }
  }

  static remove(
    key: string,
    options: StorageOptions = {}
  ): void {
    const { storage = 'local' } = options;

    if (!this.isStorageAvailable(storage)) {
      throw new StorageError(`${storage}Storage is not available`);
    }

    try {
      this.getStorage(storage).removeItem(key);
    } catch (error) {
      if (error instanceof Error) {
        throw new StorageError(`Failed to remove item: ${error.message}`);
      }
      throw error;
    }
  }

  static clear(options: StorageOptions = {}): void {
    const { storage = 'local' } = options;

    if (!this.isStorageAvailable(storage)) {
      throw new StorageError(`${storage}Storage is not available`);
    }

    try {
      this.getStorage(storage).clear();
    } catch (error) {
      if (error instanceof Error) {
        throw new StorageError(`Failed to clear storage: ${error.message}`);
      }
      throw error;
    }
  }

  static keys(options: StorageOptions = {}): string[] {
    const { storage = 'local' } = options;

    if (!this.isStorageAvailable(storage)) {
      throw new StorageError(`${storage}Storage is not available`);
    }

    try {
      const storage = this.getStorage(storage);
      return Object.keys(storage);
    } catch (error) {
      if (error instanceof Error) {
        throw new StorageError(`Failed to get keys: ${error.message}`);
      }
      throw error;
    }
  }

  static size(options: StorageOptions = {}): number {
    const { storage = 'local' } = options;

    if (!this.isStorageAvailable(storage)) {
      throw new StorageError(`${storage}Storage is not available`);
    }

    try {
      const storage = this.getStorage(storage);
      return Object.keys(storage).length;
    } catch (error) {
      if (error instanceof Error) {
        throw new StorageError(`Failed to get storage size: ${error.message}`);
      }
      throw error;
    }
  }
}

// Example usage:
/*
// Set item with expiration
Storage.set('user', { id: 1, name: 'John' }, {
  expires: 24 * 60 * 60 * 1000 // 24 hours
});

// Get item
const user = Storage.get<{ id: number; name: string }>('user');

// Remove item
Storage.remove('user');

// Clear all
Storage.clear();

// Use session storage
Storage.set('tempData', { foo: 'bar' }, { storage: 'session' });
*/