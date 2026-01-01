/**
 * Tests for Vibe Restoration System
 */

const { VibeRestorer } = require('../../lib/janitor/vibe-restorer');

describe('Vibe Restoration System', () => {
    let restorer;

    beforeEach(() => {
        restorer = new VibeRestorer({
            enabled: true,
            autoTrack: true,
            qualityThreshold: 70,
            rollbackEnabled: true
        });
    });

    describe('Regression Detection', () => {
        test('should detect quality drop > 10 points', async () => {
            // Mock state history
            restorer.stateHistory = [
                {
                    timestamp: new Date(Date.now() - 3600000).toISOString(),
                    quality: 85,
                    commit: 'abc123'
                }
            ];

            restorer.getCurrentQuality = jest.fn().mockResolvedValue(72); // Drop of 13 points

            const currentState = await restorer.trackState();
            const regression = await restorer.detectRegression(currentState);

            expect(regression).toBeTruthy();
            expect(regression.qualityDrop).toBeGreaterThan(10);
            expect(regression.currentQuality).toBe(72);
            expect(regression.previousQuality).toBe(85);
        });

        test('should not detect regression for small quality changes', async () => {
            restorer.stateHistory = [
                {
                    timestamp: new Date(Date.now() - 3600000).toISOString(),
                    quality: 85,
                    commit: 'abc123'
                }
            ];

            restorer.getCurrentQuality = jest.fn().mockResolvedValue(84); // Drop of 1 point

            const currentState = await restorer.trackState();
            const regression = await restorer.detectRegression(currentState);

            expect(regression).toBeNull();
        });
    });

    describe('Severity Calculation', () => {
        test('should calculate critical severity for large drops', () => {
            const severity = restorer.calculateSeverity(35);
            expect(severity).toBe('critical');
        });

        test('should calculate high severity for medium drops', () => {
            const severity = restorer.calculateSeverity(25);
            expect(severity).toBe('high');
        });

        test('should calculate medium severity for small drops', () => {
            const severity = restorer.calculateSeverity(15);
            expect(severity).toBe('medium');
        });
    });

    describe('State Tracking', () => {
        test('should track code state', async () => {
            restorer.getCurrentQuality = jest.fn().mockResolvedValue(80);
            restorer.getCurrentCommit = jest.fn().mockReturnValue('abc123');
            restorer.getCurrentBranch = jest.fn().mockReturnValue('main');
            restorer.getChangedFiles = jest.fn().mockResolvedValue(['file1.js', 'file2.js']);

            const state = await restorer.trackState();

            expect(state).toBeTruthy();
            expect(state.quality).toBe(80);
            expect(state.commit).toBe('abc123');
            expect(state.files.length).toBe(2);
        });

        test('should update last good state when quality is good', async () => {
            restorer.getCurrentQuality = jest.fn().mockResolvedValue(85);
            restorer.getCurrentCommit = jest.fn().mockReturnValue('abc123');
            restorer.getCurrentBranch = jest.fn().mockReturnValue('main');
            restorer.getChangedFiles = jest.fn().mockResolvedValue([]);

            await restorer.trackState();

            expect(restorer.lastGoodState).toBeTruthy();
            expect(restorer.lastGoodState.quality).toBe(85);
        });
    });
});

