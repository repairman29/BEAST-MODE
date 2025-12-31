/**
 * Comprehensive Integration Test Suite
 * Tests all ML system integrations across all services
 * 
 * Month 4: Week 2 - Testing & Validation
 */

const { createLogger } = require('../lib/utils/logger');
const log = createLogger('IntegrationTests');

class ComprehensiveIntegrationTests {
    constructor() {
        this.results = {
            passed: 0,
            failed: 0,
            skipped: 0,
            tests: []
        };
        this.services = {
            'Code Roach': { path: '../../smuggler-code-roach/lib/mlCodeQualityIntegration', status: 'pending' },
            'Oracle': { path: '../../smuggler-oracle/lib/mlKnowledgeQuality', status: 'pending' },
            'Daisy Chain': { path: '../../smuggler-daisy-chain/lib/mlQualityIntegration', status: 'pending' },
            'AI GM': { path: '../../smuggler-ai-gm/src/services/aiGMQualityPredictionServiceML', status: 'pending' },
            'First Mate': { path: '../../first-mate-app/lib/mlPlayerExperience', status: 'pending' },
            'Game App': { path: '../lib/mlops/gameNarrativeIntegration', status: 'pending' }
        };
    }

    /**
     * Run all integration tests
     */
    async runAll() {
        log.info('🧪 Running Comprehensive Integration Tests');
        log.info('='.repeat(60));

        // Test Core ML System
        await this.testCoreMLSystem();

        // Test Service Integrations
        await this.testServiceIntegrations();

        // Test API Endpoints
        await this.testAPIEndpoints();

        // Test Performance
        await this.testPerformance();

        // Print summary
        this.printSummary();
    }

