type MediaSourceOptions = {
  type: string;
  codecs?: string;
  duration?: number;
  size?: number;
};

type MediaSourceState = {
  readyState: ReadyState;
  duration: number;
  size: number;
  sourceBuffers: SourceBufferInfo[];
};

type SourceBufferInfo = {
  type: string;
  size: number;
  buffered: TimeRanges;
  updating: boolean;
  timestampOffset: number;
  appendWindowStart: number;
  appendWindowEnd: number;
};

type ReadyState = 'closed' | 'open' | 'ended';

type MediaSourceCallback = (state: MediaSourceState) => void;

export class MediaSourceManager {
  private static instance: MediaSourceManager;
  private mediaSource: MediaSource | null;
  private state: MediaSourceState;
  private sourceBuffers: Map<string, SourceBuffer>;
  private onStateChangeCallbacks: Set<MediaSourceCallback>;
  private onErrorCallbacks: Set<(error: Error) => void>;
  private options: MediaSourceOptions;

  private constructor() {
    this.mediaSource = null;
    this.state = {
      readyState: 'closed',
      duration: 0,
      size: 0,
      sourceBuffers: []
    };
    this.sourceBuffers = new Map();
    this.onStateChangeCallbacks = new Set();
    this.onErrorCallbacks = new Set();
    this.options = {
      type: 'video/mp4'
    };
  }

  static getInstance(): MediaSourceManager {
    if (!MediaSourceManager.instance) {
      MediaSourceManager.instance = new MediaSourceManager();
    }
    return MediaSourceManager.instance;
  }

  private updateState(): void {
    if (!this.mediaSource) return;

    const sourceBuffers: SourceBufferInfo[] = [];
    this.sourceBuffers.forEach((buffer, type) => {
      sourceBuffers.push({
        type,
        size: this.calculateBufferSize(buffer),
        buffered: buffer.buffered,
        updating: buffer.updating,
        timestampOffset: buffer.timestampOffset,
        appendWindowStart: buffer.appendWindowStart,
        appendWindowEnd: buffer.appendWindowEnd
      });
    });

    this.state = {
      readyState: this.mediaSource.readyState as ReadyState,
      duration: this.mediaSource.duration,
      size: sourceBuffers.reduce((total, buffer) => total + buffer.size, 0),
      sourceBuffers
    };

    this.notifyStateChange();
  }

  private calculateBufferSize(buffer: SourceBuffer): number {
    let size = 0;
    for (let i = 0; i < buffer.buffered.length; i++) {
      const start = buffer.buffered.start(i);
      const end = buffer.buffered.end(i);
      size += (end - start) * this.options.size! || 0;
    }
    return size;
  }

  private notifyStateChange(): void {
    this.onStateChangeCallbacks.forEach(callback => callback(this.state));
  }

  private notifyError(error: Error): void {
    this.onErrorCallbacks.forEach(callback => callback(error));
  }

  initialize(options: MediaSourceOptions): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        this.options = { ...this.options, ...options };
        this.mediaSource = new MediaSource();

        this.mediaSource.addEventListener('sourceopen', () => {
          this.updateState();
          resolve(URL.createObjectURL(this.mediaSource));
        });

        this.mediaSource.addEventListener('sourceended', () => {
          this.updateState();
        });

