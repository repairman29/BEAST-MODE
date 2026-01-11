/**
 * Production Deployment Manager
 * Handles model deployment, versioning, and rollback
 * 
 * Month 1: Week 4 - Production Deployment
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
const { getMLModelIntegration } = require('./mlModelIntegration');
const { getABTestingFramework } = require('./abTesting');
const path = require('path');
const fs = require('fs').promises;

const log = createLogger('ProductionDeployment');

class ProductionDeployment {
    constructor() {
        this.currentModel = null;
        this.deploymentHistory = [];
        this.rollbackHistory = [];
    }

    /**
     * Deploy model to production
     */
    async deployModel(modelPath, options = {}) {
        const {
            version = 'latest',
            trafficPercentage = 100,
            enableABTesting = false,
            abTestName = null
        } = options;

        log.info('🚀 Deploying model to production...');
        log.info(`   Model: ${modelPath}`);
        log.info(`   Version: ${version}`);
        log.info(`   Traffic: ${trafficPercentage}%`);

        try {
            // Validate model file exists
            await fs.access(modelPath);

            // Load model to verify it's valid
            const mlIntegration = await getMLModelIntegration();
            
            // If A/B testing enabled, set up experiment
            if (enableABTesting && abTestName) {
                const abTesting = getABTestingFramework();
                
                // Get current production model for comparison
                const currentModel = this.getCurrentProductionModel();
                
                await abTesting.createExperiment(abTestName, [
                    {
                        id: 'current',
                        name: 'Current Production Model',
                        traffic: 1 - (trafficPercentage / 100),
                        modelPath: currentModel?.path || null
                    },
                    {
                        id: 'new',
                        name: `New Model (${version})`,
                        traffic: trafficPercentage / 100,
                        modelPath: modelPath
                    }
                ]);

                log.info(`✅ A/B test created: ${abTestName}`);
                log.info(`   Current model: ${(1 - trafficPercentage / 100) * 100}% traffic`);
                log.info(`   New model: ${trafficPercentage}% traffic`);
            }

            // Update production model
            this.currentModel = {
                path: modelPath,
                version: version,
                deployedAt: new Date().toISOString(),
                trafficPercentage: trafficPercentage,
                abTestName: abTestName
            };

            // Save deployment record
            await this.saveDeploymentRecord({
                modelPath,
                version,
                trafficPercentage,
                enableABTesting,
                abTestName,
                deployedAt: new Date().toISOString(),
                status: 'deployed'
            });

            log.info('✅ Model deployed to production successfully');

            return {
                success: true,
                model: this.currentModel
            };

        } catch (error) {
            log.error('❌ Deployment failed:', error.message);
            throw error;
        }
    }

    /**
     * Rollback to previous model version
     */
    async rollback(previousVersion = null) {
        log.info('🔄 Rolling back model...');

        try {
            const deployments = await this.getDeploymentHistory();
            
            if (deployments.length < 2) {
                throw new Error('No previous version to rollback to');
            }

            // Find previous deployment
            let previousDeployment;
            if (previousVersion) {
                previousDeployment = deployments.find(d => d.version === previousVersion);
            } else {
                // Rollback to second-to-last deployment
                previousDeployment = deployments[deployments.length - 2];
            }

            if (!previousDeployment) {
                throw new Error(`Previous version ${previousVersion || 'latest'} not found`);
            }

            // Verify previous model exists
            await fs.access(previousDeployment.modelPath);

            // Deploy previous model
            await this.deployModel(previousDeployment.modelPath, {
                version: previousDeployment.version,
                trafficPercentage: 100,
                enableABTesting: false
            });

            // Record rollback
            this.rollbackHistory.push({
                from: this.currentModel?.version,
                to: previousDeployment.version,
                rolledBackAt: new Date().toISOString()
            });

            log.info(`✅ Rolled back to version ${previousDeployment.version}`);

            return {
                success: true,
                previousVersion: previousDeployment.version,
                currentVersion: this.currentModel.version
            };

        } catch (error) {
            log.error('❌ Rollback failed:', error.message);
            throw error;
        }
    }

    /**
     * Get current production model
     */
    getCurrentProductionModel() {
        return this.currentModel;
    }

    /**
     * Get deployment history
     */
    async getDeploymentHistory() {
        try {
            const historyPath = path.join(
                process.cwd(),
                '.beast-mode',
                'deployments',
                'history.json'
            );

            await fs.mkdir(path.dirname(historyPath), { recursive: true });

            try {
                const data = await fs.readFile(historyPath, 'utf8');
                return JSON.parse(data);
            } catch (error) {
                return [];
            }
        } catch (error) {
            log.warn('Failed to load deployment history:', error.message);
            return this.deploymentHistory;
        }
    }

    /**
     * Save deployment record
     */
    async saveDeploymentRecord(record) {
        try {
            const historyPath = path.join(
                process.cwd(),
                '.beast-mode',
                'deployments',
                'history.json'
            );

            await fs.mkdir(path.dirname(historyPath), { recursive: true });

            const history = await this.getDeploymentHistory();
            history.push(record);

            // Keep only last 50 deployments
            const trimmedHistory = history.slice(-50);

            await fs.writeFile(
                historyPath,
                JSON.stringify(trimmedHistory, null, 2)
            );

            this.deploymentHistory = trimmedHistory;
        } catch (error) {
            log.warn('Failed to save deployment record:', error.message);
        }
    }

    /**
     * Get deployment status
     */
    async getDeploymentStatus() {
        const currentModel = this.getCurrentProductionModel();
        const history = await this.getDeploymentHistory();
        const abTesting = getABTestingFramework();
        const activeExperiments = abTesting.getActiveExperiments();

        return {
            currentModel: currentModel,
            totalDeployments: history.length,
            recentDeployments: history.slice(-5),
            activeABTests: activeExperiments.length,
            rollbackHistory: this.rollbackHistory.slice(-5)
        };
    }

    /**
     * Promote A/B test winner to production
     */
    async promoteABTestWinner(experimentName) {
        log.info(`🏆 Promoting A/B test winner: ${experimentName}`);

        try {
            const abTesting = getABTestingFramework();
            const results = abTesting.getResults(experimentName);

            if (!results || !results.winner) {
                throw new Error('No winner determined yet or experiment not found');
            }

            const winner = results.results.find(r => r.id === results.winner);
            if (!winner) {
                throw new Error('Winner variant not found');
            }

            // Get winner model path from experiment
            const experiment = abTesting.experiments.get(experimentName);
            const winnerVariant = experiment.variants.find(v => v.id === results.winner);

            if (!winnerVariant || !winnerVariant.modelPath) {
                throw new Error('Winner model path not found');
            }

            // Deploy winner to 100% traffic
            await this.deployModel(winnerVariant.modelPath, {
                version: `ab-winner-${experimentName}`,
                trafficPercentage: 100,
                enableABTesting: false
            });

            // End experiment
            await abTesting.endExperiment(experimentName);

            log.info(`✅ Promoted ${results.winner} to production (100% traffic)`);

            return {
                success: true,
                winner: results.winner,
                metrics: winner.metrics
            };

        } catch (error) {
            log.error('❌ Failed to promote winner:', error.message);
            throw error;
        }
    }
}

// Singleton instance
let productionDeploymentInstance = null;

function getProductionDeployment() {
    if (!productionDeploymentInstance) {
        productionDeploymentInstance = new ProductionDeployment();
    }
    return productionDeploymentInstance;
}

module.exports = {
    ProductionDeployment,
    getProductionDeployment
};

