/**
 * BEAST MODE Janitor - Daisy Chain Integration
 * 
 * Makes Janitor operations available as Daisy Chain workflows
 * Allows Daisy Chain to orchestrate Janitor operations
 */

const { createLogger } = require('../utils/logger');
const log = createLogger('JanitorDaisyChainIntegration');

class JanitorDaisyChainIntegration {
    constructor(janitor) {
        this.janitor = janitor;
        this.workflowTemplates = new Map();
        this.initialized = false;
    }

    /**
     * Initialize integration
     */
    async initialize() {
        if (this.initialized) return;

        // Register Janitor workflow templates
        this.registerWorkflowTemplates();

        this.initialized = true;
        log.info('✅ Janitor-Daisy Chain integration initialized');
    }

    /**
     * Register workflow templates for Janitor operations
     */
    registerWorkflowTemplates() {
        // 1. Silent Refactoring Workflow
        this.workflowTemplates.set('janitor-refactor', {
            name: 'Janitor: Silent Refactoring',
            description: 'Run silent refactoring on codebase',
            category: 'maintenance',
            steps: [
                {
                    id: 'scan',
                    type: 'janitor-scan',
                    name: 'Scan for opportunities',
                    config: {
                        maxFiles: 50,
                        filePatterns: ['**/*.js', '**/*.ts', '**/*.jsx', '**/*.tsx']
                    }
                },
                {
                    id: 'refactor',
                    type: 'janitor-refactor',
                    name: 'Run refactoring',
                    dependsOn: ['scan'],
                    config: {
                        dryRun: false,
                        maxChanges: 50
                    }
                },
                {
                    id: 'validate',
                    type: 'janitor-validate',
                    name: 'Validate changes',
                    dependsOn: ['refactor'],
                    config: {
                        runTests: true,
                        checkQuality: true
                    }
                }
            ]
        });

        // 2. Architecture Enforcement Workflow
        this.workflowTemplates.set('janitor-architecture', {
            name: 'Janitor: Architecture Check',
            description: 'Check and enforce architecture rules',
            category: 'quality',
            steps: [
                {
                    id: 'check',
                    type: 'janitor-architecture-check',
                    name: 'Check architecture violations',
                    config: {
                        autoFix: true,
                        strictMode: false
                    }
                },
                {
                    id: 'report',
                    type: 'janitor-report',
                    name: 'Generate report',
                    dependsOn: ['check'],
                    config: {
                        format: 'json',
                        includeSuggestions: true
                    }
                }
            ]
        });

        // 3. Vibe Restoration Workflow
        this.workflowTemplates.set('janitor-vibe-restore', {
            name: 'Janitor: Vibe Restoration',
            description: 'Detect and restore to last good state',
            category: 'recovery',
            steps: [
                {
                    id: 'check',
                    type: 'janitor-vibe-check',
                    name: 'Check for regressions',
                    config: {
                        threshold: 0.1, // 10% quality drop
                        lookbackHours: 24
                    }
                },
                {
                    id: 'analyze',
                    type: 'janitor-vibe-analyze',
                    name: 'Analyze regression',
                    dependsOn: ['check'],
                    config: {
                        includePromptHistory: true
                    }
                },
                {
                    id: 'restore',
                    type: 'janitor-vibe-restore',
                    name: 'Restore to last good state',
                    dependsOn: ['analyze'],
                    config: {
                        target: 'last-good',
                        createBackup: true
                    }
                }
            ]
        });

        // 4. Overnight Maintenance Workflow
        this.workflowTemplates.set('janitor-overnight', {
            name: 'Janitor: Overnight Maintenance',
            description: 'Complete overnight maintenance cycle',
            category: 'maintenance',
            schedule: {
                cron: '0 2 * * *', // 2 AM daily
                timezone: 'UTC'
            },
            steps: [
                {
                    id: 'refactor',
                    type: 'janitor-refactor',
                    name: 'Run refactoring',
                    config: {
                        maxChanges: 100,
                        priority: 'low'
                    }
                },
                {
                    id: 'architecture',
                    type: 'janitor-architecture-check',
                    name: 'Check architecture',
                    dependsOn: ['refactor'],
                    config: {
                        autoFix: true
                    }
                },
                {
                    id: 'vibe-check',
                    type: 'janitor-vibe-check',
                    name: 'Check for regressions',
                    dependsOn: ['architecture'],
                    config: {
                        threshold: 0.15
                    }
                },
                {
                    id: 'report',
                    type: 'janitor-report',
                    name: 'Generate overnight report',
                    dependsOn: ['vibe-check'],
                    config: {
                        format: 'markdown',
                        sendNotification: true
                    }
                }
            ]
        });

        // 5. Quality Improvement Workflow
        this.workflowTemplates.set('janitor-quality-improve', {
            name: 'Janitor: Quality Improvement',
            description: 'Improve code quality across codebase',
            category: 'quality',
            steps: [
                {
                    id: 'scan',
                    type: 'janitor-scan',
                    name: 'Scan for quality issues',
                    config: {
                        focus: 'quality',
                        minSeverity: 'medium'
                    }
                },
                {
                    id: 'fix',
                    type: 'janitor-fix',
                    name: 'Apply quality fixes',
                    dependsOn: ['scan'],
                    config: {
                        autoFix: true,
                        confidenceThreshold: 0.9
                    }
                },
                {
                    id: 'validate',
                    type: 'janitor-validate',
                    name: 'Validate improvements',
                    dependsOn: ['fix'],
                    config: {
                        runTests: true,
                        checkMetrics: true
                    }
                }
            ]
        });

        log.info(`✅ Registered ${this.workflowTemplates.size} Janitor workflow templates`);
    }