    /**
     * Test Core ML System
     */
    async testCoreMLSystem() {
        log.info('\n📊 Testing Core ML System...');

        // Test ML Model Integration
        try {
            const { getMLModelIntegration } = require('../lib/mlops/mlModelIntegration');
            const mlIntegration = await getMLModelIntegration();
            
            if (mlIntegration.isMLModelAvailable()) {
                const info = mlIntegration.getModelInfo();
                this.recordTest('ML Model Integration', true, `Model: ${info.modelVersion || 'unknown'}`);
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
                this.recordTest('Ensemble Predictor', true, `${info.modelCount} models, ${info.strategies.length} strategies`);
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
            this.recordTest('Batch Predictor', true, 'Available');
        } catch (error) {
            this.recordTest('Batch Predictor', false, error.message);
        }

        // Test Prediction Cache
        try {
            const { getPredictionCache } = require('../lib/mlops/predictionCache');
            const cache = getPredictionCache();
            const stats = cache.getStats();
            this.recordTest('Prediction Cache', true, `Size: ${stats.size}/${stats.maxSize}, Hit Rate: ${stats.hitRate}%`);
        } catch (error) {
            this.recordTest('Prediction Cache', false, error.message);
        }

        // Test Production Monitoring
        try {
            const { getProductionMonitoring } = require('../lib/mlops/productionMonitoring');
            const monitoring = getProductionMonitoring();
            const dashboard = monitoring.getDashboard();
            this.recordTest('Production Monitoring', true, `Health: ${dashboard.health.status}`);
        } catch (error) {
            this.recordTest('Production Monitoring', false, error.message);
        }

        // Test Performance Optimizer
        try {
            const { getPerformanceOptimizer } = require('../lib/mlops/performanceOptimizer');
            const optimizer = getPerformanceOptimizer();
            await optimizer.initialize();
            const metrics = optimizer.getMetrics();
            this.recordTest('Performance Optimizer', true, `Cache Hit Rate: ${metrics.cache.hitRate}`);
        } catch (error) {
            this.recordTest('Performance Optimizer', false, error.message);
        }
    }

    /**
     * Test Service Integrations
     */
    async testServiceIntegrations() {
        log.info('\n📊 Testing Service Integrations...');

        for (const [serviceName, serviceInfo] of Object.entries(this.services)) {
            try {
                const path = require('path');
                const servicePath = path.join(__dirname, serviceInfo.path);
                
                try {
                    delete require.cache[require.resolve(servicePath)];
                    const service = require(servicePath);
                    
                    // Try to get integration instance
                    let integration = null;
                    if (service.getMLCodeQualityIntegration) {
                        integration = service.getMLCodeQualityIntegration();
                    } else if (service.getMLKnowledgeQuality) {
                        integration = service.getMLKnowledgeQuality();
                    } else if (service.getMLQualityIntegration) {
                        integration = service.getMLQualityIntegration();
                    } else if (service.getGameNarrativeIntegration) {
                        integration = service.getGameNarrativeIntegration();
                    } else if (service.default && typeof service.default === 'object') {
                        integration = service.default;
                    } else {
                        integration = service;
                    }

                    // Initialize if needed
                    if (integration && typeof integration.initialize === 'function') {
                        await integration.initialize();
                    }

                    // Check availability
                    let available = false;
                    if (integration && typeof integration.isAvailable === 'function') {
                        available = integration.isAvailable();
                    } else if (integration && integration.mlIntegration) {
                        available = integration.mlIntegration && integration.mlIntegration.isMLModelAvailable();
                    } else {
                        available = integration !== null;
                    }

                    if (available) {
                        this.recordTest(`${serviceName} Integration`, true, 'Available');
                        this.services[serviceName].status = 'available';
                    } else {
                        this.recordTest(`${serviceName} Integration`, false, 'Not available');
                        this.services[serviceName].status = 'unavailable';
                    }
                } catch (error) {
                    this.recordTest(`${serviceName} Integration`, false, error.message);
                    this.services[serviceName].status = 'error';
                }
            } catch (error) {
                this.recordTest(`${serviceName} Integration`, false, `Path error: ${error.message}`);
            }
        }
    }

    /**
     * Test API Endpoints (simulated)
     */
    async testAPIEndpoints() {
        log.info('\n📊 Testing API Endpoints...');

        const endpoints = [
            { name: '/api/ml/predict', type: 'POST' },
            { name: '/api/ml/predict', type: 'GET' },
            { name: '/api/ml/monitoring', type: 'GET' },
            { name: '/api/ml/monitoring', type: 'POST' },
            { name: '/api/game/ml-predict', type: 'POST' },
            { name: '/api/game/ml-predict', type: 'GET' }
        ];

        for (const endpoint of endpoints) {
            // Check if endpoint file exists
            try {
                const path = require('path');
                const fs = require('fs');
                
                // Convert /api/ml/predict to ml/predict/route.ts
                let endpointPath = endpoint.name.replace(/^\/api\//, '').replace(/\//g, '/');
                const filePath = path.join(__dirname, `../website/app/api/${endpointPath}/route.ts`);
                
                if (fs.existsSync(filePath)) {
                    this.recordTest(`API ${endpoint.name} (${endpoint.type})`, true, 'Endpoint exists');
                } else {
                    // Try alternative path structure
                    const altPath = path.join(__dirname, `../website/app/api${endpoint.name}/route.ts`);
                    if (fs.existsSync(altPath)) {
                        this.recordTest(`API ${endpoint.name} (${endpoint.type})`, true, 'Endpoint exists');
                    } else {
                        this.recordTest(`API ${endpoint.name} (${endpoint.type})`, false, `File not found: ${filePath}`);
                    }
                }
            } catch (error) {
                this.recordTest(`API ${endpoint.name} (${endpoint.type})`, false, error.message);
            }
        }
    }

    /**
     * Test Performance
     */
    async testPerformance() {
        log.info('\n📊 Testing Performance...');

        // Test prediction latency
        try {
            const { getMLModelIntegration } = require('../lib/mlops/mlModelIntegration');
            const mlIntegration = await getMLModelIntegration();
            
            if (mlIntegration.isMLModelAvailable()) {
                const startTime = Date.now();
                const prediction = mlIntegration.predictQualitySync({
                    provider: 'openai',
                    model: 'gpt-4',
                    actionType: 'test',
                    scenarioId: 'test'
                });
                const latency = Date.now() - startTime;
                
                if (latency < 100) {
                    this.recordTest('Prediction Latency', true, `${latency}ms (excellent)`);
                } else if (latency < 200) {
                    this.recordTest('Prediction Latency', true, `${latency}ms (good)`);
                } else {
                    this.recordTest('Prediction Latency', false, `${latency}ms (slow)`);
                }
            } else {
                this.recordTest('Prediction Latency', false, 'Model not available');
            }
        } catch (error) {
            this.recordTest('Prediction Latency', false, error.message);
        }

        // Test cache performance
        try {
            const { getPredictionCache } = require('../lib/mlops/predictionCache');
            const cache = getPredictionCache();
            
            const testContext = { provider: 'test', model: 'test', actionType: 'test' };
            const testPrediction = { predictedQuality: 0.8, confidence: 0.9 };
            
            // Set and get from cache
            cache.set(testContext, testPrediction);
            const cached = cache.get(testContext);
            
            if (cached) {
                this.recordTest('Cache Performance', true, 'Cache working');
            } else {
                this.recordTest('Cache Performance', false, 'Cache not working');
            }
        } catch (error) {
            this.recordTest('Cache Performance', false, error.message);
        }

        // Test batch performance
        try {
            const { getBatchPredictor } = require('../lib/mlops/batchPredictor');
            const batchPredictor = getBatchPredictor();
            
            const contexts = Array(10).fill(null).map((_, i) => ({
                provider: 'test',
                model: 'test',
                actionType: `test-${i}`
            }));
            
            const startTime = Date.now();
            const results = await batchPredictor.predictBatch(contexts, { useCache: false });
            const latency = Date.now() - startTime;
            
            if (results && results.results) {
                const avgLatency = latency / contexts.length;
                if (avgLatency < 50) {
                    this.recordTest('Batch Performance', true, `${avgLatency.toFixed(1)}ms avg (excellent)`);
                } else if (avgLatency < 100) {
                    this.recordTest('Batch Performance', true, `${avgLatency.toFixed(1)}ms avg (good)`);
                } else {
                    this.recordTest('Batch Performance', false, `${avgLatency.toFixed(1)}ms avg (slow)`);
                }
            } else {
                this.recordTest('Batch Performance', false, 'No results returned');
            }
        } catch (error) {
            this.recordTest('Batch Performance', false, error.message);
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
        
        const successRate = this.results.passed + this.results.failed > 0
            ? ((this.results.passed / (this.results.passed + this.results.failed)) * 100).toFixed(1)
            : 0;
        log.info(`  Success Rate: ${successRate}%`);
        
        log.info('\n📋 Service Status:');
        for (const [serviceName, serviceInfo] of Object.entries(this.services)) {
            const icon = serviceInfo.status === 'available' ? '✅' : serviceInfo.status === 'error' ? '❌' : '⚠️';
            log.info(`  ${icon} ${serviceName}: ${serviceInfo.status}`);
        }
        
        log.info('='.repeat(60));

        if (this.results.failed > 0) {
            log.warn('\n⚠️  Some tests failed. Check logs above for details.');
        } else {
            log.info('\n✅ All tests passed!');
        }
    }
}

async function main() {
    const tests = new ComprehensiveIntegrationTests();
    await tests.runAll();
    
    process.exit(tests.results.failed > 0 ? 1 : 0);
}

if (require.main === module) {
    main();
}

module.exports = { ComprehensiveIntegrationTests };

