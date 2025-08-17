type BufferConfig = {
  maxSize?: number;
  minSize?: number;
  targetDuration?: number;
  maxDuration?: number;
  minDuration?: number;
  maxBuffers?: number;
  autoCleanup?: boolean;
  cleanupThreshold?: number;
  strategy?: 'fifo' | 'lru' | 'lfu';
};

type BufferItem = {
  id: string;
  type: string;
  size: number;
  duration: number;
  timestamp: number;
  lastAccessed: number;
  accessCount: number;
  metadata: Record<string, any>;
};

type BufferEvent = {
  type: 'add' | 'remove' | 'clear' | 'error' | 'threshold' | 'overflow';
  itemId?: string;
  timestamp: number;
  details: any;
};

type BufferEventCallback = (event: BufferEvent) => void;

export class MediaBufferManager {
  private static instance: MediaBufferManager;
  private config: BufferConfig;
  private buffers: Map<string, ArrayBuffer>;
  private items: Map<string, BufferItem>;
  private onBufferEventCallbacks: Set<BufferEventCallback>;
  private currentSize: number;
  private currentDuration: number;

  private constructor() {
    this.config = this.getDefaultConfig();
    this.buffers = new Map();
    this.items = new Map();
    this.onBufferEventCallbacks = new Set();
    this.currentSize = 0;
    this.currentDuration = 0;
  }

  static getInstance(): MediaBufferManager {
    if (!MediaBufferManager.instance) {
      MediaBufferManager.instance = new MediaBufferManager();
    }
    return MediaBufferManager.instance;
  }

  private notifyBufferEvent(event: BufferEvent): void {
    this.onBufferEventCallbacks.forEach(callback => callback(event));
  }

  private getDefaultConfig(): BufferConfig {
    return {
      maxSize: 1024 * 1024 * 1024,  // 1GB
      minSize: 64 * 1024 * 1024,     // 64MB
      targetDuration: 30,            // 30 seconds
      maxDuration: 60,               // 60 seconds
      minDuration: 10,               // 10 seconds
      maxBuffers: 100,
      autoCleanup: true,
      cleanupThreshold: 0.9,         // 90% of maxSize
      strategy: 'lru'
    };
  }

  configure(config: Partial<BufferConfig>): void {
    this.config = { ...this.config, ...config };

    if (this.config.autoCleanup && (
      this.currentSize > this.config.maxSize! * this.config.cleanupThreshold! ||
      this.currentDuration > this.config.maxDuration!
    )) {
      this.cleanup();
    }
  }

  private shouldCleanup(): boolean {
    return this.currentSize > this.config.maxSize! * this.config.cleanupThreshold! ||
           this.currentDuration > this.config.maxDuration! ||
           this.items.size > this.config.maxBuffers!;
  }

  private updateItemAccess(id: string): void {
    const item = this.items.get(id);
    if (item) {
      item.lastAccessed = Date.now();
      item.accessCount++;
    }
  }

  private getItemsToRemove(): BufferItem[] {
    const items = Array.from(this.items.values());

    switch (this.config.strategy) {
      case 'fifo':
        return items.sort((a, b) => a.timestamp - b.timestamp);
      case 'lru':
        return items.sort((a, b) => a.lastAccessed - b.lastAccessed);
      case 'lfu':
        return items.sort((a, b) => a.accessCount - b.accessCount);
      default:
        return items.sort((a, b) => a.lastAccessed - b.lastAccessed);
    }
  }

  add(buffer: ArrayBuffer, duration: number, metadata: Record<string, any> = {}): string {
    // Check size constraints
    if (buffer.byteLength > this.config.maxSize!) {
      throw new Error(`Buffer size exceeds maximum size (${this.config.maxSize} bytes)`);
    }

    // Check duration constraints
    if (duration > this.config.maxDuration!) {
      throw new Error(`Buffer duration exceeds maximum duration (${this.config.maxDuration} seconds)`);
    }

    // Auto cleanup if needed
    if (this.shouldCleanup()) {
      this.cleanup();
    }

    // Generate ID and create item
    const id = crypto.randomUUID();
    const item: BufferItem = {
      id,
      type: metadata.type || 'application/octet-stream',
      size: buffer.byteLength,
      duration,
      timestamp: Date.now(),
      lastAccessed: Date.now(),
      accessCount: 0,
      metadata
    };

    try {
      this.buffers.set(id, buffer);
      this.items.set(id, item);
      this.currentSize += buffer.byteLength;
      this.currentDuration += duration;

      this.notifyBufferEvent({
        type: 'add',
        itemId: id,
        timestamp: performance.now(),
        details: { item }
      });

      return id;
    } catch (error) {
      this.notifyBufferEvent({
        type: 'error',
        itemId: id,
        timestamp: performance.now(),
        details: { error }
      });
      throw error;
    }
  }

