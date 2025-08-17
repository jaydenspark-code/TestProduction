type DeviceType = 'mobile' | 'tablet' | 'desktop';
type BrowserType = 'chrome' | 'firefox' | 'safari' | 'edge' | 'ie' | 'opera' | 'other';
type OSType = 'windows' | 'macos' | 'ios' | 'android' | 'linux' | 'other';
type OrientationType = 'portrait' | 'landscape';

type DeviceInfo = {
  type: DeviceType;
  browser: BrowserType;
  os: OSType;
  orientation: OrientationType;
  touchEnabled: boolean;
  onLine: boolean;
  screenSize: {
    width: number;
    height: number;
  };
  viewportSize: {
    width: number;
    height: number;
  };
  pixelRatio: number;
  colorScheme: 'light' | 'dark' | 'no-preference';
  reducedMotion: boolean;
  highContrast: boolean;
  connection?: {
    type: string;
    effectiveType: string;
    downlink: number;
    rtt: number;
    saveData: boolean;
  };
};

type DeviceConfig = {
  mobileMaxWidth?: number;
  tabletMaxWidth?: number;
  updateInterval?: number;
};

export class DeviceManager {
  private static instance: DeviceManager;
  private config: Required<DeviceConfig>;
  private info: DeviceInfo;
  private updateInterval: number | null;
  private resizeObserver: ResizeObserver | null;
  private mediaQueryLists: Map<string, MediaQueryList>;
  private changeListeners: Set<(info: DeviceInfo) => void>;

  private constructor(config: DeviceConfig = {}) {
    this.config = {
      mobileMaxWidth: 767,
      tabletMaxWidth: 1024,
      updateInterval: 1000,
      ...config
    };

    this.mediaQueryLists = new Map();
    this.changeListeners = new Set();
    this.info = this.getInitialInfo();
    this.updateInterval = null;
    this.resizeObserver = null;

    this.initialize();
  }

  static getInstance(config?: DeviceConfig): DeviceManager {
    if (!DeviceManager.instance) {
      DeviceManager.instance = new DeviceManager(config);
    }
    return DeviceManager.instance;
  }

  private getInitialInfo(): DeviceInfo {
    return {
      type: this.getDeviceType(),
      browser: this.getBrowserType(),
      os: this.getOSType(),
      orientation: this.getOrientation(),
      touchEnabled: this.isTouchEnabled(),
      onLine: navigator.onLine,
      screenSize: this.getScreenSize(),
      viewportSize: this.getViewportSize(),
      pixelRatio: this.getPixelRatio(),
      colorScheme: this.getColorScheme(),
      reducedMotion: this.prefersReducedMotion(),
      highContrast: this.prefersHighContrast(),
      connection: this.getConnectionInfo()
    };
  }

  private initialize(): void {
    // Setup resize observer
    this.resizeObserver = new ResizeObserver(this.handleResize.bind(this));
    this.resizeObserver.observe(document.documentElement);

    // Setup media query listeners
    this.setupMediaQueries();

    // Setup network status listener
    window.addEventListener('online', this.handleNetworkChange.bind(this));
    window.addEventListener('offline', this.handleNetworkChange.bind(this));

    // Setup orientation change listener
    window.addEventListener('orientationchange', this.handleOrientationChange.bind(this));

    // Setup connection change listener
    if ('connection' in navigator) {
      (navigator as any).connection?.addEventListener('change', this.handleConnectionChange.bind(this));
    }

    // Start periodic updates
    this.startUpdates();
  }

  private setupMediaQueries(): void {
    const queries = {
      mobile: `(max-width: ${this.config.mobileMaxWidth}px)`,
      tablet: `(min-width: ${this.config.mobileMaxWidth + 1}px) and (max-width: ${this.config.tabletMaxWidth}px)`,
      desktop: `(min-width: ${this.config.tabletMaxWidth + 1}px)`,
      colorScheme: '(prefers-color-scheme: dark)',
      reducedMotion: '(prefers-reduced-motion: reduce)',
      highContrast: '(prefers-contrast: more)'
    };

    Object.entries(queries).forEach(([key, query]) => {
      const mediaQuery = window.matchMedia(query);
      this.mediaQueryLists.set(key, mediaQuery);
      mediaQuery.addEventListener('change', this.handleMediaQueryChange.bind(this));
    });
  }

  private handleResize(): void {
    this.updateInfo();
  }

  private handleMediaQueryChange(): void {
    this.updateInfo();
  }

  private handleNetworkChange(): void {
    this.updateInfo();
  }

  private handleOrientationChange(): void {
    this.updateInfo();
  }

  private handleConnectionChange(): void {
    this.updateInfo();
  }

  private startUpdates(): void {
    if (this.updateInterval !== null) return;

    this.updateInterval = window.setInterval(() => {
      this.updateInfo();
    }, this.config.updateInterval);
  }

  private stopUpdates(): void {
    if (this.updateInterval === null) return;

    window.clearInterval(this.updateInterval);
    this.updateInterval = null;
  }

  private updateInfo(): void {
    const newInfo = this.getInitialInfo();
    const hasChanged = JSON.stringify(this.info) !== JSON.stringify(newInfo);

    if (hasChanged) {
      this.info = newInfo;
      this.notifyListeners();
    }
  }

  private notifyListeners(): void {
    this.changeListeners.forEach(listener => listener(this.info));
  }

