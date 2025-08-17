import { useState, useCallback } from 'react';
import { ApiError, handleApiError } from '../utils/errorHandling';

interface AsyncOperationState<T> {
  data: T | null;
  error: ApiError | null;
  isLoading: boolean;
}

interface UseAsyncOperationOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: ApiError) => void;
  errorContext?: Record<string, any>;
}

export function useAsyncOperation<T>(
  asyncFn: (...args: any[]) => Promise<T>,
  options: UseAsyncOperationOptions = {}
) {
  const [state, setState] = useState<AsyncOperationState<T>>({
    data: null,
    error: null,
    isLoading: false,
  });

  const execute = useCallback(
    async (...args: any[]) => {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));
        const result = await asyncFn(...args);
        setState({ data: result, error: null, isLoading: false });
        options.onSuccess?.(result);
        return result;
      } catch (error) {
        const handledError = handleApiError(error, options.errorContext);
        setState({ data: null, error: handledError, isLoading: false });
        options.onError?.(handledError);
        throw handledError;
      }
    },
    [asyncFn, options.onSuccess, options.onError, options.errorContext]
  );

  const reset = useCallback(() => {
    setState({ data: null, error: null, isLoading: false });
  }, []);

  return {
    execute,
    reset,
    ...state,
  };
}