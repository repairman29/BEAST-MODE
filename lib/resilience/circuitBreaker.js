/**
 * Circuit Breaker Service
 * Prevents cascading failures with circuit breaker pattern
 * 
 * Month 8: Week 2 - Production Hardening
 */

const { createLogger } = require('../utils/logger');
const logger = createLogger('CircuitBreaker');

class CircuitBreaker {
  constructor() {
    this.circuits = new Map();
    this.defaultConfig = {
      failureThreshold: 5,
      successThreshold: 2,
      timeout: 60000, // 1 minute
      halfOpenTimeout: 30000 // 30 seconds
    };
  }

  /**
   * Initialize circuit breaker
   */
  async initialize() {
    try {
      logger.info('✅ Circuit breaker initialized');
      return true;
    } catch (error) {
      logger.error('Failed to initialize circuit breaker:', error);
      return false;
    }
  }

  /**
   * Get or create circuit
   */
  getCircuit(name, config = {}) {
    if (!this.circuits.has(name)) {
      const circuitConfig = { ...this.defaultConfig, ...config };
      this.circuits.set(name, {
        name,
        state: 'closed', // closed, open, half-open
        failures: 0,
        successes: 0,
        lastFailure: null,
        lastSuccess: null,
        openedAt: null,
        halfOpenedAt: null,
        config: circuitConfig
      });
    }

    return this.circuits.get(name);
  }

  /**
   * Execute operation with circuit breaker
   */
  async execute(name, operation, fallback = null) {
    const circuit = this.getCircuit(name);

    // Check circuit state
    if (circuit.state === 'open') {
      // Check if timeout has passed
      if (Date.now() - circuit.openedAt > circuit.config.timeout) {
        circuit.state = 'half-open';
        circuit.halfOpenedAt = Date.now();
        circuit.successes = 0;
        logger.info(`Circuit ${name} moved to half-open state`);
      } else {
        // Circuit is open, use fallback
        logger.warn(`Circuit ${name} is open, using fallback`);
        if (fallback) {
          return await fallback();
        }
        throw new Error(`Circuit ${name} is open`);
      }
    }

    try {
      // Execute operation
      const result = await operation();

      // Record success
      this.recordSuccess(circuit);

      return result;
    } catch (error) {
      // Record failure
      this.recordFailure(circuit, error);

      // Use fallback if available
      if (fallback) {
        logger.warn(`Operation failed, using fallback for circuit ${name}`);
        return await fallback();
      }

      throw error;
    }
  }

  /**
   * Record success
   */
  recordSuccess(circuit) {
    circuit.successes++;
    circuit.lastSuccess = Date.now();

    // If in half-open state and enough successes, close circuit
    if (circuit.state === 'half-open') {
      if (circuit.successes >= circuit.config.successThreshold) {
        circuit.state = 'closed';
        circuit.failures = 0;
        circuit.successes = 0;
        circuit.halfOpenedAt = null;
        logger.info(`Circuit ${circuit.name} closed after successful recovery`);
      }
    }
  }

  /**
   * Record failure
   */
  recordFailure(circuit, error) {
    circuit.failures++;
    circuit.lastFailure = Date.now();

    // If failures exceed threshold, open circuit
    if (circuit.failures >= circuit.config.failureThreshold) {
      if (circuit.state !== 'open') {
        circuit.state = 'open';
        circuit.openedAt = Date.now();
        circuit.failures = 0;
        logger.error(`Circuit ${circuit.name} opened due to failures`);
      }
    }

    // If in half-open state and failure occurs, open circuit
    if (circuit.state === 'half-open') {
      circuit.state = 'open';
      circuit.openedAt = Date.now();
      circuit.failures = 0;
      circuit.successes = 0;
      logger.error(`Circuit ${circuit.name} opened after failure in half-open state`);
    }
  }

  /**
   * Get circuit status
   */
  getCircuitStatus(name) {
    const circuit = this.circuits.get(name);
    if (!circuit) {
      return null;
    }

    return {
      name: circuit.name,
      state: circuit.state,
      failures: circuit.failures,
      successes: circuit.successes,
      lastFailure: circuit.lastFailure,
      lastSuccess: circuit.lastSuccess,
      openedAt: circuit.openedAt,
      halfOpenedAt: circuit.halfOpenedAt
    };
  }

  /**
   * Get all circuit statuses
   */
  getAllCircuitStatuses() {
    const statuses = {};
    for (const [name, circuit] of this.circuits.entries()) {
      statuses[name] = this.getCircuitStatus(name);
    }
    return statuses;
  }

  /**
   * Manually open circuit
   */
  openCircuit(name) {
    const circuit = this.getCircuit(name);
    circuit.state = 'open';
    circuit.openedAt = Date.now();
    circuit.failures = 0;
    logger.info(`Circuit ${name} manually opened`);
    return circuit;
  }

  /**
   * Manually close circuit
   */
  closeCircuit(name) {
    const circuit = this.getCircuit(name);
    circuit.state = 'closed';
    circuit.failures = 0;
    circuit.successes = 0;
    circuit.openedAt = null;
    circuit.halfOpenedAt = null;
    logger.info(`Circuit ${name} manually closed`);
    return circuit;
  }
}

// Singleton instance
let instance = null;

function getCircuitBreaker() {
  if (!instance) {
    instance = new CircuitBreaker();
  }
  return instance;
}

module.exports = {
  CircuitBreaker,
  getCircuitBreaker
};

