/**
 * BEAST MODE Error Monitoring
 * 
 * Centralized error logging and monitoring
 * Supports optional Sentry integration
 */

interface ErrorContext {
  userId?: string;
  sessionId?: string;
  url?: string;
  userAgent?: string;
  timestamp: number;
  component?: string;
  action?: string;
  metadata?: Record<string, any>;
}

class ErrorMonitor {
  private enabled: boolean = true;
  private sentryEnabled: boolean = false;
  private errorQueue: Array<{ error: Error; context: ErrorContext }> = [];
  private flushInterval: number = 30000; // 30 seconds
  private flushTimer: NodeJS.Timeout | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      // Check if Sentry is available
      this.sentryEnabled = typeof (window as any).Sentry !== 'undefined';
      
      // Start flush timer
      this.startFlushTimer();
      
      // Listen for unhandled errors
      window.addEventListener('error', (event) => {
        this.captureError(event.error || new Error(event.message), {
          timestamp: Date.now(),
          url: window.location.href,
          userAgent: navigator.userAgent,
          metadata: {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
          },
        });
      });

      // Listen for unhandled promise rejections
      window.addEventListener('unhandledrejection', (event) => {
        const error = event.reason instanceof Error 
          ? event.reason 
          : new Error(String(event.reason));
        this.captureError(error, {
          timestamp: Date.now(),
          url: window.location.href,
          userAgent: navigator.userAgent,
          metadata: {
            promiseRejection: true,
          },
        });
      });
    }
  }

  private startFlushTimer() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }

  captureError(error: Error, context: Partial<ErrorContext> = {}) {
    if (!this.enabled) return;

    const fullContext: ErrorContext = {
      timestamp: Date.now(),
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : undefined,
      ...context,
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error captured:', error, fullContext);
    }

    // Send to Sentry if available
    if (this.sentryEnabled && typeof window !== 'undefined') {
      try {
        const Sentry = (window as any).Sentry;
        Sentry.captureException(error, {
          contexts: {
            custom: fullContext,
          },
          tags: {
            component: fullContext.component,
            action: fullContext.action,
          },
          user: fullContext.userId ? { id: fullContext.userId } : undefined,
        });
      } catch (e) {
        console.warn('Failed to send error to Sentry:', e);
      }
    }

    // Add to queue for API logging
    this.errorQueue.push({ error, context: fullContext });

    // Flush if queue is large
    if (this.errorQueue.length >= 50) {
      this.flush();
    }
  }

  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context: Partial<ErrorContext> = {}) {
    if (!this.enabled) return;

    const fullContext: ErrorContext = {
      timestamp: Date.now(),
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : undefined,
      ...context,
    };

    // Send to Sentry if available
    if (this.sentryEnabled && typeof window !== 'undefined') {
      try {
        const Sentry = (window as any).Sentry;
        Sentry.captureMessage(message, level, {
          contexts: {
            custom: fullContext,
          },
        });
      } catch (e) {
        console.warn('Failed to send message to Sentry:', e);
      }
    }
  }

  async flush() {
    if (this.errorQueue.length === 0) return;

    const errors = [...this.errorQueue];
    this.errorQueue = [];

    try {
      // Send to error logging API
      await fetch('/api/beast-mode/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          errors: errors.map(({ error, context }) => ({
            message: error.message,
            stack: error.stack,
            name: error.name,
            context,
          })),
        }),
      });
    } catch (e) {
      // Silently fail - error monitoring should not break the app
      console.debug('Error monitoring flush failed:', e);
      // Re-queue errors if flush failed
      this.errorQueue.unshift(...errors);
    }
  }

  setUser(userId: string | null) {
    if (this.sentryEnabled && typeof window !== 'undefined') {
      try {
        const Sentry = (window as any).Sentry;
        Sentry.setUser(userId ? { id: userId } : null);
      } catch (e) {
        console.warn('Failed to set Sentry user:', e);
      }
    }
  }

  disable() {
    this.enabled = false;
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    this.flush();
  }

  enable() {
    this.enabled = true;
    this.startFlushTimer();
  }

  destroy() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flush();
  }
}

// Singleton instance
let errorMonitorInstance: ErrorMonitor | null = null;

export function getErrorMonitor(): ErrorMonitor {
  if (typeof window === 'undefined') {
    // Server-side: return a no-op instance
    return {
      captureError: () => {},
      captureMessage: () => {},
      setUser: () => {},
      flush: async () => {},
      disable: () => {},
      enable: () => {},
      destroy: () => {},
    } as unknown as ErrorMonitor;
  }

  if (!errorMonitorInstance) {
    errorMonitorInstance = new ErrorMonitor();
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
      errorMonitorInstance?.destroy();
    });
  }

  return errorMonitorInstance;
}

export default getErrorMonitor;

