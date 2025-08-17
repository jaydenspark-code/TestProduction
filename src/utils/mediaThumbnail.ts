type ThumbnailConfig = {
  maxThumbnails?: number;
  maxThumbnailSize?: number;
  autoCleanup?: boolean;
  cleanupThreshold?: number;
  strategy?: 'sequential' | 'timestamp' | 'quality' | 'custom';
  defaultWidth?: number;
  defaultHeight?: number;
  defaultQuality?: number;
  defaultFormat?: string;
  defaultFit?: 'contain' | 'cover' | 'fill' | 'inside' | 'outside';
};

type ThumbnailItem = {
  id: string;
  type: string;
  size: number;
  width: number;
  height: number;
  quality: number;
  format: string;
  fit: string;
  timestamp: number;
  sequence: number;
  metadata: Record<string, any>;
};

type ThumbnailEvent = {
  type: 'add' | 'remove' | 'update' | 'error' | 'cleanup';
  thumbnailId?: string;
  timestamp: number;
  details: any;
};

type ThumbnailEventCallback = (event: ThumbnailEvent) => void;

export class MediaThumbnailManager {
  private static instance: MediaThumbnailManager;
  private config: ThumbnailConfig;
  private thumbnails: Map<string, Blob>;
  private items: Map<string, ThumbnailItem>;
  private onThumbnailEventCallbacks: Set<ThumbnailEventCallback>;
  private currentSequence: number;

  private constructor() {
    this.config = this.getDefaultConfig();
    this.thumbnails = new Map();
    this.items = new Map();
    this.onThumbnailEventCallbacks = new Set();
    this.currentSequence = 0;
  }

  static getInstance(): MediaThumbnailManager {
    if (!MediaThumbnailManager.instance) {
      MediaThumbnailManager.instance = new MediaThumbnailManager();
    }
    return MediaThumbnailManager.instance;
  }

  private notifyThumbnailEvent(event: ThumbnailEvent): void {
    this.onThumbnailEventCallbacks.forEach(callback => callback(event));
  }

  private getDefaultConfig(): ThumbnailConfig {
    return {
      maxThumbnails: 1000,
      maxThumbnailSize: 1024 * 1024,      // 1MB
      autoCleanup: true,
      cleanupThreshold: 0.9,              // 90% of maxThumbnails
      strategy: 'sequential',
      defaultWidth: 320,
      defaultHeight: 180,
      defaultQuality: 0.8,
      defaultFormat: 'image/jpeg',
      defaultFit: 'cover'
    };
  }

  configure(config: Partial<ThumbnailConfig>): void {
    this.config = { ...this.config, ...config };

    if (this.config.autoCleanup && this.items.size > this.config.maxThumbnails! * this.config.cleanupThreshold!) {
      this.cleanup();
    }
  }

  private async createThumbnail(
    source: HTMLVideoElement | HTMLCanvasElement | ImageBitmap,
    options: {
      width?: number;
      height?: number;
      quality?: number;
      format?: string;
      fit?: 'contain' | 'cover' | 'fill' | 'inside' | 'outside';
    } = {}
  ): Promise<Blob> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    const width = options.width || this.config.defaultWidth!;
    const height = options.height || this.config.defaultHeight!;
    const quality = options.quality || this.config.defaultQuality!;
    const format = options.format || this.config.defaultFormat!;
    const fit = options.fit || this.config.defaultFit!;

    canvas.width = width;
    canvas.height = height;

    let sourceWidth: number;
    let sourceHeight: number;

    if (source instanceof HTMLVideoElement) {
      sourceWidth = source.videoWidth;
      sourceHeight = source.videoHeight;
    } else if (source instanceof HTMLCanvasElement) {
      sourceWidth = source.width;
      sourceHeight = source.height;
    } else {
      sourceWidth = source.width;
      sourceHeight = source.height;
    }

    const sourceAspect = sourceWidth / sourceHeight;
    const targetAspect = width / height;

    let sx = 0;
    let sy = 0;
    let sWidth = sourceWidth;
    let sHeight = sourceHeight;
    let dx = 0;
    let dy = 0;
    let dWidth = width;
    let dHeight = height;

