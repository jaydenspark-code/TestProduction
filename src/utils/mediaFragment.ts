type FragmentConfig = {
  maxFragments?: number;
  maxFragmentSize?: number;
  maxFragmentDuration?: number;
  autoMerge?: boolean;
  mergeThreshold?: number;
  autoCleanup?: boolean;
  cleanupThreshold?: number;
  strategy?: 'sequential' | 'timestamp' | 'custom';
};

type FragmentItem = {
  id: string;
  type: string;
  size: number;
  duration: number;
  startTime: number;
  endTime: number;
  sequence: number;
  metadata: Record<string, any>;
};

type FragmentEvent = {
  type: 'add' | 'remove' | 'merge' | 'split' | 'error' | 'cleanup';
  fragmentId?: string;
  timestamp: number;
  details: any;
};

type FragmentEventCallback = (event: FragmentEvent) => void;

export class MediaFragmentManager {
  private static instance: MediaFragmentManager;
  private config: FragmentConfig;
  private fragments: Map<string, ArrayBuffer>;
  private items: Map<string, FragmentItem>;
  private onFragmentEventCallbacks: Set<FragmentEventCallback>;
  private currentSequence: number;

  private constructor() {
    this.config = this.getDefaultConfig();
    this.fragments = new Map();
    this.items = new Map();
    this.onFragmentEventCallbacks = new Set();
    this.currentSequence = 0;
  }

  static getInstance(): MediaFragmentManager {
    if (!MediaFragmentManager.instance) {
      MediaFragmentManager.instance = new MediaFragmentManager();
    }
    return MediaFragmentManager.instance;
  }

  private notifyFragmentEvent(event: FragmentEvent): void {
    this.onFragmentEventCallbacks.forEach(callback => callback(event));
  }

  private getDefaultConfig(): FragmentConfig {
    return {
      maxFragments: 1000,
      maxFragmentSize: 10 * 1024 * 1024,    // 10MB
      maxFragmentDuration: 10,               // 10 seconds
      autoMerge: true,
      mergeThreshold: 0.5,                  // 50% overlap
      autoCleanup: true,
      cleanupThreshold: 0.9,                // 90% of maxFragments
      strategy: 'sequential'
    };
  }

  configure(config: Partial<FragmentConfig>): void {
    this.config = { ...this.config, ...config };

    if (this.config.autoCleanup && this.items.size > this.config.maxFragments! * this.config.cleanupThreshold!) {
      this.cleanup();
    }
  }

