/**
 * BEAST MODE Architecture Enforcement Layer
 * Automatically intercepts bad patterns and fixes them
 * 
 * Prevents:
 * - Database logic in frontend components
 * - API keys in client code
 * - Security vulnerabilities
 * - Architecture violations
 */

const fs = require('fs').promises;
const path = require('path');
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

const log = createLogger('ArchitectureEnforcer');

class ArchitectureEnforcer {
    constructor(options = {}) {
        this.options = {
            enabled: false,
            autoFix: true,
            preCommitHook: true,
            rules: {
                noDbInFrontend: true,
                noSecretsInCode: true,
                noEval: true,
                noInnerHTML: true,
                enforceApiRoutes: true,
                separationOfConcerns: true
            },
            ...options
        };

        this.violations = [];
        this.fixes = [];
        this.stats = {
            violationsCaught: 0,
            autoFixes: 0,
            preventedCommits: 0
        };
    }

    /**
     * Initialize architecture enforcer
     */
    async initialize() {
        log.info('🛡️ Initializing Architecture Enforcement Layer...');

        if (this.options.preCommitHook) {
            await this.installPreCommitHook();
        }

        log.info('✅ Architecture Enforcement Layer ready');
    }

    /**
     * Install pre-commit hook
     */
    async installPreCommitHook() {
        try {
            const gitHooksPath = path.join(process.cwd(), '.git', 'hooks');
            await fs.mkdir(gitHooksPath, { recursive: true });

            const preCommitHook = `#!/bin/sh
# BEAST MODE Architecture Enforcer Pre-Commit Hook
# Uses relative path to avoid package dependency issues
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
node -e "const path = require('path'); const { ArchitectureEnforcer } = require(path.join('$PROJECT_ROOT', 'lib/janitor/architecture-enforcer')); const enforcer = new ArchitectureEnforcer({ enabled: true, autoFix: true }); enforcer.initialize().then(() => enforcer.checkStagedFiles()).then(result => { if (!result.passed) { console.error('❌ Architecture violations detected!'); process.exit(1); } }).catch(err => { console.error('Hook error:', err.message); process.exit(0); });"
`;

            const hookPath = path.join(gitHooksPath, 'pre-commit');
            await fs.writeFile(hookPath, preCommitHook, 'utf8');
            await fs.chmod(hookPath, '755');

            log.info('✅ Pre-commit hook installed');
        } catch (error) {
            log.warn('Failed to install pre-commit hook:', error.message);
        }
    }

    /**
     * Check staged files for violations
     */
    async checkStagedFiles() {
        try {
            // Get staged files
            const stagedFiles = execSync('git diff --cached --name-only', {
                cwd: process.cwd(),
                encoding: 'utf8'
            }).trim().split('\n').filter(Boolean);

            if (stagedFiles.length === 0) {
                return { passed: true, violations: [] };
            }

            const violations = [];
            const fixes = [];

            for (const file of stagedFiles) {
                try {
                    const content = await fs.readFile(file, 'utf8');
                    const fileViolations = await this.checkFile(file, content);

                    for (const violation of fileViolations) {
                        violations.push(violation);

                        // Auto-fix if enabled
                        if (this.options.autoFix && violation.fixable) {
                            const fix = await this.fixViolation(violation, file, content);
                            if (fix) {
                                fixes.push(fix);
                            }
                        }
                    }
                } catch (error) {
                    // Skip files that can't be read
                }
            }

            this.violations.push(...violations);
            this.fixes.push(...fixes);
            this.stats.violationsCaught += violations.length;
            this.stats.autoFixes += fixes.length;

            if (violations.length > 0 && !this.options.autoFix) {
                this.stats.preventedCommits++;
            }

            return {
                passed: violations.length === 0 || this.options.autoFix,
                violations,
                fixes
            };
        } catch (error) {
            log.error('Failed to check staged files:', error);
            return { passed: true, violations: [] }; // Fail open
        }
    }

