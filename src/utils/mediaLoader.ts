type LoaderConfig = {
  maxLoaders?: number;
  autoCleanup?: boolean;
  cleanupThreshold?: number;
  defaultTimeout?: number;
  defaultRetries?: number;
  defaultRetryDelay?: number;
  defaultConcurrent?: number;
  defaultChunkSize?: number;
  defaultPreload?: boolean;
};

type LoaderItem = {
  id: string;
  url: string;
  type: string;
  size: number;
  loaded: number;
  status: 'pending' | 'loading' | 'loaded' | 'error' | 'aborted';
  timestamp: number;
  metadata: Record<string, any>;
};

type LoaderEvent = {
  type: 'start' | 'progress' | 'complete' | 'error' | 'abort' | 'cleanup';
  loaderId?: string;
  timestamp: number;
  details: any;
};

type LoaderEventCallback = (event: LoaderEvent) => void;

export class MediaLoaderManager {
  private static instance: MediaLoaderManager;
  private config: LoaderConfig;
  private loaders: Map<string, LoaderItem>;
  private onLoaderEventCallbacks: Set<LoaderEventCallback>;
  private abortControllers: Map<string, AbortController>;

  private constructor() {
    this.config = this.getDefaultConfig();
    this.loaders = new Map();
    this.onLoaderEventCallbacks = new Set();
    this.abortControllers = new Map();
  }

  static getInstance(): MediaLoaderManager {
    if (!MediaLoaderManager.instance) {
      MediaLoaderManager.instance = new MediaLoaderManager();
    }
    return MediaLoaderManager.instance;
  }

  private notifyLoaderEvent(event: LoaderEvent): void {
    this.onLoaderEventCallbacks.forEach(callback => callback(event));
  }

  private getDefaultConfig(): LoaderConfig {
    return {
      maxLoaders: 10,
      autoCleanup: true,
      cleanupThreshold: 0.8,
      defaultTimeout: 30000,
      defaultRetries: 3,
      defaultRetryDelay: 1000,
      defaultConcurrent: 3,
      defaultChunkSize: 1024 * 1024, // 1MB
      defaultPreload: false
    };
  }

  configure(config: Partial<LoaderConfig>): void {
    this.config = { ...this.config, ...config };

    if (this.config.autoCleanup && this.loaders.size > this.config.maxLoaders! * this.config.cleanupThreshold!) {
      this.cleanup();
    }
  }

  private async fetchWithProgress(
    url: string,
    id: string,
    options: {
      timeout?: number;
      retries?: number;
      retryDelay?: number;
      chunkSize?: number;
    } = {}
  ): Promise<Blob> {
    const {
      timeout = this.config.defaultTimeout!,
      retries = this.config.defaultRetries!,
      retryDelay = this.config.defaultRetryDelay!,
      chunkSize = this.config.defaultChunkSize!
    } = options;

    let attempt = 0;

    while (attempt <= retries) {
      try {
        const abortController = new AbortController();
        this.abortControllers.set(id, abortController);

        const response = await Promise.race([
          fetch(url, { signal: abortController.signal }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Request timeout')), timeout)
          )
        ]);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        if (!response.body) {
          throw new Error('ReadableStream not supported');
        }

        const contentLength = Number(response.headers.get('Content-Length')) || 0;
        const loader = this.loaders.get(id)!;
        loader.size = contentLength;
        loader.status = 'loading';

        const reader = response.body.getReader();
        const chunks: Uint8Array[] = [];
        let receivedLength = 0;

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          chunks.push(value);
          receivedLength += value.length;
          loader.loaded = receivedLength;

          this.notifyLoaderEvent({
            type: 'progress',
            loaderId: id,
            timestamp: performance.now(),
            details: {
              loaded: receivedLength,
              total: contentLength,
              progress: contentLength ? receivedLength / contentLength : 0
            }
          });
        }

        const blob = new Blob(chunks);
        this.abortControllers.delete(id);
        return blob;
      } catch (error) {
        this.abortControllers.delete(id);

        if (attempt === retries) {
          throw error;
        }

        attempt++;
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }

    throw new Error('Maximum retries exceeded');
  }

