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

// Brand/Reputation/Secret Interceptor
const { BrandReputationInterceptor } = require('../lib/janitor/brand-reputation-interceptor');

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

// Janitor Commands (The AI Janitor)
program
    .command('janitor')
    .description('🧹 BEAST MODE Janitor - The AI Janitor for vibe coders')
    .addCommand(
        new Command('enable')
            .description('Enable overnight maintenance mode')
            .option('--overnight', 'Enable overnight automatic refactoring')
            .action(async (options) => {
                const { BeastMode } = require('../lib');
                const beastMode = new BeastMode({ janitor: { enabled: true } });
                await beastMode.initialize();
                
                if (options.overnight) {
                    await beastMode.janitor.enableOvernightMode();
                    console.log(chalk.green('🌙 Overnight maintenance mode enabled'));
                    console.log(chalk.gray('BEAST MODE will automatically refactor your code between 2 AM - 6 AM'));
                } else {
                    beastMode.janitor.options.enabled = true;
                    console.log(chalk.green('✅ Janitor enabled'));
                }
            })
    )
    .addCommand(
        new Command('disable')
            .description('Disable janitor services')
            .action(async () => {
                const { BeastMode } = require('../lib');
                const beastMode = new BeastMode({ janitor: { enabled: false } });
                await beastMode.initialize();
                await beastMode.janitor.disableOvernightMode();
                console.log(chalk.yellow('☀️ Janitor disabled'));
            })
    )
    .addCommand(
        new Command('status')
            .description('Show janitor status')
            .action(async () => {
                const { BeastMode } = require('../lib');
                const beastMode = new BeastMode({ janitor: {} });
                await beastMode.initialize();
                const status = beastMode.janitor.getStatus();
                
                console.log('\n🧹 BEAST MODE Janitor Status');
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                console.log(`Enabled: ${status.enabled ? chalk.green('Yes') : chalk.red('No')}`);
                console.log(`Overnight Mode: ${status.silentRefactoring?.overnightMode ? chalk.green('Yes') : chalk.red('No')}`);
                console.log(`Last Run: ${status.silentRefactoring?.lastRun?.timestamp || 'Never'}`);
                
                if (status.silentRefactoring?.stats) {
                    console.log(`\n📊 Statistics:`);
                    console.log(`  Total Runs: ${status.silentRefactoring.stats.totalRuns}`);
                    console.log(`  Total Fixes: ${status.silentRefactoring.stats.totalFixes}`);
                    console.log(`  Security Fixes: ${status.silentRefactoring.stats.totalSecurityFixes}`);
                    console.log(`  Deduplications: ${status.silentRefactoring.stats.totalDeduplications}`);
                }
            })
    )
    .addCommand(
        new Command('refactor')
            .description('Run manual refactoring cycle')
            .option('--dry-run', 'Show what would be changed without applying')
            .action(async (options) => {
                const spinner = ora('Running refactoring cycle...').start();
                try {
                    const { BeastMode } = require('../lib');
                    const beastMode = new BeastMode({ janitor: {} });
                    await beastMode.initialize();
                    
                    const results = await beastMode.janitor.runRefactoring();
                    spinner.succeed('Refactoring complete!');
                    
                    console.log('\n📋 Refactoring Results:');
                    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                    if (results.deduplications.length > 0) {
                        console.log(chalk.cyan(`🔄 ${results.deduplications.length} deduplications`));
                    }
                    if (results.securityFixes.length > 0) {
                        console.log(chalk.green(`🔒 ${results.securityFixes.length} security fixes`));
                    }
                    if (results.improvements.length > 0) {
                        console.log(chalk.blue(`✨ ${results.improvements.length} improvements`));
                    }
                    if (results.errors.length > 0) {
                        console.log(chalk.red(`❌ ${results.errors.length} errors`));
                    }
                } catch (error) {
                    spinner.fail(`Refactoring failed: ${error.message}`);
                }
            })
    );

