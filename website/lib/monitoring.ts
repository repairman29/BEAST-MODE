/**
 * BEAST MODE Monitoring & Error Tracking
 * 
 * Centralized error tracking and monitoring utilities
 * Supports Sentry (if configured) with console fallback
 */

interface ErrorContext {
  userId?: string;
  action?: string;
  metadata?: Record<string, any>;
  severity?: 'error' | 'warning' | 'info';
}

class MonitoringService {
  private sentryEnabled: boolean = false;
  private sentry: any = null;

  constructor() {
    // Initialize Sentry if available
    if (typeof window !== 'undefined') {
      // Client-side: Check for Sentry
      try {
        if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
          const Sentry = require('@sentry/nextjs');
          if (Sentry) {
            this.sentry = Sentry;
            this.sentryEnabled = true;
          }
        }
      } catch (e) {
        // Sentry not installed - that's okay, we'll use console fallback
      }
    } else {
      // Server-side: Check for Sentry
      try {
        if (process.env.SENTRY_DSN) {
          const Sentry = require('@sentry/nextjs');
          if (Sentry) {
            this.sentry = Sentry;
            this.sentryEnabled = true;
          }
        }
      } catch (e) {
        // Sentry not installed - that's okay, we'll use console fallback
      }
    }
  }

  /**
   * Capture an error
   */
  captureError(error: Error | string, context?: ErrorContext) {
    const errorObj = typeof error === 'string' ? new Error(error) : error;
    
    if (this.sentryEnabled && this.sentry) {
      this.sentry.captureException(errorObj, {
        tags: {
          component: context?.action || 'unknown',
          severity: context?.severity || 'error'
        },
        user: context?.userId ? { id: context.userId } : undefined,
        extra: context?.metadata || {}
      });
    } else {
      // Console fallback
      console.error('[BEAST MODE Error]', {
        error: errorObj.message,
        stack: errorObj.stack,
        context: context?.action,
        metadata: context?.metadata,
        userId: context?.userId
      });
    }
  }

  /**
   * Capture a message (info/warning)
   */
  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: ErrorContext) {
    if (this.sentryEnabled && this.sentry) {
      this.sentry.captureMessage(message, {
        level: level as any,
        tags: {
          component: context?.action || 'unknown'
        },
        user: context?.userId ? { id: context.userId } : undefined,
        extra: context?.metadata || {}
      });
    } else {
      // Console fallback
      const logMethod = level === 'error' ? console.error : level === 'warning' ? console.warn : console.info;
      logMethod(`[BEAST MODE ${level.toUpperCase()}]`, {
        message,
        context: context?.action,
        metadata: context?.metadata,
        userId: context?.userId
      });
    }
  }

  /**
   * Set user context for error tracking
   */
  setUser(userId: string, email?: string, username?: string) {
    if (this.sentryEnabled && this.sentry) {
      this.sentry.setUser({
        id: userId,
        email,
        username
      });
    }
  }

  /**
   * Add breadcrumb for debugging
   */
  addBreadcrumb(message: string, category?: string, level: 'info' | 'warning' | 'error' = 'info', data?: Record<string, any>) {
    if (this.sentryEnabled && this.sentry) {
      this.sentry.addBreadcrumb({
        message,
        category: category || 'default',
        level: level as any,
        data
      });
    }
  }

  /**
   * Check if monitoring is enabled
   */
  isEnabled(): boolean {
    return this.sentryEnabled;
  }
}

// Singleton instance
let monitoringInstance: MonitoringService | null = null;

export function getMonitoring(): MonitoringService {
  if (!monitoringInstance) {
    monitoringInstance = new MonitoringService();
  }
  return monitoringInstance;
}

// Convenience functions
export function captureError(error: Error | string, context?: ErrorContext) {
  getMonitoring().captureError(error, context);
}

export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: ErrorContext) {
  getMonitoring().captureMessage(message, level, context);
}

export function setUser(userId: string, email?: string, username?: string) {
  getMonitoring().setUser(userId, email, username);
}

export function addBreadcrumb(message: string, category?: string, level: 'info' | 'warning' | 'error' = 'info', data?: Record<string, any>) {
  getMonitoring().addBreadcrumb(message, category, level, data);
}
