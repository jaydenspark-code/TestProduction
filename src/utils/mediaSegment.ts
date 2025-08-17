type SegmentConfig = {
  maxSegments?: number;
  maxSegmentSize?: number;
  maxSegmentDuration?: number;
  segmentOverlap?: number;
  autoMerge?: boolean;
  mergeThreshold?: number;
  autoCleanup?: boolean;
  cleanupThreshold?: number;
  strategy?: 'sequential' | 'timestamp' | 'quality' | 'custom';
};

type SegmentItem = {
  id: string;
  type: string;
  size: number;
  duration: number;
  startTime: number;
  endTime: number;
  sequence: number;
  quality: string;
  bandwidth: number;
  metadata: Record<string, any>;
};

type SegmentEvent = {
  type: 'add' | 'remove' | 'merge' | 'split' | 'error' | 'cleanup' | 'quality';
  segmentId?: string;
  timestamp: number;
  details: any;
};

type SegmentEventCallback = (event: SegmentEvent) => void;

export class MediaSegmentManager {
  private static instance: MediaSegmentManager;
  private config: SegmentConfig;
  private segments: Map<string, ArrayBuffer>;
  private items: Map<string, SegmentItem>;
  private onSegmentEventCallbacks: Set<SegmentEventCallback>;
  private currentSequence: number;

  private constructor() {
    this.config = this.getDefaultConfig();
    this.segments = new Map();
    this.items = new Map();
    this.onSegmentEventCallbacks = new Set();
    this.currentSequence = 0;
  }

  static getInstance(): MediaSegmentManager {
    if (!MediaSegmentManager.instance) {
      MediaSegmentManager.instance = new MediaSegmentManager();
    }
    return MediaSegmentManager.instance;
  }

  private notifySegmentEvent(event: SegmentEvent): void {
    this.onSegmentEventCallbacks.forEach(callback => callback(event));
  }

  private getDefaultConfig(): SegmentConfig {
    return {
      maxSegments: 1000,
      maxSegmentSize: 10 * 1024 * 1024,    // 10MB
      maxSegmentDuration: 10,               // 10 seconds
      segmentOverlap: 0.5,                  // 0.5 seconds
      autoMerge: true,
      mergeThreshold: 0.5,                  // 50% overlap
      autoCleanup: true,
      cleanupThreshold: 0.9,                // 90% of maxSegments
      strategy: 'sequential'
    };
  }

