/**
 * Enhanced Error Handling Service for EarnPro
 * Provides user-friendly error messages and centralized error management
 */

import { showToast } from '../utils/toast';

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  timestamp?: Date;
  metadata?: Record<string, any>;
}

export interface UserFriendlyError {
  title: string;
  message: string;
  action?: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  showToUser: boolean;
  logToConsole: boolean;
  retryable: boolean;
}

class ErrorHandlingService {
  private static instance: ErrorHandlingService;
  private errorLog: Array<{ error: Error; context: ErrorContext; timestamp: Date }> = [];

  static getInstance(): ErrorHandlingService {
    if (!ErrorHandlingService.instance) {
      ErrorHandlingService.instance = new ErrorHandlingService();
    }
    return ErrorHandlingService.instance;
  }

  /**
   * Handle errors with user-friendly messages and appropriate actions
   */
  handleError(error: Error | string, context: ErrorContext = {}): UserFriendlyError {
    const errorObj = typeof error === 'string' ? new Error(error) : error;
    const timestamp = new Date();
    
    // Log the error
    this.logError(errorObj, { ...context, timestamp });
    
    // Convert to user-friendly error
    const userError = this.convertToUserFriendlyError(errorObj, context);
    
    // Show to user if appropriate
    if (userError.showToUser) {
      this.showErrorToUser(userError);
    }
    
    // Log to console if needed
    if (userError.logToConsole) {
      this.logToConsole(errorObj, context, userError);
    }
    
    return userError;
  }

  /**
   * Handle AI-specific errors with specialized messages
   */
  handleAIError(error: Error | string, context: ErrorContext = {}): UserFriendlyError {
    const aiContext = {
      ...context,
      component: context.component || 'AI System',
      action: context.action || 'AI Operation'
    };
    
    return this.handleError(error, aiContext);
  }

  /**
   * Handle payment-related errors
   */
  handlePaymentError(error: Error | string, context: ErrorContext = {}): UserFriendlyError {
    const paymentContext = {
      ...context,
      component: context.component || 'Payment System',
      action: context.action || 'Payment Operation'
    };
    
    return this.handleError(error, paymentContext);
  }

  /**
   * Handle database/API errors
   */
  handleDatabaseError(error: Error | string, context: ErrorContext = {}): UserFriendlyError {
    const dbContext = {
      ...context,
      component: context.component || 'Database',
      action: context.action || 'Database Operation'
    };
    
    return this.handleError(error, dbContext);
  }

  /**
   * Convert technical errors to user-friendly messages
   */
  private convertToUserFriendlyError(error: Error, context: ErrorContext): UserFriendlyError {
    const errorMessage = error.message.toLowerCase();
    
    // AI-specific errors
    if (context.component?.includes('AI') || errorMessage.includes('ai') || errorMessage.includes('tensorflow')) {
      return this.getAIErrorMessage(error, context);
    }
    
    // Payment errors
    if (context.component?.includes('Payment') || errorMessage.includes('payment') || errorMessage.includes('paystack')) {
      return this.getPaymentErrorMessage(error, context);
    }
    
    // Database errors
    if (errorMessage.includes('supabase') || errorMessage.includes('database') || errorMessage.includes('rls')) {
      return this.getDatabaseErrorMessage(error, context);
    }
    
    // Network errors
    if (errorMessage.includes('network') || errorMessage.includes('fetch') || errorMessage.includes('connection')) {
      return this.getNetworkErrorMessage(error, context);
    }
    
    // Authentication errors
    if (errorMessage.includes('auth') || errorMessage.includes('login') || errorMessage.includes('token')) {
      return this.getAuthErrorMessage(error, context);
    }
    
    // Generic error
    return this.getGenericErrorMessage(error, context);
  }