// Vibe Restoration Commands
program
    .command('vibe')
    .description('🔄 Vibe Restoration - Rewind to last working state')
    .addCommand(
        new Command('check')
            .description('Check for regressions')
            .action(async () => {
                const { BeastMode } = require('../lib');
                const beastMode = new BeastMode({ janitor: {} });
                await beastMode.initialize();
                
                const result = await beastMode.janitor.checkVibe();
                
                if (result.hasRegression) {
                    console.log(chalk.red('\n⚠️  Regression Detected!'));
                    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                    console.log(`Quality dropped from ${chalk.yellow(result.regression.previousQuality)} to ${chalk.red(result.regression.currentQuality)}`);
                    console.log(`Severity: ${chalk.red(result.regression.severity)}`);
                    console.log(`\nRun ${chalk.cyan('beast-mode vibe restore')} to restore to last good state`);
                } else {
                    console.log(chalk.green('\n✅ No regressions detected'));
                    console.log(`Current Quality: ${chalk.green(result.currentState?.quality || 'N/A')}`);
                }
            })
    )
    .addCommand(
        new Command('restore')
            .description('Restore to last good state')
            .option('--commit <hash>', 'Restore to specific commit')
            .option('--no-branch', 'Don\'t create restore branch')
            .action(async (options) => {
                const spinner = ora('Restoring to last good state...').start();
                try {
                    const { BeastMode } = require('../lib');
                    const beastMode = new BeastMode({ janitor: {} });
                    await beastMode.initialize();
                    
                    const result = await beastMode.janitor.restore({
                        commit: options.commit,
                        createBranch: !options.noBranch
                    });
                    
                    spinner.succeed('Restored successfully!');
                    console.log(`\n✅ Restored to commit: ${chalk.cyan(result.targetCommit.substring(0, 7))}`);
                    if (result.branch) {
                        console.log(`Branch: ${chalk.cyan(result.branch)}`);
                    }
                } catch (error) {
                    spinner.fail(`Restore failed: ${error.message}`);
                }
            })
    )
    .addCommand(
        new Command('analyze')
            .description('Analyze regression')
            .option('--index <index>', 'Analyze specific regression by index')
            .action(async (options) => {
                const { BeastMode } = require('../lib');
                const beastMode = new BeastMode({ janitor: {} });
                await beastMode.initialize();
                
                const analysis = await beastMode.janitor.analyzeRegression(
                    options.index ? parseInt(options.index) : null
                );
                
                if (analysis.error) {
                    console.log(chalk.red(analysis.error));
                    return;
                }
                
                console.log('\n📊 Regression Analysis');
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                console.log(`Quality Drop: ${chalk.red(analysis.qualityDrop)} points`);
                console.log(`Severity: ${chalk.yellow(analysis.severity)}`);
                console.log(`\nAffected Files: ${analysis.affectedFiles.length}`);
                analysis.affectedFiles.slice(0, 5).forEach(file => {
                    console.log(`  • ${file}`);
                });
                
                if (analysis.suggestions.length > 0) {
                    console.log(`\n💡 Suggestions:`);
                    analysis.suggestions.forEach(suggestion => {
                        console.log(`  • ${suggestion}`);
                    });
                }
            })
    );

// Architecture Enforcement Commands
program
    .command('architecture')
    .description('🛡️ Architecture Enforcement - Prevent bad patterns')
    .addCommand(
        new Command('check')
            .description('Check for architecture violations')
            .action(async () => {
                const { BeastMode } = require('../lib');
                const beastMode = new BeastMode({ janitor: {} });
                await beastMode.initialize();
                
                const result = await beastMode.janitor.checkArchitecture();
                
                if (result.passed) {
                    console.log(chalk.green('\n✅ No architecture violations detected'));
                } else {
                    console.log(chalk.red(`\n❌ ${result.violations.length} violations detected`));
                    result.violations.forEach(v => {
                        console.log(`  • ${v.type}: ${v.message} (${v.file})`);
                    });
                }
            })
    )
    .addCommand(
        new Command('rules')
            .description('Show architecture rules')
            .action(async () => {
                const { BeastMode } = require('../lib');
                const beastMode = new BeastMode({ janitor: {} });
                await beastMode.initialize();
                
                const status = beastMode.janitor.architectureEnforcer.getStatus();
                console.log('\n🛡️ Architecture Rules');
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                console.log(`Auto-fix: ${status.autoFix ? chalk.green('Enabled') : chalk.red('Disabled')}`);
                console.log(`Pre-commit hook: ${status.preCommitHook ? chalk.green('Installed') : chalk.red('Not installed')}`);
                console.log(`\nViolations caught: ${chalk.cyan(status.stats.violationsCaught)}`);
                console.log(`Auto-fixes: ${chalk.green(status.stats.autoFixes)}`);
            })
    );

