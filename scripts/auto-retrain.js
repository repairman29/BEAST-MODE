/**
 * Automated Retraining Pipeline
 * Schedules and executes model retraining based on data accumulation
 * 
 * Month 1: Week 4 - Automated Retraining
 */

const { getDataCollectionService } = require('../lib/mlops/dataCollection');
const { QualityPredictorTrainerAdvanced } = require('../lib/models/trainQualityPredictorAdvanced');
const { getProductionDeployment } = require('../lib/mlops/productionDeployment');
const { getModelMonitoring } = require('../lib/mlops/modelMonitoring');
const path = require('path');
const fs = require('fs').promises;
const { createLogger } = require('../lib/utils/logger');

const log = createLogger('AutoRetrain');

class AutoRetrainPipeline {
    constructor() {
        this.config = {
            minNewSamples: 100, // Minimum new samples to trigger retraining
            retrainInterval: 7 * 24 * 60 * 60 * 1000, // 7 days
            minAccuracyImprovement: 0.01, // 1% improvement required
            autoDeploy: false, // Auto-deploy if better than current
            lastRetrainTime: null
        };
    }

    /**
     * Check if retraining is needed
     */
    async shouldRetrain() {
        try {
            // Check time-based trigger
            const lastRetrain = await this.getLastRetrainTime();
            const timeSinceLastRetrain = Date.now() - (lastRetrain || 0);
            
            if (timeSinceLastRetrain < this.config.retrainInterval) {
                log.info(`⏰ Not time for retraining yet (${Math.floor(timeSinceLastRetrain / (24 * 60 * 60 * 1000))} days since last)`);
                return { shouldRetrain: false, reason: 'time' };
            }

            // Check data accumulation
            const dataCollection = await getDataCollectionService();
            const newSamples = await this.getNewSampleCount();
            
            if (newSamples < this.config.minNewSamples) {
                log.info(`📊 Insufficient new data: ${newSamples} < ${this.config.minNewSamples}`);
                return { shouldRetrain: false, reason: 'data', newSamples };
            }

            // Check model performance degradation
            const monitoring = getModelMonitoring();
            const health = monitoring.getHealthStatus();
            
            if (health.status === 'critical') {
                log.warn('🚨 Model health is critical - retraining recommended');
                return { shouldRetrain: true, reason: 'critical_health', health };
            }

            log.info(`✅ Retraining conditions met: ${newSamples} new samples, ${Math.floor(timeSinceLastRetrain / (24 * 60 * 60 * 1000))} days since last`);
            return { shouldRetrain: true, reason: 'scheduled', newSamples };

        } catch (error) {
            log.error('Error checking retrain conditions:', error.message);
            return { shouldRetrain: false, reason: 'error', error: error.message };
        }
    }

    /**
     * Execute retraining
     */
    async retrain(options = {}) {
        const {
            force = false,
            autoDeploy = this.config.autoDeploy,
            version = null
        } = options;

        log.info('🔄 Starting automated retraining...');

        try {
            // Check if retraining is needed
            if (!force) {
                const check = await this.shouldRetrain();
                if (!check.shouldRetrain) {
                    log.info(`⏭️  Skipping retraining: ${check.reason}`);
                    return { success: false, reason: check.reason };
                }
            }

            // Train new model
            const trainer = new QualityPredictorTrainerAdvanced();
            const result = await trainer.train({
                useMLflow: true,
                testSize: 0.2,
                minSamples: 100,
                cvFolds: 5,
                enableFeatureSelection: true,
                enableHyperparameterTuning: true
            });

            if (!result.success) {
                throw new Error('Training failed');
            }

            // Save model
            const modelVersion = version || `v${Date.now()}`;
            const modelsDir = path.join(process.cwd(), '.beast-mode', 'models');
            await fs.mkdir(modelsDir, { recursive: true });
            const modelPath = path.join(modelsDir, `quality-predictor-${modelVersion}.json`);
            await trainer.saveModel(modelPath);

            log.info(`✅ Model trained: ${modelVersion}`);
            log.info(`   Accuracy: ${(result.metrics.accuracy * 100).toFixed(1)}%`);
            log.info(`   MAE: ${result.metrics.mae.toFixed(2)}`);
            log.info(`   RMSE: ${result.metrics.rmse.toFixed(2)}`);

            // Compare with current production model
            const deployment = getProductionDeployment();
            const currentModel = deployment.getCurrentProductionModel();
            
            let shouldDeploy = false;
            if (autoDeploy) {
                if (!currentModel) {
                    shouldDeploy = true;
                    log.info('📦 No current production model - deploying new model');
                } else {
                    // Compare metrics (would need to load current model to compare)
                    // For now, deploy if accuracy is good
                    if (result.metrics.accuracy >= 0.85) {
                        shouldDeploy = true;
                        log.info('📦 New model meets quality threshold - deploying');
                    } else {
                        log.info('⚠️  New model accuracy below threshold - not auto-deploying');
                    }
                }
            }

            // Deploy if needed
            if (shouldDeploy) {
                await deployment.deployModel(modelPath, {
                    version: modelVersion,
                    trafficPercentage: 10, // Start with 10% traffic
                    enableABTesting: true,
                    abTestName: `retrain-${modelVersion}`
                });
                log.info(`✅ Model deployed with A/B testing (10% traffic)`);
            }

            // Update last retrain time
            await this.setLastRetrainTime(Date.now());

            return {
                success: true,
                modelVersion,
                modelPath,
                metrics: result.metrics,
                deployed: shouldDeploy
            };

        } catch (error) {
            log.error('❌ Retraining failed:', error.message);
            throw error;
        }
    }

