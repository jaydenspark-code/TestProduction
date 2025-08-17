type IntersectionCallback = (entry: IntersectionObserverEntry) => void;

type IntersectionOptions = {
  root?: Element | Document | null;
  rootMargin?: string;
  threshold?: number | number[];
};

type ElementCallbacks = {
  onIntersect?: IntersectionCallback;
  onEnter?: IntersectionCallback;
  onLeave?: IntersectionCallback;
};

type ElementConfig = ElementCallbacks & {
  options?: IntersectionOptions;
};

type ObserverInstance = {
  observer: IntersectionObserver;
  elements: Map<Element, ElementCallbacks>;
};

export class IntersectionManager {
  private static instance: IntersectionManager;
  private observers: Map<string, ObserverInstance>;
  private elementObservers: Map<Element, string>;

  private constructor() {
    this.observers = new Map();
    this.elementObservers = new Map();
  }

  static getInstance(): IntersectionManager {
    if (!IntersectionManager.instance) {
      IntersectionManager.instance = new IntersectionManager();
    }
    return IntersectionManager.instance;
  }

  private getOptionsKey(options: IntersectionOptions = {}): string {
    const { root = null, rootMargin = '0px', threshold = 0 } = options;
    const rootKey = root ? root.toString() : 'null';
    return `${rootKey}|${rootMargin}|${Array.isArray(threshold) ? threshold.join(',') : threshold}`;
  }

  private createObserver(options: IntersectionOptions = {}): ObserverInstance {
    const observer = new IntersectionObserver(
      (entries: IntersectionObserverEntry[]) => {
        entries.forEach(entry => {
          const element = entry.target;
          const callbacks = this.getElementCallbacks(element);
          if (!callbacks) return;

          // Call general intersection callback
          callbacks.onIntersect?.(entry);

          // Call specific enter/leave callbacks
          if (entry.isIntersecting) {
            callbacks.onEnter?.(entry);
          } else {
            callbacks.onLeave?.(entry);
          }
        });
      },
      options
    );

    return {
      observer,
      elements: new Map()
    };
  }

  private getOrCreateObserver(options: IntersectionOptions = {}): ObserverInstance {
    const key = this.getOptionsKey(options);
    let instance = this.observers.get(key);

    if (!instance) {
      instance = this.createObserver(options);
      this.observers.set(key, instance);
    }

    return instance;
  }

  private getElementCallbacks(element: Element): ElementCallbacks | undefined {
    const key = this.elementObservers.get(element);
    if (!key) return undefined;

    const instance = this.observers.get(key);
    if (!instance) return undefined;

    return instance.elements.get(element);
  }

  observe(element: Element, config: ElementConfig = {}): void {
    if (!this.isSupported()) {
      throw new Error('IntersectionObserver API not supported');
    }

    // Unobserve if already being observed
    this.unobserve(element);

    const { options, ...callbacks } = config;
    const instance = this.getOrCreateObserver(options);
    const key = this.getOptionsKey(options);

    instance.elements.set(element, callbacks);
    this.elementObservers.set(element, key);
    instance.observer.observe(element);
  }

  unobserve(element: Element): void {
    const key = this.elementObservers.get(element);
    if (!key) return;

    const instance = this.observers.get(key);
    if (!instance) return;

    instance.observer.unobserve(element);
    instance.elements.delete(element);
    this.elementObservers.delete(element);

    // Clean up observer if no elements left
    if (instance.elements.size === 0) {
      instance.observer.disconnect();
      this.observers.delete(key);
    }
  }

  isElementObserved(element: Element): boolean {
    return this.elementObservers.has(element);
  }

  getObservedElements(): Element[] {
    return Array.from(this.elementObservers.keys());
  }

  cleanup(): void {
    this.observers.forEach(instance => {
      instance.observer.disconnect();
    });

    this.observers.clear();
    this.elementObservers.clear();
  }

  static isSupported(): boolean {
    return typeof window !== 'undefined' && 'IntersectionObserver' in window;
  }
}

// Example usage:
/*
const intersection = IntersectionManager.getInstance();

// Simple observation
const element = document.querySelector('.my-element');
intersection.observe(element, {
  onIntersect: entry => {
    console.log('Intersection ratio:', entry.intersectionRatio);
  }
});

// Advanced observation with enter/leave callbacks
const element2 = document.querySelector('.another-element');
intersection.observe(element2, {
  options: {
    root: document.querySelector('.scroll-container'),
    rootMargin: '10px',
    threshold: [0, 0.5, 1]
  },
  onEnter: entry => {
    console.log('Element entered viewport');
    element2.classList.add('visible');
  },
  onLeave: entry => {
    console.log('Element left viewport');
    element2.classList.remove('visible');
  }
});

// Stop observing
intersection.unobserve(element);

// Check if element is being observed
console.log('Is element observed:', intersection.isElementObserved(element));

// Get all observed elements
const observedElements = intersection.getObservedElements();
console.log('Observed elements:', observedElements);

// Clean up
intersection.cleanup();
*/