/**
 * Deploy Model to Production
 * Handles model deployment with A/B testing support
 */

const path = require('path');
const { getProductionDeployment } = require('../lib/mlops/productionDeployment');
const { createLogger } = require('../lib/utils/logger');

const log = createLogger('DeployModel');

async function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        log.error('Usage: node deploy-model.js <model-path> [options]');
        log.error('Options:');
        log.error('  --version <version>           Model version (default: latest)');
        log.error('  --traffic <percentage>        Traffic percentage (default: 100)');
        log.error('  --ab-test <name>             Enable A/B testing with name');
        log.error('  --rollback [version]         Rollback to previous version');
        log.error('  --status                     Show deployment status');
        log.error('  --promote <experiment>        Promote A/B test winner');
        process.exit(1);
    }

    try {
        const deployment = getProductionDeployment();

        // Handle rollback
        if (args[0] === '--rollback') {
            const version = args[1] || null;
            const result = await deployment.rollback(version);
            log.info(`✅ Rolled back to version ${result.previousVersion}`);
            return;
        }

        // Handle status
        if (args[0] === '--status') {
            const status = await deployment.getDeploymentStatus();
            log.info('📊 Deployment Status:');
            log.info(`   Current Model: ${status.currentModel?.version || 'None'}`);
            log.info(`   Total Deployments: ${status.totalDeployments}`);
            log.info(`   Active A/B Tests: ${status.activeABTests}`);
            return;
        }

        // Handle promote
        if (args[0] === '--promote') {
            const experimentName = args[1];
            if (!experimentName) {
                log.error('Experiment name required');
                process.exit(1);
            }
            const result = await deployment.promoteABTestWinner(experimentName);
            log.info(`✅ Promoted ${result.winner} to production`);
            return;
        }

        // Parse options
        const modelPath = args[0];
        const options = {
            version: 'latest',
            trafficPercentage: 100,
            enableABTesting: false,
            abTestName: null
        };

        for (let i = 1; i < args.length; i++) {
            if (args[i] === '--version' && args[i + 1]) {
                options.version = args[i + 1];
                i++;
            } else if (args[i] === '--traffic' && args[i + 1]) {
                options.trafficPercentage = parseInt(args[i + 1]);
                i++;
            } else if (args[i] === '--ab-test' && args[i + 1]) {
                options.enableABTesting = true;
                options.abTestName = args[i + 1];
                i++;
            }
        }

        // Resolve model path
        let resolvedPath = modelPath;
        if (!path.isAbsolute(modelPath)) {
            resolvedPath = path.join(process.cwd(), modelPath);
        }

        // Deploy
        log.info('🚀 Deploying model to production...');
        const result = await deployment.deployModel(resolvedPath, options);

        if (result.success) {
            log.info('✅ Model deployed successfully!');
            log.info(`   Version: ${result.model.version}`);
            log.info(`   Traffic: ${result.model.trafficPercentage}%`);
            if (result.model.abTestName) {
                log.info(`   A/B Test: ${result.model.abTestName}`);
            }
        }

    } catch (error) {
        log.error('❌ Deployment failed:', error.message);
        log.error(error.stack);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { main };

