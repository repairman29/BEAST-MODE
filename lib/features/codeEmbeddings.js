/**
 * Code Embeddings Service
 * Integrates CodeBERT and other code embedding models
 * 
 * Month 1: Week 2 - Code Embeddings
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
const path = require('path');
const log = createLogger('CodeEmbeddings');

// Try to use unified embeddings (preferred)
let getUnifiedEmbeddings = null;
try {
    const unifiedEmbeddingsPath = path.join(__dirname, '../../../shared-utils/unified-embeddings');
    const unifiedEmbeddings = require(unifiedEmbeddingsPath);
    getUnifiedEmbeddings = unifiedEmbeddings.getUnifiedEmbeddings;
} catch (error) {
    log.debug('Unified embeddings not available, using echeo:', error.message);
}

// Fallback to echeo integrations
let getEcheoIntegrations = null;
try {
    const echeoPath = path.join(__dirname, '../../echeo-integrations');
    const { getEcheoIntegrations: getEcheo } = require(echeoPath);
    getEcheoIntegrations = getEcheo;
} catch (error) {
    log.debug('Echeo integrations not available:', error.message);
}

class CodeEmbeddingsService {
    constructor() {
        this.initialized = false;
        this.model = null;
        this.tokenizer = null;
        this.embeddingCache = new Map();
        this.useLocal = true; // Use local implementation if transformers not available
        this.unifiedEmbeddings = null; // Unified embeddings (preferred)
        this.echeo = null; // Echeo integrations (fallback)
        
        // Initialize echeo if available
        if (getEcheoIntegrations) {
            this.echeo = getEcheoIntegrations({ useOllama: true });
        }
    }

    /**
     * Initialize code embeddings service
     */
    async initialize() {
        if (this.initialized) return;

        try {
            // Initialize unified embeddings if available
            if (getUnifiedEmbeddings) {
                try {
                    this.unifiedEmbeddings = await getUnifiedEmbeddings({ preferred: 'ollama' });
                    log.info('✅ Unified embeddings initialized');
                } catch (error) {
                    log.warn('Unified embeddings initialization failed, using fallback:', error.message);
                }
            }

            // Try to load transformers (if available)
            await this.loadTransformers();
            this.initialized = true;
            log.info('✅ Code embeddings service initialized');
        } catch (error) {
            log.warn('Transformers not available, using local embeddings:', error.message);
            this.useLocal = true;
            this.initialized = true;
        }
    }

    /**
     * Load transformers library (if available)
     */
    async loadTransformers() {
        try {
            // Check if we can use Python transformers via subprocess
            // For now, we'll use a local implementation
            this.useLocal = true;
            log.info('Using local code embedding implementation');
        } catch (error) {
            throw new Error('Transformers not available');
        }
    }

    /**
     * Generate code embedding
     * Uses unified embeddings (Ollama-first, OpenAI fallback)
     */
    async generateEmbedding(code, options = {}) {
        const {
            model = 'codebert',
            cache = true,
            maxLength = 512,
            useOllama = true // Try Ollama first if available
        } = options;

        // Check cache
        const cacheKey = `${model}_${this.hashCode(code)}`;
        if (cache && this.embeddingCache.has(cacheKey)) {
            return this.embeddingCache.get(cacheKey);
        }

        const startTime = Date.now();
        let embedding;

        // Try unified embeddings first (preferred)
        if (this.unifiedEmbeddings && useOllama) {
            try {
                const result = await this.unifiedEmbeddings.generate(code, {
                    dimension: maxLength,
                    cache: cache
                });

                if (result && result.embedding) {
                    const executionTime = Date.now() - startTime;
                    
                    // Track cost
                    await this.trackEmbeddingCost(result.source, executionTime, result.model || 'nomic-embed-text', 0, 0);

                    // Cache result
                    if (cache) {
                        this.embeddingCache.set(cacheKey, result.embedding);
                    }

                    log.debug(`[CodeEmbeddings] Using ${result.source} embedding (${executionTime}ms)`);
                    return result.embedding;
                }
            } catch (error) {
                log.debug('[CodeEmbeddings] Unified embeddings failed, trying echeo:', error.message);
            }
        }

        // Fallback to echeo integrations
        if (useOllama && this.echeo && this.echeo.ollama) {
            try {
                const ollamaEmbedding = await this.echeo.generateEmbedding(code, {
                    model: 'nomic-embed-text'
                });
                
                if (ollamaEmbedding && ollamaEmbedding.embedding) {
                    // Ensure dimension matches (pad or truncate if needed)
                    let vector = ollamaEmbedding.embedding;
                    if (vector.length !== maxLength) {
                        if (vector.length > maxLength) {
                            vector = vector.slice(0, maxLength);
                        } else {
                            // Pad with zeros if smaller
                            while (vector.length < maxLength) {
                                vector.push(0);
                            }
                        }
                    }
                    
                    const executionTime = Date.now() - startTime;
                    await this.trackEmbeddingCost('ollama', executionTime, ollamaEmbedding.model || 'nomic-embed-text', 0, 0);

                    // Cache result
                    if (cache) {
                        this.embeddingCache.set(cacheKey, vector);
                    }

                    log.debug(`[CodeEmbeddings] Using Ollama embedding (${executionTime}ms)`);
                    return vector;
                }
            } catch (error) {
                log.debug('[CodeEmbeddings] Ollama embedding failed, using fallback:', error.message);
            }
        }

        // Fallback to local or transformers
        if (!embedding) {
            if (this.useLocal) {
                // Generate local embedding (simplified)
                embedding = this.generateLocalEmbedding(code, maxLength);
            } else {
                // Use transformers (if available)
                embedding = await this.generateTransformerEmbedding(code, model, maxLength);
            }
        }

        // Cache result
        if (cache) {
            this.embeddingCache.set(cacheKey, embedding);
        }

        return embedding;
    }

    /**
     * Track embedding cost (unified)
     */
    async trackEmbeddingCost(source, executionTime, model, costUsd = 0, tokensUsed = 0) {
        try {
            const costTrackingPath = path.join(__dirname, '../../../shared-utils/cost-tracking');
            const { getCostTrackingService } = require(costTrackingPath);
            const costTracking = getCostTrackingService();
            await costTracking.trackCost({
                service: source,
                operationType: 'embedding',
                costUsd: costUsd,
                tokensUsed: tokensUsed,
                cacheUsed: false,
                metadata: {
                    model: model,
                    executionTimeMs: executionTime,
                    source: source,
                    serviceName: 'beast-mode'
                }
            });
        } catch (error) {
            // Cost tracking not available, continue
            log.debug('Cost tracking not available:', error.message);
        }
    }

    /**
     * Generate local embedding (simplified version)
     * In production, this would use CodeBERT via Python bridge
     */
    generateLocalEmbedding(code, maxLength) {
        // Simplified embedding based on code characteristics
        // In production, this would call CodeBERT
        
        // Extract code features
        const features = this.extractCodeFeatures(code);
        
        // Create embedding vector (512 dimensions to match CodeBERT)
        const embedding = new Array(512).fill(0);
        
        // Map features to embedding dimensions
        let idx = 0;
        for (const [key, value] of Object.entries(features)) {
            if (idx >= embedding.length) break;
            
            // Normalize value to -1 to 1 range
            const normalized = (value / 100) * 2 - 1;
            embedding[idx] = normalized;
            idx++;
        }

        // Add some randomness based on code hash for diversity
        const codeHash = this.hashCode(code);
        for (let i = idx; i < embedding.length; i++) {
            embedding[i] = (codeHash % 1000) / 1000 - 0.5;
        }

        return {
            embedding: embedding,
            dimensions: embedding.length,
            model: 'local-codebert',
            source: 'local'
        };
    }

    /**
     * Extract code features for embedding
     */
    extractCodeFeatures(code) {
        if (!code || typeof code !== 'string') {
            return {
                length: 0,
                complexity: 0,
                functions: 0,
                variables: 0,
                comments: 0
            };
        }

        const lines = code.split('\n');
        const functions = (code.match(/function\s+\w+|const\s+\w+\s*=\s*\(/g) || []).length;
        const variables = (code.match(/const\s+\w+|let\s+\w+|var\s+\w+/g) || []).length;
        const comments = (code.match(/\/\/|\/\*|\*\//g) || []).length;
        const complexity = this.calculateComplexity(code);

        return {
            length: code.length,
            lines: lines.length,
            complexity: complexity,
            functions: functions,
            variables: variables,
            comments: comments,
            avgLineLength: code.length / Math.max(lines.length, 1)
        };
    }

    /**
     * Calculate code complexity
     */
    calculateComplexity(code) {
        let complexity = 1; // Base complexity

        // Add complexity for control structures
        complexity += (code.match(/if\s*\(|else\s*\{|switch\s*\(/g) || []).length;
        complexity += (code.match(/for\s*\(|while\s*\(|do\s*\{/g) || []).length;
        complexity += (code.match(/try\s*\{|catch\s*\(/g) || []).length;
        complexity += (code.match(/await\s+|async\s+/g) || []).length;

        return Math.min(100, complexity * 10); // Cap at 100
    }

    /**
     * Generate transformer embedding (placeholder for Python integration)
     */
    async generateTransformerEmbedding(code, model, maxLength) {
        // This would call Python transformers in production
        // For now, fall back to local
        return this.generateLocalEmbedding(code, maxLength);
    }

    /**
     * Calculate similarity between two embeddings
     */
    calculateSimilarity(embedding1, embedding2) {
        if (!embedding1 || !embedding2) return 0;
        if (!embedding1.embedding || !embedding2.embedding) return 0;

        const vec1 = embedding1.embedding;
        const vec2 = embedding2.embedding;

        if (vec1.length !== vec2.length) return 0;

        // Cosine similarity
        let dotProduct = 0;
        let norm1 = 0;
        let norm2 = 0;

        for (let i = 0; i < vec1.length; i++) {
            dotProduct += vec1[i] * vec2[i];
            norm1 += vec1[i] * vec1[i];
            norm2 += vec2[i] * vec2[i];
        }

        const similarity = dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
        return Math.max(0, Math.min(1, similarity)); // Clamp to 0-1
    }

    /**
     * Batch generate embeddings
     */
    async generateBatchEmbeddings(codes, options = {}) {
        const embeddings = [];

        for (const code of codes) {
            const embedding = await this.generateEmbedding(code, options);
            embeddings.push(embedding);
        }

        return embeddings;
    }

    /**
     * Hash code for caching
     */
    hashCode(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash);
    }

    /**
     * Clear embedding cache
     */
    clearCache() {
        this.embeddingCache.clear();
        log.info('Embedding cache cleared');
    }

    /**
     * Get cache statistics
     */
    getCacheStats() {
        return {
            size: this.embeddingCache.size,
            memoryEstimate: this.embeddingCache.size * 512 * 4 // Rough estimate in bytes
        };
    }
}

// Singleton instance
let codeEmbeddingsInstance = null;

async function getCodeEmbeddingsService() {
    if (!codeEmbeddingsInstance) {
        codeEmbeddingsInstance = new CodeEmbeddingsService();
        await codeEmbeddingsInstance.initialize();
    }
    return codeEmbeddingsInstance;
}

module.exports = {
    CodeEmbeddingsService,
    getCodeEmbeddingsService
};

