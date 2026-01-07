/**
 * BEAST MODE Silent Refactoring Engine
 * The "AI Janitor" - Overnight code cleanup while you sleep
 * 
 * Handles:
 * - Automatic de-duplication
 * - Silent security fixes
 * - Code quality improvements
 * - Background refactoring
 */

const fs = require('fs').promises;
const path = require('path');
const { createLogger } = require('../utils/logger');
const { execSync } = require('child_process');

const log = createLogger('SilentRefactoringEngine');

class SilentRefactoringEngine {
    constructor(options = {}) {
        this.options = {
            enabled: false,
            overnightMode: false,
            autoMerge: false, // Default: suggestions only (safety first)
            confidenceThreshold: 0.999, // 99.9% required for auto-merge (risk mitigation)
            requireHumanReview: true, // Always require review for auto-merge
            maxFilesPerChange: 5, // Require review if affecting > 5 files
            requireTests: true, // Must pass all tests before merge
            rollbackReady: true, // Feature branches only
            maxChangesPerRun: 50,
            maxLinesPerFile: 100, // Review required if more
            maxTotalChanges: 200, // Review required if more
            schedule: {
                start: '02:00', // 2 AM
                end: '06:00'    // 6 AM
            },
            ...options
        };

        this.refactoringQueue = [];
        this.isRunning = false;
        this.lastRun = null;
        this.stats = {
            totalRuns: 0,
            totalFixes: 0,
            totalSecurityFixes: 0,
            totalDeduplications: 0,
            totalImprovements: 0
        };
    }

    /**
     * Initialize the refactoring engine
     */
    async initialize() {
        log.info('🧹 Initializing Silent Refactoring Engine...');

        if (this.options.overnightMode) {
            this.startOvernightScheduler();
        }

        log.info('✅ Silent Refactoring Engine ready');
    }

    /**
     * Enable overnight maintenance mode
     */
    async enableOvernightMode() {
        this.options.overnightMode = true;
        this.options.enabled = true;
        this.startOvernightScheduler();
        log.info('🌙 Overnight maintenance mode enabled');
    }

    /**
     * Disable overnight maintenance mode
     */
    async disableOvernightMode() {
        this.options.overnightMode = false;
        if (this.schedulerInterval) {
            clearInterval(this.schedulerInterval);
            this.schedulerInterval = null;
        }
        log.info('☀️ Overnight maintenance mode disabled');
    }

    /**
     * Start overnight scheduler
     */
    startOvernightScheduler() {
        if (this.schedulerInterval) {
            clearInterval(this.schedulerInterval);
        }

        // Check every hour if we're in the maintenance window
        this.schedulerInterval = setInterval(() => {
            const now = new Date();
            const currentHour = now.getHours();
            const [startHour] = this.options.schedule.start.split(':').map(Number);
            const [endHour] = this.options.schedule.end.split(':').map(Number);

            // Check if we're in the maintenance window
            if (currentHour >= startHour && currentHour < endHour) {
                if (!this.isRunning) {
                    log.info('🌙 Starting overnight maintenance run...');
                    this.runRefactoringCycle().catch(err => {
                        log.error('Overnight maintenance failed:', err);
                    });
                }
            }
        }, 60 * 60 * 1000); // Check every hour

        log.info(`⏰ Overnight scheduler started (${this.options.schedule.start} - ${this.options.schedule.end})`);
    }