// Repo Memory Commands
program
    .command('memory')
    .description('🧠 Repo-Level Memory - Semantic graph of architecture')
    .addCommand(
        new Command('build')
            .description('Build semantic graph of codebase')
            .action(async () => {
                const spinner = ora('Building semantic graph...').start();
                try {
                    const { BeastMode } = require('../lib');
                    const beastMode = new BeastMode({ janitor: {} });
                    await beastMode.initialize();
                    
                    await beastMode.janitor.repoMemory.buildGraph();
                    const stats = beastMode.janitor.repoMemory.getStats();
                    
                    spinner.succeed('Graph built successfully!');
                    console.log('\n📊 Graph Statistics:');
                    console.log(`  Files: ${chalk.cyan(stats.files)}`);
                    console.log(`  Dependencies: ${chalk.cyan(stats.dependencies)}`);
                    console.log(`  Layers: ${chalk.cyan(stats.layers)}`);
                    console.log(`  Patterns: ${chalk.cyan(stats.patterns)}`);
                    console.log(`  Functions: ${chalk.cyan(stats.functions)}`);
                    console.log(`  Components: ${chalk.cyan(stats.components)}`);
                    console.log(`  APIs: ${chalk.cyan(stats.apis)}`);
                } catch (error) {
                    spinner.fail(`Failed: ${error.message}`);
                }
            })
    )
    .addCommand(
        new Command('context')
            .description('Get architectural context for a file')
            .argument('<file>', 'File path')
            .action(async (file) => {
                const { BeastMode } = require('../lib');
                const beastMode = new BeastMode({ janitor: {} });
                await beastMode.initialize();
                
                const context = beastMode.janitor.repoMemory.getContext(file);
                if (!context) {
                    console.log(chalk.red('File not found in graph. Run "beast-mode memory build" first.'));
                    return;
                }
                
                console.log('\n🧠 Architectural Context:');
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                console.log(`File: ${chalk.cyan(context.file)}`);
                console.log(`Type: ${chalk.yellow(context.type)}`);
                console.log(`Layer: ${chalk.blue(context.layer)}`);
                console.log(`\nDependencies: ${context.dependencies.length}`);
                context.dependencies.slice(0, 5).forEach(dep => {
                    console.log(`  • ${dep.path} (${dep.type})`);
                });
            })
    )
    .addCommand(
        new Command('stats')
            .description('Show memory statistics')
            .action(async () => {
                const { BeastMode } = require('../lib');
                const beastMode = new BeastMode({ janitor: {} });
                await beastMode.initialize();
                
                const stats = beastMode.janitor.repoMemory.getStats();
                console.log('\n🧠 Repo Memory Statistics:');
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                console.log(`Files analyzed: ${chalk.cyan(stats.files)}`);
                console.log(`Dependencies: ${chalk.cyan(stats.dependencies)}`);
                console.log(`Architecture layers: ${chalk.cyan(stats.layers)}`);
                console.log(`Patterns detected: ${chalk.cyan(stats.patterns)}`);
                console.log(`Functions: ${chalk.cyan(stats.functions)}`);
                console.log(`Components: ${chalk.cyan(stats.components)}`);
                console.log(`APIs: ${chalk.cyan(stats.apis)}`);
                console.log(`Last updated: ${chalk.gray(stats.lastUpdated || 'Never')}`);
            })
    );

