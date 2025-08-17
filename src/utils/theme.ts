type ThemeMode = 'light' | 'dark' | 'system';

type ThemeColors = {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  error: string;
  warning: string;
  success: string;
  info: string;
};

type ThemeBreakpoints = {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
};

type ThemeSpacing = {
  unit: number;
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
};

type ThemeTypography = {
  fontFamily: string;
  fontFamilyMono: string;
  fontWeightLight: number;
  fontWeightRegular: number;
  fontWeightMedium: number;
  fontWeightBold: number;
  h1: string;
  h2: string;
  h3: string;
  h4: string;
  h5: string;
  h6: string;
  subtitle1: string;
  subtitle2: string;
  body1: string;
  body2: string;
  button: string;
  caption: string;
  overline: string;
};

type ThemeShape = {
  borderRadius: number;
  borderWidth: number;
  shadowSm: string;
  shadowMd: string;
  shadowLg: string;
};

type ThemeTransitions = {
  duration: {
    shortest: number;
    shorter: number;
    short: number;
    standard: number;
    complex: number;
    enteringScreen: number;
    leavingScreen: number;
  };
  easing: {
    easeInOut: string;
    easeOut: string;
    easeIn: string;
    sharp: string;
  };
};

type ThemeConfig = {
  mode?: ThemeMode;
  colors?: Partial<ThemeColors>;
  breakpoints?: Partial<ThemeBreakpoints>;
  spacing?: Partial<ThemeSpacing>;
  typography?: Partial<ThemeTypography>;
  shape?: Partial<ThemeShape>;
  transitions?: Partial<ThemeTransitions>;
  storageKey?: string;
};

export class ThemeManager {
  private static instance: ThemeManager;
  private config: Required<ThemeConfig>;
  private currentMode: ThemeMode;
  private styleSheet: CSSStyleSheet | null;
  private mediaQuery: MediaQueryList | null;
  private themeChangeListeners: Set<(mode: ThemeMode) => void>;

  private constructor(config: ThemeConfig = {}) {
    this.config = {
      mode: 'system',
      colors: {
        primary: '#1a73e8',
        secondary: '#455a64',
        background: '#ffffff',
        surface: '#f5f5f5',
        text: '#000000',
        textSecondary: '#757575',
        border: '#e0e0e0',
        error: '#d32f2f',
        warning: '#ed6c02',
        success: '#2e7d32',
        info: '#0288d1',
        ...config.colors
      },
      breakpoints: {
        xs: 0,
        sm: 600,
        md: 960,
        lg: 1280,
        xl: 1920,
        ...config.breakpoints
      },
      spacing: {
        unit: 8,
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
        ...config.spacing
      },
      typography: {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
        fontFamilyMono: 'SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
        fontWeightLight: 300,
        fontWeightRegular: 400,
        fontWeightMedium: 500,
        fontWeightBold: 700,
        h1: '2.5rem',
        h2: '2rem',
        h3: '1.75rem',
        h4: '1.5rem',
        h5: '1.25rem',
        h6: '1rem',
        subtitle1: '1rem',
        subtitle2: '0.875rem',
        body1: '1rem',
        body2: '0.875rem',
        button: '0.875rem',
        caption: '0.75rem',
        overline: '0.75rem',
        ...config.typography
      },
      shape: {
        borderRadius: 4,
        borderWidth: 1,
        shadowSm: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
        shadowMd: '0 3px 6px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.12)',
        shadowLg: '0 10px 20px rgba(0,0,0,0.15), 0 3px 6px rgba(0,0,0,0.10)',
        ...config.shape
      },
      transitions: {
        duration: {
          shortest: 150,
          shorter: 200,
          short: 250,
          standard: 300,
          complex: 375,
          enteringScreen: 225,
          leavingScreen: 195,
          ...config.transitions?.duration
        },
        easing: {
          easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
          easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
          easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
          sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
          ...config.transitions?.easing
        }
      },
      storageKey: 'theme-mode',
      ...config
    };

    this.currentMode = this.getSavedMode() || this.config.mode;
    this.styleSheet = this.createStyleSheet();
    this.mediaQuery = this.createMediaQuery();
    this.themeChangeListeners = new Set();

    this.initialize();
  }

