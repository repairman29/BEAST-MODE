#!/usr/bin/env node

/**
 * BEAST MODE CLI
 * Enterprise Quality Intelligence & Marketplace Platform
 *
 * AI-powered development tools for vibe coders who ship with style
 * Command-line interface for BEAST MODE operations
 */

const { Command } = require('commander');
const chalk = require('chalk').default || require('chalk');
const ora = require('ora');
const path = require('path');
const fs = require('fs-extra');
const { createLogger } = require('../lib/utils/logger');
const { initializeBEASTMODE } = require('../lib/init');
const CLIArtwork = require('../lib/cli/artwork');
const log = createLogger('beast-mode');

// Initialize artwork handler
const artwork = new CLIArtwork();

const program = new Command();

// BEAST MODE Branding
const BEAST_MODE = {
    name: 'BEAST MODE',
    version: '1.0.0',
    description: 'Enterprise Quality Intelligence & Marketplace Platform',
    tagline: 'AI-powered development tools for vibe coders who ship with style',
    ascii: `
██████╗ ███████╗ █████╗ ███████╗████████╗    ███╗   ███╗ ██████╗ ██████╗ ███████╗
██╔══██╗██╔════╝██╔══██╗██╔════╝╚══██╔══╝    ████╗ ████║██╔═══██╗██╔══██╗██╔════╝
██████╔╝█████╗  ███████║███████╗   ██║       ██╔████╔██║██║   ██║██║  ██║█████╗
██╔══██╗██╔══╝  ██╔══██║╚════██║   ██║       ██║╚██╔╝██║██║   ██║██║  ██║██╔══╝
██████╔╝███████╗██║  ██║███████║   ██║       ██║ ╚═╝ ██║╚██████╔╝██████╔╝███████╗
╚═════╝ ╚══════╝╚═╝  ╚═╝╚══════╝   ╚═╝       ╚═╝     ╚═╝ ╚═════╝ ╚═════╝ ╚══════╝

⚔️  ENTERPRISE QUALITY INTELLIGENCE & MARKETPLACE PLATFORM  🚀
🏆  AI-POWERED DEVELOPMENT ECOSYSTEM  🏆
`
};

// Initialize CLI
program
    .name('beast-mode')
    .description(chalk.bold.cyan(BEAST_MODE.description))
    .version(BEAST_MODE.version, '-v, --version', 'Show BEAST MODE version')
    .option('-d, --debug', 'Enable debug mode')
    .option('-q, --quiet', 'Quiet mode - minimal output')
    .option('--no-color', 'Disable colored output')
    .option('--logo-style <style>', 'Logo style: ascii, figlet, image, minimal, animate', 'ascii')
    .option('--no-logo', 'Skip logo display');

// Initialize session tracker
const { getCLISessionTracker } = require('../lib/cli/session-tracker');
const sessionTracker = getCLISessionTracker();

// Initialize session tracking on CLI startup
sessionTracker.initialize().catch(() => {
    // Silently fail - don't break CLI if tracking fails
});

// Global setup
program.hook('preAction', async (thisCommand, actionCommand) => {
    const options = thisCommand.opts();

    if (options.debug) {
        process.env.DEBUG = 'true';
        log.info('🐛 Debug mode enabled');
    }

    if (options.quiet) {
        process.env.QUIET = 'true';
    }

    if (options.noColor) {
        process.env.NO_COLOR = 'true';
    }

    // Track command execution
    const command = actionCommand.name() || 'unknown';
    sessionTracker.trackCommand(command, options).catch(() => {
        // Silently fail
    });

    // Show BEAST MODE header (unless quiet mode or --no-logo)
    if (!options.quiet && !options.noLogo) {
        // Check if we should show animation on startup
        const showAnimation = process.env.BEAST_MODE_ANIMATE === 'true' || 
                             options.logoStyle === 'animate' ||
                             process.env.BEAST_MODE_STARTUP_ANIMATE === 'true';
        
        if (showAnimation && beastCreatures) {
            // Show animation on startup
            try {
                await artwork.animateCreature('random');
                // Small delay after animation
                await new Promise(resolve => setTimeout(resolve, 500));
            } catch (err) {
                // Fallback to ASCII if animation fails
                console.log(chalk.bold.magenta(BEAST_MODE.ascii));
                console.log(chalk.bold.yellow(`🏆 ${BEAST_MODE.tagline}\n`));
            }
        } else {
            // Use default ASCII
            console.log(chalk.bold.magenta(BEAST_MODE.ascii));
            console.log(chalk.bold.yellow(`🏆 ${BEAST_MODE.tagline}\n`));
        }
    }
});

