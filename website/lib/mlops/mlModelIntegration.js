/**
 * ML Model Integration
 * Integrates trained ML models with existing services
 * 
 * Month 1: Integration & Iteration
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
const log = createLogger('MLModelIntegration');

// Optional production monitoring integration
let productionMonitoring = null;
try {
    const { getProductionMonitoring } = require('./productionMonitoring');
    productionMonitoring = getProductionMonitoring();
} catch (error) {
    // Production monitoring not available
}

// Optional database writer integration
let databaseWriter = null;
try {
    const { getDatabaseWriter } = require('./databaseWriter');
    databaseWriter = getDatabaseWriter();
} catch (error) {
    // Database writer not available
}

// Optional advanced ensemble integration
let advancedEnsemble = null;
try {
    const { getAdvancedEnsemble } = require('./advancedEnsemble');
    advancedEnsemble = getAdvancedEnsemble();
} catch (error) {
    // Advanced ensemble not available
}

// Optional ensemble service integration (new Phase 1 service)
let ensembleService = null;
try {
    const { getEnsembleService } = require('./ensembleService');
    ensembleService = getEnsembleService();
} catch (error) {
    // Ensemble service not available
}

// Optional NAS service integration (new Phase 1 service)
let nasService = null;
try {
    const { getNASService } = require('./nasService');
    nasService = getNASService();
} catch (error) {
    // NAS service not available
}

// Optional fine-tuning service integration (new Phase 1 service)
let fineTuningService = null;
try {
    const { getFineTuningService } = require('./fineTuningService');
    fineTuningService = getFineTuningService();
} catch (error) {
    // Fine-tuning service not available
}

// Optional cross-domain service integration (new Phase 1 service)
let crossDomainService = null;
try {
    const { getCrossDomainService } = require('./crossDomainService');
    crossDomainService = getCrossDomainService();
} catch (error) {
    // Cross-domain service not available
}

// Optional advanced caching service integration (new Phase 1 service)
let advancedCachingService = null;
try {
    const { getAdvancedCachingService } = require('./advancedCachingService');
    advancedCachingService = getAdvancedCachingService();
} catch (error) {
    // Advanced caching service not available
}

// Optional federated learning service integration (new Phase 2 service)
let federatedLearningService = null;
try {
    const { getFederatedLearningService } = require('./federatedLearningService');
    federatedLearningService = getFederatedLearningService();
} catch (error) {
    // Federated learning service not available
}

// Optional autonomous evolution service integration (new Phase 2 service)
let autonomousEvolutionService = null;
try {
    const { getAutonomousEvolutionService } = require('./autonomousEvolutionService');
    autonomousEvolutionService = getAutonomousEvolutionService();
} catch (error) {
    // Autonomous evolution service not available
}

// Optional team collaboration service integration (new Phase 3 service)
let teamCollaborationService = null;
try {
    const { getTeamCollaborationService } = require('./teamCollaborationService');
    teamCollaborationService = getTeamCollaborationService();
} catch (error) {
    // Team collaboration service not available
}

// Optional analytics service integration (new Phase 3 service)
let analyticsService = null;
try {
    const { getAnalyticsService } = require('./analyticsService');
    analyticsService = getAnalyticsService();
} catch (error) {
    // Analytics service not available
}

// Optional enterprise service integration (new Phase 3 service)
let enterpriseService = null;
try {
    const { getEnterpriseService } = require('./enterpriseService');
    enterpriseService = getEnterpriseService();
} catch (error) {
    // Enterprise service not available
}

// Optional expanded predictions integration
let expandedPredictions = null;
try {
    const { getExpandedPredictions } = require('./expandedPredictions');
    expandedPredictions = getExpandedPredictions();
} catch (error) {
    // Expanded predictions not available
}

class MLModelIntegration {
    constructor() {
        this.qualityPredictor = null;
        this.modelPath = null;
        this.initialized = false;
    }

    /**
     * Initialize and load trained ML model
     */
    async initialize() {
        if (this.initialized) return;

        try {
            // Initialize advanced ensemble if available
            if (advancedEnsemble) {
                await advancedEnsemble.initialize();
            }

            // Initialize new Phase 1 services if available
            if (ensembleService) {
                await ensembleService.initialize();
            }
            if (nasService) {
                await nasService.initialize();
            }
            if (fineTuningService) {
                await fineTuningService.initialize();
            }
            if (crossDomainService) {
                await crossDomainService.initialize();
            }
            if (advancedCachingService) {
                await advancedCachingService.initialize();
            }

            // Initialize new Phase 2 services if available
            if (federatedLearningService) {
                await federatedLearningService.initialize();
            }
            if (autonomousEvolutionService) {
                await autonomousEvolutionService.initialize();
            }

            // Initialize new Phase 3 services if available
            if (teamCollaborationService) {
                await teamCollaborationService.initialize();
            }
            if (analyticsService) {
                await analyticsService.initialize();
            }
            if (enterpriseService) {
                await enterpriseService.initialize();
            }

            // Initialize expanded predictions if available
            if (expandedPredictions) {
                await expandedPredictions.initialize();
            }
            const path = require('path');
            const fs = require('fs').promises;
            
            // Try to find the trained model (prefer notable quality, then neural network, then transformer, then advanced, then enhanced, then v1)
            // Handle both root directory and website subdirectory
            const rootDir = process.cwd().includes('website') 
                ? path.join(process.cwd(), '..')
                : process.cwd();
            const modelsDir = path.join(rootDir, '.beast-mode/models');
            const cwdModelsDir = path.join(process.cwd(), '.beast-mode/models');
            const libModelsDir = path.join(__dirname, '../../.beast-mode/models');
            
            // First, try to find the latest notable-quality model
            let notableQualityModel = null;
            try {
                const fsSync = require('fs');
                const modelsDirs = [modelsDir, cwdModelsDir, libModelsDir];
                for (const dir of modelsDirs) {
                    if (fsSync.existsSync(dir)) {
                        const files = fsSync.readdirSync(dir)
                            .filter(f => f.startsWith('model-notable-quality-') && f.endsWith('.json'))
                            .sort()
                            .reverse();
                        if (files.length > 0) {
                            notableQualityModel = path.join(dir, files[0]);
                            break;
                        }
                    }
                }
            } catch (e) {
                // Ignore
            }
            
            // Try to find the latest XGBoost model (highest priority)
            let xgboostModel = null;
            try {
                const fsSync = require('fs');
                const modelsDirs = [modelsDir, cwdModelsDir, libModelsDir];
                for (const dir of modelsDirs) {
                    if (fsSync.existsSync(dir)) {
                        const files = fsSync.readdirSync(dir)
                            .filter(f => f.startsWith('model-xgboost-'))
                            .sort()
                            .reverse();
                        if (files.length > 0) {
                            xgboostModel = path.join(dir, files[0]);
                            break;
                        }
                    }
                }
            } catch (e) {
                // Ignore
            }
            
            const possiblePaths = [
                // Latest XGBoost model (highest priority)
                xgboostModel,
                // Latest notable quality model
                notableQualityModel,
                path.join(modelsDir, 'quality-predictor-neural-network.json'),
                path.join(cwdModelsDir, 'quality-predictor-neural-network.json'),
                path.join(libModelsDir, 'quality-predictor-neural-network.json'),
                path.join(rootDir, '.beast-mode/models/quality-predictor-neural-network.json'),
                path.join(__dirname, '../../.beast-mode/models/quality-predictor-transformer.json'),
                path.join(process.cwd(), '.beast-mode/models/quality-predictor-transformer.json'),
                path.join(__dirname, '../../.beast-mode/models/quality-predictor-v3-advanced.json'),
                path.join(process.cwd(), '.beast-mode/models/quality-predictor-v3-advanced.json'),
                path.join(process.cwd(), '../.beast-mode/models/quality-predictor-v3-advanced.json'),
                path.join(process.cwd(), '../../BEAST-MODE-PRODUCT/.beast-mode/models/quality-predictor-v3-advanced.json'),
                path.join(__dirname, '../../.beast-mode/models/quality-predictor-v1-enhanced.json'),
                path.join(process.cwd(), '.beast-mode/models/quality-predictor-v1-enhanced.json'),
                path.join(__dirname, '../../.beast-mode/models/quality-predictor-v1.json'),
                path.join(process.cwd(), '.beast-mode/models/quality-predictor-v1.json'),
                path.join(process.cwd(), '../.beast-mode/models/quality-predictor-v1.json'),
                path.join(process.cwd(), '../../BEAST-MODE-PRODUCT/.beast-mode/models/quality-predictor-v1.json')
            ].filter(p => p !== null); // Remove null entries

            for (const modelPath of possiblePaths) {
                try {
                    const fsSync = require('fs');
                    // Check if path exists (file or directory)
                    if (fsSync.existsSync(modelPath)) {
                        // For XGBoost models (directories), check if model.json exists
                        if (modelPath.includes('xgboost')) {
                            const modelJsonPath = path.join(modelPath, 'model.json');
                            if (!fsSync.existsSync(modelJsonPath)) {
                                log.debug(`XGBoost model directory found but model.json missing: ${modelPath}`);
                                continue; // Try next path
                            }
                        }
                        this.modelPath = modelPath;
                        await this.loadModel();
                        this.initialized = true;
                        log.info(`✅ Loaded ML model from: ${modelPath}`);
                        log.info(`✅ Model available check: ${this.isMLModelAvailable()}`);
                        return;
                    } else {
                        log.debug(`Model path does not exist: ${modelPath}`);
                    }
                } catch (error) {
                    log.warn(`Failed to load model from ${modelPath}:`, error.message);
                    log.debug(`Error stack:`, error.stack);
                    // Try next path
                }
            }

            log.warn('⚠️  Trained ML model not found - will use fallback');
            this.initialized = true;
        } catch (error) {
            log.error('Failed to initialize ML model integration:', error.message);
            this.initialized = true; // Mark as initialized to prevent retries
        }
    }

    /**
     * Get default prediction (when model not available)
     */
    getDefaultPrediction() {
        return {
            predictedQuality: 0.75,
            confidence: 0.5,
            source: 'default'
        };
    }

    /**
     * Get expanded predictions (latency, cost, satisfaction, resources)
     */
    async getExpandedPredictions(context = {}) {
        if (!this.initialized) {
            await this.initialize();
        }

        if (expandedPredictions) {
            try {
                return await expandedPredictions.predictAll(context);
            } catch (error) {
                log.warn('Expanded predictions failed:', error.message);
            }
        }

        // Fallback: return null if not available
        return null;
    }

    /**
     * Load the trained model
     */
    async loadModel() {
        if (!this.modelPath) return;

        try {
            const path = require('path');
            
            // Try to load neural network model first
            if (this.modelPath.includes('neural-network')) {
                const { NeuralNetworkTrainer } = require('../models/neuralNetworkTrainer');
                this.qualityPredictor = new NeuralNetworkTrainer();
                await this.qualityPredictor.loadModel(this.modelPath);
                log.info('✅ Neural Network ML model loaded and ready');
            } else if (this.modelPath.includes('transformer')) {
                const { TransformerTrainer } = require('../models/transformerTrainer');
                this.qualityPredictor = new TransformerTrainer();
                await this.qualityPredictor.loadModel(this.modelPath);
                this.qualityPredictor.trained = true;
                log.info('✅ Transformer ML model loaded and ready');
            } else if (this.modelPath.includes('xgboost')) {
                // XGBoost model - use Python script for predictions
                const { predictQuality } = require('../../scripts/predict-xgboost');
                const fs = require('fs');
                const metadataPath = path.join(this.modelPath, 'model-metadata.json');
                let metadata = {};
                if (fs.existsSync(metadataPath)) {
                    metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
                }
                
                this.qualityPredictor = {
                    modelPath: this.modelPath,
                    metadata: metadata,
                    algorithm: 'xgboost',
                    metrics: metadata.metrics || {},
                    featureNames: metadata.featureNames || [],
                    trained: true,
                    predict: async (features) => {
                        // XGBoost prediction via Python
                        try {
                            const quality = await predictQuality(features, this.modelPath);
                            log.debug(`XGBoost prediction successful: ${quality}`);
                            if (typeof quality !== 'number' || isNaN(quality) || quality < 0 || quality > 1) {
                                throw new Error(`Invalid prediction result: ${quality}`);
                            }
                            return quality;
                        } catch (error) {
                            log.error('XGBoost prediction failed:', {
                                error: error.message,
                                stack: error.stack,
                                modelPath: this.modelPath,
                                featureCount: typeof features === 'object' ? Object.keys(features).length : (Array.isArray(features) ? features.length : 'unknown'),
                                pythonScriptExists: require('fs').existsSync(require('path').join(__dirname, '../../scripts/predict_xgboost.py'))
                            });
                            // Throw error to be handled by outer catch block - don't return 0.5 here
                            throw new Error(`XGBoost prediction failed: ${error.message}`);
                        }
                    },
                    // Sync version for compatibility (uses async internally but returns promise)
                    predictSync: (features) => {
                        // For sync contexts, we'll need to handle this differently
                        // For now, throw error to force async usage
                        log.error('XGBoost requires async prediction - predictQualitySync() called but XGBoost is async-only');
                        throw new Error('XGBoost requires async prediction - use predictQuality() instead of predictQualitySync()');
                    }
                };
                log.info('✅ XGBoost ML model loaded and ready');
            } else if (this.modelPath.includes('notable-quality')) {
                // Random Forest model - load directly from JSON
                const fs = require('fs');
                const modelData = JSON.parse(fs.readFileSync(this.modelPath, 'utf8'));
                
                // Helper function for tree prediction
                const predictTree = (tree, row) => {
                    if (tree.type === 'leaf') return tree.value;
                    if (row[tree.featureIdx] <= tree.threshold) {
                        return predictTree(tree.left, row);
                    } else {
                        return predictTree(tree.right, row);
                    }
                };
                
                const featureNames = modelData.featureNames || [];
                const modelTrees = modelData.model?.trees || [];
                
                this.qualityPredictor = {
                    model: modelData.model,
                    featureNames: featureNames,
                    algorithm: modelData.algorithm,
                    metrics: modelData.metrics,
                    qualityStats: modelData.qualityStats,
                    trained: true,
                    predict: (features) => {
                        // Predict using Random Forest
                        // features can be an object or array
                        let featureArray;
                        if (Array.isArray(features)) {
                            featureArray = features;
                        } else {
                            // Convert object to array in featureNames order
                            featureArray = featureNames.map(name => {
                                // Try different possible keys
                                return features[name] || features[name.toLowerCase()] || 0;
                            });
                        }
                        
                        const treePredictions = modelTrees.map(tree => predictTree(tree, featureArray));
                        const prediction = treePredictions.reduce((sum, p) => sum + p, 0) / treePredictions.length;
                        
                        // Random Forest outputs 0-1 directly
                        return prediction;
                    }
                };
                log.info('✅ Random Forest ML model (notable-quality) loaded and ready');
            } else if (this.modelPath.includes('v3-advanced')) {
                const { QualityPredictorTrainerAdvanced } = require('../models/trainQualityPredictorAdvanced');
                this.qualityPredictor = new QualityPredictorTrainerAdvanced();
                await this.qualityPredictor.loadModel(this.modelPath);
                log.info('✅ Advanced ML model (v3) loaded and ready');
            } else if (this.modelPath.includes('enhanced')) {
                const { QualityPredictorTrainer } = require('../models/trainQualityPredictor');
                this.qualityPredictor = new QualityPredictorTrainer();
                await this.qualityPredictor.loadModel(this.modelPath);
                log.info('✅ Enhanced ML model (v1-enhanced) loaded and ready');
            } else {
                const { QualityPredictorTrainer } = require('../models/trainQualityPredictor');
                this.qualityPredictor = new QualityPredictorTrainer();
                await this.qualityPredictor.loadModel(this.modelPath);
                log.info('✅ ML model (v1) loaded and ready');
            }
        } catch (error) {
            log.error('Failed to load model:', error.message);
            this.qualityPredictor = null;
        }
    }

    /**
     * Predict quality using ML model (synchronous version for compatibility)
     */
    predictQualitySync(context, fallbackPrediction = null) {
        const startTime = Date.now();
        
        if (!this.initialized) {
            // Initialize synchronously if needed (will be async in background)
            this.initialize().catch(() => {});
            const prediction = fallbackPrediction || this.getDefaultPrediction();
            
            // Record prediction for monitoring
            if (productionMonitoring) {
                productionMonitoring.recordPrediction(prediction, { startTime });
            }
            
            return prediction;
        }

        // If ML model is available, use it
        if (this.qualityPredictor && this.qualityPredictor.trained) {
            try {
                // Convert context to feature vector
                const features = this.extractFeaturesFromContext(context);
                
                // Predict using ML model
                const prediction = this.qualityPredictor.predict(features);
                
                // Handle different model output scales
                // Random Forest (notable-quality) outputs 0-1 directly, other models output 0-100
                let predictedQuality;
                if (this.modelPath && this.modelPath.includes('notable-quality')) {
                    predictedQuality = prediction; // Already 0-1
                } else {
                    predictedQuality = prediction / 100; // Convert from 0-100
                }
                
                const predictionValue = typeof prediction === 'number' ? prediction : (predictedQuality * 100);
                log.debug(`ML prediction: ${predictedQuality.toFixed(3)} (${predictionValue.toFixed(1)}/100)`);
                
                const result = {
                    predictedQuality: Math.max(0, Math.min(1, predictedQuality)),
                    confidence: 0.85, // ML model confidence
                    source: 'ml_model',
                    modelVersion: 'v3-advanced',
                    factors: {
                        mlPrediction: prediction,
                        features: features
                    }
                };

                // Write to database (async, don't block)
                if (databaseWriter) {
                    databaseWriter.writePrediction({
                        serviceName: context.serviceName || 'unknown',
                        predictionType: context.predictionType || 'quality',
                        predictedValue: result.predictedQuality,
                        actualValue: context.actualValue || null,
                        confidence: result.confidence,
                        context: context,
                        modelVersion: result.modelVersion,
                        source: result.source
                    }).catch(err => {
                        log.debug('Database write failed:', err.message);
                    });
                }

                // Record prediction for monitoring
                if (productionMonitoring) {
                    const latency = Date.now() - startTime;
                    productionMonitoring.recordPrediction(
                        result.predictedQuality * 100,
                        context.actualValue ? context.actualValue * 100 : undefined,
                        latency,
                        { context, source: result.source, modelVersion: result.modelVersion }
                    );
                }
                
                return result;
            } catch (error) {
                log.warn('ML prediction failed, using fallback:', error.message);
            }
        }

        // Fallback to heuristic prediction
        if (fallbackPrediction) {
            log.debug('Using fallback heuristic prediction');
            const result = {
                ...fallbackPrediction,
                source: 'heuristic_fallback'
            };

            // Write to database (async, don't block)
            if (databaseWriter) {
                const serviceName = context.serviceName || 
                                  context.service || 
                                  this.detectServiceName() || 
                                  'unknown';
                
                databaseWriter.writePrediction({
                    serviceName: serviceName,
                    predictionType: context.predictionType || context.actionType || 'quality',
                    predictedValue: result.predictedQuality,
                    actualValue: context.actualValue || null,
                    confidence: result.confidence,
                    context: context,
                    modelVersion: null,
                    source: result.source
                }).catch(err => {
                    log.debug('Database write failed:', err.message);
                });
            }

            // Record prediction for monitoring
            if (productionMonitoring) {
                const latency = Date.now() - startTime;
                productionMonitoring.recordPrediction(
                    result.predictedQuality * 100,
                    context.actualValue ? context.actualValue * 100 : undefined,
                    latency,
                    { context, source: result.source }
                );
            }

            return result;
        }

        // Last resort: default prediction
        const defaultResult = {
            predictedQuality: 0.75,
            confidence: 0.5,
            source: 'default'
        };

        // Write to database (async, don't block)
        if (databaseWriter) {
            const serviceName = context.serviceName || 
                              context.service || 
                              this.detectServiceName() || 
                              'unknown';
            
            databaseWriter.writePrediction({
                serviceName: serviceName,
                predictionType: context.predictionType || context.actionType || 'quality',
                predictedValue: defaultResult.predictedQuality,
                actualValue: context.actualValue || null,
                confidence: defaultResult.confidence,
                context: context,
                modelVersion: null,
                source: defaultResult.source
            }).catch(err => {
                log.debug('Database write failed:', err.message);
            });
        }

        // Record prediction for monitoring
        if (productionMonitoring) {
            const latency = Date.now() - startTime;
            productionMonitoring.recordPrediction(
                defaultResult.predictedQuality * 100,
                context.actualValue ? context.actualValue * 100 : undefined,
                latency,
                { context, source: defaultResult.source }
            );
        }

        return defaultResult;
    }

    /**
     * Predict quality using ML model (async version)
     */
    async predictQuality(context, fallbackPrediction = null) {
        if (!this.initialized) {
            await this.initialize();
        }

        // If ML model is available, use it
        if (this.qualityPredictor && this.qualityPredictor.trained) {
            try {
                // Convert context to feature vector
                const features = this.extractFeaturesFromContext(context);
                
                // Predict using ML model (XGBoost is async, others are sync)
                let prediction;
                if (this.modelPath && this.modelPath.includes('xgboost')) {
                    // XGBoost prediction is async
                    prediction = await this.qualityPredictor.predict(features);
                } else {
                    // Other models are sync
                    prediction = this.qualityPredictor.predict(features);
                }
                
                // Use advanced ensemble if available (for sync version, use simple approach)
                let finalPrediction = prediction;
                let ensembleStrategy = null;
                
                if (advancedEnsemble && !this.modelPath?.includes('xgboost')) {
                    // Only use ensemble for non-XGBoost models (XGBoost is already perfect)
                    try {
                        // Create base predictions for ensemble
                        const basePredictions = [{
                            value: prediction,
                            confidence: 0.85,
                            model: 'ml_model'
                        }];
                        
                        // Use stacking with hybrid models if available
                        const ensembleResult = await advancedEnsemble.stackingEnsemble(
                            basePredictions,
                            enhancedContext
                        );
                        
                        finalPrediction = ensembleResult.prediction;
                        ensembleStrategy = ensembleResult.strategy;
                        
                        log.debug(`Advanced ensemble (${ensembleStrategy}): ${finalPrediction.toFixed(1)}`);
                    } catch (error) {
                        log.debug('Advanced ensemble failed, using base prediction:', error.message);
                    }
                }
                
                // Handle different model output scales
                // XGBoost and Random Forest (notable-quality) output 0-1 directly
                // Other models output 0-100
                let predictedQuality;
                if (this.modelPath && (this.modelPath.includes('xgboost') || this.modelPath.includes('notable-quality'))) {
                    predictedQuality = finalPrediction; // Already 0-1
                } else {
                    predictedQuality = finalPrediction / 100; // Convert from 0-100
                }
                
                log.debug(`ML prediction: ${predictedQuality.toFixed(3)} (${(typeof finalPrediction === 'number' ? finalPrediction : predictedQuality * 100).toFixed(1)}/100)`);
                
                // Determine model version
                let modelVersion = 'v3-advanced';
                if (this.modelPath) {
                    if (this.modelPath.includes('xgboost')) {
                        modelVersion = 'xgboost';
                    } else if (this.modelPath.includes('neural-network')) {
                        modelVersion = 'neural-network';
                    } else if (this.modelPath.includes('transformer')) {
                        modelVersion = 'transformer';
                    } else if (this.modelPath.includes('notable-quality')) {
                        modelVersion = 'random-forest';
                    }
                }
                
                const result = {
                    predictedQuality: Math.max(0, Math.min(1, predictedQuality)),
                    confidence: this.qualityPredictor.metrics?.r2 ? Math.min(0.99, this.qualityPredictor.metrics.r2) : 0.85, // Use R² as confidence
                    source: ensembleStrategy ? `ml_model_${ensembleStrategy}` : 'ml_model',
                    modelVersion: modelVersion,
                    factors: {
                        mlPrediction: predictedQuality,
                        features: features,
                        ensembleStrategy: ensembleStrategy
                    }
                };

                // Write to database (async, don't block)
                if (databaseWriter) {
                    databaseWriter.writePrediction({
                        serviceName: context.serviceName || 'unknown',
                        predictionType: context.predictionType || 'quality',
                        predictedValue: result.predictedQuality,
                        actualValue: context.actualValue || null,
                        confidence: result.confidence,
                        context: context,
                        modelVersion: result.modelVersion,
                        source: result.source
                    }).catch(err => {
                        log.debug('Database write failed:', err.message);
                    });
                }
                
                return result;
            } catch (error) {
                log.error('ML prediction failed (async predictQuality), using fallback:', {
                    error: error.message,
                    stack: error.stack,
                    modelPath: this.modelPath,
                    modelType: this.modelPath?.includes('xgboost') ? 'xgboost' : 
                              this.modelPath?.includes('notable-quality') ? 'random-forest' :
                              this.modelPath?.includes('neural-network') ? 'neural-network' :
                              this.modelPath?.includes('transformer') ? 'transformer' : 'unknown',
                    predictorAvailable: !!this.qualityPredictor,
                    predictorTrained: this.qualityPredictor?.trained,
                    contextKeys: typeof context === 'object' && context !== null ? Object.keys(context) : 'N/A'
                });
                // Don't fall through silently - use proper fallback
                // This will be handled by the fallback logic below
            }
        }

        // Fallback to heuristic prediction
        if (fallbackPrediction) {
            log.debug('Using fallback heuristic prediction');
            const result = {
                ...fallbackPrediction,
                source: 'heuristic_fallback'
            };

            // Write to database (async, don't block)
            if (databaseWriter) {
                const serviceName = context.serviceName || 
                                  context.service || 
                                  this.detectServiceName() || 
                                  'unknown';
                
                databaseWriter.writePrediction({
                    serviceName: serviceName,
                    predictionType: context.predictionType || context.actionType || 'quality',
                    predictedValue: result.predictedQuality,
                    actualValue: context.actualValue || null,
                    confidence: result.confidence,
                    context: context,
                    modelVersion: null,
                    source: result.source
                }).catch(err => {
                    log.debug('Database write failed:', err.message);
                });
            }

            return result;
        }

        // Last resort: default prediction
        const defaultResult = {
            predictedQuality: 0.75,
            confidence: 0.5,
            source: 'default'
        };

        // Write to database (async, don't block)
        if (databaseWriter) {
            const serviceName = context.serviceName || 
                              context.service || 
                              this.detectServiceName() || 
                              'unknown';
            
            databaseWriter.writePrediction({
                serviceName: serviceName,
                predictionType: context.predictionType || context.actionType || 'quality',
                predictedValue: defaultResult.predictedQuality,
                actualValue: context.actualValue || null,
                confidence: defaultResult.confidence,
                context: context,
                modelVersion: null,
                source: defaultResult.source
            }).catch(err => {
                log.debug('Database write failed:', err.message);
            });
        }

        return defaultResult;
    }

    /**
     * Extract features from context for ML model
     */
    extractFeaturesFromContext(context) {
        // If features are provided directly (for repository quality prediction), use them
        if (context.features && typeof context.features === 'object') {
            // For XGBoost and Random Forest models, we need to map to expected feature names
            // The model expects specific feature names from training
            const providedFeatures = context.features;
            
            // Get expected feature names from model (if available)
            const expectedFeatures = this.qualityPredictor?.featureNames || [];
            
            // If we have expected features, map provided features to them
            if (expectedFeatures.length > 0) {
                const mappedFeatures = {};
                expectedFeatures.forEach(featureName => {
                    // Try to find the feature in provided features (case-insensitive, with variations)
                    const value = providedFeatures[featureName] || 
                                 providedFeatures[featureName.toLowerCase()] ||
                                 providedFeatures[featureName.toUpperCase()] ||
                                 // Try metadata path
                                 providedFeatures.metadata?.[featureName] ||
                                 providedFeatures.metadata?.[featureName.toLowerCase()] ||
                                 0; // Default to 0 if not found
                    mappedFeatures[featureName] = typeof value === 'number' ? value : 0;
                });
                return mappedFeatures;
            }
            
            // If no expected features, return provided features as-is
            return providedFeatures;
        }

        // Legacy: Map game/AI context to features
        const {
            provider,
            model,
            actionType,
            scenarioId,
            rollType,
            statName,
            statValue
        } = context;

        // Map context to feature vector
        // These should match the features used during training
        return {
            codeQuality: this.mapProviderToQuality(provider) || 75,
            testCoverage: this.mapModelToCoverage(model) || 70,
            security: this.mapActionTypeToSecurity(actionType) || 85,
            performance: this.mapScenarioToPerformance(scenarioId) || 80,
            maintainability: this.mapRollTypeToMaintainability(rollType) || 75,
            complexity: this.mapStatValueToComplexity(statValue) || 50,
            csat: 0 // Will be updated when CSAT data is available
        };
    }

    /**
     * Map provider to code quality score (0-100)
     */
    mapProviderToQuality(provider) {
        const providerScores = {
            'openai': 85,
            'anthropic': 88,
            'gemini': 82,
            'mistral': 80,
            'together': 78,
            'groq': 75
        };
        return providerScores[provider] || 75;
    }

    /**
     * Map model to test coverage score (0-100)
     */
    mapModelToCoverage(model) {
        if (!model) return 70;
        
        // Fine-tuned models tend to have better coverage
        if (model.includes('ft:') || model.includes('fine-tuned')) {
            return 85;
        }
        
        // GPT-4 and Claude Opus have high coverage
        if (model.includes('gpt-4') || model.includes('claude-opus')) {
            return 90;
        }
        
        return 70;
    }

    /**
     * Map action type to security score (0-100)
     */
    mapActionTypeToSecurity(actionType) {
        if (!actionType) return 85;
        
        // Critical actions need higher security
        if (actionType.includes('critical') || actionType.includes('combat')) {
            return 90;
        }
        
        return 85;
    }

    /**
     * Map scenario to performance score (0-100)
     */
    mapScenarioToPerformance(scenarioId) {
        if (!scenarioId) return 80;
        
        // Complex scenarios may have lower performance
        if (scenarioId.includes('complex') || scenarioId.includes('battle')) {
            return 75;
        }
        
        return 80;
    }

    /**
     * Map roll type to maintainability score (0-100)
     */
    mapRollTypeToMaintainability(rollType) {
        if (!rollType) return 75;
        
        // Critical successes are more maintainable (clear outcomes)
        if (rollType.includes('critical-success')) {
            return 85;
        }
        
        return 75;
    }

    /**
     * Map stat value to complexity score (0-100, inverted - higher stat = lower complexity)
     */
    mapStatValueToComplexity(statValue) {
        if (statValue === undefined || statValue === null) return 50;
        
        // Higher stats = simpler (less complex) = lower complexity score
        if (statValue >= 7) return 30; // Low complexity
        if (statValue >= 5) return 50; // Medium complexity
        return 70; // Higher complexity for lower stats
    }

    /**
     * Detect service name from stack trace or context
     */
    detectServiceName() {
        try {
            const stack = new Error().stack;
            if (stack) {
                if (stack.includes('code-roach') || stack.includes('mlCodeQuality')) {
                    return 'code-roach';
                }
                if (stack.includes('oracle') || stack.includes('mlKnowledge')) {
                    return 'oracle';
                }
                if (stack.includes('daisy-chain') || stack.includes('mlQuality')) {
                    return 'daisy-chain';
                }
                if (stack.includes('ai-gm') || stack.includes('aiGM')) {
                    return 'ai-gm';
                }
                if (stack.includes('first-mate') || stack.includes('mlPlayer')) {
                    return 'first-mate';
                }
                if (stack.includes('game-app') || stack.includes('GameML')) {
                    return 'game-app';
                }
            }
        } catch (error) {
            // Ignore
        }
        return null;
    }

    /**
     * Check if ML model is available
     */
    isMLModelAvailable() {
        return this.qualityPredictor && this.qualityPredictor.trained;
    }

    /**
     * Get model info
     */
    getModelInfo() {
        if (!this.qualityPredictor || !this.qualityPredictor.trained) {
            return { available: false };
        }

        return {
            available: true,
            modelPath: this.modelPath,
            algorithm: this.qualityPredictor.algorithm || 'unknown',
            metrics: this.qualityPredictor.metrics || {},
            version: '1.0',
            trained: true
        };
    }
}

// Singleton instance
let mlModelIntegrationInstance = null;

async function getMLModelIntegration() {
    if (!mlModelIntegrationInstance) {
        mlModelIntegrationInstance = new MLModelIntegration();
        await mlModelIntegrationInstance.initialize();
    }
    return mlModelIntegrationInstance;
}

module.exports = {
    MLModelIntegration,
    getMLModelIntegration
};