// Vibe Ops Commands
program
    .command('vibe-ops')
    .description('🎭 Vibe Ops - Visual AI Testing (QA for English)')
    .addCommand(
        new Command('test')
            .description('Create and run a test from English description')
            .argument('<description>', 'Test description in English')
            .option('--run', 'Run test immediately')
            .action(async (description, options) => {
                const { BeastMode } = require('../lib');
                const beastMode = new BeastMode({ janitor: { vibeOps: {} } });
                await beastMode.initialize();
                
                const test = await beastMode.janitor.vibeOps.createTest(description);
                console.log(chalk.green(`\n✅ Test created: "${description}"`));
                console.log(`Test ID: ${chalk.cyan(test.id)}`);
                
                if (options.run) {
                    const spinner = ora('Running test...').start();
                    const result = await beastMode.janitor.vibeOps.runTest(test.id);
                    spinner.succeed(result.passed ? 'Test passed!' : 'Test failed!');
                    
                    if (!result.passed && result.errors) {
                        console.log('\n❌ Errors:');
                        result.errors.forEach(err => {
                            console.log(`  • ${err.step}: ${err.error}`);
                        });
                    }
                }
            })
    )
    .addCommand(
        new Command('run')
            .description('Run all tests')
            .action(async () => {
                const spinner = ora('Running all tests...').start();
                try {
                    const { BeastMode } = require('../lib');
                    const beastMode = new BeastMode({ janitor: { vibeOps: {} } });
                    await beastMode.initialize();
                    
                    const results = await beastMode.janitor.vibeOps.runAllTests();
                    spinner.succeed('Tests complete!');
                    
                    console.log('\n📊 Test Results:');
                    console.log(`  Total: ${chalk.cyan(results.total)}`);
                    console.log(`  Passed: ${chalk.green(results.passed)}`);
                    console.log(`  Failed: ${chalk.red(results.failed)}`);
                } catch (error) {
                    spinner.fail(`Failed: ${error.message}`);
                }
            })
    )
    .addCommand(
        new Command('report')
            .description('Generate plain English test report')
            .action(async () => {
                const { BeastMode } = require('../lib');
                const beastMode = new BeastMode({ janitor: { vibeOps: {} } });
                await beastMode.initialize();
                
                const report = beastMode.janitor.vibeOps.generateReport();
                console.log('\n📋 Test Report:');
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                console.log(`Total: ${report.summary.total}`);
                console.log(`Passed: ${chalk.green(report.summary.passed)}`);
                console.log(`Failed: ${chalk.red(report.summary.failed)}`);
                console.log('\nDetails:');
                report.details.forEach(detail => {
                    console.log(`\n${detail.status}: ${detail.test}`);
                    if (detail.errors.length > 0) {
                        detail.errors.forEach(err => {
                            console.log(`  • ${chalk.red(err)}`);
                        });
                    }
                });
            })
    );

// Invisible CI/CD Commands
program
    .command('cicd')
    .description('🔇 Invisible CI/CD - Silent background checks')
    .addCommand(
        new Command('check')
            .description('Run all checks silently')
            .option('--show', 'Show output (not silent)')
            .action(async (options) => {
                const spinner = ora('Running checks...').start();
                try {
                    const { BeastMode } = require('../lib');
                    const beastMode = new BeastMode({ janitor: { invisibleCICD: { silent: !options.show } } });
                    await beastMode.initialize();
                    
                    const results = await beastMode.janitor.invisibleCICD.runChecks();
                    spinner.succeed('Checks complete!');
                    
                    if (options.show) {
                        console.log('\n📊 Check Results:');
                        if (results.linting) {
                            console.log(`Linting: ${results.linting.passed ? chalk.green('Passed') : chalk.red(`Failed (${results.linting.issues.length} issues)`)}`);
                        }
                        if (results.testing) {
                            console.log(`Testing: ${results.testing.passed ? chalk.green('Passed') : chalk.red(`Failed`)}`);
                        }
                        if (results.security) {
                            console.log(`Security: ${results.security.passed ? chalk.green('Passed') : chalk.red(`Failed (${results.security.issues.length} issues)`)}`);
                        }
                        if (results.fixes.length > 0) {
                            console.log(`\n✅ Auto-fixed: ${chalk.green(results.fixes.length)} issue(s)`);
                        }
                    }
                } catch (error) {
                    spinner.fail(`Failed: ${error.message}`);
                }
            })
    )
    .addCommand(
        new Command('status')
            .description('Show CI/CD status')
            .action(async () => {
                const { BeastMode } = require('../lib');
                const beastMode = new BeastMode({ janitor: { invisibleCICD: {} } });
                await beastMode.initialize();
                
                const status = beastMode.janitor.invisibleCICD.getStatus();
                console.log('\n🔇 Invisible CI/CD Status:');
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                console.log(`Enabled: ${status.enabled ? chalk.green('Yes') : chalk.red('No')}`);
                console.log(`Silent mode: ${status.silent ? chalk.green('Yes') : chalk.red('No')}`);
                console.log(`Auto-fix: ${status.autoFix ? chalk.green('Enabled') : chalk.red('Disabled')}`);
                console.log(`\nStatistics:`);
                console.log(`  Total runs: ${chalk.cyan(status.stats.totalRuns)}`);
                console.log(`  Issues found: ${chalk.yellow(status.stats.issuesFound)}`);
                console.log(`  Issues fixed: ${chalk.green(status.stats.issuesFixed)}`);
                console.log(`  Tests run: ${chalk.cyan(status.stats.testsRun)}`);
                console.log(`  Tests passed: ${chalk.green(status.stats.testsPassed)}`);
            })
    );

