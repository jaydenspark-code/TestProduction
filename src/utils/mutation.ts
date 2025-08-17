type MutationCallback = (mutations: MutationRecord[], observer: MutationObserver) => void;

type MutationConfig = {
  attributes?: boolean;
  attributeFilter?: string[];
  attributeOldValue?: boolean;
  characterData?: boolean;
  characterDataOldValue?: boolean;
  childList?: boolean;
  subtree?: boolean;
};

type ElementConfig = {
  onMutation?: MutationCallback;
  onAttributeChange?: (name: string, oldValue: string | null, newValue: string | null) => void;
  onChildListChange?: (added: Node[], removed: Node[]) => void;
  onCharacterDataChange?: (oldValue: string | null, newValue: string | null) => void;
  config?: MutationConfig;
};

type ObserverInstance = {
  observer: MutationObserver;
  elements: Map<Node, ElementConfig>;
};

export class MutationManager {
  private static instance: MutationManager;
  private observers: Map<string, ObserverInstance>;
  private elementObservers: Map<Node, string>;

  private constructor() {
    this.observers = new Map();
    this.elementObservers = new Map();
  }

  static getInstance(): MutationManager {
    if (!MutationManager.instance) {
      MutationManager.instance = new MutationManager();
    }
    return MutationManager.instance;
  }

  private getConfigKey(config: MutationConfig = {}): string {
    const {
      attributes = false,
      attributeFilter = [],
      attributeOldValue = false,
      characterData = false,
      characterDataOldValue = false,
      childList = false,
      subtree = false
    } = config;

    return JSON.stringify({
      attributes,
      attributeFilter,
      attributeOldValue,
      characterData,
      characterDataOldValue,
      childList,
      subtree
    });
  }

  private createObserver(config: MutationConfig = {}): ObserverInstance {
    const observer = new MutationObserver(
      (mutations: MutationRecord[], observer: MutationObserver) => {
        mutations.forEach(mutation => {
          const element = mutation.target;
          const callbacks = this.getElementCallbacks(element);
          if (!callbacks) return;

          // Call general mutation callback
          callbacks.onMutation?.(mutations, observer);

          // Call specific callbacks based on mutation type
          switch (mutation.type) {
            case 'attributes': {
              const oldValue = mutation.oldValue;
              const newValue = (element as Element).getAttribute(mutation.attributeName!);
              callbacks.onAttributeChange?.(mutation.attributeName!, oldValue, newValue);
              break;
            }
            case 'childList': {
              const added = Array.from(mutation.addedNodes);
              const removed = Array.from(mutation.removedNodes);
              callbacks.onChildListChange?.(added, removed);
              break;
            }
            case 'characterData': {
              const oldValue = mutation.oldValue;
              const newValue = element.textContent;
              callbacks.onCharacterDataChange?.(oldValue, newValue);
              break;
            }
          }
        });
      }
    );

    return {
      observer,
      elements: new Map()
    };
  }

  private getOrCreateObserver(config: MutationConfig = {}): ObserverInstance {
    const key = this.getConfigKey(config);
    let instance = this.observers.get(key);

    if (!instance) {
      instance = this.createObserver(config);
      this.observers.set(key, instance);
    }

    return instance;
  }

  private getElementCallbacks(element: Node): ElementConfig | undefined {
    const key = this.elementObservers.get(element);
    if (!key) return undefined;

    const instance = this.observers.get(key);
    if (!instance) return undefined;

    return instance.elements.get(element);
  }

  observe(element: Node, config: ElementConfig = {}): void {
    if (!this.isSupported()) {
      throw new Error('MutationObserver API not supported');
    }

    // Unobserve if already being observed
    this.unobserve(element);

    const { config: mutationConfig, ...callbacks } = config;
    const instance = this.getOrCreateObserver(mutationConfig);
    const key = this.getConfigKey(mutationConfig);

    instance.elements.set(element, callbacks);
    this.elementObservers.set(element, key);
    instance.observer.observe(element, mutationConfig);
  }

  unobserve(element: Node): void {
    const key = this.elementObservers.get(element);
    if (!key) return;

    const instance = this.observers.get(key);
    if (!instance) return;

    instance.observer.disconnect();
    instance.elements.delete(element);
    this.elementObservers.delete(element);

    // Reobserve other elements with same config
    instance.elements.forEach((config, el) => {
      instance.observer.observe(el, JSON.parse(key));
    });

    // Clean up observer if no elements left
    if (instance.elements.size === 0) {
      this.observers.delete(key);
    }
  }

  isElementObserved(element: Node): boolean {
    return this.elementObservers.has(element);
  }

  getObservedElements(): Node[] {
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
    return typeof window !== 'undefined' && 'MutationObserver' in window;
  }
}

// Example usage:
/*
const mutation = MutationManager.getInstance();

// Simple observation
const element = document.querySelector('.my-element');
mutation.observe(element, {
  config: {
    attributes: true,
    childList: true,
    subtree: true
  },
  onMutation: (mutations, observer) => {
    console.log('Mutations:', mutations);
  }
});

// Advanced observation with specific callbacks
const element2 = document.querySelector('.another-element');
mutation.observe(element2, {
  config: {
    attributes: true,
    attributeOldValue: true,
    childList: true,
    characterData: true,
    characterDataOldValue: true,
    subtree: true
  },
  onAttributeChange: (name, oldValue, newValue) => {
    console.log(`Attribute ${name} changed from ${oldValue} to ${newValue}`);
  },
  onChildListChange: (added, removed) => {
    console.log('Added nodes:', added);
    console.log('Removed nodes:', removed);
  },
  onCharacterDataChange: (oldValue, newValue) => {
    console.log(`Text content changed from ${oldValue} to ${newValue}`);
  }
});

// Stop observing
mutation.unobserve(element);

// Check if element is being observed
console.log('Is element observed:', mutation.isElementObserved(element));

// Get all observed elements
const observedElements = mutation.getObservedElements();
console.log('Observed elements:', observedElements);

// Clean up
mutation.cleanup();
*/