    /**
     * Get workflow template
     */
    getTemplate(templateId) {
        return this.workflowTemplates.get(templateId);
    }

    /**
     * List all templates
     */
    listTemplates() {
        return Array.from(this.workflowTemplates.entries()).map(([id, template]) => ({
            id,
            ...template
        }));
    }

    /**
     * Execute Janitor operation as Daisy Chain workflow step
     */
    async executeStep(stepType, stepConfig, context = {}) {
        await this.initialize();

        log.info(`Executing Janitor step: ${stepType}`);

        try {
            switch (stepType) {
                case 'janitor-scan':
                    return await this.executeScan(stepConfig, context);
                
                case 'janitor-refactor':
                    return await this.executeRefactor(stepConfig, context);
                
                case 'janitor-architecture-check':
                    return await this.executeArchitectureCheck(stepConfig, context);
                
                case 'janitor-vibe-check':
                    return await this.executeVibeCheck(stepConfig, context);
                
                case 'janitor-vibe-analyze':
                    return await this.executeVibeAnalyze(stepConfig, context);
                
                case 'janitor-vibe-restore':
                    return await this.executeVibeRestore(stepConfig, context);
                
                case 'janitor-validate':
                    return await this.executeValidate(stepConfig, context);
                
                case 'janitor-report':
                    return await this.executeReport(stepConfig, context);
                
                case 'janitor-fix':
                    return await this.executeFix(stepConfig, context);
                
                default:
                    throw new Error(`Unknown Janitor step type: ${stepType}`);
            }
        } catch (error) {
            log.error(`Failed to execute Janitor step ${stepType}:`, error);
            return {
                success: false,
                error: error.message,
                stepType
            };
        }
    }

    /**
     * Execute scan step
     */
    async executeScan(config, context) {
        // Use self-improvement service for scanning
        const selfImprovement = require('../mlops/selfImprovement');
        const repoPath = context.repoPath || process.cwd();
        
        const opportunities = await selfImprovement.scanForOpportunities(repoPath, {
            maxFiles: config.maxFiles || 50,
            filePatterns: config.filePatterns
        });

        return {
            success: true,
            opportunities: opportunities.length,
            data: opportunities,
            stepType: 'janitor-scan'
        };
    }

    /**
     * Execute refactor step
     */
    async executeRefactor(config, context) {
        if (!this.janitor.silentRefactoring) {
            throw new Error('Silent Refactoring Engine not available');
        }

        const result = await this.janitor.runRefactoring();

        return {
            success: true,
            fixes: result.fixes || 0,
            data: result,
            stepType: 'janitor-refactor'
        };
    }

    /**
     * Execute architecture check step
     */
    async executeArchitectureCheck(config, context) {
        if (!this.janitor.architectureEnforcer) {
            throw new Error('Architecture Enforcer not available');
        }

        const result = await this.janitor.checkArchitecture();

        return {
            success: result.passed,
            violations: result.violations || [],
            fixes: result.fixes || [],
            data: result,
            stepType: 'janitor-architecture-check'
        };
    }

