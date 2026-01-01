/**
 * Tests for Silent Refactoring Engine Safety Features
 * Testing risk mitigation: Hallucination Refactor Risk
 */

const { SilentRefactoringEngine } = require('../../lib/janitor/silent-refactoring-engine');

describe('Silent Refactoring Engine - Safety Features', () => {
    let engine;

    beforeEach(() => {
        engine = new SilentRefactoringEngine({
            enabled: true,
            autoMerge: false, // Default: suggestions only
            confidenceThreshold: 0.999, // 99.9% required
            requireHumanReview: true,
            requireTests: true,
            rollbackReady: true,
            maxFilesPerChange: 5,
            maxTotalChanges: 200
        });
    });

    describe('Confidence Threshold', () => {
        test('should block auto-merge if confidence < 99.9%', () => {
            const results = {
                deduplications: [],
                securityFixes: [],
                improvements: [],
                errors: []
            };

            // Mock low confidence
            engine.calculateConfidence = () => 0.95; // 95% confidence

            const canMerge = engine.canAutoMerge(results);
            expect(canMerge.allowed).toBe(false);
            expect(canMerge.reason).toContain('confidence');
        });

        test('should allow auto-merge if confidence >= 99.9%', () => {
            const results = {
                deduplications: [],
                securityFixes: [],
                improvements: [],
                errors: []
            };

            // Mock high confidence
            engine.calculateConfidence = () => 0.999; // 99.9% confidence

            const canMerge = engine.canAutoMerge(results);
            expect(canMerge.allowed).toBe(true);
        });
    });

    describe('Change Limits', () => {
        test('should block if too many files affected', () => {
            const results = {
                deduplications: Array(6).fill({ file1: 'file1.js', file2: 'file2.js' }),
                securityFixes: [],
                improvements: [],
                errors: []
            };

            engine.calculateConfidence = () => 0.999;

            const canMerge = engine.canAutoMerge(results);
            expect(canMerge.allowed).toBe(false);
            expect(canMerge.reason).toContain('files');
        });

        test('should block if too many total changes', () => {
            const results = {
                deduplications: Array(201).fill({ file1: 'file1.js' }),
                securityFixes: [],
                improvements: [],
                errors: []
            };

            engine.calculateConfidence = () => 0.999;

            const canMerge = engine.canAutoMerge(results);
            expect(canMerge.allowed).toBe(false);
            expect(canMerge.reason).toContain('changes');
        });
    });

    describe('Error Handling', () => {
        test('should block auto-merge if errors present', () => {
            const results = {
                deduplications: [],
                securityFixes: [],
                improvements: [],
                errors: [{ type: 'test', error: 'Test error' }]
            };

            engine.calculateConfidence = () => 0.999;

            const canMerge = engine.canAutoMerge(results);
            expect(canMerge.allowed).toBe(false);
            expect(canMerge.reason).toContain('errors');
        });
    });

    describe('Confidence Calculation', () => {
        test('should reduce confidence for security fixes', () => {
            const results = {
                deduplications: [],
                securityFixes: [{ file: 'test.js' }],
                improvements: [],
                errors: []
            };

            const confidence = engine.calculateConfidence(results);
            expect(confidence).toBeLessThan(1.0);
        });

        test('should reduce confidence for many changes', () => {
            const results = {
                deduplications: Array(20).fill({ file1: 'file1.js' }),
                securityFixes: [],
                improvements: [],
                errors: []
            };

            const confidence = engine.calculateConfidence(results);
            expect(confidence).toBeLessThan(1.0);
        });

        test('should reduce confidence for errors', () => {
            const results = {
                deduplications: [],
                securityFixes: [],
                improvements: [],
                errors: [{ type: 'test', error: 'Test error' }]
            };

            const confidence = engine.calculateConfidence(results);
            expect(confidence).toBeLessThan(1.0);
        });
    });
});

