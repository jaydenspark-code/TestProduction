import { captureError } from './sentry';

export enum ErrorType {
  VALIDATION = 'VALIDATION_ERROR',
  AUTHENTICATION = 'AUTHENTICATION_ERROR',
  AUTHORIZATION = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND_ERROR',
  NETWORK = 'NETWORK_ERROR',
  API = 'API_ERROR',
  DATABASE = 'DATABASE_ERROR',
  RATE_LIMIT = 'RATE_LIMIT_ERROR',
  TIMEOUT = 'TIMEOUT_ERROR',
  UNKNOWN = 'UNKNOWN_ERROR'
}

export interface ErrorContext {
  code?: string;
  details?: Record<string, any>;
  source?: string;
  timestamp?: number;
}

export interface ErrorOptions extends ErrorContext {
  cause?: Error;
  shouldReport?: boolean;
}

export class AppError extends Error {
  readonly type: ErrorType;
  readonly code?: string;
  readonly details?: Record<string, any>;
  readonly source?: string;
  readonly timestamp: number;
  readonly cause?: Error;

  constructor(
    type: ErrorType,
    message: string,
    options: ErrorOptions = {}
  ) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.code = options.code;
    this.details = options.details;
    this.source = options.source;
    this.timestamp = options.timestamp || Date.now();
    this.cause = options.cause;

    if (options.shouldReport !== false) {
      this.report();
    }

    // Maintains proper stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  report(): void {
    captureError(this, {
      extra: {
        type: this.type,
        code: this.code,
        details: this.details,
        source: this.source,
        timestamp: this.timestamp,
        cause: this.cause?.message
      }
    });
  }

  toJSON(): Record<string, any> {
    return {
      name: this.name,
      type: this.type,
      message: this.message,
      code: this.code,
      details: this.details,
      source: this.source,
      timestamp: this.timestamp,
      stack: this.stack
    };
  }
}

export class ValidationError extends AppError {
  constructor(message: string, options?: ErrorOptions) {
    super(ErrorType.VALIDATION, message, options);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string, options?: ErrorOptions) {
    super(ErrorType.AUTHENTICATION, message, options);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string, options?: ErrorOptions) {
    super(ErrorType.AUTHORIZATION, message, options);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string, options?: ErrorOptions) {
    super(ErrorType.NOT_FOUND, message, options);
    this.name = 'NotFoundError';
  }
}

export class NetworkError extends AppError {
  constructor(message: string, options?: ErrorOptions) {
    super(ErrorType.NETWORK, message, options);
    this.name = 'NetworkError';
  }
}

export class ApiError extends AppError {
  constructor(message: string, options?: ErrorOptions) {
    super(ErrorType.API, message, options);
    this.name = 'ApiError';
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, options?: ErrorOptions) {
    super(ErrorType.DATABASE, message, options);
    this.name = 'DatabaseError';
  }
}

export class RateLimitError extends AppError {
  constructor(message: string, options?: ErrorOptions) {
    super(ErrorType.RATE_LIMIT, message, options);
    this.name = 'RateLimitError';
  }
}

export class TimeoutError extends AppError {
  constructor(message: string, options?: ErrorOptions) {
    super(ErrorType.TIMEOUT, message, options);
    this.name = 'TimeoutError';
  }
}

export function isAppError(error: any): error is AppError {
  return error instanceof AppError;
}

export function handleError(error: any): AppError {
  if (isAppError(error)) {
    return error;
  }

  // Handle common error types
  if (error instanceof TypeError) {
    return new AppError(ErrorType.UNKNOWN, error.message, {
      cause: error,
      source: 'TypeError'
    });
  }

  if (error instanceof ReferenceError) {
    return new AppError(ErrorType.UNKNOWN, error.message, {
      cause: error,
      source: 'ReferenceError'
    });
  }

  // Handle unknown errors
  return new AppError(
    ErrorType.UNKNOWN,
    error?.message || 'An unknown error occurred',
    {
      cause: error instanceof Error ? error : undefined,
      source: error?.constructor?.name
    }
  );
}

// Example usage:
/*
// Create specific error types
try {
  throw new ValidationError('Invalid input', {
    code: 'INVALID_EMAIL',
    details: { field: 'email' }
  });
} catch (error) {
  const appError = handleError(error);
  console.error(appError.toJSON());
}

// Handle unknown errors
try {
  throw new Error('Something went wrong');
} catch (error) {
  const appError = handleError(error);
  console.error(appError.toJSON());
}

// Create error with cause
try {
  throw new NetworkError('Failed to fetch data', {
    cause: new Error('Network timeout'),
    details: { url: '/api/data' }
  });
} catch (error) {
  const appError = handleError(error);
  console.error(appError.toJSON());
}
*/