// Prompt Chain Debugger Commands
program
    .command('prompt')
    .description('🔗 Prompt Chain Debugger - Debug by prompt history')
    .addCommand(
        new Command('track')
            .description('Track a prompt')
            .argument('<prompt>', 'The prompt text')
            .option('--tool <tool>', 'Tool used (cursor, windsurf, etc.)', 'cursor')
            .action(async (promptText, options) => {
                const { BeastMode } = require('../lib');
                const beastMode = new BeastMode({ janitor: { promptChainDebugger: {} } });
                await beastMode.initialize();
                
                const prompt = await beastMode.janitor.promptChainDebugger.trackPrompt(promptText, {
                    tool: options.tool,
                    user: 'current-user'
                });
                
                console.log(chalk.green(`\n✅ Prompt tracked: ${prompt.id}`));
                console.log(`Quality: ${chalk.cyan(prompt.codeState?.quality || 'N/A')}`);
            })
    )
    .addCommand(
        new Command('debug')
            .description('Debug by prompt chain')
            .argument('<issue>', 'Issue description')
            .action(async (issue) => {
                const spinner = ora('Analyzing prompt chain...').start();
                try {
                    const { BeastMode } = require('../lib');
                    const beastMode = new BeastMode({ janitor: { promptChainDebugger: {} } });
                    await beastMode.initialize();
                    
                    const analysis = await beastMode.janitor.promptChainDebugger.debugByPrompt(issue);
                    spinner.succeed('Analysis complete!');
                    
                    console.log('\n🔍 Prompt Chain Analysis:');
                    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                    console.log(`Issue: ${chalk.yellow(issue)}`);
                    console.log(`\nRelevant prompts: ${chalk.cyan(analysis.relevantPrompts.length)}`);
                    analysis.chain.slice(0, 5).forEach((p, i) => {
                        console.log(`\n${i + 1}. ${p.prompt.substring(0, 60)}...`);
                        console.log(`   Quality: ${p.quality || 'N/A'}`);
                    });
                    
                    if (analysis.suggestions.length > 0) {
                        console.log(`\n💡 Suggestions:`);
                        analysis.suggestions.forEach(s => {
                            console.log(`  • ${s.message}`);
                            console.log(`    ${chalk.gray(s.suggestion)}`);
                        });
                    }
                } catch (error) {
                    spinner.fail(`Failed: ${error.message}`);
                }
            })
    )
    .addCommand(
        new Command('history')
            .description('Show prompt history')
            .option('--limit <n>', 'Number of prompts to show', '20')
            .action(async (options) => {
                const { BeastMode } = require('../lib');
                const beastMode = new BeastMode({ janitor: { promptChainDebugger: {} } });
                await beastMode.initialize();
                
                const history = beastMode.janitor.promptChainDebugger.getHistory({
                    limit: parseInt(options.limit)
                });
                
                console.log('\n🔗 Prompt History:');
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                history.forEach((p, i) => {
                    console.log(`\n${i + 1}. ${chalk.cyan(p.id)}`);
                    console.log(`   ${p.prompt.substring(0, 80)}...`);
                    console.log(`   Quality: ${p.codeState?.quality || 'N/A'} | ${chalk.gray(p.timestamp)}`);
                });
            })
    );

