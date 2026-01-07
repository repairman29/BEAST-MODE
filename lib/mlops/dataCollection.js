/**
 * Data Collection Service
 * Collects training data from various sources for ML model training
 * 
 * Month 1: Data Collection & Preparation
 */

const fs = require('fs').promises;
const path = require('path');
const { createLogger } = require('../utils/logger');
const log = createLogger('DataCollection');

class DataCollectionService {
    constructor() {
        this.dataDir = path.join(process.cwd(), '.beast-mode', 'data', 'training');
        this.collectedData = {
            quality: [],
            fixes: [],
            modelPerformance: [],
            csat: []
        };
        this.initialized = false;
    }

    /**
     * Initialize data collection service
     */
    async initialize() {
        if (this.initialized) return;

        // Ensure data directory exists
        await fs.mkdir(this.dataDir, { recursive: true });

        // Load existing collected data
        await this.loadCollectedData();

        this.initialized = true;
        log.info('Data collection service initialized');
    }

    /**
     * Collect quality prediction data
     */
    async collectQualityData(qualityData) {
        const {
            codeMetrics,
            qualityScore,
            csatScore,
            timestamp,
            context
        } = qualityData;

        const sample = {
            timestamp: timestamp || new Date().toISOString(),
            features: {
                codeQuality: codeMetrics?.codeQuality || 0,
                testCoverage: codeMetrics?.testCoverage || 0,
                security: codeMetrics?.security || 0,
                performance: codeMetrics?.performance || 0,
                maintainability: codeMetrics?.maintainability || 0,
                complexity: codeMetrics?.complexity || 0,
                ...context
            },
            target: qualityScore,
            csat: csatScore,
            metadata: {
                source: 'quality_prediction',
                version: '1.0'
            }
        };

        this.collectedData.quality.push(sample);
        await this.saveCollectedData('quality');
        
        log.debug(`Collected quality data sample (total: ${this.collectedData.quality.length})`);
        return sample;
    }

    /**
     * Collect fix attempt data
     */
    async collectFixData(fixData) {
        const {
            error,
            proposedFix,
            success,
            context,
            timestamp
        } = fixData;

        const sample = {
            timestamp: timestamp || new Date().toISOString(),
            error: {
                type: error?.type,
                message: error?.message,
                pattern: error?.pattern,
                file: error?.file,
                line: error?.line
            },
            fix: {
                type: proposedFix?.type,
                code: proposedFix?.code,
                complexity: this.calculateFixComplexity(proposedFix),
                safety: proposedFix?.safety || 'unknown'
            },
            context: {
                codebaseSize: context?.codebaseSize || 0,
                codebaseComplexity: context?.codebaseComplexity || 0,
                ...context
            },
            success: success,
            metadata: {
                source: 'fix_attempt',
                version: '1.0'
            }
        };

        this.collectedData.fixes.push(sample);
        await this.saveCollectedData('fixes');
        
        log.debug(`Collected fix data sample (total: ${this.collectedData.fixes.length})`);
        return sample;
    }

    /**
     * Collect model performance data
     */
    async collectModelPerformance(performanceData) {
        const {
            modelName,
            provider,
            model,
            prediction,
            actual,
            context,
            timestamp
        } = performanceData;

        const sample = {
            timestamp: timestamp || new Date().toISOString(),
            model: {
                name: modelName,
                provider: provider,
                model: model
            },
            prediction: prediction,
            actual: actual,
            accuracy: this.calculateAccuracy(prediction, actual),
            context: context || {},
            metadata: {
                source: 'model_performance',
                version: '1.0'
            }
        };

        this.collectedData.modelPerformance.push(sample);
        await this.saveCollectedData('modelPerformance');
        
        log.debug(`Collected model performance sample (total: ${this.collectedData.modelPerformance.length})`);
        return sample;
    }

    /**
     * Collect CSAT feedback data
     */
    async collectCSATData(csatData) {
        const {
            sessionId,
            actionType,
            provider,
            model,
            csatScore,
            feedback,
            context,
            timestamp
        } = csatData;

        const sample = {
            timestamp: timestamp || new Date().toISOString(),
            sessionId: sessionId,
            action: {
                type: actionType,
                provider: provider,
                model: model
            },
            csat: csatScore,
            feedback: feedback,
            context: context || {},
            metadata: {
                source: 'csat_feedback',
                version: '1.0'
            }
        };

        this.collectedData.csat.push(sample);
        await this.saveCollectedData('csat');
        
        log.debug(`Collected CSAT data sample (total: ${this.collectedData.csat.length})`);
        return sample;
    }

    /**
     * Get collected data for training
     */
    async getTrainingData(dataType, options = {}) {
        const {
            limit = null,
            startDate = null,
            endDate = null,
            minSamples = 0
        } = options;

        let data = this.collectedData[dataType] || [];

        // Filter by date range
        if (startDate || endDate) {
            data = data.filter(sample => {
                const sampleDate = new Date(sample.timestamp);
                if (startDate && sampleDate < new Date(startDate)) return false;
                if (endDate && sampleDate > new Date(endDate)) return false;
                return true;
            });
        }

        // Check minimum samples
        if (data.length < minSamples) {
            log.warn(`Insufficient samples for ${dataType}: ${data.length} < ${minSamples}`);
            return null;
        }

        // Apply limit
        if (limit && limit > 0) {
            data = data.slice(-limit); // Get most recent
        }

        log.info(`Retrieved ${data.length} training samples for ${dataType}`);
        return data;
    }