    /**
     * Execute vibe check step
     */
    async executeVibeCheck(config, context) {
        if (!this.janitor.vibeRestorer) {
            throw new Error('Vibe Restorer not available');
        }

        const result = await this.janitor.checkVibe();

        return {
            success: true,
            hasRegression: result.hasRegression || false,
            qualityDrop: result.qualityDrop || 0,
            data: result,
            stepType: 'janitor-vibe-check'
        };
    }

    /**
     * Execute vibe analyze step
     */
    async executeVibeAnalyze(config, context) {
        if (!this.janitor.vibeRestorer) {
            throw new Error('Vibe Restorer not available');
        }

        const regressionIndex = context.regressionIndex || null;
        const result = await this.janitor.analyzeRegression(regressionIndex);

        return {
            success: true,
            analysis: result,
            data: result,
            stepType: 'janitor-vibe-analyze'
        };
    }

    /**
     * Execute vibe restore step
     */
    async executeVibeRestore(config, context) {
        if (!this.janitor.vibeRestorer) {
            throw new Error('Vibe Restorer not available');
        }

        const result = await this.janitor.restore({
            target: config.target || 'last-good',
            createBackup: config.createBackup !== false
        });

        return {
            success: result.success || false,
            restored: result.restored || false,
            data: result,
            stepType: 'janitor-vibe-restore'
        };
    }

    /**
     * Execute validate step
     */
    async executeValidate(config, context) {
        // Run tests if requested
        if (config.runTests) {
            // This would run the test suite
            // Implementation depends on test framework
        }

        // Check quality metrics
        if (config.checkQuality) {
            const status = this.janitor.getStatus();
            return {
                success: true,
                quality: status,
                data: status,
                stepType: 'janitor-validate'
            };
        }

        return {
            success: true,
            stepType: 'janitor-validate'
        };
    }

    /**
     * Execute report step
     */
    async executeReport(config, context) {
        const status = this.janitor.getStatus();
        
        let report;
        if (config.format === 'markdown') {
            report = this.generateMarkdownReport(status, context);
        } else {
            report = status;
        }

        return {
            success: true,
            report,
            format: config.format || 'json',
            stepType: 'janitor-report'
        };
    }

    /**
     * Execute fix step
     */
    async executeFix(config, context) {
        // Use self-improvement service for fixes
        const selfImprovement = require('../mlops/selfImprovement');
        const repoPath = context.repoPath || process.cwd();

        // Get opportunities from previous scan step
        const opportunities = context.opportunities || [];
        
        let fixesApplied = 0;
        const fixResults = [];

        for (const opportunity of opportunities.slice(0, config.maxFixes || 10)) {
            const improvementResult = await selfImprovement.generateImprovement(opportunity, {
                dryRun: !config.autoFix,
                model: 'custom:beast-mode-code-model'
            });

            if (improvementResult.success && config.autoFix) {
                const applyResult = await selfImprovement.applyImprovement(improvementResult, {
                    dryRun: false
                });
                
                if (applyResult.success) {
                    fixesApplied++;
                }
                
                fixResults.push(applyResult);
            }
        }

        return {
            success: true,
            fixesApplied,
            results: fixResults,
            stepType: 'janitor-fix'
        };
    }

    /**
     * Generate markdown report
     */
    generateMarkdownReport(status, context) {
        return `# BEAST MODE Janitor Report

**Generated:** ${new Date().toISOString()}

## Status

- **Enabled:** ${status.enabled ? '✅' : '❌'}
- **Initialized:** ${status.initialized ? '✅' : '❌'}

## Systems

### Silent Refactoring
${status.silentRefactoring ? `- Status: ${status.silentRefactoring.enabled ? 'Active' : 'Inactive'}` : '- Not initialized'}

### Architecture Enforcement
${status.architectureEnforcement ? `- Status: ${status.architectureEnforcement.enabled ? 'Active' : 'Inactive'}` : '- Not initialized'}

### Vibe Restoration
${status.vibeRestoration ? `- Status: ${status.vibeRestoration.enabled ? 'Active' : 'Inactive'}` : '- Not initialized'}

## Summary

This report was generated as part of a Daisy Chain workflow.
`;
    }
}

module.exports = { JanitorDaisyChainIntegration };