  private async mergeArrayBuffers(buffers: ArrayBuffer[]): Promise<ArrayBuffer> {
    const totalLength = buffers.reduce((sum, buffer) => sum + buffer.byteLength, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;

    for (const buffer of buffers) {
      result.set(new Uint8Array(buffer), offset);
      offset += buffer.byteLength;
    }

    return result.buffer;
  }

  private async splitArrayBuffer(buffer: ArrayBuffer, splitPoints: number[]): Promise<ArrayBuffer[]> {
    const result: ArrayBuffer[] = [];
    let start = 0;

    for (const point of [...splitPoints, buffer.byteLength]) {
      result.push(buffer.slice(start, point));
      start = point;
    }

    return result;
  }

  private shouldMergeFragments(fragment1: FragmentItem, fragment2: FragmentItem): boolean {
    if (!this.config.autoMerge) return false;

    const overlap = Math.min(fragment1.endTime, fragment2.endTime) -
                   Math.max(fragment1.startTime, fragment2.startTime);
    const totalDuration = Math.max(fragment1.endTime, fragment2.endTime) -
                         Math.min(fragment1.startTime, fragment2.startTime);

    return overlap / totalDuration > this.config.mergeThreshold!;
  }

  private findOverlappingFragments(startTime: number, endTime: number): FragmentItem[] {
    return Array.from(this.items.values())
      .filter(item =>
        (startTime <= item.endTime && endTime >= item.startTime) ||
        (item.startTime <= endTime && item.endTime >= startTime)
      );
  }

  async addFragment(
    buffer: ArrayBuffer,
    startTime: number,
    endTime: number,
    metadata: Record<string, any> = {}
  ): Promise<string> {
    // Validate size and duration
    if (buffer.byteLength > this.config.maxFragmentSize!) {
      throw new Error(`Fragment size exceeds maximum size (${this.config.maxFragmentSize} bytes)`);
    }

    const duration = endTime - startTime;
    if (duration > this.config.maxFragmentDuration!) {
      throw new Error(`Fragment duration exceeds maximum duration (${this.config.maxFragmentDuration} seconds)`);
    }

    try {
      // Check for overlapping fragments
      const overlapping = this.findOverlappingFragments(startTime, endTime);

      if (overlapping.length > 0 && this.config.autoMerge) {
        // Merge overlapping fragments
        const fragments = [buffer, ...overlapping.map(item => this.fragments.get(item.id)!)];
        const mergedBuffer = await this.mergeArrayBuffers(fragments);

        // Calculate new time range
        const newStartTime = Math.min(startTime, ...overlapping.map(item => item.startTime));
        const newEndTime = Math.max(endTime, ...overlapping.map(item => item.endTime));

        // Remove old fragments
        for (const item of overlapping) {
          this.removeFragment(item.id);
        }

        // Add merged fragment
        return this.addFragment(mergedBuffer, newStartTime, newEndTime, metadata);
      }

      // Generate ID and create item
      const id = crypto.randomUUID();
      const item: FragmentItem = {
        id,
        type: metadata.type || 'application/octet-stream',
        size: buffer.byteLength,
        duration,
        startTime,
        endTime,
        sequence: this.currentSequence++,
        metadata
      };

      this.fragments.set(id, buffer);
      this.items.set(id, item);

      this.notifyFragmentEvent({
        type: 'add',
        fragmentId: id,
        timestamp: performance.now(),
        details: { item }
      });

      return id;
    } catch (error) {
      this.notifyFragmentEvent({
        type: 'error',
        timestamp: performance.now(),
        details: { error }
      });
      throw error;
    }
  }

  getFragment(id: string): ArrayBuffer | undefined {
    return this.fragments.get(id);
  }

  removeFragment(id: string): boolean {
    const item = this.items.get(id);
    const fragment = this.fragments.get(id);

    if (item && fragment) {
      this.items.delete(id);
      this.fragments.delete(id);

      this.notifyFragmentEvent({
        type: 'remove',
        fragmentId: id,
        timestamp: performance.now(),
        details: { item }
      });

      return true;
    }

    return false;
  }

  async mergeFragments(ids: string[]): Promise<string | undefined> {
    if (ids.length < 2) return undefined;

    const items = ids.map(id => this.items.get(id))
      .filter((item): item is FragmentItem => item !== undefined);

    if (items.length !== ids.length) return undefined;

    try {
      // Sort fragments by start time
      items.sort((a, b) => a.startTime - b.startTime);

      // Merge buffers
      const buffers = items.map(item => this.fragments.get(item.id)!);
      const mergedBuffer = await this.mergeArrayBuffers(buffers);

      // Calculate new time range
      const startTime = Math.min(...items.map(item => item.startTime));
      const endTime = Math.max(...items.map(item => item.endTime));

      // Combine metadata
      const metadata = items.reduce((combined, item) => ({
        ...combined,
        ...item.metadata
      }), {});

      // Remove old fragments
      for (const item of items) {
        this.removeFragment(item.id);
      }

      // Add merged fragment
      const newId = await this.addFragment(mergedBuffer, startTime, endTime, metadata);

      this.notifyFragmentEvent({
        type: 'merge',
        fragmentId: newId,
        timestamp: performance.now(),
        details: { mergedIds: ids, newItem: this.items.get(newId) }
      });

      return newId;
    } catch (error) {
      this.notifyFragmentEvent({
        type: 'error',
        timestamp: performance.now(),
        details: { error }
      });
      throw error;
    }
  }

  async splitFragment(id: string, splitTimes: number[]): Promise<string[]> {
    const item = this.items.get(id);
    const fragment = this.fragments.get(id);

    if (!item || !fragment) return [];

    try {
      // Validate split times
      splitTimes.sort((a, b) => a - b);
      if (splitTimes[0] <= item.startTime || splitTimes[splitTimes.length - 1] >= item.endTime) {
        throw new Error('Split times must be within fragment duration');
      }

      // Calculate split points in buffer
      const timeToBytes = fragment.byteLength / (item.endTime - item.startTime);
      const splitPoints = splitTimes.map(time =>
        Math.floor((time - item.startTime) * timeToBytes)
      );

      // Split buffer
      const buffers = await this.splitArrayBuffer(fragment, splitPoints);

      // Remove original fragment
      this.removeFragment(id);

      // Add new fragments
      const newIds: string[] = [];
      let currentStartTime = item.startTime;

      for (let i = 0; i < buffers.length; i++) {
        const endTime = i < splitTimes.length ? splitTimes[i] : item.endTime;
        const newId = await this.addFragment(
          buffers[i],
          currentStartTime,
          endTime,
          { ...item.metadata, splitIndex: i }
        );
        newIds.push(newId);
        currentStartTime = endTime;
      }

      this.notifyFragmentEvent({
        type: 'split',
        fragmentId: id,
        timestamp: performance.now(),
        details: { originalId: id, newIds, splitTimes }
      });

      return newIds;
    } catch (error) {
      this.notifyFragmentEvent({
        type: 'error',
        timestamp: performance.now(),
        details: { error }
      });
      throw error;
    }
  }

  cleanup(): void {
    if (this.items.size <= this.config.maxFragments! * this.config.cleanupThreshold!) {
      return;
    }

    const itemsToRemove = Array.from(this.items.values())
      .sort((a, b) => {
        switch (this.config.strategy) {
          case 'timestamp':
            return a.startTime - b.startTime;
          case 'sequential':
            return a.sequence - b.sequence;
          default:
            return a.sequence - b.sequence;
        }
      })
      .slice(0, this.items.size - this.config.maxFragments!);

    for (const item of itemsToRemove) {
      this.removeFragment(item.id);
    }

    this.notifyFragmentEvent({
      type: 'cleanup',
      timestamp: performance.now(),
      details: { removedCount: itemsToRemove.length }
    });
  }

  getItem(id: string): FragmentItem | undefined {
    return this.items.get(id);
  }

  getAllItems(): FragmentItem[] {
    return Array.from(this.items.values());
  }

  getFragmentCount(): number {
    return this.items.size;
  }

  getTotalSize(): number {
    return Array.from(this.fragments.values())
      .reduce((sum, fragment) => sum + fragment.byteLength, 0);
  }

  getTotalDuration(): number {
    return Array.from(this.items.values())
      .reduce((sum, item) => sum + item.duration, 0);
  }

  getFragmentsInTimeRange(startTime: number, endTime: number): FragmentItem[] {
    return Array.from(this.items.values())
      .filter(item => item.startTime <= endTime && item.endTime >= startTime)
      .sort((a, b) => a.startTime - b.startTime);
  }

  onFragmentEvent(callback: FragmentEventCallback): () => void {
    this.onFragmentEventCallbacks.add(callback);
    return () => {
      this.onFragmentEventCallbacks.delete(callback);
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
const fragmentManager = MediaFragmentManager.getInstance();

// Check if media fragment is supported
console.log('Media Fragment supported:', MediaFragmentManager.isSupported());

// Configure fragment manager
fragmentManager.configure({
  maxFragments: 2000,
  maxFragmentSize: 20 * 1024 * 1024,    // 20MB
  maxFragmentDuration: 15,               // 15 seconds
  autoMerge: true,
  mergeThreshold: 0.6,                  // 60% overlap
  autoCleanup: true,
  cleanupThreshold: 0.8,                // 80% of maxFragments
  strategy: 'timestamp'
});

// Set up event listener
const eventCleanup = fragmentManager.onFragmentEvent(event => {
  console.log('Fragment event:', event);
});

// Add fragments
const buffer1 = new ArrayBuffer(1024 * 1024);  // 1MB
const id1 = await fragmentManager.addFragment(buffer1, 0, 5, {
  type: 'video/mp4',
  quality: '1080p',
  segment: 1
});

const buffer2 = new ArrayBuffer(1024 * 1024);  // 1MB
const id2 = await fragmentManager.addFragment(buffer2, 4, 9, {
  type: 'video/mp4',
  quality: '1080p',
  segment: 2
});

// Get fragment information
console.log('Fragment count:', fragmentManager.getFragmentCount());
console.log('Total size:', fragmentManager.getTotalSize());
console.log('Total duration:', fragmentManager.getTotalDuration());
console.log('All items:', fragmentManager.getAllItems());

// Get fragments in time range
console.log('Fragments in range:', fragmentManager.getFragmentsInTimeRange(2, 7));

// Merge fragments
const mergedId = await fragmentManager.mergeFragments([id1, id2]);

// Split fragment
const splitIds = await fragmentManager.splitFragment(mergedId, [3, 6]);

// Remove fragments
fragmentManager.removeFragment(id1);
fragmentManager.removeFragment(id2);

// Remove event listener
eventCleanup();
*/