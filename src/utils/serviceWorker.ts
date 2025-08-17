type ServiceWorkerOptions = {
  scope?: string;
  type?: WorkerType;
  updateViaCache?: ServiceWorkerUpdateViaCache;
};

type ServiceWorkerEventMap = {
  controlling: ServiceWorkerContainer;
  waiting: ServiceWorker;
  installing: ServiceWorker;
  activated: ServiceWorker;
  installed: ServiceWorker;
  redundant: ServiceWorker;
  error: ErrorEvent;
  message: MessageEvent;
  stateChange: ServiceWorker;
};

type ServiceWorkerEventHandler<K extends keyof ServiceWorkerEventMap> = (
  event: ServiceWorkerEventMap[K]
) => void;

type ServiceWorkerMessage<T = any> = {
  type: string;
  data?: T;
  transfer?: Transferable[];
};

export class ServiceWorkerManager {
  private static instance: ServiceWorkerManager;
  private registration: ServiceWorkerRegistration | null = null;
  private eventHandlers: Map<
    keyof ServiceWorkerEventMap,
    Set<ServiceWorkerEventHandler<any>>
  > = new Map();

  private constructor() {
    // Initialize event handler sets
    Object.keys(this.getDefaultHandlers()).forEach((event) => {
      this.eventHandlers.set(event as keyof ServiceWorkerEventMap, new Set());
    });
  }

  static getInstance(): ServiceWorkerManager {
    if (!ServiceWorkerManager.instance) {
      ServiceWorkerManager.instance = new ServiceWorkerManager();
    }
    return ServiceWorkerManager.instance;
  }

  // Register service worker
  async register(
    scriptUrl: string | URL,
    options: ServiceWorkerOptions = {}
  ): Promise<ServiceWorkerRegistration> {
    if (!this.isSupported()) {
      throw new Error('Service Workers are not supported in this browser');
    }

    try {
      this.registration = await navigator.serviceWorker.register(scriptUrl, options);
      this.setupEventListeners();
      return this.registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      throw error;
    }
  }

  // Unregister service worker
  async unregister(): Promise<boolean> {
    if (!this.registration) {
      return false;
    }

    try {
      const result = await this.registration.unregister();
      if (result) {
        this.registration = null;
        this.clearEventListeners();
      }
      return result;
    } catch (error) {
      console.error('Service Worker unregistration failed:', error);
      throw error;
    }
  }

  // Update service worker
  async update(): Promise<void> {
    if (!this.registration) {
      throw new Error('Service Worker is not registered');
    }

    try {
      await this.registration.update();
    } catch (error) {
      console.error('Service Worker update failed:', error);
      throw error;
    }
  }

  // Send message to service worker
  async sendMessage<T = any>(
    message: ServiceWorkerMessage<T>
  ): Promise<void> {
    if (!this.registration?.active) {
      throw new Error('No active Service Worker');
    }

    const { type, data, transfer } = message;
    const payload = { type, data };

    if (transfer) {
      this.registration.active.postMessage(payload, transfer);
    } else {
      this.registration.active.postMessage(payload);
    }
  }

