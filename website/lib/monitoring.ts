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
    // Sentry is optional - if not installed, we'll use console fallback
    this.sentryEnabled = false;
    this.sentry = null;
    
    // Don't try to load Sentry at all if DSN is not set
    // This prevents webpack from trying to resolve the module
    const hasClientDSN = typeof window !== 'undefined' && process.env.NEXT_PUBLIC_SENTRY_DSN;
    const hasServerDSN = typeof window === 'undefined' && process.env.SENTRY_DSN;
    
    if (!hasClientDSN && !hasServerDSN) {
      // No Sentry DSN configured, skip initialization
      return;
    }
    
    // Only try to load if DSN is configured
    try {
      // Use eval to prevent webpack from analyzing this require
      // This is safe because we're only doing it if DSN is configured
      const sentryModule = eval('require')('@sentry/nextjs');
      if (sentryModule) {
        this.sentry = sentryModule;
        this.sentryEnabled = true;
      }
    } catch (e) {
      // Sentry not installed - that's okay, we'll use console fallback
      this.sentryEnabled = false;
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
