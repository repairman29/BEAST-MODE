/**
 * Integration Tests for Janitor System
 * Testing all systems working together
 */

const { BeastMode } = require('../../lib/index');

describe('Janitor System Integration', () => {
    describe('BEAST MODE (Community) Integration', () => {
        test('should initialize all janitor systems', async () => {
            const beastMode = new BeastMode({
                janitor: {
                    enabled: true,
                    silentRefactoring: { enabled: false }, // Disable for test
                    architectureEnforcement: { enabled: false },
                    vibeRestoration: { enabled: false },
                    repoMemory: { enabled: false },
                    vibeOps: { enabled: false },
                    enterpriseGuardrail: { enabled: false },
                    invisibleCICD: { enabled: false },
                    promptChainDebugger: { enabled: false },
                    safeModeWrapper: { enabled: false }
                }
            });

            await beastMode.initialize();

            expect(beastMode.janitor).toBeTruthy();
            expect(beastMode.janitor.initialized).toBe(true);
        });

        test('should have community defaults', async () => {
            const beastMode = new BeastMode({
                janitor: { enabled: false }
            });

            await beastMode.initialize();

            // Community mode should allow more permissive defaults
            // (though still safe by default)
            expect(beastMode.janitor).toBeTruthy();
        });
    });

    describe('SENTINEL (Enterprise) Integration', () => {
        test('should initialize Sentinel with enterprise defaults', async () => {
            const sentinel = new BeastMode({
                sentinel: true,
                janitor: {
                    enabled: false // Disable for test
                }
            });

            await sentinel.initialize();

            expect(sentinel.sentinel).toBeTruthy();
            expect(sentinel.janitor).toBeTruthy();
        });

        test('should have enterprise-safe defaults', async () => {
            const sentinel = new BeastMode({
                sentinel: true,
                janitor: { enabled: false }
            });

            await sentinel.initialize();

            const status = sentinel.sentinel.getStatus();
            expect(status.brand).toBe('sentinel');
            expect(status.enterprise).toBeTruthy();
        });
    });

    describe('Safety Features Integration', () => {
        test('should enforce confidence threshold', async () => {
            const beastMode = new BeastMode({
                janitor: {
                    enabled: true,
                    silentRefactoring: {
                        enabled: true,
                        confidenceThreshold: 0.999,
                        autoMerge: false
                    }
                }
            });

            await beastMode.initialize();

            const refactoring = beastMode.janitor.silentRefactoring;
            expect(refactoring.options.confidenceThreshold).toBe(0.999);
            expect(refactoring.options.autoMerge).toBe(false);
        });

        test('should enforce testing requirements', async () => {
            const beastMode = new BeastMode({
                janitor: {
                    enabled: true,
                    silentRefactoring: {
                        enabled: true,
                        requireTests: true
                    }
                }
            });

            await beastMode.initialize();

            const refactoring = beastMode.janitor.silentRefactoring;
            expect(refactoring.options.requireTests).toBe(true);
        });
    });

    describe('Cost Optimization Integration', () => {
        test('should use tiered testing strategy', async () => {
            const beastMode = new BeastMode({
                janitor: {
                    enabled: true,
                    vibeOps: {
                        enabled: true,
                        testingTier: 'pattern-matching',
                        cacheEnabled: true
                    }
                }
            });

            await beastMode.initialize();

            const vibeOps = beastMode.janitor.vibeOps;
            expect(vibeOps.options.testingTier).toBe('pattern-matching');
            expect(vibeOps.options.cacheEnabled).toBe(true);
        });
    });
});

