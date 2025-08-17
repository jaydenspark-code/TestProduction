type IndexedDBOptions = {
  version?: number;
  onUpgradeNeeded?: (db: IDBDatabase, oldVersion: number, newVersion: number | null) => void;
  onBlocked?: (oldVersion: number, newVersion: number | null) => void;
  onVersionChange?: () => void;
};

type IndexOptions = {
  unique?: boolean;
  multiEntry?: boolean;
};

type StoreOptions = {
  keyPath?: string | string[];
  autoIncrement?: boolean;
  indexes?: { [key: string]: IndexOptions };
};

type QueryOptions = {
  index?: string;
  range?: IDBKeyRange;
  direction?: IDBCursorDirection;
  limit?: number;
};

export class IndexedDBManager {
  private static instance: IndexedDBManager;
  private db: IDBDatabase | null = null;
  private readonly dbName: string;
  private readonly options: IndexedDBOptions;

  private constructor(dbName: string, options: IndexedDBOptions = {}) {
    this.dbName = dbName;
    this.options = options;
  }

  static getInstance(dbName: string, options?: IndexedDBOptions): IndexedDBManager {
    if (!IndexedDBManager.instance) {
      IndexedDBManager.instance = new IndexedDBManager(dbName, options);
    }
    return IndexedDBManager.instance;
  }

