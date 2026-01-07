/**
 * Quality API Monitoring
 * 
 * Tracks API usage, performance, and errors for quality predictions
 */

class QualityMonitoring {
  constructor() {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      averageLatency: 0,
      p50Latency: 0,
      p95Latency: 0,
      p99Latency: 0,
      latencies: [], // For percentile calculation
      errors: [],
      requestsByRepo: new Map(),
      requestsByPlatform: new Map()
    };
    
    this.maxLatencies = 1000; // Keep last 1000 latencies for percentile calculation
  }

  /**
   * Record a request
   */
  recordRequest(repo, platform, latency, success, cached = false, error = null) {
    this.metrics.totalRequests++;
    
    if (success) {
      this.metrics.successfulRequests++;
    } else {
      this.metrics.failedRequests++;
      if (error) {
        this.metrics.errors.push({
          repo,
          platform,
          error: error.message || error,
          timestamp: new Date().toISOString()
        });
        // Keep only last 100 errors
        if (this.metrics.errors.length > 100) {
          this.metrics.errors.shift();
        }
      }
    }

    if (cached) {
      this.metrics.cacheHits++;
    } else {
      this.metrics.cacheMisses++;
    }

    // Record latency
    if (latency !== undefined && latency !== null) {
      this.metrics.latencies.push(latency);
      if (this.metrics.latencies.length > this.maxLatencies) {
        this.metrics.latencies.shift();
      }

      // Update average
      const sum = this.metrics.latencies.reduce((a, b) => a + b, 0);
      this.metrics.averageLatency = sum / this.metrics.latencies.length;

      // Calculate percentiles
      const sorted = [...this.metrics.latencies].sort((a, b) => a - b);
      this.metrics.p50Latency = sorted[Math.floor(sorted.length * 0.5)] || 0;
      this.metrics.p95Latency = sorted[Math.floor(sorted.length * 0.95)] || 0;
      this.metrics.p99Latency = sorted[Math.floor(sorted.length * 0.99)] || 0;
    }

    // Track by repo
    const repoCount = this.metrics.requestsByRepo.get(repo) || 0;
    this.metrics.requestsByRepo.set(repo, repoCount + 1);

    // Track by platform
    const platformCount = this.metrics.requestsByPlatform.get(platform || 'unknown') || 0;
    this.metrics.requestsByPlatform.set(platform || 'unknown', platformCount + 1);
  }

  /**
   * Get current metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      requestsByRepo: Object.fromEntries(this.metrics.requestsByRepo),
      requestsByPlatform: Object.fromEntries(this.metrics.requestsByPlatform),
      errorRate: this.metrics.totalRequests > 0
        ? ((this.metrics.failedRequests / this.metrics.totalRequests) * 100).toFixed(2) + '%'
        : '0%',
      cacheHitRate: (this.metrics.cacheHits + this.metrics.cacheMisses) > 0
        ? ((this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses)) * 100).toFixed(2) + '%'
        : '0%'
    };
  }

  /**
   * Reset metrics (for testing)
   */
  reset() {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      averageLatency: 0,
      p50Latency: 0,
      p95Latency: 0,
      p99Latency: 0,
      latencies: [],
      errors: [],
      requestsByRepo: new Map(),
      requestsByPlatform: new Map()
    };
  }

  /**
   * Get top requested repos
   */
  getTopRepos(limit = 10) {
    const entries = Array.from(this.metrics.requestsByRepo.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);
    
    return entries.map(([repo, count]) => ({ repo, count }));
  }

  /**
   * Get platform distribution
   */
  getPlatformDistribution() {
    return Object.fromEntries(this.metrics.requestsByPlatform);
  }
}

// Singleton instance
let monitoringInstance = null;

function getQualityMonitoring() {
  if (!monitoringInstance) {
    monitoringInstance = new QualityMonitoring();
  }
  return monitoringInstance;
}

module.exports = { QualityMonitoring, getQualityMonitoring };

