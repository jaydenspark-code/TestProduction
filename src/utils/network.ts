type RequestConfig = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  credentials?: RequestCredentials;
  mode?: RequestMode;
  cache?: RequestCache;
  redirect?: RequestRedirect;
  referrer?: string;
  referrerPolicy?: ReferrerPolicy;
  integrity?: string;
  keepalive?: boolean;
  signal?: AbortSignal;
  retry?: number;
  retryDelay?: number;
  onUploadProgress?: (progress: ProgressEvent) => void;
  onDownloadProgress?: (progress: ProgressEvent) => void;
};

type ResponseType = 'json' | 'text' | 'blob' | 'arrayBuffer' | 'formData';

type NetworkError = {
  message: string;
  status?: number;
  statusText?: string;
  url?: string;
  method?: string;
  timestamp: number;
};

type RequestInterceptor = (config: RequestConfig) => RequestConfig | Promise<RequestConfig>;
type ResponseInterceptor = (response: Response) => Response | Promise<Response>;
type ErrorInterceptor = (error: NetworkError) => void;

export class NetworkManager {
  private static instance: NetworkManager;
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];
  private errorInterceptors: ErrorInterceptor[] = [];
  private defaultConfig: RequestConfig = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    },
    timeout: 30000,
    retry: 0,
    retryDelay: 1000
  };

  private constructor() {}

  static getInstance(): NetworkManager {
    if (!NetworkManager.instance) {
      NetworkManager.instance = new NetworkManager();
    }
    return NetworkManager.instance;
  }

  // Set default config
  setDefaultConfig(config: RequestConfig): void {
    this.defaultConfig = { ...this.defaultConfig, ...config };
  }

  // Add request interceptor
  addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor);
  }

  // Add response interceptor
  addResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor);
  }

  // Add error interceptor
  addErrorInterceptor(interceptor: ErrorInterceptor): void {
    this.errorInterceptors.push(interceptor);
  }

  // Create abort controller
  createAbortController(): AbortController {
    return new AbortController();
  }

  // Handle network error
  private handleError(error: any, config: RequestConfig): NetworkError {
    const networkError: NetworkError = {
      message: error.message || 'Network error',
      timestamp: Date.now()
    };

    if (error instanceof Response) {
      networkError.status = error.status;
      networkError.statusText = error.statusText;
      networkError.url = error.url;
    }

    if (config.method) {
      networkError.method = config.method;
    }

    this.errorInterceptors.forEach(interceptor => interceptor(networkError));
    return networkError;
  }

  // Apply request interceptors
  private async applyRequestInterceptors(config: RequestConfig): Promise<RequestConfig> {
    let interceptedConfig = { ...config };
    for (const interceptor of this.requestInterceptors) {
      interceptedConfig = await interceptor(interceptedConfig);
    }
    return interceptedConfig;
  }

  // Apply response interceptors
  private async applyResponseInterceptors(response: Response): Promise<Response> {
    let interceptedResponse = response;
    for (const interceptor of this.responseInterceptors) {
      interceptedResponse = await interceptor(interceptedResponse);
    }
    return interceptedResponse;
  }

  // Create fetch request with timeout
  private async fetchWithTimeout(url: string, config: RequestConfig): Promise<Response> {
    const { timeout = this.defaultConfig.timeout } = config;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...config,
        signal: config.signal || controller.signal
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  // Retry request
  private async retryRequest(
    url: string,
    config: RequestConfig,
    retries: number
  ): Promise<Response> {
    try {
      const response = await this.fetchWithTimeout(url, config);
      if (!response.ok) throw response;
      return response;
    } catch (error) {
      if (retries > 0) {
        await new Promise(resolve => 
          setTimeout(resolve, config.retryDelay || this.defaultConfig.retryDelay)
        );
        return this.retryRequest(url, config, retries - 1);
      }
      throw error;
    }
  }

  // Make request
  async request<T>(
    url: string,
    config: RequestConfig = {},
    responseType: ResponseType = 'json'
  ): Promise<T> {
    const finalConfig = await this.applyRequestInterceptors({
      ...this.defaultConfig,
      ...config
    });

    try {
      const response = await this.retryRequest(
        url,
        finalConfig,
        finalConfig.retry || 0
      );
      const interceptedResponse = await this.applyResponseInterceptors(response);
      return await interceptedResponse[responseType]();
    } catch (error) {
      throw this.handleError(error, finalConfig);
    }
  }

  // GET request
  async get<T>(url: string, config: RequestConfig = {}): Promise<T> {
    return this.request<T>(url, { ...config, method: 'GET' });
  }

  // POST request
  async post<T>(url: string, data?: any, config: RequestConfig = {}): Promise<T> {
    return this.request<T>(url, {
      ...config,
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // PUT request
  async put<T>(url: string, data?: any, config: RequestConfig = {}): Promise<T> {
    return this.request<T>(url, {
      ...config,
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  // DELETE request
  async delete<T>(url: string, config: RequestConfig = {}): Promise<T> {
    return this.request<T>(url, { ...config, method: 'DELETE' });
  }

  // PATCH request
  async patch<T>(url: string, data?: any, config: RequestConfig = {}): Promise<T> {
    return this.request<T>(url, {
      ...config,
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  // Upload file
  async uploadFile(
    url: string,
    file: File,
    config: RequestConfig = {}
  ): Promise<Response> {
    const formData = new FormData();
    formData.append('file', file);

    return this.request(url, {
      ...config,
      method: 'POST',
      body: formData,
      headers: {
        ...config.headers,
        'Content-Type': 'multipart/form-data'
      }
    });
  }

  // Download file
  async downloadFile(url: string, filename: string): Promise<void> {
    const response = await this.request(url, {}, 'blob');
    const blob = new Blob([response]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  }

  // Check online status
  isOnline(): boolean {
    return navigator.onLine;
  }

  // Add online/offline listeners
  addConnectivityListeners(callbacks: {
    onOnline?: () => void;
    onOffline?: () => void;
  }): void {
    if (callbacks.onOnline) {
      window.addEventListener('online', callbacks.onOnline);
    }
    if (callbacks.onOffline) {
      window.addEventListener('offline', callbacks.onOffline);
    }
  }

  // Remove online/offline listeners
  removeConnectivityListeners(callbacks: {
    onOnline?: () => void;
    onOffline?: () => void;
  }): void {
    if (callbacks.onOnline) {
      window.removeEventListener('online', callbacks.onOnline);
    }
    if (callbacks.onOffline) {
      window.removeEventListener('offline', callbacks.onOffline);
    }
  }

  // Check if Fetch API is supported
  static isSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      'fetch' in window &&
      'AbortController' in window
    );
  }
}

// Example usage:
/*
// Create network manager instance
const networkManager = NetworkManager.getInstance();

// Set default config
networkManager.setDefaultConfig({
  headers: {
    'Authorization': 'Bearer token'
  },
  timeout: 5000,
  retry: 3
});

// Add request interceptor
networkManager.addRequestInterceptor(config => {
  // Add timestamp to request
  config.headers = {
    ...config.headers,
    'X-Timestamp': Date.now().toString()
  };
  return config;
});

// Add response interceptor
networkManager.addResponseInterceptor(response => {
  // Log response status
  console.log(`Response status: ${response.status}`);
  return response;
});

// Add error interceptor
networkManager.addErrorInterceptor(error => {
  console.error('Network error:', error);
});

// Make requests
const getData = async () => {
  try {
    // GET request
    const data = await networkManager.get('https://api.example.com/data');

    // POST request
    const response = await networkManager.post('https://api.example.com/create', {
      name: 'Example',
      value: 123
    });

    // Upload file
    const file = new File(['content'], 'example.txt');
    await networkManager.uploadFile('https://api.example.com/upload', file);

    // Download file
    await networkManager.downloadFile(
      'https://api.example.com/download',
      'example.pdf'
    );
  } catch (error) {
    console.error('Request failed:', error);
  }
};

// Add connectivity listeners
networkManager.addConnectivityListeners({
  onOnline: () => console.log('Back online'),
  onOffline: () => console.log('Connection lost')
});
*/