  static getInstance(config?: ThemeConfig): ThemeManager {
    if (!ThemeManager.instance) {
      ThemeManager.instance = new ThemeManager(config);
    }
    return ThemeManager.instance;
  }

  private createStyleSheet(): CSSStyleSheet | null {
    try {
      const style = document.createElement('style');
      document.head.appendChild(style);
      return style.sheet;
    } catch (error) {
      console.error('Failed to create theme stylesheet:', error);
      return null;
    }
  }

  private createMediaQuery(): MediaQueryList | null {
    try {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', this.handleSystemThemeChange.bind(this));
      return mediaQuery;
    } catch (error) {
      console.error('Failed to create media query:', error);
      return null;
    }
  }

  private initialize(): void {
    this.applyTheme();
    this.setupTransitions();
  }

  private getSavedMode(): ThemeMode | null {
    try {
      return localStorage.getItem(this.config.storageKey) as ThemeMode;
    } catch {
      return null;
    }
  }

  private saveMode(mode: ThemeMode): void {
    try {
      localStorage.setItem(this.config.storageKey, mode);
    } catch (error) {
      console.error('Failed to save theme mode:', error);
    }
  }

  private handleSystemThemeChange(event: MediaQueryListEvent): void {
    if (this.currentMode === 'system') {
      this.applyTheme();
    }
  }

  private getEffectiveMode(): 'light' | 'dark' {
    if (this.currentMode === 'system') {
      return this.mediaQuery?.matches ? 'dark' : 'light';
    }
    return this.currentMode;
  }

  private getDarkModeColors(): ThemeColors {
    return {
      primary: '#90caf9',
      secondary: '#b0bec5',
      background: '#121212',
      surface: '#1e1e1e',
      text: '#ffffff',
      textSecondary: '#a0a0a0',
      border: '#404040',
      error: '#f44336',
      warning: '#ffa726',
      success: '#66bb6a',
      info: '#29b6f6'
    };
  }

  private setupTransitions(): void {
    if (!this.styleSheet) return;

    const transitionProperties = [
      'color',
      'background-color',
      'border-color',
      'box-shadow',
      'opacity'
    ].join(',');

    const { duration, easing } = this.config.transitions;

    const rule = `* { transition: ${transitionProperties} ${duration.standard}ms ${easing.easeInOut}; }`;

    try {
      this.styleSheet.insertRule(rule, this.styleSheet.cssRules.length);
    } catch (error) {
      console.error('Failed to setup transitions:', error);
    }
  }

  private applyTheme(): void {
    if (!this.styleSheet) return;

    const mode = this.getEffectiveMode();
    const colors = mode === 'dark' ? this.getDarkModeColors() : this.config.colors;

    // Remove existing rules
    while (this.styleSheet.cssRules.length > 0) {
      this.styleSheet.deleteRule(0);
    }

    // CSS Custom Properties
    const cssVars = [
      `--theme-mode: ${mode}`,
      ...Object.entries(colors).map(([key, value]) => `--color-${key}: ${value}`),
      ...Object.entries(this.config.spacing).map(([key, value]) => `--spacing-${key}: ${value}px`),
      ...Object.entries(this.config.typography).map(([key, value]) => `--typography-${key}: ${value}`),
      `--shape-border-radius: ${this.config.shape.borderRadius}px`,
      `--shape-border-width: ${this.config.shape.borderWidth}px`,
      `--shape-shadow-sm: ${this.config.shape.shadowSm}`,
      `--shape-shadow-md: ${this.config.shape.shadowMd}`,
      `--shape-shadow-lg: ${this.config.shape.shadowLg}`
    ].join(';');

    const rules = [
      `:root { ${cssVars} }`,
      `body { background-color: var(--color-background); color: var(--color-text); font-family: var(--typography-fontFamily); }`
    ];

    rules.forEach(rule => {
      try {
        this.styleSheet?.insertRule(rule, this.styleSheet.cssRules.length);
      } catch (error) {
        console.error('Failed to insert CSS rule:', error);
      }
    });

    // Notify listeners
    this.themeChangeListeners.forEach(listener => listener(this.currentMode));

    // Update document theme
    document.documentElement.setAttribute('data-theme', mode);
  }

