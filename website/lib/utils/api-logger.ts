/**
 * API Logger for Next.js Routes
 * 
 * Production-safe logging that respects environment.
 * In development, uses console with emojis for readability.
 * In production, uses structured JSON logging for external services.
 * 
 * @module lib/utils/api-logger
 */

type LogLevel = 'error' | 'warn' | 'info' | 'debug';

interface LogContext {
  [key: string]: unknown;
}

/**
 * API Logger class for structured logging in Next.js API routes
 * 
 * Provides environment-aware logging with different behaviors for
 * development (readable console output) and production (structured JSON).
 */
class ApiLogger {
  private context: string;
  private isDevelopment: boolean;

  constructor(context: string) {
    this.context = context;
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  private log(level: LogLevel, message: string, context?: LogContext): void {
    const timestamp = new Date().toISOString();
    const prefix = `[${this.context}]`;
    
    if (this.isDevelopment) {
      // In development, use console with emojis for readability
      const emoji = {
        error: '❌',
        warn: '⚠️',
        info: 'ℹ️',
        debug: '🔍'
      }[level];
      
      console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'](
        `${emoji} ${prefix} ${message}`,
        context ? JSON.stringify(context, null, 2) : ''
      );
    } else {
      // In production, use structured logging
      const logEntry = {
        timestamp,
        level,
        context: this.context,
        message,
        ...context
      };
      
      // In production, only log errors and warnings to console
      // Other logs should go to a logging service (e.g., Sentry, DataDog)
      if (level === 'error' || level === 'warn') {
        console[level](JSON.stringify(logEntry));
      }
      // TODO: Send info/debug logs to external logging service
    }
  }

  error(message: string, context?: LogContext): void {
    this.log('error', message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      this.log('debug', message, context);
    }
  }
}

export function createApiLogger(context: string): ApiLogger {
  return new ApiLogger(context);
}
