import toast from 'react-hot-toast';
import { ApiError, isValidationError, getErrorMessage } from './errorHandling';

interface ToastOptions {
  duration?: number;
  position?: 'top-right' | 'top-center' | 'top-left' | 'bottom-right' | 'bottom-center' | 'bottom-left';
}

const defaultOptions: ToastOptions = {
  duration: 4000,
  position: 'top-right',
};

export const showToast = {
  success: (message: string, options: ToastOptions = {}) => {
    toast.success(message, {
      ...defaultOptions,
      ...options,
      className: 'bg-green-50 dark:bg-green-900',
    });
  },

  error: (error: Error | ApiError | string, options: ToastOptions = {}) => {
    const message = typeof error === 'string' ? error : getErrorMessage(error as ApiError);
    
    toast.error(message, {
      ...defaultOptions,
      ...options,
      duration: isValidationError(error) ? 6000 : defaultOptions.duration,
      className: 'bg-red-50 dark:bg-red-900',
    });
  },

  info: (message: string, options: ToastOptions = {}) => {
    toast(message, {
      ...defaultOptions,
      ...options,
      className: 'bg-blue-50 dark:bg-blue-900',
    });
  },

  warning: (message: string, options: ToastOptions = {}) => {
    toast(message, {
      ...defaultOptions,
      ...options,
      icon: '⚠️',
      className: 'bg-yellow-50 dark:bg-yellow-900',
    });
  },

  promise: <T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    },
    options: ToastOptions = {}
  ) => {
    return toast.promise(
      promise,
      {
        loading: messages.loading,
        success: messages.success,
        error: (err) => {
          const error = err as Error | ApiError;
          return typeof error === 'string' ? error : getErrorMessage(error as ApiError);
        },
      },
      {
        ...defaultOptions,
        ...options,
      }
    );
  },
};