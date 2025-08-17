type TransformConfig = {
  maxTransforms?: number;
  autoCleanup?: boolean;
  cleanupThreshold?: number;
  defaultQuality?: number;
  defaultFormat?: string;
  defaultWidth?: number;
  defaultHeight?: number;
  defaultRotation?: number;
  defaultScale?: number;
  defaultFlip?: { horizontal: boolean; vertical: boolean };
  defaultCrop?: { x: number; y: number; width: number; height: number };
};

type TransformItem = {
  id: string;
  type: string;
  quality: number;
  format: string;
  width: number;
  height: number;
  rotation: number;
  scale: number;
  flip: { horizontal: boolean; vertical: boolean };
  crop: { x: number; y: number; width: number; height: number };
  timestamp: number;
  metadata: Record<string, any>;
};

type TransformEvent = {
  type: 'start' | 'complete' | 'error' | 'cleanup';
  transformId?: string;
  timestamp: number;
  details: any;
};

type TransformEventCallback = (event: TransformEvent) => void;

export class MediaTransformManager {
  private static instance: MediaTransformManager;
  private config: TransformConfig;
  private transforms: Map<string, TransformItem>;
  private results: Map<string, Blob>;
  private onTransformEventCallbacks: Set<TransformEventCallback>;

  private constructor() {
    this.config = this.getDefaultConfig();
    this.transforms = new Map();
    this.results = new Map();
    this.onTransformEventCallbacks = new Set();
  }

  static getInstance(): MediaTransformManager {
    if (!MediaTransformManager.instance) {
      MediaTransformManager.instance = new MediaTransformManager();
    }
    return MediaTransformManager.instance;
  }

  private notifyTransformEvent(event: TransformEvent): void {
    this.onTransformEventCallbacks.forEach(callback => callback(event));
  }

  private getDefaultConfig(): TransformConfig {
    return {
      maxTransforms: 1000,
      autoCleanup: true,
      cleanupThreshold: 0.9,              // 90% of maxTransforms
      defaultQuality: 0.8,
      defaultFormat: 'image/jpeg',
      defaultWidth: 0,                    // 0 means maintain aspect ratio
      defaultHeight: 0,                   // 0 means maintain aspect ratio
      defaultRotation: 0,
      defaultScale: 1,
      defaultFlip: { horizontal: false, vertical: false },
      defaultCrop: { x: 0, y: 0, width: 0, height: 0 }  // 0 means no crop
    };
  }

  configure(config: Partial<TransformConfig>): void {
    this.config = { ...this.config, ...config };

    if (this.config.autoCleanup && this.transforms.size > this.config.maxTransforms! * this.config.cleanupThreshold!) {
      this.cleanup();
    }
  }

  private async applyTransform(
    source: HTMLVideoElement | HTMLCanvasElement | ImageBitmap | HTMLImageElement,
    options: {
      quality?: number;
      format?: string;
      width?: number;
      height?: number;
      rotation?: number;
      scale?: number;
      flip?: { horizontal: boolean; vertical: boolean };
      crop?: { x: number; y: number; width: number; height: number };
    }
  ): Promise<Blob> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

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

    // Apply crop if specified
    const crop = options.crop || this.config.defaultCrop!;
    const cropX = crop.x || 0;
    const cropY = crop.y || 0;
    const cropWidth = crop.width || sourceWidth;
    const cropHeight = crop.height || sourceHeight;

    // Calculate dimensions
    const scale = options.scale || this.config.defaultScale!;
    const width = options.width || this.config.defaultWidth! || (cropWidth * scale);
    const height = options.height || this.config.defaultHeight! || (cropHeight * scale);

    canvas.width = width;
    canvas.height = height;

    // Apply transformations
    ctx.save();

    // Move to center for rotation
    ctx.translate(width / 2, height / 2);

    // Apply rotation
    const rotation = (options.rotation || this.config.defaultRotation!) * Math.PI / 180;
    ctx.rotate(rotation);

    // Apply flip
    const flip = options.flip || this.config.defaultFlip!;
    if (flip.horizontal) ctx.scale(-1, 1);
    if (flip.vertical) ctx.scale(1, -1);

    // Move back and draw
    ctx.translate(-width / 2, -height / 2);

    // Draw the image with all transformations applied
    ctx.drawImage(
      source,
      cropX, cropY, cropWidth, cropHeight,  // Source crop
      0, 0, width, height                   // Destination dimensions
    );

    ctx.restore();

