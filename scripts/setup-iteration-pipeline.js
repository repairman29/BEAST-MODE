#!/usr/bin/env node

/**
 * Setup Iteration Pipeline
 * Sets up automatic retraining and model improvement workflow
 * 
 * Month 1: Iteration Setup
 */

const { createLogger } = require('../lib/utils/logger');
const log = createLogger('SetupIteration');

async function main() {
    log.info('🔄 Setting up ML Model Iteration Pipeline');
    log.info('='.repeat(60));

    try {
        const fs = require('fs').promises;
        const path = require('path');

        // Create iteration config
        const config = {
            autoRetrain: {
                enabled: true,
                interval: '7d', // Retrain every 7 days
                minNewSamples: 100, // Need at least 100 new samples
                triggerOnAccuracyDrop: true,
                accuracyDropThreshold: 0.05 // Retrain if accuracy drops 5%
            },
            dataCollection: {
                enabled: true,
                interval: '1h', // Collect data every hour
                sources: ['supabase', 'csat_service']
            },
            modelVersioning: {
                enabled: true,
                keepVersions: 5, // Keep last 5 model versions
                autoPromote: false // Manual promotion to production
            },
            monitoring: {
                enabled: true,
                trackMetrics: ['accuracy', 'mae', 'rmse', 'r2'],
                alertOnDegradation: true
            }
        };

        const configPath = path.join(process.cwd(), '.beast-mode', 'iteration-config.json');
        await fs.mkdir(path.dirname(configPath), { recursive: true });
        await fs.writeFile(configPath, JSON.stringify(config, null, 2));

        log.info('✅ Created iteration config');
        log.info(`   Location: ${configPath}`);

        // Create iteration script
        const iterationScript = `#!/usr/bin/env node

/**
 * ML Model Iteration Pipeline
 * Automatically retrains models when new data is available
 */

const { getDataIntegrationService } = require('../lib/mlops/dataIntegration');
const { QualityPredictorTrainerXGBoost } = require('../lib/models/trainQualityPredictorXGBoost');
const { createLogger } = require('../lib/utils/logger');
const fs = require('fs').promises;
const path = require('path');

const log = createLogger('IterationPipeline');

async function runIteration() {
    log.info('🔄 Running ML Model Iteration Pipeline...');

    try {
        // 1. Collect new data
        const dataIntegration = await getDataIntegrationService();
        const collectionResult = await dataIntegration.collectAll({
            limit: 1000,
            days: 7 // Last 7 days
        });

        if (collectionResult.total < 100) {
            log.info('Not enough new data for retraining');
            return;
        }

        log.info(\`Collected \${collectionResult.total} new samples\`);

        // 2. Train new model
        const trainer = new QualityPredictorTrainerXGBoost();
        const result = await trainer.train({
            useMLflow: true,
            testSize: 0.2,
            minSamples: 100
        });

        // 3. Compare with current model
        const currentModelPath = path.join(process.cwd(), '.beast-mode', 'models', 'quality-predictor-v1.json');
        let shouldPromote = false;

        if (result.metrics.accuracy > 0.85) {
            shouldPromote = true;
            log.info('✅ New model meets quality threshold, ready for promotion');
        }

        // 4. Save new model version
        const version = new Date().toISOString().split('T')[0].replace(/-/g, '');
        const newModelPath = path.join(process.cwd(), '.beast-mode', 'models', \`quality-predictor-v\${version}.json\`);
        await trainer.saveModel(newModelPath);

        log.info(\`💾 New model saved: \${newModelPath}\`);
        log.info(\`📊 Performance: Accuracy \${(result.metrics.accuracy * 100).toFixed(1)}%\`);

        if (shouldPromote) {
            log.info('💡 To promote: Update model path in mlModelIntegration.js');
        }

    } catch (error) {
        log.error('Iteration failed:', error.message);
    }
}

if (require.main === module) {
    runIteration().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

module.exports = { runIteration };
`;

        const scriptPath = path.join(process.cwd(), 'scripts', 'run-iteration.js');
        await fs.writeFile(scriptPath, iterationScript);
        await fs.chmod(scriptPath, '755');

        log.info('✅ Created iteration script');
        log.info(`   Location: ${scriptPath}`);

        log.info('');
        log.info('🎉 Iteration pipeline setup complete!');
        log.info('');
        log.info('📋 Usage:');
        log.info('  Manual: node scripts/run-iteration.js');
        log.info('  Cron: Add to crontab for automatic retraining');
        log.info('  Example: 0 2 * * 0 (every Sunday at 2 AM)');
        log.info('');

    } catch (error) {
        log.error('❌ Setup failed:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

module.exports = { main };

