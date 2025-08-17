type WebSocketOptions = {
  protocols?: string | string[];
  reconnect?: boolean;
  maxReconnectAttempts?: number;
  reconnectInterval?: number;
  heartbeatInterval?: number;
  heartbeatMessage?: any;
};

type WebSocketMessage<T = any> = {
  type: string;
  data?: T;
  id?: string;
};

type MessageHandler<T = any> = (data: T) => void | Promise<void>;
type ErrorHandler = (error: Event) => void;
type StatusHandler = (status: WebSocketStatus) => void;

enum WebSocketStatus {
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  DISCONNECTED = 'DISCONNECTED',
  RECONNECTING = 'RECONNECTING',
  ERROR = 'ERROR'
}

export class WebSocketManager {
  private static instance: WebSocketManager;
  private socket: WebSocket | null = null;
  private url: string = '';
  private options: WebSocketOptions = {};
  private reconnectAttempts: number = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private messageHandlers: Map<string, Set<MessageHandler>> = new Map();
  private errorHandlers: Set<ErrorHandler> = new Set();
  private statusHandlers: Set<StatusHandler> = new Set();
  private pendingMessages: WebSocketMessage[] = [];

  private constructor() {}

  static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager();
    }
    return WebSocketManager.instance;
  }

  // Connect to WebSocket server
  connect(url: string, options: WebSocketOptions = {}): void {
    this.url = url;
    this.options = {
      reconnect: true,
      maxReconnectAttempts: 5,
      reconnectInterval: 3000,
      heartbeatInterval: 30000,
      heartbeatMessage: { type: 'ping' },
      ...options
    };

    this.createWebSocket();
  }

  // Send message through WebSocket
  send<T = any>(message: WebSocketMessage<T>): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    } else {
      this.pendingMessages.push(message);
    }
  }

  // Add message handler for specific message type
  onMessage<T = any>(
    type: string,
    handler: MessageHandler<T>
  ): () => void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, new Set());
    }

    const handlers = this.messageHandlers.get(type)!;
    handlers.add(handler);

    return () => {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.messageHandlers.delete(type);
      }
    };
  }

  // Add error handler
  onError(handler: ErrorHandler): () => void {
    this.errorHandlers.add(handler);
    return () => {
      this.errorHandlers.delete(handler);
    };
  }

  // Add status handler
  onStatus(handler: StatusHandler): () => void {
    this.statusHandlers.add(handler);
    return () => {
      this.statusHandlers.delete(handler);
    };
  }

  // Disconnect WebSocket
  disconnect(): void {
    this.clearTimers();
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.updateStatus(WebSocketStatus.DISCONNECTED);
  }

  // Get current connection status
  getStatus(): WebSocketStatus {
    if (!this.socket) return WebSocketStatus.DISCONNECTED;

    switch (this.socket.readyState) {
      case WebSocket.CONNECTING:
        return WebSocketStatus.CONNECTING;
      case WebSocket.OPEN:
        return WebSocketStatus.CONNECTED;
      case WebSocket.CLOSING:
      case WebSocket.CLOSED:
        return WebSocketStatus.DISCONNECTED;
      default:
        return WebSocketStatus.ERROR;
    }
  }

  // Check if WebSocket is supported
  static isSupported(): boolean {
    return typeof WebSocket !== 'undefined';
  }

  // Private methods
  private createWebSocket(): void {
    try {
      this.socket = new WebSocket(this.url, this.options.protocols);
      this.setupWebSocketEventListeners();
      this.updateStatus(WebSocketStatus.CONNECTING);
    } catch (error) {
      this.handleError(new Event('error'));
    }
  }

  private setupWebSocketEventListeners(): void {
    if (!this.socket) return;

    this.socket.onopen = () => {
      this.reconnectAttempts = 0;
      this.updateStatus(WebSocketStatus.CONNECTED);
      this.startHeartbeat();
      this.sendPendingMessages();
    };

    this.socket.onclose = () => {
      this.clearTimers();
      this.updateStatus(WebSocketStatus.DISCONNECTED);
      this.handleReconnect();
    };

    this.socket.onerror = (event) => {
      this.handleError(event);
    };

    this.socket.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
  }

  private handleMessage(message: WebSocketMessage): void {
    const handlers = this.messageHandlers.get(message.type);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(message.data);
        } catch (error) {
          console.error('Error in message handler:', error);
        }
      });
    }
  }

  private handleError(event: Event): void {
    this.updateStatus(WebSocketStatus.ERROR);
    this.errorHandlers.forEach(handler => {
      try {
        handler(event);
      } catch (error) {
        console.error('Error in error handler:', error);
      }
    });
  }

  private handleReconnect(): void {
    if (
      this.options.reconnect &&
      (!this.options.maxReconnectAttempts ||
        this.reconnectAttempts < this.options.maxReconnectAttempts)
    ) {
      this.updateStatus(WebSocketStatus.RECONNECTING);
      this.reconnectTimer = setTimeout(() => {
        this.reconnectAttempts++;
        this.createWebSocket();
      }, this.options.reconnectInterval);
    }
  }

  private startHeartbeat(): void {
    if (this.options.heartbeatInterval && this.options.heartbeatMessage) {
      this.heartbeatTimer = setInterval(() => {
        this.send(this.options.heartbeatMessage!);
      }, this.options.heartbeatInterval);
    }
  }

  private sendPendingMessages(): void {
    while (this.pendingMessages.length > 0) {
      const message = this.pendingMessages.shift();
      if (message) {
        this.send(message);
      }
    }
  }

  private updateStatus(status: WebSocketStatus): void {
    this.statusHandlers.forEach(handler => {
      try {
        handler(status);
      } catch (error) {
        console.error('Error in status handler:', error);
      }
    });
  }

  private clearTimers(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }
}

// Example usage:
/*
// Create WebSocket manager instance
const wsManager = WebSocketManager.getInstance();

// Check if WebSocket is supported
if (WebSocketManager.isSupported()) {
  // Add message handlers
  const unsubscribeUserMessage = wsManager.onMessage('USER_UPDATE', (data) => {
    console.log('Received user update:', data);
  });

  const unsubscribeSystemMessage = wsManager.onMessage('SYSTEM_NOTIFICATION', (data) => {
    console.log('Received system notification:', data);
  });

  // Add error handler
  const unsubscribeError = wsManager.onError((error) => {
    console.error('WebSocket error:', error);
  });

  // Add status handler
  const unsubscribeStatus = wsManager.onStatus((status) => {
    console.log('WebSocket status:', status);
    switch (status) {
      case WebSocketStatus.CONNECTED:
        // Handle connection established
        break;
      case WebSocketStatus.RECONNECTING:
        // Show reconnecting message
        break;
      case WebSocketStatus.ERROR:
        // Show error message
        break;
    }
  });

  // Connect to WebSocket server
  wsManager.connect('wss://api.example.com/ws', {
    protocols: ['v1'],
    reconnect: true,
    maxReconnectAttempts: 5,
    reconnectInterval: 3000,
    heartbeatInterval: 30000,
    heartbeatMessage: { type: 'ping' }
  });

  // Send message
  wsManager.send({
    type: 'CHAT_MESSAGE',
    data: {
      message: 'Hello, World!',
      timestamp: Date.now()
    },
    id: 'msg-1'
  });

  // Later: cleanup
  unsubscribeUserMessage();
  unsubscribeSystemMessage();
  unsubscribeError();
  unsubscribeStatus();

  // Disconnect
  wsManager.disconnect();
}
*/