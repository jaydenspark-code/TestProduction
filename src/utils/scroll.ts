type ScrollPosition = {
  x: number;
  y: number;
  direction: 'up' | 'down' | 'left' | 'right' | 'none';
};

type ScrollCallback = (position: ScrollPosition) => void;

type ScrollOptions = {
  throttleMs?: number;
  passive?: boolean;
};

type ElementConfig = {
  onScroll?: ScrollCallback;
  onScrollStart?: ScrollCallback;
  onScrollEnd?: ScrollCallback;
  onScrollTop?: ScrollCallback;
  onScrollBottom?: ScrollCallback;
  options?: ScrollOptions;
};

type ElementState = {
  config: ElementConfig;
  lastPosition: ScrollPosition;
  isScrolling: boolean;
  scrollTimeout: number | null;
  lastScrollTime: number;
};

export class ScrollManager {
  private static instance: ScrollManager;
  private elements: Map<Element, ElementState>;
  private defaultThrottleMs: number = 100;
  private defaultScrollEndDelay: number = 150;

  private constructor() {
    this.elements = new Map();
  }

  static getInstance(): ScrollManager {
    if (!ScrollManager.instance) {
      ScrollManager.instance = new ScrollManager();
    }
    return ScrollManager.instance;
  }

  private getScrollPosition(element: Element): ScrollPosition {
    const isWindow = element === document.documentElement;
    const state = this.elements.get(element);
    const lastPosition = state?.lastPosition || { x: 0, y: 0, direction: 'none' as const };

    const x = isWindow ? window.pageXOffset : element.scrollLeft;
    const y = isWindow ? window.pageYOffset : element.scrollTop;

    let direction: ScrollPosition['direction'] = 'none';

    if (x > lastPosition.x) direction = 'right';
    else if (x < lastPosition.x) direction = 'left';
    else if (y > lastPosition.y) direction = 'down';
    else if (y < lastPosition.y) direction = 'up';

    return { x, y, direction };
  }

  private isAtTop(element: Element): boolean {
    return element === document.documentElement
      ? window.pageYOffset === 0
      : element.scrollTop === 0;
  }

  private isAtBottom(element: Element): boolean {
    if (element === document.documentElement) {
      return window.pageYOffset + window.innerHeight >= document.documentElement.scrollHeight;
    }
    return element.scrollTop + element.clientHeight >= element.scrollHeight;
  }

  private handleScroll = (element: Element, event: Event) => {
    const state = this.elements.get(element);
    if (!state) return;

    const currentTime = Date.now();
    const throttleMs = state.config.options?.throttleMs ?? this.defaultThrottleMs;

    // Throttle scroll events
    if (currentTime - state.lastScrollTime < throttleMs) return;

    state.lastScrollTime = currentTime;
    const position = this.getScrollPosition(element);

    // Trigger scroll start
    if (!state.isScrolling) {
      state.isScrolling = true;
      state.config.onScrollStart?.(position);
    }

    // Clear existing scroll end timeout
    if (state.scrollTimeout !== null) {
      window.clearTimeout(state.scrollTimeout);
    }

    // Set new scroll end timeout
    state.scrollTimeout = window.setTimeout(() => {
      state.isScrolling = false;
      state.config.onScrollEnd?.(position);
      state.scrollTimeout = null;
    }, this.defaultScrollEndDelay);

    // Trigger scroll callbacks
    state.config.onScroll?.(position);

    // Check top/bottom positions
    if (this.isAtTop(element)) {
      state.config.onScrollTop?.(position);
    }
    if (this.isAtBottom(element)) {
      state.config.onScrollBottom?.(position);
    }

    state.lastPosition = position;
  };

  observe(element: Element | Window, config: ElementConfig = {}): void {
    const targetElement = element === window ? document.documentElement : element as Element;

    // Unobserve if already being observed
    this.unobserve(targetElement);

    const state: ElementState = {
      config,
      lastPosition: this.getScrollPosition(targetElement),
      isScrolling: false,
      scrollTimeout: null,
      lastScrollTime: 0
    };

    this.elements.set(targetElement, state);

    const options = {
      passive: config.options?.passive ?? true
    };

    targetElement.addEventListener('scroll', (e) => this.handleScroll(targetElement, e), options);
  }

  unobserve(element: Element): void {
    const state = this.elements.get(element);
    if (!state) return;

    element.removeEventListener('scroll', (e) => this.handleScroll(element, e));

    if (state.scrollTimeout !== null) {
      window.clearTimeout(state.scrollTimeout);
    }

    this.elements.delete(element);
  }

  scrollTo(element: Element, options: ScrollToOptions): void {
    if ('scrollTo' in element) {
      element.scrollTo(options);
    } else {
      if ('left' in options) element.scrollLeft = options.left;
      if ('top' in options) element.scrollTop = options.top;
    }
  }

  scrollIntoView(element: Element, options: ScrollIntoViewOptions = { behavior: 'smooth' }): void {
    element.scrollIntoView(options);
  }

  disableScroll(element: Element = document.documentElement): void {
    const state = this.elements.get(element);
    if (state) {
      state.lastPosition = this.getScrollPosition(element);
    }

    if (element === document.documentElement) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      (element as HTMLElement).style.overflow = 'hidden';
    }
  }

  enableScroll(element: Element = document.documentElement): void {
    if (element === document.documentElement) {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    } else {
      (element as HTMLElement).style.overflow = '';
    }
  }

  isElementObserved(element: Element): boolean {
    return this.elements.has(element);
  }

  getObservedElements(): Element[] {
    return Array.from(this.elements.keys());
  }

  cleanup(): void {
    this.elements.forEach((state, element) => {
      this.unobserve(element);
    });

    this.elements.clear();
  }
}

// Example usage:
/*
const scroll = ScrollManager.getInstance();

// Simple window scroll observation
scroll.observe(window, {
  onScroll: position => {
    console.log('Scroll position:', position);
  }
});

// Advanced element scroll observation
const element = document.querySelector('.scrollable-container');
scroll.observe(element, {
  options: {
    throttleMs: 50,
    passive: true
  },
  onScrollStart: position => {
    console.log('Started scrolling:', position);
  },
  onScroll: position => {
    console.log('Scrolling:', position);
  },
  onScrollEnd: position => {
    console.log('Stopped scrolling:', position);
  },
  onScrollTop: position => {
    console.log('Reached top:', position);
  },
  onScrollBottom: position => {
    console.log('Reached bottom:', position);
  }
});

// Programmatic scrolling
scroll.scrollTo(element, {
  top: 100,
  left: 0,
  behavior: 'smooth'
});

// Scroll element into view
const target = document.querySelector('.scroll-target');
scroll.scrollIntoView(target, { behavior: 'smooth', block: 'center' });

// Disable/enable scrolling
scroll.disableScroll();
scroll.enableScroll();

// Stop observing
scroll.unobserve(element);

// Check if element is being observed
console.log('Is element observed:', scroll.isElementObserved(element));

// Get all observed elements
const observedElements = scroll.getObservedElements();
console.log('Observed elements:', observedElements);

// Clean up
scroll.cleanup();
*/