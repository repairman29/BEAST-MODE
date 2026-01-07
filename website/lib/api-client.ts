/**
 * BEAST MODE API Client
 * 
 * Enhanced API client with retry mechanisms, error handling, and resilience
 */

interface ApiClientOptions {
  retries?: number;
  retryDelay?: number;
  timeout?: number;
  onError?: (error: Error) => void;
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class ApiClient {
  private defaultOptions: Required<ApiClientOptions> = {
    retries: 3,
    retryDelay: 1000,
    timeout: 30000,
    onError: () => {},
  };

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async fetchWithTimeout(url: string, options: RequestInit, timeout: number): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeout}ms`);
      }
      throw error;
    }
  }

  private async retryFetch(
    url: string,
    options: RequestInit,
    retries: number,
    retryDelay: number,
    timeout: number,
    attempt: number = 1
  ): Promise<Response> {
    try {
      const response = await this.fetchWithTimeout(url, options, timeout);
      
      // Retry on 5xx errors
      if (response.status >= 500 && attempt <= retries) {
        await this.sleep(retryDelay * attempt);
        return this.retryFetch(url, options, retries, retryDelay, timeout, attempt + 1);
      }

      return response;
    } catch (error) {
      // Retry on network errors
      if (attempt <= retries && error instanceof Error) {
        // Don't retry on timeout errors
        if (error.message.includes('timeout')) {
          throw error;
        }
        await this.sleep(retryDelay * attempt);
        return this.retryFetch(url, options, retries, retryDelay, timeout, attempt + 1);
      }
      throw error;
    }
  }

  async request<T = any>(
    url: string,
    options: RequestInit = {},
    clientOptions: ApiClientOptions = {}
  ): Promise<ApiResponse<T>> {
    const opts = { ...this.defaultOptions, ...clientOptions };
    const { retries, retryDelay, timeout, onError } = opts;

    try {
      const response = await this.retryFetch(
        url,
        {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
        },
        retries,
        retryDelay,
        timeout
      );

      const data = await response.json();

      if (!response.ok) {
        const error = new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
        onError(error);
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        data,
        ...data,
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      onError(err);

      // Enhanced error messages
      let errorMessage = 'An error occurred';
      if (err.message.includes('timeout')) {
        errorMessage = 'Request timed out. Please try again.';
      } else if (err.message.includes('Failed to fetch')) {
        errorMessage = 'Network error. Please check your connection.';
      } else {
        errorMessage = err.message;
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  async get<T = any>(url: string, options: ApiClientOptions = {}): Promise<ApiResponse<T>> {
    return this.request<T>(url, { method: 'GET' }, options);
  }

  async post<T = any>(url: string, body: any, options: ApiClientOptions = {}): Promise<ApiResponse<T>> {
    return this.request<T>(
      url,
      {
        method: 'POST',
        body: JSON.stringify(body),
      },
      options
    );
  }

  async put<T = any>(url: string, body: any, options: ApiClientOptions = {}): Promise<ApiResponse<T>> {
    return this.request<T>(
      url,
      {
        method: 'PUT',
        body: JSON.stringify(body),
      },
      options
    );
  }

  async delete<T = any>(url: string, options: ApiClientOptions = {}): Promise<ApiResponse<T>> {
    return this.request<T>(url, { method: 'DELETE' }, options);
  }
}

// Singleton instance
let apiClientInstance: ApiClient | null = null;

export function getApiClient(): ApiClient {
  if (!apiClientInstance) {
    apiClientInstance = new ApiClient();
  }
  return apiClientInstance;
}

export default getApiClient();

