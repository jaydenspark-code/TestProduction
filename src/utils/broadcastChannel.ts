type BroadcastMessage<T = any> = {
  type: string;
  data?: T;
  timestamp?: number;
  source?: string;
};

type MessageHandler<T = any> = (message: BroadcastMessage<T>) => void | Promise<void>;
type ErrorHandler = (error: ErrorEvent) => void;
type MessageFilter<T = any> = (message: BroadcastMessage<T>) => boolean;

export class BroadcastChannelManager {
  private static instance: BroadcastChannelManager;
  private channels: Map<string, BroadcastChannel> = new Map();
  private messageHandlers: Map<string, Set<MessageHandler>> = new Map();
  private errorHandlers: Map<string, Set<ErrorHandler>> = new Map();
  private messageFilters: Map<string, Set<MessageFilter>> = new Map();
  private sourceId: string;

  private constructor() {
    this.sourceId = this.generateSourceId();
  }

  static getInstance(): BroadcastChannelManager {
    if (!BroadcastChannelManager.instance) {
      BroadcastChannelManager.instance = new BroadcastChannelManager();
    }
    return BroadcastChannelManager.instance;
  }

  // Create or get channel
  getChannel(name: string): BroadcastChannel {
    if (!this.channels.has(name)) {
      const channel = new BroadcastChannel(name);
      this.channels.set(name, channel);
      this.messageHandlers.set(name, new Set());
      this.errorHandlers.set(name, new Set());
      this.messageFilters.set(name, new Set());
      this.setupChannelEventListeners(channel, name);
    }
    return this.channels.get(name)!;
  }

  // Send message through channel
  sendMessage<T = any>(
    channelName: string,
    message: Omit<BroadcastMessage<T>, 'timestamp' | 'source'>
  ): void {
    const channel = this.getChannel(channelName);
    const fullMessage: BroadcastMessage<T> = {
      ...message,
      timestamp: Date.now(),
      source: this.sourceId
    };
    channel.postMessage(fullMessage);
  }

  // Add message handler
  onMessage<T = any>(
    channelName: string,
    handler: MessageHandler<T>
  ): () => void {
    const handlers = this.messageHandlers.get(channelName);
    if (handlers) {
      handlers.add(handler);
      return () => {
        handlers.delete(handler);
      };
    }
    return () => {};
  }

  // Add error handler
  onError(
    channelName: string,
    handler: ErrorHandler
  ): () => void {
    const handlers = this.errorHandlers.get(channelName);
    if (handlers) {
      handlers.add(handler);
      return () => {
        handlers.delete(handler);
      };
    }
    return () => {};
  }

  // Add message filter
  addMessageFilter<T = any>(
    channelName: string,
    filter: MessageFilter<T>
  ): () => void {
    const filters = this.messageFilters.get(channelName);
    if (filters) {
      filters.add(filter);
      return () => {
        filters.delete(filter);
      };
    }
    return () => {};
  }

  // Close specific channel
  closeChannel(channelName: string): void {
    const channel = this.channels.get(channelName);
    if (channel) {
      channel.close();
      this.cleanup(channelName);
    }
  }

  // Close all channels
  closeAll(): void {
    this.channels.forEach((channel, name) => {
      channel.close();
      this.cleanup(name);
    });
  }

  // Check if Broadcast Channel API is supported
  static isSupported(): boolean {
    return typeof BroadcastChannel !== 'undefined';
  }

  // Get all active channel names
  getActiveChannels(): string[] {
    return Array.from(this.channels.keys());
  }

  // Check if a channel exists
  hasChannel(name: string): boolean {
    return this.channels.has(name);
  }

  // Get number of handlers for a channel
  getHandlerCount(channelName: string): number {
    return this.messageHandlers.get(channelName)?.size ?? 0;
  }

  // Private methods
  private setupChannelEventListeners(
    channel: BroadcastChannel,
    channelName: string
  ): void {
    channel.onmessage = (event) => {
      const message = event.data as BroadcastMessage;
      const handlers = this.messageHandlers.get(channelName);
      const filters = this.messageFilters.get(channelName);

      if (handlers && filters) {
        // Check if message passes all filters
        const passesFilters = Array.from(filters).every(filter => filter(message));

        if (passesFilters) {
          handlers.forEach(handler => {
            try {
              handler(message);
            } catch (error) {
              console.error('Error in message handler:', error);
            }
          });
        }
      }
    };

    channel.onmessageerror = (event) => {
      const handlers = this.errorHandlers.get(channelName);
      if (handlers) {
        handlers.forEach(handler => {
          try {
            handler(event);
          } catch (error) {
            console.error('Error in error handler:', error);
          }
        });
      }
    };
  }

  private generateSourceId(): string {
    return `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private cleanup(channelName: string): void {
    this.channels.delete(channelName);
    this.messageHandlers.delete(channelName);
    this.errorHandlers.delete(channelName);
    this.messageFilters.delete(channelName);
  }
}

// Example usage:
/*
// Create broadcast channel manager instance
const bcManager = BroadcastChannelManager.getInstance();

// Check if Broadcast Channel API is supported
if (BroadcastChannelManager.isSupported()) {
  // Add message filter to exclude messages from self
  const unsubscribeFilter = bcManager.addMessageFilter('app-channel', (message) => {
    return message.source !== bcManager.sourceId;
  });

  // Add message handler
  const unsubscribeMessage = bcManager.onMessage('app-channel', (message) => {
    console.log('Received message:', message);
    switch (message.type) {
      case 'USER_ACTION':
        handleUserAction(message.data);
        break;
      case 'STATE_UPDATE':
        updateAppState(message.data);
        break;
    }
  });

  // Add error handler
  const unsubscribeError = bcManager.onError('app-channel', (error) => {
    console.error('Channel error:', error);
  });

  // Send message
  bcManager.sendMessage('app-channel', {
    type: 'USER_ACTION',
    data: {
      action: 'click',
      target: 'button-1'
    }
  });

  // Later: cleanup
  unsubscribeFilter();
  unsubscribeMessage();
  unsubscribeError();

  // Close specific channel
  bcManager.closeChannel('app-channel');

  // Or close all channels
  bcManager.closeAll();
}
*/