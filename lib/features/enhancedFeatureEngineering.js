/**
 * Enhanced Feature Engineering
 * Advanced feature extraction and engineering
 * 
 * Month 1: Week 2 - Enhanced Features
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
const { getCodeEmbeddingsService } = require('./codeEmbeddings');
const log = createLogger('EnhancedFeatureEngineering');

class EnhancedFeatureEngineering {
    constructor() {
        this.codeEmbeddings = null;
        this.historicalData = new Map();
        this.providerEmbeddings = new Map();
        this.initialized = false;
    }

    /**
     * Initialize enhanced feature engineering
     */
    async initialize() {
        if (this.initialized) return;

        try {
            this.codeEmbeddings = await getCodeEmbeddingsService();
            await this.initializeProviderEmbeddings();
            this.initialized = true;
            log.info('✅ Enhanced feature engineering initialized');
        } catch (error) {
            log.warn('Enhanced features initialization failed:', error.message);
            this.initialized = true; // Continue with basic features
        }
    }

    /**
     * Initialize provider embeddings
     */
    async initializeProviderEmbeddings() {
        // Create embeddings for each provider based on historical performance
        const providers = ['openai', 'anthropic', 'gemini', 'mistral', 'together', 'groq'];
        
        // Simple embedding: [quality_score, speed_score, cost_score, reliability_score]
        const providerScores = {
            'openai': [0.90, 0.85, 0.60, 0.95],
            'anthropic': [0.95, 0.80, 0.50, 0.95],
            'gemini': [0.85, 0.90, 0.70, 0.90],
            'mistral': [0.80, 0.85, 0.85, 0.85],
            'together': [0.75, 0.75, 0.90, 0.80],
            'groq': [0.70, 0.95, 0.95, 0.75]
        };

        for (const provider of providers) {
            this.providerEmbeddings.set(provider, providerScores[provider] || [0.75, 0.75, 0.75, 0.75]);
        }
    }

    /**
     * Extract enhanced features from sample
     */
    async extractEnhancedFeatures(sample, context = {}) {
        const features = {
            // Basic features
            ...this.extractBasicFeatures(sample),
            
            // Provider features
            ...await this.extractProviderFeatures(context),
            
            // Historical features
            ...this.extractHistoricalFeatures(sample, context),
            
            // Temporal features
            ...this.extractTemporalFeatures(sample),
            
            // Code embedding features (if code available)
            ...await this.extractCodeEmbeddingFeatures(sample, context)
        };

        return features;
    }

    /**
     * Extract basic features
     */
    extractBasicFeatures(sample) {
        const sampleFeatures = sample.features || {};
        
        return {
            codeQuality: sampleFeatures.codeQuality || 0,
            testCoverage: sampleFeatures.testCoverage || 0,
            security: sampleFeatures.security || 0,
            performance: sampleFeatures.performance || 0,
            maintainability: sampleFeatures.maintainability || 0,
            complexity: sampleFeatures.complexity || 0,
            csat: sample.csat || 0
        };
    }

    /**
     * Extract provider-specific features
     */
    async extractProviderFeatures(context) {
        const provider = context.provider;
        const model = context.model;

        const features = {};

        if (provider) {
            const embedding = this.providerEmbeddings.get(provider);
            if (embedding) {
                features.provider_quality = embedding[0];
                features.provider_speed = embedding[1];
                features.provider_cost = embedding[2];
                features.provider_reliability = embedding[3];
            }
        }

        // Model-specific features
        if (model) {
            features.model_finetuned = model.includes('ft:') || model.includes('fine-tuned') ? 1 : 0;
            features.model_size = this.estimateModelSize(model);
        }

        return features;
    }

    /**
     * Estimate model size based on name
     */
    estimateModelSize(model) {
        if (model.includes('70b') || model.includes('70B')) return 70;
        if (model.includes('13b') || model.includes('13B')) return 13;
        if (model.includes('7b') || model.includes('7B')) return 7;
        if (model.includes('3b') || model.includes('3B')) return 3;
        return 1; // Default small model
    }

    /**
     * Extract historical performance features
     */
    extractHistoricalFeatures(sample, context) {
        const features = {};

        // Get historical performance for this provider/model combination
        const key = `${context.provider}_${context.model}`;
        const historical = this.historicalData.get(key);

        if (historical) {
            features.historical_avg_quality = historical.avgQuality || 0;
            features.historical_avg_csat = historical.avgCSAT || 0;
            features.historical_sample_count = historical.count || 0;
            features.historical_consistency = historical.consistency || 0;
        } else {
            features.historical_avg_quality = 0.75; // Default
            features.historical_avg_csat = 0.75;
            features.historical_sample_count = 0;
            features.historical_consistency = 0.5;
        }

        return features;
    }

    /**
     * Extract temporal features
     */
    extractTemporalFeatures(sample) {
        const features = {};
        const timestamp = sample.timestamp ? new Date(sample.timestamp) : new Date();

        // Time of day (0-1, normalized)
        const hour = timestamp.getHours();
        features.time_of_day = hour / 24;

        // Day of week (0-1, normalized)
        const dayOfWeek = timestamp.getDay();
        features.day_of_week = dayOfWeek / 7;

        // Recency (days since sample, normalized)
        const daysSince = (Date.now() - timestamp.getTime()) / (1000 * 60 * 60 * 24);
        features.recency = Math.max(0, Math.min(1, 1 - (daysSince / 90))); // 90 day window

        return features;
    }

    /**
     * Extract code embedding features
     */
    async extractCodeEmbeddingFeatures(sample, context) {
        const features = {};

        // If we have code context, generate embeddings
        if (context.code || sample.code) {
            try {
                const code = context.code || sample.code;
                const embedding = await this.codeEmbeddings.generateEmbedding(code, {
                    maxLength: 512,
                    cache: true
                });

                // Use first 10 dimensions as features (to avoid too many features)
                if (embedding && embedding.embedding) {
                    for (let i = 0; i < Math.min(10, embedding.embedding.length); i++) {
                        features[`code_embedding_${i}`] = embedding.embedding[i];
                    }
                }
            } catch (error) {
                log.debug('Code embedding extraction failed:', error.message);
            }
        }

        return features;
    }

    /**
     * Update historical data
     */
    updateHistoricalData(provider, model, quality, csat) {
        const key = `${provider}_${model}`;
        
        if (!this.historicalData.has(key)) {
            this.historicalData.set(key, {
                count: 0,
                totalQuality: 0,
                totalCSAT: 0,
                qualities: [],
                csats: []
            });
        }

        const historical = this.historicalData.get(key);
        historical.count++;
        historical.totalQuality += quality;
        historical.totalCSAT += csat;
        historical.qualities.push(quality);
        historical.csats.push(csat);

        // Keep only last 100 samples
        if (historical.qualities.length > 100) {
            historical.qualities.shift();
            historical.csats.shift();
        }

        // Update averages
        historical.avgQuality = historical.totalQuality / historical.count;
        historical.avgCSAT = historical.totalCSAT / historical.count;

        // Calculate consistency (lower std dev = higher consistency)
        const qualityStdDev = this.calculateStdDev(historical.qualities);
        historical.consistency = Math.max(0, 1 - (qualityStdDev / 0.5)); // Normalize to 0-1
    }

    /**
     * Calculate standard deviation
     */
    calculateStdDev(values) {
        if (values.length === 0) return 0;
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        return Math.sqrt(variance);
    }

    /**
     * Get feature importance scores
     */
    getFeatureImportance() {
        // Return feature importance based on domain knowledge
        return {
            // High importance
            codeQuality: 0.25,
            testCoverage: 0.20,
            security: 0.20,
            historical_avg_quality: 0.15,
            
            // Medium importance
            performance: 0.10,
            maintainability: 0.10,
            provider_quality: 0.08,
            csat: 0.05,
            
            // Lower importance
            complexity: 0.05,
            temporal_features: 0.02,
            code_embeddings: 0.05
        };
    }
}

// Singleton instance
let enhancedFeaturesInstance = null;

async function getEnhancedFeatureEngineering() {
    if (!enhancedFeaturesInstance) {
        enhancedFeaturesInstance = new EnhancedFeatureEngineering();
        await enhancedFeaturesInstance.initialize();
    }
    return enhancedFeaturesInstance;
}

module.exports = {
    EnhancedFeatureEngineering,
    getEnhancedFeatureEngineering
};