  // Add event listener
  addEventListener<K extends keyof ServiceWorkerEventMap>(
    event: K,
    handler: ServiceWorkerEventHandler<K>
  ): () => void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.add(handler);
      return () => {
        handlers.delete(handler);
      };
    }
    return () => {};
  }

  // Get registration
  getRegistration(): ServiceWorkerRegistration | null {
    return this.registration;
  }

  // Get active service worker
  getActiveWorker(): ServiceWorker | null {
    return this.registration?.active ?? null;
  }

  // Check if service worker is supported
  isSupported(): boolean {
    return 'serviceWorker' in navigator;
  }

  // Check if service worker is ready
  async isReady(): Promise<boolean> {
    if (!this.isSupported()) {
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      return !!registration.active;
    } catch {
      return false;
    }
  }

  // Private methods
  private setupEventListeners(): void {
    if (!this.registration) return;

    const defaultHandlers = this.getDefaultHandlers();
    Object.entries(defaultHandlers).forEach(([event, handler]) => {
      const target = this.getEventTarget(event as keyof ServiceWorkerEventMap);
      if (target) {
        target.addEventListener(event, handler as EventListener);
      }
    });
  }

  private clearEventListeners(): void {
    const defaultHandlers = this.getDefaultHandlers();
    Object.entries(defaultHandlers).forEach(([event, handler]) => {
      const target = this.getEventTarget(event as keyof ServiceWorkerEventMap);
      if (target) {
        target.removeEventListener(event, handler as EventListener);
      }
    });

    this.eventHandlers.forEach(handlers => handlers.clear());
  }

  private getEventTarget(
    event: keyof ServiceWorkerEventMap
  ): EventTarget | null {
    if (!this.registration) return null;

    switch (event) {
      case 'controlling':
        return navigator.serviceWorker;
      case 'message':
      case 'stateChange':
      case 'error':
        return this.registration.active;
      case 'waiting':
      case 'installing':
      case 'activated':
      case 'installed':
      case 'redundant':
        return this.registration;
      default:
        return null;
    }
  }

  private getDefaultHandlers(): Record<string, EventListener> {
    return {
      controlling: (event: Event) => {
        const handlers = this.eventHandlers.get('controlling');
        handlers?.forEach(handler => {
          handler(navigator.serviceWorker as ServiceWorkerContainer);
        });
      },

      waiting: (event: Event) => {
        const handlers = this.eventHandlers.get('waiting');
        handlers?.forEach(handler => {
          handler(this.registration!.waiting!);
        });
      },

      installing: (event: Event) => {
        const handlers = this.eventHandlers.get('installing');
        handlers?.forEach(handler => {
          handler(this.registration!.installing!);
        });
      },

      activated: (event: Event) => {
        const handlers = this.eventHandlers.get('activated');
        handlers?.forEach(handler => {
          handler(this.registration!.active!);
        });
      },

      installed: (event: Event) => {
        const handlers = this.eventHandlers.get('installed');
        handlers?.forEach(handler => {
          handler(this.registration!.active!);
        });
      },

      redundant: (event: Event) => {
        const handlers = this.eventHandlers.get('redundant');
        handlers?.forEach(handler => {
          handler(this.registration!.active!);
        });
      },

      error: (event: Event) => {
        const handlers = this.eventHandlers.get('error');
        handlers?.forEach(handler => {
          handler(event as ErrorEvent);
        });
      },

      message: (event: Event) => {
        const handlers = this.eventHandlers.get('message');
        handlers?.forEach(handler => {
          handler(event as MessageEvent);
        });
      },

      statechange: (event: Event) => {
        const handlers = this.eventHandlers.get('stateChange');
        handlers?.forEach(handler => {
          handler(this.registration!.active!);
        });
      }
    };
  }
}

// Example usage:
/*
// Create service worker manager instance
const swManager = ServiceWorkerManager.getInstance();

// Check if Service Workers are supported
if (swManager.isSupported()) {
  // Register service worker
  try {
    const registration = await swManager.register('/service-worker.js', {
      scope: '/',
      type: 'module',
      updateViaCache: 'none'
    });

    // Add event listeners
    const unsubscribeActivated = swManager.addEventListener('activated', (worker) => {
      console.log('Service Worker activated:', worker);
    });

    const unsubscribeMessage = swManager.addEventListener('message', (event) => {
      console.log('Received message from Service Worker:', event.data);
    });

    // Send message to service worker
    await swManager.sendMessage({
      type: 'CACHE_ASSETS',
      data: {
        assets: ['/index.html', '/styles.css', '/app.js']
      }
    });

    // Check if service worker is ready
    const isReady = await swManager.isReady();
    console.log('Service Worker ready:', isReady);

    // Update service worker
    await swManager.update();

    // Later: cleanup
    unsubscribeActivated();
    unsubscribeMessage();

    // Unregister service worker
    await swManager.unregister();
  } catch (error) {
    console.error('Service Worker setup failed:', error);
  }
}

// Example service-worker.js:
/*
const CACHE_NAME = 'app-cache-v1';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll([
          '/',
          '/index.html',
          '/styles.css',
          '/app.js'
        ]);
      })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});

self.addEventListener('message', (event) => {
  const { type, data } = event.data;

  switch (type) {
    case 'CACHE_ASSETS':
      event.waitUntil(
        caches.open(CACHE_NAME)
          .then(cache => cache.addAll(data.assets))
          .then(() => {
            self.clients.matchAll()
              .then(clients => {
                clients.forEach(client => {
                  client.postMessage({
                    type: 'ASSETS_CACHED',
                    data: data.assets
                  });
                });
              });
          })
      );
      break;
  }
});
*/