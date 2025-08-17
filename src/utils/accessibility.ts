type A11yRole =
  | 'alert'
  | 'alertdialog'
  | 'button'
  | 'checkbox'
  | 'dialog'
  | 'gridcell'
  | 'link'
  | 'log'
  | 'marquee'
  | 'menuitem'
  | 'menuitemcheckbox'
  | 'menuitemradio'
  | 'option'
  | 'progressbar'
  | 'radio'
  | 'scrollbar'
  | 'searchbox'
  | 'slider'
  | 'spinbutton'
  | 'status'
  | 'switch'
  | 'tab'
  | 'tabpanel'
  | 'textbox'
  | 'timer'
  | 'tooltip'
  | 'treeitem';

type A11yLiveRegion = 'off' | 'polite' | 'assertive';

type A11yConfig = {
  enableHighContrast?: boolean;
  enableReducedMotion?: boolean;
  enableLargeText?: boolean;
  enableScreenReader?: boolean;
  focusIndicatorColor?: string;
  skipLinkTarget?: string;
};

export class AccessibilityManager {
  private static instance: AccessibilityManager;
  private config: A11yConfig;
  private observers: Map<Element, MutationObserver>;
  private styleSheet: CSSStyleSheet | null;

  private constructor(config: A11yConfig = {}) {
    this.config = {
      enableHighContrast: false,
      enableReducedMotion: false,
      enableLargeText: false,
      enableScreenReader: true,
      focusIndicatorColor: '#1a73e8',
      skipLinkTarget: '#main-content',
      ...config
    };
    this.observers = new Map();
    this.styleSheet = this.createStyleSheet();
    this.initializeA11yFeatures();
  }

  static getInstance(config?: A11yConfig): AccessibilityManager {
    if (!AccessibilityManager.instance) {
      AccessibilityManager.instance = new AccessibilityManager(config);
    }
    return AccessibilityManager.instance;
  }

  // Create accessibility stylesheet
  private createStyleSheet(): CSSStyleSheet | null {
    try {
      const style = document.createElement('style');
      document.head.appendChild(style);
      return style.sheet;
    } catch (error) {
      console.error('Failed to create accessibility stylesheet:', error);
      return null;
    }
  }

  // Initialize accessibility features
  private initializeA11yFeatures(): void {
    this.updateA11yStyles();
    this.addSkipLink();
    this.setupKeyboardNavigation();
  }

  // Update accessibility styles
  private updateA11yStyles(): void {
    if (!this.styleSheet) return;

    const rules = [
      // Focus indicator
      `*:focus { outline: 2px solid ${this.config.focusIndicatorColor} !important; outline-offset: 2px !important; }`,
      // High contrast mode
      this.config.enableHighContrast
        ? ':root { filter: contrast(1.5) !important; }'
        : '',
      // Reduced motion
      this.config.enableReducedMotion
        ? '*, *::before, *::after { animation-duration: 0.001ms !important; transition-duration: 0.001ms !important; }'
        : '',
      // Large text
      this.config.enableLargeText
        ? 'html { font-size: 125% !important; }'
        : ''
    ];

    // Remove existing rules
    while (this.styleSheet.cssRules.length > 0) {
      this.styleSheet.deleteRule(0);
    }

    // Add new rules
    rules.forEach(rule => {
      if (rule) {
        try {
          this.styleSheet?.insertRule(rule, this.styleSheet.cssRules.length);
        } catch (error) {
          console.error('Failed to insert CSS rule:', error);
        }
      }
    });
  }

  // Add skip link
  private addSkipLink(): void {
    const existingSkipLink = document.querySelector('.a11y-skip-link');
    if (existingSkipLink) return;

    const skipLink = document.createElement('a');
    skipLink.className = 'a11y-skip-link';
    skipLink.href = this.config.skipLinkTarget;
    skipLink.textContent = 'Skip to main content';

    // Style skip link
    skipLink.style.cssText = `
      position: absolute;
      top: -40px;
      left: 0;
      padding: 8px;
      background: #000;
      color: #fff;
      z-index: 100;
      transition: top 0.2s;
    `;

    // Show skip link on focus
    skipLink.addEventListener('focus', () => {
      skipLink.style.top = '0';
    });

    skipLink.addEventListener('blur', () => {
      skipLink.style.top = '-40px';
    });

    document.body.insertBefore(skipLink, document.body.firstChild);
  }

