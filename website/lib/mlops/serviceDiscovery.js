/**
 * Service Discovery & Health Check System
 * Discovers and monitors specialized ML services
 * 
 * Services:
 * - Code Roach (port 3007): Code quality predictions (90%+ accuracy)
 * - Oracle (port 3006): Knowledge search & relevance (85% accuracy)
 * - Daisy Chain (port 3008): Workflow quality predictions
 * - AI GM (port 4001): Narrative quality predictions
 */

// Try to require logger, fallback to console if not available
let createLogger;
try {
  const loggerModule = require('../utils/logger');
  createLogger = loggerModule.createLogger || loggerModule.default?.createLogger || loggerModule;
} catch (e) {
  // Fallback logger
  createLogger = (name) => ({
    info: (...args) => console.log(`[${name}]`, ...args),
    warn: (...args) => console.warn(`[${name}]`, ...args),
    error: (...args) => console.error(`[${name}]`, ...args),
    debug: (...args) => console.debug(`[${name}]`, ...args),
  });
}
const log = createLogger('ServiceDiscovery');

class ServiceDiscovery {
  constructor() {
    this.services = {
      'code-roach': {
        name: 'Code Roach',
        port: 3007,
        baseUrl: process.env.CODE_ROACH_URL || 'http://localhost:3007',
        healthEndpoint: '/health',
        capabilities: ['code-quality', 'ast-analysis', 'bug-detection'],
        accuracy: 0.90, // 90%+ with AST analysis
        available: false,
        lastChecked: null,
        responseTime: null
      },
      'oracle': {
        name: 'Oracle',
        port: 3006,
        baseUrl: process.env.ORACLE_URL || 'http://localhost:3006',
        healthEndpoint: '/health',
        capabilities: ['knowledge-search', 'semantic-search', 'relevance-scoring'],
        accuracy: 0.85, // 85% target accuracy
        available: false,
        lastChecked: null,
        responseTime: null
      },
      'daisy-chain': {
        name: 'Daisy Chain',
        port: 3008,
        baseUrl: process.env.DAISY_CHAIN_URL || 'http://localhost:3008',
        healthEndpoint: '/health',
        capabilities: ['workflow-quality', 'task-sequencing'],
        accuracy: 0.80, // Estimated
        available: false,
        lastChecked: null,
        responseTime: null
      },
      'ai-gm': {
        name: 'AI GM',
        port: 4001,
        baseUrl: process.env.AI_GM_URL || 'http://localhost:4001',
        healthEndpoint: '/health',
        capabilities: ['narrative-quality', 'game-context'],
        accuracy: 0.85, // Estimated
        available: false,
        lastChecked: null,
        responseTime: null
      }
    };
    
    this.checkInterval = 30000; // Check every 30 seconds
    this.checkTimer = null;
    this.initialized = false;
  }

  /**
   * Initialize service discovery
   */
  async initialize() {
    if (this.initialized) return;
    
    log.info('🔍 Initializing service discovery...');
    
    // Initial health check
    await this.checkAllServices();
    
    // Start periodic health checks
    this.startPeriodicChecks();
    
    this.initialized = true;
    log.info('✅ Service discovery initialized');
  }

  /**
   * Check health of all services
   */
  async checkAllServices() {
    const checks = Object.keys(this.services).map(serviceId => 
      this.checkService(serviceId)
    );
    
    await Promise.allSettled(checks);
    
    const available = Object.values(this.services).filter(s => s.available).length;
    const total = Object.keys(this.services).length;
    
    log.info(`📊 Services: ${available}/${total} available`);
  }

  /**
   * Check health of a specific service
   */
  async checkService(serviceId) {
    const service = this.services[serviceId];
    if (!service) return;

    const startTime = Date.now();
    
    try {
      // Use node-fetch if available, otherwise use built-in fetch (Node 18+)
      let fetchFn = global.fetch;
      if (!fetchFn) {
        try {
          fetchFn = require('node-fetch');
        } catch (e) {
          log.warn('Fetch not available, using http module');
          return await this.checkServiceHttp(serviceId);
        }
      }

      const url = `${service.baseUrl}${service.healthEndpoint}`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout
      
      const response = await fetchFn(url, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json'
        }
      });
      
      clearTimeout(timeout);
      
