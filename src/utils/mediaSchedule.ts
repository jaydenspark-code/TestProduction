type ScheduleConfig = {
  startTime?: number;
  endTime?: number;
  duration?: number;
  loop?: boolean;
  autoPlay?: boolean;
  preloadTime?: number;
  maxRetries?: number;
  retryDelay?: number;
  priority?: number;
  dependencies?: string[];
};

type ScheduleState = {
  id: string;
  status: 'pending' | 'loading' | 'ready' | 'playing' | 'paused' | 'ended' | 'error';
  currentTime: number;
  startTime: number;
  endTime: number;
  duration: number;
  retryCount: number;
  error?: Error;
  timestamp: number;
};

type ScheduleEvent = {
  type: 'state_change' | 'error' | 'retry' | 'complete';
  scheduleId: string;
  timestamp: number;
  details: any;
};

type ScheduleEventCallback = (event: ScheduleEvent) => void;

export class MediaScheduleManager {
  private static instance: MediaScheduleManager;
  private elements: Map<string, HTMLMediaElement>;
  private configs: Map<string, ScheduleConfig>;
  private states: Map<string, ScheduleState>;
  private timeouts: Map<string, number>;
  private intervals: Map<string, number>;
  private onScheduleEventCallbacks: Set<ScheduleEventCallback>;

  private constructor() {
    this.elements = new Map();
    this.configs = new Map();
    this.states = new Map();
    this.timeouts = new Map();
    this.intervals = new Map();
    this.onScheduleEventCallbacks = new Set();
  }

  static getInstance(): MediaScheduleManager {
    if (!MediaScheduleManager.instance) {
      MediaScheduleManager.instance = new MediaScheduleManager();
    }
    return MediaScheduleManager.instance;
  }

  private notifyScheduleEvent(event: ScheduleEvent): void {
    this.onScheduleEventCallbacks.forEach(callback => callback(event));
  }

  private getDefaultConfig(): ScheduleConfig {
    return {
      startTime: 0,
      endTime: undefined,
      duration: undefined,
      loop: false,
      autoPlay: true,
      preloadTime: 5,    // 5 seconds
      maxRetries: 3,
      retryDelay: 1000,  // 1 second
      priority: 0,
      dependencies: []
    };
  }

  private createInitialState(scheduleId: string): ScheduleState {
    const config = this.configs.get(scheduleId);
    if (!config) {
      throw new Error(`Config for schedule ${scheduleId} not found`);
    }

    return {
      id: scheduleId,
      status: 'pending',
      currentTime: 0,
      startTime: config.startTime || 0,
      endTime: config.endTime || 0,
      duration: config.duration || 0,
      retryCount: 0,
      timestamp: performance.now()
    };
  }

  addElement(element: HTMLMediaElement, config?: ScheduleConfig): string {
    const scheduleId = crypto.randomUUID();
    this.elements.set(scheduleId, element);
    this.configs.set(scheduleId, { ...this.getDefaultConfig(), ...config });
    this.states.set(scheduleId, this.createInitialState(scheduleId));

    // Set up event listeners
    this.setupEventListeners(scheduleId);

    // Start preloading if autoPlay is enabled
    if (this.configs.get(scheduleId)?.autoPlay) {
      this.preload(scheduleId);
    }

    return scheduleId;
  }

  private setupEventListeners(scheduleId: string): void {
    const element = this.elements.get(scheduleId);
    if (!element) return;

    const updateState = (status: ScheduleState['status']) => {
      const state = this.states.get(scheduleId);
      if (state) {
        state.status = status;
        state.currentTime = element.currentTime;
        state.timestamp = performance.now();
        this.states.set(scheduleId, state);

        this.notifyScheduleEvent({
          type: 'state_change',
          scheduleId,
          timestamp: state.timestamp,
          details: { state }
        });
      }
    };

    element.addEventListener('loadstart', () => updateState('loading'));
    element.addEventListener('canplay', () => updateState('ready'));
    element.addEventListener('play', () => updateState('playing'));
    element.addEventListener('pause', () => updateState('paused'));
    element.addEventListener('ended', () => {
      updateState('ended');
      this.handlePlaybackEnd(scheduleId);
    });
    element.addEventListener('error', () => {
      const state = this.states.get(scheduleId);
      if (state) {
        state.status = 'error';
        state.error = element.error || new Error('Unknown media error');
        state.timestamp = performance.now();
        this.states.set(scheduleId, state);

        this.notifyScheduleEvent({
          type: 'error',
          scheduleId,
          timestamp: state.timestamp,
          details: { error: state.error }
        });

        this.handleError(scheduleId);
      }
    });
  }

  private async preload(scheduleId: string): Promise<void> {
    const element = this.elements.get(scheduleId);
    const config = this.configs.get(scheduleId);
    const state = this.states.get(scheduleId);
    if (!element || !config || !state) return;

    try {
      // Check dependencies
      if (config.dependencies && config.dependencies.length > 0) {
        await this.waitForDependencies(scheduleId);
      }

      // Start loading
      element.load();

      // Set up preload timeout
      const timeoutId = window.setTimeout(() => {
        if (state.status === 'loading') {
          this.handleError(scheduleId);
        }
      }, (config.preloadTime || 5) * 1000);

      this.timeouts.set(scheduleId, timeoutId);
    } catch (error) {
      this.handleError(scheduleId);
    }
  }

