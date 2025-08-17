type MediaElementOptions = {
  autoplay?: boolean;
  controls?: boolean;
  crossOrigin?: 'anonymous' | 'use-credentials' | null;
  loop?: boolean;
  muted?: boolean;
  preload?: 'none' | 'metadata' | 'auto';
  volume?: number;
  playbackRate?: number;
};

type MediaElementState = {
  currentTime: number;
  duration: number;
  ended: boolean;
  error: MediaError | null;
  networkState: number;
  paused: boolean;
  playbackRate: number;
  played: TimeRanges;
  readyState: number;
  seeking: boolean;
  volume: number;
  muted: boolean;
};

type MediaElementCallback = (state: MediaElementState) => void;

export class MediaElementManager {
  private static instance: MediaElementManager;
  private elements: Map<string, HTMLMediaElement>;
  private states: Map<string, MediaElementState>;
  private onStateChangeCallbacks: Map<string, Set<MediaElementCallback>>;
  private onErrorCallbacks: Map<string, Set<(error: Error) => void>>;

  private constructor() {
    this.elements = new Map();
    this.states = new Map();
    this.onStateChangeCallbacks = new Map();
    this.onErrorCallbacks = new Map();
  }

  static getInstance(): MediaElementManager {
    if (!MediaElementManager.instance) {
      MediaElementManager.instance = new MediaElementManager();
    }
    return MediaElementManager.instance;
  }

  private notifyStateChange(id: string): void {
    const state = this.states.get(id);
    if (state && this.onStateChangeCallbacks.has(id)) {
      this.onStateChangeCallbacks.get(id)?.forEach(callback => callback(state));
    }
  }

  private notifyError(id: string, error: Error): void {
    if (this.onErrorCallbacks.has(id)) {
      this.onErrorCallbacks.get(id)?.forEach(callback => callback(error));
    }
  }

  private updateState(id: string, element: HTMLMediaElement): void {
    const state: MediaElementState = {
      currentTime: element.currentTime,
      duration: element.duration,
      ended: element.ended,
      error: element.error,
      networkState: element.networkState,
      paused: element.paused,
      playbackRate: element.playbackRate,
      played: element.played,
      readyState: element.readyState,
      seeking: element.seeking,
      volume: element.volume,
      muted: element.muted
    };

    this.states.set(id, state);
    this.notifyStateChange(id);
  }

  private setupEventListeners(id: string, element: HTMLMediaElement): void {
    const events = [
      'timeupdate',
      'durationchange',
      'ended',
      'error',
      'loadeddata',
      'loadedmetadata',
      'pause',
      'play',
      'playing',
      'progress',
      'ratechange',
      'seeked',
      'seeking',
      'stalled',
      'volumechange',
      'waiting'
    ];

    events.forEach(event => {
      element.addEventListener(event, () => {
        this.updateState(id, element);
      });
    });

    element.addEventListener('error', () => {
      if (element.error) {
        this.notifyError(id, new Error(element.error.message));
      }
    });
  }

  registerElement(id: string, element: HTMLMediaElement, options: MediaElementOptions = {}): void {
    if (this.elements.has(id)) {
      throw new Error(`Element with id ${id} is already registered`);
    }

    // Apply options
    if (typeof options.autoplay !== 'undefined') element.autoplay = options.autoplay;
    if (typeof options.controls !== 'undefined') element.controls = options.controls;
    if (typeof options.crossOrigin !== 'undefined') element.crossOrigin = options.crossOrigin;
    if (typeof options.loop !== 'undefined') element.loop = options.loop;
    if (typeof options.muted !== 'undefined') element.muted = options.muted;
    if (typeof options.preload !== 'undefined') element.preload = options.preload;
    if (typeof options.volume !== 'undefined') element.volume = options.volume;
    if (typeof options.playbackRate !== 'undefined') element.playbackRate = options.playbackRate;

    this.elements.set(id, element);
    this.onStateChangeCallbacks.set(id, new Set());
    this.onErrorCallbacks.set(id, new Set());
    this.setupEventListeners(id, element);
    this.updateState(id, element);
  }

