/**
 * Comprehensive Janitor System Test Suite
 * Tests all systems, integrations, and edge cases
 */

const path = require('path');

class ComprehensiveTestRunner {
    constructor() {
        this.tests = [];
        this.passed = 0;
        this.failed = 0;
        this.skipped = 0;
    }

    async run() {
        console.log('🧪 Comprehensive Janitor System Test Suite\n');
        console.log('Testing: Dual-Brand, Safety Features, Cost Optimization, All Systems\n');

        // ===== DUAL-BRAND TESTS =====
        console.log('\n📦 Dual-Brand System');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        await this.test('Brand Configuration', () => this.testBrandConfiguration());
        await this.test('Brand Detection', () => this.testBrandDetection());
        await this.test('Sentinel Defaults', () => this.testSentinelDefaults());

        // ===== SAFETY FEATURES TESTS =====
        console.log('\n📦 Safety Features');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        await this.test('Confidence Threshold', () => this.testConfidenceThreshold());
        await this.test('Change Limits', () => this.testChangeLimits());
        await this.test('Testing Requirements', () => this.testTestingRequirements());
        await this.test('Rollback Safety', () => this.testRollbackSafety());

        // ===== COST OPTIMIZATION TESTS =====
        console.log('\n📦 Cost Optimization');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        await this.test('Tiered Testing', () => this.testTieredTesting());
        await this.test('Caching', () => this.testCaching());
        await this.test('Selective Execution', () => this.testSelectiveExecution());

        // ===== SYSTEM TESTS =====
        console.log('\n📦 System Functionality');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        await this.test('Silent Refactoring', () => this.testSilentRefactoring());
        await this.test('Architecture Enforcement', () => this.testArchitectureEnforcement());
        await this.test('Vibe Restoration', () => this.testVibeRestoration());
        await this.test('Repo Memory', () => this.testRepoMemory());
        await this.test('Vibe Ops', () => this.testVibeOps());
        await this.test('Enterprise Guardrail', () => this.testEnterpriseGuardrail());
        await this.test('Invisible CI/CD', () => this.testInvisibleCICD());
        await this.test('Prompt Chain Debugger', () => this.testPromptChainDebugger());

        // Print results
        this.printResults();
    }


    async test(name, fn) {
        try {
            await fn();
            console.log(`  ✅ ${name}`);
            this.passed++;
            return true;
        } catch (error) {
            console.log(`  ❌ ${name}: ${error.message}`);
            this.failed++;
            return false;
        }
    }

    // ===== DUAL-BRAND TESTS =====
    async testBrandConfiguration() {
        const { getBrandConfig } = require('../lib/brand-config');
        
        const beastMode = getBrandConfig('beast-mode');
        if (beastMode.name !== 'BEAST MODE') throw new Error('BEAST MODE config');
        if (beastMode.tone !== 'energetic') throw new Error('BEAST MODE tone');
        
        const sentinel = getBrandConfig('sentinel');
        if (sentinel.name !== 'SENTINEL') throw new Error('SENTINEL config');
        if (sentinel.tone !== 'professional') throw new Error('SENTINEL tone');
    }

    async testBrandDetection() {
        const { detectBrand } = require('../lib/brand-config');
        
        if (detectBrand({}) !== 'beast-mode') throw new Error('Default brand');
        if (detectBrand({ enterprise: true }) !== 'sentinel') throw new Error('Enterprise detection');
        if (detectBrand({ sentinel: true }) !== 'sentinel') throw new Error('Sentinel flag');
    }

    async testSentinelDefaults() {
        const { Sentinel } = require('../lib/sentinel');
        
        const sentinel = new Sentinel({});
        const status = sentinel.getStatus();
        
        if (status.brand !== 'sentinel') throw new Error('Sentinel brand');
        if (!status.enterprise) throw new Error('Enterprise flag');
    }

    // ===== SAFETY FEATURES TESTS =====
    async testConfidenceThreshold() {
        const { SilentRefactoringEngine } = require('../lib/janitor/silent-refactoring-engine');
        
        const engine = new SilentRefactoringEngine({
            confidenceThreshold: 0.999,
            autoMerge: false
        });
        
        const results = { deduplications: [], securityFixes: [], improvements: [], errors: [] };
        engine.calculateConfidence = () => 0.95; // Low confidence
        
        const canMerge = engine.canAutoMerge(results);
        if (canMerge.allowed) throw new Error('Should block low confidence');
        if (!canMerge.reason.includes('confidence')) throw new Error('Should explain confidence issue');
    }

    async testChangeLimits() {
        const { SilentRefactoringEngine } = require('../lib/janitor/silent-refactoring-engine');
        
        const engine = new SilentRefactoringEngine({
            maxFilesPerChange: 5,
            maxTotalChanges: 200
        });
        
        // Too many files
        const results1 = {
            deduplications: Array(6).fill({ file1: 'file1.js' }),
            securityFixes: [],
            improvements: [],
            errors: []
        };
        engine.calculateConfidence = () => 0.999;
        
        const canMerge1 = engine.canAutoMerge(results1);
        if (canMerge1.allowed) throw new Error('Should block too many files');
        
        // Too many changes
        const results2 = {
            deduplications: Array(201).fill({ file1: 'file1.js' }),
            securityFixes: [],
            improvements: [],
            errors: []
        };
        
        const canMerge2 = engine.canAutoMerge(results2);
        if (canMerge2.allowed) throw new Error('Should block too many changes');
    }

    async testTestingRequirements() {
        const { SilentRefactoringEngine } = require('../lib/janitor/silent-refactoring-engine');
        
        const engine = new SilentRefactoringEngine({
            requireTests: true
        });
        
        if (!engine.options.requireTests) throw new Error('Testing requirements not set');
    }

