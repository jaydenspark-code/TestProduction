type PushSubscriptionOptions = {
  applicationServerKey?: string;
  userVisibleOnly?: boolean;
};

type NotificationOptions = {
  body?: string;
  icon?: string;
  image?: string;
  badge?: string;
  vibrate?: number[];
  sound?: string;
  dir?: 'auto' | 'ltr' | 'rtl';
  tag?: string;
  data?: any;
  requireInteraction?: boolean;
  renotify?: boolean;
  silent?: boolean;
  actions?: NotificationAction[];
  timestamp?: number;
};

type NotificationAction = {
  action: string;
  title: string;
  icon?: string;
};

type NotificationEventCallback = (event: NotificationEvent) => void;

export class PushNotificationManager {
  private static instance: PushNotificationManager;
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;
  private pushSubscription: PushSubscription | null = null;
  private readonly actionHandlers: Map<string, NotificationEventCallback>;

  private constructor() {
    this.actionHandlers = new Map();
    this.setupServiceWorker();
  }

  static getInstance(): PushNotificationManager {
    if (!PushNotificationManager.instance) {
      PushNotificationManager.instance = new PushNotificationManager();
    }
    return PushNotificationManager.instance;
  }

  // Check if push notifications are supported
  isSupported(): boolean {
    return 'Notification' in window &&
           'serviceWorker' in navigator &&
           'PushManager' in window;
  }

  // Request notification permission
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      throw new Error('Push notifications are not supported');
    }

    const permission = await Notification.requestPermission();
    return permission;
  }

  // Get current permission status
  getPermissionStatus(): NotificationPermission {
    return Notification.permission;
  }

  // Subscribe to push notifications
  async subscribe(options: PushSubscriptionOptions = {}): Promise<PushSubscription> {
    if (!this.isSupported()) {
      throw new Error('Push notifications are not supported');
    }

    if (Notification.permission !== 'granted') {
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Notification permission denied');
      }
    }

    if (!this.serviceWorkerRegistration) {
      await this.setupServiceWorker();
    }

    try {
      this.pushSubscription = await this.serviceWorkerRegistration!.pushManager.subscribe({
        userVisibleOnly: options.userVisibleOnly ?? true,
        applicationServerKey: options.applicationServerKey
          ? this.urlBase64ToUint8Array(options.applicationServerKey)
          : undefined
      });

      return this.pushSubscription;
    } catch (error) {
      throw new Error(`Failed to subscribe to push notifications: ${error}`);
    }
  }

  // Unsubscribe from push notifications
  async unsubscribe(): Promise<boolean> {
    if (!this.pushSubscription) {
      return false;
    }

    try {
      const result = await this.pushSubscription.unsubscribe();
      this.pushSubscription = null;
      return result;
    } catch (error) {
      throw new Error(`Failed to unsubscribe from push notifications: ${error}`);
    }
  }

  // Show notification
  async showNotification(
    title: string,
    options: NotificationOptions = {}
  ): Promise<void> {
    if (!this.serviceWorkerRegistration) {
      throw new Error('Service worker not registered');
    }

    await this.serviceWorkerRegistration.showNotification(title, options);
  }

  // Get all active notifications
  async getNotifications(): Promise<Notification[]> {
    if (!this.serviceWorkerRegistration) {
      return [];
    }

    return this.serviceWorkerRegistration.getNotifications();
  }

  // Close all notifications
  async closeAll(): Promise<void> {
    const notifications = await this.getNotifications();
    notifications.forEach(notification => notification.close());
  }

  // Close notifications by tag
  async closeByTag(tag: string): Promise<void> {
    const notifications = await this.getNotifications();
    notifications
      .filter(notification => notification.tag === tag)
      .forEach(notification => notification.close());
  }

  // Add notification click handler
  addClickHandler(action: string, callback: NotificationEventCallback): void {
    this.actionHandlers.set(action, callback);
  }

  // Remove notification click handler
  removeClickHandler(action: string): boolean {
    return this.actionHandlers.delete(action);
  }

  // Get current push subscription
  getSubscription(): PushSubscription | null {
    return this.pushSubscription;
  }

  // Private methods
  private async setupServiceWorker(): Promise<void> {
    if (!this.isSupported()) {
      return;
    }

    try {
      this.serviceWorkerRegistration = await navigator.serviceWorker.register(
        '/service-worker.js'
      );

      // Setup notification click handler
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'NOTIFICATION_CLICK') {
          const handler = this.actionHandlers.get(event.data.action);
          if (handler) {
            handler(event.data.event);
          }
        }
      });

      await navigator.serviceWorker.ready;
    } catch (error) {
      throw new Error(`Failed to register service worker: ${error}`);
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
  }
}

// Example service-worker.js content:
/*
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    vibrate: data.vibrate,
    data: data.data,
    actions: data.actions,
    tag: data.tag
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // Handle notification click
  const clickData = {
    type: 'NOTIFICATION_CLICK',
    action: event.action || 'default',
    event: {
      action: event.action,
      notification: {
        data: event.notification.data,
        tag: event.notification.tag
      }
    }
  };

  // Send click data to the client
  const promiseChain = clients.matchAll({
    type: 'window',
    includeUncontrolled: true
  }).then((windowClients) => {
    windowClients.forEach((client) => {
      client.postMessage(clickData);
    });
  });

  event.waitUntil(promiseChain);
});
*/

// Example usage:
/*
const pushNotification = PushNotificationManager.getInstance();

// Check support and request permission
if (pushNotification.isSupported()) {
  try {
    const permission = await pushNotification.requestPermission();
    console.log('Notification permission:', permission);

    if (permission === 'granted') {
      // Subscribe to push notifications
      const subscription = await pushNotification.subscribe({
        applicationServerKey: 'YOUR_PUBLIC_VAPID_KEY',
        userVisibleOnly: true
      });

      // Send subscription to your server
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(subscription)
      });

      // Show notification
      await pushNotification.showNotification('Hello!', {
        body: 'This is a test notification',
        icon: '/icon.png',
        badge: '/badge.png',
        vibrate: [200, 100, 200],
        tag: 'test-notification',
        actions: [
          {
            action: 'open',
            title: 'Open App'
          },
          {
            action: 'close',
            title: 'Close'
          }
        ]
      });

      // Add click handlers
      pushNotification.addClickHandler('open', (event) => {
        console.log('Notification opened:', event);
        window.focus();
      });

      pushNotification.addClickHandler('close', (event) => {
        console.log('Notification closed:', event);
      });

      // Get all notifications
      const notifications = await pushNotification.getNotifications();
      console.log('Active notifications:', notifications);

      // Close specific notifications
      await pushNotification.closeByTag('test-notification');

      // Unsubscribe
      await pushNotification.unsubscribe();
    }
  } catch (error) {
    console.error('Push notification error:', error);
  }
}
*/