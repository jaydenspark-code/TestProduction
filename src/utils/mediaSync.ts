type SyncConfig = {
  tolerance?: number;
  maxDrift?: number;
  syncInterval?: number;
  adjustmentThreshold?: number;
  catchupPlaybackRate?: number;
  slowdownPlaybackRate?: number;
};

type SyncState = {
  timestamp: number;
  mediaTime: number;
  systemTime: number;
  drift: number;
  adjustment: number;
  playbackRate: number;
};

type SyncEvent = {
  type: 'drift' | 'adjustment' | 'sync' | 'error';
  timestamp: number;
  details: any;
};

type SyncEventCallback = (event: SyncEvent) => void;

export class MediaSyncManager {
  private static instance: MediaSyncManager;
  private elements: Map<string, HTMLMediaElement>;
  private configs: Map<string, SyncConfig>;
  private states: Map<string, SyncState>;
  private syncIntervals: Map<string, number>;
  private onSyncEventCallbacks: Set<SyncEventCallback>;

  private constructor() {
    this.elements = new Map();
    this.configs = new Map();
    this.states = new Map();
    this.syncIntervals = new Map();
    this.onSyncEventCallbacks = new Set();
  }

  static getInstance(): MediaSyncManager {
    if (!MediaSyncManager.instance) {
      MediaSyncManager.instance = new MediaSyncManager();
    }
    return MediaSyncManager.instance;
  }

  private notifySyncEvent(event: SyncEvent): void {
    this.onSyncEventCallbacks.forEach(callback => callback(event));
  }

  private getDefaultConfig(): SyncConfig {
    return {
      tolerance: 0.05,           // 50ms tolerance
      maxDrift: 1.0,            // 1 second max drift
      syncInterval: 1000,       // Check sync every 1 second
      adjustmentThreshold: 0.1, // 100ms threshold for adjustment
      catchupPlaybackRate: 1.1, // 10% faster for catching up
      slowdownPlaybackRate: 0.9 // 10% slower for slowing down
    };
  }

  private getCurrentState(elementId: string): SyncState {
    const element = this.elements.get(elementId);
    if (!element) {
      throw new Error(`Element with id ${elementId} not found`);
    }

    return {
      timestamp: performance.now(),
      mediaTime: element.currentTime,
      systemTime: Date.now(),
      drift: 0,
      adjustment: 0,
      playbackRate: element.playbackRate
    };
  }

  addElement(element: HTMLMediaElement, config?: SyncConfig): string {
    const elementId = crypto.randomUUID();
    this.elements.set(elementId, element);
    this.configs.set(elementId, { ...this.getDefaultConfig(), ...config });
    this.states.set(elementId, this.getCurrentState(elementId));

    return elementId;
  }

  removeElement(elementId: string): void {
    if (!this.elements.has(elementId)) {
      throw new Error(`Element with id ${elementId} not found`);
    }

    this.stopSync(elementId);
    this.elements.delete(elementId);
    this.configs.delete(elementId);
    this.states.delete(elementId);
  }

  updateConfig(elementId: string, config: Partial<SyncConfig>): void {
    const currentConfig = this.configs.get(elementId);
    if (!currentConfig) {
      throw new Error(`Config for element ${elementId} not found`);
    }

    this.configs.set(elementId, { ...currentConfig, ...config });
  }

  startSync(elementId: string): void {
    if (this.syncIntervals.has(elementId)) {
      return;
    }

    const element = this.elements.get(elementId);
    const config = this.configs.get(elementId);
    if (!element || !config) {
      throw new Error(`Element or config with id ${elementId} not found`);
    }

    const intervalId = window.setInterval(() => {
      try {
        this.sync(elementId);
      } catch (error) {
        this.notifySyncEvent({
          type: 'error',
          timestamp: performance.now(),
          details: error
        });
        this.stopSync(elementId);
      }
    }, config.syncInterval);

    this.syncIntervals.set(elementId, intervalId);
  }

  stopSync(elementId: string): void {
    const intervalId = this.syncIntervals.get(elementId);
    if (intervalId) {
      window.clearInterval(intervalId);
      this.syncIntervals.delete(elementId);
    }
  }