  // Open database connection
  async open(): Promise<IDBDatabase> {
    if (this.db) {
      return this.db;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.options.version);

      request.onerror = () => {
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;

        // Handle version change
        this.db.onversionchange = () => {
          this.db?.close();
          this.db = null;
          this.options.onVersionChange?.();
        };

        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = request.result;
        const oldVersion = event.oldVersion;
        const newVersion = event.newVersion;

        this.options.onUpgradeNeeded?.(db, oldVersion, newVersion);
      };

      request.onblocked = (event) => {
        this.options.onBlocked?.(event.oldVersion, event.newVersion);
      };
    });
  }

  // Create object store
  async createStore(
    storeName: string,
    options: StoreOptions = {}
  ): Promise<IDBObjectStore> {
    const db = await this.open();

    if (!db.objectStoreNames.contains(storeName)) {
      const store = db.createObjectStore(storeName, {
        keyPath: options.keyPath,
        autoIncrement: options.autoIncrement
      });

      // Create indexes
      if (options.indexes) {
        Object.entries(options.indexes).forEach(([indexName, indexOptions]) => {
          store.createIndex(indexName, indexName, indexOptions);
        });
      }

      return store;
    }

    return db.transaction(storeName, 'readwrite').objectStore(storeName);
  }

  // Delete object store
  async deleteStore(storeName: string): Promise<void> {
    const db = await this.open();

    if (db.objectStoreNames.contains(storeName)) {
      db.deleteObjectStore(storeName);
    }
  }

  // Add item
  async add<T>(
    storeName: string,
    item: T,
    key?: IDBValidKey
  ): Promise<IDBValidKey> {
    const store = await this.getStore(storeName, 'readwrite');

    return new Promise((resolve, reject) => {
      const request = key ? store.add(item, key) : store.add(item);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Put item
  async put<T>(
    storeName: string,
    item: T,
    key?: IDBValidKey
  ): Promise<IDBValidKey> {
    const store = await this.getStore(storeName, 'readwrite');

    return new Promise((resolve, reject) => {
      const request = key ? store.put(item, key) : store.put(item);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Get item
  async get<T>(
    storeName: string,
    key: IDBValidKey
  ): Promise<T | undefined> {
    const store = await this.getStore(storeName, 'readonly');

    return new Promise((resolve, reject) => {
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Delete item
  async delete(storeName: string, key: IDBValidKey): Promise<void> {
    const store = await this.getStore(storeName, 'readwrite');

    return new Promise((resolve, reject) => {
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Clear store
  async clear(storeName: string): Promise<void> {
    const store = await this.getStore(storeName, 'readwrite');

    return new Promise((resolve, reject) => {
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Get all items
  async getAll<T>(
    storeName: string,
    options: QueryOptions = {}
  ): Promise<T[]> {
    const store = await this.getStore(storeName, 'readonly');
    const target = options.index ? store.index(options.index) : store;

    return new Promise((resolve, reject) => {
      const request = target.getAll(options.range, options.limit);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Get all keys
  async getAllKeys(
    storeName: string,
    options: QueryOptions = {}
  ): Promise<IDBValidKey[]> {
    const store = await this.getStore(storeName, 'readonly');
    const target = options.index ? store.index(options.index) : store;

    return new Promise((resolve, reject) => {
      const request = target.getAllKeys(options.range, options.limit);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Count items
  async count(
    storeName: string,
    options: QueryOptions = {}
  ): Promise<number> {
    const store = await this.getStore(storeName, 'readonly');
    const target = options.index ? store.index(options.index) : store;

    return new Promise((resolve, reject) => {
      const request = target.count(options.range);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Iterate over items
  async iterate<T>(
    storeName: string,
    callback: (cursor: IDBCursorWithValue) => void | Promise<void>,
    options: QueryOptions = {}
  ): Promise<void> {
    const store = await this.getStore(storeName, 'readonly');
    const target = options.index ? store.index(options.index) : store;

    return new Promise((resolve, reject) => {
      const request = target.openCursor(options.range, options.direction);

      request.onsuccess = async () => {
        const cursor = request.result;
        if (cursor) {
          try {
            await callback(cursor);
            cursor.continue();
          } catch (error) {
            reject(error);
          }
        } else {
          resolve();
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  // Create transaction
  async transaction<T>(
    storeNames: string | string[],
    mode: IDBTransactionMode,
    callback: (transaction: IDBTransaction) => Promise<T>
  ): Promise<T> {
    const db = await this.open();
    const transaction = db.transaction(storeNames, mode);

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve(result);
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);

      let result: T;
      callback(transaction)
        .then((value) => {
          result = value;
        })
        .catch(reject);
    });
  }

  // Close database connection
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  // Delete database
  async deleteDatabase(): Promise<void> {
    this.close();

    return new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(this.dbName);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Private methods
  private async getStore(
    storeName: string,
    mode: IDBTransactionMode
  ): Promise<IDBObjectStore> {
    const db = await this.open();
    return db.transaction(storeName, mode).objectStore(storeName);
  }
}

// Example usage:
/*
interface User {
  id?: number;
  name: string;
  email: string;
  age: number;
}

const db = IndexedDBManager.getInstance('myApp', {
  version: 1,
  onUpgradeNeeded: (db, oldVersion, newVersion) => {
    // Create stores and indexes on database upgrade
    const store = db.createObjectStore('users', {
      keyPath: 'id',
      autoIncrement: true
    });
    store.createIndex('email', 'email', { unique: true });
    store.createIndex('age', 'age');
  }
});

// Open database
await db.open();

// Add user
const userId = await db.add<User>('users', {
  name: 'John Doe',
  email: 'john@example.com',
  age: 30
});

// Get user
const user = await db.get<User>('users', userId);

// Update user
await db.put<User>('users', {
  ...user,
  age: 31
});

// Query users by age
const users = await db.getAll<User>('users', {
  index: 'age',
  range: IDBKeyRange.bound(20, 40)
});

// Count users
const count = await db.count('users', {
  index: 'age',
  range: IDBKeyRange.lowerBound(30)
});

// Iterate over users
await db.iterate<User>('users', async (cursor) => {
  const user = cursor.value;
  console.log(user);
}, {
  direction: 'prev'
});

// Transaction example
await db.transaction(['users'], 'readwrite', async (transaction) => {
  const store = transaction.objectStore('users');
  await Promise.all([
    store.add({
      name: 'Jane Doe',
      email: 'jane@example.com',
      age: 25
    }),
    store.add({
      name: 'Bob Smith',
      email: 'bob@example.com',
      age: 35
    })
  ]);
});

// Delete user
await db.delete('users', userId);

// Clear users store
await db.clear('users');

// Close database
db.close();

// Delete database
await db.deleteDatabase();
*/