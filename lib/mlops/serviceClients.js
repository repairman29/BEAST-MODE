/**
 * Service Client Wrappers
 * HTTP clients for calling specialized ML services
 * 
 * Provides unified interface for:
 * - Code Roach: Code quality predictions
 * - Oracle: Knowledge search & relevance
 * - Daisy Chain: Workflow quality
 * - AI GM: Narrative quality
 */

const { createLogger } = require('../utils/logger');
const { getServiceDiscovery } = require('./serviceDiscovery');
const log = createLogger('ServiceClients');

class ServiceClient {
  constructor(serviceId, serviceConfig) {
    this.serviceId = serviceId;
    this.serviceConfig = serviceConfig;
    this.baseUrl = serviceConfig.baseUrl;
  }

  /**
   * Make HTTP request to service
   */
  async request(endpoint, options = {}) {
    // Use node-fetch if available, otherwise use built-in fetch (Node 18+)
    let fetchFn = global.fetch;
    if (!fetchFn) {
      try {
        fetchFn = require('node-fetch');
      } catch (e) {
        // Fallback to http module
        return await this.requestHttp(endpoint, options);
      }
    }

    const url = `${this.baseUrl}${endpoint}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

    try {
      const response = await fetchFn(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...options.headers
        }
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`Service returned ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeout);
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout to ${this.serviceConfig.name}`);
      }
      throw error;
    }
  }

  /**
   * Make HTTP request using http module (fallback)
   */
  async requestHttp(endpoint, options = {}) {
    const http = require('http');
    const url = require('url');
    const parsedUrl = url.parse(`${this.baseUrl}${endpoint}`);
    
    return new Promise((resolve, reject) => {
      const reqOptions = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
        path: parsedUrl.path,
        method: options.method || 'GET',
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...options.headers
        }
      };

      const req = http.request(reqOptions, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(data));
            } catch (e) {
              resolve(data);
            }
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
          }
        });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      if (options.body) {
        req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
      }
      req.end();
    });
  }
}

/**
 * Code Roach Client
 * Specialized for code quality predictions
 */
class CodeRoachClient extends ServiceClient {
  constructor() {
    const discovery = getServiceDiscovery();
    const service = discovery.getServiceStatus('code-roach');
    super('code-roach', service);
  }

  /**
   * Predict code quality using AST analysis
   */
  async predictCodeQuality(code, context = {}) {
    try {
      const response = await this.request('/api/ml/predict-code-quality', {
        method: 'POST',
        body: JSON.stringify({
          code,
          context: {
            ...context,
            serviceName: 'code-roach',
            predictionType: 'code-quality'
          }
        })
      });

      return {
        qualityScore: response.qualityScore || response.prediction?.predictedQuality || 0.7,
        confidence: response.confidence || 0.8,
        source: 'code-roach',
        method: response.method || 'ast-analysis',
        factors: response.factors || [],
        shouldRetry: response.shouldRetry || false
      };
    } catch (error) {
      log.warn(`Code Roach prediction failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Analyze code with AST
   */
  async analyzeCode(code, options = {}) {
    try {
      const response = await this.request('/api/analyze', {
        method: 'POST',
        body: JSON.stringify({
          code,
          options: {
            useAST: true,
            ...options
          }
        })
      });

      return response;
    } catch (error) {
      log.warn(`Code Roach analysis failed: ${error.message}`);
      throw error;
    }
  }
}

/**
 * Oracle Client
 * Specialized for knowledge search & relevance
 */
class OracleClient extends ServiceClient {
  constructor() {
    const discovery = getServiceDiscovery();
    const service = discovery.getServiceStatus('oracle');
    super('oracle', service);
  }