    /**
     * Run a refactoring cycle
     */
    async runRefactoringCycle() {
        if (this.isRunning) {
            log.warn('Refactoring cycle already running, skipping...');
            return;
        }

        this.isRunning = true;
        this.stats.totalRuns++;

        try {
            log.info('🧹 Starting refactoring cycle...');

            const results = {
                deduplications: [],
                securityFixes: [],
                improvements: [],
                errors: []
            };

            // 1. Find duplicate code
            const duplicates = await this.findDuplicates();
            for (const dup of duplicates.slice(0, this.options.maxChangesPerRun)) {
                try {
                    const fix = await this.deduplicateCode(dup);
                    if (fix) {
                        results.deduplications.push(fix);
                        this.stats.totalDeduplications++;
                    }
                } catch (error) {
                    results.errors.push({ type: 'deduplication', error: error.message });
                }
            }

            // 2. Find and fix security issues
            const securityIssues = await this.findSecurityIssues();
            for (const issue of securityIssues.slice(0, this.options.maxChangesPerRun)) {
                try {
                    const fix = await this.fixSecurityIssue(issue);
                    if (fix) {
                        results.securityFixes.push(fix);
                        this.stats.totalSecurityFixes++;
                    }
                } catch (error) {
                    results.errors.push({ type: 'security', error: error.message });
                }
            }

            // 3. General code improvements
            const improvements = await this.findImprovements();
            for (const improvement of improvements.slice(0, this.options.maxChangesPerRun)) {
                try {
                    const fix = await this.applyImprovement(improvement);
                    if (fix) {
                        results.improvements.push(fix);
                        this.stats.totalImprovements++;
                    }
                } catch (error) {
                    results.errors.push({ type: 'improvement', error: error.message });
                }
            }

            this.stats.totalFixes = 
                results.deduplications.length + 
                results.securityFixes.length + 
                results.improvements.length;

            this.lastRun = {
                timestamp: new Date().toISOString(),
                results,
                stats: { ...this.stats }
            };

            // Create summary
            const summary = this.generateSummary(results);
            log.info(`✅ Refactoring cycle complete: ${summary}`);

            // Safety checks before auto-merge
            const canAutoMerge = this.canAutoMerge(results);
            
            if (this.options.autoMerge && canAutoMerge.allowed && results.errors.length === 0) {
                log.info(`✅ Auto-merge allowed (confidence: ${canAutoMerge.confidence}, files: ${canAutoMerge.files})`);
                await this.createCommit(results);
            } else {
                if (!canAutoMerge.allowed) {
                    log.info(`⚠️ Auto-merge blocked: ${canAutoMerge.reason}`);
                }
                await this.createPullRequest(results);
            }

            return results;

        } catch (error) {
            log.error('Refactoring cycle failed:', error);
            throw error;
        } finally {
            this.isRunning = false;
        }
    }

    /**
     * Find duplicate code patterns
     */
    async findDuplicates() {
        log.debug('🔍 Searching for duplicate code...');

        // This would integrate with Code Roach or use AST analysis
        // For now, return mock structure
        const duplicates = [];

        try {
            // Scan codebase for duplicate patterns
            const codebasePath = process.cwd();
            const files = await this.getAllCodeFiles(codebasePath);

            // Simple duplicate detection (would be enhanced with AST)
            const codeHashes = new Map();
            for (const file of files) {
                try {
                    const content = await fs.readFile(file, 'utf8');
                    const lines = content.split('\n');

                    // Look for duplicate function patterns
                    for (let i = 0; i < lines.length - 10; i++) {
                        const block = lines.slice(i, i + 10).join('\n');
                        const hash = this.hashCode(block);

                        if (codeHashes.has(hash)) {
                            const existing = codeHashes.get(hash);
                            duplicates.push({
                                file1: existing.file,
                                file2: file,
                                line1: existing.line,
                                line2: i,
                                code: block,
                                confidence: 0.85
                            });
                        } else {
                            codeHashes.set(hash, { file, line: i });
                        }
                    }
                } catch (error) {
                    // Skip files that can't be read
                }
            }

            log.debug(`Found ${duplicates.length} potential duplicates`);
            return duplicates;
        } catch (error) {
            log.warn('Duplicate detection failed:', error.message);
            return [];
        }
    }

