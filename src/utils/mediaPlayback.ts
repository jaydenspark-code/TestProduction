type PlaybackConfig = {
  maxPlaybacks?: number;
  autoCleanup?: boolean;
  cleanupThreshold?: number;
  defaultVolume?: number;
  defaultPlaybackRate?: number;
  defaultMuted?: boolean;
  defaultLoop?: boolean;
  defaultAutoplay?: boolean;
  defaultPreload?: 'none' | 'metadata' | 'auto';
};

type PlaybackItem = {
  id: string;
  element: HTMLMediaElement;
  volume: number;
  playbackRate: number;
  muted: boolean;
  loop: boolean;
  autoplay: boolean;
  preload: 'none' | 'metadata' | 'auto';
  timestamp: number;
  metadata: Record<string, any>;
};

type PlaybackEvent = {
  type: 'play' | 'pause' | 'stop' | 'seek' | 'volumechange' | 'ratechange' | 'error' | 'cleanup';
  playbackId?: string;
  timestamp: number;
  details: any;
};

type PlaybackEventCallback = (event: PlaybackEvent) => void;

export class MediaPlaybackManager {
  private static instance: MediaPlaybackManager;
  private config: PlaybackConfig;
  private playbacks: Map<string, PlaybackItem>;
  private onPlaybackEventCallbacks: Set<PlaybackEventCallback>;

  private constructor() {
    this.config = this.getDefaultConfig();
    this.playbacks = new Map();
    this.onPlaybackEventCallbacks = new Set();
  }

  static getInstance(): MediaPlaybackManager {
    if (!MediaPlaybackManager.instance) {
      MediaPlaybackManager.instance = new MediaPlaybackManager();
    }
    return MediaPlaybackManager.instance;
  }

  private notifyPlaybackEvent(event: PlaybackEvent): void {
    this.onPlaybackEventCallbacks.forEach(callback => callback(event));
  }

  private getDefaultConfig(): PlaybackConfig {
    return {
      maxPlaybacks: 5,
      autoCleanup: true,
      cleanupThreshold: 0.8,
      defaultVolume: 1.0,
      defaultPlaybackRate: 1.0,
      defaultMuted: false,
      defaultLoop: false,
      defaultAutoplay: false,
      defaultPreload: 'metadata'
    };
  }

  configure(config: Partial<PlaybackConfig>): void {
    this.config = { ...this.config, ...config };

    if (this.config.autoCleanup && this.playbacks.size > this.config.maxPlaybacks! * this.config.cleanupThreshold!) {
      this.cleanup();
    }
  }

  private setupEventListeners(element: HTMLMediaElement, id: string): void {
    const eventHandler = (type: PlaybackEvent['type']) => () => {
      this.notifyPlaybackEvent({
        type,
        playbackId: id,
        timestamp: performance.now(),
        details: { playback: this.playbacks.get(id) }
      });
    };

    element.addEventListener('play', eventHandler('play'));
    element.addEventListener('pause', eventHandler('pause'));
    element.addEventListener('ended', eventHandler('stop'));
    element.addEventListener('seeking', eventHandler('seek'));
    element.addEventListener('volumechange', eventHandler('volumechange'));
    element.addEventListener('ratechange', eventHandler('ratechange'));
    element.addEventListener('error', () => {
      this.notifyPlaybackEvent({
        type: 'error',
        playbackId: id,
        timestamp: performance.now(),
        details: { error: element.error, playback: this.playbacks.get(id) }
      });
    });
  }

  private removeEventListeners(element: HTMLMediaElement): void {
    element.removeEventListener('play', () => {});
    element.removeEventListener('pause', () => {});
    element.removeEventListener('ended', () => {});
    element.removeEventListener('seeking', () => {});
    element.removeEventListener('volumechange', () => {});
    element.removeEventListener('ratechange', () => {});
    element.removeEventListener('error', () => {});
  }

  startPlayback(
    element: HTMLMediaElement,
    options: {
      volume?: number;
      playbackRate?: number;
      muted?: boolean;
      loop?: boolean;
      autoplay?: boolean;
      preload?: 'none' | 'metadata' | 'auto';
      metadata?: Record<string, any>;
    } = {}
  ): string {
    const id = crypto.randomUUID();
    const currentTime = performance.now();

    const playback: PlaybackItem = {
      id,
      element,
      volume: options.volume ?? this.config.defaultVolume!,
      playbackRate: options.playbackRate ?? this.config.defaultPlaybackRate!,
      muted: options.muted ?? this.config.defaultMuted!,
      loop: options.loop ?? this.config.defaultLoop!,
      autoplay: options.autoplay ?? this.config.defaultAutoplay!,
      preload: options.preload ?? this.config.defaultPreload!,
      timestamp: currentTime,
      metadata: options.metadata || {}
    };

    element.volume = playback.volume;
    element.playbackRate = playback.playbackRate;
    element.muted = playback.muted;
    element.loop = playback.loop;
    element.autoplay = playback.autoplay;
    element.preload = playback.preload;

    this.setupEventListeners(element, id);
    this.playbacks.set(id, playback);

    this.notifyPlaybackEvent({
      type: 'play',
      playbackId: id,
      timestamp: currentTime,
      details: { playback }
    });

    if (this.playbacks.size > this.config.maxPlaybacks! && this.config.autoCleanup) {
      this.cleanup();
    }

    if (playback.autoplay) {
      element.play().catch(error => {
        this.notifyPlaybackEvent({
          type: 'error',
          playbackId: id,
          timestamp: performance.now(),
          details: { error, playback }
        });
      });
    }

    return id;
  }

