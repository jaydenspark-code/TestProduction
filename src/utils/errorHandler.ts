export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
}

export class ErrorHandler {
  static createError(code: string, message: string, details?: any): AppError {
    return {
      code,
      message,
      details,
      timestamp: new Date()
    };
  }
  
  static logError(error: AppError | Error, context?: string): void {
    const errorInfo = error instanceof Error ? {
      code: 'UNKNOWN_ERROR',
      message: error.message,
      details: error.stack,
      timestamp: new Date()
    } : error;
    
    console.error(`[${context || 'APP'}] Error:`, errorInfo);
    
    // In production, send to monitoring service
    if (process.env.NODE_ENV === 'production') {
      // Send to error tracking service
    }
  }
  
  static handleAsyncError<T>(promise: Promise<T>, context?: string): Promise<T> {
    return promise.catch((error) => {
      this.logError(error, context);
      throw error;
    });
  }
}