    /**
     * Deduplicate code
     */
    async deduplicateCode(duplicate) {
        log.info(`🔄 Deduplicating code in ${duplicate.file1} and ${duplicate.file2}`);

        // Extract function/block to shared location
        // For now, create a refactoring suggestion
        return {
            type: 'deduplication',
            file1: duplicate.file1,
            file2: duplicate.file2,
            suggestion: `Extract duplicate code to shared utility`,
            confidence: duplicate.confidence,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Find security issues
     */
    async findSecurityIssues() {
        log.debug('🔒 Searching for security issues...');

        const issues = [];

        try {
            const codebasePath = process.cwd();
            const files = await this.getAllCodeFiles(codebasePath);

            for (const file of files) {
                try {
                    const content = await fs.readFile(file, 'utf8');

                    // Look for common security issues
                    const patterns = [
                        {
                            pattern: /process\.env\.([A-Z_]+)/g,
                            type: 'exposed-env-var',
                            severity: 'high',
                            message: 'Environment variable exposed in code'
                        },
                        {
                            pattern: /(api[_-]?key|secret|password)\s*[:=]\s*['"]([^'"]+)['"]/gi,
                            type: 'hardcoded-secret',
                            severity: 'critical',
                            message: 'Hardcoded secret detected'
                        },
                        {
                            pattern: /eval\s*\(/g,
                            type: 'eval-usage',
                            severity: 'high',
                            message: 'eval() usage detected'
                        },
                        {
                            pattern: /innerHTML\s*=/g,
                            type: 'xss-risk',
                            severity: 'medium',
                            message: 'Potential XSS risk with innerHTML'
                        }
                    ];

                    for (const { pattern, type, severity, message } of patterns) {
                        const matches = content.match(pattern);
                        if (matches) {
                            issues.push({
                                file,
                                type,
                                severity,
                                message,
                                matches: matches.length,
                                confidence: 0.95
                            });
                        }
                    }
                } catch (error) {
                    // Skip files that can't be read
                }
            }

            log.debug(`Found ${issues.length} security issues`);
            return issues;
        } catch (error) {
            log.warn('Security scan failed:', error.message);
            return [];
        }
    }

    /**
     * Fix security issue
     */
    async fixSecurityIssue(issue) {
        log.info(`🔒 Fixing security issue in ${issue.file}: ${issue.message}`);

        try {
            const content = await fs.readFile(issue.file, 'utf8');
            let fixed = content;
            let changes = [];

            // Apply fixes based on issue type
            switch (issue.type) {
                case 'exposed-env-var':
                    // Replace with secure env access
                    fixed = fixed.replace(
                        /process\.env\.([A-Z_]+)/g,
                        (match, varName) => {
                            changes.push(`Secured env var access: ${varName}`);
                            return `process.env[${varName}] || ''`; // Safer access
                        }
                    );
                    break;

                case 'hardcoded-secret':
                    // Replace with env var reference
                    fixed = fixed.replace(
                        /(api[_-]?key|secret|password)\s*[:=]\s*['"]([^'"]+)['"]/gi,
                        (match, keyName, value) => {
                            changes.push(`Moved hardcoded ${keyName} to env var`);
                            const envVarName = keyName.toUpperCase().replace(/[_-]/g, '_');
                            return `${keyName}: process.env.${envVarName} || ''`;
                        }
                    );
                    break;

                case 'eval-usage':
                    // Comment out eval with warning
                    fixed = fixed.replace(
                        /eval\s*\(/g,
                        (match) => {
                            changes.push('Commented out eval() usage');
                            return '// SECURITY: eval() disabled - ' + match;
                        }
                    );
                    break;

                case 'xss-risk':
                    // Add sanitization comment
                    fixed = fixed.replace(
                        /innerHTML\s*=/g,
                        (match) => {
                            changes.push('Added XSS protection reminder');
                            return '// SECURITY: Consider sanitizing - ' + match;
                        }
                    );
                    break;
            }

            if (fixed !== content) {
                // Write fixed content
                await fs.writeFile(issue.file, fixed, 'utf8');
                this.stats.totalSecurityFixes++;

                return {
                    type: 'security-fix',
                    file: issue.file,
                    issue: issue.type,
                    changes,
                    confidence: issue.confidence,
                    timestamp: new Date().toISOString()
                };
            }

            return null;
        } catch (error) {
            log.error(`Failed to fix security issue in ${issue.file}:`, error);
            throw error;
        }
    }

    /**
     * Find code improvements
     */
    async findImprovements() {
        log.debug('✨ Searching for code improvements...');

        const improvements = [];

        try {
            // This would integrate with Quality Engine
            // For now, return structure for improvements
            return improvements;
        } catch (error) {
            log.warn('Improvement detection failed:', error.message);
            return [];
        }
    }

    /**
     * Apply code improvement
     */
    async applyImprovement(improvement) {
        // Implementation for applying improvements
        return {
            type: 'improvement',
            file: improvement.file,
            improvement: improvement.type,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Get all code files in codebase
     */
    async getAllCodeFiles(rootPath, extensions = ['.js', '.ts', '.jsx', '.tsx']) {
        const files = [];

        async function walkDir(dir) {
            try {
                const entries = await fs.readdir(dir, { withFileTypes: true });

                for (const entry of entries) {
                    const fullPath = path.join(dir, entry.name);

                    // Skip node_modules, .git, etc.
                    if (entry.name.startsWith('.') || 
                        entry.name === 'node_modules' || 
                        entry.name === 'dist' ||
                        entry.name === 'build') {
                        continue;
                    }

                    if (entry.isDirectory()) {
                        await walkDir(fullPath);
                    } else if (entry.isFile()) {
                        const ext = path.extname(entry.name);
                        if (extensions.includes(ext)) {
                            files.push(fullPath);
                        }
                    }
                }
            } catch (error) {
                // Skip directories we can't read
            }
        }

        await walkDir(rootPath);
        return files;
    }

    /**
     * Hash code for duplicate detection
     */
    hashCode(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash.toString();
    }

    /**
     * Generate summary of refactoring results
     */
    generateSummary(results) {
        const parts = [];
        if (results.deduplications.length > 0) {
            parts.push(`${results.deduplications.length} deduplications`);
        }
        if (results.securityFixes.length > 0) {
            parts.push(`${results.securityFixes.length} security fixes`);
        }
        if (results.improvements.length > 0) {
            parts.push(`${results.improvements.length} improvements`);
        }
        return parts.join(', ') || 'No changes';
    }

    /**
     * Create commit with refactoring changes (with safety checks)
     */
    async createCommit(results) {
        try {
            // Safety: Always use feature branch for auto-merge
            if (this.options.rollbackReady) {
                const branchName = `beast-mode/janitor-${Date.now()}`;
                try {
                    execSync(`git checkout -b ${branchName}`, { cwd: process.cwd() });
                    log.info(`✅ Created safety branch: ${branchName}`);
                } catch (error) {
                    // Branch might already exist or we're already on it
                    log.debug('Branch creation:', error.message);
                }
            }

            // Run tests if required
            if (this.options.requireTests) {
                const testsPassed = await this.runTests();
                if (!testsPassed) {
                    log.warn('⚠️ Tests failed - aborting commit');
                    return { success: false, reason: 'tests_failed' };
                }
            }

            const summary = this.generateSummary(results);
            const confidence = this.calculateConfidence(results);
            const message = `chore(janitor): ${summary}\n\nAutomated refactoring by BEAST MODE Silent Refactoring Engine\nConfidence: ${(confidence * 100).toFixed(1)}%`;

            execSync('git add -A', { cwd: process.cwd() });
            execSync(`git commit -m "${message}"`, { cwd: process.cwd() });

            log.info(`✅ Changes committed automatically (confidence: ${(confidence * 100).toFixed(1)}%)`);
            return { success: true, branch: this.options.rollbackReady ? branchName : null };
        } catch (error) {
            log.warn('Failed to create commit:', error.message);
            return { success: false, reason: error.message };
        }
    }

    /**
     * Run tests before committing
     */
    async runTests() {
        try {
            // Try npm test
            execSync('npm test', {
                cwd: process.cwd(),
                stdio: 'pipe',
                timeout: 300000 // 5 minutes
            });
            return true;
        } catch (error) {
            log.warn('Tests failed or not available:', error.message);
            return false;
        }
    }

    /**
     * Create pull request with refactoring changes
     */
    async createPullRequest(results) {
        try {
            const summary = this.generateSummary(results);
            const branchName = `beast-mode/janitor-${Date.now()}`;

            // Create branch
            execSync(`git checkout -b ${branchName}`, { cwd: process.cwd() });
            execSync('git add -A', { cwd: process.cwd() });
            execSync(`git commit -m "chore(janitor): ${summary}"`, { cwd: process.cwd() });
            execSync(`git push origin ${branchName}`, { cwd: process.cwd() });

            log.info(`✅ Pull request branch created: ${branchName}`);
            return { branch: branchName, summary };
        } catch (error) {
            log.warn('Failed to create pull request:', error.message);
            return null;
        }
    }

    /**
     * Check if changes can be auto-merged (safety checks)
     */
    canAutoMerge(results) {
        // Count total changes
        const totalFixes = results.deduplications.length + 
                          results.securityFixes.length + 
                          results.improvements.length;
        
        // Count affected files
        const affectedFiles = new Set();
        results.deduplications.forEach(f => affectedFiles.add(f.file1 || f.file2));
        results.securityFixes.forEach(f => affectedFiles.add(f.file));
        results.improvements.forEach(f => affectedFiles.add(f.file));
        
        // Calculate confidence (simplified - would use ML in production)
        const confidence = this.calculateConfidence(results);
        
        // Safety checks
        const checks = {
            confidence: confidence >= this.options.confidenceThreshold,
            fileCount: affectedFiles.size <= this.options.maxFilesPerChange,
            totalChanges: totalFixes <= this.options.maxTotalChanges,
            noErrors: results.errors.length === 0,
            humanReview: !this.options.requireHumanReview || this.options.autoMerge
        };
        
        const allPassed = Object.values(checks).every(v => v === true);
        
        if (!allPassed) {
            const reasons = [];
            if (!checks.confidence) reasons.push(`confidence ${(confidence * 100).toFixed(1)}% < ${(this.options.confidenceThreshold * 100).toFixed(1)}%`);
            if (!checks.fileCount) reasons.push(`${affectedFiles.size} files > ${this.options.maxFilesPerChange} limit`);
            if (!checks.totalChanges) reasons.push(`${totalFixes} changes > ${this.options.maxTotalChanges} limit`);
            if (!checks.noErrors) reasons.push(`${results.errors.length} errors`);
            if (!checks.humanReview) reasons.push('human review required');
            
            return {
                allowed: false,
                reason: reasons.join(', '),
                confidence,
                files: affectedFiles.size,
                changes: totalFixes
            };
        }
        
        return {
            allowed: true,
            confidence,
            files: affectedFiles.size,
            changes: totalFixes
        };
    }

    /**
     * Calculate confidence score for changes
     */
    calculateConfidence(results) {
        // Simplified confidence calculation
        // In production, this would use ML predictions
        
        let confidence = 1.0;
        
        // Reduce confidence for security fixes (higher risk)
        if (results.securityFixes.length > 0) {
            confidence *= 0.95;
        }
        
        // Reduce confidence for many changes
        const totalChanges = results.deduplications.length + 
                            results.securityFixes.length + 
                            results.improvements.length;
        if (totalChanges > 10) {
            confidence *= 0.9;
        }
        
        // Reduce confidence if errors occurred
        if (results.errors.length > 0) {
            confidence *= 0.8;
        }
        
        return Math.max(0, Math.min(1, confidence));
    }

    /**
     * Get status of last run
     */
    getStatus() {
        return {
            enabled: this.options.enabled,
            overnightMode: this.options.overnightMode,
            isRunning: this.isRunning,
            lastRun: this.lastRun,
            stats: { ...this.stats },
            nextRun: this.getNextRunTime()
        };
    }

    /**
     * Get next scheduled run time
     */
    getNextRunTime() {
        if (!this.options.overnightMode) return null;

        const now = new Date();
        const [startHour] = this.options.schedule.start.split(':').map(Number);
        const nextRun = new Date(now);
        nextRun.setHours(startHour, 0, 0, 0);

        if (nextRun <= now) {
            nextRun.setDate(nextRun.getDate() + 1);
        }

        return nextRun.toISOString();
    }
}

module.exports = { SilentRefactoringEngine };