// Enterprise Guardrail Commands
program
    .command('guardrail')
    .description('🛡️ Enterprise Guardrail - Plain English code reviews')
    .addCommand(
        new Command('check')
            .description('Check if push is allowed')
            .action(async () => {
                const { BeastMode } = require('../lib');
                const beastMode = new BeastMode({ janitor: { enterpriseGuardrail: {} } });
                await beastMode.initialize();
                
                const result = await beastMode.janitor.enterpriseGuardrail.checkPush();
                
                if (result.allowed) {
                    console.log(chalk.green('\n✅ Push allowed'));
                    if (result.plainEnglishDiff) {
                        console.log(`\n${result.plainEnglishDiff.summary}`);
                    }
                } else {
                    console.log(chalk.red('\n❌ Push blocked: Requires approval'));
                    console.log(`\n${result.plainEnglishDiff.summary}`);
                    console.log('\nFiles changed:');
                    result.plainEnglishDiff.files.forEach(f => {
                        console.log(`\n${chalk.cyan(f.file)}`);
                        console.log(`  ${f.summary}`);
                        f.details.forEach(d => {
                            console.log(`    • ${d}`);
                        });
                    });
                    console.log(`\nReview ID: ${chalk.cyan(result.review.id)}`);
                }
            })
    )
    .addCommand(
        new Command('reviews')
            .description('List pending reviews')
            .action(async () => {
                const { BeastMode } = require('../lib');
                const beastMode = new BeastMode({ janitor: { enterpriseGuardrail: {} } });
                await beastMode.initialize();
                
                const reviews = beastMode.janitor.enterpriseGuardrail.getPendingReviews();
                
                if (reviews.length === 0) {
                    console.log(chalk.green('\n✅ No pending reviews'));
                    return;
                }
                
                console.log('\n📋 Pending Reviews:');
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                reviews.forEach((r, i) => {
                    console.log(`\n${i + 1}. ${chalk.cyan(r.id)}`);
                    console.log(`   ${r.summary}`);
                    console.log(`   Files: ${r.files.length}`);
                    console.log(`   ${chalk.gray(r.createdAt)}`);
                });
            })
    )
    .addCommand(
        new Command('approve')
            .description('Approve a review')
            .argument('<reviewId>', 'Review ID')
            .action(async (reviewId) => {
                const { BeastMode } = require('../lib');
                const beastMode = new BeastMode({ janitor: { enterpriseGuardrail: {} } });
                await beastMode.initialize();
                
                try {
                    await beastMode.janitor.enterpriseGuardrail.approveReview(reviewId, 'current-user');
                    console.log(chalk.green(`\n✅ Review ${reviewId} approved`));
                } catch (error) {
                    console.log(chalk.red(`\n❌ Failed: ${error.message}`));
                }
            })
    );

