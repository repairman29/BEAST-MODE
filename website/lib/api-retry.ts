/**
 * API Retry Utilities
 * Provides retry mechanisms for failed API calls
 */

export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  retryableStatuses?: number[];
  onRetry?: (attempt: number, error: Error) => void;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
  retryableStatuses: [408, 429, 500, 502, 503, 504],
  onRetry: () => {}
};

/**
 * Calculate delay for retry attempt (exponential backoff)
 */
function calculateDelay(attempt: number, options: Required<RetryOptions>): number {
  const delay = options.initialDelay * Math.pow(options.backoffFactor, attempt);
  return Math.min(delay, options.maxDelay);
}

/**
 * Check if error is retryable
 */
function isRetryable(error: any, options: Required<RetryOptions>): boolean {
  // Network errors are always retryable
  if (!error.response) {
    return true;
  }

  // Check status code
  const status = error.response?.status || error.status;
  return options.retryableStatuses.includes(status);
}

/**
 * Retry a function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Don't retry if not retryable
      if (!isRetryable(error, opts)) {
        throw error;
      }

      // Don't retry if we've exhausted attempts
      if (attempt >= opts.maxRetries) {
        break;
      }

      // Calculate delay and wait
      const delay = calculateDelay(attempt, opts);
      opts.onRetry(attempt + 1, error);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

/**
 * Fetch with automatic retry
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retryOptions: RetryOptions = {}
): Promise<Response> {
  return retry(
    async () => {
      const response = await fetch(url, options);
      
      // Throw error for non-2xx responses
      if (!response.ok) {
        const error: any = new Error(`HTTP ${response.status}: ${response.statusText}`);
        error.response = response;
        error.status = response.status;
        throw error;
      }
      
      return response;
    },
    retryOptions
  );
}

/**
 * API call wrapper with retry
 */
export async function apiCall<T>(
  url: string,
  options: RequestInit = {},
  retryOptions: RetryOptions = {}
): Promise<T> {
  const response = await fetchWithRetry(url, options, retryOptions);
  return response.json();
}

/**
 * Create a retryable fetch function
 */
export function createRetryableFetch(retryOptions: RetryOptions = {}) {
  return (url: string, options: RequestInit = {}) => {
    return fetchWithRetry(url, options, retryOptions);
  };
}
