type PresentationOptions = {
  url?: string;
  controllerUrl?: string;
  receiverUrl?: string;
};

type PresentationState = {
  available: boolean;
  connected: boolean;
  presenting: boolean;
  connection: PresentationConnection | null;
};

type PresentationCallback = (state: PresentationState) => void;

export class PresentationManager {
  private static instance: PresentationManager;
  private state: PresentationState;
  private options: Required<PresentationOptions>;
  private onStateChangeCallbacks: Set<PresentationCallback>;
  private onErrorCallbacks: Set<(error: Error) => void>;
  private onMessageCallbacks: Set<(message: any) => void>;
  private onConnectionChangeCallbacks: Set<(connection: PresentationConnection) => void>;

  private constructor() {
    this.state = {
      available: false,
      connected: false,
      presenting: false,
      connection: null
    };

    this.options = {
      url: '',
      controllerUrl: '',
      receiverUrl: ''
    };

    this.onStateChangeCallbacks = new Set();
    this.onErrorCallbacks = new Set();
    this.onMessageCallbacks = new Set();
    this.onConnectionChangeCallbacks = new Set();

    this.checkAvailability();
  }

  static getInstance(): PresentationManager {
    if (!PresentationManager.instance) {
      PresentationManager.instance = new PresentationManager();
    }
    return PresentationManager.instance;
  }

  private updateState(newState: Partial<PresentationState>): void {
    this.state = { ...this.state, ...newState };
    this.notifyStateChange();
  }

  private notifyStateChange(): void {
    this.onStateChangeCallbacks.forEach(callback => callback(this.state));
  }

  private notifyError(error: Error): void {
    this.onErrorCallbacks.forEach(callback => callback(error));
  }

  private notifyMessage(message: any): void {
    this.onMessageCallbacks.forEach(callback => callback(message));
  }

  private notifyConnectionChange(connection: PresentationConnection): void {
    this.onConnectionChangeCallbacks.forEach(callback => callback(connection));
  }

  private checkAvailability(): void {
    const available = this.isSupported();
    this.updateState({ available });
  }

  private setupConnectionListeners(connection: PresentationConnection): void {
    connection.onconnect = () => {
      this.updateState({
        connected: true,
        connection
      });
      this.notifyConnectionChange(connection);
    };

    connection.onclose = () => {
      this.updateState({
        connected: false,
        connection: null
      });
    };

    connection.onterminate = () => {
      this.updateState({
        connected: false,
        presenting: false,
        connection: null
      });
    };

    connection.onmessage = (event) => {
      this.notifyMessage(event.data);
    };
  }

  setOptions(options: Partial<PresentationOptions>): void {
    this.options = { ...this.options, ...options };
  }

  async requestPresentation(): Promise<boolean> {
    if (!this.isSupported()) {
      throw new Error('Presentation API is not supported');
    }

    if (!this.options.url) {
      throw new Error('Presentation URL is required');
    }

    try {
      const request = new PresentationRequest([this.options.url]);
      const connection = await request.start();

      this.setupConnectionListeners(connection);
      this.updateState({ presenting: true });

      return true;
    } catch (error) {
      this.notifyError(error as Error);
      return false;
    }
  }

  async joinPresentation(): Promise<boolean> {
    if (!this.isSupported()) {
      throw new Error('Presentation API is not supported');
    }

    try {
      const connection = await (navigator as any).presentation.receiver.connectionList.then(
        (list: { connections: PresentationConnection[] }) => list.connections[0]
      );

      if (connection) {
        this.setupConnectionListeners(connection);
        return true;
      }

      return false;
    } catch (error) {
      this.notifyError(error as Error);
      return false;
    }
  }

  async sendMessage(message: any): Promise<boolean> {
    if (!this.state.connected || !this.state.connection) {
      return false;
    }

    try {
      this.state.connection.send(message);
      return true;
    } catch (error) {
      this.notifyError(error as Error);
      return false;
    }
  }

  async closeConnection(): Promise<void> {
    if (this.state.connection) {
      try {
        this.state.connection.close();
      } catch (error) {
        this.notifyError(error as Error);
      }
    }
  }

  async terminatePresentation(): Promise<void> {
    if (this.state.connection) {
      try {
        this.state.connection.terminate();
      } catch (error) {
        this.notifyError(error as Error);
      }
    }
  }

  isAvailable(): boolean {
    return this.state.available;
  }

  isConnected(): boolean {
    return this.state.connected;
  }

  isPresenting(): boolean {
    return this.state.presenting;
  }

  getConnection(): PresentationConnection | null {
    return this.state.connection;
  }

  onStateChange(callback: PresentationCallback): () => void {
    this.onStateChangeCallbacks.add(callback);

    // Return cleanup function
    return () => {
      this.onStateChangeCallbacks.delete(callback);
    };
  }

  onError(callback: (error: Error) => void): () => void {
    this.onErrorCallbacks.add(callback);

    // Return cleanup function
    return () => {
      this.onErrorCallbacks.delete(callback);
    };
  }

  onMessage(callback: (message: any) => void): () => void {
    this.onMessageCallbacks.add(callback);

    // Return cleanup function
    return () => {
      this.onMessageCallbacks.delete(callback);
    };
  }

  onConnectionChange(callback: (connection: PresentationConnection) => void): () => void {
    this.onConnectionChangeCallbacks.add(callback);

    // Return cleanup function
    return () => {
      this.onConnectionChangeCallbacks.delete(callback);
    };
  }

  cleanup(): void {
    this.terminatePresentation();
    this.onStateChangeCallbacks.clear();
    this.onErrorCallbacks.clear();
    this.onMessageCallbacks.clear();
    this.onConnectionChangeCallbacks.clear();
  }

  static isSupported(): boolean {
    return typeof window !== 'undefined' &&
      (('presentation' in navigator) ||
       ('PresentationRequest' in window));
  }
}

// Example usage:
/*
const presentation = PresentationManager.getInstance();

// Check if Presentation API is supported
console.log('Presentation API supported:', PresentationManager.isSupported());

// Set up state change listener
const stateCleanup = presentation.onStateChange(state => {
  console.log('Presentation state changed:', state);
});

// Set up error listener
const errorCleanup = presentation.onError(error => {
  console.error('Presentation error:', error);
});

// Set up message listener
const messageCleanup = presentation.onMessage(message => {
  console.log('Received message:', message);
});

// Set up connection change listener
const connectionCleanup = presentation.onConnectionChange(connection => {
  console.log('Connection changed:', connection);
});

// Configure presentation options
presentation.setOptions({
  url: 'https://example.com/presentation',
  controllerUrl: 'https://example.com/controller',
  receiverUrl: 'https://example.com/receiver'
});

// Start presentation
presentation.requestPresentation().then(success => {
  if (success) {
    console.log('Presentation started');

    // Send a message
    presentation.sendMessage({
      type: 'greeting',
      text: 'Hello from controller!'
    }).then(sent => {
      console.log('Message sent:', sent);
    });

    // Close after 5 seconds
    setTimeout(() => {
      presentation.closeConnection();
    }, 5000);
  }
});

// Clean up
stateCleanup(); // Remove state change listener
errorCleanup(); // Remove error listener
messageCleanup(); // Remove message listener
connectionCleanup(); // Remove connection change listener
presentation.cleanup(); // Full cleanup
*/