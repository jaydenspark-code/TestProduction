import { useState, useCallback } from 'react';

type LoadingState = {
  [key: string]: boolean;
};

interface UseLoadingStateResult {
  isLoading: (key?: string) => boolean;
  startLoading: (key?: string) => void;
  stopLoading: (key?: string) => void;
  resetLoading: () => void;
  withLoading: <T>(
    key: string | undefined,
    fn: () => Promise<T>
  ) => Promise<T>;
}

export function useLoadingState(): UseLoadingStateResult {
  const [loadingState, setLoadingState] = useState<LoadingState>({});

  const isLoading = useCallback(
    (key?: string) => {
      if (key) {
        return !!loadingState[key];
      }
      return Object.values(loadingState).some(Boolean);
    },
    [loadingState]
  );

  const startLoading = useCallback((key?: string) => {
    setLoadingState(prev => ({
      ...prev,
      [key || 'global']: true
    }));
  }, []);

  const stopLoading = useCallback((key?: string) => {
    setLoadingState(prev => {
      const newState = { ...prev };
      delete newState[key || 'global'];
      return newState;
    });
  }, []);

  const resetLoading = useCallback(() => {
    setLoadingState({});
  }, []);

  const withLoading = useCallback(
    async <T,>(
      key: string | undefined,
      fn: () => Promise<T>
    ): Promise<T> => {
      try {
        startLoading(key);
        return await fn();
      } finally {
        stopLoading(key);
      }
    },
    [startLoading, stopLoading]
  );

  return {
    isLoading,
    startLoading,
    stopLoading,
    resetLoading,
    withLoading
  };
}

// Example usage:
/*
const Component = () => {
  const { isLoading, withLoading } = useLoadingState();

  const handleSubmit = async () => {
    try {
      await withLoading('submit', async () => {
        // Async operation here
      });
    } catch (error) {
      // Handle error
    }
  };

  return (
    <button
      disabled={isLoading('submit')}
      onClick={handleSubmit}
    >
      {isLoading('submit') ? 'Loading...' : 'Submit'}
    </button>
  );
};
*/