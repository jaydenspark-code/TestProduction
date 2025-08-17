type HistoryState = {
  data: any;
  title: string;
  url: string;
  timestamp: number;
};

type NavigationOptions = {
  replace?: boolean;
  state?: any;
  scroll?: boolean;
  preserveQuery?: boolean;
};

type ScrollPosition = {
  x: number;
  y: number;
};

export class HistoryManager {
  private static instance: HistoryManager;
  private states: Map<string, HistoryState>;
  private scrollPositions: Map<string, ScrollPosition>;
  private currentKey: string;

  private constructor() {
    this.states = new Map();
    this.scrollPositions = new Map();
    this.currentKey = history.state?.key || this.generateKey();
    this.setupListeners();
  }

  static getInstance(): HistoryManager {
    if (!HistoryManager.instance) {
      HistoryManager.instance = new HistoryManager();
    }
    return HistoryManager.instance;
  }

  // Navigate to a new URL
  push(url: string, options: NavigationOptions = {}): void {
    const {
      replace = false,
      state = null,
      scroll = true,
      preserveQuery = false
    } = options;

    const newUrl = preserveQuery
      ? this.preserveQueryParams(url)
      : url;

    const newKey = this.generateKey();
    const newState: HistoryState = {
      data: state,
      title: document.title,
      url: newUrl,
      timestamp: Date.now()
    };

    if (scroll) {
      this.saveScrollPosition();
    }

    if (replace) {
      history.replaceState({ key: newKey }, '', newUrl);
      this.states.set(newKey, newState);
    } else {
      history.pushState({ key: newKey }, '', newUrl);
      this.states.set(newKey, newState);
    }

    this.currentKey = newKey;

    if (scroll) {
      window.scrollTo(0, 0);
    }
  }

  // Replace current URL
  replace(url: string, options: Omit<NavigationOptions, 'replace'> = {}): void {
    this.push(url, { ...options, replace: true });
  }

  // Go back in history
  back(): void {
    history.back();
  }

  // Go forward in history
  forward(): void {
    history.forward();
  }

  // Go to specific position in history
  go(delta: number): void {
    history.go(delta);
  }

  // Get current state
  getCurrentState(): HistoryState | null {
    return this.states.get(this.currentKey) || null;
  }

  // Get current URL
  getCurrentUrl(): string {
    return window.location.href;
  }

  // Get current path
  getCurrentPath(): string {
    return window.location.pathname;
  }

  // Get query parameters
  getQueryParams(): Record<string, string> {
    const params = new URLSearchParams(window.location.search);
    const result: Record<string, string> = {};
    params.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  // Update query parameters
  updateQueryParams(
    params: Record<string, string | null>,
    options: { replace?: boolean } = {}
  ): void {
    const currentParams = new URLSearchParams(window.location.search);

    Object.entries(params).forEach(([key, value]) => {
      if (value === null) {
        currentParams.delete(key);
      } else {
        currentParams.set(key, value);
      }
    });

    const newSearch = currentParams.toString();
    const newUrl = `${window.location.pathname}${newSearch ? `?${newSearch}` : ''}`;

    if (options.replace) {
      this.replace(newUrl);
    } else {
      this.push(newUrl);
    }
  }

  // Clear query parameters
  clearQueryParams(options: { replace?: boolean } = {}): void {
    const newUrl = window.location.pathname;
    if (options.replace) {
      this.replace(newUrl);
    } else {
      this.push(newUrl);
    }
  }

  // Block navigation
  block(message: string): () => void {
    const unblock = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = message;
      return message;
    };

    window.addEventListener('beforeunload', unblock);
    return () => window.removeEventListener('beforeunload', unblock);
  }

  // Listen to URL changes
  listen(callback: (location: Location) => void): () => void {
    const handler = () => callback(window.location);
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }

  // Create URL
  createUrl(path: string, params?: Record<string, string>): string {
    const url = new URL(path, window.location.origin);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, value);
      });
    }
    return url.toString();
  }

  // Private methods
  private setupListeners(): void {
    window.addEventListener('popstate', (event) => {
      const key = event.state?.key;
      if (key && this.states.has(key)) {
        this.currentKey = key;
        this.restoreScrollPosition();
      }
    });

    window.addEventListener('beforeunload', () => {
      this.saveScrollPosition();
    });
  }

  private generateKey(): string {
    return Math.random().toString(36).substring(2, 9);
  }

  private saveScrollPosition(): void {
    this.scrollPositions.set(this.currentKey, {
      x: window.scrollX,
      y: window.scrollY
    });
  }

  private restoreScrollPosition(): void {
    const position = this.scrollPositions.get(this.currentKey);
    if (position) {
      window.scrollTo(position.x, position.y);
    }
  }

  private preserveQueryParams(newUrl: string): string {
    const currentUrl = new URL(window.location.href);
    const targetUrl = new URL(newUrl, window.location.origin);

    currentUrl.searchParams.forEach((value, key) => {
      if (!targetUrl.searchParams.has(key)) {
        targetUrl.searchParams.set(key, value);
      }
    });

    return targetUrl.toString();
  }
}

// Example usage:
/*
const history = HistoryManager.getInstance();

// Navigate to new URL
history.push('/dashboard', {
  state: { from: 'home' },
  scroll: true
});

// Replace current URL
history.replace('/new-path');

// Update query parameters
history.updateQueryParams({
  page: '2',
  filter: 'active'
});

// Get current state
const currentState = history.getCurrentState();

// Listen to URL changes
const unlisten = history.listen((location) => {
  console.log('URL changed:', location.pathname);
});

// Block navigation with warning
const unblock = history.block('Are you sure you want to leave?');

// Create URL with parameters
const url = history.createUrl('/products', { category: 'electronics' });

// Cleanup
unlisten();
unblock();
*/