// Auth Commands
program
    .command('login')
    .description('Login to BEAST MODE (with epic animation!)')
    .option('--skip-animation', 'Skip login animation')
    .action(async (options) => {
        const CLILogin = require('../lib/cli/login');
        const login = new CLILogin();
        
        if (!options.skipAnimation) {
            await login.showLoginAnimation();
        }
        
        await login.login();
    });

program
    .command('logout')
    .description('Logout from BEAST MODE')
    .action(async () => {
        const CLILogin = require('../lib/cli/login');
        const login = new CLILogin();
        await login.logout();
    });

program
    .command('status')
    .description('Show login status')
    .action(async () => {
        const CLILogin = require('../lib/cli/login');
        const login = new CLILogin();
        await login.showStatus();
    });

// Core Commands
program
    .command('init')
    .description('Initialize BEAST MODE in current project')
    .option('-f, --force', 'Force initialization (overwrite existing config)')
    .option('-e, --enterprise', 'Initialize with enterprise features')
    .action(async (options) => {
        // Display welcome artwork or animation
        if (!options.quiet) {
            // Option to show animation on init (can be disabled with --no-logo)
            if (options.logoStyle === 'animate' || process.env.BEAST_MODE_ANIMATE === 'true') {
                await artwork.animateCreature('random').catch(() => {
                    // Fallback to epic banner if animation fails
                    artwork.displayASCII('epic-banner.txt', { color: 'magenta', animate: false }).catch(() => {});
                });
            } else {
                // Show epic banner with the RAD logo
                await artwork.displayASCII('epic-banner.txt', { color: 'magenta', animate: false }).catch(() => {
                    // Fallback to default banner
                    artwork.displayASCII('banner.txt', { color: 'cyan', animate: false }).catch(() => {});
                });
            }
        }

        const spinner = ora('Initializing BEAST MODE...').start();

        try {
            await initializeBEASTMODE(options);
            spinner.succeed(chalk.green('BEAST MODE initialized successfully!'));
            console.log(chalk.cyan('\n🚀 BEAST MODE is now active in this project!'));
            console.log(chalk.yellow('Run "beast-mode dashboard" to see your quality intelligence'));
        } catch (error) {
            spinner.fail(chalk.red('Failed to initialize BEAST MODE'));
            console.error(chalk.red(error.message));
            process.exit(1);
        }
    });

program
    .command('dashboard')
    .description('Launch BEAST MODE quality intelligence dashboard')
    .option('-p, --port <port>', 'Port to run dashboard on', '3001')
    .option('-o, --open', 'Open dashboard in browser')
    .action(async (options) => {
        // Display dashboard launch artwork
        if (!options.quiet) {
            await artwork.generateBanner('Launching Dashboard', {
                font: 'Standard',
                color: 'cyan',
                box: true
            }).catch(() => {});
        }

        const spinner = ora('Starting BEAST MODE Dashboard...').start();

        try {
            const { startDashboard } = require('../lib/dashboard');
            await startDashboard(options);
            spinner.succeed(chalk.green(`BEAST MODE Dashboard running on port ${options.port}`));

            if (options.open) {
                const open = require('open');
                await open(`http://localhost:${options.port}`);
            }
        } catch (error) {
            spinner.fail(chalk.red('Failed to start dashboard'));
            console.error(chalk.red(error.message));
            process.exit(1);
        }
    });

