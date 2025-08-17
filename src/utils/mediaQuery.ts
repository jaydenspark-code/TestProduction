type MediaQueryState = {
  queries: Map<string, MediaQueryList>;
  matches: Map<string, boolean>;
};

type MediaQueryCallback = (state: MediaQueryState) => void;

export class MediaQueryManager {
  private static instance: MediaQueryManager;
  private state: MediaQueryState;
  private onChangeCallbacks: Set<MediaQueryCallback>;
  private mediaQueryListeners: Map<string, (e: MediaQueryListEvent) => void>;

  private constructor() {
    this.state = {
      queries: new Map(),
      matches: new Map()
    };
    this.onChangeCallbacks = new Set();
    this.mediaQueryListeners = new Map();
  }

  static getInstance(): MediaQueryManager {
    if (!MediaQueryManager.instance) {
      MediaQueryManager.instance = new MediaQueryManager();
    }
    return MediaQueryManager.instance;
  }

  private notifyChange(): void {
    this.onChangeCallbacks.forEach(callback => callback(this.state));
  }

  addQuery(name: string, query: string): void {
    if (this.state.queries.has(name)) {
      throw new Error(`Query with name ${name} already exists`);
    }

    const mediaQuery = window.matchMedia(query);
    this.state.queries.set(name, mediaQuery);
    this.state.matches.set(name, mediaQuery.matches);

    const listener = (e: MediaQueryListEvent) => {
      this.state.matches.set(name, e.matches);
      this.notifyChange();
    };

    this.mediaQueryListeners.set(name, listener);
    mediaQuery.addListener(listener);

    this.notifyChange();
  }

  removeQuery(name: string): void {
    const mediaQuery = this.state.queries.get(name);
    const listener = this.mediaQueryListeners.get(name);

    if (mediaQuery && listener) {
      mediaQuery.removeListener(listener);
      this.state.queries.delete(name);
      this.state.matches.delete(name);
      this.mediaQueryListeners.delete(name);
      this.notifyChange();
    }
  }

  matches(name: string): boolean {
    return this.state.matches.get(name) ?? false;
  }

  getQuery(name: string): MediaQueryList | undefined {
    return this.state.queries.get(name);
  }

  getAllQueries(): Map<string, MediaQueryList> {
    return new Map(this.state.queries);
  }

  getAllMatches(): Map<string, boolean> {
    return new Map(this.state.matches);
  }

  // Predefined media queries
  addMobileQuery(name = 'mobile'): void {
    this.addQuery(name, '(max-width: 767px)');
  }

  addTabletQuery(name = 'tablet'): void {
    this.addQuery(name, '(min-width: 768px) and (max-width: 1023px)');
  }

  addDesktopQuery(name = 'desktop'): void {
    this.addQuery(name, '(min-width: 1024px)');
  }

  addDarkModeQuery(name = 'darkMode'): void {
    this.addQuery(name, '(prefers-color-scheme: dark)');
  }

  addLightModeQuery(name = 'lightMode'): void {
    this.addQuery(name, '(prefers-color-scheme: light)');
  }

  addReducedMotionQuery(name = 'reducedMotion'): void {
    this.addQuery(name, '(prefers-reduced-motion: reduce)');
  }

  addHighContrastQuery(name = 'highContrast'): void {
    this.addQuery(name, '(prefers-contrast: high)');
  }

  addPortraitQuery(name = 'portrait'): void {
    this.addQuery(name, '(orientation: portrait)');
  }

  addLandscapeQuery(name = 'landscape'): void {
    this.addQuery(name, '(orientation: landscape)');
  }

  addRetinaQuery(name = 'retina'): void {
    this.addQuery(name, '(-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi)');
  }

  addTouchQuery(name = 'touch'): void {
    this.addQuery(name, '(hover: none) and (pointer: coarse)');
  }

  addMouseQuery(name = 'mouse'): void {
    this.addQuery(name, '(hover: hover) and (pointer: fine)');
  }

  addPrintQuery(name = 'print'): void {
    this.addQuery(name, 'print');
  }

  addScreenQuery(name = 'screen'): void {
    this.addQuery(name, 'screen');
  }

  // Custom breakpoint queries
  addMinWidthQuery(width: number, name = `minWidth${width}`): void {
    this.addQuery(name, `(min-width: ${width}px)`);
  }

  addMaxWidthQuery(width: number, name = `maxWidth${width}`): void {
    this.addQuery(name, `(max-width: ${width}px)`);
  }

  addMinHeightQuery(height: number, name = `minHeight${height}`): void {
    this.addQuery(name, `(min-height: ${height}px)`);
  }

  addMaxHeightQuery(height: number, name = `maxHeight${height}`): void {
    this.addQuery(name, `(max-height: ${height}px)`);
  }

  addAspectRatioQuery(width: number, height: number, name = `aspectRatio${width}x${height}`): void {
    this.addQuery(name, `(aspect-ratio: ${width}/${height})`);
  }

  onChange(callback: MediaQueryCallback): () => void {
    this.onChangeCallbacks.add(callback);

    // Return cleanup function
    return () => {
      this.onChangeCallbacks.delete(callback);
    };
  }

  cleanup(): void {
    this.mediaQueryListeners.forEach((listener, name) => {
      const mediaQuery = this.state.queries.get(name);
      if (mediaQuery) {
        mediaQuery.removeListener(listener);
      }
    });

    this.state.queries.clear();
    this.state.matches.clear();
    this.onChangeCallbacks.clear();
    this.mediaQueryListeners.clear();
  }

  static isSupported(): boolean {
    return typeof window !== 'undefined' &&
      'matchMedia' in window;
  }
}

// Example usage:
/*
const mediaQuery = MediaQueryManager.getInstance();

// Check if media queries are supported
console.log('Media Queries supported:', MediaQueryManager.isSupported());

// Set up change listener
const changeCleanup = mediaQuery.onChange(state => {
  console.log('Media query state changed:', state);
});

// Add predefined queries
mediaQuery.addMobileQuery();
mediaQuery.addTabletQuery();
mediaQuery.addDesktopQuery();
mediaQuery.addDarkModeQuery();
mediaQuery.addPortraitQuery();
mediaQuery.addRetinaQuery();

// Add custom queries
mediaQuery.addMinWidthQuery(1200, 'largeDesktop');
mediaQuery.addMaxHeightQuery(800, 'shortScreen');
mediaQuery.addAspectRatioQuery(16, 9, 'widescreen');

// Check current matches
console.log('Is mobile?', mediaQuery.matches('mobile'));
console.log('Is dark mode?', mediaQuery.matches('darkMode'));
console.log('Is widescreen?', mediaQuery.matches('widescreen'));

// Get all current matches
console.log('All matches:', mediaQuery.getAllMatches());

// Clean up after 10 seconds
setTimeout(() => {
  changeCleanup();
  mediaQuery.cleanup();
}, 10000);
*/