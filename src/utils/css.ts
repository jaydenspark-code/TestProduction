type CSSProperties = {
  [key: string]: string | number | undefined;
};

type CSSKeyframes = {
  [key: string]: CSSProperties;
};

type StyleSheetOptions = {
  media?: string;
  disabled?: boolean;
  title?: string;
};

type CSSTransition = {
  property: string;
  duration: string;
  timingFunction?: string;
  delay?: string;
};

export class CSSManager {
  private static instance: CSSManager;
  private styleSheet: CSSStyleSheet | null = null;
  private styleElement: HTMLStyleElement | null = null;
  private rules: Map<string, CSSStyleRule> = new Map();
  private keyframes: Map<string, CSSKeyframesRule> = new Map();

  private constructor() {}

  static getInstance(): CSSManager {
    if (!CSSManager.instance) {
      CSSManager.instance = new CSSManager();
    }
    return CSSManager.instance;
  }

  // Initialize style sheet
  initialize(options: StyleSheetOptions = {}): void {
    this.styleElement = document.createElement('style');
    if (options.media) this.styleElement.media = options.media;
    if (options.disabled) this.styleElement.disabled = options.disabled;
    if (options.title) this.styleElement.title = options.title;

    document.head.appendChild(this.styleElement);
    this.styleSheet = this.styleElement.sheet as CSSStyleSheet;
  }

  // Convert CSS properties to string
  private propertiesToString(properties: CSSProperties): string {
    return Object.entries(properties)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => {
        const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
        return `${cssKey}: ${value};`;
      })
      .join(' ');
  }

  // Add CSS rule
  addRule(selector: string, properties: CSSProperties): void {
    if (!this.styleSheet) throw new Error('Style sheet not initialized');

    const cssText = this.propertiesToString(properties);
    const index = this.styleSheet.insertRule(
      `${selector} { ${cssText} }`,
      this.styleSheet.cssRules.length
    );

    this.rules.set(selector, this.styleSheet.cssRules[index] as CSSStyleRule);
  }

  // Update CSS rule
  updateRule(selector: string, properties: CSSProperties): void {
    if (!this.styleSheet) throw new Error('Style sheet not initialized');

    const rule = this.rules.get(selector);
    if (rule) {
      const cssText = this.propertiesToString(properties);
      rule.style.cssText = cssText;
    } else {
      this.addRule(selector, properties);
    }
  }

  // Remove CSS rule
  removeRule(selector: string): void {
    if (!this.styleSheet) return;

    const rule = this.rules.get(selector);
    if (rule) {
      const index = Array.from(this.styleSheet.cssRules).indexOf(rule);
      if (index !== -1) {
        this.styleSheet.deleteRule(index);
        this.rules.delete(selector);
      }
    }
  }

  // Add keyframes animation
  addKeyframes(name: string, keyframes: CSSKeyframes): void {
    if (!this.styleSheet) throw new Error('Style sheet not initialized');

    const keyframeRules = Object.entries(keyframes)
      .map(([key, value]) => {
        const cssText = this.propertiesToString(value);
        return `${key} { ${cssText} }`;
      })
      .join(' ');

    const index = this.styleSheet.insertRule(
      `@keyframes ${name} { ${keyframeRules} }`,
      this.styleSheet.cssRules.length
    );

    this.keyframes.set(name, this.styleSheet.cssRules[index] as CSSKeyframesRule);
  }

  // Remove keyframes animation
  removeKeyframes(name: string): void {
    if (!this.styleSheet) return;

    const keyframe = this.keyframes.get(name);
    if (keyframe) {
      const index = Array.from(this.styleSheet.cssRules).indexOf(keyframe);
      if (index !== -1) {
        this.styleSheet.deleteRule(index);
        this.keyframes.delete(name);
      }
    }
  }

  // Add CSS transition
  addTransition(selector: string, transitions: CSSTransition[]): void {
    const transitionProperties = transitions.map(t => t.property).join(', ');
    const transitionDurations = transitions.map(t => t.duration).join(', ');
    const transitionTimingFunctions = transitions
      .map(t => t.timingFunction || 'ease')
      .join(', ');
    const transitionDelays = transitions.map(t => t.delay || '0s').join(', ');

    this.addRule(selector, {
      transition: `${transitionProperties} ${transitionDurations} ${transitionTimingFunctions} ${transitionDelays}`
    });
  }

  // Add media query
  addMediaQuery(mediaQuery: string, rules: { [selector: string]: CSSProperties }): void {
    if (!this.styleSheet) throw new Error('Style sheet not initialized');

    const cssRules = Object.entries(rules)
      .map(([selector, properties]) => {
        const cssText = this.propertiesToString(properties);
        return `${selector} { ${cssText} }`;
      })
      .join(' ');

    this.styleSheet.insertRule(
      `@media ${mediaQuery} { ${cssRules} }`,
      this.styleSheet.cssRules.length
    );
  }

  // Apply inline styles
  applyInlineStyles(element: HTMLElement, properties: CSSProperties): void {
    Object.entries(properties).forEach(([key, value]) => {
      if (value !== undefined) {
        (element.style as any)[key] = value;
      }
    });
  }

  // Get computed styles
  getComputedStyles(element: HTMLElement, properties: string[]): { [key: string]: string } {
    const computedStyle = window.getComputedStyle(element);
    return properties.reduce((styles, property) => {
      styles[property] = computedStyle.getPropertyValue(property);
      return styles;
    }, {} as { [key: string]: string });
  }

  // Set CSS variable
  setCSSVariable(name: string, value: string, element: HTMLElement = document.documentElement): void {
    element.style.setProperty(`--${name}`, value);
  }

  // Get CSS variable
  getCSSVariable(name: string, element: HTMLElement = document.documentElement): string {
    return getComputedStyle(element).getPropertyValue(`--${name}`).trim();
  }

  // Remove CSS variable
  removeCSSVariable(name: string, element: HTMLElement = document.documentElement): void {
    element.style.removeProperty(`--${name}`);
  }

  // Add CSS class
  addClass(element: HTMLElement, className: string): void {
    element.classList.add(className);
  }

  // Remove CSS class
  removeClass(element: HTMLElement, className: string): void {
    element.classList.remove(className);
  }

  // Toggle CSS class
  toggleClass(element: HTMLElement, className: string): void {
    element.classList.toggle(className);
  }

  // Check if element has class
  hasClass(element: HTMLElement, className: string): boolean {
    return element.classList.contains(className);
  }

  // Clean up resources
  cleanup(): void {
    if (this.styleElement && this.styleElement.parentNode) {
      this.styleElement.parentNode.removeChild(this.styleElement);
    }
    this.rules.clear();
    this.keyframes.clear();
    this.styleSheet = null;
    this.styleElement = null;
  }

  // Check if CSS features are supported
  static isSupported(feature: string): boolean {
    const div = document.createElement('div');
    return feature in div.style;
  }

  // Check if CSS variable is supported
  static isCSSVariableSupported(): boolean {
    return window.CSS && CSS.supports('(--foo: red)');
  }
}