  unregisterElement(id: string): void {
    const element = this.elements.get(id);
    if (!element) return;

    this.elements.delete(id);
    this.states.delete(id);
    this.onStateChangeCallbacks.delete(id);
    this.onErrorCallbacks.delete(id);
  }

  getElement(id: string): HTMLMediaElement | undefined {
    return this.elements.get(id);
  }

  getState(id: string): MediaElementState | undefined {
    return this.states.get(id);
  }

  async play(id: string): Promise<void> {
    const element = this.elements.get(id);
    if (!element) throw new Error(`Element with id ${id} not found`);

    try {
      await element.play();
    } catch (error) {
      this.notifyError(id, error as Error);
      throw error;
    }
  }

  pause(id: string): void {
    const element = this.elements.get(id);
    if (!element) throw new Error(`Element with id ${id} not found`);
    element.pause();
  }

  seek(id: string, time: number): void {
    const element = this.elements.get(id);
    if (!element) throw new Error(`Element with id ${id} not found`);
    element.currentTime = time;
  }

  setVolume(id: string, volume: number): void {
    const element = this.elements.get(id);
    if (!element) throw new Error(`Element with id ${id} not found`);
    element.volume = Math.max(0, Math.min(1, volume));
  }

  setMuted(id: string, muted: boolean): void {
    const element = this.elements.get(id);
    if (!element) throw new Error(`Element with id ${id} not found`);
    element.muted = muted;
  }

  setPlaybackRate(id: string, rate: number): void {
    const element = this.elements.get(id);
    if (!element) throw new Error(`Element with id ${id} not found`);
    element.playbackRate = rate;
  }

  setSource(id: string, source: string): void {
    const element = this.elements.get(id);
    if (!element) throw new Error(`Element with id ${id} not found`);
    element.src = source;
  }

  load(id: string): void {
    const element = this.elements.get(id);
    if (!element) throw new Error(`Element with id ${id} not found`);
    element.load();
  }

  onStateChange(id: string, callback: MediaElementCallback): () => void {
    const callbacks = this.onStateChangeCallbacks.get(id);
    if (!callbacks) throw new Error(`Element with id ${id} not found`);

    callbacks.add(callback);

    // Return cleanup function
    return () => {
      callbacks.delete(callback);
    };
  }

  onError(id: string, callback: (error: Error) => void): () => void {
    const callbacks = this.onErrorCallbacks.get(id);
    if (!callbacks) throw new Error(`Element with id ${id} not found`);

    callbacks.add(callback);

    // Return cleanup function
    return () => {
      callbacks.delete(callback);
    };
  }

  cleanup(): void {
    this.elements.clear();
    this.states.clear();
    this.onStateChangeCallbacks.clear();
    this.onErrorCallbacks.clear();
  }

  static isSupported(): boolean {
    return typeof window !== 'undefined' &&
      ('HTMLMediaElement' in window);
  }
}

// Example usage:
/*
const mediaManager = MediaElementManager.getInstance();

// Check if media elements are supported
console.log('Media Elements supported:', MediaElementManager.isSupported());

// Create a video element
const video = document.createElement('video');

// Register the video element
mediaManager.registerElement('main-video', video, {
  autoplay: false,
  controls: true,
  preload: 'auto',
  volume: 0.5
});

// Set up state change listener
const stateCleanup = mediaManager.onStateChange('main-video', state => {
  console.log('Media state changed:', state);
});

// Set up error listener
const errorCleanup = mediaManager.onError('main-video', error => {
  console.error('Media error:', error);
});

// Set source and play
mediaManager.setSource('main-video', 'video.mp4');
mediaManager.play('main-video')
  .then(() => {
    console.log('Playback started');

    // Demonstrate various controls
    setTimeout(() => {
      mediaManager.setVolume('main-video', 0.8);
      mediaManager.setPlaybackRate('main-video', 1.5);
    }, 2000);

    setTimeout(() => {
      mediaManager.pause('main-video');
    }, 5000);

    // Clean up after 10 seconds
    setTimeout(() => {
      stateCleanup();
      errorCleanup();
      mediaManager.unregisterElement('main-video');
      mediaManager.cleanup();
    }, 10000);
  })
  .catch(error => {
    console.error('Failed to start playback:', error);
  });
*/