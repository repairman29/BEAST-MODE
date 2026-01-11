/**
 * SENTINEL by BEAST MODE
 * The Governance Layer for AI-Generated Code
 * 
 * Enterprise product powered by BEAST MODE technology
 * 
 * Brand: Professional, trustworthy, reliable
 * Target: CTOs, Engineering Managers, Enterprises
 */

const { Janitor } = require('../janitor');
// Try to require logger, fallback to console if not available
let createLogger;
try {
  const loggerModule = require('../utils/logger');
  createLogger = loggerModule.createLogger || loggerModule.default?.createLogger || loggerModule;
} catch (e) {
  // Fallback logger
  createLogger = (name) => ({
    info: (...args) => console.log(`[${name}]`, ...args),
    warn: (...args) => console.warn(`[${name}]`, ...args),
    error: (...args) => console.error(`[${name}]`, ...args),
    debug: (...args) => console.debug(`[${name}]`, ...args),
  });
}

const log = createLogger('Sentinel');

class Sentinel {
    constructor(options = {}) {
        // Sentinel uses BEAST MODE janitor with enterprise defaults
        this.janitor = new Janitor({
            enabled: true,
            // Enterprise-safe defaults
            silentRefactoring: {
                enabled: true,
                overnightMode: true,
                autoMerge: false, // Enterprise: suggestions only by default
                confidenceThreshold: 0.999, // 99.9% required
                requireHumanReview: true, // Always require review
                requireTests: true, // Must pass tests
                rollbackReady: true, // Feature branches only
                maxFilesPerChange: 5,
                maxTotalChanges: 200
            },
            architectureEnforcement: {
                enabled: true,
                autoFix: true,
                preCommitHook: true,
                prePushHook: true, // Enterprise: pre-push hooks
                rules: {
                    noDbInFrontend: true,
                    noSecretsInCode: true,
                    noEval: true,
                    enforceApiRoutes: true,
                    separationOfConcerns: true
                }
            },
            vibeRestoration: {
                enabled: true,
                autoTrack: true,
                qualityThreshold: 70,
                rollbackEnabled: true
            },
            repoMemory: {
                enabled: true,
                updateOnChange: true
            },
            vibeOps: {
                enabled: true,
                testingTier: 'selective-visual-ai', // Enterprise: selective visual AI
                cacheEnabled: true,
                selectiveExecution: true
            },
            enterpriseGuardrail: {
                enabled: true,
                requireApproval: true, // Enterprise: always require approval
                autoApproveSafe: false, // Enterprise: no auto-approve
                plainEnglishDiffs: true
            },
            invisibleCICD: {
                enabled: true,
                silent: true,
                autoFix: true,
                checks: {
                    linting: true,
                    testing: true,
                    security: true,
                    formatting: true
                }
            },
            promptChainDebugger: {
                enabled: true,
                trackPrompts: true,
                storeHistory: true
            },
            safeModeWrapper: {
                enabled: true
            },
            ...options
        });

        this.brand = 'sentinel';
        this.version = '1.0.0';
    }

    /**
     * Initialize Sentinel
     */
    async initialize() {
        log.info('🛡️ Initializing SENTINEL by BEAST MODE...');
        log.info('Enterprise Governance Layer for AI-Generated Code');
        
        await this.janitor.initialize();
        
        log.info('✅ SENTINEL ready - Enterprise governance enabled');
    }

    /**
     * Get Sentinel status
     */
    getStatus() {
        const janitorStatus = this.janitor.getStatus();
        
        return {
            brand: 'sentinel',
            version: this.version,
            tagline: 'The Governance Layer for AI-Generated Code',
            enabled: true,
            ...janitorStatus,
            enterprise: {
                compliance: true,
                auditLogs: true,
                sso: false, // Would be enabled in enterprise tier
                whiteLabel: false // Would be enabled in enterprise tier
            }
        };
    }

    /**
     * Get component (delegate to janitor)
     */
    getComponent(name) {
        return this.janitor.getComponent(name);
    }
}

module.exports = { Sentinel };