    /**
     * Get data statistics
     */
    getDataStatistics() {
        return {
            quality: {
                count: this.collectedData.quality.length,
                latest: this.collectedData.quality[this.collectedData.quality.length - 1]?.timestamp
            },
            fixes: {
                count: this.collectedData.fixes.length,
                successRate: this.calculateSuccessRate(this.collectedData.fixes),
                latest: this.collectedData.fixes[this.collectedData.fixes.length - 1]?.timestamp
            },
            modelPerformance: {
                count: this.collectedData.modelPerformance.length,
                averageAccuracy: this.calculateAverageAccuracy(this.collectedData.modelPerformance),
                latest: this.collectedData.modelPerformance[this.collectedData.modelPerformance.length - 1]?.timestamp
            },
            csat: {
                count: this.collectedData.csat.length,
                averageCSAT: this.calculateAverageCSAT(this.collectedData.csat),
                latest: this.collectedData.csat[this.collectedData.csat.length - 1]?.timestamp
            }
        };
    }

    /**
     * Calculate fix complexity
     */
    calculateFixComplexity(fix) {
        if (!fix || !fix.code) return 0;
        
        const codeLength = fix.code.length;
        const lineCount = fix.code.split('\n').length;
        const complexity = (codeLength / 100) + (lineCount / 10);
        
        return Math.min(1, complexity / 10); // Normalize to 0-1
    }

    /**
     * Calculate accuracy
     */
    calculateAccuracy(prediction, actual) {
        if (typeof prediction === 'number' && typeof actual === 'number') {
            return 1 - Math.abs(prediction - actual) / Math.max(actual, 1);
        }
        return prediction === actual ? 1 : 0;
    }

    /**
     * Calculate success rate
     */
    calculateSuccessRate(fixes) {
        if (fixes.length === 0) return 0;
        const successful = fixes.filter(f => f.success === true).length;
        return successful / fixes.length;
    }

    /**
     * Calculate average accuracy
     */
    calculateAverageAccuracy(performanceData) {
        if (performanceData.length === 0) return 0;
        const sum = performanceData.reduce((acc, sample) => acc + (sample.accuracy || 0), 0);
        return sum / performanceData.length;
    }

    /**
     * Calculate average CSAT
     */
    calculateAverageCSAT(csatData) {
        if (csatData.length === 0) return 0;
        const sum = csatData.reduce((acc, sample) => acc + (sample.csat || 0), 0);
        return sum / csatData.length;
    }

    /**
     * Save collected data to disk
     */
    async saveCollectedData(dataType) {
        const filePath = path.join(this.dataDir, `${dataType}.json`);
        const data = this.collectedData[dataType];
        
        try {
            await fs.writeFile(filePath, JSON.stringify(data, null, 2));
            log.debug(`Saved ${data.length} ${dataType} samples to disk`);
        } catch (error) {
            log.error(`Failed to save ${dataType} data:`, error.message);
        }
    }

    /**
     * Load collected data from disk
     */
    async loadCollectedData() {
        const dataTypes = ['quality', 'fixes', 'modelPerformance', 'csat'];

        for (const dataType of dataTypes) {
            const filePath = path.join(this.dataDir, `${dataType}.json`);
            try {
                const data = await fs.readFile(filePath, 'utf8');
                this.collectedData[dataType] = JSON.parse(data);
                log.debug(`Loaded ${this.collectedData[dataType].length} ${dataType} samples`);
            } catch (error) {
                // File doesn't exist yet, start with empty array
                this.collectedData[dataType] = [];
            }
        }
    }

    /**
     * Export data for training
     */
    async exportTrainingData(dataType, format = 'json') {
        const data = await this.getTrainingData(dataType);
        if (!data) return null;

        const exportPath = path.join(this.dataDir, `export_${dataType}_${Date.now()}.${format}`);
        
        if (format === 'json') {
            await fs.writeFile(exportPath, JSON.stringify(data, null, 2));
        } else if (format === 'csv') {
            // Convert to CSV (simplified)
            const csv = this.convertToCSV(data);
            await fs.writeFile(exportPath, csv);
        }

        log.info(`Exported ${data.length} ${dataType} samples to ${exportPath}`);
        return exportPath;
    }

    /**
     * Convert data to CSV
     */
    convertToCSV(data) {
        if (data.length === 0) return '';
        
        // Simple CSV conversion (would need proper handling for nested objects)
        const headers = Object.keys(data[0]).join(',');
        const rows = data.map(sample => 
            Object.values(sample).map(val => 
                typeof val === 'object' ? JSON.stringify(val) : val
            ).join(',')
        );
        
        return [headers, ...rows].join('\n');
    }
}

// Singleton instance
let dataCollectionInstance = null;

async function getDataCollectionService() {
    if (!dataCollectionInstance) {
        dataCollectionInstance = new DataCollectionService();
        await dataCollectionInstance.initialize();
    }
    return dataCollectionInstance;
}

module.exports = {
    DataCollectionService,
    getDataCollectionService
};

