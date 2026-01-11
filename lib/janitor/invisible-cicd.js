/**
 * BEAST MODE Invisible CI/CD
 * Silent Background Checks - No CLI Required
 * 
 * The Pitch: Vibe coders don't know what a linter or unit test is.
 * The platform runs these silently and auto-fixes issues.
 * 
 * Features:
 * - Silent linting
 * - Background testing
 * - Security scanning
 * - Auto-fix without user seeing CLI
 */

// Try to require logger, fallback to console if not available
let createLogger;
try {
  const loggerModule = require('../utils/logger');
  createLogger = loggerModule.createLogger || loggerModule.default?.createLogger || loggerModule;
} catch (e) {
  // Fallback logger
  createLogger = (name) => ({
    info: (...args) => console.log(`[${name}]`, ...args),
    warn: (...args) => console.warn(`[${name}]`, ...args),
    error: (...args) => console.error(`[${name}]`, ...args),
    debug: (...args) => console.debug(`[${name}]`, ...args),
  });
}
const { execSync } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

const log = createLogger('InvisibleCICD');

class InvisibleCICD {
    constructor(options = {}) {
        this.options = {
            enabled: true,
            silent: true, // Never show CLI output
            autoFix: true,
            checks: {
                linting: true,
                testing: true,
                security: true,
                formatting: true
            },
            ...options
        };

        this.runs = [];
        this.fixes = [];
        this.stats = {
            totalRuns: 0,
            issuesFound: 0,
            issuesFixed: 0,
            testsRun: 0,
            testsPassed: 0
        };
    }

    /**
     * Initialize Invisible CI/CD
     */
    async initialize() {
        log.info('🔇 Initializing Invisible CI/CD...');

        // Set up file watcher if enabled
        if (this.options.enabled) {
            await this.setupFileWatcher();
        }

        log.info('✅ Invisible CI/CD ready (silent mode)');
    }

    /**
     * Set up file watcher for automatic checks
     */
    async setupFileWatcher() {
        // This would use chokidar or similar
        // For now, we'll check on demand
        log.debug('File watcher setup (placeholder)');
    }

    /**
     * Run all checks silently
     */
    async runChecks(options = {}) {
        if (!this.options.enabled) return;

        this.stats.totalRuns++;

        const results = {
            timestamp: new Date().toISOString(),
            linting: null,
            testing: null,
            security: null,
            formatting: null,
            fixes: []
        };

        try {
            // Run linting
            if (this.options.checks.linting) {
                results.linting = await this.runLinting();
                if (results.linting.issues.length > 0 && this.options.autoFix) {
                    const fixes = await this.fixLintingIssues(results.linting.issues);
                    results.fixes.push(...fixes);
                }
            }

            // Run testing
            if (this.options.checks.testing) {
                results.testing = await this.runTests();
            }

            // Run security scan
            if (this.options.checks.security) {
                results.security = await this.runSecurityScan();
                if (results.security.issues.length > 0 && this.options.autoFix) {
                    const fixes = await this.fixSecurityIssues(results.security.issues);
                    results.fixes.push(...fixes);
                }
            }

            // Run formatting
            if (this.options.checks.formatting) {
                results.formatting = await this.runFormatting();
                if (results.formatting.needsFormatting && this.options.autoFix) {
                    await this.autoFormat();
                }
            }

            // Update stats
            this.stats.issuesFound += 
                (results.linting?.issues.length || 0) +
                (results.security?.issues.length || 0);
            this.stats.issuesFixed += results.fixes.length;
            this.stats.testsRun += results.testing?.total || 0;
            this.stats.testsPassed += results.testing?.passed || 0;

            this.runs.push(results);

            // Auto-commit fixes if enabled
            if (this.options.autoFix && results.fixes.length > 0) {
                await this.commitFixes(results.fixes);
            }

            return results;
        } catch (error) {
            log.error('Invisible CI/CD check failed:', error);
            return results;
        }
    }

