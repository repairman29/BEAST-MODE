/**
 * Batch Processor
 * 
 * Processes multiple requests in batches for improved performance
 * Reduces overhead and enables parallel execution
 */

const { createLogger } = require('../utils/logger');
const log = createLogger('BatchProcessor');

class BatchProcessor {
  constructor(options = {}) {
    this.batchSize = options.batchSize || 10;
    this.maxWaitTime = options.maxWaitTime || 100; // ms
    this.batches = new Map(); // endpoint -> batch queue
    this.processing = new Map(); // endpoint -> processing flag
  }

  /**
   * Add a request to a batch
   * @param {string} endpoint - API endpoint identifier
   * @param {Function} processor - Function to process the batch
   * @param {any} request - Request data
   * @returns {Promise} - Resolves when batch is processed
   */
  async addToBatch(endpoint, processor, request) {
    // Initialize batch queue if needed
    if (!this.batches.has(endpoint)) {
      this.batches.set(endpoint, []);
      this.processing.set(endpoint, false);
    }

    const batchQueue = this.batches.get(endpoint);
    const promise = new Promise((resolve, reject) => {
      batchQueue.push({
        request,
        resolve,
        reject,
        timestamp: Date.now()
      });
    });

    // Trigger batch processing if needed
    this.triggerBatch(endpoint, processor);

    return promise;
  }

  /**
   * Trigger batch processing
   */
  async triggerBatch(endpoint, processor) {
    const batchQueue = this.batches.get(endpoint);
    if (!batchQueue || batchQueue.length === 0) {
      return;
    }

    // If already processing, wait
    if (this.processing.get(endpoint)) {
      return;
    }

    // Check if we should process now
    const shouldProcess = 
      batchQueue.length >= this.batchSize ||
      (batchQueue.length > 0 && Date.now() - batchQueue[0].timestamp >= this.maxWaitTime);

    if (!shouldProcess) {
      // Schedule processing after maxWaitTime
      setTimeout(() => this.triggerBatch(endpoint, processor), this.maxWaitTime);
      return;
    }

    // Mark as processing
    this.processing.set(endpoint, true);

    // Extract batch
    const batch = batchQueue.splice(0, this.batchSize);
    const requests = batch.map(item => item.request);

    try {
      log.debug(`Processing batch of ${batch.length} requests for ${endpoint}`);
      const startTime = Date.now();

      // Process batch
      const results = await processor(requests);

      const latency = Date.now() - startTime;
      log.debug(`Batch processed in ${latency}ms (${(latency / batch.length).toFixed(1)}ms per request)`);

      // Resolve all promises
      if (Array.isArray(results)) {
        batch.forEach((item, index) => {
          if (results[index] !== undefined) {
            item.resolve(results[index]);
          } else {
            item.resolve(results); // Single result for all
          }
        });
      } else {
        // Single result for all requests
        batch.forEach(item => item.resolve(results));
      }

    } catch (error) {
      log.error(`Batch processing failed for ${endpoint}:`, error);
      // Reject all promises
      batch.forEach(item => item.reject(error));
    } finally {
      // Mark as not processing
      this.processing.set(endpoint, false);

      // Process remaining items if any
      if (batchQueue.length > 0) {
        this.triggerBatch(endpoint, processor);
      }
    }
  }

  /**
   * Process requests in parallel (not batched)
   */
  async processParallel(requests, processor, concurrency = 5) {
    const results = [];
    const executing = [];

    for (const request of requests) {
      const promise = processor(request).then(result => {
        executing.splice(executing.indexOf(promise), 1);
        return result;
      });

      executing.push(promise);
      results.push(promise);

      // Limit concurrency
      if (executing.length >= concurrency) {
        await Promise.race(executing);
      }
    }

    return Promise.all(results);
  }

  /**
   * Get batch statistics
   */
  getStats() {
    const stats = {};
    for (const [endpoint, queue] of this.batches.entries()) {
      stats[endpoint] = {
        queueSize: queue.length,
        processing: this.processing.get(endpoint) || false
      };
    }
    return stats;
  }

  /**
   * Clear all batches
   */
  clear() {
    this.batches.clear();
    this.processing.clear();
    log.info('All batches cleared');
  }
}

// Singleton instance
let batchProcessorInstance = null;

function getBatchProcessor(options) {
  if (!batchProcessorInstance) {
    batchProcessorInstance = new BatchProcessor(options);
  }
  return batchProcessorInstance;
}

module.exports = {
  BatchProcessor,
  getBatchProcessor
};
