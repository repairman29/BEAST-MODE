/**
 * Request Batcher
 * Batches similar LLM requests to reduce costs and improve efficiency
 */

const { createLogger } = require('../utils/logger');

const log = createLogger('RequestBatcher');

class RequestBatcher {
  constructor(options = {}) {
    this.options = {
      batchSize: options.batchSize || 10,
      batchTimeout: options.batchTimeout || 100, // ms
      maxWaitTime: options.maxWaitTime || 1000, // ms
      enabled: options.enabled !== false
    };
    
    this.batch = [];
    this.timeout = null;
    this.processors = new Map(); // Map of batchId -> processor function
    this.pendingRequests = new Map(); // Map of requestId -> { resolve, reject }
    this.requestIdCounter = 0;
  }

  /**
   * Add request to batch
   * @param {Object} request - LLM request
   * @param {Function} processor - Function to process batch
   * @returns {Promise} Request result
   */
  async add(request, processor) {
    if (!this.options.enabled) {
      // If batching disabled, process immediately
      return processor([request]).then(results => results[0]);
    }

    const requestId = this.requestIdCounter++;
    const batchId = this.generateBatchId(request);
    
    // Store processor for this batch type
    if (!this.processors.has(batchId)) {
      this.processors.set(batchId, processor);
    }

    // Create promise for this request
    return new Promise((resolve, reject) => {
      this.pendingRequests.set(requestId, { resolve, reject, request });
      
      // Add to batch
      this.batch.push({ requestId, request, batchId });
      
      // Start timeout if this is first item in batch
      if (this.batch.length === 1) {
        this.startTimeout();
      }
      
      // Process if batch is full
      if (this.batch.length >= this.options.batchSize) {
        this.processBatch(batchId);
      }
    });
  }

  /**
   * Generate batch ID from request
   */
  generateBatchId(request) {
    // Group by model and similar structure
    return `${request.model || 'default'}-${request.repo || 'default'}`;
  }

  /**
   * Start timeout for batch processing
   */
  startTimeout() {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
    
    this.timeout = setTimeout(() => {
      // Process all pending batches
      const batchIds = new Set(this.batch.map(b => b.batchId));
      for (const batchId of batchIds) {
        this.processBatch(batchId);
      }
    }, this.options.batchTimeout);
  }

  /**
   * Process a batch
   */
  async processBatch(batchId) {
    // Get requests for this batch
    const batchRequests = this.batch.filter(b => b.batchId === batchId);
    
    if (batchRequests.length === 0) {
      return;
    }

    // Remove from batch
    this.batch = this.batch.filter(b => b.batchId !== batchId);
    
    // Clear timeout if batch is empty
    if (this.batch.length === 0 && this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }

    // Get processor
    const processor = this.processors.get(batchId);
    if (!processor) {
      log.error(`No processor found for batch ${batchId}`);
      // Reject all requests
      batchRequests.forEach(({ requestId }) => {
        const pending = this.pendingRequests.get(requestId);
        if (pending) {
          pending.reject(new Error('No processor available'));
          this.pendingRequests.delete(requestId);
        }
      });
      return;
    }

    try {
      // Process batch
      const requests = batchRequests.map(b => b.request);
      log.debug(`Processing batch of ${requests.length} requests`);
      
      const results = await processor(requests);
      
      // Resolve all requests
      batchRequests.forEach(({ requestId }, index) => {
        const pending = this.pendingRequests.get(requestId);
        if (pending) {
          pending.resolve(results[index] || results[0]);
          this.pendingRequests.delete(requestId);
        }
      });
    } catch (error) {
      log.error('Batch processing failed:', error.message);
      // Reject all requests
      batchRequests.forEach(({ requestId }) => {
        const pending = this.pendingRequests.get(requestId);
        if (pending) {
          pending.reject(error);
          this.pendingRequests.delete(requestId);
        }
      });
    }
  }

  /**
   * Process all pending batches immediately
   */
  async flush() {
    const batchIds = new Set(this.batch.map(b => b.batchId));
    const promises = [];
    
    for (const batchId of batchIds) {
      promises.push(this.processBatch(batchId));
    }
    
    await Promise.all(promises);
  }

  /**
   * Get batch statistics
   * @returns {Object} Stats
   */
  getStats() {
    return {
      batchSize: this.batch.length,
      maxBatchSize: this.options.batchSize,
      pendingRequests: this.pendingRequests.size,
      batchTimeout: this.options.batchTimeout,
      enabled: this.options.enabled
    };
  }

  /**
   * Clear all pending requests
   */
  clear() {
    this.batch = [];
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
    
    // Reject all pending requests
    for (const [requestId, pending] of this.pendingRequests.entries()) {
      pending.reject(new Error('Batch cleared'));
    }
    this.pendingRequests.clear();
    this.processors.clear();
  }
}

// Singleton instance
let instance = null;

function getRequestBatcher(options) {
  if (!instance) {
    instance = new RequestBatcher(options);
  }
  return instance;
}

module.exports = { RequestBatcher, getRequestBatcher };