    // Convert to blob
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        blob => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create transform blob'));
          }
        },
        options.format || this.config.defaultFormat!,
        options.quality || this.config.defaultQuality!
      );
    });
  }

  async transform(
    source: HTMLVideoElement | HTMLCanvasElement | ImageBitmap | HTMLImageElement,
    options: {
      quality?: number;
      format?: string;
      width?: number;
      height?: number;
      rotation?: number;
      scale?: number;
      flip?: { horizontal: boolean; vertical: boolean };
      crop?: { x: number; y: number; width: number; height: number };
      metadata?: Record<string, any>;
    } = {}
  ): Promise<string> {
    try {
      const id = crypto.randomUUID();
      const currentTime = performance.now();

      const transform: TransformItem = {
        id,
        type: options.format || this.config.defaultFormat!,
        quality: options.quality || this.config.defaultQuality!,
        format: options.format || this.config.defaultFormat!,
        width: options.width || this.config.defaultWidth!,
        height: options.height || this.config.defaultHeight!,
        rotation: options.rotation || this.config.defaultRotation!,
        scale: options.scale || this.config.defaultScale!,
        flip: options.flip || this.config.defaultFlip!,
        crop: options.crop || this.config.defaultCrop!,
        timestamp: currentTime,
        metadata: options.metadata || {}
      };

      this.transforms.set(id, transform);

      this.notifyTransformEvent({
        type: 'start',
        transformId: id,
        timestamp: currentTime,
        details: { transform }
      });

      const result = await this.applyTransform(source, options);
      this.results.set(id, result);

      this.notifyTransformEvent({
        type: 'complete',
        transformId: id,
        timestamp: performance.now(),
        details: { transform, size: result.size }
      });

      if (this.transforms.size > this.config.maxTransforms! && this.config.autoCleanup) {
        this.cleanup();
      }

      return id;
    } catch (error) {
      this.notifyTransformEvent({
        type: 'error',
        timestamp: performance.now(),
        details: { error }
      });
      throw error;
    }
  }

  async getTransformResult(id: string): Promise<Blob | undefined> {
    return this.results.get(id);
  }

  async getTransformUrl(id: string): Promise<string | undefined> {
    const result = this.results.get(id);
    if (!result) return undefined;
    return URL.createObjectURL(result);
  }

  removeTransform(id: string): boolean {
    const transform = this.transforms.get(id);
    const result = this.results.get(id);

    if (transform && result) {
      this.transforms.delete(id);
      this.results.delete(id);
      return true;
    }

    return false;
  }

  getTransform(id: string): TransformItem | undefined {
    return this.transforms.get(id);
  }

  getAllTransforms(): TransformItem[] {
    return Array.from(this.transforms.values());
  }

  getTransformCount(): number {
    return this.transforms.size;
  }

  getTotalSize(): number {
    return Array.from(this.results.values())
      .reduce((sum, result) => sum + result.size, 0);
  }

  cleanup(): void {
    if (this.transforms.size <= this.config.maxTransforms! * this.config.cleanupThreshold!) {
      return;
    }

    const transformsToRemove = Array.from(this.transforms.values())
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(0, this.transforms.size - this.config.maxTransforms!);

    for (const transform of transformsToRemove) {
      this.removeTransform(transform.id);
    }

    this.notifyTransformEvent({
      type: 'cleanup',
      timestamp: performance.now(),
      details: { removedCount: transformsToRemove.length }
    });
  }

  onTransformEvent(callback: TransformEventCallback): () => void {
    this.onTransformEventCallbacks.add(callback);
    return () => {
      this.onTransformEventCallbacks.delete(callback);
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
const transformManager = MediaTransformManager.getInstance();

// Check if media transform is supported
console.log('Media Transform supported:', MediaTransformManager.isSupported());

// Configure transform manager
transformManager.configure({
  maxTransforms: 2000,
  autoCleanup: true,
  cleanupThreshold: 0.8,
  defaultQuality: 0.9,
  defaultFormat: 'image/webp',
  defaultRotation: 0,
  defaultScale: 1,
  defaultFlip: { horizontal: false, vertical: false },
  defaultCrop: { x: 0, y: 0, width: 0, height: 0 }
});

// Set up event listener
const eventCleanup = transformManager.onTransformEvent(event => {
  console.log('Transform event:', event);
});

// Create an image element
const image = document.createElement('img');
image.src = 'image.jpg';

// Wait for image to load
await new Promise(resolve => {
  image.onload = resolve;
});

// Apply transform
const id = await transformManager.transform(image, {
  quality: 0.9,
  format: 'image/webp',
  width: 1280,
  height: 720,
  rotation: 90,
  scale: 1.5,
  flip: { horizontal: true, vertical: false },
  crop: { x: 100, y: 100, width: 800, height: 600 },
  metadata: {
    source: 'image.jpg',
    originalSize: { width: image.width, height: image.height }
  }
});

// Get transform information
console.log('Transform count:', transformManager.getTransformCount());
console.log('Total size:', transformManager.getTotalSize());
console.log('All transforms:', transformManager.getAllTransforms());

// Get transform result URL
const url = await transformManager.getTransformUrl(id);
console.log('Transform URL:', url);

// Remove transform
transformManager.removeTransform(id);

// Remove event listener
eventCleanup();
*/