  // Public methods

  getMode(): ThemeMode {
    return this.currentMode;
  }

  setMode(mode: ThemeMode): void {
    this.currentMode = mode;
    this.saveMode(mode);
    this.applyTheme();
  }

  toggleMode(): void {
    const mode = this.getEffectiveMode();
    this.setMode(mode === 'light' ? 'dark' : 'light');
  }

  getColor(key: keyof ThemeColors): string {
    return this.getEffectiveMode() === 'dark'
      ? this.getDarkModeColors()[key]
      : this.config.colors[key];
  }

  getBreakpoint(key: keyof ThemeBreakpoints): number {
    return this.config.breakpoints[key];
  }

  getSpacing(key: keyof ThemeSpacing): number {
    return this.config.spacing[key];
  }

  getTypography(key: keyof ThemeTypography): string | number {
    return this.config.typography[key];
  }

  getShape(key: keyof ThemeShape): string | number {
    return this.config.shape[key];
  }

  getTransitionDuration(key: keyof ThemeTransitions['duration']): number {
    return this.config.transitions.duration[key];
  }

  getTransitionEasing(key: keyof ThemeTransitions['easing']): string {
    return this.config.transitions.easing[key];
  }

  onThemeChange(listener: (mode: ThemeMode) => void): () => void {
    this.themeChangeListeners.add(listener);
    return () => this.themeChangeListeners.delete(listener);
  }

  updateConfig(config: Partial<ThemeConfig>): void {
    this.config = {
      ...this.config,
      ...config,
      colors: { ...this.config.colors, ...config.colors },
      breakpoints: { ...this.config.breakpoints, ...config.breakpoints },
      spacing: { ...this.config.spacing, ...config.spacing },
      typography: { ...this.config.typography, ...config.typography },
      shape: { ...this.config.shape, ...config.shape },
      transitions: {
        duration: { ...this.config.transitions.duration, ...config.transitions?.duration },
        easing: { ...this.config.transitions.easing, ...config.transitions?.easing }
      }
    };
    this.applyTheme();
  }

  cleanup(): void {
    this.mediaQuery?.removeEventListener('change', this.handleSystemThemeChange.bind(this));
    this.themeChangeListeners.clear();

    if (this.styleSheet?.ownerNode) {
      document.head.removeChild(this.styleSheet.ownerNode);
    }
  }

  static isSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      typeof document !== 'undefined' &&
      'matchMedia' in window &&
      'localStorage' in window
    );
  }
}

// Example usage:
/*
// Create theme manager instance
const theme = ThemeManager.getInstance({
  mode: 'system',
  colors: {
    primary: '#2196f3',
    secondary: '#f50057'
  },
  typography: {
    fontFamily: 'Roboto, sans-serif'
  }
});

// Get current theme mode
const mode = theme.getMode();

// Set theme mode
theme.setMode('dark');

// Toggle theme mode
theme.toggleMode();

// Get theme values
const primaryColor = theme.getColor('primary');
const mdBreakpoint = theme.getBreakpoint('md');
const spacing = theme.getSpacing('md');
const fontFamily = theme.getTypography('fontFamily');
const borderRadius = theme.getShape('borderRadius');
const duration = theme.getTransitionDuration('standard');

// Listen to theme changes
const unsubscribe = theme.onThemeChange(mode => {
  console.log('Theme changed to:', mode);
});

// Update theme config
theme.updateConfig({
  colors: {
    primary: '#1976d2'
  }
});

// Clean up
theme.cleanup();
*/