// Brand/Reputation/Secret Interceptor Commands
program
    .command('interceptor')
    .description('🛡️ Brand/Reputation/Secret Interceptor - Prevents unsafe commits')
    .addCommand(
        new Command('install')
            .description('Install pre-commit hook to intercept unsafe commits')
            .action(async () => {
                const spinner = ora('Installing Brand/Reputation/Secret Interceptor hook...').start();
                try {
                    const { execSync } = require('child_process');
                    execSync('node scripts/install-brand-interceptor-hook.js', { 
                        cwd: process.cwd(),
                        stdio: 'inherit'
                    });
                    spinner.succeed(chalk.green('✅ Interceptor hook installed'));
                    console.log(chalk.cyan('\n💡 The hook will now automatically intercept unsafe commits'));
                    console.log(chalk.cyan('   Intercepted data will be stored in Supabase for bot access'));
                } catch (error) {
                    spinner.fail(chalk.red('Failed to install hook'));
                    console.error(chalk.red(error.message));
                }
            })
    )
    .addCommand(
        new Command('check')
            .description('Check staged files for issues (without blocking)')
            .action(async () => {
                const spinner = ora('Checking staged files...').start();
                try {
                    const interceptor = new BrandReputationInterceptor({
                        enabled: true,
                        strictMode: false, // Don't block, just report
                        storeInSupabase: true
                    });
                    await interceptor.initialize();
                    const result = await interceptor.checkStagedFiles();
                    spinner.stop();
                    
                    if (result.allowed) {
                        console.log(chalk.green('\n✅ All files are safe to commit'));
                    } else {
                        console.log(chalk.red(`\n❌ Found ${result.issues.length} issue(s) in ${result.interceptedFiles.length} file(s)`));
                        console.log('\n📋 Issues:');
                        result.issues.forEach(issue => {
                            const severityColor = issue.severity === 'critical' ? chalk.red : 
                                                 issue.severity === 'high' ? chalk.yellow : chalk.gray;
                            console.log(`   ${severityColor(`[${issue.severity.toUpperCase()}]`)} ${issue.message}`);
                        });
                        if (result.interceptedFiles.length > 0) {
                            console.log(chalk.cyan(`\n💾 Intercepted data stored in Supabase`));
                            console.log(chalk.cyan(`   Access via: GET /api/intercepted-commits`));
                        }
                    }
                } catch (error) {
                    spinner.fail(chalk.red('Check failed'));
                    console.error(chalk.red(error.message));
                }
            })
    )
    .addCommand(
        new Command('list')
            .description('List intercepted commits from Supabase')
            .option('-r, --repo <repo>', 'Filter by repository name')
            .option('-l, --limit <limit>', 'Number of records to show', '20')
            .action(async (options) => {
                const spinner = ora('Fetching intercepted commits...').start();
                try {
                    const interceptor = new BrandReputationInterceptor({
                        enabled: true,
                        storeInSupabase: true
                    });
                    await interceptor.initialize();
                    const data = await interceptor.getInterceptedData(options.repo, parseInt(options.limit));
                    spinner.stop();
                    
                    if (data.length === 0) {
                        console.log(chalk.green('\n✅ No intercepted commits found'));
                        return;
                    }
                    
                    console.log(chalk.cyan(`\n📋 Intercepted Commits (${data.length}):`));
                    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                    data.forEach((item, i) => {
                        console.log(`\n${i + 1}. ${chalk.cyan(item.file_path)}`);
                        console.log(`   Repo: ${item.repo_name}`);
                        console.log(`   Issues: ${item.issues.length}`);
                        console.log(`   Status: ${item.status}`);
                        console.log(`   Intercepted: ${new Date(item.intercepted_at).toLocaleString()}`);
                        if (item.issues.length > 0) {
                            console.log(`   First issue: ${item.issues[0].message}`);
                        }
                    });
                    console.log(chalk.cyan(`\n💡 Access full data via: GET /api/intercepted-commits?repo_name=${options.repo || ''}`));
                } catch (error) {
                    spinner.fail(chalk.red('Failed to fetch intercepted commits'));
                    console.error(chalk.red(error.message));
                }
            })
    )
    .addCommand(
        new Command('status')
            .description('Show interceptor status and configuration')
            .action(async () => {
                const interceptor = new BrandReputationInterceptor();
                await interceptor.initialize();
                
                console.log(chalk.cyan('\n🛡️  Brand/Reputation/Secret Interceptor Status'));
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                console.log(`Enabled: ${interceptor.options.enabled ? chalk.green('Yes') : chalk.red('No')}`);
                console.log(`Strict Mode: ${interceptor.options.strictMode ? chalk.green('Yes') : chalk.yellow('No')}`);
                console.log(`Store in Supabase: ${interceptor.options.storeInSupabase ? chalk.green('Yes') : chalk.red('No')}`);
                console.log(`Auto-fix: ${interceptor.options.autoFix ? chalk.green('Enabled') : chalk.red('Disabled')}`);
                console.log(`Supabase Initialized: ${interceptor.supabase ? chalk.green('Yes') : chalk.yellow('No')}`);
                
                // Check if hook is installed
                const fs = require('fs');
                const path = require('path');
                const hookPath = path.join(process.cwd(), '.git', 'hooks', 'pre-commit');
                const hookInstalled = fs.existsSync(hookPath) && 
                                     fs.readFileSync(hookPath, 'utf8').includes('BrandReputationInterceptor');
                console.log(`Pre-commit Hook: ${hookInstalled ? chalk.green('Installed') : chalk.yellow('Not installed')}`);
                if (!hookInstalled) {
                    console.log(chalk.cyan('\n💡 Run "beast-mode interceptor install" to install the hook'));
                }
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
// GitHub App Commands
program
    .command('github-app')
    .description('GitHub App setup and management for BEAST MODE integration')
    .addCommand(
        new Command('setup')
            .description('Interactive GitHub App setup')
            .action(async () => {
                const { interactiveSetup } = require('../lib/cli/github-app-setup');
                await interactiveSetup();
            })
    )
    .addCommand(
        new Command('check')
            .alias('status')
            .description('Check existing GitHub App configuration')
            .action(async () => {
                const { checkExistingSetup } = require('../lib/cli/github-app-setup');
                await checkExistingSetup();
            })
    )
    .addCommand(
        new Command('manifest')
            .description('Generate GitHub App manifest file')
            .action(async () => {
                const { generateAppManifest } = require('../lib/cli/github-app-setup');
                const manifest = generateAppManifest();
                const fs = require('fs');
                const path = require('path');
                const manifestPath = path.join(process.cwd(), '.github-app-manifest.json');
                fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
                console.log('✅ Manifest file created:', manifestPath);
            })
    )
           .addCommand(
               new Command('save-credentials')
                   .description('Save GitHub App credentials after creating app')
                   .action(async () => {
                       const { saveCredentialsInteractive } = require('../lib/cli/github-app-setup');
                       await saveCredentialsInteractive();
                   })
           )
           .addCommand(
               new Command('update-events')
                   .description('Update GitHub App events via API (workaround for UI limitation)')
                   .action(async () => {
                       const { updateAppEvents } = require('../lib/cli/github-app-update-events');
                       await updateAppEvents();
                   })
           )
           .addCommand(
               new Command('test')
                   .description('Test GitHub App integration (configuration, services, webhooks)')
                   .action(async () => {
                       const { runTests } = require('../lib/cli/github-app-test');
                       await runTests();
                   })
           );

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

// Repository Management Commands
program
    .command('repos')
    .description('Manage GitHub repository connections')
    .addCommand(
        new Command('status')
            .description('Check GitHub connection status')
            .action(async () => {
                const { checkConnection } = require('../lib/cli/repos');
                await checkConnection();
            })
    )
    .addCommand(
        new Command('connect')
            .description('Connect GitHub account via OAuth')
            .action(async () => {
                const { connect } = require('../lib/cli/repos');
                await connect();
            })
    )
    .addCommand(
        new Command('list')
            .description('List connected repositories')
            .action(async () => {
                const { list } = require('../lib/cli/repos');
                await list();
            })
    )
    .addCommand(
        new Command('add')
            .description('Add repository manually')
            .argument('<url>', 'Repository URL (e.g., https://github.com/user/repo)')
            .option('-t, --team <team>', 'Team name for the repository')
            .action(async (url, options) => {
                const { add } = require('../lib/cli/repos');
                await add(url, options);
            })
    )
    .addCommand(
        new Command('remove')
            .description('Remove repository')
            .argument('<id>', 'Repository ID (from list command)')
            .action(async (id) => {
                const { remove } = require('../lib/cli/repos');
                await remove(id);
            })
    )
    .addCommand(
        new Command('disconnect')
            .description('Disconnect GitHub account')
            .action(async () => {
                const { disconnect } = require('../lib/cli/repos');
                await disconnect();
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
        console.log(chalk.yellow('\n📊 SYSTEM CAPABILITIES:'));
        console.log(chalk.white('  • Quality scoring (0-100)'));
        console.log(chalk.white('  • Automated code fixes'));
        console.log(chalk.white('  • AI-powered analysis'));
        console.log(chalk.white('  • Historical tracking'));
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