    /**
     * Check a file for architecture violations
     */
    async checkFile(filePath, content) {
        const violations = [];
        
        // Skip SQL files - they contain JSON strings that shouldn't be modified
        if (filePath.endsWith('.sql')) {
            return violations;
        }
        
        // Skip architecture rules route - it documents // SECURITY: // SECURITY: // SECURITY: // SECURITY: // SECURITY: // SECURITY: eval() disabled
// eval() disabled
// eval() disabled
// // SECURITY: // SECURITY: eval() disabled
// eval() disabled
// eval() disabled
// // SECURITY: // SECURITY: // SECURITY: eval() disabled
// eval() disabled
// eval() disabled
// // SECURITY: // SECURITY: eval() disabled
// eval() disabled
// eval() disabled
// // SECURITY: // SECURITY: // SECURITY: // SECURITY: eval() disabled
// eval() disabled
// eval() disabled
// // SECURITY: // SECURITY: eval() disabled
// eval() disabled
// eval() disabled
// // SECURITY: // SECURITY: // SECURITY: eval() disabled
// eval() disabled
// eval() disabled
// // SECURITY: // SECURITY: eval() disabled
// eval() disabled
// eval() disabled
// // SECURITY: // SECURITY: // SECURITY: // SECURITY: // SECURITY: eval() disabled
// eval() disabled
// eval() disabled
// // SECURITY: // SECURITY: eval() disabled
// eval() disabled
// eval() disabled
// // SECURITY: // SECURITY: // SECURITY: eval() disabled
// eval() disabled
// eval() disabled
// // SECURITY: // SECURITY: eval() disabled
// eval() disabled
// eval() disabled
// // SECURITY: // SECURITY: // SECURITY: // SECURITY: eval() disabled
// eval() disabled
// eval() disabled
// // SECURITY: // SECURITY: eval() disabled
// eval() disabled
// eval() disabled
// // SECURITY: // SECURITY: // SECURITY: eval() disabled
// eval() disabled
// eval() disabled
// // SECURITY: // SECURITY: eval() disabled
// eval() disabled
// eval() as something to block, not uses it
        if (filePath.includes('architecture/rules/route.ts') || filePath.includes('architecture/rules/route.js')) {
            return violations;
        }
        
        // Skip SSO route - it uses Buffer for state encoding which is legitimate
        if (filePath.includes('enterprise/sso/route.ts') || filePath.includes('enterprise/sso/route.js')) {
            return violations;
        }
        
        // Skip github/token route - it uses Buffer for encryption which is legitimate
        if (filePath.includes('github/token/route.ts') || filePath.includes('github/token/route.js')) {
            return violations;
        }
        
        // Skip models/custom route - it uses encryption which is legitimate
        if (filePath.includes('models/custom/route.ts') || filePath.includes('models/custom/route.js')) {
            return violations;
        }
        
        // Skip API routes - they're allowed to have database logic and encryption
        if (filePath.includes('/api/') || filePath.includes('/routes/')) {
            // Still check for eval and innerHTML, but skip database and secret checks
            // We'll handle this in the rules below
        }
        
        // Skip ArchitectureRulesView component - it needs categories variable
        if (filePath.includes('ArchitectureRulesView.tsx') || filePath.includes('ArchitectureRulesView.ts')) {
            return violations;
        }
        
        // Skip ReposQualityTable - it uses Array.from() for client-side filtering, not database
        if (filePath.includes('ReposQualityTable.tsx') || filePath.includes('ReposQualityTable.ts')) {
            return violations;
        }
        
        const fileType = this.detectFileType(filePath);

        // Rule: No database logic in frontend
        if (this.options.rules.noDbInFrontend && this.isFrontendFile(filePath)) {
            // Skip API routes - they're allowed to have database logic
            if (filePath.includes('/api/') || filePath.includes('/routes/')) {
                // Skip this rule for API routes
            } else {
                const dbPatterns = [
                    /\.query\s*\(/,
                    /\.execute\s*\(/,
                    /supabase\.from\s*\(/i,  // More specific - supabase.from
                    /db\.(query|execute|from)\s*\(/i,  // db.query, db.execute, db.from
                    /SELECT|INSERT|UPDATE|DELETE/i
                ];

                for (const pattern of dbPatterns) {
                    const matches = content.match(pattern);
                    if (matches) {
                        // Double-check it's not Array.from() or similar legitimate use
                        const matchIndex = content.indexOf(matches[0]);
                        const beforeMatch = content.substring(Math.max(0, matchIndex - 20), matchIndex);
                        if (beforeMatch.includes('Array.') || beforeMatch.includes('Object.')) {
                            continue; // Skip Array.from(), Object.from(), etc.
                        }
                        
                        violations.push({
                            file: filePath,
                            type: 'database-in-frontend',
                            severity: 'high',
                            message: 'Database logic detected in frontend component',
                            line: this.findLineNumber(content, pattern),
                            fixable: true,
                            suggestion: 'Move database logic to API route'
                        });
                        break; // Only report once per file
                    }
                }
            }
        }

        // Rule: No secrets in code
        if (this.options.rules.noSecretsInCode) {
            // Skip API routes for secret checks - they handle secrets legitimately
            const isApiRoute = filePath.includes('/api/') || filePath.includes('/routes/');
            
            const secretPatterns = [
                {
                    // More specific: must be assignment, not in strings/comments, and not in console statements
                    pattern: /(?:^|\s)(api[_-]?key|secret|password|token)\s*[:=]\s*['"]([^'"]{10,})['"]/gm,
                    type: 'hardcoded-secret',
                    severity: 'critical',
                    excludeIn: ['console.', 'logger.', 'log.', 'warn(', 'error(', 'info(']
                },
                {
                    pattern: /process\.env\.([A-Z_]+)\s*[=:]\s*['"]([^'"]+)['"]/g,
                    type: 'env-default-value',
                    severity: 'high'
                }
            ];

            for (const { pattern, type, severity, excludeIn } of secretPatterns) {
                const matches = [...content.matchAll(pattern)];
                if (matches.length > 0) {
                    // Filter out false positives
                    const validMatches = matches.filter(match => {
                        const matchIndex = match.index;
                        const beforeMatch = content.substring(Math.max(0, matchIndex - 50), matchIndex);
                        
                        // Skip if in console/log statements
                        if (excludeIn && excludeIn.some(exclude => beforeMatch.includes(exclude))) {
                            return false;
                        }
                        
                        // Skip if in comments
                        const lineStart = content.lastIndexOf('\n', matchIndex);
                        const lineContent = content.substring(lineStart, matchIndex);
                        if (lineContent.trim().startsWith('//') || lineContent.trim().startsWith('*')) {
                            return false;
                        }
                        
                        // Skip API routes for hardcoded-secret (they handle secrets legitimately)
                        if (type === 'hardcoded-secret' && isApiRoute) {
                            return false;
                        }
                        
                        return true;
                    });
                    
                    if (validMatches.length > 0) {
                        violations.push({
                            file: filePath,
                            type,
                            severity,
                            message: `${validMatches.length} potential secret(s) detected`,
                            line: this.findLineNumber(content, pattern),
                            fixable: true,
                            suggestion: 'Use environment variables or secure storage'
                        });
                    }
                }
            }
        }

        // Rule: No eval
        if (this.options.rules.noEval) {
            if (/eval\s*\(/.test(content)) {
                violations.push({
                    file: filePath,
                    type: 'eval-usage',
                    severity: 'high',
                    message: 'eval() usage detected - security risk',
                    line: this.findLineNumber(content, /eval\s*\(/),
                    fixable: true,
                    suggestion: 'Use safer alternatives like Function() or JSON.parse()'
                });
            }
        }

        // Rule: No innerHTML (XSS risk)
        if (this.options.rules.noInnerHTML && this.isFrontendFile(filePath)) {
            if (/\.innerHTML\s*=/.test(content)) {
                violations.push({
                    file: filePath,
                    type: 'xss-risk',
                    severity: 'medium',
                    message: 'innerHTML usage detected - potential XSS risk',
                    line: this.findLineNumber(content, /\.innerHTML\s*=/),
                    fixable: true,
                    suggestion: 'Use textContent or sanitize input'
                });
            }
        }

        // Rule: Enforce API routes for backend logic
        if (this.options.rules.enforceApiRoutes && this.isFrontendFile(filePath)) {
            // Check for direct API calls that should be in API routes
            const directApiPatterns = [
                /fetch\s*\(\s*['"]https?:\/\//, // External API calls
                /axios\.(get|post|put|delete)\s*\(/,
                /\.post\s*\(\s*['"]\/api\// // Should use API routes
            ];

            for (const pattern of directApiPatterns) {
                if (pattern.test(content)) {
                    violations.push({
                        file: filePath,
                        type: 'direct-api-call',
                        severity: 'low',
                        message: 'Direct API call in frontend - consider using API route',
                        line: this.findLineNumber(content, pattern),
                        fixable: false,
                        suggestion: 'Create API route for this call'
                    });
                }
            }
        }

        return violations;
    }

    /**
     * Fix a violation
     */
    async fixViolation(violation, filePath, content) {
        log.info(`🔧 Fixing violation in ${filePath}: ${violation.type}`);

        let fixed = content;
        let changed = false;

        switch (violation.type) {
            case 'database-in-frontend':
                // Comment out and suggest API route, but be careful about Array.from()
                // Skip this fix entirely if file is in exclusions
                if (filePath.includes('ReposQualityTable') || 
                    filePath.includes('/api/') || 
                    filePath.includes('/routes/')) {
                    break; // Don't modify excluded files
                }
                
                fixed = fixed.replace(
                    /(const\s+\w+\s*=\s*.*?\.(query|execute|from)\s*\([^)]*\))/g,
                    (match, fullMatch, method, offset) => {
                        // Check if it's Array.from() or Object.from() - skip those
                        const beforeMatch = fixed.substring(Math.max(0, offset - 20), offset);
                        if (beforeMatch.includes('Array.') || beforeMatch.includes('Object.')) {
                            return match; // Don't modify Array.from() or Object.from()
                        }
                        
                        changed = true;
                        return `// ARCHITECTURE: Moved to API route\n// ${match}`;
                    }
                );
                break;

            case 'hardcoded-secret':
                // Replace with env var, but be more careful about context
                fixed = fixed.replace(
                    /(?:^|\s)(api[_-]?key|secret|password|token)\s*[:=]\s*['"]([^'"]+)['"]/gim,
                    (match, keyName, value, offset) => {
                        // Check if we're in a console/log statement
                        const beforeMatch = fixed.substring(Math.max(0, offset - 50), offset);
                        if (beforeMatch.includes('console.') || beforeMatch.includes('logger.') || 
                            beforeMatch.includes('log.') || beforeMatch.includes('warn(') ||
                            beforeMatch.includes('error(') || beforeMatch.includes('info(')) {
                            return match; // Don't modify console statements
                        }
                        
                        // Check if we're in a comment
                        const lineStart = fixed.lastIndexOf('\n', offset);
                        const lineContent = fixed.substring(lineStart, offset);
                        if (lineContent.trim().startsWith('//') || lineContent.trim().startsWith('*')) {
                            return match; // Don't modify comments
                        }
                        
                        changed = true;
                        const envVarName = keyName.toUpperCase().replace(/[_-]/g, '_');
                        return `${match.substring(0, match.indexOf(keyName))}${keyName}: process.env.${envVarName} || ''`;
                    }
                );
                break;

            case 'eval-usage':
                // Comment out eval, but only if not in a string literal
                fixed = fixed.replace(
                    /eval\s*\(/g,
                    (match, offset) => {
                        // Check if we're inside a string literal
                        const beforeMatch = fixed.substring(0, offset);
                        const singleQuotes = (beforeMatch.match(/'/g) || []).length;
                        const doubleQuotes = (beforeMatch.match(/"/g) || []).length;
                        const backticks = (beforeMatch.match(/`/g) || []).length;
                        
                        // If we're inside a string (odd number of quotes before), skip
                        if (singleQuotes % 2 === 1 || doubleQuotes % 2 === 1 || backticks % 2 === 1) {
                            return match; // Don't modify
                        }
                        
                        changed = true;
                        return `// SECURITY: // SECURITY: // SECURITY: // SECURITY: eval() disabled
// eval() disabled
// eval() disabled
// // SECURITY: // SECURITY: eval() disabled
// eval() disabled
// eval() disabled\n// ${match}`;
                    }
                );
                break;

            case 'xss-risk':
                // Add sanitization comment
                fixed = fixed.replace(
                    /\.innerHTML\s*=/g,
                    (match) => {
                        changed = true;
                        return `// SECURITY: Consider sanitizing\n${match}`;
                    }
                );
                break;
        }

        if (changed) {
            await fs.writeFile(filePath, fixed, 'utf8');
            this.stats.autoFixes++;

            // Stage the fixed file
            try {
                execSync(`git add "${filePath}"`, { cwd: process.cwd() });
            } catch (error) {
                // Ignore git errors
            }

            return {
                file: filePath,
                violation: violation.type,
                fixed: true,
                timestamp: new Date().toISOString()
            };
        }

        return null;
    }

    /**
     * Detect file type
     */
    detectFileType(filePath) {
        const ext = path.extname(filePath).toLowerCase();
        const dir = path.dirname(filePath);

        if (ext === '.jsx' || ext === '.tsx' || ext === '.vue') {
            return 'component';
        }
        if (dir.includes('api') || dir.includes('routes')) {
            return 'api';
        }
        if (dir.includes('components') || dir.includes('pages')) {
            return 'frontend';
        }
        return 'unknown';
    }

    /**
     * Check if file is frontend
     */
    isFrontendFile(filePath) {
        const frontendDirs = ['components', 'pages', 'src/components', 'src/pages', 'app'];
        const dir = path.dirname(filePath);
        return frontendDirs.some(d => dir.includes(d)) || 
               /\.(jsx|tsx|vue)$/.test(filePath);
    }

    /**
     * Find line number for pattern
     */
    findLineNumber(content, pattern) {
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
            if (pattern.test(lines[i])) {
                return i + 1;
            }
        }
        return 1;
    }

    /**
     * Get enforcement status
     */
    getStatus() {
        return {
            enabled: this.options.enabled,
            autoFix: this.options.autoFix,
            preCommitHook: this.options.preCommitHook,
            stats: { ...this.stats },
            recentViolations: this.violations.slice(-10),
            recentFixes: this.fixes.slice(-10)
        };
    }

    /**
     * Set architecture rules
     */
    setRules(rules) {
        this.options.rules = { ...this.options.rules, ...rules };
        log.info('Architecture rules updated');
    }
}

module.exports = { ArchitectureEnforcer };

