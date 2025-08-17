type EasingFunction = (t: number) => number;
type AnimationFrame = (progress: number) => void;

type AnimationOptions = {
  duration?: number;
  easing?: EasingFunction | keyof typeof easingFunctions;
  onStart?: () => void;
  onUpdate?: (progress: number) => void;
  onComplete?: () => void;
};

type TransitionOptions = AnimationOptions & {
  from: number;
  to: number;
};

type KeyframeOptions = AnimationOptions & {
  keyframes: Record<number, any>;
};

export const easingFunctions = {
  // Linear
  linear: (t: number): number => t,

  // Sine
  easeInSine: (t: number): number => 1 - Math.cos((t * Math.PI) / 2),
  easeOutSine: (t: number): number => Math.sin((t * Math.PI) / 2),
  easeInOutSine: (t: number): number => -(Math.cos(Math.PI * t) - 1) / 2,

  // Quad
  easeInQuad: (t: number): number => t * t,
  easeOutQuad: (t: number): number => 1 - (1 - t) * (1 - t),
  easeInOutQuad: (t: number): number =>
    t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,

  // Cubic
  easeInCubic: (t: number): number => t * t * t,
  easeOutCubic: (t: number): number => 1 - Math.pow(1 - t, 3),
  easeInOutCubic: (t: number): number =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,

  // Quart
  easeInQuart: (t: number): number => t * t * t * t,
  easeOutQuart: (t: number): number => 1 - Math.pow(1 - t, 4),
  easeInOutQuart: (t: number): number =>
    t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2,

  // Quint
  easeInQuint: (t: number): number => t * t * t * t * t,
  easeOutQuint: (t: number): number => 1 - Math.pow(1 - t, 5),
  easeInOutQuint: (t: number): number =>
    t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2,

  // Expo
  easeInExpo: (t: number): number =>
    t === 0 ? 0 : Math.pow(2, 10 * t - 10),
  easeOutExpo: (t: number): number =>
    t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
  easeInOutExpo: (t: number): number =>
    t === 0 ? 0 :
    t === 1 ? 1 :
    t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 :
    (2 - Math.pow(2, -20 * t + 10)) / 2,

  // Circ
  easeInCirc: (t: number): number =>
    1 - Math.sqrt(1 - Math.pow(t, 2)),
  easeOutCirc: (t: number): number =>
    Math.sqrt(1 - Math.pow(t - 1, 2)),
  easeInOutCirc: (t: number): number =>
    t < 0.5
      ? (1 - Math.sqrt(1 - Math.pow(2 * t, 2))) / 2
      : (Math.sqrt(1 - Math.pow(-2 * t + 2, 2)) + 1) / 2,

  // Back
  easeInBack: (t: number): number => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return c3 * t * t * t - c1 * t * t;
  },
  easeOutBack: (t: number): number => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
  easeInOutBack: (t: number): number => {
    const c1 = 1.70158;
    const c2 = c1 * 1.525;
    return t < 0.5
      ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
      : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
  },

  // Elastic
  easeInElastic: (t: number): number =>
    t === 0 ? 0 :
    t === 1 ? 1 :
    -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * ((2 * Math.PI) / 3)),
  easeOutElastic: (t: number): number =>
    t === 0 ? 0 :
    t === 1 ? 1 :
    Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1,
  easeInOutElastic: (t: number): number =>
    t === 0 ? 0 :
    t === 1 ? 1 :
    t < 0.5
      ? -(Math.pow(2, 20 * t - 10) * Math.sin((20 * t - 11.125) * ((2 * Math.PI) / 4.5))) / 2
      : (Math.pow(2, -20 * t + 10) * Math.sin((20 * t - 11.125) * ((2 * Math.PI) / 4.5))) / 2 + 1,

  // Bounce
  easeInBounce: (t: number): number =>
    1 - easingFunctions.easeOutBounce(1 - t),
  easeOutBounce: (t: number): number => {
    const n1 = 7.5625;
    const d1 = 2.75;

    if (t < 1 / d1) {
      return n1 * t * t;
    } else if (t < 2 / d1) {
      return n1 * (t -= 1.5 / d1) * t + 0.75;
    } else if (t < 2.5 / d1) {
      return n1 * (t -= 2.25 / d1) * t + 0.9375;
    } else {
      return n1 * (t -= 2.625 / d1) * t + 0.984375;
    }
  },
  easeInOutBounce: (t: number): number =>
    t < 0.5
      ? (1 - easingFunctions.easeOutBounce(1 - 2 * t)) / 2
      : (1 + easingFunctions.easeOutBounce(2 * t - 1)) / 2
};

