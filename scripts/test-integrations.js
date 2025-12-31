/**
 * Integration Testing Suite
 * Tests all ML system integrations across services
 * 
 * Month 2: Week 4 - Integration Testing
 */

const { createLogger } = require('../lib/utils/logger');
const log = createLogger('IntegrationTests');

class IntegrationTests {
    constructor() {
        this.results = {
            passed: 0,
            failed: 0,
            skipped: 0,
            tests: []
        };
    }

    /**
     * Run all integration tests
     */
    async runAll() {
        log.info('🧪 Running Integration Tests');
        log.info('='.repeat(60));

        // Test AI GM Integration
        await this.testAIGMIntegration();

        // Test Code Roach Integration
        await this.testCodeRoachIntegration();

        // Test Daisy Chain Integration
        await this.testDaisyChainIntegration();

        // Test Oracle Integration
        await this.testOracleIntegration();

        // Test ML System Core
        await this.testMLSystemCore();

        // Print summary
        this.printSummary();
    }

    /**
     * Test AI GM Integration
     */
    async testAIGMIntegration() {
        log.info('\n📊 Testing AI GM Integration...');

        try {
            const path = require('path');
            const aiGMPath = path.join(__dirname, '../../smuggler-ai-gm/src/services/aiGMEnsembleMLEnhanced');
            
            try {
                const aiGMService = require(aiGMPath);
                this.recordTest('AI GM ML Enhanced', true, 'Service loaded');
            } catch (error) {
                this.recordTest('AI GM ML Enhanced', false, error.message);
            }

            // Test quality prediction service
            try {
                const qualityService = require('../../smuggler-ai-gm/src/services/aiGMQualityPredictionServiceML');
                const prediction = qualityService.predictQuality({
                    provider: 'openai',
                    model: 'gpt-4',
                    actionType: 'narrative',
                    scenarioId: 'test'
                });
                
                if (prediction && prediction.predictedQuality !== undefined) {
                    this.recordTest('AI GM Quality Prediction', true, `Prediction: ${(prediction.predictedQuality * 100).toFixed(1)}%`);
                } else {
                    this.recordTest('AI GM Quality Prediction', false, 'No prediction returned');
                }
            } catch (error) {
                this.recordTest('AI GM Quality Prediction', false, error.message);
            }

        } catch (error) {
            this.recordTest('AI GM Integration', false, error.message);
        }
    }

    /**
     * Test Code Roach Integration
     */
    async testCodeRoachIntegration() {
        log.info('\n📊 Testing Code Roach Integration...');

        try {
            const path = require('path');
            const codeRoachPath = path.join(__dirname, '../../smuggler-code-roach/lib/mlCodeQualityIntegration');
            
            try {
                const { getMLCodeQualityIntegration } = require(codeRoachPath);
                const mlIntegration = getMLCodeQualityIntegration();
                await mlIntegration.initialize();
                
                if (mlIntegration.isAvailable()) {
                    this.recordTest('Code Roach ML Integration', true, 'ML integration available');
                } else {
                    this.recordTest('Code Roach ML Integration', false, 'ML not available');
                }
            } catch (error) {
                this.recordTest('Code Roach ML Integration', false, error.message);
            }

        } catch (error) {
            this.recordTest('Code Roach Integration', false, error.message);
        }
    }

    /**
     * Test Daisy Chain Integration
     */
    async testDaisyChainIntegration() {
        log.info('\n📊 Testing Daisy Chain Integration...');

        try {
            const path = require('path');
            const daisyPath = path.join(__dirname, '../../smuggler-daisy-chain/lib/mlQualityIntegration');
            
            try {
                const { getMLQualityIntegration } = require(daisyPath);
                const mlIntegration = getMLQualityIntegration();
                await mlIntegration.initialize();
                
                if (mlIntegration.isAvailable()) {
                    this.recordTest('Daisy Chain ML Integration', true, 'ML integration available');
                } else {
                    this.recordTest('Daisy Chain ML Integration', false, 'ML not available');
                }
            } catch (error) {
                this.recordTest('Daisy Chain ML Integration', false, error.message);
            }

        } catch (error) {
            this.recordTest('Daisy Chain Integration', false, error.message);
        }
    }