  private getDeviceType(): DeviceType {
    const width = window.innerWidth;
    if (width <= this.config.mobileMaxWidth) return 'mobile';
    if (width <= this.config.tabletMaxWidth) return 'tablet';
    return 'desktop';
  }

  private getBrowserType(): BrowserType {
    const ua = navigator.userAgent.toLowerCase();

    if (ua.includes('edge') || ua.includes('edg')) return 'edge';
    if (ua.includes('chrome')) return 'chrome';
    if (ua.includes('firefox')) return 'firefox';
    if (ua.includes('safari') && !ua.includes('chrome')) return 'safari';
    if (ua.includes('opr') || ua.includes('opera')) return 'opera';
    if (ua.includes('msie') || ua.includes('trident')) return 'ie';
    return 'other';
  }

  private getOSType(): OSType {
    const ua = navigator.userAgent.toLowerCase();

    if (ua.includes('windows')) return 'windows';
    if (ua.includes('mac os') && !ua.includes('mobile')) return 'macos';
    if (ua.includes('android')) return 'android';
    if (ua.includes('ios') || (ua.includes('mac os') && ua.includes('mobile'))) return 'ios';
    if (ua.includes('linux')) return 'linux';
    return 'other';
  }

  private getOrientation(): OrientationType {
    return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
  }

  private isTouchEnabled(): boolean {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  private getScreenSize(): { width: number; height: number } {
    return {
      width: window.screen.width,
      height: window.screen.height
    };
  }

  private getViewportSize(): { width: number; height: number } {
    return {
      width: window.innerWidth,
      height: window.innerHeight
    };
  }

  private getPixelRatio(): number {
    return window.devicePixelRatio || 1;
  }

  private getColorScheme(): 'light' | 'dark' | 'no-preference' {
    if (!window.matchMedia) return 'no-preference';

    if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
    if (window.matchMedia('(prefers-color-scheme: light)').matches) return 'light';
    return 'no-preference';
  }

  private prefersReducedMotion(): boolean {
    return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  }

  private prefersHighContrast(): boolean {
    return window.matchMedia?.('(prefers-contrast: more)').matches ?? false;
  }

  private getConnectionInfo() {
    if (!('connection' in navigator)) return undefined;

    const connection = (navigator as any).connection;
    return {
      type: connection.type,
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData
    };
  }

  // Public methods

  getInfo(): DeviceInfo {
    return { ...this.info };
  }

  isMobile(): boolean {
    return this.info.type === 'mobile';
  }

  isTablet(): boolean {
    return this.info.type === 'tablet';
  }

  isDesktop(): boolean {
    return this.info.type === 'desktop';
  }

  isTouch(): boolean {
    return this.info.touchEnabled;
  }

  isOnline(): boolean {
    return this.info.onLine;
  }

  isPortrait(): boolean {
    return this.info.orientation === 'portrait';
  }

  isLandscape(): boolean {
    return this.info.orientation === 'landscape';
  }

  isBrowser(type: BrowserType): boolean {
    return this.info.browser === type;
  }

  isOS(type: OSType): boolean {
    return this.info.os === type;
  }

  isRetina(): boolean {
    return this.info.pixelRatio > 1;
  }

  isDarkMode(): boolean {
    return this.info.colorScheme === 'dark';
  }

  isReducedMotion(): boolean {
    return this.info.reducedMotion;
  }

  isHighContrast(): boolean {
    return this.info.highContrast;
  }

  onChange(listener: (info: DeviceInfo) => void): () => void {
    this.changeListeners.add(listener);
    return () => this.changeListeners.delete(listener);
  }

  updateConfig(config: Partial<DeviceConfig>): void {
    this.config = { ...this.config, ...config };
    this.updateInfo();
  }

  cleanup(): void {
    this.stopUpdates();
    this.resizeObserver?.disconnect();
    this.changeListeners.clear();

    window.removeEventListener('online', this.handleNetworkChange.bind(this));
    window.removeEventListener('offline', this.handleNetworkChange.bind(this));
    window.removeEventListener('orientationchange', this.handleOrientationChange.bind(this));

    if ('connection' in navigator) {
      (navigator as any).connection?.removeEventListener('change', this.handleConnectionChange.bind(this));
    }

    this.mediaQueryLists.forEach(mediaQuery => {
      mediaQuery.removeEventListener('change', this.handleMediaQueryChange.bind(this));
    });
    this.mediaQueryLists.clear();
  }

  static isSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      typeof navigator !== 'undefined' &&
      'matchMedia' in window
    );
  }
}

// Example usage:
/*
// Create device manager instance
const device = DeviceManager.getInstance({
  mobileMaxWidth: 768,
  tabletMaxWidth: 1024,
  updateInterval: 2000
});

// Get device info
const info = device.getInfo();

// Check device type
if (device.isMobile()) {
  // Handle mobile layout
} else if (device.isTablet()) {
  // Handle tablet layout
} else {
  // Handle desktop layout
}

// Check features
if (device.isTouch()) {
  // Enable touch interactions
}

if (device.isDarkMode()) {
  // Apply dark theme
}

if (device.isReducedMotion()) {
  // Disable animations
}

// Listen to changes
const unsubscribe = device.onChange(info => {
  console.log('Device info changed:', info);
});

// Update config
device.updateConfig({
  mobileMaxWidth: 576
});

// Clean up
device.cleanup();
*/