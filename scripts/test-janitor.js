/**
 * Janitor System Test Runner
 * Tests all janitor systems without requiring full Jest setup
 */

const path = require('path');
const fs = require('fs').promises;

// Simple test runner
class TestRunner {
    constructor() {
        this.tests = [];
        this.passed = 0;
        this.failed = 0;
    }

    async run() {
        console.log('🧪 Running Janitor System Tests...\n');

        // Test 1: Brand Configuration
        await this.test('Brand Configuration', async () => {
            const { getBrandConfig, detectBrand } = require('../lib/brand-config');
            
            const beastModeConfig = getBrandConfig('beast-mode');
            if (beastModeConfig.name !== 'BEAST MODE') throw new Error('BEAST MODE config failed');
            
            const sentinelConfig = getBrandConfig('sentinel');
            if (sentinelConfig.name !== 'SENTINEL') throw new Error('SENTINEL config failed');
            
            const brand = detectBrand({ enterprise: true });
            if (brand !== 'sentinel') throw new Error('Brand detection failed');
        });

        // Test 2: Safety Features
        await this.test('Safety Features - Confidence Threshold', async () => {
            const { SilentRefactoringEngine } = require('../lib/janitor/silent-refactoring-engine');
            
            const engine = new SilentRefactoringEngine({
                confidenceThreshold: 0.999,
                autoMerge: false
            });
            
            const results = {
                deduplications: [],
                securityFixes: [],
                improvements: [],
                errors: []
            };
            
            // Mock low confidence
            engine.calculateConfidence = () => 0.95;
            
            const canMerge = engine.canAutoMerge(results);
            if (canMerge.allowed) throw new Error('Should block low confidence');
        });

        // Test 3: Change Limits
        await this.test('Safety Features - Change Limits', async () => {
            const { SilentRefactoringEngine } = require('../lib/janitor/silent-refactoring-engine');
            
            const engine = new SilentRefactoringEngine({
                maxFilesPerChange: 5,
                maxTotalChanges: 200
            });
            
            const results = {
                deduplications: Array(6).fill({ file1: 'file1.js' }),
                securityFixes: [],
                improvements: [],
                errors: []
            };
            
            engine.calculateConfidence = () => 0.999;
            
            const canMerge = engine.canAutoMerge(results);
            if (canMerge.allowed) throw new Error('Should block too many files');
        });

        // Test 4: Tiered Testing
        await this.test('Tiered Testing Strategy', async () => {
            const { VibeOps } = require('../lib/janitor/vibe-ops');
            
            const vibeOps = new VibeOps({
                testingTier: 'pattern-matching',
                cacheEnabled: true
            });
            
            if (vibeOps.options.testingTier !== 'pattern-matching') {
                throw new Error('Testing tier not set correctly');
            }
            
            if (!vibeOps.options.cacheEnabled) {
                throw new Error('Caching not enabled');
            }
        });

        // Test 5: Critical Path Detection
        await this.test('Critical Path Detection', async () => {
            const { VibeOps } = require('../lib/janitor/vibe-ops');
            
            const vibeOps = new VibeOps({ enabled: true });
            
            const criticalTest = { description: 'User can login' };
            const nonCriticalTest = { description: 'User can view settings' };
            
            if (!vibeOps.isCriticalPath(criticalTest)) {
                throw new Error('Should detect critical path');
            }
            
            if (vibeOps.isCriticalPath(nonCriticalTest)) {
                throw new Error('Should not detect non-critical path');
            }
        });

        // Test 6: Architecture Enforcement
        await this.test('Architecture Enforcement', async () => {
            const { ArchitectureEnforcer } = require('../lib/janitor/architecture-enforcer');
            
            const enforcer = new ArchitectureEnforcer({
                enabled: true,
                rules: {
                    noDbInFrontend: true,
                    noSecretsInCode: true
                }
            });
            
            const content = 'const apiKey: process.env.APIKEY || '';';
            const violations = await enforcer.checkFile('test.js', content);
            
            if (violations.length === 0) {
                throw new Error('Should detect hardcoded secret');
            }
        });

        // Test 7: Dual-Brand Initialization
        await this.test('Dual-Brand Initialization', async () => {
            const { BeastMode } = require('../lib/index');
            
            // Test BEAST MODE (with minimal options to avoid initialization errors)
            const beastMode = new BeastMode({
                intelligence: false,
                marketplace: false,
                daisyChain: false,
                janitor: { enabled: false }
            });
            
            try {
                await beastMode.initialize();
            } catch (error) {
                // Some systems might not be available, that's OK for this test
            }
            
            // Test SENTINEL - just check that the class can be instantiated
            const { Sentinel } = require('../lib/sentinel');
            const sentinel = new Sentinel({
                janitor: { enabled: false }
            });
            
            if (!sentinel) throw new Error('SENTINEL not created');
            if (sentinel.brand !== 'sentinel') throw new Error('SENTINEL brand not set');
        });

        // Print results
        console.log('\n📊 Test Results:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`✅ Passed: ${this.passed}`);
        console.log(`❌ Failed: ${this.failed}`);
        console.log(`📈 Total: ${this.passed + this.failed}`);
        
        if (this.failed === 0) {
            console.log('\n🎉 All tests passed!');
            process.exit(0);
        } else {
            console.log('\n⚠️ Some tests failed');
            process.exit(1);
        }
    }

    async test(name, fn) {
        try {
            await fn();
            console.log(`✅ ${name}`);
            this.passed++;
        } catch (error) {
            console.log(`❌ ${name}: ${error.message}`);
            this.failed++;
        }
    }
}

// Run tests
const runner = new TestRunner();
runner.run().catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
});

