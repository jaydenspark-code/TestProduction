import { captureError } from './sentry';

export interface ApiError extends Error {
  code?: string;
  status?: number;
  data?: any;
}

export class NetworkError extends Error implements ApiError {
  code: string;
  status: number;
  data?: any;

  constructor(message: string, status: number = 500, code: string = 'NETWORK_ERROR') {
    super(message);
    this.name = 'NetworkError';
    this.code = code;
    this.status = status;
  }
}

export class ValidationError extends Error implements ApiError {
  code: string;
  data: Record<string, string[]>;

  constructor(message: string, validationErrors: Record<string, string[]>) {
    super(message);
    this.name = 'ValidationError';
    this.code = 'VALIDATION_ERROR';
    this.data = validationErrors;
  }
}

export function handleApiError(error: any, context?: Record<string, any>): ApiError {
  let apiError: ApiError;

  if (error instanceof NetworkError || error instanceof ValidationError) {
    apiError = error;
  } else if (error?.response) {
    // Axios-like error object
    apiError = new NetworkError(
      error.response.data?.message || 'An unexpected error occurred',
      error.response.status,
      error.response.data?.code
    );
    apiError.data = error.response.data;
  } else if (error instanceof Error) {
    apiError = error;
  } else {
    apiError = new Error('An unexpected error occurred');
  }

  // Log to Sentry in production
  captureError(apiError, context);

  return apiError;
}

export function isNetworkError(error: any): error is NetworkError {
  return error instanceof NetworkError;
}

export function isValidationError(error: any): error is ValidationError {
  return error instanceof ValidationError;
}

export function getErrorMessage(error: ApiError): string {
  if (isValidationError(error)) {
    return Object.values(error.data)
      .flat()
      .join(', ');
  }

  return error.message;
}