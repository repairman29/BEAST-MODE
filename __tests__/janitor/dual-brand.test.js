/**
 * Tests for Dual-Brand System
 * Testing BEAST MODE (Community) vs SENTINEL (Enterprise)
 */

const { BeastMode } = require('../../lib/index');
const { getBrandConfig, detectBrand } = require('../../lib/brand-config');

describe('Dual-Brand System', () => {
    describe('Brand Configuration', () => {
        test('should return BEAST MODE config for community', () => {
            const config = getBrandConfig('beast-mode');
            expect(config.name).toBe('BEAST MODE');
            expect(config.tone).toBe('energetic');
            expect(config.target).toBe('community');
            expect(config.emojis).toBe(true);
        });

        test('should return SENTINEL config for enterprise', () => {
            const config = getBrandConfig('sentinel');
            expect(config.name).toBe('SENTINEL');
            expect(config.tone).toBe('professional');
            expect(config.target).toBe('enterprise');
            expect(config.emojis).toBe(false);
        });
    });

    describe('Brand Detection', () => {
        test('should detect BEAST MODE by default', () => {
            const brand = detectBrand({});
            expect(brand).toBe('beast-mode');
        });

        test('should detect SENTINEL when enterprise flag set', () => {
            const brand = detectBrand({ enterprise: true });
            expect(brand).toBe('sentinel');
        });

        test('should detect SENTINEL when sentinel flag set', () => {
            const brand = detectBrand({ sentinel: true });
            expect(brand).toBe('sentinel');
        });

        test('should respect explicit brand setting', () => {
            const brand = detectBrand({ brand: 'sentinel' });
            expect(brand).toBe('sentinel');
        });
    });

    describe('BEAST MODE Initialization', () => {
        test('should initialize in BEAST MODE by default', async () => {
            const beastMode = new BeastMode({
                janitor: { enabled: false } // Disable for test
            });
            
            await beastMode.initialize();
            
            expect(beastMode.janitor).toBeTruthy();
            expect(beastMode.sentinel).toBeFalsy();
        });
    });

    describe('SENTINEL Initialization', () => {
        test('should initialize in SENTINEL mode when flag set', async () => {
            const sentinel = new BeastMode({
                sentinel: true,
                janitor: { enabled: false } // Disable for test
            });
            
            await sentinel.initialize();
            
            expect(sentinel.sentinel).toBeTruthy();
            expect(sentinel.janitor).toBeTruthy(); // Should still have janitor
        });
    });

    describe('Enterprise Defaults (Sentinel)', () => {
        test('should have enterprise-safe defaults', async () => {
            const sentinel = new BeastMode({
                sentinel: true,
                janitor: { enabled: false }
            });
            
            await sentinel.initialize();
            
            const status = sentinel.sentinel.getStatus();
            expect(status.brand).toBe('sentinel');
            expect(status.enabled).toBe(true);
        });
    });
});