export class Animation {
  private static readonly DEFAULT_DURATION = 1000;
  private static readonly DEFAULT_EASING = 'linear';

  private frameId: number | null = null;
  private startTime: number | null = null;
  private stopped = false;

  // Create a transition animation
  static transition(options: TransitionOptions): Animation {
    const {
      from,
      to,
      duration = Animation.DEFAULT_DURATION,
      easing = Animation.DEFAULT_EASING,
      onStart,
      onUpdate,
      onComplete
    } = options;

    const easingFn = typeof easing === 'function'
      ? easing
      : easingFunctions[easing];

    const animation = new Animation();

    const frame: AnimationFrame = (progress) => {
      const currentValue = from + (to - from) * progress;
      onUpdate?.(currentValue);
    };

    animation.start({
      duration,
      easing: easingFn,
      onStart,
      onUpdate: frame,
      onComplete
    });

    return animation;
  }

  // Create a keyframe animation
  static keyframes(options: KeyframeOptions): Animation {
    const {
      keyframes,
      duration = Animation.DEFAULT_DURATION,
      easing = Animation.DEFAULT_EASING,
      onStart,
      onUpdate,
      onComplete
    } = options;

    const easingFn = typeof easing === 'function'
      ? easing
      : easingFunctions[easing];

    const animation = new Animation();
    const keys = Object.keys(keyframes).map(Number).sort((a, b) => a - b);

    const frame: AnimationFrame = (progress) => {
      const currentTime = progress * 100;
      let startKey = keys[0];
      let endKey = keys[keys.length - 1];

      for (let i = 0; i < keys.length - 1; i++) {
        if (currentTime >= keys[i] && currentTime <= keys[i + 1]) {
          startKey = keys[i];
          endKey = keys[i + 1];
          break;
        }
      }

      const startValue = keyframes[startKey];
      const endValue = keyframes[endKey];
      const segmentProgress = (currentTime - startKey) / (endKey - startKey);

      if (typeof startValue === 'number' && typeof endValue === 'number') {
        const currentValue = startValue + (endValue - startValue) * segmentProgress;
        onUpdate?.(currentValue);
      } else if (typeof startValue === 'object' && typeof endValue === 'object') {
        const currentValue = {};
        for (const key in startValue) {
          if (key in endValue) {
            currentValue[key] = startValue[key] +
              (endValue[key] - startValue[key]) * segmentProgress;
          }
        }
        onUpdate?.(currentValue);
      }
    };

    animation.start({
      duration,
      easing: easingFn,
      onStart,
      onUpdate: frame,
      onComplete
    });

    return animation;
  }

  // Start the animation
  private start(options: AnimationOptions): void {
    const {
      duration = Animation.DEFAULT_DURATION,
      easing = Animation.DEFAULT_EASING,
      onStart,
      onUpdate,
      onComplete
    } = options;

    const easingFn = typeof easing === 'function'
      ? easing
      : easingFunctions[easing];

    const animate = (currentTime: number) => {
      if (this.startTime === null) {
        this.startTime = currentTime;
        onStart?.();
      }

      const elapsed = currentTime - this.startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easingFn(progress);

      onUpdate?.(easedProgress);

      if (progress < 1 && !this.stopped) {
        this.frameId = requestAnimationFrame(animate);
      } else {
        this.frameId = null;
        this.startTime = null;
        if (!this.stopped) {
          onComplete?.();
        }
      }
    };

    this.frameId = requestAnimationFrame(animate);
  }

  // Stop the animation
  stop(): void {
    if (this.frameId !== null) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
      this.startTime = null;
      this.stopped = true;
    }
  }
}

// Example usage:
/*
// Transition animation
Animation.transition({
  from: 0,
  to: 100,
  duration: 1000,
  easing: 'easeInOutQuad',
  onStart: () => console.log('Animation started'),
  onUpdate: (value) => console.log(`Current value: ${value}`),
  onComplete: () => console.log('Animation completed')
});

// Keyframe animation
Animation.keyframes({
  keyframes: {
    0: { x: 0, y: 0 },
    50: { x: 100, y: 50 },
    100: { x: 200, y: 0 }
  },
  duration: 2000,
  easing: 'easeInOutBack',
  onUpdate: (values) => {
    element.style.transform = `translate(${values.x}px, ${values.y}px)`;
  }
});

// Custom easing function
const customEasing = (t: number) => t * t;
Animation.transition({
  from: 0,
  to: 100,
  easing: customEasing,
  onUpdate: (value) => console.log(value)
});
*/