  configure(config: Partial<SegmentConfig>): void {
    this.config = { ...this.config, ...config };

    if (this.config.autoCleanup && this.items.size > this.config.maxSegments! * this.config.cleanupThreshold!) {
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

  private shouldMergeSegments(segment1: SegmentItem, segment2: SegmentItem): boolean {
    if (!this.config.autoMerge) return false;

    const overlap = Math.min(segment1.endTime, segment2.endTime) -
                   Math.max(segment1.startTime, segment2.startTime);
    const totalDuration = Math.max(segment1.endTime, segment2.endTime) -
                         Math.min(segment1.startTime, segment2.startTime);

    return overlap / totalDuration > this.config.mergeThreshold! &&
           segment1.quality === segment2.quality;
  }

  private findOverlappingSegments(startTime: number, endTime: number, quality: string): SegmentItem[] {
    return Array.from(this.items.values())
      .filter(item =>
        item.quality === quality &&
        ((startTime <= item.endTime && endTime >= item.startTime) ||
         (item.startTime <= endTime && item.endTime >= startTime))
      );
  }

  async addSegment(
    buffer: ArrayBuffer,
    startTime: number,
    endTime: number,
    quality: string,
    bandwidth: number,
    metadata: Record<string, any> = {}
  ): Promise<string> {
    // Validate size and duration
    if (buffer.byteLength > this.config.maxSegmentSize!) {
      throw new Error(`Segment size exceeds maximum size (${this.config.maxSegmentSize} bytes)`);
    }

    const duration = endTime - startTime;
    if (duration > this.config.maxSegmentDuration!) {
      throw new Error(`Segment duration exceeds maximum duration (${this.config.maxSegmentDuration} seconds)`);
    }

    try {
      // Check for overlapping segments
      const overlapping = this.findOverlappingSegments(startTime, endTime, quality);

      if (overlapping.length > 0 && this.config.autoMerge) {
        // Merge overlapping segments
        const segments = [buffer, ...overlapping.map(item => this.segments.get(item.id)!)];
        const mergedBuffer = await this.mergeArrayBuffers(segments);

        // Calculate new time range
        const newStartTime = Math.min(startTime, ...overlapping.map(item => item.startTime));
        const newEndTime = Math.max(endTime, ...overlapping.map(item => item.endTime));

        // Remove old segments
        for (const item of overlapping) {
          this.removeSegment(item.id);
        }

        // Add merged segment
        return this.addSegment(mergedBuffer, newStartTime, newEndTime, quality, bandwidth, metadata);
      }

      // Generate ID and create item
      const id = crypto.randomUUID();
      const item: SegmentItem = {
        id,
        type: metadata.type || 'application/octet-stream',
        size: buffer.byteLength,
        duration,
        startTime,
        endTime,
        sequence: this.currentSequence++,
        quality,
        bandwidth,
        metadata
      };

      this.segments.set(id, buffer);
      this.items.set(id, item);

      this.notifySegmentEvent({
        type: 'add',
        segmentId: id,
        timestamp: performance.now(),
        details: { item }
      });

      return id;
    } catch (error) {
      this.notifySegmentEvent({
        type: 'error',
        timestamp: performance.now(),
        details: { error }
      });
      throw error;
    }
  }

  getSegment(id: string): ArrayBuffer | undefined {
    return this.segments.get(id);
  }

  removeSegment(id: string): boolean {
    const item = this.items.get(id);
    const segment = this.segments.get(id);

    if (item && segment) {
      this.items.delete(id);
      this.segments.delete(id);

      this.notifySegmentEvent({
        type: 'remove',
        segmentId: id,
        timestamp: performance.now(),
        details: { item }
      });

      return true;
    }

    return false;
  }

  async mergeSegments(ids: string[]): Promise<string | undefined> {
    if (ids.length < 2) return undefined;

    const items = ids.map(id => this.items.get(id))
      .filter((item): item is SegmentItem => item !== undefined);

    if (items.length !== ids.length) return undefined;

    // Check if all segments have the same quality
    const quality = items[0].quality;
    if (!items.every(item => item.quality === quality)) {
      throw new Error('Cannot merge segments with different qualities');
    }

    try {
      // Sort segments by start time
      items.sort((a, b) => a.startTime - b.startTime);

      // Merge buffers
      const buffers = items.map(item => this.segments.get(item.id)!);
      const mergedBuffer = await this.mergeArrayBuffers(buffers);

      // Calculate new time range and average bandwidth
      const startTime = Math.min(...items.map(item => item.startTime));
      const endTime = Math.max(...items.map(item => item.endTime));
      const bandwidth = items.reduce((sum, item) => sum + item.bandwidth, 0) / items.length;

      // Combine metadata
      const metadata = items.reduce((combined, item) => ({
        ...combined,
        ...item.metadata
      }), {});

      // Remove old segments
      for (const item of items) {
        this.removeSegment(item.id);
      }

      // Add merged segment
      const newId = await this.addSegment(
        mergedBuffer,
        startTime,
        endTime,
        quality,
        bandwidth,
        metadata
      );

      this.notifySegmentEvent({
        type: 'merge',
        segmentId: newId,
        timestamp: performance.now(),
        details: { mergedIds: ids, newItem: this.items.get(newId) }
      });

      return newId;
    } catch (error) {
      this.notifySegmentEvent({
        type: 'error',
        timestamp: performance.now(),
        details: { error }
      });
      throw error;
    }
  }

  async splitSegment(id: string, splitTimes: number[]): Promise<string[]> {
    const item = this.items.get(id);
    const segment = this.segments.get(id);

    if (!item || !segment) return [];

    try {
      // Validate split times
      splitTimes.sort((a, b) => a - b);
      if (splitTimes[0] <= item.startTime || splitTimes[splitTimes.length - 1] >= item.endTime) {
        throw new Error('Split times must be within segment duration');
      }

      // Calculate split points in buffer
      const timeToBytes = segment.byteLength / (item.endTime - item.startTime);
      const splitPoints = splitTimes.map(time =>
        Math.floor((time - item.startTime) * timeToBytes)
      );

      // Split buffer
      const buffers = await this.splitArrayBuffer(segment, splitPoints);

      // Remove original segment
      this.removeSegment(id);

      // Add new segments
      const newIds: string[] = [];
      let currentStartTime = item.startTime;

      for (let i = 0; i < buffers.length; i++) {
        const endTime = i < splitTimes.length ? splitTimes[i] : item.endTime;
        const newId = await this.addSegment(
          buffers[i],
          currentStartTime,
          endTime,
          item.quality,
          item.bandwidth,
          { ...item.metadata, splitIndex: i }
        );
        newIds.push(newId);
        currentStartTime = endTime;
      }

      this.notifySegmentEvent({
        type: 'split',
        segmentId: id,
        timestamp: performance.now(),
        details: { originalId: id, newIds, splitTimes }
      });

      return newIds;
    } catch (error) {
      this.notifySegmentEvent({
        type: 'error',
        timestamp: performance.now(),
        details: { error }
      });
      throw error;
    }
  }

  cleanup(): void {
    if (this.items.size <= this.config.maxSegments! * this.config.cleanupThreshold!) {
      return;
    }

    const itemsToRemove = Array.from(this.items.values())
      .sort((a, b) => {
        switch (this.config.strategy) {
          case 'timestamp':
            return a.startTime - b.startTime;
          case 'quality':
            return (b.bandwidth - a.bandwidth) || (a.startTime - b.startTime);
          case 'sequential':
            return a.sequence - b.sequence;
          default:
            return a.sequence - b.sequence;
        }
      })
      .slice(0, this.items.size - this.config.maxSegments!);

    for (const item of itemsToRemove) {
      this.removeSegment(item.id);
    }

    this.notifySegmentEvent({
      type: 'cleanup',
      timestamp: performance.now(),
      details: { removedCount: itemsToRemove.length }
    });
  }

  getItem(id: string): SegmentItem | undefined {
    return this.items.get(id);
  }

  getAllItems(): SegmentItem[] {
    return Array.from(this.items.values());
  }

  getSegmentCount(): number {
    return this.items.size;
  }

  getTotalSize(): number {
    return Array.from(this.segments.values())
      .reduce((sum, segment) => sum + segment.byteLength, 0);
  }

  getTotalDuration(): number {
    return Array.from(this.items.values())
      .reduce((sum, item) => sum + item.duration, 0);
  }

  getSegmentsInTimeRange(
    startTime: number,
    endTime: number,
    quality?: string
  ): SegmentItem[] {
    return Array.from(this.items.values())
      .filter(item =>
        (!quality || item.quality === quality) &&
        item.startTime <= endTime &&
        item.endTime >= startTime
      )
      .sort((a, b) => a.startTime - b.startTime);
  }

  getSegmentsByQuality(quality: string): SegmentItem[] {
    return Array.from(this.items.values())
      .filter(item => item.quality === quality)
      .sort((a, b) => a.startTime - b.startTime);
  }

  getAvailableQualities(): string[] {
    return Array.from(new Set(
      Array.from(this.items.values()).map(item => item.quality)
    )).sort();
  }

  onSegmentEvent(callback: SegmentEventCallback): () => void {
    this.onSegmentEventCallbacks.add(callback);
    return () => {
      this.onSegmentEventCallbacks.delete(callback);
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
const segmentManager = MediaSegmentManager.getInstance();

// Check if media segment is supported
console.log('Media Segment supported:', MediaSegmentManager.isSupported());

// Configure segment manager
segmentManager.configure({
  maxSegments: 2000,
  maxSegmentSize: 20 * 1024 * 1024,    // 20MB
  maxSegmentDuration: 15,               // 15 seconds
  segmentOverlap: 1,                    // 1 second
  autoMerge: true,
  mergeThreshold: 0.6,                  // 60% overlap
  autoCleanup: true,
  cleanupThreshold: 0.8,                // 80% of maxSegments
  strategy: 'quality'
});

// Set up event listener
const eventCleanup = segmentManager.onSegmentEvent(event => {
  console.log('Segment event:', event);
});

// Add segments
const buffer1 = new ArrayBuffer(1024 * 1024);  // 1MB
const id1 = await segmentManager.addSegment(
  buffer1,
  0,
  5,
  '1080p',
  5000000,  // 5 Mbps
  {
    type: 'video/mp4',
    codec: 'h264',
    segment: 1
  }
);

const buffer2 = new ArrayBuffer(1024 * 1024);  // 1MB
const id2 = await segmentManager.addSegment(
  buffer2,
  4,
  9,
  '1080p',
  5000000,  // 5 Mbps
  {
    type: 'video/mp4',
    codec: 'h264',
    segment: 2
  }
);

// Get segment information
console.log('Segment count:', segmentManager.getSegmentCount());
console.log('Total size:', segmentManager.getTotalSize());
console.log('Total duration:', segmentManager.getTotalDuration());
console.log('All items:', segmentManager.getAllItems());

// Get segments by time range and quality
console.log('Segments in range:', segmentManager.getSegmentsInTimeRange(2, 7, '1080p'));
console.log('Available qualities:', segmentManager.getAvailableQualities());
console.log('1080p segments:', segmentManager.getSegmentsByQuality('1080p'));

// Merge segments
const mergedId = await segmentManager.mergeSegments([id1, id2]);

// Split segment
const splitIds = await segmentManager.splitSegment(mergedId, [3, 6]);

// Remove segments
segmentManager.removeSegment(id1);
segmentManager.removeSegment(id2);

// Remove event listener
eventCleanup();
*/