  private async waitForDependencies(scheduleId: string): Promise<void> {
    const config = this.configs.get(scheduleId);
    if (!config?.dependencies) return;

    await Promise.all(config.dependencies.map(depId => {
      return new Promise<void>((resolve, reject) => {
        const depState = this.states.get(depId);
        if (!depState) {
          reject(new Error(`Dependency ${depId} not found`));
          return;
        }

        if (depState.status === 'ended') {
          resolve();
          return;
        }

        const checkInterval = setInterval(() => {
          const currentState = this.states.get(depId);
          if (currentState?.status === 'ended') {
            clearInterval(checkInterval);
            resolve();
          } else if (currentState?.status === 'error') {
            clearInterval(checkInterval);
            reject(new Error(`Dependency ${depId} failed`));
          }
        }, 100);

        this.intervals.set(`${scheduleId}_dep_${depId}`, checkInterval);
      });
    }));
  }

  private handleError(scheduleId: string): void {
    const config = this.configs.get(scheduleId);
    const state = this.states.get(scheduleId);
    if (!config || !state) return;

    if (state.retryCount < (config.maxRetries || 3)) {
      state.retryCount++;
      state.timestamp = performance.now();
      this.states.set(scheduleId, state);

      this.notifyScheduleEvent({
        type: 'retry',
        scheduleId,
        timestamp: state.timestamp,
        details: { retryCount: state.retryCount }
      });

      const timeoutId = window.setTimeout(() => {
        this.preload(scheduleId);
      }, config.retryDelay || 1000);

      this.timeouts.set(scheduleId, timeoutId);
    }
  }

  private handlePlaybackEnd(scheduleId: string): void {
    const config = this.configs.get(scheduleId);
    const state = this.states.get(scheduleId);
    if (!config || !state) return;

    if (config.loop) {
      this.play(scheduleId);
    } else {
      this.notifyScheduleEvent({
        type: 'complete',
        scheduleId,
        timestamp: performance.now(),
        details: { state }
      });
    }
  }

  removeElement(scheduleId: string): void {
    const element = this.elements.get(scheduleId);
    if (!element) {
      throw new Error(`Element with id ${scheduleId} not found`);
    }

    // Clear all timeouts and intervals
    const timeoutId = this.timeouts.get(scheduleId);
    if (timeoutId) {
      window.clearTimeout(timeoutId);
      this.timeouts.delete(scheduleId);
    }

    this.intervals.forEach((intervalId, key) => {
      if (key.startsWith(`${scheduleId}_dep_`)) {
        window.clearInterval(intervalId);
        this.intervals.delete(key);
      }
    });

    // Remove element and related data
    this.elements.delete(scheduleId);
    this.configs.delete(scheduleId);
    this.states.delete(scheduleId);
  }

  play(scheduleId: string): void {
    const element = this.elements.get(scheduleId);
    const config = this.configs.get(scheduleId);
    const state = this.states.get(scheduleId);
    if (!element || !config || !state) return;

    if (state.status === 'ready' || state.status === 'paused') {
      if (config.startTime) {
        element.currentTime = config.startTime;
      }
      element.play().catch(error => {
        this.handleError(scheduleId);
      });
    } else if (state.status === 'pending' || state.status === 'error') {
      this.preload(scheduleId);
    }
  }

  pause(scheduleId: string): void {
    const element = this.elements.get(scheduleId);
    if (element) {
      element.pause();
    }
  }

  seek(scheduleId: string, time: number): void {
    const element = this.elements.get(scheduleId);
    if (element) {
      element.currentTime = time;
    }
  }

  getState(scheduleId: string): ScheduleState | undefined {
    return this.states.get(scheduleId);
  }

  updateConfig(scheduleId: string, config: Partial<ScheduleConfig>): void {
    const currentConfig = this.configs.get(scheduleId);
    if (!currentConfig) {
      throw new Error(`Config for schedule ${scheduleId} not found`);
    }

    this.configs.set(scheduleId, { ...currentConfig, ...config });
  }

  onScheduleEvent(callback: ScheduleEventCallback): () => void {
    this.onScheduleEventCallbacks.add(callback);
    return () => {
      this.onScheduleEventCallbacks.delete(callback);
    };
  }

  cleanup(): void {
    // Clear all timeouts and intervals
    this.timeouts.forEach(timeoutId => {
      window.clearTimeout(timeoutId);
    });
    this.intervals.forEach(intervalId => {
      window.clearInterval(intervalId);
    });

    // Clear all data
    this.elements.clear();
    this.configs.clear();
    this.states.clear();
    this.timeouts.clear();
    this.intervals.clear();
    this.onScheduleEventCallbacks.clear();
  }

  static isSupported(): boolean {
    return typeof window !== 'undefined' &&
      'HTMLMediaElement' in window;
  }
}

// Example usage:
/*
const scheduleManager = MediaScheduleManager.getInstance();

// Check if media scheduling is supported
console.log('Media Scheduling supported:', MediaScheduleManager.isSupported());

// Set up event listener
const eventCleanup = scheduleManager.onScheduleEvent(event => {
  console.log('Schedule event:', event);
});

// Create video elements
const video1 = document.createElement('video');
const video2 = document.createElement('video');

// Set sources
video1.src = 'video1.mp4';
video2.src = 'video2.mp4';

// Add first video with config
const video1Id = scheduleManager.addElement(video1, {
  startTime: 0,
  duration: 30,    // 30 seconds
  loop: false,
  autoPlay: true,
  priority: 1
});

// Add second video with dependency on first video
const video2Id = scheduleManager.addElement(video2, {
  startTime: 0,
  duration: 20,    // 20 seconds
  loop: true,
  autoPlay: true,
  priority: 2,
  dependencies: [video1Id]
});

// After 15 seconds, pause video1
setTimeout(() => {
  scheduleManager.pause(video1Id);
}, 15000);

// After 20 seconds, seek video2 to 10 seconds
setTimeout(() => {
  scheduleManager.seek(video2Id, 10);
}, 20000);

// Clean up after 30 seconds
setTimeout(() => {
  eventCleanup();
  scheduleManager.cleanup();
}, 30000);
*/