  get(id: string): ArrayBuffer | undefined {
    const buffer = this.buffers.get(id);
    if (buffer) {
      this.updateItemAccess(id);
    }
    return buffer;
  }

  remove(id: string): boolean {
    const item = this.items.get(id);
    const buffer = this.buffers.get(id);

    if (item && buffer) {
      this.items.delete(id);
      this.buffers.delete(id);
      this.currentSize -= buffer.byteLength;
      this.currentDuration -= item.duration;

      this.notifyBufferEvent({
        type: 'remove',
        itemId: id,
        timestamp: performance.now(),
        details: { item }
      });

      return true;
    }

    return false;
  }

  clear(): void {
    this.buffers.clear();
    this.items.clear();
    this.currentSize = 0;
    this.currentDuration = 0;

    this.notifyBufferEvent({
      type: 'clear',
      timestamp: performance.now(),
      details: { clearedSize: this.currentSize, clearedDuration: this.currentDuration }
    });
  }

  cleanup(): void {
    if (!this.shouldCleanup()) {
      return;
    }

    const itemsToRemove = this.getItemsToRemove();
    let removedSize = 0;
    let removedDuration = 0;

    for (const item of itemsToRemove) {
      if (
        this.currentSize - removedSize <= this.config.minSize! &&
        this.currentDuration - removedDuration <= this.config.minDuration!
      ) {
        break;
      }

      if (this.remove(item.id)) {
        removedSize += item.size;
        removedDuration += item.duration;
      }
    }

    this.notifyBufferEvent({
      type: 'threshold',
      timestamp: performance.now(),
      details: { removedSize, removedDuration }
    });
  }

  getItem(id: string): BufferItem | undefined {
    return this.items.get(id);
  }

  getAllItems(): BufferItem[] {
    return Array.from(this.items.values());
  }

  getCurrentSize(): number {
    return this.currentSize;
  }

  getCurrentDuration(): number {
    return this.currentDuration;
  }

  getBufferCount(): number {
    return this.items.size;
  }

  onBufferEvent(callback: BufferEventCallback): () => void {
    this.onBufferEventCallbacks.add(callback);
    return () => {
      this.onBufferEventCallbacks.delete(callback);
    };
  }

  static isSupported(): boolean {
    return typeof window !== 'undefined' &&
      'ArrayBuffer' in window &&
      'crypto' in window &&
      'performance' in window;
  }
}

// Example usage:
/*
const bufferManager = MediaBufferManager.getInstance();

// Check if media buffer is supported
console.log('Media Buffer supported:', MediaBufferManager.isSupported());

// Configure buffer
bufferManager.configure({
  maxSize: 2 * 1024 * 1024 * 1024,  // 2GB
  minSize: 128 * 1024 * 1024,        // 128MB
  targetDuration: 45,                // 45 seconds
  maxDuration: 90,                   // 90 seconds
  minDuration: 15,                   // 15 seconds
  maxBuffers: 200,
  autoCleanup: true,
  cleanupThreshold: 0.8,             // 80% of maxSize
  strategy: 'lru'
});

// Set up event listener
const eventCleanup = bufferManager.onBufferEvent(event => {
  console.log('Buffer event:', event);
});

// Add a buffer
const buffer = new ArrayBuffer(1024 * 1024);  // 1MB
const bufferId = bufferManager.add(buffer, 5, {
  type: 'video/mp4',
  quality: '1080p',
  segment: 1
});

// Get buffer information
console.log('Current size:', bufferManager.getCurrentSize());
console.log('Current duration:', bufferManager.getCurrentDuration());
console.log('Buffer count:', bufferManager.getBufferCount());
console.log('All items:', bufferManager.getAllItems());

// Get a specific buffer
const retrievedBuffer = bufferManager.get(bufferId);

// Remove a buffer
bufferManager.remove(bufferId);

// Clear all buffers
bufferManager.clear();

// Remove event listener
eventCleanup();
*/