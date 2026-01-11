/**
 * Service Router
 * Context-aware routing to best available ML service
 * 
 * Routes predictions to specialized services when available,
 * falls back to BEAST MODE ML or heuristics
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
const { getServiceDiscovery } = require('./serviceDiscovery');
const { getServiceClientManager } = require('./serviceClients');
const log = createLogger('ServiceRouter');

class ServiceRouter {
  constructor() {
    this.discovery = getServiceDiscovery();
    this.clients = getServiceClientManager();
    this.initialized = false;
  }

  /**
   * Initialize router
   */
  async initialize() {
    if (this.initialized) return;
    
    await this.discovery.initialize();
    await this.clients.initialize();
    
    this.initialized = true;
    log.info('✅ Service router initialized');
  }

  /**
   * Detect prediction type from context
   */
  detectPredictionType(context) {
    // Code quality predictions
    if (context.code || context.filePath || context.actionType === 'code-review') {
      return 'code-quality';
    }

    // Knowledge search
    if (context.query || context.search || context.actionType === 'knowledge-search') {
      return 'knowledge-search';
    }

    // Workflow quality
    if (context.workflow || context.taskSequence || context.actionType === 'workflow') {
      return 'workflow-quality';
    }

    // Narrative quality
    if (context.narrative || context.story || context.actionType === 'narrative') {
      return 'narrative-quality';
    }

    // Dice roll / game action
    if (context.statValue !== undefined || context.rollType || context.actionType === 'dice-roll') {
      return 'game-action';
    }

    // Default: general quality
    return 'general-quality';
  }

  /**
   * Route prediction to best available service
   */
  async routePrediction(context, fallbackPredictor) {
    await this.initialize();

    const predictionType = this.detectPredictionType(context);
    log.debug(`Routing ${predictionType} prediction`);

    try {
      // Try specialized service first
      const result = await this.trySpecializedService(predictionType, context);
      if (result) {
        return {
          ...result,
          routed: true,
          service: result.source,
          predictionType
        };
      }
    } catch (error) {
      log.debug(`Specialized service failed: ${error.message}`);
    }

    // Fall back to BEAST MODE ML or heuristics
    log.debug('Falling back to BEAST MODE ML/heuristics');
    const fallbackResult = await fallbackPredictor(context);
    
    return {
      ...fallbackResult,
      routed: false,
      service: fallbackResult.source || 'beast-mode',
      predictionType,
      fallbackReason: 'specialized-service-unavailable'
    };
  }

  /**
   * Try specialized service for prediction type
   */
  async trySpecializedService(predictionType, context) {
    switch (predictionType) {
      case 'code-quality':
        return await this.tryCodeRoach(context);
      
      case 'knowledge-search':
        return await this.tryOracle(context);
      
      case 'workflow-quality':
        return await this.tryDaisyChain(context);
      
      case 'narrative-quality':
        return await this.tryAIGM(context);
      
      default:
        return null;
    }
  }

  /**
   * Try Code Roach for code quality
   */
  async tryCodeRoach(context) {
    const client = this.clients.getCodeRoach();
    if (!client) return null;

    const code = context.code || context.content;
    if (!code) return null;

    const result = await client.predictCodeQuality(code, context);
    
    return {
      predictedQuality: result.qualityScore,
      confidence: result.confidence,
      source: 'code-roach',
      method: result.method,
      factors: result.factors
    };
  }

  /**
   * Try Oracle for knowledge search
   */
  async tryOracle(context) {
    const client = this.clients.getOracle();
    if (!client) return null;

    const query = context.query || context.search;
    if (!query) return null;

    // If it's a quality prediction for an answer
    if (context.answer) {
      const result = await client.predictAnswerQuality(query, context.answer, context);
      return {
        predictedQuality: result.quality,
        confidence: result.confidence,
        source: 'oracle',
        relevance: result.relevance
      };
    }

    // Otherwise, search knowledge
    const result = await client.searchKnowledge(query, context);
    return {
      predictedQuality: result.relevance,
      confidence: result.confidence,
      source: 'oracle',
      method: result.method,
      mlEnhanced: result.mlEnhanced
    };
  }

  /**
   * Try Daisy Chain for workflow quality
   */
  async tryDaisyChain(context) {
    const client = this.clients.getDaisyChain();
    if (!client) return null;

    const workflow = context.workflow || context.taskSequence;
    if (!workflow) return null;

    const result = await client.predictWorkflowQuality(workflow, context);
    
    return {
      predictedQuality: result.quality,
      confidence: result.confidence,
      source: 'daisy-chain'
    };
  }

  /**
   * Try AI GM for narrative quality
   */
  async tryAIGM(context) {
    const client = this.clients.getAIGM();
    if (!client) return null;

    const narrative = context.narrative || context.story || context.content;
    if (!narrative) return null;

    const result = await client.predictNarrativeQuality(narrative, context);
    
    return {
      predictedQuality: result.quality,
      confidence: result.confidence,
      source: 'ai-gm'
    };
  }

  /**
   * Get routing statistics
   */
  getRoutingStatistics() {
    const stats = this.discovery.getStatistics();
    return {
      services: stats,
      routingCapabilities: {
        'code-quality': this.clients.isServiceAvailable('code-roach'),
        'knowledge-search': this.clients.isServiceAvailable('oracle'),
        'workflow-quality': this.clients.isServiceAvailable('daisy-chain'),
        'narrative-quality': this.clients.isServiceAvailable('ai-gm')
      }
    };
  }
}

// Singleton instance
let serviceRouterInstance = null;

function getServiceRouter() {
  if (!serviceRouterInstance) {
    serviceRouterInstance = new ServiceRouter();
  }
  return serviceRouterInstance;
}

module.exports = {
  getServiceRouter,
  ServiceRouter
};

