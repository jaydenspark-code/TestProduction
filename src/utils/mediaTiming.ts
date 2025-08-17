type MediaTimingState = {
  startTime: number;
  currentTime: number;
  duration: number;
  playbackRate: number;
  direction: PlaybackDirection;
  iterations: number;
  currentIteration: number;
  easing: string;
  progress: number;
  finished: boolean;
  paused: boolean;
};

type PlaybackDirection = 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';

type MediaTimingCallback = (state: MediaTimingState) => void;

export class MediaTimingManager {
  private static instance: MediaTimingManager;
  private state: MediaTimingState;
  private animationFrame: number | null;
  private onUpdateCallbacks: Set<MediaTimingCallback>;
  private onFinishCallbacks: Set<MediaTimingCallback>;

  private constructor() {
    this.state = {
      startTime: 0,
      currentTime: 0,
      duration: 0,
      playbackRate: 1,
      direction: 'normal',
      iterations: 1,
      currentIteration: 0,
      easing: 'linear',
      progress: 0,
      finished: false,
      paused: true
    };
    this.animationFrame = null;
    this.onUpdateCallbacks = new Set();
    this.onFinishCallbacks = new Set();
  }

  static getInstance(): MediaTimingManager {
    if (!MediaTimingManager.instance) {
      MediaTimingManager.instance = new MediaTimingManager();
    }
    return MediaTimingManager.instance;
  }

  private notifyUpdate(): void {
    this.onUpdateCallbacks.forEach(callback => callback(this.state));
  }

  private notifyFinish(): void {
    this.onFinishCallbacks.forEach(callback => callback(this.state));
  }

  private update(): void {
    if (this.state.paused || this.state.finished) return;

    const currentTime = performance.now();
    const elapsed = (currentTime - this.state.startTime) * this.state.playbackRate;
    const rawProgress = elapsed / this.state.duration;

    this.state.currentTime = elapsed;
    this.state.currentIteration = Math.floor(rawProgress);
    
    let iterationProgress = rawProgress % 1;
    if (this.state.direction === 'reverse' || 
        (this.state.direction === 'alternate' && this.state.currentIteration % 2 === 1) ||
        (this.state.direction === 'alternate-reverse' && this.state.currentIteration % 2 === 0)) {
      iterationProgress = 1 - iterationProgress;
    }

    this.state.progress = this.applyEasing(iterationProgress);

    if (this.state.currentIteration >= this.state.iterations) {
      this.state.finished = true;
      this.state.progress = this.state.direction.includes('reverse') ? 0 : 1;
      this.notifyFinish();
      return;
    }

    this.notifyUpdate();
    this.animationFrame = requestAnimationFrame(() => this.update());
  }

  private applyEasing(progress: number): number {
    switch (this.state.easing) {
      case 'linear':
        return progress;
      case 'ease-in':
        return progress * progress;
      case 'ease-out':
        return 1 - (1 - progress) * (1 - progress);
      case 'ease-in-out':
        return progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      case 'bounce':
        return this.bounceEasing(progress);
      case 'elastic':
        return this.elasticEasing(progress);
      default:
        return progress;
    }
  }

  private bounceEasing(progress: number): number {
    const n1 = 7.5625;
    const d1 = 2.75;

    if (progress < 1 / d1) {
      return n1 * progress * progress;
    } else if (progress < 2 / d1) {
      return n1 * (progress -= 1.5 / d1) * progress + 0.75;
    } else if (progress < 2.5 / d1) {
      return n1 * (progress -= 2.25 / d1) * progress + 0.9375;
    } else {
      return n1 * (progress -= 2.625 / d1) * progress + 0.984375;
    }
  }

  private elasticEasing(progress: number): number {
    if (progress === 0 || progress === 1) return progress;

    const p = 0.3;
    const s = p / 4;

    return Math.pow(2, -10 * progress) * Math.sin((progress - s) * (2 * Math.PI) / p) + 1;
  }