  /**
   * Search knowledge with semantic understanding
   */
  async searchKnowledge(query, options = {}) {
    try {
      const response = await this.request('/api/knowledge/search', {
        method: 'POST',
        body: JSON.stringify({
          query,
          options: {
            useSemantic: true,
            useML: true,
            ...options
          }
        })
      });

      return {
        results: response.results || [],
        relevance: response.relevance || 0.7,
        confidence: response.confidence || 0.8,
        source: 'oracle',
        method: response.search_method || 'semantic',
        mlEnhanced: response.mlEnhanced || false
      };
    } catch (error) {
      log.warn(`Oracle search failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Predict answer quality
   */
  async predictAnswerQuality(query, answer, context = {}) {
    try {
      const response = await this.request('/api/ml/predict-answer-quality', {
        method: 'POST',
        body: JSON.stringify({
          query,
          answer,
          context: {
            ...context,
            serviceName: 'oracle',
            predictionType: 'answer-quality'
          }
        })
      });

      return {
        quality: response.quality || response.prediction?.predictedQuality || 0.7,
        confidence: response.confidence || 0.8,
        source: 'oracle',
        relevance: response.relevance || 0.7
      };
    } catch (error) {
      log.warn(`Oracle quality prediction failed: ${error.message}`);
      throw error;
    }
  }
}

/**
 * Daisy Chain Client
 * Specialized for workflow quality
 */
class DaisyChainClient extends ServiceClient {
  constructor() {
    const discovery = getServiceDiscovery();
    const service = discovery.getServiceStatus('daisy-chain');
    super('daisy-chain', service);
  }

  /**
   * Predict workflow quality
   */
  async predictWorkflowQuality(workflow, context = {}) {
    try {
      const response = await this.request('/api/ml/predict-quality', {
        method: 'POST',
        body: JSON.stringify({
          workflow,
          context: {
            ...context,
            serviceName: 'daisy-chain',
            predictionType: 'workflow-quality'
          }
        })
      });

      return {
        quality: response.quality || response.prediction?.predictedQuality || 0.7,
        confidence: response.confidence || 0.8,
        source: 'daisy-chain'
      };
    } catch (error) {
      log.warn(`Daisy Chain prediction failed: ${error.message}`);
      throw error;
    }
  }
}

/**
 * AI GM Client
 * Specialized for narrative quality
 */
class AIGMClient extends ServiceClient {
  constructor() {
    const discovery = getServiceDiscovery();
    const service = discovery.getServiceStatus('ai-gm');
    super('ai-gm', service);
  }

  /**
   * Predict narrative quality
   */
  async predictNarrativeQuality(narrative, context = {}) {
    try {
      const response = await this.request('/api/ml/predict-quality', {
        method: 'POST',
        body: JSON.stringify({
          narrative,
          context: {
            ...context,
            serviceName: 'ai-gm',
            predictionType: 'narrative-quality'
          }
        })
      });

      return {
        quality: response.quality || response.prediction?.predictedQuality || 0.7,
        confidence: response.confidence || 0.8,
        source: 'ai-gm'
      };
    } catch (error) {
      log.warn(`AI GM prediction failed: ${error.message}`);
      throw error;
    }
  }
}

/**
 * Unified Service Client Manager
 */
class ServiceClientManager {
  constructor() {
    this.clients = {
      'code-roach': null,
      'oracle': null,
      'daisy-chain': null,
      'ai-gm': null
    };
    this.initialized = false;
  }

  /**
   * Initialize all clients
   */
  async initialize() {
    if (this.initialized) return;

    const discovery = getServiceDiscovery();
    await discovery.initialize();

    // Initialize clients for available services
    for (const serviceId of Object.keys(this.clients)) {
      const service = discovery.getServiceStatus(serviceId);
      if (service && service.available) {
        try {
          switch (serviceId) {
            case 'code-roach':
              this.clients['code-roach'] = new CodeRoachClient();
              break;
            case 'oracle':
              this.clients['oracle'] = new OracleClient();
              break;
            case 'daisy-chain':
              this.clients['daisy-chain'] = new DaisyChainClient();
              break;
            case 'ai-gm':
              this.clients['ai-gm'] = new AIGMClient();
              break;
          }
          log.info(`✅ ${service.name} client initialized`);
        } catch (error) {
          log.warn(`Failed to initialize ${service.name} client: ${error.message}`);
        }
      }
    }

    this.initialized = true;
  }

  /**
   * Get client for a service
   */
  getClient(serviceId) {
    return this.clients[serviceId] || null;
  }

  /**
   * Get Code Roach client
   */
  getCodeRoach() {
    return this.getClient('code-roach');
  }

  /**
   * Get Oracle client
   */
  getOracle() {
    return this.getClient('oracle');
  }

  /**
   * Get Daisy Chain client
   */
  getDaisyChain() {
    return this.getClient('daisy-chain');
  }

  /**
   * Get AI GM client
   */
  getAIGM() {
    return this.getClient('ai-gm');
  }

  /**
   * Check if a service is available
   */
  isServiceAvailable(serviceId) {
    const client = this.getClient(serviceId);
    return client !== null;
  }
}

// Singleton instance
let serviceClientManagerInstance = null;

function getServiceClientManager() {
  if (!serviceClientManagerInstance) {
    serviceClientManagerInstance = new ServiceClientManager();
  }
  return serviceClientManagerInstance;
}

module.exports = {
  getServiceClientManager,
  ServiceClientManager,
  CodeRoachClient,
  OracleClient,
  DaisyChainClient,
  AIGMClient
};