    switch (fit) {
      case 'contain':
        if (sourceAspect > targetAspect) {
          dHeight = width / sourceAspect;
          dy = (height - dHeight) / 2;
        } else {
          dWidth = height * sourceAspect;
          dx = (width - dWidth) / 2;
        }
        break;

      case 'cover':
        if (sourceAspect > targetAspect) {
          sWidth = sourceHeight * targetAspect;
          sx = (sourceWidth - sWidth) / 2;
        } else {
          sHeight = sourceWidth / targetAspect;
          sy = (sourceHeight - sHeight) / 2;
        }
        break;

      case 'fill':
        // No adjustment needed
        break;

      case 'inside':
        if (sourceAspect > targetAspect) {
          dWidth = height * sourceAspect;
          dx = (width - dWidth) / 2;
        } else {
          dHeight = width / sourceAspect;
          dy = (height - dHeight) / 2;
        }
        break;

      case 'outside':
        if (sourceAspect > targetAspect) {
          sHeight = sourceWidth / targetAspect;
          sy = (sourceHeight - sHeight) / 2;
        } else {
          sWidth = sourceHeight * targetAspect;
          sx = (sourceWidth - sWidth) / 2;
        }
        break;
    }

    ctx.drawImage(source, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        blob => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create thumbnail blob'));
          }
        },
        format,
        quality
      );
    });
  }

  async addThumbnail(
    source: HTMLVideoElement | HTMLCanvasElement | ImageBitmap,
    options: {
      width?: number;
      height?: number;
      quality?: number;
      format?: string;
      fit?: 'contain' | 'cover' | 'fill' | 'inside' | 'outside';
      metadata?: Record<string, any>;
    } = {}
  ): Promise<string> {
    try {
      const thumbnail = await this.createThumbnail(source, options);

      if (thumbnail.size > this.config.maxThumbnailSize!) {
        throw new Error(`Thumbnail size exceeds maximum size (${this.config.maxThumbnailSize} bytes)`);
      }

      const id = crypto.randomUUID();
      const item: ThumbnailItem = {
        id,
        type: options.format || this.config.defaultFormat!,
        size: thumbnail.size,
        width: options.width || this.config.defaultWidth!,
        height: options.height || this.config.defaultHeight!,
        quality: options.quality || this.config.defaultQuality!,
        format: options.format || this.config.defaultFormat!,
        fit: options.fit || this.config.defaultFit!,
        timestamp: performance.now(),
        sequence: this.currentSequence++,
        metadata: options.metadata || {}
      };

      this.thumbnails.set(id, thumbnail);
      this.items.set(id, item);

      this.notifyThumbnailEvent({
        type: 'add',
        thumbnailId: id,
        timestamp: performance.now(),
        details: { item }
      });

      return id;
    } catch (error) {
      this.notifyThumbnailEvent({
        type: 'error',
        timestamp: performance.now(),
        details: { error }
      });
      throw error;
    }
  }

  async getThumbnail(id: string): Promise<Blob | undefined> {
    return this.thumbnails.get(id);
  }

  async getThumbnailUrl(id: string): Promise<string | undefined> {
    const thumbnail = this.thumbnails.get(id);
    if (!thumbnail) return undefined;
    return URL.createObjectURL(thumbnail);
  }

  removeThumbnail(id: string): boolean {
    const item = this.items.get(id);
    const thumbnail = this.thumbnails.get(id);

    if (item && thumbnail) {
      this.items.delete(id);
      this.thumbnails.delete(id);

      this.notifyThumbnailEvent({
        type: 'remove',
        thumbnailId: id,
        timestamp: performance.now(),
        details: { item }
      });

      return true;
    }

    return false;
  }

  async updateThumbnail(
    id: string,
    source: HTMLVideoElement | HTMLCanvasElement | ImageBitmap,
    options: {
      width?: number;
      height?: number;
      quality?: number;
      format?: string;
      fit?: 'contain' | 'cover' | 'fill' | 'inside' | 'outside';
      metadata?: Record<string, any>;
    } = {}
  ): Promise<boolean> {
    const item = this.items.get(id);
    if (!item) return false;

    try {
      const thumbnail = await this.createThumbnail(source, {
        width: options.width || item.width,
        height: options.height || item.height,
        quality: options.quality || item.quality,
        format: options.format || item.format,
        fit: options.fit || item.fit
      });

      if (thumbnail.size > this.config.maxThumbnailSize!) {
        throw new Error(`Thumbnail size exceeds maximum size (${this.config.maxThumbnailSize} bytes)`);
      }

      const updatedItem: ThumbnailItem = {
        ...item,
        size: thumbnail.size,
        width: options.width || item.width,
        height: options.height || item.height,
        quality: options.quality || item.quality,
        format: options.format || item.format,
        fit: options.fit || item.fit,
        timestamp: performance.now(),
        metadata: { ...item.metadata, ...options.metadata }
      };

      this.thumbnails.set(id, thumbnail);
      this.items.set(id, updatedItem);

      this.notifyThumbnailEvent({
        type: 'update',
        thumbnailId: id,
        timestamp: performance.now(),
        details: { oldItem: item, newItem: updatedItem }
      });

      return true;
    } catch (error) {
      this.notifyThumbnailEvent({
        type: 'error',
        timestamp: performance.now(),
        details: { error }
      });
      throw error;
    }
  }

  cleanup(): void {
    if (this.items.size <= this.config.maxThumbnails! * this.config.cleanupThreshold!) {
      return;
    }

    const itemsToRemove = Array.from(this.items.values())
      .sort((a, b) => {
        switch (this.config.strategy) {
          case 'timestamp':
            return a.timestamp - b.timestamp;
          case 'quality':
            return (b.quality - a.quality) || (a.timestamp - b.timestamp);
          case 'sequential':
            return a.sequence - b.sequence;
          default:
            return a.sequence - b.sequence;
        }
      })
      .slice(0, this.items.size - this.config.maxThumbnails!);

    for (const item of itemsToRemove) {
      this.removeThumbnail(item.id);
    }

    this.notifyThumbnailEvent({
      type: 'cleanup',
      timestamp: performance.now(),
      details: { removedCount: itemsToRemove.length }
    });
  }

  getItem(id: string): ThumbnailItem | undefined {
    return this.items.get(id);
  }

  getAllItems(): ThumbnailItem[] {
    return Array.from(this.items.values());
  }

  getThumbnailCount(): number {
    return this.items.size;
  }

  getTotalSize(): number {
    return Array.from(this.thumbnails.values())
      .reduce((sum, thumbnail) => sum + thumbnail.size, 0);
  }

  onThumbnailEvent(callback: ThumbnailEventCallback): () => void {
    this.onThumbnailEventCallbacks.add(callback);
    return () => {
      this.onThumbnailEventCallbacks.delete(callback);
    };
  }

  static isSupported(): boolean {
    return typeof window !== 'undefined' &&
      'HTMLCanvasElement' in window &&
      'createObjectURL' in URL &&
      'crypto' in window &&
      'performance' in window;
  }
}

