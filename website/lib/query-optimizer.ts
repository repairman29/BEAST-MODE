/**
 * BEAST MODE Query Optimizer
 * 
 * Optimizes API queries by batching, debouncing, and deduplicating requests
 */

interface PendingRequest {
  resolve: (value: any) => void;
  reject: (error: any) => void;
  timestamp: number;
}

class QueryOptimizer {
  private pendingRequests: Map<string, PendingRequest[]> = new Map();
  private batchTimeout: number = 50; // 50ms batching window
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Batch multiple identical requests into a single request
   */
  async batch<T>(
    key: string,
    requestFn: () => Promise<T>,
    timeout: number = this.batchTimeout
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const existing = this.pendingRequests.get(key);

      if (existing && existing.length > 0) {
        // Add to existing batch
        existing.push({ resolve, reject, timestamp: Date.now() });
        return;
      }

      // Create new batch
      const batch: PendingRequest[] = [{ resolve, reject, timestamp: Date.now() }];
      this.pendingRequests.set(key, batch);

      // Execute request after timeout
      setTimeout(async () => {
        const currentBatch = this.pendingRequests.get(key);
        if (!currentBatch) return;

        this.pendingRequests.delete(key);

        try {
          const result = await requestFn();
          // Resolve all pending requests with the same result
          currentBatch.forEach(({ resolve }) => resolve(result));
        } catch (error) {
          // Reject all pending requests
          currentBatch.forEach(({ reject }) => reject(error));
        }
      }, timeout);
    });
  }

  /**
   * Debounce a request - only execute after a period of inactivity
   */
  debounce<T>(
    key: string,
    requestFn: () => Promise<T>,
    delay: number = 300
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      // Clear existing timer
      const existingTimer = this.debounceTimers.get(key);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      // Set new timer
      const timer = setTimeout(async () => {
        this.debounceTimers.delete(key);
        try {
          const result = await requestFn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, delay);

      this.debounceTimers.set(key, timer);
    });
  }

  /**
   * Deduplicate requests - if a request is already in flight, return the same promise
   */
  private inFlightRequests: Map<string, Promise<any>> = new Map();

  async deduplicate<T>(
    key: string,
    requestFn: () => Promise<T>
  ): Promise<T> {
    const existing = this.inFlightRequests.get(key);
    if (existing) {
      return existing;
    }

    const promise = requestFn().finally(() => {
      this.inFlightRequests.delete(key);
    });

    this.inFlightRequests.set(key, promise);
    return promise;
  }

  /**
   * Clear all pending operations
   */
  clear(): void {
    this.pendingRequests.clear();
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();
    this.inFlightRequests.clear();
  }
}

// Global query optimizer instance
const globalQueryOptimizer = new QueryOptimizer();

export default globalQueryOptimizer;

