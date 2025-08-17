type ResizeCallback = (entry: ResizeObserverEntry) => void;

type ResizeOptions = {
  box?: ResizeObserverBoxOptions;
};

type ElementConfig = {
  onResize?: ResizeCallback;
  onSizeChange?: (size: { width: number; height: number }) => void;
  onContentChange?: (size: { width: number; height: number }) => void;
  options?: ResizeOptions;
};

type ObserverInstance = {
  observer: ResizeObserver;
  elements: Map<Element, ElementConfig>;
};

export class ResizeManager {
  private static instance: ResizeManager;
  private observer: ObserverInstance | null;
  private rafId: number | null;
  private pendingEntries: ResizeObserverEntry[];

  private constructor() {
    this.observer = null;
    this.rafId = null;
    this.pendingEntries = [];
    this.initialize();
  }

  static getInstance(): ResizeManager {
    if (!ResizeManager.instance) {
      ResizeManager.instance = new ResizeManager();
    }
    return ResizeManager.instance;
  }

  private initialize(): void {
    if (!this.isSupported()) return;

    this.observer = {
      observer: new ResizeObserver(this.handleResize.bind(this)),
      elements: new Map()
    };
  }

  private handleResize(entries: ResizeObserverEntry[]): void {
    // Store entries to process them in the next animation frame
    this.pendingEntries = this.pendingEntries.concat(entries);

    // Debounce processing with requestAnimationFrame
    if (this.rafId === null) {
      this.rafId = requestAnimationFrame(() => this.processPendingEntries());
    }
  }

  private processPendingEntries(): void {
    this.rafId = null;
    const entries = this.pendingEntries;
    this.pendingEntries = [];

    entries.forEach(entry => {
      const element = entry.target;
      const config = this.observer?.elements.get(element);
      if (!config) return;

      // Call general resize callback
      config.onResize?.(entry);

      const contentRect = entry.contentRect;
      const borderBoxSize = entry.borderBoxSize[0] || {
        blockSize: contentRect.height,
        inlineSize: contentRect.width
      };

      // Call size change callback with border box size
      config.onSizeChange?.({ 
        width: borderBoxSize.inlineSize,
        height: borderBoxSize.blockSize
      });

      // Call content change callback with content rect size
      config.onContentChange?.({ 
        width: contentRect.width,
        height: contentRect.height
      });
    });
  }

  observe(element: Element, config: ElementConfig = {}): void {
    if (!this.isSupported() || !this.observer) {
      throw new Error('ResizeObserver API not supported');
    }

    // Unobserve if already being observed
    this.unobserve(element);

    this.observer.elements.set(element, config);
    this.observer.observer.observe(element, config.options);
  }

  unobserve(element: Element): void {
    if (!this.observer) return;

    this.observer.observer.unobserve(element);
    this.observer.elements.delete(element);
  }

  isElementObserved(element: Element): boolean {
    return this.observer?.elements.has(element) || false;
  }

  getObservedElements(): Element[] {
    return this.observer ? Array.from(this.observer.elements.keys()) : [];
  }

  cleanup(): void {
    if (this.observer) {
      this.observer.observer.disconnect();
      this.observer.elements.clear();
      this.observer = null;
    }

    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    this.pendingEntries = [];
  }

  static isSupported(): boolean {
    return typeof window !== 'undefined' && 'ResizeObserver' in window;
  }
}

// Example usage:
/*
const resize = ResizeManager.getInstance();

// Simple observation
const element = document.querySelector('.my-element');
resize.observe(element, {
  onResize: entry => {
    console.log('Element resized:', entry);
  }
});

// Advanced observation with specific callbacks
const element2 = document.querySelector('.another-element');
resize.observe(element2, {
  options: {
    box: 'border-box'
  },
  onSizeChange: size => {
    console.log('Border box size changed:', size);
  },
  onContentChange: size => {
    console.log('Content size changed:', size);
  }
});

// Stop observing
resize.unobserve(element);

// Check if element is being observed
console.log('Is element observed:', resize.isElementObserved(element));

// Get all observed elements
const observedElements = resize.getObservedElements();
console.log('Observed elements:', observedElements);

// Clean up
resize.cleanup();
*/