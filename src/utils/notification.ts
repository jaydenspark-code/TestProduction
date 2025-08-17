type NotificationOptions = {
  body?: string;
  icon?: string;
  badge?: string;
  image?: string;
  tag?: string;
  data?: any;
  vibrate?: number[];
  renotify?: boolean;
  requireInteraction?: boolean;
  actions?: NotificationAction[];
  silent?: boolean;
  timestamp?: number;
};

type NotificationAction = {
  action: string;
  title: string;
  icon?: string;
};

type NotificationCallback = (notification: Notification) => void;

export class NotificationManager {
  private static instance: NotificationManager;
  private permission: NotificationPermission = 'default';
  private callbacks: Map<string, NotificationCallback[]>;

  private constructor() {
    this.callbacks = new Map();
    this.permission = Notification.permission;
    this.setupServiceWorker();
  }

  static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  // Request notification permission
  async requestPermission(): Promise<NotificationPermission> {
    try {
      this.permission = await Notification.requestPermission();
      return this.permission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  }

  // Check if notifications are supported
  isSupported(): boolean {
    return 'Notification' in window;
  }

  // Check if notifications are enabled
  isEnabled(): boolean {
    return this.isSupported() && this.permission === 'granted';
  }

  // Show notification
  async show(
    title: string,
    options: NotificationOptions = {}
  ): Promise<Notification | null> {
    if (!this.isSupported()) {
      console.warn('Notifications are not supported in this browser');
      return null;
    }

    if (this.permission === 'default') {
      this.permission = await this.requestPermission();
    }

    if (this.permission !== 'granted') {
      console.warn('Notification permission not granted');
      return null;
    }

    try {
      const notification = new Notification(title, {
        ...options,
        timestamp: options.timestamp || Date.now()
      });

      this.setupNotificationEvents(notification);
      return notification;
    } catch (error) {
      console.error('Error showing notification:', error);
      return null;
    }
  }

  // Schedule notification
  async schedule(
    title: string,
    options: NotificationOptions & { delay: number }
  ): Promise<number> {
    const { delay, ...notificationOptions } = options;

    return window.setTimeout(
      () => this.show(title, notificationOptions),
      delay
    );
  }

  // Cancel scheduled notification
  cancelScheduled(id: number): void {
    window.clearTimeout(id);
  }

  // Close all notifications
  async closeAll(): Promise<void> {
    if ('getNotifications' in navigator.serviceWorker) {
      const registration = await navigator.serviceWorker.ready;
      const notifications = await registration.getNotifications();
      notifications.forEach(notification => notification.close());
    }
  }

  // Add event listener
  on(event: 'click' | 'close' | 'error' | 'show', callback: NotificationCallback): void {
    if (!this.callbacks.has(event)) {
      this.callbacks.set(event, []);
    }
    this.callbacks.get(event)?.push(callback);
  }

  // Remove event listener
  off(event: 'click' | 'close' | 'error' | 'show', callback: NotificationCallback): void {
    const callbacks = this.callbacks.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index !== -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  // Create notification group
  async createGroup(
    groupTitle: string,
    notifications: Array<{ title: string; options?: NotificationOptions }>
  ): Promise<Notification[]> {
    const results: Notification[] = [];

    for (const { title, options = {} } of notifications) {
      const notification = await this.show(title, {
        ...options,
        tag: groupTitle
      });
      if (notification) {
        results.push(notification);
      }
    }

    return results;
  }

  // Update existing notification
  async update(
    tag: string,
    title: string,
    options: NotificationOptions = {}
  ): Promise<Notification | null> {
    await this.closeByTag(tag);
    return this.show(title, { ...options, tag });
  }

  // Close notification by tag
  async closeByTag(tag: string): Promise<void> {
    if ('getNotifications' in navigator.serviceWorker) {
      const registration = await navigator.serviceWorker.ready;
      const notifications = await registration.getNotifications({ tag });
      notifications.forEach(notification => notification.close());
    }
  }

  // Private methods
  private setupNotificationEvents(notification: Notification): void {
    notification.onclick = () => {
      this.callbacks.get('click')?.forEach(callback => callback(notification));
      window.focus();
      notification.close();
    };

    notification.onclose = () => {
      this.callbacks.get('close')?.forEach(callback => callback(notification));
    };

    notification.onerror = () => {
      this.callbacks.get('error')?.forEach(callback => callback(notification));
    };

    notification.onshow = () => {
      this.callbacks.get('show')?.forEach(callback => callback(notification));
    };
  }

  private async setupServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        registration.addEventListener('push', (event: PushEvent) => {
          const data = event.data?.json();
          if (data) {
            this.show(data.title, data.options);
          }
        });
      } catch (error) {
        console.error('Error setting up service worker:', error);
      }
    }
  }
}

// Example usage:
/*
const notifications = NotificationManager.getInstance();

// Request permission
await notifications.requestPermission();

// Show simple notification
await notifications.show('Hello!', {
  body: 'This is a notification',
  icon: '/icon.png'
});

// Show notification with actions
await notifications.show('New Message', {
  body: 'You have a new message',
  actions: [
    { action: 'reply', title: 'Reply' },
    { action: 'ignore', title: 'Ignore' }
  ]
});

// Schedule notification
const id = await notifications.schedule('Reminder', {
  body: 'Don\'t forget your meeting!',
  delay: 3600000 // 1 hour
});

// Create notification group
await notifications.createGroup('updates', [
  { title: 'Update 1', options: { body: 'First update' } },
  { title: 'Update 2', options: { body: 'Second update' } }
]);

// Handle notification events
notifications.on('click', (notification) => {
  console.log('Notification clicked:', notification);
});

// Update existing notification
await notifications.update('message', 'Updated Message', {
  body: 'This message has been updated'
});

// Close notifications
await notifications.closeByTag('message');
await notifications.closeAll();
*/