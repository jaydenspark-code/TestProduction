type OrientationType = 'portrait-primary' | 'portrait-secondary' | 'landscape-primary' | 'landscape-secondary';

type OrientationAngle = 0 | 90 | 180 | 270;

type OrientationState = {
  type: OrientationType;
  angle: OrientationAngle;
  isPortrait: boolean;
  isLandscape: boolean;
};

type OrientationCallback = (state: OrientationState) => void;

type OrientationLockType =
  | 'any'
  | 'natural'
  | 'landscape'
  | 'portrait'
  | 'portrait-primary'
  | 'portrait-secondary'
  | 'landscape-primary'
  | 'landscape-secondary';

export class OrientationManager {
  private static instance: OrientationManager;
  private onChangeCallbacks: Set<OrientationCallback>;
  private currentState: OrientationState;
  private orientationChangeHandler: (() => void) | null;

  private constructor() {
    this.onChangeCallbacks = new Set();
    this.orientationChangeHandler = null;
    this.currentState = this.getOrientationState();
  }

  static getInstance(): OrientationManager {
    if (!OrientationManager.instance) {
      OrientationManager.instance = new OrientationManager();
    }
    return OrientationManager.instance;
  }

  private getOrientationState(): OrientationState {
    const screen = window.screen as any;
    const orientation = screen.orientation || screen.mozOrientation || screen.msOrientation;

    const type = orientation?.type as OrientationType || 'portrait-primary';
    const angle = (orientation?.angle || 0) as OrientationAngle;

    return {
      type,
      angle,
      isPortrait: type.includes('portrait'),
      isLandscape: type.includes('landscape')
    };
  }

  private handleOrientationChange = (): void => {
    const newState = this.getOrientationState();
    this.currentState = newState;
    this.notifyCallbacks(newState);
  };

  private notifyCallbacks(state: OrientationState): void {
    this.onChangeCallbacks.forEach(callback => callback(state));
  }

  private setupEventListeners(): void {
    if (!this.orientationChangeHandler) {
      this.orientationChangeHandler = this.handleOrientationChange;
      window.addEventListener('orientationchange', this.orientationChangeHandler);

      const screen = window.screen as any;
      const orientation = screen.orientation || screen.mozOrientation || screen.msOrientation;
      if (orientation?.addEventListener) {
        orientation.addEventListener('change', this.orientationChangeHandler);
      }
    }
  }

  private removeEventListeners(): void {
    if (this.orientationChangeHandler) {
      window.removeEventListener('orientationchange', this.orientationChangeHandler);

      const screen = window.screen as any;
      const orientation = screen.orientation || screen.mozOrientation || screen.msOrientation;
      if (orientation?.removeEventListener) {
        orientation.removeEventListener('change', this.orientationChangeHandler);
      }

      this.orientationChangeHandler = null;
    }
  }

  init(): void {
    if (!this.isSupported()) {
      throw new Error('Screen Orientation API is not supported');
    }

    this.setupEventListeners();
  }

  async lock(type: OrientationLockType): Promise<boolean> {
    if (!this.isSupported()) {
      throw new Error('Screen Orientation API is not supported');
    }

    try {
      const screen = window.screen as any;
      const orientation = screen.orientation || screen.mozOrientation || screen.msOrientation;
      await orientation.lock(type);
      return true;
    } catch (error) {
      console.error('Failed to lock orientation:', error);
      return false;
    }
  }

  async unlock(): Promise<boolean> {
    if (!this.isSupported()) {
      throw new Error('Screen Orientation API is not supported');
    }

    try {
      const screen = window.screen as any;
      const orientation = screen.orientation || screen.mozOrientation || screen.msOrientation;
      await orientation.unlock();
      return true;
    } catch (error) {
      console.error('Failed to unlock orientation:', error);
      return false;
    }
  }

  onChange(callback: OrientationCallback): () => void {
    this.onChangeCallbacks.add(callback);

    // Return cleanup function
    return () => {
      this.onChangeCallbacks.delete(callback);
    };
  }

  getCurrentOrientation(): OrientationState {
    return this.currentState;
  }

  getType(): OrientationType {
    return this.currentState.type;
  }

  getAngle(): OrientationAngle {
    return this.currentState.angle;
  }

  isPortrait(): boolean {
    return this.currentState.isPortrait;
  }

  isLandscape(): boolean {
    return this.currentState.isLandscape;
  }

  async rotateToPortrait(): Promise<boolean> {
    return this.lock('portrait');
  }

  async rotateToLandscape(): Promise<boolean> {
    return this.lock('landscape');
  }

  cleanup(): void {
    this.unlock();
    this.removeEventListeners();
    this.onChangeCallbacks.clear();
  }

  static isSupported(): boolean {
    const screen = window.screen as any;
    return (
      typeof window !== 'undefined' &&
      typeof screen !== 'undefined' &&
      (screen.orientation ||
        screen.mozOrientation ||
        screen.msOrientation)
    );
  }
}

// Example usage:
/*
const orientation = OrientationManager.getInstance();

// Check if Screen Orientation API is supported
console.log('Screen Orientation supported:', OrientationManager.isSupported());

// Initialize orientation manager
try {
  orientation.init();
  console.log('Orientation manager initialized');
} catch (error) {
  console.error('Failed to initialize orientation manager:', error);
}

// Listen for orientation changes
const cleanup = orientation.onChange(state => {
  console.log('Orientation changed:', state);
  console.log('Current type:', state.type);
  console.log('Current angle:', state.angle);
  console.log('Is portrait:', state.isPortrait);
  console.log('Is landscape:', state.isLandscape);
});

// Get current orientation information
console.log('Current orientation:', orientation.getCurrentOrientation());
console.log('Current type:', orientation.getType());
console.log('Current angle:', orientation.getAngle());
console.log('Is portrait:', orientation.isPortrait());
console.log('Is landscape:', orientation.isLandscape());

// Lock orientation
orientation.lock('portrait').then(success => {
  if (success) {
    console.log('Orientation locked to portrait');
  } else {
    console.log('Failed to lock orientation');
  }
});

// Rotate to landscape
orientation.rotateToLandscape().then(success => {
  if (success) {
    console.log('Rotated to landscape');
  } else {
    console.log('Failed to rotate');
  }
});

// Unlock orientation
orientation.unlock().then(success => {
  if (success) {
    console.log('Orientation unlocked');
  } else {
    console.log('Failed to unlock orientation');
  }
});

// Clean up
cleanup(); // Remove change listener
orientation.cleanup(); // Full cleanup
*/