  private sync(elementId: string): void {
    const element = this.elements.get(elementId);
    const config = this.configs.get(elementId);
    const previousState = this.states.get(elementId);
    if (!element || !config || !previousState) {
      throw new Error(`Element, config, or state with id ${elementId} not found`);
    }

    const currentState = this.getCurrentState(elementId);
    const expectedTime = previousState.mediaTime +
      (currentState.systemTime - previousState.systemTime) / 1000;
    const drift = currentState.mediaTime - expectedTime;

    currentState.drift = drift;

    this.notifySyncEvent({
      type: 'drift',
      timestamp: currentState.timestamp,
      details: { drift, elementId }
    });

    if (Math.abs(drift) > config.tolerance!) {
      let adjustment = 0;
      let newPlaybackRate = 1.0;

      if (drift > config.adjustmentThreshold!) {
        // Media is ahead, slow down
        newPlaybackRate = config.slowdownPlaybackRate!;
        adjustment = -drift * 0.5; // Try to correct half the drift
      } else if (drift < -config.adjustmentThreshold!) {
        // Media is behind, speed up
        newPlaybackRate = config.catchupPlaybackRate!;
        adjustment = -drift * 0.5; // Try to correct half the drift
      }

      if (adjustment !== 0) {
        element.playbackRate = newPlaybackRate;
        currentState.adjustment = adjustment;
        currentState.playbackRate = newPlaybackRate;

        this.notifySyncEvent({
          type: 'adjustment',
          timestamp: currentState.timestamp,
          details: { adjustment, newPlaybackRate, elementId }
        });
      }
    } else if (element.playbackRate !== 1.0) {
      // Reset playback rate if we're within tolerance
      element.playbackRate = 1.0;
      currentState.playbackRate = 1.0;
    }

    this.states.set(elementId, currentState);

    this.notifySyncEvent({
      type: 'sync',
      timestamp: currentState.timestamp,
      details: { state: currentState, elementId }
    });
  }

  getState(elementId: string): SyncState {
    const state = this.states.get(elementId);
    if (!state) {
      throw new Error(`State for element ${elementId} not found`);
    }
    return { ...state };
  }

  onSyncEvent(callback: SyncEventCallback): () => void {
    this.onSyncEventCallbacks.add(callback);
    return () => {
      this.onSyncEventCallbacks.delete(callback);
    };
  }

  cleanup(): void {
    this.elements.forEach((_, elementId) => {
      this.stopSync(elementId);
    });
    this.elements.clear();
    this.configs.clear();
    this.states.clear();
    this.syncIntervals.clear();
    this.onSyncEventCallbacks.clear();
  }

  static isSupported(): boolean {
    return typeof window !== 'undefined' &&
      'HTMLMediaElement' in window &&
      'playbackRate' in HTMLMediaElement.prototype;
  }
}

// Example usage:
/*
const syncManager = MediaSyncManager.getInstance();

// Check if media sync is supported
console.log('Media Sync supported:', MediaSyncManager.isSupported());

// Set up event listener
const eventCleanup = syncManager.onSyncEvent(event => {
  console.log('Sync event:', event);
});

// Create two video elements
const video1 = document.createElement('video');
const video2 = document.createElement('video');

// Add sources
video1.src = 'video1.mp4';
video2.src = 'video2.mp4';

// Add elements to sync manager with custom configs
const video1Id = syncManager.addElement(video1, {
  tolerance: 0.03,           // 30ms tolerance
  maxDrift: 0.5,            // 500ms max drift
  syncInterval: 500,        // Check sync every 500ms
  adjustmentThreshold: 0.05 // 50ms threshold for adjustment
});

const video2Id = syncManager.addElement(video2, {
  tolerance: 0.03,
  maxDrift: 0.5,
  syncInterval: 500,
  adjustmentThreshold: 0.05
});

// Start playback and sync
Promise.all([
  video1.play(),
  video2.play()
]).then(() => {
  syncManager.startSync(video1Id);
  syncManager.startSync(video2Id);
}).catch(error => {
  console.error('Failed to start playback:', error);
});

// Clean up after 30 seconds
setTimeout(() => {
  eventCleanup();
  syncManager.cleanup();
}, 30000);
*/