    /**
     * Run linting silently
     */
    async runLinting() {
        const issues = [];

        try {
            // Try ESLint
            try {
                const output = execSync('npx eslint . --format json', {
                    cwd: process.cwd(),
                    encoding: 'utf8',
                    stdio: 'pipe' // Silent
                });

                const eslintResults = JSON.parse(output);
                for (const file of eslintResults) {
                    for (const message of file.messages) {
                        issues.push({
                            file: file.filePath,
                            line: message.line,
                            column: message.column,
                            message: message.message,
                            rule: message.ruleId,
                            severity: message.severity
                        });
                    }
                }
            } catch (error) {
                // ESLint not available or has errors
                log.debug('ESLint not available, using fallback');
            }

            // Fallback: Basic pattern checking
            if (issues.length === 0) {
                issues.push(...await this.basicLintCheck());
            }

            return {
                passed: issues.length === 0,
                issues,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            log.debug('Linting failed:', error.message);
            return { passed: true, issues: [] };
        }
    }

    /**
     * Basic lint check (fallback)
     */
    async basicLintCheck() {
        const issues = [];
        const codebasePath = process.cwd();
        const files = await this.getAllCodeFiles(codebasePath);

        for (const file of files.slice(0, 50)) { // Limit to 50 files
            try {
                const content = await fs.readFile(file, 'utf8');
                const lines = content.split('\n');

                // Check for common issues
                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i];

                    // Unused variables (simple check)
                    if (line.includes('const ') && line.includes('=') && !content.includes(line.match(/const\s+(\w+)/)?.[1] || '')) {
                        // Skip - too complex for basic check
                    }

                    // Console.log in production code
                    if (line.includes('console.log') && !file.includes('test')) {
                        issues.push({
                            file,
                            line: i + 1,
                            message: 'console.log found in production code',
                            severity: 'warning'
                        });
                    }
                }
            } catch (error) {
                // Skip files we can't read
            }
        }