    /**
     * Test Oracle Integration
     */
    async testOracleIntegration() {
        log.info('\n📊 Testing Oracle Integration...');

        try {
            const path = require('path');
            const oraclePath = path.join(__dirname, '../../smuggler-oracle/lib/mlKnowledgeQuality');
            
            try {
                const { getMLKnowledgeQuality } = require(oraclePath);
                const mlQuality = getMLKnowledgeQuality();
                await mlQuality.initialize();
                
                if (mlQuality.isAvailable()) {
                    this.recordTest('Oracle ML Integration', true, 'ML integration available');
                } else {
                    this.recordTest('Oracle ML Integration', false, 'ML not available');
                }
            } catch (error) {
                this.recordTest('Oracle ML Integration', false, error.message);
            }

        } catch (error) {
            this.recordTest('Oracle Integration', false, error.message);
        }
    }

    /**
     * Test ML System Core
     */
    async testMLSystemCore() {
        log.info('\n📊 Testing ML System Core...');

        // Test ML Model Integration
        try {
            const { getMLModelIntegration } = require('../lib/mlops/mlModelIntegration');
            const mlIntegration = await getMLModelIntegration();
            
            if (mlIntegration.isMLModelAvailable()) {
                this.recordTest('ML Model Integration', true, 'Model available');
            } else {
                this.recordTest('ML Model Integration', false, 'Model not available');
            }
        } catch (error) {
            this.recordTest('ML Model Integration', false, error.message);
        }

        // Test Ensemble Predictor
        try {
            const { getEnsemblePredictor } = require('../lib/mlops/ensemblePredictor');
            const ensemble = await getEnsemblePredictor();
            const info = ensemble.getInfo();
            
            if (info.modelCount > 0) {
                this.recordTest('Ensemble Predictor', true, `${info.modelCount} models loaded`);
            } else {
                this.recordTest('Ensemble Predictor', false, 'No models available');
            }
        } catch (error) {
            this.recordTest('Ensemble Predictor', false, error.message);
        }

        // Test Batch Predictor
        try {
            const { getBatchPredictor } = require('../lib/mlops/batchPredictor');
            const batchPredictor = getBatchPredictor();
            this.recordTest('Batch Predictor', true, 'Batch predictor available');
        } catch (error) {
            this.recordTest('Batch Predictor', false, error.message);
        }

        // Test Prediction Cache
        try {
            const { getPredictionCache } = require('../lib/mlops/predictionCache');
            const cache = getPredictionCache();
            const stats = cache.getStats();
            this.recordTest('Prediction Cache', true, `Cache size: ${stats.size}/${stats.maxSize}`);
        } catch (error) {
            this.recordTest('Prediction Cache', false, error.message);
        }
    }

    /**
     * Record test result
     */
    recordTest(name, passed, message = '') {
        this.results.tests.push({
            name,
            passed,
            message,
            timestamp: new Date().toISOString()
        });

        if (passed) {
            this.results.passed++;
            log.info(`  ✅ ${name}: ${message}`);
        } else {
            this.results.failed++;
            log.error(`  ❌ ${name}: ${message}`);
        }
    }

    /**
     * Print test summary
     */
    printSummary() {
        log.info('\n' + '='.repeat(60));
        log.info('📊 Test Summary');
        log.info('='.repeat(60));
        log.info(`  Passed: ${this.results.passed}`);
        log.info(`  Failed: ${this.results.failed}`);
        log.info(`  Skipped: ${this.results.skipped}`);
        log.info(`  Total: ${this.results.passed + this.results.failed + this.results.skipped}`);
        
        const successRate = ((this.results.passed / (this.results.passed + this.results.failed)) * 100).toFixed(1);
        log.info(`  Success Rate: ${successRate}%`);
        log.info('='.repeat(60));

        if (this.results.failed > 0) {
            log.warn('\n⚠️  Some tests failed. Check logs above for details.');
        } else {
            log.info('\n✅ All tests passed!');
        }
    }
}

async function main() {
    const tests = new IntegrationTests();
    await tests.runAll();
    
    process.exit(tests.results.failed > 0 ? 1 : 0);
}

if (require.main === module) {
    main();
}

module.exports = { IntegrationTests };

