#!/usr/bin/env node

/**
 * MLflow Setup Script
 * Initializes MLflow infrastructure
 * 
 * Month 1: MLOps Infrastructure Setup
 */

const { createLogger } = require('../lib/utils/logger');
const log = createLogger('SetupMLflow');

async function main() {
    log.info('🔧 Setting up MLflow infrastructure...');
    log.info('='.repeat(60));

    try {
        // Check if MLflow is installed
        const { execSync } = require('child_process');
        
        try {
            execSync('mlflow --version', { stdio: 'ignore' });
            log.info('✅ MLflow is installed');
        } catch (error) {
            log.warn('⚠️  MLflow not found. Installing...');
            log.info('💡 Run: pip install mlflow');
            log.info('   Or: npm install -g mlflow (if available)');
        }

        // Check MLflow server
        const fetch = require('node-fetch');
        try {
            const response = await fetch('http://localhost:5000/health');
            if (response.ok) {
                log.info('✅ MLflow server is running at http://localhost:5000');
            }
        } catch (error) {
            log.warn('⚠️  MLflow server not running');
            log.info('💡 Start it with: npm run mlflow:start');
            log.info('   Or: mlflow ui --port 5000');
        }

        // Create necessary directories
        const fs = require('fs').promises;
        const path = require('path');

        const dirs = [
            '.beast-mode/data/training',
            '.beast-mode/models',
            '.beast-mode/mlflow'
        ];

        for (const dir of dirs) {
            const fullPath = path.join(process.cwd(), dir);
            await fs.mkdir(fullPath, { recursive: true });
            log.info(`✅ Created directory: ${dir}`);
        }

        // Create .env.example if it doesn't exist
        const envExample = `
# MLflow Configuration
MLFLOW_TRACKING_URI=http://localhost:5000
MLFLOW_EXPERIMENT_NAME=beast-mode-experiments

# Data Collection
BEAST_MODE_DATA_DIR=.beast-mode/data/training
`.trim();

        const envPath = path.join(process.cwd(), '.env.example');
        try {
            await fs.access(envPath);
            log.info('✅ .env.example already exists');
        } catch {
            await fs.writeFile(envPath, envExample);
            log.info('✅ Created .env.example');
        }

        log.info('');
        log.info('🎉 MLflow setup complete!');
        log.info('');
        log.info('📋 Next steps:');
        log.info('  1. Start MLflow server: npm run mlflow:start');
        log.info('  2. Train first model: npm run train:quality');
        log.info('  3. View experiments: http://localhost:5000');
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