// Example usage:
/*
const thumbnailManager = MediaThumbnailManager.getInstance();

// Check if media thumbnail is supported
console.log('Media Thumbnail supported:', MediaThumbnailManager.isSupported());

// Configure thumbnail manager
thumbnailManager.configure({
  maxThumbnails: 2000,
  maxThumbnailSize: 2 * 1024 * 1024,    // 2MB
  autoCleanup: true,
  cleanupThreshold: 0.8,                // 80% of maxThumbnails
  strategy: 'quality',
  defaultWidth: 640,
  defaultHeight: 360,
  defaultQuality: 0.9,
  defaultFormat: 'image/webp',
  defaultFit: 'cover'
});

// Set up event listener
const eventCleanup = thumbnailManager.onThumbnailEvent(event => {
  console.log('Thumbnail event:', event);
});

// Create a video element
const video = document.createElement('video');
video.src = 'video.mp4';

// Wait for video to load
await new Promise(resolve => {
  video.onloadedmetadata = resolve;
});

// Add thumbnail
const id = await thumbnailManager.addThumbnail(video, {
  width: 1280,
  height: 720,
  quality: 0.9,
  format: 'image/webp',
  fit: 'cover',
  metadata: {
    source: 'video.mp4',
    timestamp: 0
  }
});

// Get thumbnail information
console.log('Thumbnail count:', thumbnailManager.getThumbnailCount());
console.log('Total size:', thumbnailManager.getTotalSize());
console.log('All items:', thumbnailManager.getAllItems());

// Get thumbnail URL
const url = await thumbnailManager.getThumbnailUrl(id);
console.log('Thumbnail URL:', url);

// Update thumbnail
await thumbnailManager.updateThumbnail(id, video, {
  quality: 0.8,
  metadata: {
    timestamp: 5
  }
});

// Remove thumbnail
thumbnailManager.removeThumbnail(id);

// Remove event listener
eventCleanup();
*/