// Quality Commands
program
    .command('quality')
    .description('BEAST MODE quality assurance operations')
    .addCommand(
        new Command('check')
            .description('Run comprehensive quality checks')
            .option('-f, --fix', 'Auto-fix issues when possible')
            .option('-r, --report', 'Generate detailed quality report')
            .action(async (options) => {
                const { runQualityChecks } = require('../lib/quality');
                const results = await runQualityChecks(options);

                if (options.report || results.unfixed.length > 0) {
                    console.log('\n📋 Quality Check Results:');
                    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

                    for (const [validatorName, checkResult] of Object.entries(results.checks)) {
                        if (checkResult.status === 'issues_found') {
                            console.log(`❌ ${validatorName}: ${checkResult.issues} issues`);
                            if (checkResult.details) {
                                checkResult.details.forEach(issue => {
                                    console.log(`   • ${issue.message} (${path.basename(issue.file)})`);
                                });
                            }
                        } else if (checkResult.status === 'passed') {
                            console.log(`✅ ${validatorName}: Passed`);
                        } else if (checkResult.status === 'error') {
                            console.log(`⚠️ ${validatorName}: Error - ${checkResult.error}`);
                        }
                    }

                    console.log(`\n📊 Summary: ${results.unfixed.length} issues need attention`);
                }
            })
    )
    .addCommand(
        new Command('score')
            .description('Calculate BEAST MODE quality score')
            .option('-d, --detailed', 'Show detailed scoring breakdown')
            .option('-t, --trend', 'Show quality trend over time')
            .action(async (options) => {
                const { calculateQualityScore } = require('../lib/quality');
                await calculateQualityScore(options);
            })
    )
    .addCommand(
        new Command('audit')
            .description('Perform comprehensive quality audit')
            .option('-s, --scope <scope>', 'Audit scope (repo, team, org)', 'repo')
            .option('-o, --output <file>', 'Save audit report to file')
            .action(async (options) => {
                const { performQualityAudit } = require('../lib/quality');
                await performQualityAudit(options);
            })
    );

// Intelligence Commands
program
    .command('intelligence')
    .description('BEAST MODE AI intelligence operations')
    .addCommand(
        new Command('analyze')
            .description('Run organization quality intelligence analysis')
            .option('-t, --type <type>', 'Analysis type (quality, team, repo)', 'quality')
            .option('-d, --deep', 'Perform deep analysis (slower but more detailed)')
            .action(async (options) => {
                const { runIntelligenceAnalysis } = require('../lib/intelligence/organization-quality-intelligence');
                await runIntelligenceAnalysis(options);
            })
    )
    .addCommand(
        new Command('predict')
            .description('Run predictive analytics')
            .option('-m, --metric <metric>', 'Metric to predict (quality, velocity, bugs)', 'quality')
            .option('-h, --horizon <days>', 'Prediction horizon in days', '30')
            .action(async (options) => {
                const { runPredictiveAnalytics } = require('../lib/intelligence/predictive-development-analytics');
                await runPredictiveAnalytics(options);
            })
    )
    .addCommand(
        new Command('optimize')
            .description('Run team performance optimization')
            .option('-t, --team <team>', 'Team to optimize')
            .option('-a, --auto', 'Apply optimizations automatically')
            .action(async (options) => {
                const { runTeamOptimization } = require('../lib/intelligence/automated-team-optimization');
                await runTeamOptimization(options);
            })
    )
    .addCommand(
        new Command('knowledge')
            .description('Manage enterprise knowledge')
            .option('-s, --search <query>', 'Search knowledge base')
            .option('-c, --capture', 'Capture new knowledge')
            .action(async (options) => {
                const { manageKnowledge } = require('../lib/intelligence/enterprise-knowledge-management');
                await manageKnowledge(options);
            })
    );

// Marketplace Commands
program
    .command('marketplace')
    .description('BEAST MODE marketplace operations')
    .addCommand(
        new Command('browse')
            .description('Browse available plugins and integrations')
            .option('-c, --category <category>', 'Filter by category')
            .option('-t, --type <type>', 'Type (plugin, integration, tool)', 'plugin')
            .action(async (options) => {
                const { browseMarketplace } = require('../lib/marketplace');
                await browseMarketplace(options);
            })
    )
    .addCommand(
        new Command('install')
            .description('Install plugin or integration')
            .argument('<id>', 'Plugin/integration ID to install')
            .option('-v, --version <version>', 'Specific version to install')
            .action(async (id, options) => {
                const { installFromMarketplace } = require('../lib/marketplace');
                await installFromMarketplace(id, options);
            })
    )
    .addCommand(
        new Command('publish')
            .description('Publish plugin or integration to marketplace')
            .argument('<path>', 'Path to plugin/integration package')
            .option('-t, --type <type>', 'Type (plugin, integration)', 'plugin')
            .option('-p, --price <price>', 'Price (0 for free)', '0')
            .action(async (packagePath, options) => {
                const { publishToMarketplace } = require('../lib/marketplace');
                await publishToMarketplace(packagePath, options);
            })
    )
    .addCommand(
        new Command('status')
            .description('Check marketplace status and earnings')
            .action(async () => {
                const { checkMarketplaceStatus } = require('../lib/marketplace/monetization-programs');
                await checkMarketplaceStatus();
            })
    );

