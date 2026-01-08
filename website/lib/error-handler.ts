/**
 * Enhanced Error Handler
 * Provides better error messages and recovery options
 */

export interface ErrorContext {
  code?: string;
  statusCode?: number;
  userMessage?: string;
  recoveryAction?: {
    label: string;
    action: () => void;
  };
  technicalDetails?: string;
}

export class EnhancedErrorHandler {
  /**
   * Get user-friendly error message
   */
  static getUserMessage(error: Error | unknown, context?: ErrorContext): string {
    if (context?.userMessage) {
      return context.userMessage;
    }

    if (error instanceof Error) {
      // Map common errors to user-friendly messages
      const errorMappings: Record<string, string> = {
        'NetworkError': 'Unable to connect to the server. Please check your internet connection.',
        'TimeoutError': 'The request took too long. Please try again.',
        'AuthenticationError': 'Please sign in to continue.',
        'PermissionError': 'You don\'t have permission to perform this action.',
        'NotFoundError': 'The requested resource was not found.',
        'ValidationError': 'Please check your input and try again.',
        'RateLimitError': 'Too many requests. Please wait a moment and try again.',
        'ServerError': 'Something went wrong on our end. We\'re working on it!'
      };

      for (const [key, message] of Object.entries(errorMappings)) {
        if (error.name.includes(key) || error.message.includes(key)) {
          return message;
        }
      }

      // Fallback to generic message
      return 'An unexpected error occurred. Please try again.';
    }

    return 'An unknown error occurred. Please try again.';
  }

  /**
   * Get recovery action for error
   */
  static getRecoveryAction(error: Error | unknown, context?: ErrorContext): ErrorContext['recoveryAction'] {
    if (context?.recoveryAction) {
      return context.recoveryAction;
    }

    if (error instanceof Error) {
      // Network errors - retry
      if (error.message.includes('network') || error.message.includes('fetch')) {
        return {
          label: 'Retry',
          action: () => window.location.reload()
        };
      }

      // Authentication errors - redirect to sign in
      if (error.message.includes('auth') || error.message.includes('unauthorized')) {
        return {
          label: 'Sign In',
          action: () => window.location.href = '/auth/signin'
        };
      }

      // Rate limit - wait and retry
      if (error.message.includes('rate limit') || error.message.includes('429')) {
        return {
          label: 'Wait & Retry',
          action: () => {
            setTimeout(() => window.location.reload(), 5000);
          }
        };
      }
    }

    return {
      label: 'Go Home',
      action: () => window.location.href = '/'
    };
  }

  /**
   * Format error for display
   */
  static formatError(error: Error | unknown, context?: ErrorContext) {
    return {
      message: this.getUserMessage(error, context),
      recovery: this.getRecoveryAction(error, context),
      technical: context?.technicalDetails || (error instanceof Error ? error.message : String(error)),
      code: context?.code,
      statusCode: context?.statusCode
    };
  }
}