  start(options: {
    duration: number;
    playbackRate?: number;
    direction?: PlaybackDirection;
    iterations?: number;
    easing?: string;
  }): void {
    this.state.startTime = performance.now();
    this.state.currentTime = 0;
    this.state.duration = options.duration;
    this.state.playbackRate = options.playbackRate ?? 1;
    this.state.direction = options.direction ?? 'normal';
    this.state.iterations = options.iterations ?? 1;
    this.state.currentIteration = 0;
    this.state.easing = options.easing ?? 'linear';
    this.state.progress = 0;
    this.state.finished = false;
    this.state.paused = false;

    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
    }

    this.update();
  }

  pause(): void {
    if (!this.state.paused) {
      this.state.paused = true;
      if (this.animationFrame !== null) {
        cancelAnimationFrame(this.animationFrame);
        this.animationFrame = null;
      }
    }
  }

  resume(): void {
    if (this.state.paused && !this.state.finished) {
      this.state.startTime = performance.now() - (this.state.currentTime / this.state.playbackRate);
      this.state.paused = false;
      this.update();
    }
  }

  stop(): void {
    this.state.finished = true;
    this.state.paused = true;
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  seek(progress: number): void {
    progress = Math.max(0, Math.min(1, progress));
    this.state.progress = progress;
    this.state.currentTime = this.state.duration * progress;
    this.notifyUpdate();
  }

  setPlaybackRate(rate: number): void {
    if (rate > 0) {
      const currentTime = this.state.currentTime;
      this.state.playbackRate = rate;
      if (!this.state.paused) {
        this.state.startTime = performance.now() - (currentTime / rate);
      }
    }
  }

  getState(): MediaTimingState {
    return { ...this.state };
  }

  onUpdate(callback: MediaTimingCallback): () => void {
    this.onUpdateCallbacks.add(callback);

    // Return cleanup function
    return () => {
      this.onUpdateCallbacks.delete(callback);
    };
  }

  onFinish(callback: MediaTimingCallback): () => void {
    this.onFinishCallbacks.add(callback);

    // Return cleanup function
    return () => {
      this.onFinishCallbacks.delete(callback);
    };
  }

  cleanup(): void {
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }

    this.state = {
      startTime: 0,
      currentTime: 0,
      duration: 0,
      playbackRate: 1,
      direction: 'normal',
      iterations: 1,
      currentIteration: 0,
      easing: 'linear',
      progress: 0,
      finished: false,
      paused: true
    };

    this.onUpdateCallbacks.clear();
    this.onFinishCallbacks.clear();
  }

  static isSupported(): boolean {
    return typeof window !== 'undefined' &&
      'performance' in window &&
      'now' in performance &&
      'requestAnimationFrame' in window;
  }
}

// Example usage:
/*
const timing = MediaTimingManager.getInstance();

// Check if media timing is supported
console.log('Media Timing supported:', MediaTimingManager.isSupported());

// Set up update listener
const updateCleanup = timing.onUpdate(state => {
  console.log('Progress:', state.progress);
});

// Set up finish listener
const finishCleanup = timing.onFinish(state => {
  console.log('Animation finished!');
});

// Start a timing animation
timing.start({
  duration: 2000,
  playbackRate: 1,
  direction: 'alternate',
  iterations: 2,
  easing: 'ease-in-out'
});

// Demonstrate controls
setTimeout(() => {
  timing.pause();
  console.log('Paused at:', timing.getState().progress);

  setTimeout(() => {
    timing.resume();
    console.log('Resumed');

    setTimeout(() => {
      timing.setPlaybackRate(2);
      console.log('Increased playback rate');

      // Clean up after animation finishes
      setTimeout(() => {
        updateCleanup();
        finishCleanup();
        timing.cleanup();
      }, 2000);
    }, 500);
  }, 1000);
}, 1000);
*/