    /**
     * Get new sample count since last retrain
     */
    async getNewSampleCount() {
        try {
            const dataCollection = await getDataCollectionService();
            const lastRetrain = await this.getLastRetrainTime();
            
            if (!lastRetrain) {
                // First retrain - count all samples
                const data = await dataCollection.getTrainingData('quality', { minSamples: 0 });
                return data?.length || 0;
            }

            // Count samples since last retrain
            // This is a simplified version - in production, you'd query by timestamp
            const data = await dataCollection.getTrainingData('quality', { minSamples: 0 });
            return data?.length || 0; // TODO: Filter by timestamp

        } catch (error) {
            log.warn('Failed to get new sample count:', error.message);
            return 0;
        }
    }

    /**
     * Get last retrain time
     */
    async getLastRetrainTime() {
        try {
            const retrainPath = path.join(
                process.cwd(),
                '.beast-mode',
                'retrain',
                'last-retrain.json'
            );

            await fs.mkdir(path.dirname(retrainPath), { recursive: true });

            try {
                const data = await fs.readFile(retrainPath, 'utf8');
                const record = JSON.parse(data);
                return record.timestamp || null;
            } catch (error) {
                return null;
            }
        } catch (error) {
            return null;
        }
    }

    /**
     * Set last retrain time
     */
    async setLastRetrainTime(timestamp) {
        try {
            const retrainPath = path.join(
                process.cwd(),
                '.beast-mode',
                'retrain',
                'last-retrain.json'
            );

            await fs.mkdir(path.dirname(retrainPath), { recursive: true });

            await fs.writeFile(
                retrainPath,
                JSON.stringify({ timestamp, date: new Date(timestamp).toISOString() }, null, 2)
            );
        } catch (error) {
            log.warn('Failed to save retrain time:', error.message);
        }
    }
}

async function main() {
    const args = process.argv.slice(2);
    const pipeline = new AutoRetrainPipeline();

    try {
        if (args[0] === '--check') {
            // Just check if retraining is needed
            const check = await pipeline.shouldRetrain();
            if (check.shouldRetrain) {
                log.info('✅ Retraining recommended');
                process.exit(0);
            } else {
                log.info(`⏭️  Retraining not needed: ${check.reason}`);
                process.exit(1);
            }
        } else if (args[0] === '--force') {
            // Force retraining
            const result = await pipeline.retrain({ force: true, autoDeploy: args[1] === '--deploy' });
            if (result.success) {
                log.info('✅ Retraining complete');
                process.exit(0);
            } else {
                process.exit(1);
            }
        } else {
            // Normal retraining (checks conditions)
            const result = await pipeline.retrain({ autoDeploy: args[0] === '--deploy' });
            if (result.success) {
                log.info('✅ Retraining complete');
                process.exit(0);
            } else {
                log.info(`⏭️  Retraining skipped: ${result.reason}`);
                process.exit(1);
            }
        }
        }
    } catch (error) {
        log.error('❌ Auto-retrain failed:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { AutoRetrainPipeline };

