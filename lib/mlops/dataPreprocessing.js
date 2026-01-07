/**
 * Data Preprocessing Pipeline
 * Comprehensive data cleaning, normalization, and feature engineering
 * 
 * Month 1: Week 2 - Data Preprocessing
 */

const { createLogger } = require('../utils/logger');
const log = createLogger('DataPreprocessing');

class DataPreprocessingPipeline {
    constructor() {
        this.scalers = new Map();
        this.encoders = new Map();
        this.featureStats = new Map();
        this.initialized = false;
    }

    /**
     * Initialize preprocessing pipeline
     */
    async initialize(trainingData = null) {
        if (this.initialized && !trainingData) return;

        if (trainingData && trainingData.length > 0) {
            // Calculate statistics from training data
            await this.calculateStatistics(trainingData);
        }

        this.initialized = true;
        log.info('Data preprocessing pipeline initialized');
    }

    /**
     * Calculate statistics for normalization
     */
    async calculateStatistics(data) {
        if (!data || data.length === 0) return;

        // Extract all features
        const featureVectors = data.map(sample => this.extractRawFeatures(sample));
        const featureNames = Object.keys(featureVectors[0] || {});

        for (const featureName of featureNames) {
            const values = featureVectors.map(fv => fv[featureName]).filter(v => v != null);
            
            if (values.length === 0) continue;

            const mean = values.reduce((a, b) => a + b, 0) / values.length;
            const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
            const stdDev = Math.sqrt(variance);
            const min = Math.min(...values);
            const max = Math.max(...values);

            this.featureStats.set(featureName, {
                mean,
                stdDev,
                min,
                max,
                range: max - min
            });
        }

        log.info(`Calculated statistics for ${featureNames.length} features`);
    }

    /**
     * Extract raw features from sample
     */
    extractRawFeatures(sample) {
        const features = sample.features || {};
        
        return {
            codeQuality: features.codeQuality || 0,
            testCoverage: features.testCoverage || 0,
            security: features.security || 0,
            performance: features.performance || 0,
            maintainability: features.maintainability || 0,
            complexity: features.complexity || 0,
            csat: sample.csat || 0
        };
    }

    /**
     * Preprocess a single sample
     */
    preprocessSample(sample, options = {}) {
        const {
            normalize = true,
            encodeCategorical = true,
            handleMissing = true,
            addDerivedFeatures = true
        } = options;

        // Extract raw features
        let features = this.extractRawFeatures(sample);

        // Handle missing values
        if (handleMissing) {
            features = this.handleMissingValues(features);
        }

        // Add derived features
        if (addDerivedFeatures) {
            features = this.addDerivedFeatures(features, sample);
        }

        // Normalize features
        if (normalize) {
            features = this.normalizeFeatures(features);
        }

        // Encode categorical features
        if (encodeCategorical) {
            features = this.encodeCategoricalFeatures(features, sample);
        }

        return {
            features: features,
            target: sample.target || sample.qualityScore || 0,
            metadata: {
                original: sample,
                preprocessing: {
                    normalized: normalize,
                    encoded: encodeCategorical,
                    derivedFeatures: addDerivedFeatures
                }
            }
        };
    }

    /**
     * Preprocess entire dataset
     */
    preprocessDataset(data, options = {}) {
        if (!this.initialized && data.length > 0) {
            // Initialize with this data
            this.calculateStatistics(data);
        }

        log.info(`Preprocessing ${data.length} samples...`);

        const preprocessed = data.map(sample => this.preprocessSample(sample, options));

        log.info(`✅ Preprocessed ${preprocessed.length} samples`);
        return preprocessed;
    }

    /**
     * Handle missing values
     */
    handleMissingValues(features) {
        const processed = { ...features };

        for (const [key, value] of Object.entries(processed)) {
            if (value === null || value === undefined || isNaN(value)) {
                // Use mean if available, otherwise 0
                const stats = this.featureStats.get(key);
                processed[key] = stats ? stats.mean : 0;
            }
        }

        return processed;
    }

    /**
     * Add derived features
     */
    addDerivedFeatures(features, sample) {
        const derived = { ...features };

        // Quality score (weighted average)
        derived.qualityScore = (
            (features.codeQuality || 0) * 0.25 +
            (features.testCoverage || 0) * 0.20 +
            (features.security || 0) * 0.20 +
            (features.performance || 0) * 0.15 +
            (features.maintainability || 0) * 0.15 +
            (100 - (features.complexity || 0)) * 0.05
        );

        // Quality-to-complexity ratio
        derived.qualityComplexityRatio = features.complexity > 0 
            ? (features.codeQuality || 0) / features.complexity 
            : 0;

        // Coverage-to-complexity ratio
        derived.coverageComplexityRatio = features.complexity > 0
            ? (features.testCoverage || 0) / features.complexity
            : 0;

        // Security-performance balance
        derived.securityPerformanceBalance = Math.abs(
            (features.security || 0) - (features.performance || 0)
        );

        // Overall health score
        derived.healthScore = (
            (features.codeQuality || 0) +
            (features.testCoverage || 0) +
            (features.security || 0) +
            (features.performance || 0) +
            (features.maintainability || 0)
        ) / 5;

        // CSAT correlation (if available)
        if (sample.csat !== undefined && sample.csat !== null) {
            derived.csatQualityCorrelation = (features.codeQuality || 0) * sample.csat;
        }

        return derived;
    }