  async loadMedia(
    url: string,
    options: {
      type?: string;
      timeout?: number;
      retries?: number;
      retryDelay?: number;
      chunkSize?: number;
      metadata?: Record<string, any>;
    } = {}
  ): Promise<string> {
    const id = crypto.randomUUID();
    const currentTime = performance.now();

    const loader: LoaderItem = {
      id,
      url,
      type: options.type || this.getTypeFromUrl(url),
      size: 0,
      loaded: 0,
      status: 'pending',
      timestamp: currentTime,
      metadata: options.metadata || {}
    };

    this.loaders.set(id, loader);

    this.notifyLoaderEvent({
      type: 'start',
      loaderId: id,
      timestamp: currentTime,
      details: { loader }
    });

    if (this.loaders.size > this.config.maxLoaders! && this.config.autoCleanup) {
      this.cleanup();
    }

    try {
      const blob = await this.fetchWithProgress(url, id, options);
      loader.status = 'loaded';

      this.notifyLoaderEvent({
        type: 'complete',
        loaderId: id,
        timestamp: performance.now(),
        details: { loader, blob }
      });

      return id;
    } catch (error) {
      loader.status = 'error';

      this.notifyLoaderEvent({
        type: 'error',
        loaderId: id,
        timestamp: performance.now(),
        details: { error, loader }
      });

      throw error;
    }
  }

  abortLoad(id: string): boolean {
    const loader = this.loaders.get(id);
    const abortController = this.abortControllers.get(id);

    if (loader && abortController) {
      abortController.abort();
      this.abortControllers.delete(id);
      loader.status = 'aborted';

      this.notifyLoaderEvent({
        type: 'abort',
        loaderId: id,
        timestamp: performance.now(),
        details: { loader }
      });

      return true;
    }

    return false;
  }

  removeLoader(id: string): boolean {
    const loader = this.loaders.get(id);

    if (loader) {
      if (loader.status === 'loading') {
        this.abortLoad(id);
      }

      this.loaders.delete(id);
      return true;
    }

    return false;
  }

  getLoader(id: string): LoaderItem | undefined {
    return this.loaders.get(id);
  }

  getAllLoaders(): LoaderItem[] {
    return Array.from(this.loaders.values());
  }

  getLoaderCount(): number {
    return this.loaders.size;
  }

  private getTypeFromUrl(url: string): string {
    const extension = url.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      mp4: 'video/mp4',
      webm: 'video/webm',
      ogg: 'video/ogg',
      mp3: 'audio/mpeg',
      wav: 'audio/wav',
      aac: 'audio/aac',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp'
    };

    return extension && mimeTypes[extension] ? mimeTypes[extension] : 'application/octet-stream';
  }

  cleanup(): void {
    if (this.loaders.size <= this.config.maxLoaders! * this.config.cleanupThreshold!) {
      return;
    }

    const loadersToRemove = Array.from(this.loaders.values())
      .filter(loader => loader.status !== 'loading')
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(0, this.loaders.size - this.config.maxLoaders!);

    for (const loader of loadersToRemove) {
      this.removeLoader(loader.id);
    }

    this.notifyLoaderEvent({
      type: 'cleanup',
      timestamp: performance.now(),
      details: { removedCount: loadersToRemove.length }
    });
  }

  onLoaderEvent(callback: LoaderEventCallback): () => void {
    this.onLoaderEventCallbacks.add(callback);
    return () => {
      this.onLoaderEventCallbacks.delete(callback);
    };
  }

  static isSupported(): boolean {
    return typeof window !== 'undefined' &&
      'fetch' in window &&
      'ReadableStream' in window &&
      'AbortController' in window &&
      'Blob' in window &&
      'crypto' in window &&
      'performance' in window;
  }
}

// Example usage:
/*
const loaderManager = MediaLoaderManager.getInstance();

// Check if media loader is supported
console.log('Media Loader supported:', MediaLoaderManager.isSupported());

// Configure loader manager
loaderManager.configure({
  maxLoaders: 5,
  autoCleanup: true,
  cleanupThreshold: 0.8,
  defaultTimeout: 30000,
  defaultRetries: 3,
  defaultRetryDelay: 1000,
  defaultConcurrent: 2,
  defaultChunkSize: 1024 * 1024,
  defaultPreload: false
});

// Set up event listener
const eventCleanup = loaderManager.onLoaderEvent(event => {
  console.log('Loader event:', event);
});

// Load media
try {
  const loaderId = await loaderManager.loadMedia('example.mp4', {
    type: 'video/mp4',
    timeout: 60000,
    retries: 3,
    retryDelay: 2000,
    chunkSize: 2 * 1024 * 1024,
    metadata: { name: 'Example Video' }
  });

  // Get loader information
  const loader = loaderManager.getLoader(loaderId);
  console.log('Loader:', loader);

  // Abort loading after 5 seconds
  setTimeout(() => {
    loaderManager.abortLoad(loaderId);
  }, 5000);
} catch (error) {
  console.error('Loading failed:', error);
}

// Remove event listener
eventCleanup();
*/