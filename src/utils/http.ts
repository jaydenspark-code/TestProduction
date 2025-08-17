import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, CancelTokenSource } from 'axios';
import { Storage } from './storage';

interface CacheConfig {
  enabled: boolean;
  ttl: number; // Time to live in milliseconds
  key?: string;
}

interface RetryConfig {
  attempts: number;
  delay: number; // Delay between retries in milliseconds
  shouldRetry?: (error: any) => boolean;
}

interface RequestConfig extends AxiosRequestConfig {
  cache?: CacheConfig;
  retry?: RetryConfig;
}

interface PendingRequest {
  source: CancelTokenSource;
  timestamp: number;
}

class HttpError extends Error {
  constructor(
    message: string,
    public status?: number,
    public data?: any
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export class Http {
  private static instance: Http;
  private client: AxiosInstance;
  private pendingRequests: Map<string, PendingRequest> = new Map();

  private constructor() {
    this.client = axios.create({
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.setupInterceptors();
  }

  static getInstance(): Http {
    if (!Http.instance) {
      Http.instance = new Http();
    }
    return Http.instance;
  }

  private setupInterceptors(): void {
    this.client.interceptors.request.use(
      (config) => {
        if (config.cancelToken) {
          const key = this.getRequestKey(config);
          const source = axios.CancelToken.source();
          config.cancelToken = source.token;

          // Cancel previous pending request with the same key
          this.cancelPendingRequest(key);

          this.pendingRequests.set(key, {
            source,
            timestamp: Date.now()
          });
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => {
        const key = this.getRequestKey(response.config);
        this.pendingRequests.delete(key);
        return response;
      },
      (error) => {
        if (axios.isCancel(error)) {
          return Promise.reject(new HttpError('Request cancelled', 499));
        }

        const key = this.getRequestKey(error.config);
        this.pendingRequests.delete(key);

        if (error.response) {
          return Promise.reject(
            new HttpError(
              error.response.data?.message || error.message,
              error.response.status,
              error.response.data
            )
          );
        }

        return Promise.reject(
          new HttpError(error.message || 'Network Error', 0)
        );
      }
    );
  }

  private getRequestKey(config: AxiosRequestConfig): string {
    return `${config.method}-${config.url}-${JSON.stringify(config.params)}-${JSON.stringify(config.data)}`;
  }

  private getCacheKey(config: RequestConfig): string {
    return config.cache?.key ||
      `${config.method}-${config.url}-${JSON.stringify(config.params)}`;
  }

  private cancelPendingRequest(key: string): void {
    const pending = this.pendingRequests.get(key);
    if (pending) {
      pending.source.cancel();
      this.pendingRequests.delete(key);
    }
  }

  private async handleCache<T>(
    config: RequestConfig,
    makeRequest: () => Promise<AxiosResponse<T>>
  ): Promise<AxiosResponse<T>> {
    if (!config.cache?.enabled) {
      return makeRequest();
    }

    const cacheKey = this.getCacheKey(config);
    const cached = Storage.get<AxiosResponse<T>>(cacheKey);

    if (cached) {
      return cached;
    }

    const response = await makeRequest();
    Storage.set(cacheKey, response, {
      expires: config.cache.ttl
    });

    return response;
  }

  private async handleRetry<T>(
    config: RequestConfig,
    makeRequest: () => Promise<AxiosResponse<T>>
  ): Promise<AxiosResponse<T>> {
    const retry = config.retry || { attempts: 0, delay: 1000 };
    let lastError: any;

    for (let attempt = 0; attempt <= retry.attempts; attempt++) {
      try {
        return await makeRequest();
      } catch (error) {
        lastError = error;

        if (
          attempt === retry.attempts ||
          (retry.shouldRetry && !retry.shouldRetry(error))
        ) {
          break;
        }

        await new Promise((resolve) =>
          setTimeout(resolve, retry.delay * Math.pow(2, attempt))
        );
      }
    }

    throw lastError;
  }

  async request<T = any>(config: RequestConfig): Promise<T> {
    const makeRequest = () => this.client.request<T>(config);

    try {
      const response = await this.handleCache<T>(
        config,
        () => this.handleRetry<T>(config, makeRequest)
      );
      return response.data;
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }
      throw new HttpError(
        error.message || 'Request failed',
        error.status
      );
    }
  }

  async get<T = any>(
    url: string,
    config: RequestConfig = {}
  ): Promise<T> {
    return this.request<T>({ ...config, method: 'GET', url });
  }

  async post<T = any>(
    url: string,
    data?: any,
    config: RequestConfig = {}
  ): Promise<T> {
    return this.request<T>({ ...config, method: 'POST', url, data });
  }

  async put<T = any>(
    url: string,
    data?: any,
    config: RequestConfig = {}
  ): Promise<T> {
    return this.request<T>({ ...config, method: 'PUT', url, data });
  }

  async delete<T = any>(
    url: string,
    config: RequestConfig = {}
  ): Promise<T> {
    return this.request<T>({ ...config, method: 'DELETE', url });
  }

  async patch<T = any>(
    url: string,
    data?: any,
    config: RequestConfig = {}
  ): Promise<T> {
    return this.request<T>({ ...config, method: 'PATCH', url, data });
  }

  cancelAll(): void {
    for (const [key, request] of this.pendingRequests) {
      request.source.cancel();
      this.pendingRequests.delete(key);
    }
  }
}

// Example usage:
/*
// Get the singleton instance
const http = Http.getInstance();

// GET request with caching
const getUser = async (id: string) => {
  return http.get(`/api/users/${id}`, {
    cache: {
      enabled: true,
      ttl: 5 * 60 * 1000 // 5 minutes
    }
  });
};

// POST request with retry
const createUser = async (userData: any) => {
  return http.post('/api/users', userData, {
    retry: {
      attempts: 3,
      delay: 1000,
      shouldRetry: (error) => error.status >= 500
    }
  });
};

// Cancel all pending requests
http.cancelAll();
*/