    /**
     * Normalize features (Z-score normalization)
     */
    normalizeFeatures(features) {
        const normalized = { ...features };

        for (const [key, value] of Object.entries(normalized)) {
            const stats = this.featureStats.get(key);
            
            if (stats && stats.stdDev > 0) {
                // Z-score normalization: (x - mean) / stdDev
                normalized[key] = (value - stats.mean) / stats.stdDev;
            } else if (stats && stats.range > 0) {
                // Min-max normalization: (x - min) / (max - min)
                normalized[key] = (value - stats.min) / stats.range;
            }
            // If no stats, keep original value
        }

        return normalized;
    }

    /**
     * Encode categorical features
     */
    encodeCategoricalFeatures(features, sample) {
        const encoded = { ...features };

        // Encode provider (if available in sample context)
        if (sample.context && sample.context.provider) {
            encoded.provider_encoded = this.encodeProvider(sample.context.provider);
        }

        // Encode action type
        if (sample.context && sample.context.actionType) {
            encoded.actionType_encoded = this.encodeActionType(sample.context.actionType);
        }

        return encoded;
    }

    /**
     * Encode provider to numeric
     */
    encodeProvider(provider) {
        const providerMap = {
            'openai': 0.9,
            'anthropic': 0.95,
            'gemini': 0.85,
            'mistral': 0.80,
            'together': 0.75,
            'groq': 0.70
        };
        return providerMap[provider] || 0.5;
    }

    /**
     * Encode action type to numeric
     */
    encodeActionType(actionType) {
        // Map action types to quality scores based on complexity
        const actionMap = {
            'navigate': 0.8,
            'combat': 0.7,
            'negotiate': 0.85,
            'investigate': 0.75,
            'hack': 0.65,
            'repair': 0.70
        };
        return actionMap[actionType] || 0.75;
    }

    /**
     * Split data into train/validation/test
     */
    splitData(data, trainRatio = 0.7, valRatio = 0.15, testRatio = 0.15) {
        // Shuffle data
        const shuffled = [...data].sort(() => Math.random() - 0.5);

        const trainEnd = Math.floor(shuffled.length * trainRatio);
        const valEnd = trainEnd + Math.floor(shuffled.length * valRatio);

        return {
            train: shuffled.slice(0, trainEnd),
            validation: shuffled.slice(trainEnd, valEnd),
            test: shuffled.slice(valEnd)
        };
    }

    /**
     * Get feature importance (correlation with target)
     */
    calculateFeatureImportance(data) {
        if (!data || data.length === 0) return {};

        const features = Object.keys(data[0].features || {});
        const targets = data.map(s => s.target || 0);
        const targetMean = targets.reduce((a, b) => a + b, 0) / targets.length;

        const importance = {};

        for (const feature of features) {
            const values = data.map(s => s.features[feature] || 0);
            const featureMean = values.reduce((a, b) => a + b, 0) / values.length;

            // Calculate correlation
            let numerator = 0;
            let denomX = 0;
            let denomY = 0;

            for (let i = 0; i < values.length; i++) {
                const xDiff = values[i] - featureMean;
                const yDiff = targets[i] - targetMean;
                numerator += xDiff * yDiff;
                denomX += xDiff * xDiff;
                denomY += yDiff * yDiff;
            }

            const correlation = numerator / Math.sqrt(denomX * denomY);
            importance[feature] = Math.abs(correlation); // Use absolute value
        }

        // Sort by importance
        const sorted = Object.entries(importance)
            .sort((a, b) => b[1] - a[1])
            .reduce((obj, [key, value]) => {
                obj[key] = value;
                return obj;
            }, {});

        return sorted;
    }

    /**
     * Detect outliers
     */
    detectOutliers(data, threshold = 3) {
        const outliers = [];

        const features = Object.keys(data[0].features || {});
        
        for (const feature of features) {
            const values = data.map(s => s.features[feature] || 0);
            const mean = values.reduce((a, b) => a + b, 0) / values.length;
            const stdDev = Math.sqrt(
                values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
            );

            values.forEach((value, index) => {
                const zScore = Math.abs((value - mean) / stdDev);
                if (zScore > threshold) {
                    outliers.push({
                        index,
                        feature,
                        value,
                        zScore
                    });
                }
            });
        }

        return outliers;
    }

    /**
     * Remove outliers
     */
    removeOutliers(data, threshold = 3) {
        const outliers = this.detectOutliers(data, threshold);
        const outlierIndices = new Set(outliers.map(o => o.index));

        return data.filter((_, index) => !outlierIndices.has(index));
    }
}

// Singleton instance
let preprocessingInstance = null;

async function getDataPreprocessingPipeline(trainingData = null) {
    if (!preprocessingInstance) {
        preprocessingInstance = new DataPreprocessingPipeline();
        await preprocessingInstance.initialize(trainingData);
    } else if (trainingData) {
        await preprocessingInstance.initialize(trainingData);
    }
    return preprocessingInstance;
}

module.exports = {
    DataPreprocessingPipeline,
    getDataPreprocessingPipeline
};

