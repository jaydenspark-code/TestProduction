type EventCallback<T = any> = (event: T) => void;

type EventOptions = {
  capture?: boolean;
  passive?: boolean;
  once?: boolean;
};

type EventSubscription = {
  unsubscribe: () => void;
};

type EventTarget = Window | Document | HTMLElement | Element;

export class EventManager {
  private static instance: EventManager;
  private subscriptions: Map<string, Set<() => void>>;

  private constructor() {
    this.subscriptions = new Map();
  }

  static getInstance(): EventManager {
    if (!EventManager.instance) {
      EventManager.instance = new EventManager();
    }
    return EventManager.instance;
  }

  // Add event listener with type safety
  on<K extends keyof WindowEventMap>(
    target: Window,
    event: K,
    callback: (event: WindowEventMap[K]) => void,
    options?: EventOptions
  ): EventSubscription;
  on<K extends keyof DocumentEventMap>(
    target: Document,
    event: K,
    callback: (event: DocumentEventMap[K]) => void,
    options?: EventOptions
  ): EventSubscription;
  on<K extends keyof HTMLElementEventMap>(
    target: HTMLElement,
    event: K,
    callback: (event: HTMLElementEventMap[K]) => void,
    options?: EventOptions
  ): EventSubscription;
  on(
    target: EventTarget,
    event: string,
    callback: EventCallback,
    options: EventOptions = {}
  ): EventSubscription {
    const {
      capture = false,
      passive = false,
      once = false
    } = options;

    const handler = once
      ? (e: Event) => {
          callback(e);
          this.off(target, event, handler);
        }
      : callback;

    target.addEventListener(event, handler, {
      capture,
      passive
    });

    const key = this.getSubscriptionKey(target, event);
    const unsubscribe = () => this.off(target, event, handler);

    if (!this.subscriptions.has(key)) {
      this.subscriptions.set(key, new Set());
    }
    this.subscriptions.get(key)?.add(unsubscribe);

    return { unsubscribe };
  }

  // Remove event listener
  off(
    target: EventTarget,
    event: string,
    callback: EventCallback
  ): void {
    target.removeEventListener(event, callback);

    const key = this.getSubscriptionKey(target, event);
    const subscriptions = this.subscriptions.get(key);
    if (subscriptions) {
      subscriptions.delete(() => this.off(target, event, callback));
      if (subscriptions.size === 0) {
        this.subscriptions.delete(key);
      }
    }
  }

  // Remove all event listeners for a target
  clearTarget(target: EventTarget): void {
    for (const [key, subscriptions] of this.subscriptions.entries()) {
      if (key.startsWith(this.getTargetKey(target))) {
        subscriptions.forEach(unsubscribe => unsubscribe());
        this.subscriptions.delete(key);
      }
    }
  }

  // Remove all event listeners
  clearAll(): void {
    for (const subscriptions of this.subscriptions.values()) {
      subscriptions.forEach(unsubscribe => unsubscribe());
    }
    this.subscriptions.clear();
  }

  // Add event listener that removes itself after first trigger
  once<K extends keyof WindowEventMap>(
    target: Window,
    event: K,
    callback: (event: WindowEventMap[K]) => void,
    options?: Omit<EventOptions, 'once'>
  ): EventSubscription;
  once<K extends keyof DocumentEventMap>(
    target: Document,
    event: K,
    callback: (event: DocumentEventMap[K]) => void,
    options?: Omit<EventOptions, 'once'>
  ): EventSubscription;
  once<K extends keyof HTMLElementEventMap>(
    target: HTMLElement,
    event: K,
    callback: (event: HTMLElementEventMap[K]) => void,
    options?: Omit<EventOptions, 'once'>
  ): EventSubscription;
  once(
    target: EventTarget,
    event: string,
    callback: EventCallback,
    options: Omit<EventOptions, 'once'> = {}
  ): EventSubscription {
    return this.on(target, event, callback, { ...options, once: true });
  }

  // Add multiple event listeners at once
  onMultiple(
    target: EventTarget,
    events: string[],
    callback: EventCallback,
    options?: EventOptions
  ): EventSubscription {
    const subscriptions = events.map(event =>
      this.on(target, event, callback, options)
    );

    return {
      unsubscribe: () => {
        subscriptions.forEach(sub => sub.unsubscribe());
      }
    };
  }

  // Add event listener with debounce
  onDebounced(
    target: EventTarget,
    event: string,
    callback: EventCallback,
    delay: number,
    options?: EventOptions
  ): EventSubscription {
    let timeoutId: number;

    const debouncedCallback = (e: Event) => {
      clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => callback(e), delay);
    };

    return this.on(target, event, debouncedCallback, options);
  }

  // Add event listener with throttle
  onThrottled(
    target: EventTarget,
    event: string,
    callback: EventCallback,
    limit: number,
    options?: EventOptions
  ): EventSubscription {
    let inThrottle = false;

    const throttledCallback = (e: Event) => {
      if (!inThrottle) {
        callback(e);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };

    return this.on(target, event, throttledCallback, options);
  }

  // Add event listener that triggers when element enters viewport
  onIntersect(
    element: Element,
    callback: (entry: IntersectionObserverEntry) => void,
    options: IntersectionObserverInit = {}
  ): EventSubscription {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            callback(entry);
          }
        });
      },
      options
    );

    observer.observe(element);

    return {
      unsubscribe: () => observer.disconnect()
    };
  }

  // Add event listener for custom events
  onCustom<T = any>(
    target: EventTarget,
    eventName: string,
    callback: (detail: T) => void,
    options?: EventOptions
  ): EventSubscription {
    return this.on(
      target,
      eventName,
      ((e: CustomEvent<T>) => callback(e.detail)) as EventCallback,
      options
    );
  }

  // Dispatch custom event
  dispatch<T = any>(
    target: EventTarget,
    eventName: string,
    detail?: T
  ): void {
    const event = new CustomEvent(eventName, {
      detail,
      bubbles: true,
      cancelable: true
    });
    target.dispatchEvent(event);
  }

  // Private helper methods
  private getTargetKey(target: EventTarget): string {
    if (target === window) return 'window';
    if (target === document) return 'document';
    return (target as Element).tagName?.toLowerCase() || 'unknown';
  }

  private getSubscriptionKey(target: EventTarget, event: string): string {
    return `${this.getTargetKey(target)}:${event}`;
  }
}

// Example usage:
/*
const events = EventManager.getInstance();

// Basic event handling
const subscription = events.on(window, 'resize', (e) => {
  console.log('Window resized:', e);
});

// One-time event handling
events.once(document, 'DOMContentLoaded', () => {
  console.log('DOM loaded');
});

// Multiple events
events.onMultiple(document, ['mousedown', 'mouseup'], (e) => {
  console.log('Mouse event:', e.type);
});

// Debounced event
events.onDebounced(window, 'scroll', () => {
  console.log('Scrolled (debounced)');
}, 200);

// Throttled event
events.onThrottled(window, 'mousemove', (e) => {
  console.log('Mouse moved (throttled):', e);
}, 100);

// Intersection observer
const element = document.querySelector('.my-element');
if (element) {
  events.onIntersect(element, (entry) => {
    console.log('Element visible:', entry);
  });
}

// Custom events
events.onCustom<{ id: number }>(document, 'user-action', (detail) => {
  console.log('User action:', detail.id);
});

events.dispatch(document, 'user-action', { id: 123 });

// Cleanup
subscription.unsubscribe();
events.clearTarget(window);
events.clearAll();
*/