type WakeLockType = 'screen';

type WakeLockOptions = {
  type?: WakeLockType;
  onRelease?: () => void;
  onError?: (error: Error) => void;
  autoReacquire?: boolean;
};

export class WakeLockManager {
  private static instance: WakeLockManager;
  private wakeLock: any | null;
  private options: Required<WakeLockOptions>;
  private isActive: boolean;
  private releaseCallback: (() => void) | null;
  private errorCallback: ((error: Error) => void) | null;
  private visibilityChangeHandler: (() => void) | null;

  private constructor() {
    this.wakeLock = null;
    this.options = {
      type: 'screen',
      onRelease: () => {},
      onError: () => {},
      autoReacquire: true
    };
    this.isActive = false;
    this.releaseCallback = null;
    this.errorCallback = null;
    this.visibilityChangeHandler = null;
  }

  static getInstance(): WakeLockManager {
    if (!WakeLockManager.instance) {
      WakeLockManager.instance = new WakeLockManager();
    }
    return WakeLockManager.instance;
  }

  private handleVisibilityChange = async (): Promise<void> => {
    if (!this.options.autoReacquire || !this.isActive) return;

    if (document.visibilityState === 'visible') {
      try {
        await this.request();
      } catch (error) {
        this.handleError(error as Error);
      }
    }
  };

  private handleRelease = (): void => {
    this.isActive = false;
    this.wakeLock = null;
    if (this.releaseCallback) {
      this.releaseCallback();
    }
    this.options.onRelease();
  };

  private handleError(error: Error): void {
    if (this.errorCallback) {
      this.errorCallback(error);
    }
    this.options.onError(error);
  }

  private setupEventListeners(): void {
    if (!this.visibilityChangeHandler) {
      this.visibilityChangeHandler = this.handleVisibilityChange;
      document.addEventListener('visibilitychange', this.visibilityChangeHandler);
    }
  }

  private removeEventListeners(): void {
    if (this.visibilityChangeHandler) {
      document.removeEventListener('visibilitychange', this.visibilityChangeHandler);
      this.visibilityChangeHandler = null;
    }
  }

  async request(options?: WakeLockOptions): Promise<boolean> {
    if (!this.isSupported()) {
      throw new Error('Wake Lock API is not supported');
    }

    this.options = { ...this.options, ...options };

    try {
      this.wakeLock = await (navigator as any).wakeLock.request(this.options.type);
      this.isActive = true;

      this.wakeLock.addEventListener('release', this.handleRelease);
      this.setupEventListeners();

      return true;
    } catch (error) {
      this.handleError(error as Error);
      return false;
    }
  }

  async release(): Promise<boolean> {
    if (!this.wakeLock) return false;

    try {
      await this.wakeLock.release();
      return true;
    } catch (error) {
      this.handleError(error as Error);
      return false;
    }
  }

  onRelease(callback: () => void): () => void {
    this.releaseCallback = callback;

    // Return cleanup function
    return () => {
      this.releaseCallback = null;
    };
  }

  onError(callback: (error: Error) => void): () => void {
    this.errorCallback = callback;

    // Return cleanup function
    return () => {
      this.errorCallback = null;
    };
  }

  isLocked(): boolean {
    return this.isActive;
  }

  getType(): WakeLockType | null {
    return this.isActive ? this.options.type : null;
  }

  setAutoReacquire(enable: boolean): void {
    this.options.autoReacquire = enable;
  }

  getAutoReacquire(): boolean {
    return this.options.autoReacquire;
  }

  cleanup(): void {
    this.release();
    this.removeEventListeners();
    this.releaseCallback = null;
    this.errorCallback = null;
    this.wakeLock = null;
    this.isActive = false;
  }

  static isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'wakeLock' in navigator;
  }
}

// Example usage:
/*
const wakeLock = WakeLockManager.getInstance();

// Check if Wake Lock is supported
console.log('Wake Lock supported:', WakeLockManager.isSupported());

// Request a wake lock with options
wakeLock.request({
  type: 'screen',
  onRelease: () => console.log('Wake lock released'),
  onError: (error) => console.error('Wake lock error:', error),
  autoReacquire: true
}).then(success => {
  if (success) {
    console.log('Wake lock acquired');
  } else {
    console.log('Failed to acquire wake lock');
  }
});

// Listen for release events
const releaseCleanup = wakeLock.onRelease(() => {
  console.log('Wake lock was released');
});

// Listen for errors
const errorCleanup = wakeLock.onError((error) => {
  console.error('Wake lock error occurred:', error);
});

// Check current status
console.log('Is locked:', wakeLock.isLocked());
console.log('Current type:', wakeLock.getType());
console.log('Auto reacquire enabled:', wakeLock.getAutoReacquire());

// Update auto reacquire setting
wakeLock.setAutoReacquire(false);

// Release the wake lock
wakeLock.release().then(success => {
  if (success) {
    console.log('Wake lock released');
  } else {
    console.log('Failed to release wake lock');
  }
});

// Clean up
releaseCleanup(); // Remove release listener
errorCleanup(); // Remove error listener
wakeLock.cleanup(); // Full cleanup
*/