/**
 * BEAST MODE Janitor System
 * The "AI Janitor" - Makes vibe coding actually work
 * 
 * Integrates:
 * - Silent Refactoring Engine
 * - Architecture Enforcement Layer
 * - Vibe Restoration System
 */

const { createLogger } = require('../utils/logger');
const { SilentRefactoringEngine } = require('./silent-refactoring-engine');
const { ArchitectureEnforcer } = require('./architecture-enforcer');
const { VibeRestorer } = require('./vibe-restorer');
const { RepoMemory } = require('./repo-memory');
const { VibeOps } = require('./vibe-ops');
const { EnterpriseGuardrail } = require('./enterprise-guardrail');
const { InvisibleCICD } = require('./invisible-cicd');
const { PromptChainDebugger } = require('./prompt-chain-debugger');
const { SafeModeWrapper } = require('./safe-mode-wrapper');

const log = createLogger('Janitor');

class Janitor {
    constructor(options = {}) {
        this.options = {
            enabled: false,
            silentRefactoring: true,
            architectureEnforcement: true,
            vibeRestoration: true,
            ...options
        };

        this.silentRefactoring = null;
        this.architectureEnforcer = null;
        this.vibeRestorer = null;
        this.repoMemory = null;
        this.vibeOps = null;
        this.enterpriseGuardrail = null;
        this.invisibleCICD = null;
        this.promptChainDebugger = null;
        this.safeModeWrapper = null;
        this.initialized = false;
    }

    /**
     * Initialize janitor system
     */
    async initialize() {
        if (this.initialized) return;

        log.info('🧹 Initializing BEAST MODE Janitor System...');

        // Initialize Silent Refactoring Engine
        if (this.options.silentRefactoring) {
            this.silentRefactoring = new SilentRefactoringEngine({
                enabled: this.options.enabled,
                ...this.options.refactoring
            });
            await this.silentRefactoring.initialize();
        }

        // Initialize Architecture Enforcement
        if (this.options.architectureEnforcement) {
            this.architectureEnforcer = new ArchitectureEnforcer({
                enabled: this.options.enabled,
                ...this.options.enforcement
            });
            await this.architectureEnforcer.initialize();
        }

        // Initialize Vibe Restoration
        if (this.options.vibeRestoration) {
            this.vibeRestorer = new VibeRestorer({
                enabled: this.options.enabled,
                ...this.options.restoration
            });
            await this.vibeRestorer.initialize();
        }

        // Initialize Repo-Level Memory
        if (this.options.repoMemory !== false) {
            this.repoMemory = new RepoMemory({
                enabled: this.options.enabled,
                ...this.options.repoMemory
            });
            await this.repoMemory.initialize();
        }

        // Initialize Vibe Ops
        if (this.options.vibeOps) {
            this.vibeOps = new VibeOps({
                enabled: this.options.enabled,
                ...this.options.vibeOps
            });
            await this.vibeOps.initialize();
        }

        // Initialize Enterprise Guardrail
        if (this.options.enterpriseGuardrail) {
            this.enterpriseGuardrail = new EnterpriseGuardrail({
                enabled: this.options.enabled,
                ...this.options.enterpriseGuardrail
            });
            await this.enterpriseGuardrail.initialize();
        }

        // Initialize Invisible CI/CD
        if (this.options.invisibleCICD !== false) {
            this.invisibleCICD = new InvisibleCICD({
                enabled: this.options.enabled,
                ...this.options.invisibleCICD
            });
            await this.invisibleCICD.initialize();
        }

        // Initialize Prompt Chain Debugger
        if (this.options.promptChainDebugger) {
            this.promptChainDebugger = new PromptChainDebugger({
                enabled: this.options.enabled,
                ...this.options.promptChainDebugger
            });
            await this.promptChainDebugger.initialize();
        }

        // Initialize Safe Mode Wrapper
        if (this.options.safeModeWrapper) {
            this.safeModeWrapper = new SafeModeWrapper({
                enabled: this.options.enabled,
                ...this.options.safeModeWrapper
            });
            await this.safeModeWrapper.initialize();
        }

        this.initialized = true;
        log.info('✅ BEAST MODE Janitor System ready (Complete Day 2 Operations Platform)');

        // Set up integrations
        try {
            const { JanitorIntegrations } = require('./integrations');
            this.integrations = new JanitorIntegrations(this);
        } catch (error) {
            log.debug('Integrations not available:', error.message);
        }
    }

