import { useState, useCallback } from 'react';
import { AxiosRequestConfig } from 'axios';
import { apiClient } from '../utils/apiClient';
import { showToast } from '../utils/toast';
import { ApiError, handleApiError } from '../utils/errorHandling';

interface UseApiOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: ApiError) => void;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
  successMessage?: string;
}

interface ApiState<T> {
  data: T | null;
  error: ApiError | null;
  isLoading: boolean;
}

export function useApi<T>(
  requestConfig: AxiosRequestConfig | (() => AxiosRequestConfig),
  options: UseApiOptions<T> = {}
) {
  const [
    { data, error, isLoading },
    setState
  ] = useState<ApiState<T>>({
    data: null,
    error: null,
    isLoading: false
  });

  const execute = useCallback(
    async (params?: Record<string, any>) => {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        const config = typeof requestConfig === 'function'
          ? requestConfig()
          : { ...requestConfig };

        if (params) {
          if (config.method?.toUpperCase() === 'GET') {
            config.params = { ...config.params, ...params };
          } else {
            config.data = { ...config.data, ...params };
          }
        }

        const response = await apiClient.request<T>(config);
        const responseData = response.data;

        setState({
          data: responseData,
          error: null,
          isLoading: false
        });

        if (options.showSuccessToast) {
          showToast.success(
            options.successMessage || 'Operation completed successfully'
          );
        }

        options.onSuccess?.(responseData);
        return responseData;
      } catch (err) {
        const error = handleApiError(err);

        setState({
          data: null,
          error,
          isLoading: false
        });

        if (options.showErrorToast !== false) {
          showToast.error(error);
        }

        options.onError?.(error);
        throw error;
      }
    },
    [requestConfig, options]
  );

  const reset = useCallback(() => {
    setState({
      data: null,
      error: null,
      isLoading: false
    });
  }, []);

  return {
    data,
    error,
    isLoading,
    execute,
    reset
  };
}

// Convenience hooks for common HTTP methods
export function useGet<T>(
  url: string,
  config?: Omit<AxiosRequestConfig, 'url' | 'method'>,
  options?: UseApiOptions<T>
) {
  return useApi<T>({ ...config, url, method: 'GET' }, options);
}

export function usePost<T>(
  url: string,
  config?: Omit<AxiosRequestConfig, 'url' | 'method'>,
  options?: UseApiOptions<T>
) {
  return useApi<T>({ ...config, url, method: 'POST' }, options);
}

export function usePut<T>(
  url: string,
  config?: Omit<AxiosRequestConfig, 'url' | 'method'>,
  options?: UseApiOptions<T>
) {
  return useApi<T>({ ...config, url, method: 'PUT' }, options);
}

export function useDelete<T>(
  url: string,
  config?: Omit<AxiosRequestConfig, 'url' | 'method'>,
  options?: UseApiOptions<T>
) {
  return useApi<T>({ ...config, url, method: 'DELETE' }, options);
}