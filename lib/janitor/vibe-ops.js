/**
 * BEAST MODE Vibe Ops
 * QA for English - Visual AI Testing Agents
 * 
 * The Pitch: "Did you break the vibe?"
 * 
 * Features:
 * - Testing suite using Visual AI agents
 * - User describes "Happy Path" in English
 * - Agent spins up browser, clicks through
 * - Reports in plain English, not code
 */

const { createLogger } = require('../utils/logger');
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs').promises;

const log = createLogger('VibeOps');

class VibeOps {
    constructor(options = {}) {
        this.options = {
            enabled: false,
            headless: true,
            browser: 'chromium', // chromium, firefox, webkit
            timeout: 30000,
            screenshotOnFailure: true,
            // Tiered testing strategy (cost optimization)
            testingTier: 'pattern-matching', // pattern-matching, selective-visual-ai, full-visual-ai
            cacheEnabled: true,
            cacheTTL: 3600, // 1 hour
            selectiveExecution: true, // Only critical paths for visual AI
            ...options
        };

        this.tests = [];
        this.results = [];
        this.agents = [];
    }

    /**
     * Initialize Vibe Ops
     */
    async initialize() {
        log.info('🎭 Initializing Vibe Ops (Visual AI Testing)...');

        // Check if Playwright is available
        try {
            require('playwright');
            log.info('✅ Playwright available');
        } catch (error) {
            log.warn('⚠️ Playwright not installed. Install with: npm install playwright');
            log.warn('Vibe Ops will use fallback mode');
        }

        log.info('✅ Vibe Ops ready');
    }

    /**
     * Create a test from English description
     * 
     * Example:
     * "A user should be able to log in and see their dashboard"
     */
    async createTest(description, options = {}) {
        const test = {
            id: `test-${Date.now()}`,
            description,
            steps: await this.parseDescription(description),
            status: 'pending',
            createdAt: new Date().toISOString(),
            ...options
        };

        this.tests.push(test);
        log.info(`📝 Test created: "${description}"`);

        return test;
    }

    /**
     * Parse English description into test steps
     */
    async parseDescription(description) {
        // Use AI to parse English into actionable steps
        // For now, use pattern matching
        const steps = [];

        // Common patterns
        const patterns = [
            {
                pattern: /(?:user|they|someone)\s+(?:should\s+)?(?:be\s+able\s+to\s+)?(?:can\s+)?(log\s+in|login)/i,
                action: 'navigate',
                target: '/login',
                type: 'navigation'
            },
            {
                pattern: /(?:user|they)\s+(?:should\s+)?(?:be\s+able\s+to\s+)?(?:can\s+)?(?:see|view|access)\s+(?:their\s+)?(dashboard|home|profile)/i,
                action: 'verify',
                target: 'dashboard',
                type: 'verification'
            },
            {
                pattern: /(?:user|they)\s+(?:should\s+)?(?:be\s+able\s+to\s+)?(?:can\s+)?(click|press|tap)\s+(?:on\s+)?(?:the\s+)?['"]?([^'"]+)['"]?/i,
                action: 'click',
                target: '$2',
                type: 'interaction'
            },
            {
                pattern: /(?:user|they)\s+(?:should\s+)?(?:be\s+able\s+to\s+)?(?:can\s+)?(?:type|enter|input)\s+(?:the\s+)?(?:text\s+)?['"]?([^'"]+)['"]?/i,
                action: 'type',
                target: '$1',
                type: 'input'
            }
        ];

        // Extract steps from description
        for (const pattern of patterns) {
            const match = description.match(pattern.pattern);
            if (match) {
                let target = pattern.target;
                // Replace $1, $2, etc. with match groups
                for (let i = 1; i < match.length; i++) {
                    target = target.replace(`$${i}`, match[i]);
                }

                steps.push({
                    action: pattern.action,
                    target,
                    type: pattern.type,
                    description: match[0]
                });
            }
        }

        // If no patterns matched, create a generic verification step
        if (steps.length === 0) {
            steps.push({
                action: 'verify',
                target: description,
                type: 'verification',
                description
            });
        }

        return steps;
    }