      if (response.ok) {
        const data = await response.json().catch(() => ({}));
        service.available = true;
        service.responseTime = Date.now() - startTime;
        service.lastChecked = new Date();
        service.status = data.status || 'healthy';
        
        log.debug(`✅ ${service.name} is available (${service.responseTime}ms)`);
      } else {
        service.available = false;
        service.lastChecked = new Date();
        log.debug(`❌ ${service.name} returned ${response.status}`);
      }
    } catch (error) {
      service.available = false;
      service.lastChecked = new Date();
      service.responseTime = null;
      
      if (error.name !== 'AbortError') {
        log.debug(`❌ ${service.name} health check failed: ${error.message}`);
      }
    }
  }

  /**
   * Check service health using http module (fallback)
   */
  async checkServiceHttp(serviceId) {
    const service = this.services[serviceId];
    if (!service) return;

    const startTime = Date.now();
    
    try {
      const http = require('http');
      const url = require('url');
      const parsedUrl = url.parse(`${service.baseUrl}${service.healthEndpoint}`);
      
      return new Promise((resolve) => {
        const req = http.get({
          hostname: parsedUrl.hostname,
          port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
          path: parsedUrl.path,
          timeout: 5000,
          headers: {
            'Accept': 'application/json'
          }
        }, (res) => {
          if (res.statusCode === 200) {
            service.available = true;
            service.responseTime = Date.now() - startTime;
            service.lastChecked = new Date();
            log.debug(`✅ ${service.name} is available (${service.responseTime}ms)`);
          } else {
            service.available = false;
            service.lastChecked = new Date();
            log.debug(`❌ ${service.name} returned ${res.statusCode}`);
          }
          resolve();
        });

        req.on('error', (error) => {
          service.available = false;
          service.lastChecked = new Date();
          service.responseTime = null;
          log.debug(`❌ ${service.name} health check failed: ${error.message}`);
          resolve();
        });

        req.on('timeout', () => {
          req.destroy();
          service.available = false;
          service.lastChecked = new Date();
          log.debug(`❌ ${service.name} health check timeout`);
          resolve();
        });
      });
    } catch (error) {
      service.available = false;
      service.lastChecked = new Date();
      log.debug(`❌ ${service.name} health check error: ${error.message}`);
    }
  }

  /**
   * Start periodic health checks
   */
  startPeriodicChecks() {
    if (this.checkTimer) {
      clearInterval(this.checkTimer);
    }
    
    this.checkTimer = setInterval(() => {
      this.checkAllServices().catch(err => {
        log.warn('Periodic health check failed:', err.message);
      });
    }, this.checkInterval);
  }

  /**
   * Stop periodic health checks
   */
  stopPeriodicChecks() {
    if (this.checkTimer) {
      clearInterval(this.checkTimer);
      this.checkTimer = null;
    }
  }

  /**
   * Get available services for a capability
   */
  getServicesForCapability(capability) {
    return Object.entries(this.services)
      .filter(([_, service]) => 
        service.available && 
        service.capabilities.includes(capability)
      )
      .map(([id, service]) => ({
        id,
        ...service
      }))
      .sort((a, b) => b.accuracy - a.accuracy); // Best accuracy first
  }

  /**
   * Get best service for a capability
   */
  getBestServiceForCapability(capability) {
    const services = this.getServicesForCapability(capability);
    return services.length > 0 ? services[0] : null;
  }

  /**
   * Get service status
   */
  getServiceStatus(serviceId) {
    return this.services[serviceId] || null;
  }

  /**
   * Get all service statuses
   */
  getAllServiceStatuses() {
    return Object.entries(this.services).map(([id, service]) => ({
      id,
      name: service.name,
      available: service.available,
      accuracy: service.accuracy,
      capabilities: service.capabilities,
      responseTime: service.responseTime,
      lastChecked: service.lastChecked
    }));
  }

  /**
   * Check if any service is available
   */
  hasAnyServiceAvailable() {
    return Object.values(this.services).some(s => s.available);
  }

  /**
   * Get service statistics
   */
  getStatistics() {
    const services = Object.values(this.services);
    const available = services.filter(s => s.available);
    const unavailable = services.filter(s => !s.available);
    
    return {
      total: services.length,
      available: available.length,
      unavailable: unavailable.length,
      availabilityRate: available.length / services.length,
      averageResponseTime: available.length > 0
        ? available.reduce((sum, s) => sum + (s.responseTime || 0), 0) / available.length
        : null,
      services: {
        available: available.map(s => ({
          name: s.name,
          accuracy: s.accuracy,
          responseTime: s.responseTime
        })),
        unavailable: unavailable.map(s => ({
          name: s.name,
          accuracy: s.accuracy
        }))
      }
    };
  }
}

// Singleton instance
let serviceDiscoveryInstance = null;

function getServiceDiscovery() {
  if (!serviceDiscoveryInstance) {
    serviceDiscoveryInstance = new ServiceDiscovery();
  }
  return serviceDiscoveryInstance;
}

module.exports = {
  getServiceDiscovery,
  ServiceDiscovery
};