  private getAIErrorMessage(error: Error, context: ErrorContext): UserFriendlyError {
    const errorMessage = error.message.toLowerCase();
    
    if (errorMessage.includes('model') || errorMessage.includes('tensorflow')) {
      return {
        title: 'AI Feature Temporarily Unavailable',
        message: 'Our AI system is currently loading. Please try again in a few moments.',
        action: 'Retry in 30 seconds',
        severity: 'warning',
        showToUser: true,
        logToConsole: true,
        retryable: true
      };
    }
    
    if (errorMessage.includes('prediction') || errorMessage.includes('recommendation')) {
      return {
        title: 'Personalization Unavailable',
        message: 'We couldn\'t generate personalized recommendations right now. Your regular dashboard is still fully functional.',
        action: 'Continue without AI insights',
        severity: 'info',
        showToUser: true,
        logToConsole: true,
        retryable: true
      };
    }
    
    if (errorMessage.includes('matching') || errorMessage.includes('compatibility')) {
      return {
        title: 'Smart Matching Unavailable',
        message: 'Smart referral matching is temporarily unavailable. You can still create and share referrals normally.',
        action: 'Use manual referral sharing',
        severity: 'info',
        showToUser: true,
        logToConsole: true,
        retryable: true
      };
    }
    
    return {
      title: 'AI Feature Issue',
      message: 'One of our smart features encountered an issue. This doesn\'t affect your core earnings or referrals.',
      action: 'Continue normally',
      severity: 'warning',
      showToUser: true,
      logToConsole: true,
      retryable: true
    };
  }

  private getPaymentErrorMessage(error: Error, context: ErrorContext): UserFriendlyError {
    const errorMessage = error.message.toLowerCase();
    
    if (errorMessage.includes('insufficient') || errorMessage.includes('balance')) {
      return {
        title: 'Insufficient Balance',
        message: 'You don\'t have enough funds for this withdrawal. Your minimum withdrawal amount may not be met.',
        action: 'Check your balance',
        severity: 'warning',
        showToUser: true,
        logToConsole: false,
        retryable: false
      };
    }
    
    if (errorMessage.includes('paystack') || errorMessage.includes('payment gateway')) {
      return {
        title: 'Payment Service Temporarily Unavailable',
        message: 'Our payment processor is experiencing issues. Your withdrawal request has been saved and will be processed when service is restored.',
        action: 'Try again later',
        severity: 'warning',
        showToUser: true,
        logToConsole: true,
        retryable: true
      };
    }
    
    if (errorMessage.includes('verification') || errorMessage.includes('account')) {
      return {
        title: 'Account Verification Required',
        message: 'Please verify your payment details or complete your profile to process this transaction.',
        action: 'Go to Profile Settings',
        severity: 'warning',
        showToUser: true,
        logToConsole: false,
        retryable: false
      };
    }
    
    return {
      title: 'Payment Processing Error',
      message: 'There was an issue processing your payment. Please try again or contact support if the problem persists.',
      action: 'Retry or Contact Support',
      severity: 'error',
      showToUser: true,
      logToConsole: true,
      retryable: true
    };
  }

  private getDatabaseErrorMessage(error: Error, context: ErrorContext): UserFriendlyError {
    const errorMessage = error.message.toLowerCase();
    
    if (errorMessage.includes('rls') || errorMessage.includes('policy')) {
      return {
        title: 'Access Denied',
        message: 'You don\'t have permission to access this information. Please make sure you\'re logged in.',
        action: 'Please log in again',
        severity: 'warning',
        showToUser: true,
        logToConsole: true,
        retryable: false
      };
    }
    
    if (errorMessage.includes('connection') || errorMessage.includes('timeout')) {
      return {
        title: 'Connection Issue',
        message: 'We\'re having trouble connecting to our servers. Please check your internet connection and try again.',
        action: 'Check connection and retry',
        severity: 'warning',
        showToUser: true,
        logToConsole: true,
        retryable: true
      };
    }
    
    return {
      title: 'Data Loading Error',
      message: 'We couldn\'t load your data right now. Please refresh the page or try again in a few moments.',
      action: 'Refresh page',
      severity: 'warning',
      showToUser: true,
      logToConsole: true,
      retryable: true
    };
  }