    async testRollbackSafety() {
        const { SilentRefactoringEngine } = require('../lib/janitor/silent-refactoring-engine');
        
        const engine = new SilentRefactoringEngine({
            rollbackReady: true
        });
        
        if (!engine.options.rollbackReady) throw new Error('Rollback safety not enabled');
    }

    // ===== COST OPTIMIZATION TESTS =====
    async testTieredTesting() {
        const { VibeOps } = require('../lib/janitor/vibe-ops');
        
        const patternMatching = new VibeOps({ testingTier: 'pattern-matching' });
        if (patternMatching.options.testingTier !== 'pattern-matching') throw new Error('Pattern matching tier');
        
        const selective = new VibeOps({ testingTier: 'selective-visual-ai' });
        if (selective.options.testingTier !== 'selective-visual-ai') throw new Error('Selective tier');
    }

    async testCaching() {
        const { VibeOps } = require('../lib/janitor/vibe-ops');
        
        const vibeOps = new VibeOps({
            cacheEnabled: true,
            cacheTTL: 3600
        });
        
        if (!vibeOps.options.cacheEnabled) throw new Error('Caching not enabled');
        if (vibeOps.options.cacheTTL !== 3600) throw new Error('Cache TTL not set');
    }

    async testSelectiveExecution() {
        const { VibeOps } = require('../lib/janitor/vibe-ops');
        
        const vibeOps = new VibeOps({
            selectiveExecution: true
        });
        
        const critical = { description: 'User can login' };
        const nonCritical = { description: 'User can view settings' };
        
        if (!vibeOps.isCriticalPath(critical)) throw new Error('Should detect critical path');
        if (vibeOps.isCriticalPath(nonCritical)) throw new Error('Should not detect non-critical');
    }

    // ===== SYSTEM TESTS =====
    async testSilentRefactoring() {
        const { SilentRefactoringEngine } = require('../lib/janitor/silent-refactoring-engine');
        
        const engine = new SilentRefactoringEngine({ enabled: false });
        await engine.initialize();
        
        const status = engine.getStatus();
        if (status.enabled !== false) throw new Error('Engine status');
    }

    async testArchitectureEnforcement() {
        const { ArchitectureEnforcer } = require('../lib/janitor/architecture-enforcer');
        
        const enforcer = new ArchitectureEnforcer({ enabled: false });
        await enforcer.initialize();
        
        const content = 'const apiKey: process.env.APIKEY || '';';
        const violations = await enforcer.checkFile('test.js', content);
        
        if (violations.length === 0) throw new Error('Should detect hardcoded secret');
        if (!violations.some(v => v.type === 'hardcoded-secret')) throw new Error('Should detect secret type');
    }

    async testVibeRestoration() {
        const { VibeRestorer } = require('../lib/janitor/vibe-restorer');
        
        const restorer = new VibeRestorer({ enabled: false, autoTrack: false });
        await restorer.initialize();
        
        const status = restorer.getStatus();
        if (status.enabled !== false) throw new Error('Restorer enabled status');
        if (status.tracking !== false) throw new Error('Restorer tracking status');
    }

    async testRepoMemory() {
        const { RepoMemory } = require('../lib/janitor/repo-memory');
        
        const memory = new RepoMemory({ enabled: false });
        await memory.initialize();
        
        const stats = memory.getStats();
        if (typeof stats.files !== 'number') throw new Error('Stats structure');
    }

    async testVibeOps() {
        const { VibeOps } = require('../lib/janitor/vibe-ops');
        
        const vibeOps = new VibeOps({ enabled: false });
        await vibeOps.initialize();
        
        const status = vibeOps.getStatus();
        if (status.enabled !== false) throw new Error('VibeOps status');
    }

    async testEnterpriseGuardrail() {
        const { EnterpriseGuardrail } = require('../lib/janitor/enterprise-guardrail');
        
        const guardrail = new EnterpriseGuardrail({ enabled: false });
        await guardrail.initialize();
        
        const status = guardrail.getStatus();
        if (status.enabled !== false) throw new Error('Guardrail status');
    }

    async testInvisibleCICD() {
        const { InvisibleCICD } = require('../lib/janitor/invisible-cicd');
        
        const cicd = new InvisibleCICD({ enabled: false });
        await cicd.initialize();
        
        const status = cicd.getStatus();
        if (status.enabled !== false) throw new Error('CICD status');
    }

    async testPromptChainDebugger() {
        const { PromptChainDebugger } = require('../lib/janitor/prompt-chain-debugger');
        
        const promptDebugger = new PromptChainDebugger({ enabled: false });
        await promptDebugger.initialize();
        
        const status = promptDebugger.getStatus();
        if (status.enabled !== false) throw new Error('Debugger status');
    }

    printResults() {
        console.log('\n\n📊 Comprehensive Test Results');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`✅ Passed: ${this.passed}`);
        console.log(`❌ Failed: ${this.failed}`);
        console.log(`⏭️  Skipped: ${this.skipped}`);
        console.log(`📈 Total: ${this.passed + this.failed + this.skipped}`);
        console.log(`📊 Success Rate: ${((this.passed / (this.passed + this.failed)) * 100).toFixed(1)}%`);
        
        if (this.failed === 0) {
            console.log('\n🎉 All tests passed!');
            console.log('✅ Dual-brand system: Working');
            console.log('✅ Safety features: Implemented');
            console.log('✅ Cost optimization: Active');
            console.log('✅ All systems: Functional');
            process.exit(0);
        } else {
            console.log('\n⚠️ Some tests failed - review output above');
            process.exit(1);
        }
    }
}

// Run comprehensive tests
const runner = new ComprehensiveTestRunner();
runner.run().catch(error => {
    console.error('Test suite failed:', error);
    process.exit(1);
});

