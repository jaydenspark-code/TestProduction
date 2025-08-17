type MediaMetadata = {
  title?: string;
  artist?: string;
  album?: string;
  artwork?: Array<{
    src: string;
    sizes: string;
    type: string;
  }>;
};

type MediaPositionState = {
  duration?: number;
  playbackRate?: number;
  position?: number;
};

type MediaSessionCallback = () => void;

export class MediaSessionManager {
  private static instance: MediaSessionManager;
  private metadata: MediaMetadata;
  private positionState: MediaPositionState;
  private onPlaybackStateChangeCallbacks: Set<(state: string) => void>;
  private onPositionStateChangeCallbacks: Set<(state: MediaPositionState) => void>;

  private constructor() {
    this.metadata = {};
    this.positionState = {};
    this.onPlaybackStateChangeCallbacks = new Set();
    this.onPositionStateChangeCallbacks = new Set();

    if (this.isSupported()) {
      this.setupActionHandlers();
    }
  }

  static getInstance(): MediaSessionManager {
    if (!MediaSessionManager.instance) {
      MediaSessionManager.instance = new MediaSessionManager();
    }
    return MediaSessionManager.instance;
  }

  private setupActionHandlers(): void {
    if (!navigator.mediaSession) return;

    const actionHandlers: { [key: string]: MediaSessionCallback } = {
      play: () => this.play(),
      pause: () => this.pause(),
      stop: () => this.stop(),
      seekbackward: () => this.seekBackward(),
      seekforward: () => this.seekForward(),
      seekto: () => this.seekTo(),
      previoustrack: () => this.previousTrack(),
      nexttrack: () => this.nextTrack()
    };

    Object.entries(actionHandlers).forEach(([action, handler]) => {
      try {
        navigator.mediaSession.setActionHandler(
          action as MediaSessionAction,
          handler
        );
      } catch (error) {
        console.warn(`The media session action "${action}" is not supported`);
      }
    });
  }

  private notifyPlaybackStateChange(state: string): void {
    this.onPlaybackStateChangeCallbacks.forEach(callback => callback(state));
  }

  private notifyPositionStateChange(state: MediaPositionState): void {
    this.onPositionStateChangeCallbacks.forEach(callback => callback(state));
  }

  setMetadata(metadata: MediaMetadata): void {
    if (!this.isSupported()) return;

    this.metadata = metadata;
    navigator.mediaSession.metadata = new window.MediaMetadata(metadata);
  }

  setPositionState(state: MediaPositionState): void {
    if (!this.isSupported()) return;

    this.positionState = state;
    navigator.mediaSession.setPositionState(state);
    this.notifyPositionStateChange(state);
  }

  setPlaybackState(state: 'none' | 'paused' | 'playing'): void {
    if (!this.isSupported()) return;

    navigator.mediaSession.playbackState = state;
    this.notifyPlaybackStateChange(state);
  }

  play(): void {
    this.setPlaybackState('playing');
  }

  pause(): void {
    this.setPlaybackState('paused');
  }

  stop(): void {
    this.setPlaybackState('none');
  }

  seekBackward(skipTime: number = 10): void {
    if (this.positionState.position !== undefined) {
      this.setPositionState({
        ...this.positionState,
        position: Math.max(0, this.positionState.position - skipTime)
      });
    }
  }

  seekForward(skipTime: number = 10): void {
    if (
      this.positionState.position !== undefined &&
      this.positionState.duration !== undefined
    ) {
      this.setPositionState({
        ...this.positionState,
        position: Math.min(
          this.positionState.duration,
          this.positionState.position + skipTime
        )
      });
    }
  }

  seekTo(position?: number): void {
    if (position !== undefined) {
      this.setPositionState({
        ...this.positionState,
        position
      });
    }
  }

  previousTrack(): void {
    // Implement custom previous track logic
  }

  nextTrack(): void {
    // Implement custom next track logic
  }