  // Setup keyboard navigation
  private setupKeyboardNavigation(): void {
    document.addEventListener('keydown', (event: KeyboardEvent) => {
      // Tab key navigation
      if (event.key === 'Tab') {
        document.body.classList.add('keyboard-navigation');
      }

      // Skip link activation
      if (event.key === 'Enter' && document.activeElement?.classList.contains('a11y-skip-link')) {
        event.preventDefault();
        const target = document.querySelector(this.config.skipLinkTarget);
        if (target instanceof HTMLElement) {
          target.focus();
          target.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });

    // Remove keyboard navigation class on mouse use
    document.addEventListener('mousedown', () => {
      document.body.classList.remove('keyboard-navigation');
    });
  }

  // Set ARIA role
  setRole(element: Element, role: A11yRole): void {
    element.setAttribute('role', role);
  }

  // Set ARIA label
  setLabel(element: Element, label: string): void {
    element.setAttribute('aria-label', label);
  }

  // Set ARIA description
  setDescription(element: Element, description: string): void {
    element.setAttribute('aria-description', description);
  }

  // Set ARIA live region
  setLiveRegion(element: Element, type: A11yLiveRegion): void {
    element.setAttribute('aria-live', type);
  }

  // Announce message to screen readers
  announce(message: string, type: A11yLiveRegion = 'polite'): void {
    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', type);
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'a11y-announcer';
    announcer.style.cssText = 'position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;';

    document.body.appendChild(announcer);
    // Use setTimeout to ensure the announcement is made
    setTimeout(() => {
      announcer.textContent = message;
      setTimeout(() => {
        document.body.removeChild(announcer);
      }, 3000);
    }, 100);
  }

  // Make element focusable
  makeFocusable(element: Element, tabIndex: number = 0): void {
    element.setAttribute('tabindex', tabIndex.toString());
  }

  // Hide element from screen readers
  hideFromScreenReader(element: Element): void {
    element.setAttribute('aria-hidden', 'true');
  }

  // Show element to screen readers
  showToScreenReader(element: Element): void {
    element.removeAttribute('aria-hidden');
  }

  // Set element expanded state
  setExpanded(element: Element, expanded: boolean): void {
    element.setAttribute('aria-expanded', expanded.toString());
  }

  // Set element pressed state
  setPressed(element: Element, pressed: boolean): void {
    element.setAttribute('aria-pressed', pressed.toString());
  }

  // Set element selected state
  setSelected(element: Element, selected: boolean): void {
    element.setAttribute('aria-selected', selected.toString());
  }

  // Set element checked state
  setChecked(element: Element, checked: boolean): void {
    element.setAttribute('aria-checked', checked.toString());
  }

  // Set element disabled state
  setDisabled(element: Element, disabled: boolean): void {
    element.setAttribute('aria-disabled', disabled.toString());
    if (element instanceof HTMLElement) {
      element.disabled = disabled;
    }
  }

  // Set element invalid state
  setInvalid(element: Element, invalid: boolean): void {
    element.setAttribute('aria-invalid', invalid.toString());
  }

  // Set element required state
  setRequired(element: Element, required: boolean): void {
    element.setAttribute('aria-required', required.toString());
    if (element instanceof HTMLElement) {
      element.required = required;
    }
  }

  // Set element busy state
  setBusy(element: Element, busy: boolean): void {
    element.setAttribute('aria-busy', busy.toString());
  }

  // Add element to tab order
  addToTabOrder(element: Element): void {
    this.makeFocusable(element);
  }

  // Remove element from tab order
  removeFromTabOrder(element: Element): void {
    element.setAttribute('tabindex', '-1');
  }

  // Focus element
  focus(element: Element): void {
    if (element instanceof HTMLElement) {
      element.focus();
    }
  }

  // Trap focus within element
  trapFocus(element: Element): void {
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) return;

    const firstFocusable = focusableElements[0] as HTMLElement;
    const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement;

    element.addEventListener('keydown', (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        if (event.shiftKey) {
          if (document.activeElement === firstFocusable) {
            event.preventDefault();
            lastFocusable.focus();
          }
        } else {
          if (document.activeElement === lastFocusable) {
            event.preventDefault();
            firstFocusable.focus();
          }
        }
      }
    });

    firstFocusable.focus();
  }

  // Release trapped focus
  releaseFocus(element: Element): void {
    element.removeEventListener('keydown', () => {});
  }

  // Update configuration
  updateConfig(config: Partial<A11yConfig>): void {
    this.config = { ...this.config, ...config };
    this.updateA11yStyles();
  }

  // Check if screen reader is enabled
  isScreenReaderEnabled(): boolean {
    return this.config.enableScreenReader;
  }

  // Check if high contrast is enabled
  isHighContrastEnabled(): boolean {
    return this.config.enableHighContrast;
  }

  // Check if reduced motion is enabled
  isReducedMotionEnabled(): boolean {
    return this.config.enableReducedMotion;
  }

  // Check if large text is enabled
  isLargeTextEnabled(): boolean {
    return this.config.enableLargeText;
  }

  // Clean up resources
  cleanup(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();

    if (this.styleSheet?.ownerNode) {
      document.head.removeChild(this.styleSheet.ownerNode);
    }
  }

  // Check if Web Accessibility API is supported
  static isSupported(): boolean {
    return (
      typeof document !== 'undefined' &&
      'querySelector' in document &&
      'addEventListener' in window
    );
  }
}

// Example usage:
/*
// Create accessibility manager instance
const a11y = AccessibilityManager.getInstance({
  enableHighContrast: true,
  enableReducedMotion: true,
  enableLargeText: true
});

// Set ARIA attributes
const button = document.querySelector('button');
if (button) {
  a11y.setRole(button, 'button');
  a11y.setLabel(button, 'Close dialog');
  a11y.setPressed(button, false);
}

// Announce message
a11y.announce('Dialog opened', 'assertive');

// Trap focus in dialog
const dialog = document.querySelector('.dialog');
if (dialog) {
  a11y.trapFocus(dialog);
}

// Update configuration
a11y.updateConfig({
  enableHighContrast: false,
  focusIndicatorColor: '#ff0000'
});

// Clean up
a11y.cleanup();
*/