  private getNetworkErrorMessage(error: Error, context: ErrorContext): UserFriendlyError {
    return {
      title: 'Connection Problem',
      message: 'Please check your internet connection and try again. Your data is safe and will sync when connection is restored.',
      action: 'Check connection',
      severity: 'warning',
      showToUser: true,
      logToConsole: true,
      retryable: true
    };
  }

  private getAuthErrorMessage(error: Error, context: ErrorContext): UserFriendlyError {
    const errorMessage = error.message.toLowerCase();
    
    if (errorMessage.includes('expired') || errorMessage.includes('invalid')) {
      return {
        title: 'Session Expired',
        message: 'Your session has expired for security reasons. Please log in again to continue.',
        action: 'Log in again',
        severity: 'warning',
        showToUser: true,
        logToConsole: false,
        retryable: false
      };
    }
    
    return {
      title: 'Authentication Required',
      message: 'Please log in to access this feature.',
      action: 'Go to Login',
      severity: 'info',
      showToUser: true,
      logToConsole: false,
      retryable: false
    };
  }

  private getGenericErrorMessage(error: Error, context: ErrorContext): UserFriendlyError {
    return {
      title: 'Something Went Wrong',
      message: 'We encountered an unexpected issue. Please try again, and if the problem continues, contact our support team.',
      action: 'Try again or contact support',
      severity: 'error',
      showToUser: true,
      logToConsole: true,
      retryable: true
    };
  }

  private showErrorToUser(userError: UserFriendlyError): void {
    switch (userError.severity) {
      case 'critical':
      case 'error':
        showToast.error(`${userError.title}: ${userError.message}`);
        break;
      case 'warning':
        showToast.error(`${userError.title}: ${userError.message}`);
        break;
      case 'info':
        showToast.info(`${userError.title}: ${userError.message}`);
        break;
      default:
        showToast.error(`${userError.title}: ${userError.message}`);
    }
  }

  private logToConsole(error: Error, context: ErrorContext, userError: UserFriendlyError): void {
    const logData = {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      context,
      userFriendlyMessage: userError.title,
      timestamp: new Date().toISOString()
    };
    
    if (userError.severity === 'critical' || userError.severity === 'error') {
      console.error('🔴 EarnPro Error:', logData);
    } else if (userError.severity === 'warning') {
      console.warn('🟡 EarnPro Warning:', logData);
    } else {
      console.info('🔵 EarnPro Info:', logData);
    }
  }

  private logError(error: Error, context: ErrorContext): void {
    this.errorLog.push({
      error,
      context,
      timestamp: context.timestamp || new Date()
    });
    
    // Keep only last 100 errors to prevent memory leaks
    if (this.errorLog.length > 100) {
      this.errorLog = this.errorLog.slice(-100);
    }
  }

  /**
   * Get recent errors for debugging
   */
  getRecentErrors(limit: number = 10): Array<{ error: Error; context: ErrorContext; timestamp: Date }> {
    return this.errorLog.slice(-limit);
  }

  /**
   * Clear error log
   */
  clearErrorLog(): void {
    this.errorLog = [];
  }

  /**
   * Utility method to wrap async operations with error handling
   */
  async withErrorHandling<T>(
    operation: () => Promise<T>,
    context: ErrorContext,
    fallbackValue?: T
  ): Promise<T | undefined> {
    try {
      return await operation();
    } catch (error) {
      this.handleError(error as Error, context);
      return fallbackValue;
    }
  }

  /**
   * Utility method to wrap sync operations with error handling
   */
  withSyncErrorHandling<T>(
    operation: () => T,
    context: ErrorContext,
    fallbackValue?: T
  ): T | undefined {
    try {
      return operation();
    } catch (error) {
      this.handleError(error as Error, context);
      return fallbackValue;
    }
  }
}

export const errorHandlingService = ErrorHandlingService.getInstance();
export default errorHandlingService;