  getMetadata(): MediaMetadata {
    return this.metadata;
  }

  getPositionState(): MediaPositionState {
    return this.positionState;
  }

  getPlaybackState(): string | null {
    return this.isSupported() ? navigator.mediaSession.playbackState : null;
  }

  onPlaybackStateChange(callback: (state: string) => void): () => void {
    this.onPlaybackStateChangeCallbacks.add(callback);

    // Return cleanup function
    return () => {
      this.onPlaybackStateChangeCallbacks.delete(callback);
    };
  }

  onPositionStateChange(callback: (state: MediaPositionState) => void): () => void {
    this.onPositionStateChangeCallbacks.add(callback);

    // Return cleanup function
    return () => {
      this.onPositionStateChangeCallbacks.delete(callback);
    };
  }

  cleanup(): void {
    if (!this.isSupported()) return;

    // Clear metadata
    this.metadata = {};
    navigator.mediaSession.metadata = null;

    // Clear position state
    this.positionState = {};
    navigator.mediaSession.setPositionState();

    // Clear playback state
    navigator.mediaSession.playbackState = 'none';

    // Clear all action handlers
    const actions = [
      'play',
      'pause',
      'stop',
      'seekbackward',
      'seekforward',
      'seekto',
      'previoustrack',
      'nexttrack'
    ];

    actions.forEach(action => {
      try {
        navigator.mediaSession.setActionHandler(
          action as MediaSessionAction,
          null
        );
      } catch (error) {
        // Ignore unsupported actions
      }
    });

    // Clear callbacks
    this.onPlaybackStateChangeCallbacks.clear();
    this.onPositionStateChangeCallbacks.clear();
  }

  static isSupported(): boolean {
    return typeof window !== 'undefined' &&
      'mediaSession' in navigator &&
      'MediaMetadata' in window;
  }
}

// Example usage:
/*
const mediaSession = MediaSessionManager.getInstance();

// Check if Media Session API is supported
console.log('Media Session API supported:', MediaSessionManager.isSupported());

// Set up state change listeners
const playbackStateCleanup = mediaSession.onPlaybackStateChange(state => {
  console.log('Playback state changed:', state);
});

const positionStateCleanup = mediaSession.onPositionStateChange(state => {
  console.log('Position state changed:', state);
});

// Set metadata
mediaSession.setMetadata({
  title: 'Never Gonna Give You Up',
  artist: 'Rick Astley',
  album: 'Whenever You Need Somebody',
  artwork: [
    {
      src: 'https://example.com/artwork-96.png',
      sizes: '96x96',
      type: 'image/png'
    },
    {
      src: 'https://example.com/artwork-128.png',
      sizes: '128x128',
      type: 'image/png'
    },
    {
      src: 'https://example.com/artwork-192.png',
      sizes: '192x192',
      type: 'image/png'
    },
    {
      src: 'https://example.com/artwork-256.png',
      sizes: '256x256',
      type: 'image/png'
    },
    {
      src: 'https://example.com/artwork-384.png',
      sizes: '384x384',
      type: 'image/png'
    },
    {
      src: 'https://example.com/artwork-512.png',
      sizes: '512x512',
      type: 'image/png'
    }
  ]
});

// Set position state
mediaSession.setPositionState({
  duration: 280.0, // seconds
  playbackRate: 1.0,
  position: 0.0
});

// Start playback
mediaSession.play();

// Update position every second
const updateInterval = setInterval(() => {
  const currentState = mediaSession.getPositionState();
  if (currentState.position !== undefined && currentState.duration !== undefined) {
    mediaSession.setPositionState({
      ...currentState,
      position: (currentState.position + 1) % currentState.duration
    });
  }
}, 1000);

// Clean up after 10 seconds
setTimeout(() => {
  clearInterval(updateInterval);
  playbackStateCleanup();
  positionStateCleanup();
  mediaSession.cleanup();
}, 10000);
*/