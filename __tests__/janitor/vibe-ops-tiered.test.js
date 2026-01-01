/**
 * Tests for Vibe Ops Tiered Testing Strategy
 * Testing cost optimization: Visual AI Cost Risk
 */

const { VibeOps } = require('../../lib/janitor/vibe-ops');

describe('Vibe Ops - Tiered Testing Strategy', () => {
    let vibeOps;

    describe('Pattern Matching Tier (Free/Fast)', () => {
        beforeEach(() => {
            vibeOps = new VibeOps({
                enabled: true,
                testingTier: 'pattern-matching',
                cacheEnabled: true
            });
        });

        test('should use pattern matching for free tier', async () => {
            const test = await vibeOps.createTest('User can login');
            
            // Mock executeTestPatternMatching
            vibeOps.executeTestPatternMatching = jest.fn().mockResolvedValue({
                testId: test.id,
                passed: true,
                method: 'pattern-matching'
            });

            const result = await vibeOps.executeTest(test);
            
            expect(vibeOps.executeTestPatternMatching).toHaveBeenCalled();
            expect(result.method).toBe('pattern-matching');
        });

        test('should be fast (< 1 second)', async () => {
            const start = Date.now();
            const test = await vibeOps.createTest('User can login');
            
            vibeOps.executeTestPatternMatching = jest.fn().mockResolvedValue({
                testId: test.id,
                passed: true,
                method: 'pattern-matching'
            });

            await vibeOps.executeTest(test);
            const duration = Date.now() - start;
            
            expect(duration).toBeLessThan(1000); // < 1 second
        });
    });

    describe('Selective Visual AI Tier (Paid)', () => {
        beforeEach(() => {
            vibeOps = new VibeOps({
                enabled: true,
                testingTier: 'selective-visual-ai',
                cacheEnabled: true,
                selectiveExecution: true
            });
        });

        test('should use visual AI for critical paths', async () => {
            const test = await vibeOps.createTest('User can login and see dashboard');
            
            // Mock isCriticalPath
            vibeOps.isCriticalPath = jest.fn().mockReturnValue(true);
            vibeOps.executeTestVisualAI = jest.fn().mockResolvedValue({
                testId: test.id,
                passed: true,
                method: 'visual-ai'
            });

            const result = await vibeOps.executeTest(test);
            
            expect(vibeOps.isCriticalPath).toHaveBeenCalled();
            expect(vibeOps.executeTestVisualAI).toHaveBeenCalled();
            expect(result.method).toBe('visual-ai');
        });

        test('should use pattern matching for non-critical paths', async () => {
            const test = await vibeOps.createTest('User can view settings');
            
            vibeOps.isCriticalPath = jest.fn().mockReturnValue(false);
            vibeOps.executeTestPatternMatching = jest.fn().mockResolvedValue({
                testId: test.id,
                passed: true,
                method: 'pattern-matching'
            });

            const result = await vibeOps.executeTest(test);
            
            expect(vibeOps.executeTestPatternMatching).toHaveBeenCalled();
            expect(result.method).toBe('pattern-matching');
        });
    });

    describe('Caching Strategy', () => {
        beforeEach(() => {
            vibeOps = new VibeOps({
                enabled: true,
                cacheEnabled: true,
                cacheTTL: 3600
            });
        });

        test('should cache test results', async () => {
            const test = await vibeOps.createTest('User can login');
            
            vibeOps.executeTestPatternMatching = jest.fn().mockResolvedValue({
                testId: test.id,
                passed: true,
                method: 'pattern-matching'
            });

            // First run
            await vibeOps.executeTest(test);
            
            // Second run should use cache
            const cached = await vibeOps.getCachedResult(test);
            expect(cached).toBeTruthy();
        });

        test('should invalidate cache after TTL', async () => {
            const test = await vibeOps.createTest('User can login');
            
            vibeOps.executeTestPatternMatching = jest.fn().mockResolvedValue({
                testId: test.id,
                passed: true,
                method: 'pattern-matching'
            });

            await vibeOps.executeTest(test);
            
            // Mock expired cache
            if (vibeOps.cache) {
                const cacheKey = `${test.id}-${test.description}`;
                vibeOps.cache.set(cacheKey, {
                    result: { testId: test.id },
                    timestamp: Date.now() - 4000000 // Expired
                });
            }

            const cached = await vibeOps.getCachedResult(test);
            expect(cached).toBeNull();
        });
    });

    describe('Critical Path Detection', () => {
        test('should identify critical paths', () => {
            vibeOps = new VibeOps({ enabled: true });
            
            const criticalTests = [
                'User can login',
                'User can checkout',
                'User can make payment',
                'User can signup'
            ];

            criticalTests.forEach(description => {
                const test = { description };
                expect(vibeOps.isCriticalPath(test)).toBe(true);
            });
        });

        test('should not identify non-critical paths', () => {
            vibeOps = new VibeOps({ enabled: true });
            
            const nonCriticalTests = [
                'User can view settings',
                'User can change theme',
                'User can update profile'
            ];

            nonCriticalTests.forEach(description => {
                const test = { description };
                expect(vibeOps.isCriticalPath(test)).toBe(false);
            });
        });
    });
});