    /**
     * Integrate with BEAST MODE systems
     */
    async integrateWithBeastMode(beastMode) {
        if (this.integrations) {
            await this.integrations.integrateAll(beastMode);
        }
    }

    /**
     * Enable overnight maintenance mode
     */
    async enableOvernightMode() {
        if (this.silentRefactoring) {
            await this.silentRefactoring.enableOvernightMode();
        }
        this.options.enabled = true;
        log.info('🌙 Overnight maintenance mode enabled');
    }

    /**
     * Disable overnight maintenance mode
     */
    async disableOvernightMode() {
        if (this.silentRefactoring) {
            await this.silentRefactoring.disableOvernightMode();
        }
        log.info('☀️ Overnight maintenance mode disabled');
    }

    /**
     * Run manual refactoring cycle
     */
    async runRefactoring() {
        if (!this.silentRefactoring) {
            throw new Error('Silent Refactoring Engine not initialized');
        }
        return await this.silentRefactoring.runRefactoringCycle();
    }

    /**
     * Check for architecture violations
     */
    async checkArchitecture() {
        if (!this.architectureEnforcer) {
            throw new Error('Architecture Enforcer not initialized');
        }
        return await this.architectureEnforcer.checkStagedFiles();
    }

    /**
     * Check for regressions
     */
    async checkVibe() {
        if (!this.vibeRestorer) {
            throw new Error('Vibe Restorer not initialized');
        }
        return await this.vibeRestorer.check();
    }

    /**
     * Restore to last good state
     */
    async restore(options = {}) {
        if (!this.vibeRestorer) {
            throw new Error('Vibe Restorer not initialized');
        }
        return await this.vibeRestorer.restore(options);
    }

    /**
     * Analyze regression
     */
    async analyzeRegression(regressionIndex = null) {
        if (!this.vibeRestorer) {
            throw new Error('Vibe Restorer not initialized');
        }
        return await this.vibeRestorer.analyze(regressionIndex);
    }

    /**
     * Get janitor status
     */
    getStatus() {
        return {
            enabled: this.options.enabled,
            initialized: this.initialized,
            silentRefactoring: this.silentRefactoring?.getStatus() || null,
            architectureEnforcement: this.architectureEnforcer?.getStatus() || null,
            vibeRestoration: this.vibeRestorer?.getStatus() || null,
            repoMemory: this.repoMemory?.getStats() || null,
            vibeOps: this.vibeOps?.getStatus() || null,
            enterpriseGuardrail: this.enterpriseGuardrail?.getStatus() || null,
            invisibleCICD: this.invisibleCICD?.getStatus() || null,
            promptChainDebugger: this.promptChainDebugger?.getStatus() || null,
            safeModeWrapper: this.safeModeWrapper?.getStatus() || null
        };
    }

    /**
     * Get component
     */
    getComponent(name) {
        switch (name) {
            case 'refactoring':
            case 'silentRefactoring':
                return this.silentRefactoring;
            case 'enforcement':
            case 'architectureEnforcer':
                return this.architectureEnforcer;
            case 'restoration':
            case 'vibeRestorer':
                return this.vibeRestorer;
            case 'memory':
            case 'repoMemory':
                return this.repoMemory;
            case 'vibeOps':
            case 'vibe-ops':
                return this.vibeOps;
            case 'guardrail':
            case 'enterpriseGuardrail':
                return this.enterpriseGuardrail;
            case 'cicd':
            case 'invisibleCICD':
                return this.invisibleCICD;
            case 'debugger':
            case 'promptChainDebugger':
                return this.promptChainDebugger;
            case 'wrapper':
            case 'safeModeWrapper':
                return this.safeModeWrapper;
            default:
                return null;
        }
    }
}

module.exports = { Janitor };