        this.mediaSource.addEventListener('sourceclose', () => {
          this.updateState();
        });
      } catch (error) {
        this.notifyError(error as Error);
        reject(error);
      }
    });
  }

  addSourceBuffer(type: string): SourceBuffer | null {
    if (!this.mediaSource || this.mediaSource.readyState !== 'open') return null;

    try {
      const mimeType = this.options.codecs ?
        `${type};codecs=${this.options.codecs}` : type;

      const sourceBuffer = this.mediaSource.addSourceBuffer(mimeType);
      this.sourceBuffers.set(type, sourceBuffer);

      sourceBuffer.addEventListener('updateend', () => {
        this.updateState();
      });

      sourceBuffer.addEventListener('error', (error) => {
        this.notifyError(error as Error);
      });

      this.updateState();
      return sourceBuffer;
    } catch (error) {
      this.notifyError(error as Error);
      return null;
    }
  }

  removeSourceBuffer(type: string): void {
    if (!this.mediaSource) return;

    const sourceBuffer = this.sourceBuffers.get(type);
    if (sourceBuffer) {
      try {
        this.mediaSource.removeSourceBuffer(sourceBuffer);
        this.sourceBuffers.delete(type);
        this.updateState();
      } catch (error) {
        this.notifyError(error as Error);
      }
    }
  }

  appendBuffer(type: string, data: ArrayBuffer): Promise<void> {
    return new Promise((resolve, reject) => {
      const sourceBuffer = this.sourceBuffers.get(type);
      if (!sourceBuffer) {
        const error = new Error(`Source buffer not found for type: ${type}`);
        this.notifyError(error);
        reject(error);
        return;
      }

      try {
        if (!sourceBuffer.updating) {
          sourceBuffer.appendBuffer(data);
          sourceBuffer.addEventListener('updateend', () => {
            this.updateState();
            resolve();
          }, { once: true });
        } else {
          const error = new Error('Source buffer is currently updating');
          this.notifyError(error);
          reject(error);
        }
      } catch (error) {
        this.notifyError(error as Error);
        reject(error);
      }
    });
  }

  remove(type: string, start: number, end: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const sourceBuffer = this.sourceBuffers.get(type);
      if (!sourceBuffer) {
        const error = new Error(`Source buffer not found for type: ${type}`);
        this.notifyError(error);
        reject(error);
        return;
      }

      try {
        if (!sourceBuffer.updating) {
          sourceBuffer.remove(start, end);
          sourceBuffer.addEventListener('updateend', () => {
            this.updateState();
            resolve();
          }, { once: true });
        } else {
          const error = new Error('Source buffer is currently updating');
          this.notifyError(error);
          reject(error);
        }
      } catch (error) {
        this.notifyError(error as Error);
        reject(error);
      }
    });
  }

  setDuration(duration: number): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.mediaSource) {
        const error = new Error('MediaSource not initialized');
        this.notifyError(error);
        reject(error);
        return;
      }

      try {
        this.mediaSource.duration = duration;
        this.mediaSource.addEventListener('durationchange', () => {
          this.updateState();
          resolve();
        }, { once: true });
      } catch (error) {
        this.notifyError(error as Error);
        reject(error);
      }
    });
  }

  endOfStream(error?: string): void {
    if (!this.mediaSource) return;

    try {
      this.mediaSource.endOfStream(error as EndOfStreamError);
      this.updateState();
    } catch (e) {
      this.notifyError(e as Error);
    }
  }

  getState(): MediaSourceState {
    return this.state;
  }

  getSourceBuffer(type: string): SourceBuffer | undefined {
    return this.sourceBuffers.get(type);
  }

  onStateChange(callback: MediaSourceCallback): () => void {
    this.onStateChangeCallbacks.add(callback);

    // Return cleanup function
    return () => {
      this.onStateChangeCallbacks.delete(callback);
    };
  }

  onError(callback: (error: Error) => void): () => void {
    this.onErrorCallbacks.add(callback);

    // Return cleanup function
    return () => {
      this.onErrorCallbacks.delete(callback);
    };
  }

  cleanup(): void {
    if (this.mediaSource && this.mediaSource.readyState === 'open') {
      this.endOfStream();
    }

    this.sourceBuffers.clear();
    this.onStateChangeCallbacks.clear();
    this.onErrorCallbacks.clear();
    this.mediaSource = null;
  }

  static isSupported(): boolean {
    return typeof window !== 'undefined' && 'MediaSource' in window;
  }

  static isTypeSupported(type: string, codecs?: string): boolean {
    if (!MediaSourceManager.isSupported()) return false;

    const mimeType = codecs ? `${type};codecs=${codecs}` : type;
    return MediaSource.isTypeSupported(mimeType);
  }
}

// Example usage:
/*
const mediaSource = MediaSourceManager.getInstance();

// Check if MediaSource is supported
console.log('MediaSource supported:', MediaSourceManager.isSupported());
console.log('MP4 support:', MediaSourceManager.isTypeSupported('video/mp4', 'avc1.42E01E,mp4a.40.2'));

// Set up state change listener
const stateCleanup = mediaSource.onStateChange(state => {
  console.log('MediaSource state changed:', state);
});

// Set up error listener
const errorCleanup = mediaSource.onError(error => {
  console.error('MediaSource error:', error);
});

// Initialize MediaSource
mediaSource.initialize({
  type: 'video/mp4',
  codecs: 'avc1.42E01E,mp4a.40.2',
  duration: 60,
  size: 1024 * 1024 // 1MB per second estimation
})
.then(url => {
  console.log('MediaSource URL:', url);

  // Add video and audio source buffers
  const videoBuffer = mediaSource.addSourceBuffer('video/mp4');
  const audioBuffer = mediaSource.addSourceBuffer('audio/mp4');

  if (videoBuffer && audioBuffer) {
    // Append video data
    fetch('video.mp4')
      .then(response => response.arrayBuffer())
      .then(data => mediaSource.appendBuffer('video/mp4', data))
      .then(() => {
        console.log('Video data appended');
        return fetch('audio.mp4');
      })
      .then(response => response.arrayBuffer())
      .then(data => mediaSource.appendBuffer('audio/mp4', data))
      .then(() => {
        console.log('Audio data appended');
        mediaSource.endOfStream();

        // Clean up after 10 seconds
        setTimeout(() => {
          stateCleanup();
          errorCleanup();
          mediaSource.cleanup();
        }, 10000);
      })
      .catch(error => {
        console.error('Failed to append data:', error);
      });
  }
})
.catch(error => {
  console.error('Failed to initialize MediaSource:', error);
});
*/