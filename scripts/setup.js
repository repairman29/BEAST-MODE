#!/usr/bin/env node

/**
 * BEAST MODE Setup Script
 * Initializes BEAST MODE in a new project or environment
 */

const fs = require('fs-extra');
const { createLogger } = require('../utils/logger');
const log = createLogger('setup');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function ask(question) {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer.toLowerCase().trim());
        });
    });
}

async function setup() {
    log.info('⚔️  BEAST MODE Setup');
    log.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    log.info('');

    const cwd = process.cwd();
    const projectName = path.basename(cwd);

    log.info(`Setting up BEAST MODE in: ${projectName}`);
    log.info('');

    // Check if already initialized
    const configPath = path.join(cwd, '.beast-mode.json');
    if (await fs.pathExists(configPath)) {
        const overwrite = await ask('BEAST MODE is already initialized. Overwrite? (y/N): ');
        if (overwrite !== 'y' && overwrite !== 'yes') {
            log.info('Setup cancelled.');
            rl.close();
            return;
        }
    }

    // Enterprise setup
    const enterprise = await ask('Enable enterprise features? (y/N): ');

    // Marketplace setup
    const marketplace = await ask('Enable marketplace features? (Y/n): ');
    const enableMarketplace = marketplace === '' || marketplace === 'y' || marketplace === 'yes';

    // Analytics setup
    const analytics = await ask('Enable predictive analytics? (Y/n): ');
    const enableAnalytics = analytics === '' || analytics === 'y' || analytics === 'yes';

    // Team optimization
    const optimization = await ask('Enable team optimization? (Y/n): ');
    const enableOptimization = optimization === '' || optimization === 'y' || optimization === 'yes';

    // Knowledge management
    const knowledge = await ask('Enable knowledge management? (Y/n): ');
    const enableKnowledge = knowledge === '' || knowledge === 'y' || knowledge === 'yes';

    rl.close();

    log.info('\n🔧 Configuring BEAST MODE...');

    // Create configuration
    const config = {
        version: '1.0.0',
        project: projectName,
        initialized: new Date().toISOString(),
        enterprise: enterprise === 'y' || enterprise === 'yes',
        capabilities: {
            quality: true,
            marketplace: enableMarketplace,
            analytics: enableAnalytics,
            optimization: enableOptimization,
            knowledge: enableKnowledge
        },
        settings: {
            autoUpdate: true,
            telemetry: false,
            cacheEnabled: true,
            logLevel: 'info'
        },
        paths: {
            root: cwd,
            config: '.beast-mode.json',
            cache: '.beast-mode/cache',
            plugins: '.beast-mode/plugins',
            integrations: '.beast-mode/integrations',
            logs: '.beast-mode/logs',
            reports: '.beast-mode/reports'
        }
    };

    // Create directories
    log.info('📁 Creating directories...');
    await fs.ensureDir(path.join(cwd, '.beast-mode'));
    await fs.ensureDir(path.join(cwd, '.beast-mode', 'cache'));
    await fs.ensureDir(path.join(cwd, '.beast-mode', 'plugins'));
    await fs.ensureDir(path.join(cwd, '.beast-mode', 'integrations'));
    await fs.ensureDir(path.join(cwd, '.beast-mode', 'logs'));
    await fs.ensureDir(path.join(cwd, '.beast-mode', 'reports'));

    // Write configuration
    log.info('⚙️  Writing configuration...');
    await fs.writeJson(configPath, config, { spaces: 2 });

    // Create .beast-mode-ignore
    const ignorePath = path.join(cwd, '.beast-mode-ignore');
    const ignoreContent = `node_modules/
.git/
.env
*.log
coverage/
.nyc_output/
.cache/
dist/
build/
.DS_Store
.vscode/
.idea/
*.swp
*.swo
`;
    await fs.writeFile(ignorePath, ignoreContent);

    // Initialize components
    log.info('🚀 Initializing components...');

    if (enableMarketplace) {
        log.info('  📦 Setting up marketplace...');
        // Initialize marketplace directories and config
    }

    if (enableAnalytics) {
        log.info('  🔮 Setting up predictive analytics...');
        // Initialize analytics models and data structures
    }

    if (enableOptimization) {
        log.info('  👥 Setting up team optimization...');
        // Initialize optimization algorithms and baselines
    }

    if (enableKnowledge) {
        log.info('  🧠 Setting up knowledge management...');
        // Initialize knowledge graph and search indexes
    }

    // Create sample configuration files
    log.info('📝 Creating sample configurations...');

    // Quality configuration
    const qualityConfig = {
        enabled: true,
        validators: ['logger', 'supabase', 'cross-platform', 'scoping'],
        autoFix: false,
        reportFormat: 'json',
        thresholds: {
            critical: 0,
            warning: 10,
            info: 25
        }
    };
    await fs.writeJson(path.join(cwd, '.beast-mode', 'quality.json'), qualityConfig, { spaces: 2 });

    // Marketplace configuration
    if (enableMarketplace) {
        const marketplaceConfig = {
            enabled: true,
            registry: 'https://marketplace.beast-mode.dev',
            trustedPublishers: [],
            autoUpdate: true,
            cache: {
                enabled: true,
                ttl: 3600000 // 1 hour
            }
        };
        await fs.writeJson(path.join(cwd, '.beast-mode', 'marketplace.json'), marketplaceConfig, { spaces: 2 });
    }

    // Analytics configuration
    if (enableAnalytics) {
        const analyticsConfig = {
            enabled: true,
            models: {
                quality: 'default',
                velocity: 'default',
                risk: 'default'
            },
            confidence: 0.8,
            horizon: '90d',
            training: {
                enabled: true,
                frequency: 'weekly'
            }
        };
        await fs.writeJson(path.join(cwd, '.beast-mode', 'analytics.json'), analyticsConfig, { spaces: 2 });
    }

    log.info('\n✅ BEAST MODE setup complete!');
    log.info('');
    log.info('🎯 Next steps:');
    log.info('  1. Run "beast-mode quality check" to verify setup');
    log.info('  2. Run "beast-mode dashboard" to launch the web interface');
    log.info('  3. Run "beast-mode marketplace browse" to explore plugins');
    log.info('');
    log.info('📚 Documentation: https://beast-mode.dev/docs');
    log.info('💬 Community: https://discord.gg/beast-mode');
    log.info('');
    log.info('⚔️  BEAST MODE is now active in your project!');
    log.info('🏆 Ready to transform your development economics!');
}

if (require.main === module) {
    setup().catch((error) => {
        log.error('❌ Setup failed:', error.message);
        process.exit(1);
    });
}

module.exports = { setup };