// Example usage:
/*
// Create CSS manager instance
const cssManager = CSSManager.getInstance();

// Initialize style sheet
cssManager.initialize();

// Add CSS rules
cssManager.addRule('.button', {
  backgroundColor: '#007bff',
  color: '#ffffff',
  padding: '10px 20px',
  borderRadius: '4px',
  cursor: 'pointer'
});

// Add hover state
cssManager.addRule('.button:hover', {
  backgroundColor: '#0056b3'
});

// Add keyframes animation
cssManager.addKeyframes('fadeIn', {
  '0%': { opacity: '0' },
  '100%': { opacity: '1' }
});

// Add animation to element
cssManager.addRule('.fade-in', {
  animation: 'fadeIn 1s ease-in-out'
});

// Add transitions
cssManager.addTransition('.button', [
  {
    property: 'background-color',
    duration: '0.3s',
    timingFunction: 'ease-in-out'
  }
]);

// Add media query
cssManager.addMediaQuery('(max-width: 768px)', {
  '.button': {
    padding: '8px 16px',
    fontSize: '14px'
  }
});

// Set CSS variable
cssManager.setCSSVariable('primary-color', '#007bff');

// Apply inline styles
const button = document.querySelector('.button') as HTMLElement;
if (button) {
  cssManager.applyInlineStyles(button, {
    marginTop: '10px',
    marginBottom: '10px'
  });
}

// Clean up when done
cssManager.cleanup();
*/