type WorkerOptions = {
  name?: string;
  type?: WorkerType;
  credentials?: RequestCredentials;
};

type MessageHandler<T = any> = (data: T, event: MessageEvent) => void | Promise<void>;
type ErrorHandler = (error: ErrorEvent) => void;
type MessagePortHandler = (port: MessagePort) => void;

type WorkerMessage<T = any> = {
  type: string;
  data?: T;
  transfer?: Transferable[];
};

export class WorkerManager {
  private static instance: WorkerManager;
  private workers: Map<string, Worker> = new Map();
  private messageHandlers: Map<string, Set<MessageHandler>> = new Map();
  private errorHandlers: Map<string, Set<ErrorHandler>> = new Map();
  private messagePortHandlers: Map<string, Set<MessagePortHandler>> = new Map();

  private constructor() {}

  static getInstance(): WorkerManager {
    if (!WorkerManager.instance) {
      WorkerManager.instance = new WorkerManager();
    }
    return WorkerManager.instance;
  }

  // Create a new worker
  createWorker(
    scriptUrl: string | URL,
    options: WorkerOptions = {}
  ): Worker {
    const worker = new Worker(scriptUrl, {
      name: options.name,
      type: options.type,
      credentials: options.credentials
    });

    const workerId = this.generateWorkerId();
    this.workers.set(workerId, worker);

    // Initialize handler sets
    this.messageHandlers.set(workerId, new Set());
    this.errorHandlers.set(workerId, new Set());
    this.messagePortHandlers.set(workerId, new Set());

    // Setup default event listeners
    this.setupWorkerEventListeners(worker, workerId);

    return worker;
  }

  // Send message to worker
  sendMessage<T = any>(
    worker: Worker,
    message: WorkerMessage<T>
  ): void {
    const { type, data, transfer } = message;
    const payload = { type, data };

    if (transfer) {
      worker.postMessage(payload, transfer);
    } else {
      worker.postMessage(payload);
    }
  }

  // Add message handler
  onMessage<T = any>(
    worker: Worker,
    handler: MessageHandler<T>
  ): () => void {
    const workerId = this.getWorkerId(worker);
    if (!workerId) return () => {};

    const handlers = this.messageHandlers.get(workerId)!;
    handlers.add(handler);

    return () => {
      handlers.delete(handler);
    };
  }

  // Add error handler
  onError(
    worker: Worker,
    handler: ErrorHandler
  ): () => void {
    const workerId = this.getWorkerId(worker);
    if (!workerId) return () => {};

    const handlers = this.errorHandlers.get(workerId)!;
    handlers.add(handler);

    return () => {
      handlers.delete(handler);
    };
  }

  // Add message port handler
  onMessagePort(
    worker: Worker,
    handler: MessagePortHandler
  ): () => void {
    const workerId = this.getWorkerId(worker);
    if (!workerId) return () => {};

    const handlers = this.messagePortHandlers.get(workerId)!;
    handlers.add(handler);

    return () => {
      handlers.delete(handler);
    };
  }

  // Terminate worker
  terminateWorker(worker: Worker): void {
    const workerId = this.getWorkerId(worker);
    if (!workerId) return;

    worker.terminate();
    this.cleanup(workerId);
  }

  // Terminate all workers
  terminateAll(): void {
    this.workers.forEach((worker, workerId) => {
      worker.terminate();
      this.cleanup(workerId);
    });
  }

  // Check if worker is supported
  static isSupported(): boolean {
    return typeof Worker !== 'undefined';
  }

  // Private methods
  private setupWorkerEventListeners(worker: Worker, workerId: string): void {
    worker.onmessage = (event) => {
      const handlers = this.messageHandlers.get(workerId);
      if (handlers) {
        handlers.forEach(handler => {
          try {
            handler(event.data, event);
          } catch (error) {
            console.error('Error in message handler:', error);
          }
        });
      }
    };

    worker.onerror = (event) => {
      const handlers = this.errorHandlers.get(workerId);
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

    worker.onmessageerror = (event) => {
      console.error('Worker message error:', event);
    };
  }

  private generateWorkerId(): string {
    return `worker-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private getWorkerId(worker: Worker): string | undefined {
    for (const [id, w] of this.workers) {
      if (w === worker) return id;
    }
    return undefined;
  }

  private cleanup(workerId: string): void {
    this.workers.delete(workerId);
    this.messageHandlers.delete(workerId);
    this.errorHandlers.delete(workerId);
    this.messagePortHandlers.delete(workerId);
  }
}

// Example usage:
/*
// Create worker manager instance
const workerManager = WorkerManager.getInstance();

// Check if Web Workers are supported
if (WorkerManager.isSupported()) {
  // Create a new worker
  const worker = workerManager.createWorker('worker.js', {
    name: 'MyWorker',
    type: 'module'
  });

  // Add message handler
  const unsubscribeMessage = workerManager.onMessage(worker, (data, event) => {
    console.log('Received message from worker:', data);
  });

  // Add error handler
  const unsubscribeError = workerManager.onError(worker, (error) => {
    console.error('Worker error:', error);
  });

  // Send message to worker
  workerManager.sendMessage(worker, {
    type: 'PROCESS_DATA',
    data: {
      items: [1, 2, 3, 4, 5]
    }
  });

  // Send message with transferable objects
  const arrayBuffer = new ArrayBuffer(1024);
  workerManager.sendMessage(worker, {
    type: 'PROCESS_BUFFER',
    data: arrayBuffer,
    transfer: [arrayBuffer]
  });

  // Later: cleanup handlers
  unsubscribeMessage();
  unsubscribeError();

  // Terminate specific worker
  workerManager.terminateWorker(worker);

  // Or terminate all workers
  workerManager.terminateAll();
}

// Example worker.js:
/*
self.onmessage = (event) => {
  const { type, data } = event.data;

  switch (type) {
    case 'PROCESS_DATA':
      const result = data.items.map(x => x * 2);
      self.postMessage({
        type: 'PROCESS_COMPLETE',
        data: result
      });
      break;

    case 'PROCESS_BUFFER':
      // Process ArrayBuffer
      const view = new Uint8Array(data);
      // ... process data ...
      self.postMessage({
        type: 'BUFFER_PROCESSED',
        data: view.buffer
      }, [view.buffer]);
      break;

    default:
      console.warn('Unknown message type:', type);
  }
};

self.onerror = (error) => {
  console.error('Worker error:', error);
};
*/