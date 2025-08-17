type FullscreenElement = Element | null;
type FullscreenOptions = {
  navigationUI?: 'auto' | 'hide' | 'show';
};

type FullscreenChangeListener = (isFullscreen: boolean, element: FullscreenElement) => void;
type FullscreenErrorListener = (error: Error) => void;

export class FullscreenManager {
  private static instance: FullscreenManager;
  private changeListeners: Set<FullscreenChangeListener>;
  private errorListeners: Set<FullscreenErrorListener>;

  private constructor() {
    this.changeListeners = new Set();
    this.errorListeners = new Set();
    this.initialize();
  }

  static getInstance(): FullscreenManager {
    if (!FullscreenManager.instance) {
      FullscreenManager.instance = new FullscreenManager();
    }
    return FullscreenManager.instance;
  }

  private initialize(): void {
    document.addEventListener('fullscreenchange', this.handleFullscreenChange.bind(this));
    document.addEventListener('webkitfullscreenchange', this.handleFullscreenChange.bind(this));
    document.addEventListener('mozfullscreenchange', this.handleFullscreenChange.bind(this));
    document.addEventListener('MSFullscreenChange', this.handleFullscreenChange.bind(this));

    document.addEventListener('fullscreenerror', this.handleFullscreenError.bind(this));
    document.addEventListener('webkitfullscreenerror', this.handleFullscreenError.bind(this));
    document.addEventListener('mozfullscreenerror', this.handleFullscreenError.bind(this));
    document.addEventListener('MSFullscreenError', this.handleFullscreenError.bind(this));
  }

  private handleFullscreenChange(): void {
    const element = this.getFullscreenElement();
    this.changeListeners.forEach(listener => listener(this.isFullscreen(), element));
  }

  private handleFullscreenError(event: Event): void {
    const error = new Error('Fullscreen request failed');
    this.errorListeners.forEach(listener => listener(error));
  }

  private getFullscreenElement(): FullscreenElement {
    return (
      document.fullscreenElement ||
      (document as any).webkitFullscreenElement ||
      (document as any).mozFullScreenElement ||
      (document as any).msFullscreenElement
    );
  }

  private requestFullscreen(element: Element, options?: FullscreenOptions): Promise<void> {
    if (element.requestFullscreen) {
      return element.requestFullscreen(options);
    } else if ((element as any).webkitRequestFullscreen) {
      return (element as any).webkitRequestFullscreen(options);
    } else if ((element as any).mozRequestFullScreen) {
      return (element as any).mozRequestFullScreen(options);
    } else if ((element as any).msRequestFullscreen) {
      return (element as any).msRequestFullscreen(options);
    }
    return Promise.reject(new Error('Fullscreen API not supported'));
  }

  private exitFullscreen(): Promise<void> {
    if (document.exitFullscreen) {
      return document.exitFullscreen();
    } else if ((document as any).webkitExitFullscreen) {
      return (document as any).webkitExitFullscreen();
    } else if ((document as any).mozCancelFullScreen) {
      return (document as any).mozCancelFullScreen();
    } else if ((document as any).msExitFullscreen) {
      return (document as any).msExitFullscreen();
    }
    return Promise.reject(new Error('Fullscreen API not supported'));
  }

  // Public methods

  isFullscreen(): boolean {
    return this.getFullscreenElement() !== null;
  }

  getElement(): FullscreenElement {
    return this.getFullscreenElement();
  }

  async enter(element: Element = document.documentElement, options?: FullscreenOptions): Promise<void> {
    if (!this.isSupported()) {
      throw new Error('Fullscreen API not supported');
    }

    if (this.isFullscreen()) {
      await this.exit();
    }

    return this.requestFullscreen(element, options);
  }

  async exit(): Promise<void> {
    if (!this.isSupported()) {
      throw new Error('Fullscreen API not supported');
    }

    if (!this.isFullscreen()) {
      return;
    }

    return this.exitFullscreen();
  }

  async toggle(element?: Element, options?: FullscreenOptions): Promise<void> {
    if (this.isFullscreen()) {
      return this.exit();
    } else {
      return this.enter(element, options);
    }
  }

  onChange(listener: FullscreenChangeListener): () => void {
    this.changeListeners.add(listener);
    return () => this.changeListeners.delete(listener);
  }

  onError(listener: FullscreenErrorListener): () => void {
    this.errorListeners.add(listener);
    return () => this.errorListeners.delete(listener);
  }

  cleanup(): void {
    // Exit fullscreen if active
    if (this.isFullscreen()) {
      this.exit().catch(() => {});
    }

    // Remove event listeners
    document.removeEventListener('fullscreenchange', this.handleFullscreenChange);
    document.removeEventListener('webkitfullscreenchange', this.handleFullscreenChange);
    document.removeEventListener('mozfullscreenchange', this.handleFullscreenChange);
    document.removeEventListener('MSFullscreenChange', this.handleFullscreenChange);

    document.removeEventListener('fullscreenerror', this.handleFullscreenError);
    document.removeEventListener('webkitfullscreenerror', this.handleFullscreenError);
    document.removeEventListener('mozfullscreenerror', this.handleFullscreenError);
    document.removeEventListener('MSFullscreenError', this.handleFullscreenError);

    // Clear listeners
    this.changeListeners.clear();
    this.errorListeners.clear();
  }

  isSupported(): boolean {
    return (
      typeof document !== 'undefined' &&
      (document.fullscreenEnabled ||
        (document as any).webkitFullscreenEnabled ||
        (document as any).mozFullScreenEnabled ||
        (document as any).msFullscreenEnabled)
    );
  }
}

// Example usage:
/*
const fullscreen = FullscreenManager.getInstance();

// Check support
if (!fullscreen.isSupported()) {
  console.warn('Fullscreen API not supported');
}

// Enter fullscreen
const element = document.getElementById('my-element');
fullscreen.enter(element, { navigationUI: 'hide' })
  .catch(error => console.error('Failed to enter fullscreen:', error));

// Exit fullscreen
fullscreen.exit()
  .catch(error => console.error('Failed to exit fullscreen:', error));

// Toggle fullscreen
fullscreen.toggle(element)
  .catch(error => console.error('Failed to toggle fullscreen:', error));

// Listen to changes
const unsubscribeChange = fullscreen.onChange((isFullscreen, element) => {
  console.log('Fullscreen state changed:', isFullscreen);
  console.log('Fullscreen element:', element);
});

// Listen to errors
const unsubscribeError = fullscreen.onError(error => {
  console.error('Fullscreen error:', error);
});

// Clean up
fullscreen.cleanup();
unsubscribeChange();
unsubscribeError();
*/