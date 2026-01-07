/**
 * BEAST MODE Performance Monitor
 * 
 * Tracks API response times, model prediction latency, and performance metrics
 */

interface PerformanceMetric {
  operation: string;
  duration: number;
  timestamp: number;
  success: boolean;
  metadata?: Record<string, any>;
}

interface PerformanceStats {
  operation: string;
  count: number;
  totalDuration: number;
  averageDuration: number;
  minDuration: number;
  maxDuration: number;
  p50: number;
  p95: number;
  p99: number;
  errorCount: number;
  errorRate: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private maxMetrics: number = 1000;
  private enabled: boolean = true;

  constructor() {
    // Flush metrics periodically
    if (typeof window !== 'undefined') {
      setInterval(() => this.flush(), 60000); // Every minute
    }
  }

  /**
   * Record a performance metric
   */
  record(operation: string, duration: number, success: boolean = true, metadata?: Record<string, any>) {
    if (!this.enabled) return;

    const metric: PerformanceMetric = {
      operation,
      duration,
      timestamp: Date.now(),
      success,
      metadata,
    };

    this.metrics.push(metric);

    // Keep only last N metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Log slow operations
    if (duration > 1000) {
      console.warn(`[Performance] Slow operation: ${operation} took ${duration}ms`, metadata);
    }
  }

  /**
   * Time an async operation
   */
  async time<T>(operation: string, fn: () => Promise<T>, metadata?: Record<string, any>): Promise<T> {
    const start = Date.now();
    try {
      const result = await fn();
      const duration = Date.now() - start;
      this.record(operation, duration, true, metadata);
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      this.record(operation, duration, false, { ...metadata, error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  /**
   * Time a sync operation
   */
  timeSync<T>(operation: string, fn: () => T, metadata?: Record<string, any>): T {
    const start = Date.now();
    try {
      const result = fn();
      const duration = Date.now() - start;
      this.record(operation, duration, true, metadata);
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      this.record(operation, duration, false, { ...metadata, error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  /**
   * Get statistics for an operation
   */
  getStats(operation: string, timeWindow?: number): PerformanceStats | null {
    let filteredMetrics = this.metrics.filter(m => m.operation === operation);
    
    if (timeWindow) {
      const cutoff = Date.now() - timeWindow;
      filteredMetrics = filteredMetrics.filter(m => m.timestamp >= cutoff);
    }

    if (filteredMetrics.length === 0) {
      return null;
    }

    const durations = filteredMetrics.map(m => m.duration).sort((a, b) => a - b);
    const errorCount = filteredMetrics.filter(m => !m.success).length;
    const totalDuration = durations.reduce((sum, d) => sum + d, 0);
    const averageDuration = totalDuration / durations.length;
    const minDuration = durations[0];
    const maxDuration = durations[durations.length - 1];
    const p50 = durations[Math.floor(durations.length * 0.5)];
    const p95 = durations[Math.floor(durations.length * 0.95)];
    const p99 = durations[Math.floor(durations.length * 0.99)];

    return {
      operation,
      count: filteredMetrics.length,
      totalDuration,
      averageDuration: Math.round(averageDuration),
      minDuration,
      maxDuration,
      p50,
      p95,
      p99,
      errorCount,
      errorRate: (errorCount / filteredMetrics.length) * 100,
    };
  }

  /**
   * Get all statistics
   */
  getAllStats(timeWindow?: number): Record<string, PerformanceStats> {
    const operations = new Set(this.metrics.map(m => m.operation));
    const stats: Record<string, PerformanceStats> = {};

    for (const operation of Array.from(operations)) {
      const stat = this.getStats(operation, timeWindow);
      if (stat) {
        stats[operation] = stat;
      }
    }

    return stats;
  }

  /**
   * Get recent metrics
   */
  getRecentMetrics(limit: number = 100): PerformanceMetric[] {
    return this.metrics.slice(-limit).reverse();
  }

  /**
   * Get slow operations
   */
  getSlowOperations(threshold: number = 1000, limit: number = 50): PerformanceMetric[] {
    return this.metrics
      .filter(m => m.duration >= threshold)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit);
  }

  /**
   * Flush metrics to API
   */
  async flush() {
    if (this.metrics.length === 0) return;

    try {
      const stats = this.getAllStats();
      await fetch('/api/beast-mode/monitoring/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stats,
          timestamp: Date.now(),
        }),
      });
    } catch (error) {
      // Silently fail - performance monitoring should not break the app
      console.debug('Performance monitoring flush failed:', error);
    }
  }

  /**
   * Clear metrics
   */
  clear() {
    this.metrics = [];
  }

  /**
   * Enable/disable monitoring
   */
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }
}

// Singleton instance
let performanceMonitorInstance: PerformanceMonitor | null = null;

export function getPerformanceMonitor(): PerformanceMonitor {
  if (typeof window === 'undefined') {
    // Server-side: return a no-op instance
    return {
      record: () => {},
      time: async <T>(_op: string, fn: () => Promise<T>) => fn(),
      timeSync: <T>(_op: string, fn: () => T) => fn(),
      getStats: () => null,
      getAllStats: () => ({}),
      getRecentMetrics: () => [],
      getSlowOperations: () => [],
      flush: async () => {},
      clear: () => {},
      setEnabled: () => {},
    } as unknown as PerformanceMonitor;
  }

  if (!performanceMonitorInstance) {
    performanceMonitorInstance = new PerformanceMonitor();
  }

  return performanceMonitorInstance;
}

export default getPerformanceMonitor;