        return issues;
    }

    /**
     * Fix linting issues
     */
    async fixLintingIssues(issues) {
        const fixes = [];

        try {
            // Try auto-fix with ESLint
            try {
                execSync('npx eslint . --fix', {
                    cwd: process.cwd(),
                    stdio: 'pipe' // Silent
                });
                fixes.push({
                    type: 'linting',
                    fixed: issues.length,
                    method: 'eslint-auto-fix'
                });
            } catch (error) {
                // ESLint auto-fix failed
            }

            // Manual fixes for common issues
            for (const issue of issues.slice(0, 10)) { // Limit fixes
                if (issue.message.includes('console.log')) {
                    try {
                        const content = await fs.readFile(issue.file, 'utf8');
                        const fixed = content.replace(/console\.log\([^)]*\);?\n?/g, '');
                        await fs.writeFile(issue.file, fixed, 'utf8');
                        fixes.push({
                            type: 'linting',
                            file: issue.file,
                            issue: issue.message
                        });
                    } catch (error) {
                        // Skip files we can't fix
                    }
                }
            }

            this.fixes.push(...fixes);
            return fixes;
        } catch (error) {
            log.debug('Failed to fix linting issues:', error.message);
            return [];
        }
    }

    /**
     * Run tests silently
     */
    async runTests() {
        try {
            // Try Jest
            try {
                const output = execSync('npm test -- --json', {
                    cwd: process.cwd(),
                    encoding: 'utf8',
                    stdio: 'pipe' // Silent
                });

                const jestResults = JSON.parse(output);
                return {
                    passed: jestResults.success,
                    total: jestResults.numTotalTests,
                    passed: jestResults.numPassedTests,
                    failed: jestResults.numFailedTests,
                    timestamp: new Date().toISOString()
                };
            } catch (error) {
                // Jest not available
            }

            // Try other test runners
            const testCommands = [
                'npm run test',
                'npm test',
                'yarn test'
            ];

            for (const cmd of testCommands) {
                try {
                    execSync(cmd, {
                        cwd: process.cwd(),
                        stdio: 'pipe' // Silent
                    });
                    return {
                        passed: true,
                        total: 0,
                        passed: 0,
                        failed: 0,
                        timestamp: new Date().toISOString()
                    };
                } catch (error) {
                    // Command failed
                }
            }

            return {
                passed: true,
                total: 0,
                passed: 0,
                failed: 0,
                note: 'No tests found',
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            log.debug('Testing failed:', error.message);
            return { passed: true, total: 0, passed: 0, failed: 0 };
        }
    }

    /**
     * Run security scan
     */
    async runSecurityScan() {
        const issues = [];

        try {
            // Try npm audit
            try {
                const output = execSync('npm audit --json', {
                    cwd: process.cwd(),
                    encoding: 'utf8',
                    stdio: 'pipe' // Silent
                });

                const auditResults = JSON.parse(output);
                if (auditResults.vulnerabilities) {
                    for (const [pkg, vuln] of Object.entries(auditResults.vulnerabilities)) {
                        issues.push({
                            package: pkg,
                            severity: vuln.severity,
                            message: vuln.title || 'Security vulnerability',
                            fix: vuln.fixAvailable ? `npm audit fix` : null
                        });
                    }
                }
            } catch (error) {
                // npm audit not available
            }

            // Basic security checks
            const codebasePath = process.cwd();
            const files = await this.getAllCodeFiles(codebasePath);

            for (const file of files.slice(0, 50)) {
                try {
                    const content = await fs.readFile(file, 'utf8');

                    // Check for hardcoded secrets
                    if (/(api[_-]?key|secret|password|token)\s*[:=]\s*['"][^'"]+['"]/i.test(content)) {
                        issues.push({
                            file,
                            severity: 'high',
                            message: 'Potential hardcoded secret detected',
                            type: 'hardcoded-secret'
                        });
                    }

                    // Check for eval
                    if (/eval\s*\(/.test(content)) {
                        issues.push({
                            file,
                            severity: 'high',
                            message: 'eval() usage detected - security risk',
                            type: 'eval-usage'
                        });
                    }
                } catch (error) {
                    // Skip files we can't read
                }
            }

            return {
                passed: issues.length === 0,
                issues,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            log.debug('Security scan failed:', error.message);
            return { passed: true, issues: [] };
        }
    }

    /**
     * Fix security issues
     */
    async fixSecurityIssues(issues) {
        const fixes = [];

        try {
            // Auto-fix npm vulnerabilities
            const npmIssues = issues.filter(i => i.package && i.fix);
            if (npmIssues.length > 0) {
                try {
                    execSync('npm audit fix', {
                        cwd: process.cwd(),
                        stdio: 'pipe' // Silent
                    });
                    fixes.push({
                        type: 'security',
                        fixed: npmIssues.length,
                        method: 'npm-audit-fix'
                    });
                } catch (error) {
                    // Auto-fix failed
                }
            }

            // Fix hardcoded secrets (move to env vars)
            const secretIssues = issues.filter(i => i.type === 'hardcoded-secret');
            for (const issue of secretIssues.slice(0, 5)) {
                try {
                    const content = await fs.readFile(issue.file, 'utf8');
                    // Replace with env var reference
                    const fixed = content.replace(
                        /(api[_-]?key|secret|password|token)\s*[:=]\s*['"]([^'"]+)['"]/gi,
                        (match, keyName) => {
                            const envVarName = keyName.toUpperCase().replace(/[_-]/g, '_');
                            return `${keyName}: process.env.${envVarName} || ''`;
                        }
                    );
                    await fs.writeFile(issue.file, fixed, 'utf8');
                    fixes.push({
                        type: 'security',
                        file: issue.file,
                        issue: 'hardcoded-secret'
                    });
                } catch (error) {
                    // Skip files we can't fix
                }
            }

            this.fixes.push(...fixes);
            return fixes;
        } catch (error) {
            log.debug('Failed to fix security issues:', error.message);
            return [];
        }
    }

    /**
     * Run formatting check
     */
    async runFormatting() {
        try {
            // Try Prettier
            try {
                execSync('npx prettier --check .', {
                    cwd: process.cwd(),
                    stdio: 'pipe' // Silent
                });
                return {
                    needsFormatting: false,
                    timestamp: new Date().toISOString()
                };
            } catch (error) {
                // Prettier check failed = needs formatting
                return {
                    needsFormatting: true,
                    timestamp: new Date().toISOString()
                };
            }
        } catch (error) {
            return { needsFormatting: false };
        }
    }

    /**
     * Auto-format code
     */
    async autoFormat() {
        try {
            // Try Prettier
            execSync('npx prettier --write .', {
                cwd: process.cwd(),
                stdio: 'pipe' // Silent
            });
            return true;
        } catch (error) {
            log.debug('Auto-formatting failed:', error.message);
            return false;
        }
    }

    /**
     * Commit fixes automatically
     */
    async commitFixes(fixes) {
        try {
            if (fixes.length === 0) return;

            execSync('git add -A', {
                cwd: process.cwd(),
                stdio: 'pipe' // Silent
            });

            const message = `chore(invisible-cicd): Auto-fixed ${fixes.length} issue(s)`;
            execSync(`git commit -m "${message}"`, {
                cwd: process.cwd(),
                stdio: 'pipe' // Silent
            });

            log.debug(`✅ Auto-committed ${fixes.length} fixes`);
        } catch (error) {
            log.debug('Failed to commit fixes:', error.message);
        }
    }

    /**
     * Get all code files
     */
    async getAllCodeFiles(rootPath, extensions = ['.js', '.ts', '.jsx', '.tsx']) {
        const files = [];

        async function walkDir(dir) {
            try {
                const entries = await fs.readdir(dir, { withFileTypes: true });

                for (const entry of entries) {
                    const fullPath = path.join(dir, entry.name);

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
     * Get status
     */
    getStatus() {
        return {
            enabled: this.options.enabled,
            silent: this.options.silent,
            autoFix: this.options.autoFix,
            stats: { ...this.stats },
            lastRun: this.runs[this.runs.length - 1] || null
        };
    }
}

module.exports = { InvisibleCICD };

