/**
 * Model Cache
 * 
 * Singleton pattern for caching ML models in memory
 * Prevents reloading models on every API request
 */

interface CachedModel {
  model: any;
  timestamp: number;
  version: string;
}

class ModelCache {
  private cache: Map<string, CachedModel> = new Map();
  private loading: Map<string, Promise<any>> = new Map();
  private maxAge: number = 3600000; // 1 hour

  /**
   * Get or load model
   */
  async getOrLoad(key: string, loader: () => Promise<any>, version?: string): Promise<any> {
    const cached = this.cache.get(key);
    
    // Check if cached and not expired
    if (cached && (Date.now() - cached.timestamp) < this.maxAge) {
      return cached.model;
    }

    // Check if already loading
    if (this.loading.has(key)) {
      return await this.loading.get(key);
    }

    // Load model
    const loadPromise = loader().then((model) => {
      this.cache.set(key, {
        model,
        timestamp: Date.now(),
        version: version || 'unknown',
      });
      this.loading.delete(key);
      return model;
    }).catch((error) => {
      this.loading.delete(key);
      throw error;
    });

    this.loading.set(key, loadPromise);
    return await loadPromise;
  }

  /**
   * Get cached model (synchronous)
   */
  get(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && (Date.now() - cached.timestamp) < this.maxAge) {
      return cached.model;
    }
    return null;
  }

  /**
   * Clear cache
   */
  clear(key?: string) {
    if (key) {
      this.cache.delete(key);
      this.loading.delete(key);
    } else {
      this.cache.clear();
      this.loading.clear();
    }
  }

  /**
   * Get cache stats
   */
  getStats() {
    const stats: Record<string, any> = {};
    for (const [key, cached] of Array.from(this.cache.entries())) {
      const age = Date.now() - cached.timestamp;
      stats[key] = {
        age: Math.round(age / 1000), // seconds
        version: cached.version,
        cached: true,
      };
    }
    return stats;
  }
}

// Singleton instance
let modelCacheInstance: ModelCache | null = null;

export function getModelCache(): ModelCache {
  if (!modelCacheInstance) {
    modelCacheInstance = new ModelCache();
  }
  return modelCacheInstance;
}

export default getModelCache;