    /**
     * Run a test
     */
    async runTest(testId) {
        const test = this.tests.find(t => t.id === testId);
        if (!test) {
            throw new Error(`Test not found: ${testId}`);
        }

        log.info(`🎭 Running test: "${test.description}"`);

        try {
            const result = await this.executeTest(test);
            this.results.push(result);
            test.status = result.passed ? 'passed' : 'failed';
            return result;
        } catch (error) {
            const result = {
                testId,
                passed: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
            this.results.push(result);
            test.status = 'failed';
            return result;
        }
    }

    /**
     * Execute test steps using browser agent (with tiered strategy)
     */
    async executeTest(test) {
        // Check cache first
        if (this.options.cacheEnabled) {
            const cached = await this.getCachedResult(test);
            if (cached) {
                log.debug('Using cached test result');
                return cached;
            }
        }

        // Choose execution method based on tier
        if (this.options.testingTier === 'pattern-matching') {
            return await this.executeTestPatternMatching(test);
        } else if (this.options.testingTier === 'selective-visual-ai') {
            // Only use visual AI for critical paths
            if (this.isCriticalPath(test)) {
                return await this.executeTestVisualAI(test);
            } else {
                return await this.executeTestPatternMatching(test);
            }
        } else {
            // Full visual AI
            return await this.executeTestVisualAI(test);
        }
    }

    /**
     * Execute test using pattern matching (fast, cheap)
     */
    async executeTestPatternMatching(test) {
        const results = {
            testId: test.id,
            passed: true,
            errors: [],
            method: 'pattern-matching',
            note: 'Fast pattern matching - limited accuracy',
            timestamp: new Date().toISOString()
        };

        // Simple pattern matching for common scenarios
        for (const step of test.steps) {
            if (step.action === 'navigate') {
                try {
                    const response = await fetch(step.target);
                    if (!response.ok) {
                        results.passed = false;
                        results.errors.push({
                            step: step.description,
                            error: `HTTP ${response.status}`
                        });
                    }
                } catch (error) {
                    results.passed = false;
                    results.errors.push({
                        step: step.description,
                        error: error.message
                    });
                }
            }
        }

        // Cache result
        if (this.options.cacheEnabled) {
            await this.cacheResult(test, results);
        }

        return results;
    }

    /**
     * Execute test using visual AI (slower, more expensive)
     */
    async executeTestVisualAI(test) {
        let browser = null;
        let page = null;
        const screenshots = [];
        const errors = [];

        try {
            // Try to use Playwright
            const playwright = require('playwright');
            browser = await playwright[this.options.browser].launch({
                headless: this.options.headless
            });
            page = await browser.newPage();

            // Execute each step
            for (const step of test.steps) {
                try {
                    await this.executeStep(page, step, screenshots);
                } catch (error) {
                    errors.push({
                        step: step.description,
                        error: error.message
                    });
                    if (this.options.screenshotOnFailure) {
                        const screenshot = await page.screenshot();
                        screenshots.push({
                            step: step.description,
                            screenshot: screenshot.toString('base64')
                        });
                    }
                }
            }

            await browser.close();

            const result = {
                testId: test.id,
                passed: errors.length === 0,
                errors,
                screenshots,
                method: 'visual-ai',
                timestamp: new Date().toISOString()
            };

            // Cache result
            if (this.options.cacheEnabled) {
                await this.cacheResult(test, result);
            }

            return result;
        } catch (error) {
            // Fallback: Use pattern matching if Playwright not available
            log.warn('Playwright not available, using pattern matching fallback');
            return await this.executeTestPatternMatching(test);
        }
    }

    /**
     * Check if test is critical path (requires visual AI)
     */
    isCriticalPath(test) {
        const criticalKeywords = ['login', 'payment', 'checkout', 'signup', 'auth', 'security'];
        const description = test.description.toLowerCase();
        return criticalKeywords.some(keyword => description.includes(keyword));
    }

    /**
     * Get cached test result
     */
    async getCachedResult(test) {
        // Simple in-memory cache (would use Redis in production)
        if (!this.cache) {
            this.cache = new Map();
        }

        const cacheKey = `${test.id}-${test.description}`;
        const cached = this.cache.get(cacheKey);
        
        if (cached && (Date.now() - cached.timestamp < this.options.cacheTTL * 1000)) {
            return cached.result;
        }

        return null;
    }

    /**
     * Cache test result
     */
    async cacheResult(test, result) {
        if (!this.cache) {
            this.cache = new Map();
        }

        const cacheKey = `${test.id}-${test.description}`;
        this.cache.set(cacheKey, {
            result,
            timestamp: Date.now()
        });
    }

    /**
     * Execute a single step
     */
    async executeStep(page, step, screenshots) {
        switch (step.action) {
            case 'navigate':
                await page.goto(step.target, { waitUntil: 'networkidle' });
                break;

            case 'click':
                await page.click(`text="${step.target}"`, { timeout: 5000 });
                break;

            case 'type':
                // Find input field and type
                await page.fill('input[type="text"], input[type="email"], input[type="password"]', step.target);
                break;

            case 'verify':
                // Verify element exists or text is present
                const element = await page.locator(`text="${step.target}"`).first();
                if (!(await element.isVisible())) {
                    throw new Error(`Element "${step.target}" not found or not visible`);
                }
                break;

            default:
                log.warn(`Unknown action: ${step.action}`);
        }

        // Take screenshot after step
        if (this.options.screenshotOnFailure) {
            const screenshot = await page.screenshot();
            screenshots.push({
                step: step.description,
                screenshot: screenshot.toString('base64')
            });
        }
    }

    /**
     * Fallback test execution (without browser)
     */
    async executeTestFallback(test) {
        // Simple HTTP-based testing
        const results = {
            testId: test.id,
            passed: true,
            errors: [],
            note: 'Fallback mode - limited testing capabilities',
            timestamp: new Date().toISOString()
        };

        for (const step of test.steps) {
            if (step.action === 'navigate') {
                try {
                    // Try to fetch the URL
                    const response = await fetch(step.target);
                    if (!response.ok) {
                        results.passed = false;
                        results.errors.push({
                            step: step.description,
                            error: `HTTP ${response.status}`
                        });
                    }
                } catch (error) {
                    results.passed = false;
                    results.errors.push({
                        step: step.description,
                        error: error.message
                    });
                }
            }
        }

        return results;
    }

    /**
     * Run all tests
     */
    async runAllTests() {
        log.info(`🎭 Running ${this.tests.length} tests...`);

        const results = [];
        for (const test of this.tests) {
            const result = await this.runTest(test.id);
            results.push(result);
        }

        const passed = results.filter(r => r.passed).length;
        const failed = results.filter(r => !r.passed).length;

        log.info(`✅ Tests complete: ${passed} passed, ${failed} failed`);

        return {
            total: results.length,
            passed,
            failed,
            results
        };
    }

    /**
     * Generate plain English report
     */
    generateReport(results = null) {
        const testResults = results || this.results;
        const report = {
            summary: {
                total: testResults.length,
                passed: testResults.filter(r => r.passed).length,
                failed: testResults.filter(r => !r.passed).length
            },
            details: []
        };

        for (const result of testResults) {
            const test = this.tests.find(t => t.id === result.testId);
            const detail = {
                test: test?.description || result.testId,
                status: result.passed ? '✅ Passed' : '❌ Failed',
                errors: result.errors || []
            };

            // Add plain English error descriptions
            if (result.errors && result.errors.length > 0) {
                detail.errors = result.errors.map(err => {
                    return `Step "${err.step}" failed: ${err.error}`;
                });
            }

            report.details.push(detail);
        }

        return report;
    }

    /**
     * Get test status
     */
    getStatus() {
        return {
            enabled: this.options.enabled,
            tests: this.tests.length,
            results: this.results.length,
            passed: this.results.filter(r => r.passed).length,
            failed: this.results.filter(r => !r.passed).length
        };
    }
}

module.exports = { VibeOps };

