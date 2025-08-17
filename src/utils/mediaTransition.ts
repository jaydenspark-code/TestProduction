type TransitionConfig = {
  defaultDuration?: number;
  defaultEasing?: string;
  defaultDelay?: number;
  defaultDirection?: 'in' | 'out' | 'both';
  defaultType?: string;
  maxTransitions?: number;
  autoCleanup?: boolean;
  cleanupThreshold?: number;
};

type TransitionItem = {
  id: string;
  type: string;
  duration: number;
  easing: string;
  delay: number;
  direction: 'in' | 'out' | 'both';
  startTime: number;
  endTime: number;
  progress: number;
  state: 'pending' | 'running' | 'completed' | 'cancelled';
  metadata: Record<string, any>;
};

type TransitionEvent = {
  type: 'start' | 'update' | 'complete' | 'cancel' | 'error';
  transitionId?: string;
  timestamp: number;
  details: any;
};

type TransitionEventCallback = (event: TransitionEvent) => void;

type EasingFunction = (t: number) => number;

export class MediaTransitionManager {
  private static instance: MediaTransitionManager;
  private config: TransitionConfig;
  private transitions: Map<string, TransitionItem>;
  private onTransitionEventCallbacks: Set<TransitionEventCallback>;
  private animationFrameId: number | null;
  private easingFunctions: Map<string, EasingFunction>;

  private constructor() {
    this.config = this.getDefaultConfig();
    this.transitions = new Map();
    this.onTransitionEventCallbacks = new Set();
    this.animationFrameId = null;
    this.easingFunctions = this.getEasingFunctions();
  }

  static getInstance(): MediaTransitionManager {
    if (!MediaTransitionManager.instance) {
      MediaTransitionManager.instance = new MediaTransitionManager();
    }
    return MediaTransitionManager.instance;
  }

  private notifyTransitionEvent(event: TransitionEvent): void {
    this.onTransitionEventCallbacks.forEach(callback => callback(event));
  }

  private getDefaultConfig(): TransitionConfig {
    return {
      defaultDuration: 1000,           // 1 second
      defaultEasing: 'easeInOutCubic',
      defaultDelay: 0,
      defaultDirection: 'both',
      defaultType: 'fade',
      maxTransitions: 100,
      autoCleanup: true,
      cleanupThreshold: 0.9            // 90% of maxTransitions
    };
  }