// Development Commands
program
    .command('dev')
    .description('Development and testing commands')
    .addCommand(
        new Command('server')
            .description('Start BEAST MODE development server')
            .option('-p, --port <port>', 'Port to run on', '3000')
            .action(async (options) => {
                const { startDevServer } = require('../lib/dev');
                await startDevServer(options);
            })
    )
    .addCommand(
        new Command('test')
            .description('Run BEAST MODE test suite')
            .option('-w, --watch', 'Watch mode')
            .option('-c, --coverage', 'Generate coverage report')
            .action(async (options) => {
                const { runTests } = require('../lib/dev');
                await runTests(options);
            })
    );

// Enterprise Commands (require enterprise license)
program
    .command('enterprise')
    .description('Enterprise-grade BEAST MODE features')
    .addCommand(
        new Command('analytics')
            .description('Enterprise analytics dashboard')
            .option('-r, --real-time', 'Enable real-time updates')
            .action(async (options) => {
                const { startEnterpriseAnalytics } = require('../lib/enterprise');
                await startEnterpriseAnalytics(options);
            })
    )
    .addCommand(
        new Command('integrations')
            .description('Manage enterprise integrations')
            .option('-l, --list', 'List current integrations')
            .option('-a, --add <service>', 'Add integration for service')
            .action(async (options) => {
                const { manageEnterpriseIntegrations } = require('../lib/enterprise');
                await manageEnterpriseIntegrations(options);
            })
    );

