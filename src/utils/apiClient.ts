import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { NetworkError, handleApiError } from './errorHandling';

interface RetryConfig {
  retries: number;
  retryDelay: number;
  retryStatusCodes: number[];
}

interface ApiClientConfig extends AxiosRequestConfig {
  retry?: Partial<RetryConfig>;
}

const defaultRetryConfig: RetryConfig = {
  retries: 3,
  retryDelay: 1000,
  retryStatusCodes: [408, 429, 500, 502, 503, 504],
};

export class ApiClient {
  private client: AxiosInstance;
  private retryConfig: RetryConfig;

  constructor(config: ApiClientConfig = {}) {
    this.retryConfig = { ...defaultRetryConfig, ...config.retry };
    this.client = axios.create(config);

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor for adding auth headers, etc.
    this.client.interceptors.request.use(
      (config) => {
        // Add any request modifications here
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for handling errors
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const config = error.config as ApiClientConfig & { _retry?: number };

        // Initialize retry count
        if (config._retry === undefined) {
          config._retry = 0;
        }

        // Check if we should retry the request
        if (
          config._retry < this.retryConfig.retries &&
          error.response &&
          this.retryConfig.retryStatusCodes.includes(error.response.status)
        ) {
          config._retry++;

          // Wait before retrying
          await new Promise((resolve) =>
            setTimeout(resolve, this.retryConfig.retryDelay * config._retry)
          );

          return this.client(config);
        }

        return Promise.reject(error);
      }
    );
  }

  public async request<T = any>(
    config: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    try {
      return await this.client.request<T>(config);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  public async get<T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.request<T>({ ...config, method: 'GET', url });
    return response.data;
  }

  public async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.request<T>({ ...config, method: 'POST', url, data });
    return response.data;
  }

  public async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.request<T>({ ...config, method: 'PUT', url, data });
    return response.data;
  }

  public async delete<T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.request<T>({ ...config, method: 'DELETE', url });
    return response.data;
  }
}

// Create and export a default instance
export const apiClient = new ApiClient({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  retry: {
    retries: 3,
    retryDelay: 1000,
    retryStatusCodes: [408, 429, 500, 502, 503, 504],
  },
});