  private getEasingFunctions(): Map<string, EasingFunction> {
    return new Map([
      ['linear', (t: number) => t],
      ['easeInQuad', (t: number) => t * t],
      ['easeOutQuad', (t: number) => t * (2 - t)],
      ['easeInOutQuad', (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t],
      ['easeInCubic', (t: number) => t * t * t],
      ['easeOutCubic', (t: number) => (--t) * t * t + 1],
      ['easeInOutCubic', (t: number) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1],
      ['easeInQuart', (t: number) => t * t * t * t],
      ['easeOutQuart', (t: number) => 1 - (--t) * t * t * t],
      ['easeInOutQuart', (t: number) => t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t],
      ['easeInQuint', (t: number) => t * t * t * t * t],
      ['easeOutQuint', (t: number) => 1 + (--t) * t * t * t * t],
      ['easeInOutQuint', (t: number) => t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * (--t) * t * t * t * t],
      ['easeInSine', (t: number) => 1 - Math.cos(t * Math.PI / 2)],
      ['easeOutSine', (t: number) => Math.sin(t * Math.PI / 2)],
      ['easeInOutSine', (t: number) => -(Math.cos(Math.PI * t) - 1) / 2],
      ['easeInExpo', (t: number) => t === 0 ? 0 : Math.pow(2, 10 * (t - 1))],
      ['easeOutExpo', (t: number) => t === 1 ? 1 : -Math.pow(2, -10 * t) + 1],
      ['easeInOutExpo', (t: number) => {
        if (t === 0) return 0;
        if (t === 1) return 1;
        if ((t *= 2) < 1) return Math.pow(2, 10 * (t - 1)) / 2;
        return (-Math.pow(2, -10 * --t) + 2) / 2;
      }],
      ['easeInCirc', (t: number) => -(Math.sqrt(1 - t * t) - 1)],
      ['easeOutCirc', (t: number) => Math.sqrt(1 - (--t) * t)],
      ['easeInOutCirc', (t: number) => {
        if ((t *= 2) < 1) return -0.5 * (Math.sqrt(1 - t * t) - 1);
        return 0.5 * (Math.sqrt(1 - (t -= 2) * t) + 1);
      }],
      ['easeInElastic', (t: number) => {
        if (t === 0) return 0;
        if (t === 1) return 1;
        return -Math.pow(2, 10 * (t - 1)) * Math.sin((t - 1.1) * 5 * Math.PI);
      }],
      ['easeOutElastic', (t: number) => {
        if (t === 0) return 0;
        if (t === 1) return 1;
        return Math.pow(2, -10 * t) * Math.sin((t - 0.1) * 5 * Math.PI) + 1;
      }],
      ['easeInOutElastic', (t: number) => {
        if (t === 0) return 0;
        if (t === 1) return 1;
        t *= 2;
        if (t < 1) {
          return -0.5 * Math.pow(2, 10 * (t - 1)) * Math.sin((t - 1.1) * 5 * Math.PI);
        }
        return 0.5 * Math.pow(2, -10 * (t - 1)) * Math.sin((t - 1.1) * 5 * Math.PI) + 1;
      }],
      ['easeInBack', (t: number) => {
        const s = 1.70158;
        return t * t * ((s + 1) * t - s);
      }],
      ['easeOutBack', (t: number) => {
        const s = 1.70158;
        return (--t) * t * ((s + 1) * t + s) + 1;
      }],
      ['easeInOutBack', (t: number) => {
        const s = 1.70158 * 1.525;
        if ((t *= 2) < 1) return 0.5 * (t * t * ((s + 1) * t - s));
        return 0.5 * ((t -= 2) * t * ((s + 1) * t + s) + 2);
      }],
      ['easeInBounce', (t: number) => 1 - this.easingFunctions.get('easeOutBounce')!(1 - t)],
      ['easeOutBounce', (t: number) => {
        if (t < (1 / 2.75)) {
          return 7.5625 * t * t;
        } else if (t < (2 / 2.75)) {
          return 7.5625 * (t -= (1.5 / 2.75)) * t + 0.75;
        } else if (t < (2.5 / 2.75)) {
          return 7.5625 * (t -= (2.25 / 2.75)) * t + 0.9375;
        } else {
          return 7.5625 * (t -= (2.625 / 2.75)) * t + 0.984375;
        }
      }],
      ['easeInOutBounce', (t: number) => {
        if (t < 0.5) return this.easingFunctions.get('easeInBounce')!(t * 2) * 0.5;
        return this.easingFunctions.get('easeOutBounce')!(t * 2 - 1) * 0.5 + 0.5;
      }]
    ]);
  }

  configure(config: Partial<TransitionConfig>): void {
    this.config = { ...this.config, ...config };

    if (this.config.autoCleanup && this.transitions.size > this.config.maxTransitions! * this.config.cleanupThreshold!) {
      this.cleanup();
    }
  }

  private update(): void {
    const currentTime = performance.now();
    let hasRunningTransitions = false;

    for (const [id, transition] of this.transitions) {
      if (transition.state !== 'running') continue;

      const elapsed = currentTime - transition.startTime - transition.delay;
      if (elapsed < 0) {
        hasRunningTransitions = true;
        continue;
      }

      const progress = Math.min(1, elapsed / transition.duration);
      const easingFunction = this.easingFunctions.get(transition.easing)!;
      const easedProgress = easingFunction(progress);

      transition.progress = easedProgress;

      if (progress < 1) {
        hasRunningTransitions = true;
        this.notifyTransitionEvent({
          type: 'update',
          transitionId: id,
          timestamp: currentTime,
          details: { progress: easedProgress }
        });
      } else {
        transition.state = 'completed';
        transition.progress = 1;
        transition.endTime = currentTime;

        this.notifyTransitionEvent({
          type: 'complete',
          transitionId: id,
          timestamp: currentTime,
          details: { transition }
        });
      }
    }

    if (hasRunningTransitions) {
      this.animationFrameId = requestAnimationFrame(() => this.update());
    } else {
      this.animationFrameId = null;
    }
  }

  startTransition(options: {
    type?: string;
    duration?: number;
    easing?: string;
    delay?: number;
    direction?: 'in' | 'out' | 'both';
    metadata?: Record<string, any>;
  } = {}): string {
    const id = crypto.randomUUID();
    const currentTime = performance.now();

    const transition: TransitionItem = {
      id,
      type: options.type || this.config.defaultType!,
      duration: options.duration || this.config.defaultDuration!,
      easing: options.easing || this.config.defaultEasing!,
      delay: options.delay || this.config.defaultDelay!,
      direction: options.direction || this.config.defaultDirection!,
      startTime: currentTime,
      endTime: 0,
      progress: 0,
      state: 'pending',
      metadata: options.metadata || {}
    };

    if (!this.easingFunctions.has(transition.easing)) {
      throw new Error(`Invalid easing function: ${transition.easing}`);
    }

    this.transitions.set(id, transition);

    if (this.transitions.size > this.config.maxTransitions! && this.config.autoCleanup) {
      this.cleanup();
    }

    transition.state = 'running';
    this.notifyTransitionEvent({
      type: 'start',
      transitionId: id,
      timestamp: currentTime,
      details: { transition }
    });

    if (!this.animationFrameId) {
      this.animationFrameId = requestAnimationFrame(() => this.update());
    }

    return id;
  }

  cancelTransition(id: string): boolean {
    const transition = this.transitions.get(id);
    if (!transition || transition.state !== 'running') return false;

    transition.state = 'cancelled';
    transition.endTime = performance.now();

    this.notifyTransitionEvent({
      type: 'cancel',
      transitionId: id,
      timestamp: transition.endTime,
      details: { transition }
    });

    return true;
  }

  getTransition(id: string): TransitionItem | undefined {
    return this.transitions.get(id);
  }

  getAllTransitions(): TransitionItem[] {
    return Array.from(this.transitions.values());
  }

  getRunningTransitions(): TransitionItem[] {
    return Array.from(this.transitions.values())
      .filter(transition => transition.state === 'running');
  }

  cleanup(): void {
    const completedTransitions = Array.from(this.transitions.values())
      .filter(transition => transition.state === 'completed' || transition.state === 'cancelled')
      .sort((a, b) => a.endTime - b.endTime);

    const transitionsToRemove = completedTransitions
      .slice(0, this.transitions.size - this.config.maxTransitions!);

    for (const transition of transitionsToRemove) {
      this.transitions.delete(transition.id);
    }

    if (transitionsToRemove.length > 0) {
      this.notifyTransitionEvent({
        type: 'cleanup',
        timestamp: performance.now(),
        details: { removedCount: transitionsToRemove.length }
      });
    }
  }

  getAvailableEasings(): string[] {
    return Array.from(this.easingFunctions.keys());
  }

  onTransitionEvent(callback: TransitionEventCallback): () => void {
    this.onTransitionEventCallbacks.add(callback);
    return () => {
      this.onTransitionEventCallbacks.delete(callback);
    };
  }

  static isSupported(): boolean {
    return typeof window !== 'undefined' &&
      'requestAnimationFrame' in window &&
      'performance' in window &&
      'crypto' in window;
  }
}

// Example usage:
/*
const transitionManager = MediaTransitionManager.getInstance();

// Check if media transition is supported
console.log('Media Transition supported:', MediaTransitionManager.isSupported());

// Configure transition manager
transitionManager.configure({
  defaultDuration: 500,
  defaultEasing: 'easeInOutCubic',
  defaultDelay: 0,
  defaultDirection: 'both',
  defaultType: 'fade',
  maxTransitions: 200,
  autoCleanup: true,
  cleanupThreshold: 0.8
});

// Set up event listener
const eventCleanup = transitionManager.onTransitionEvent(event => {
  console.log('Transition event:', event);
});

// Get available easing functions
console.log('Available easings:', transitionManager.getAvailableEasings());

// Start a transition
const id = transitionManager.startTransition({
  type: 'fade',
  duration: 1000,
  easing: 'easeInOutQuad',
  delay: 100,
  direction: 'in',
  metadata: {
    element: 'video-player',
    property: 'opacity'
  }
});

// Get transition information
console.log('All transitions:', transitionManager.getAllTransitions());
console.log('Running transitions:', transitionManager.getRunningTransitions());
console.log('Specific transition:', transitionManager.getTransition(id));

// Cancel transition
transitionManager.cancelTransition(id);

// Remove event listener
eventCleanup();
*/