/**
 * BEAST MODE Quality Engine
 * Core quality assurance and validation system
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');
const { createLogger } = require('./utils/logger');

const log = createLogger('QualityEngine');

class QualityEngine {
    constructor() {
        this.initialized = false;
        this.validators = new Map();
        this.cache = new Map();
        this.config = null;
    }

    async initialize() {
        if (this.initialized) return;

        log.info('Initializing BEAST MODE Quality Engine...');

        // Load configuration
        await this.loadConfig();

        // Initialize validators
        await this.initializeValidators();

        this.initialized = true;
        log.info('✅ BEAST MODE Quality Engine ready');
    }

    async calculateScore(options = {}) {
        const {
            scope = 'repo',
            detailed = false,
            cache = true
        } = options;

        log.info(`Calculating BEAST MODE quality score for ${scope}`);

        // Check cache first
        const cacheKey = `${scope}_${detailed}`;
        if (cache && this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < 300000) { // 5 minutes
                return cached.score;
            }
        }

        const score = {
            overall: 0,
            grade: 'F',
            breakdown: {},
            issues: [],
            timestamp: new Date().toISOString()
        };

        try {
            // Run all validators
            const results = {};
            let totalWeight = 0;
            let weightedScore = 0;

            for (const [name, validator] of this.validators) {
                try {
                    const result = await validator.validate();
                    results[name] = result;

                    const weight = validator.weight || 1;
                    weightedScore += result.score * weight;
                    totalWeight += weight;

                    if (detailed) {
                        score.breakdown[name] = result;
                    }

                    // Collect issues
                    if (result.issues) {
                        score.issues.push(...result.issues.map(issue => ({
                            ...issue,
                            validator: name
                        })));
                    }

                } catch (error) {
                    log.warn(`Validator ${name} failed:`, error.message);
                    results[name] = { score: 0, error: error.message };
                }
            }

            // Integrate Oracle insights if available
            try {
                const oracleInsights = await this.getOracleInsights(options);
                if (oracleInsights && oracleInsights.score !== undefined) {
                    // Oracle provides additional architectural insights
                    const oracleWeight = 0.2; // 20% weight for Oracle insights
                    weightedScore += oracleInsights.score * oracleWeight;
                    totalWeight += oracleWeight;

                    if (detailed) {
                        score.breakdown['oracle-insights'] = oracleInsights;
                    }

                    // Add Oracle recommendations
                    if (oracleInsights.recommendations) {
                        score.issues.push(...oracleInsights.recommendations.map(rec => ({
                            type: 'oracle-insight',
                            severity: 'info',
                            message: rec,
                            validator: 'oracle'
                        })));
                    }
                }
            } catch (error) {
                log.debug('Oracle insights not available:', error.message);
            }

            // Calculate overall score
            score.overall = totalWeight > 0 ? Math.round(weightedScore / totalWeight) : 0;
            score.grade = this.scoreToGrade(score.overall);

            // Sort issues by severity
            score.issues.sort((a, b) => (b.severity || 0) - (a.severity || 0));

            // Cache result
            if (cache) {
                this.cache.set(cacheKey, {
                    score,
                    timestamp: Date.now()
                });
            }

            log.info(`Quality score calculated: ${score.overall} (${score.grade})`);
            return score;

        } catch (error) {
            log.error('Failed to calculate quality score:', error.message);
            throw error;
        }
    }

    async runChecks(options = {}) {
        const { fix = false, report = false } = options;

        log.info(`Running BEAST MODE quality checks${fix ? ' with auto-fix' : ''}`);

        const results = {
            timestamp: new Date().toISOString(),
            checks: {},
            fixed: [],
            unfixed: [],
            report: null
        };

        // Run each validator
        for (const [name, validator] of this.validators) {
            try {
                const result = await validator.validate();

                if (result.issues && result.issues.length > 0) {
                    results.checks[name] = {
                        status: 'issues_found',
                        issues: result.issues.length,
                        details: result.issues
                    };

                    // Try to fix if requested
                    if (fix && validator.fix) {
                        try {
                            const fixed = await validator.fix(result.issues);
                            results.fixed.push({
                                validator: name,
                                issues: result.issues.length,
                                fixed: fixed.length
                            });
                        } catch (fixError) {
                            log.warn(`Failed to fix issues for ${name}:`, fixError.message);
                            results.unfixed.push({
                                validator: name,
                                issues: result.issues,
                                error: fixError.message
                            });
                        }
                    } else {
                        results.unfixed.push({
                            validator: name,
                            issues: result.issues
                        });
                    }
                } else {
                    results.checks[name] = {
                        status: 'passed',
                        score: result.score
                    };
                }

            } catch (error) {
                results.checks[name] = {
                    status: 'error',
                    error: error.message
                };
                log.error(`Check ${name} failed:`, error.message);
            }
        }

        // Generate report if requested
        if (report) {
            results.report = await this.generateReport(results);
        }

        const totalIssues = results.unfixed.reduce((sum, u) => sum + u.issues.length, 0);
        log.info(`Quality checks complete: ${totalIssues} issues found, ${results.fixed.length} validators fixed`);

        return results;
    }

    async generateReport(results) {
        const report = {
            title: 'BEAST MODE Quality Report',
            generated: new Date().toISOString(),
            summary: {
                totalChecks: Object.keys(results.checks).length,
                passedChecks: Object.values(results.checks).filter(c => c.status === 'passed').length,
                failedChecks: Object.values(results.checks).filter(c => c.status === 'issues_found').length,
                errorChecks: Object.values(results.checks).filter(c => c.status === 'error').length,
                totalIssues: results.unfixed.reduce((sum, u) => sum + u.issues.length, 0),
                fixedIssues: results.fixed.reduce((sum, f) => sum + f.fixed, 0)
            },
            details: results.checks,
            recommendations: await this.generateRecommendations(results)
        };

        return report;
    }

    async generateRecommendations(results) {
        const recommendations = [];

        // Analyze failed checks and generate recommendations
        for (const [checkName, checkResult] of Object.entries(results.checks)) {
            if (checkResult.status === 'issues_found') {
                const validator = this.validators.get(checkName);
                if (validator && validator.recommendations) {
                    recommendations.push(...validator.recommendations(checkResult));
                }
            }
        }

        // General recommendations based on patterns
        const totalIssues = results.unfixed.reduce((sum, u) => sum + u.issues.length, 0);
        if (totalIssues > 50) {
            recommendations.unshift({
                priority: 'high',
                category: 'overall',
                title: 'Comprehensive quality improvement needed',
                description: 'High number of quality issues detected across multiple areas',
                action: 'Schedule dedicated quality improvement sprint'
            });
        }

        return recommendations;
    }

    scoreToGrade(score) {
        if (score >= 95) return 'A+';
        if (score >= 90) return 'A';
        if (score >= 85) return 'A-';
        if (score >= 80) return 'B+';
        if (score >= 75) return 'B';
        if (score >= 70) return 'B-';
        if (score >= 65) return 'C+';
        if (score >= 60) return 'C';
        if (score >= 55) return 'C-';
        if (score >= 50) return 'D';
        return 'F';
    }

    async initializeValidators() {
        // Logger Infrastructure Validator
        this.validators.set('logger', {
            name: 'Logger Infrastructure',
            weight: 1.0,
            async validate() {
                return await require('./validators/logger-validator').validate();
            },
            async fix(issues) {
                return await require('./validators/logger-validator').fix(issues);
            }
        });

        // Supabase Safety Validator
        this.validators.set('supabase', {
            name: 'Supabase Safety',
            weight: 1.0,
            async validate() {
                return await require('./validators/supabase-validator').validate();
            },
            async fix(issues) {
                return await require('./validators/supabase-validator').fix(issues);
            }
        });

        // Cross-Platform Code Validator
        this.validators.set('cross-platform', {
            name: 'Cross-Platform Code',
            weight: 0.8,
            async validate() {
                return await require('./validators/cross-platform-validator').validate();
            },
            async fix(issues) {
                return await require('./validators/cross-platform-validator').fix(issues);
            }
        });

        // Variable Scoping Validator
        this.validators.set('scoping', {
            name: 'Variable Scoping',
            weight: 0.7,
            async validate() {
                return await require('./validators/scoping-validator').validate();
            },
            async fix(issues) {
                return await require('./validators/scoping-validator').fix(issues);
            }
        });

        // ESLint Validator (if available)
        try {
            const eslintValidator = require('./validators/eslint-validator');
            this.validators.set('eslint', {
                name: 'ESLint',
                weight: 1.2,
                async validate() {
                    return await eslintValidator.validate();
                }
            });
        } catch (error) {
            log.warn('ESLint validator not available:', error.message);
        }

        log.info(`Initialized ${this.validators.size} quality validators`);
    }

    async loadConfig() {
        try {
            const configPath = path.join(process.cwd(), '.beast-mode.json');
            this.config = await fs.readJson(configPath);
        } catch (error) {
            // Use default config
            this.config = {
                version: '1.0.0',
                quality: {
                    validators: ['logger', 'supabase', 'cross-platform', 'scoping'],
                    autoFix: false,
                    cache: true
                }
            };
        }
    }

    // Utility methods
    clearCache() {
        this.cache.clear();
        log.info('Quality cache cleared');
    }

    getValidators() {
        return Array.from(this.validators.keys());
    }

    getValidator(name) {
        return this.validators.get(name);
    }

    async shutdown() {
        this.clearCache();
        this.validators.clear();
        this.initialized = false;
        log.info('Quality engine shutdown');
    }
}

// Singleton instance for CLI usage
let qualityEngineInstance = null;

async function getQualityEngine() {
    if (!qualityEngineInstance) {
        qualityEngineInstance = new QualityEngine();
        await qualityEngineInstance.initialize();
    }
    return qualityEngineInstance;
}

// CLI wrapper functions
async function runQualityChecks(options = {}) {
    const engine = await getQualityEngine();
    return await engine.runChecks(options);
}

async function calculateQualityScore(options = {}) {
    const engine = await getQualityEngine();
    return await engine.calculateScore(options);
}

async function performQualityAudit(options = {}) {
    const engine = await getQualityEngine();
    const score = await engine.calculateScore({ detailed: true, ...options });
    const checks = await engine.runChecks({ report: true, ...options });

    return {
        score,
        checks,
        audit: {
            timestamp: new Date().toISOString(),
            scope: options.scope || 'repo',
            recommendations: await engine.generateRecommendations(checks)
        }
    };
    /**
     * Get Oracle insights for quality analysis
     */
    async getOracleInsights(options = {}) {
        // Check if Oracle is available through BEAST MODE
        if (typeof global !== 'undefined' && global.beastMode && global.beastMode.oracle) {
            try {
                const oracle = global.beastMode.oracle;
                const codebasePath = options.path || process.cwd();

                const analysis = await oracle.analyzeArchitecture(codebasePath);

                // Convert Oracle analysis to quality score format
                return {
                    score: Math.min(100, Math.max(0, 100 - (analysis.codeQuality.length * 5))), // Deduct points for issues
                    status: 'analyzed',
                    insights: analysis.architecturalInsights,
                    recommendations: analysis.recommendations,
                    oracleAvailable: true
                };
            } catch (error) {
                log.debug('Oracle analysis failed:', error.message);
            }
        }

        // Return minimal insights if Oracle unavailable
        return {
            score: 50, // Neutral score when Oracle unavailable
            status: 'oracle-unavailable',
            insights: [],
            recommendations: ['Connect Oracle for advanced architectural analysis'],
            oracleAvailable: false
        };
    }
}

module.exports = {
    QualityEngine,
    getQualityEngine,
    runQualityChecks,
    calculateQualityScore,
    performQualityAudit
};