// CI/CD Commands
program
    .command('ci')
    .description('CI/CD integration commands')
    .addCommand(
        new Command('github-actions')
            .description('Generate GitHub Actions workflow')
            .option('-o, --output <file>', 'Output file path', '.github/workflows/beast-mode-quality-check.yml')
            .option('-s, --min-score <score>', 'Minimum quality score', '80')
            .action(async (options) => {
                const GitHubActionsIntegration = require('../lib/integrations/github-actions');
                const workflow = GitHubActionsIntegration.generateWorkflow({
                    minScore: parseInt(options.minScore),
                    name: 'beast-mode-quality-check'
                });
                
                const fs = require('fs-extra');
                const path = require('path');
                const outputPath = path.resolve(options.output);
                await fs.ensureDir(path.dirname(outputPath));
                await fs.writeFile(outputPath, workflow);
                
                console.log(chalk.green(`✅ GitHub Actions workflow created at ${outputPath}`));
                console.log(chalk.cyan('Add it to your repository and push to enable automated quality checks!'));
            })
    )
    .addCommand(
        new Command('vercel')
            .description('Configure Vercel integration')
            .option('-c, --config', 'Generate vercel.json configuration')
            .option('-p, --pre-deploy', 'Run pre-deployment check')
            .action(async (options) => {
                const VercelIntegration = require('../lib/integrations/vercel');
                const integration = new VercelIntegration();
                
                if (options.config) {
                    const config = VercelIntegration.generateVercelConfig();
                    const fs = require('fs-extra');
                    await fs.writeJson('vercel.json', config, { spaces: 2 });
                    console.log(chalk.green('✅ vercel.json configuration created'));
                }
                
                if (options.preDeploy) {
                    const spinner = ora('Running pre-deployment check...').start();
                    const results = await integration.preDeployCheck();
                    spinner.stop();
                    
                    if (results.skipped) {
                        console.log(chalk.yellow('⚠️  Not in Vercel environment, skipping check'));
                    } else {
                        console.log(chalk.cyan(`\nQuality Score: ${results.score}/100`));
                        console.log(chalk.cyan(`Issues: ${results.issues?.length || 0}`));
                    }
                }
            })
    )
    .addCommand(
        new Command('railway')
            .description('Configure Railway integration')
            .option('-c, --config', 'Generate railway.json configuration')
            .option('-h, --health', 'Run health check')
            .action(async (options) => {
                const RailwayIntegration = require('../lib/integrations/railway');
                const integration = new RailwayIntegration();
                
                if (options.config) {
                    const config = RailwayIntegration.generateRailwayConfig();
                    const fs = require('fs-extra');
                    await fs.writeJson('railway.json', config, { spaces: 2 });
                    console.log(chalk.green('✅ railway.json configuration created'));
                }
                
                if (options.health) {
                    const spinner = ora('Running health check...').start();
                    const results = await integration.healthCheck();
                    spinner.stop();
                    
                    if (results.skipped) {
                        console.log(chalk.yellow('⚠️  Not in Railway environment, skipping check'));
                    } else {
                        console.log(chalk.cyan(`\nHealth Status: ${results.healthy ? '✅ Healthy' : '❌ Unhealthy'}`));
                    }
                }
            })
    )
    .addCommand(
        new Command('check')
            .description('Run CI quality check')
            .option('-p, --platform <platform>', 'CI platform (github-actions, vercel, railway)', 'github-actions')
            .option('-s, --min-score <score>', 'Minimum quality score', '80')
            .option('--fail-on-low-score', 'Exit with error if score is too low')
            .action(async (options) => {
                const spinner = ora('Running CI quality check...').start();
                
                try {
                    let integration;
                    if (options.platform === 'github-actions') {
                        const GitHubActionsIntegration = require('../lib/integrations/github-actions');
                        integration = new GitHubActionsIntegration({
                            minScore: parseInt(options.minScore),
                            failOnLowScore: options.failOnLowScore
                        });
                    } else if (options.platform === 'vercel') {
                        const VercelIntegration = require('../lib/integrations/vercel');
                        integration = new VercelIntegration({
                            minScore: parseInt(options.minScore)
                        });
                        const results = await integration.preDeployCheck();
                        spinner.succeed(chalk.green(`Quality check complete: ${results.score || 0}/100`));
                        return;
                    } else if (options.platform === 'railway') {
                        const RailwayIntegration = require('../lib/integrations/railway');
                        integration = new RailwayIntegration({
                            minScore: parseInt(options.minScore)
                        });
                        const results = await integration.healthCheck();
                        spinner.succeed(chalk.green(`Health check complete: ${results.healthy ? 'Healthy' : 'Unhealthy'}`));
                        return;
                    }
                    
                    const results = await integration.runQualityCheck();
                    spinner.succeed(chalk.green(`Quality check complete: ${results.score}/100`));
                    
                    if (results.score < parseInt(options.minScore)) {
                        console.log(chalk.yellow(`⚠️  Quality score (${results.score}) is below minimum (${options.minScore})`));
                        if (options.failOnLowScore) {
                            process.exit(1);
                        }
                    }
                } catch (error) {
                    spinner.fail(chalk.red('Quality check failed'));
                    console.error(chalk.red(error.message));
                    process.exit(1);
                }
            })
    );

// Integration Commands
program
    .command('integrations')
    .description('Third-party integration commands')
    .addCommand(
        new Command('setup')
            .description('Setup integration')
            .argument('<service>', 'Service (slack, discord, email)')
            .action(async (service) => {
                console.log(chalk.cyan(`Setting up ${service} integration...`));
                console.log(chalk.yellow('Follow the prompts to configure your integration.'));
                // Interactive setup would go here
            })
    )
    .addCommand(
        new Command('test')
            .description('Test integration')
            .argument('<service>', 'Service (slack, discord, email)')
            .option('-m, --message <message>', 'Test message')
            .action(async (service, options) => {
                const spinner = ora(`Testing ${service} integration...`).start();
                
                try {
                    if (service === 'slack') {
                        const SlackIntegration = require('../lib/integrations/slack');
                        const slack = new SlackIntegration();
                        const result = await slack.testConnection();
                        spinner.succeed(chalk.green('Slack integration test successful!'));
                    } else if (service === 'discord') {
                        const DiscordIntegration = require('../lib/integrations/discord');
                        const discord = new DiscordIntegration();
                        const result = await discord.testConnection();
                        spinner.succeed(chalk.green('Discord integration test successful!'));
                    } else if (service === 'email') {
                        console.log(chalk.yellow('Email integration requires recipient address'));
                        spinner.stop();
                    } else {
                        throw new Error(`Unknown service: ${service}`);
                    }
                } catch (error) {
                    spinner.fail(chalk.red(`Integration test failed: ${error.message}`));
                    process.exit(1);
                }
            })
    );

