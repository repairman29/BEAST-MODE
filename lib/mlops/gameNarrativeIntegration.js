/**
 * Game Narrative ML Integration
 * Integrates ML quality predictions into main game application
 * 
 * Month 4: Week 1 - Main Game App Integration
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
const log = createLogger('GameNarrativeIntegration');

class GameNarrativeIntegration {
    constructor() {
        this.mlIntegration = null;
        this.ensemble = null;
        this.initialized = false;
    }

    /**
     * Initialize ML integration
     */
    async initialize() {
        if (this.initialized) return;

        try {
            const path = require('path');
            const possiblePaths = [
                path.join(__dirname, '../lib/mlops/mlModelIntegration'),
                path.join(process.cwd(), 'BEAST-MODE-PRODUCT/lib/mlops/mlModelIntegration'),
                path.join(process.cwd(), '../BEAST-MODE-PRODUCT/lib/mlops/mlModelIntegration')
            ];

            for (const mlPath of possiblePaths) {
                try {
                    delete require.cache[require.resolve(mlPath)];
                    const { getMLModelIntegration } = require(mlPath);
                    this.mlIntegration = await getMLModelIntegration();
                    
                    if (this.mlIntegration && this.mlIntegration.isMLModelAvailable()) {
                        log.info('✅ ML model integration loaded for game narratives');
                        break;
                    }
                } catch (error) {
                    // Try next path
                }
            }

            // Try to load ensemble predictor
            try {
                const ensemblePath = path.join(__dirname, '../lib/mlops/ensemblePredictor');
                const { getEnsemblePredictor } = require(ensemblePath);
                this.ensemble = await getEnsemblePredictor();
                log.info('✅ Ensemble predictor loaded for game narratives');
            } catch (error) {
                log.debug('Ensemble predictor not available:', error.message);
            }

            this.initialized = true;
        } catch (error) {
            log.warn('ML integration initialization failed:', error.message);
            this.initialized = true;
        }
    }

    /**
     * Predict narrative quality before generation
     */
    async predictNarrativeQuality(context) {
        await this.initialize();

        if (!this.mlIntegration || !this.mlIntegration.isMLModelAvailable()) {
            return null;
        }

        try {
            const prediction = this.mlIntegration.predictQualitySync({
                serviceName: 'game-app',
                provider: context.provider || 'game-app',
                model: context.model || 'narrative',
                actionType: context.actionType || 'narrative-generation',
                predictionType: 'narrative-quality',
                scenarioId: context.scenarioId || 'default',
                rollType: context.rollType || 'success',
                statName: context.statName || 'unknown',
                statValue: context.statValue || 5,
                sessionId: context.sessionId,
                narrativeId: context.narrativeId
            });

            return {
                predictedQuality: prediction.predictedQuality,
                confidence: prediction.confidence,
                source: prediction.source,
                shouldRetry: prediction.predictedQuality < 0.7,
                recommendation: this.getRecommendation(prediction.predictedQuality)
            };
        } catch (error) {
            log.warn('Narrative quality prediction failed:', error.message);
            return null;
        }
    }

    /**
     * Get recommendation based on prediction
     */
    getRecommendation(quality) {
        if (quality > 0.8) {
            return 'High quality expected - proceed with generation';
        } else if (quality > 0.6) {
            return 'Good quality expected - proceed';
        } else if (quality > 0.4) {
            return 'Moderate quality - consider retry';
        } else {
            return 'Low quality expected - retry recommended';
        }
    }

    /**
     * Enhance narrative with ensemble prediction
     */
    async enhanceWithEnsemble(narrative, context) {
        await this.initialize();

        if (!this.ensemble) {
            return narrative;
        }

        try {
            const features = this.extractNarrativeFeatures(narrative, context);
            const ensembleResult = await this.ensemble.predict(features, 'weighted');

            return {
                ...narrative,
                mlEnhanced: true,
                mlQualityScore: ensembleResult.prediction / 100,
                mlConfidence: ensembleResult.confidence,
                mlModelCount: ensembleResult.modelCount
            };
        } catch (error) {
            log.warn('Ensemble enhancement failed:', error.message);
            return narrative;
        }
    }

    /**
     * Extract features from narrative
     */
    extractNarrativeFeatures(narrative, context) {
        const length = narrative.length || 0;
        const wordCount = narrative.split(/\s+/).length;
        const hasDetails = length > 100;
        const hasAction = /action|move|attempt|try|decide/i.test(narrative);
        const hasContext = /you|your|the|a|an/i.test(narrative);

        return {
            codeQuality: this.mapProviderToQuality(context.provider) || 75,
            testCoverage: this.mapModelToCoverage(context.model) || 70,
            security: this.mapActionTypeToSecurity(context.actionType) || 85,
            performance: this.mapScenarioToPerformance(context.scenarioId) || 80,
            maintainability: this.mapRollTypeToMaintainability(context.rollType) || 75,
            complexity: this.mapStatValueToComplexity(context.statValue) || 50,
            narrativeLength: length,
            wordCount: wordCount,
            hasDetails: hasDetails ? 1 : 0,
            hasAction: hasAction ? 1 : 0,
            hasContext: hasContext ? 1 : 0,
            csat: 0
        };
    }

    /**
     * Map provider to quality score
     */
    mapProviderToQuality(provider) {
        const scores = {
            'openai': 85,
            'anthropic': 88,
            'gemini': 82,
            'mistral': 80,
            'together': 78,
            'groq': 75,
            'game-app': 75
        };
        return scores[provider] || 75;
    }

    /**
     * Map model to coverage score
     */
    mapModelToCoverage(model) {
        if (!model) return 70;
        if (model.includes('gpt-4') || model.includes('claude-opus')) return 90;
        if (model.includes('ft:') || model.includes('fine-tuned')) return 85;
        return 70;
    }

    /**
     * Map action type to security score
     */
    mapActionTypeToSecurity(actionType) {
        if (!actionType) return 85;
        if (actionType.includes('critical') || actionType.includes('combat')) return 90;
        return 85;
    }

    /**
     * Map scenario to performance score
     */
    mapScenarioToPerformance(scenarioId) {
        if (!scenarioId) return 80;
        if (scenarioId.includes('complex') || scenarioId.includes('battle')) return 75;
        return 80;
    }

    /**
     * Map roll type to maintainability score
     */
    mapRollTypeToMaintainability(rollType) {
        if (!rollType) return 75;
        if (rollType.includes('critical-success')) return 85;
        return 75;
    }

    /**
     * Map stat value to complexity score
     */
    mapStatValueToComplexity(statValue) {
        if (statValue === undefined || statValue === null) return 50;
        if (statValue >= 7) return 30;
        if (statValue >= 5) return 50;
        return 70;
    }

    /**
     * Check if ML is available
     */
    isAvailable() {
        return this.mlIntegration && this.mlIntegration.isMLModelAvailable();
    }

    /**
     * Check if ensemble is available
     */
    isEnsembleAvailable() {
        return this.ensemble !== null;
    }
}

// Singleton instance
let gameNarrativeIntegrationInstance = null;

function getGameNarrativeIntegration() {
    if (!gameNarrativeIntegrationInstance) {
        gameNarrativeIntegrationInstance = new GameNarrativeIntegration();
    }
    return gameNarrativeIntegrationInstance;
}

module.exports = {
    GameNarrativeIntegration,
    getGameNarrativeIntegration
};

