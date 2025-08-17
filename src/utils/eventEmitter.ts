type EventHandler<T = any> = (data: T) => void | Promise<void>;

interface EventSubscription {
  unsubscribe: () => void;
}

class EventError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EventError';
  }
}

export class EventEmitter {
  private static instance: EventEmitter;
  private handlers: Map<string, Set<EventHandler>> = new Map();
  private onceHandlers: Map<string, Set<EventHandler>> = new Map();
  private maxListeners: number = 10;

  private constructor() {}

  static getInstance(): EventEmitter {
    if (!EventEmitter.instance) {
      EventEmitter.instance = new EventEmitter();
    }
    return EventEmitter.instance;
  }

  setMaxListeners(n: number): void {
    if (n < 0) {
      throw new EventError('maxListeners must be a non-negative number');
    }
    this.maxListeners = n;
  }

  getMaxListeners(): number {
    return this.maxListeners;
  }

  private checkListenerLimit(eventName: string): void {
    const count = this.listenerCount(eventName);
    if (count >= this.maxListeners) {
      console.warn(
        `Warning: Event '${eventName}' has exceeded the limit of ${this.maxListeners} listeners.`
      );
    }
  }

  on<T>(eventName: string, handler: EventHandler<T>): EventSubscription {
    if (!this.handlers.has(eventName)) {
      this.handlers.set(eventName, new Set());
    }

    const handlers = this.handlers.get(eventName)!;
    this.checkListenerLimit(eventName);
    handlers.add(handler);

    return {
      unsubscribe: () => {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.handlers.delete(eventName);
        }
      }
    };
  }

  once<T>(eventName: string, handler: EventHandler<T>): EventSubscription {
    if (!this.onceHandlers.has(eventName)) {
      this.onceHandlers.set(eventName, new Set());
    }

    const handlers = this.onceHandlers.get(eventName)!;
    this.checkListenerLimit(eventName);
    handlers.add(handler);

    return {
      unsubscribe: () => {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.onceHandlers.delete(eventName);
        }
      }
    };
  }

  async emit<T>(eventName: string, data?: T): Promise<void> {
    const regularHandlers = this.handlers.get(eventName) || new Set();
    const onceHandlers = this.onceHandlers.get(eventName) || new Set();

    const allHandlers = [...regularHandlers, ...onceHandlers];
    this.onceHandlers.delete(eventName);

    await Promise.all(
      allHandlers.map(async (handler) => {
        try {
          await handler(data);
        } catch (error) {
          console.error(
            `Error in event handler for '${eventName}':`,
            error
          );
        }
      })
    );
  }

  removeAllListeners(eventName?: string): void {
    if (eventName) {
      this.handlers.delete(eventName);
      this.onceHandlers.delete(eventName);
    } else {
      this.handlers.clear();
      this.onceHandlers.clear();
    }
  }

  listenerCount(eventName: string): number {
    const regularCount = this.handlers.get(eventName)?.size || 0;
    const onceCount = this.onceHandlers.get(eventName)?.size || 0;
    return regularCount + onceCount;
  }

  eventNames(): string[] {
    const names = new Set([
      ...this.handlers.keys(),
      ...this.onceHandlers.keys()
    ]);
    return Array.from(names);
  }
}

// Example usage:
/*
// Get the singleton instance
const events = EventEmitter.getInstance();

// Define event types
interface UserEvent {
  id: string;
  name: string;
}

interface ErrorEvent {
  code: number;
  message: string;
}

// Subscribe to events with type safety
const userSub = events.on<UserEvent>('user:updated', (data) => {
  console.log(`User ${data.name} updated`);
});

const errorSub = events.once<ErrorEvent>('error', (data) => {
  console.error(`Error ${data.code}: ${data.message}`);
});

// Emit events
events.emit<UserEvent>('user:updated', {
  id: '123',
  name: 'John Doe'
});

events.emit<ErrorEvent>('error', {
  code: 404,
  message: 'Not found'
});

// Cleanup
userSub.unsubscribe();
errorSub.unsubscribe();
*/