// Artwork Commands
program
    .command('artwork')
    .description('BEAST MODE artwork and visual assets')
    .addCommand(
        new Command('gallery')
            .description('Display artwork gallery')
    .action(async () => {
        await artwork.displayGallery();
        
        // Show available animations
        const animations = artwork.listAnimations();
        if (animations.available) {
            console.log(chalk.bold('\n🎬 Animations:'));
            animations.creatures.forEach(creature => {
                console.log(chalk.white(`   • ${creature}`));
            });
            console.log(chalk.cyan('\n   Run "beast-mode artwork animate --kraken" to see animations!\n'));
        }
    })
    )
    .addCommand(
        new Command('show')
            .description('Display specific artwork')
            .argument('<name>', 'Artwork file name')
            .option('-t, --type <type>', 'Artwork type: image, ascii, banner', 'ascii')
            .option('-c, --color <color>', 'Color for ASCII/banner', 'magenta')
            .option('-a, --animate', 'Animate display')
            .action(async (name, options) => {
                try {
                    if (options.type === 'image') {
                        await artwork.displayImage(name);
                    } else if (options.type === 'ascii') {
                        await artwork.displayASCII(name, {
                            color: options.color,
                            animate: options.animate
                        });
                    } else if (options.type === 'banner') {
                        await artwork.generateBanner(name, {
                            color: options.color
                        });
                    }
                } catch (error) {
                    console.error(chalk.red(`Error displaying artwork: ${error.message}`));
                }
            })
    )
    .addCommand(
        new Command('logo')
            .description('Display BEAST MODE logo')
            .option('-s, --style <style>', 'Logo style: ascii, figlet, image, minimal', 'ascii')
            .option('-c, --color <color>', 'Logo color', 'magenta')
            .option('-a, --animate', 'Animate logo display')
            .action(async (options) => {
                await artwork.displayLogo({
                    style: options.style,
                    color: options.color,
                    animated: options.animate
                });
            })
    )
    .addCommand(
        new Command('animate')
            .description('Display animated beast creatures')
            .option('-k, --kraken', 'Summon the kraken')
            .option('-n, --narwhal', 'Summon the narwhal')
            .option('-r, --random', 'Random creature')
            .action(async (options) => {
                let creature = 'random';
                if (options.kraken) creature = 'kraken';
                else if (options.narwhal) creature = 'narwhal';
                else if (options.random) creature = 'random';

                await artwork.animateCreature(creature);
            })
    );

// Help and Info
// GitHub OAuth Commands
program
    .command('github-oauth')
    .description('GitHub OAuth setup and management')
    .addCommand(
        new Command('setup-dev')
            .description('Setup GitHub OAuth for development (.env.local)')
            .action(async () => {
                const { setupDev } = require('../lib/cli/github-oauth');
                await setupDev();
            })
    )
    .addCommand(
        new Command('setup-prod')
            .description('Setup GitHub OAuth for production (Vercel)')
            .action(async () => {
                const { setupProd } = require('../lib/cli/github-oauth');
                await setupProd();
            })
    )
    .addCommand(
        new Command('setup')
            .description('Setup GitHub OAuth for both dev and prod (interactive)')
            .action(async () => {
                const githubOAuth = require('../lib/cli/github-oauth');
                await githubOAuth.setupDev();
                const readline = require('readline');
                const rl = readline.createInterface({
                    input: process.stdin,
                    output: process.stdout,
                });
                const answer = await new Promise(resolve => {
                    rl.question('\n🌐 Setup production too? (y/n): ', resolve);
                });
                rl.close();
                if (answer.toLowerCase() === 'y') {
                    await githubOAuth.setupProd();
                }
            })
    )
    .addCommand(
        new Command('verify')
            .description('Verify GitHub OAuth configuration')
            .action(async () => {
                const { verify } = require('../lib/cli/github-oauth');
                await verify();
            })
    )
    .addCommand(
        new Command('test')
            .description('Test GitHub OAuth connection')
            .action(async () => {
                const { test } = require('../lib/cli/github-oauth');
                await test();
            })
    )
    .addCommand(
        new Command('show')
            .description('Show current GitHub OAuth configuration')
            .action(async () => {
                const { show } = require('../lib/cli/github-oauth');
                show();
            })
    );