  stopPlayback(id: string): boolean {
    const playback = this.playbacks.get(id);

    if (playback) {
      playback.element.pause();
      playback.element.currentTime = 0;
      this.removeEventListeners(playback.element);
      this.playbacks.delete(id);

      this.notifyPlaybackEvent({
        type: 'stop',
        playbackId: id,
        timestamp: performance.now(),
        details: { playback }
      });

      return true;
    }

    return false;
  }

  async play(id: string): Promise<boolean> {
    const playback = this.playbacks.get(id);

    if (playback) {
      try {
        await playback.element.play();
        return true;
      } catch (error) {
        this.notifyPlaybackEvent({
          type: 'error',
          playbackId: id,
          timestamp: performance.now(),
          details: { error, playback }
        });
        return false;
      }
    }

    return false;
  }

  pause(id: string): boolean {
    const playback = this.playbacks.get(id);

    if (playback) {
      playback.element.pause();
      return true;
    }

    return false;
  }

  seek(id: string, time: number): boolean {
    const playback = this.playbacks.get(id);

    if (playback) {
      playback.element.currentTime = time;
      return true;
    }

    return false;
  }

  setVolume(id: string, volume: number): boolean {
    const playback = this.playbacks.get(id);

    if (playback) {
      playback.volume = Math.max(0, Math.min(1, volume));
      playback.element.volume = playback.volume;
      return true;
    }

    return false;
  }

  setPlaybackRate(id: string, rate: number): boolean {
    const playback = this.playbacks.get(id);

    if (playback) {
      playback.playbackRate = Math.max(0.25, Math.min(4, rate));
      playback.element.playbackRate = playback.playbackRate;
      return true;
    }

    return false;
  }

  setMuted(id: string, muted: boolean): boolean {
    const playback = this.playbacks.get(id);

    if (playback) {
      playback.muted = muted;
      playback.element.muted = muted;
      return true;
    }

    return false;
  }

  setLoop(id: string, loop: boolean): boolean {
    const playback = this.playbacks.get(id);

    if (playback) {
      playback.loop = loop;
      playback.element.loop = loop;
      return true;
    }

    return false;
  }

  getPlayback(id: string): PlaybackItem | undefined {
    return this.playbacks.get(id);
  }

  getAllPlaybacks(): PlaybackItem[] {
    return Array.from(this.playbacks.values());
  }

  getPlaybackCount(): number {
    return this.playbacks.size;
  }

  cleanup(): void {
    if (this.playbacks.size <= this.config.maxPlaybacks! * this.config.cleanupThreshold!) {
      return;
    }

    const playbacksToRemove = Array.from(this.playbacks.values())
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(0, this.playbacks.size - this.config.maxPlaybacks!);

    for (const playback of playbacksToRemove) {
      this.stopPlayback(playback.id);
    }

    this.notifyPlaybackEvent({
      type: 'cleanup',
      timestamp: performance.now(),
      details: { removedCount: playbacksToRemove.length }
    });
  }

  onPlaybackEvent(callback: PlaybackEventCallback): () => void {
    this.onPlaybackEventCallbacks.add(callback);
    return () => {
      this.onPlaybackEventCallbacks.delete(callback);
    };
  }

  static isSupported(): boolean {
    return typeof window !== 'undefined' &&
      'HTMLMediaElement' in window &&
      'play' in HTMLMediaElement.prototype &&
      'pause' in HTMLMediaElement.prototype &&
      'currentTime' in HTMLMediaElement.prototype &&
      'volume' in HTMLMediaElement.prototype &&
      'playbackRate' in HTMLMediaElement.prototype &&
      'crypto' in window &&
      'performance' in window;
  }
}

// Example usage:
/*
const playbackManager = MediaPlaybackManager.getInstance();

// Check if media playback is supported
console.log('Media Playback supported:', MediaPlaybackManager.isSupported());

// Configure playback manager
playbackManager.configure({
  maxPlaybacks: 3,
  autoCleanup: true,
  cleanupThreshold: 0.8,
  defaultVolume: 0.8,
  defaultPlaybackRate: 1.0,
  defaultMuted: false,
  defaultLoop: false,
  defaultAutoplay: true,
  defaultPreload: 'auto'
});

// Set up event listener
const eventCleanup = playbackManager.onPlaybackEvent(event => {
  console.log('Playback event:', event);
});

// Create video element
const video = document.createElement('video');
video.src = 'example.mp4';
document.body.appendChild(video);

// Start playback
const playbackId = playbackManager.startPlayback(video, {
  volume: 0.8,
  playbackRate: 1.0,
  muted: false,
  loop: true,
  autoplay: true,
  preload: 'auto',
  metadata: { name: 'Example Video' }
});

// Control playback
setTimeout(() => {
  playbackManager.pause(playbackId);
}, 3000);

setTimeout(() => {
  playbackManager.play(playbackId);
}, 5000);

setTimeout(() => {
  playbackManager.setVolume(playbackId, 0.5);
  playbackManager.setPlaybackRate(playbackId, 1.5);
}, 7000);

// Stop playback after 10 seconds
setTimeout(() => {
  playbackManager.stopPlayback(playbackId);
  video.remove();
}, 10000);

// Remove event listener
eventCleanup();
*/