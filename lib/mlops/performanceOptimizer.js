/**
 * Performance Optimizer
 * Optimizes ML system performance through caching, batching, and resource management
 * 
 * Month 3: Week 2 - Performance Optimization
 */

const { createLogger } = require('../utils/logger');
const { getPredictionCache } = require('./predictionCache');
const { getBatchPredictor } = require('./batchPredictor');
const log = createLogger('PerformanceOptimizer');

class PerformanceOptimizer {
    constructor() {
        this.cache = null;
        this.batchPredictor = null;
        this.metrics = {
            cacheHits: 0,
            cacheMisses: 0,
            batchProcessed: 0,
            optimizations: []
        };
        this.initialized = false;
    }

    /**
     * Initialize optimizer
     */
    async initialize() {
        if (this.initialized) return;

        try {
            this.cache = getPredictionCache();
            this.batchPredictor = getBatchPredictor();
            this.initialized = true;
            log.info('✅ Performance optimizer initialized');
        } catch (error) {
            log.warn('Performance optimizer initialization failed:', error.message);
            this.initialized = true; // Mark as initialized to prevent retries
        }
    }

    /**
     * Optimize prediction with caching
     */
    async optimizePrediction(predictFn, context, options = {}) {
        await this.initialize();

        const useCache = options.useCache !== false;
        const cacheKey = this.generateCacheKey(context);

        // Try cache first
        if (useCache && this.cache) {
            const cached = this.cache.get(cacheKey);
            if (cached) {
                this.metrics.cacheHits++;
                log.debug(`[Performance] Cache hit for key: ${cacheKey}`);
                return {
                    ...cached,
                    source: 'cache',
                    cached: true
                };
            }
            this.metrics.cacheMisses++;
        }

        // Execute prediction
        const startTime = Date.now();
        const prediction = await predictFn(context);
        const latency = Date.now() - startTime;

        // Cache result if successful
        if (useCache && this.cache && prediction) {
            this.cache.set(cacheKey, prediction, options.cacheTTL || 3600);
        }

        return {
            ...prediction,
            source: prediction.source || 'optimized',
            cached: false,
            latency
        };
    }

    /**
     * Optimize batch predictions
     */
    async optimizeBatch(predictFn, contexts, options = {}) {
        await this.initialize();

        if (!this.batchPredictor || contexts.length === 0) {
            // Fallback to sequential
            const results = [];
            for (const context of contexts) {
                const result = await this.optimizePrediction(predictFn, context, options);
                results.push(result);
            }
            return results;
        }

        // Use batch predictor
        const startTime = Date.now();
        const batchResults = await this.batchPredictor.predictBatch(
            contexts.map(c => ({ context: c })),
            {
                useCache: options.useCache !== false,
                useEnsemble: options.useEnsemble !== false,
                ...options
            }
        );
        const latency = Date.now() - startTime;

        this.metrics.batchProcessed += contexts.length;

        return {
            results: batchResults.results || [],
            stats: {
                ...batchResults.stats,
                latency,
                avgLatency: latency / contexts.length
            }
        };
    }

    /**
     * Generate cache key from context
     */
    generateCacheKey(context) {
        const keyParts = [
            context.provider || 'unknown',
            context.model || 'unknown',
            context.actionType || 'unknown',
            context.scenarioId || 'default',
            context.rollType || 'unknown',
            context.statName || 'unknown',
            context.statValue || '0'
        ];
        return keyParts.join(':');
    }

    /**
     * Optimize feature extraction
     */
    optimizeFeatureExtraction(context) {
        // Cache feature extraction results
        const featureCache = new Map();
        const cacheKey = JSON.stringify(context);

        if (featureCache.has(cacheKey)) {
            return featureCache.get(cacheKey);
        }

        // Extract features (simplified for performance)
        const features = {
            provider: this.mapProviderToScore(context.provider),
            model: this.mapModelToScore(context.model),
            actionType: this.mapActionTypeToScore(context.actionType),
            statValue: context.statValue || 5
        };

        // Cache for this request
        featureCache.set(cacheKey, features);

        return features;
    }

    /**
     * Map provider to score (optimized lookup)
     */
    mapProviderToScore(provider) {
        const scores = {
            'openai': 85,
            'anthropic': 88,
            'gemini': 82,
            'mistral': 80,
            'together': 78,
            'groq': 75,
            'code-roach': 75,
            'first-mate': 70
        };
        return scores[provider] || 75;
    }

    /**
     * Map model to score (optimized lookup)
     */
    mapModelToScore(model) {
        if (!model) return 70;
        if (model.includes('gpt-4') || model.includes('claude-opus')) return 90;
        if (model.includes('ft:') || model.includes('fine-tuned')) return 85;
        return 70;
    }

    /**
     * Map action type to score (optimized lookup)
     */
    mapActionTypeToScore(actionType) {
        if (!actionType) return 75;
        if (actionType.includes('critical') || actionType.includes('combat')) return 90;
        return 75;
    }

    /**
     * Get performance metrics
     */
    getMetrics() {
        const totalRequests = this.metrics.cacheHits + this.metrics.cacheMisses;
        const cacheHitRate = totalRequests > 0 
            ? (this.metrics.cacheHits / totalRequests) * 100 
            : 0;

        return {
            cache: {
                hits: this.metrics.cacheHits,
                misses: this.metrics.cacheMisses,
                hitRate: cacheHitRate.toFixed(2) + '%',
                totalRequests
            },
            batch: {
                processed: this.metrics.batchProcessed
            },
            optimizations: this.metrics.optimizations.length
        };
    }

    /**
     * Clear cache
     */
    clearCache() {
        if (this.cache) {
            this.cache.clear();
            log.info('Cache cleared');
        }
    }

    /**
     * Get optimization recommendations
     */
    getRecommendations() {
        const recommendations = [];
        const metrics = this.getMetrics();

        // Cache recommendations
        if (metrics.cache.hitRate < 50) {
            recommendations.push({
                type: 'cache',
                priority: 'medium',
                message: `Cache hit rate is ${metrics.cache.hitRate}. Consider increasing cache TTL or improving cache key generation.`,
                impact: 'medium'
            });
        }

        // Batch recommendations
        if (metrics.batch.processed === 0) {
            recommendations.push({
                type: 'batch',
                priority: 'low',
                message: 'No batch processing detected. Consider batching multiple predictions for better performance.',
                impact: 'low'
            });
        }

        return recommendations;
    }
}

// Singleton instance
let performanceOptimizerInstance = null;

function getPerformanceOptimizer() {
    if (!performanceOptimizerInstance) {
        performanceOptimizerInstance = new PerformanceOptimizer();
    }
    return performanceOptimizerInstance;
}

module.exports = {
    PerformanceOptimizer,
    getPerformanceOptimizer
};