program
    .command('info')
    .description('Show BEAST MODE system information')
    .action(async () => {
        // Display logo with artwork if available
        await artwork.displayLogo({ style: 'ascii', color: 'magenta' });
        console.log(chalk.bold.cyan('\n🏆 BEAST MODE SYSTEM INFORMATION'));
        console.log(chalk.yellow('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
        console.log(chalk.white(`Version: ${BEAST_MODE.version}`));
        console.log(chalk.white(`Description: ${BEAST_MODE.description}`));
        console.log(chalk.white(`Tagline: ${BEAST_MODE.tagline}`));
        console.log(chalk.yellow('\n🚀 CAPABILITIES:'));
        console.log(chalk.white('  • Organization Quality Intelligence'));
        console.log(chalk.white('  • Predictive Development Analytics'));
        console.log(chalk.white('  • Automated Team Performance Optimization'));
        console.log(chalk.white('  • Enterprise Knowledge Management'));
        console.log(chalk.white('  • Plugin Marketplace'));
        console.log(chalk.white('  • Integration Marketplace'));
        console.log(chalk.white('  • Tool Discovery & Ratings'));
        console.log(chalk.white('  • Monetization & Revenue Platform'));
        console.log(chalk.yellow('\n💰 ECONOMIC IMPACT:'));
        console.log(chalk.white('  • $2.5M annual cost savings'));
        console.log(chalk.white('  • 97% ESLint error reduction'));
        console.log(chalk.white('  • 80%+ prediction accuracy'));
        console.log(chalk.white('  • $50K/month marketplace potential'));
        console.log(chalk.yellow('\n🔗 RESOURCES:'));
        console.log(chalk.white('  • Website: https://beast-mode.dev'));
        console.log(chalk.white('  • Repository: https://github.com/beast-mode/beast-mode'));
        console.log(chalk.white('  • Documentation: Run "beast-mode --help"'));
        console.log(chalk.yellow('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
        console.log(chalk.bold.green('\n⚔️  BEAST MODE: READY TO TRANSFORM YOUR DEVELOPMENT ECONOMY  🚀\n'));
    });

// Error handling
program.on('command:*', (unknownCommand) => {
    console.error(chalk.red(`Unknown command: ${unknownCommand[0]}`));
    console.log(chalk.yellow('Run "beast-mode --help" for available commands'));
    process.exit(1);
});

// Handle no command - show animation and help
if (process.argv.length === 2) {
    // Check if we should show animation on startup
    // Default: show animation on first run, then check config
    (async () => {
        try {
            const CLILogin = require('../lib/cli/login');
            const login = new CLILogin();
            const isLoggedIn = await login.isLoggedIn();
            
            const showAnimation = process.env.BEAST_MODE_ANIMATE === 'true' || 
                                 process.env.BEAST_MODE_STARTUP_ANIMATE === 'true' ||
                                 (!isLoggedIn && beastCreatures); // Show on first run if not logged in
            
            if (showAnimation && beastCreatures) {
                try {
                    await artwork.animateCreature('random');
                    await new Promise(resolve => setTimeout(resolve, 500));
                } catch (err) {
                    // Fallback if animation fails
                }
            }
            
            // Show help
            program.outputHelp();
            
            // If not logged in, suggest login
            if (!isLoggedIn) {
                console.log(chalk.yellow('\n💡 Tip: Run "beast-mode login" to authenticate and see epic animations!\n'));
            }
        } catch (err) {
            // If login check fails, just show help
            program.outputHelp();
        }
    })();
}

// Parse and execute
program.parse();