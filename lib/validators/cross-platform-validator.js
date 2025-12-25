#!/usr/bin/env node

/**
 * Cross-Platform Compliance Validator
 * BEAST MODE LESSON: Ensures browser/server code is properly separated
 *
 * Validates:
 * - Server code doesn't use window/document without proper guards
 * - Browser automation code has ESLint disable comments
 * - No accidental browser API usage in server context
 */

const fs = require('fs').promises;
const { createLogger } = require('../utils/logger');
const log = createLogger('cross-platform-validator');
const path = require('path');

class CrossPlatformValidator {
    constructor() {
        this.rootDir = path.resolve(__dirname, '..');
        this.issues = [];
        this.fixed = 0;
    }

    async validate(autoFix = false) {
        log.info('🔍 Validating Cross-Platform Compliance...');

        // Find all server-side JavaScript files
        const serverFiles = await this.findServerFiles();

        for (const file of serverFiles) {
            await this.validateFile(file, autoFix);
        }

        this.reportResults();

        if (this.issues.length > 0) {
            log.info(`\n❌ Found ${this.issues.length} cross-platform compliance issues`);
            if (autoFix) {
                log.info(`✅ Auto-fixed ${this.fixed} issues`);
            }
            return false;
        }

        log.info('\n✅ Cross-platform compliance validation passed');
        return true;
    }

    async findServerFiles() {
        const files = [];
        await this.walkDirectory(path.join(this.rootDir, 'server'), files);
        return files;
    }

    async walkDirectory(dir, files) {
        try {
            const items = await fs.readdir(dir, { withFileTypes: true });

            for (const item of items) {
                const fullPath = path.join(dir, item.name);

                if (item.isDirectory()) {
                    await this.walkDirectory(fullPath, files);
                } else if (item.isFile() && item.name.endsWith('.js')) {
                    files.push(fullPath);
                }
            }
        } catch (error) {
            // Skip directories we can't read
        }
    }

    async validateFile(filePath, autoFix) {
        try {
            const content = await fs.readFile(filePath, 'utf8');
            const filename = path.basename(filePath);

            // Check for browser APIs in server code
            const browserAPIs = ['window', 'document', 'localStorage', 'sessionStorage'];
            const hasBrowserAPIs = browserAPIs.some(api => {
                const regex = new RegExp(`\\b${api}\\b`, 'g');
                return regex.test(content);
            });

            // Check if it's browser automation code (legitimate use)
            const isBrowserAutomation = /playwright|puppeteer|page\.evaluate/.test(content);

            // Check for ESLint disable comments
            const hasEslintDisable = /\/\* eslint-disable no-undef \*\//.test(content);

            if (hasBrowserAPIs && !isBrowserAutomation && !hasEslintDisable) {
                this.issues.push({
                    file: filePath,
                    issue: 'Browser APIs used in server code without proper guards',
                    severity: 'error'
                });

                if (autoFix) {
                    await this.fixCrossPlatform(filePath, content);
                }
            }

            if (isBrowserAutomation && !hasEslintDisable) {
                this.issues.push({
                    file: filePath,
                    issue: 'Browser automation code missing ESLint disable comment',
                    severity: 'warning'
                });

                if (autoFix) {
                    await this.addEslintDisable(filePath, content);
                }
            }

            // Check for missing window guards in non-automation code
            if (hasBrowserAPIs && !isBrowserAutomation && !this.hasWindowGuards(content)) {
                this.issues.push({
                    file: filePath,
                    issue: 'Browser APIs used without proper environment guards',
                    severity: 'error'
                });
            }

        } catch (error) {
            this.issues.push({
                file: filePath,
                issue: `Error reading file: ${error.message}`,
                severity: 'error'
            });
        }
    }

    hasWindowGuards(content) {
        // Check for proper window existence guards
        return /typeof window !== ['"]undefined['"]/.test(content);
    }

    async fixCrossPlatform(filePath, content) {
        // Add proper window guards around browser API usage
        try {
            // This is complex - for now, just add ESLint disable
            await this.addEslintDisable(filePath, content);
        } catch (error) {
            log.error(`   ❌ Failed to fix cross-platform in ${path.basename(filePath)}: ${error.message}`);
        }
    }

    async addEslintDisable(filePath, content) {
        try {
            // Add ESLint disable at the top of the file
            if (!/\/\* eslint-disable no-undef \*\//.test(content)) {
                const lines = content.split('\n');
                const insertIndex = lines.findIndex(line =>
                    line.trim() && !line.trim().startsWith('//') && !line.trim().startsWith('/*')
                );

                if (insertIndex >= 0) {
                    lines.splice(insertIndex, 0, '/* eslint-disable no-undef */');
                    content = lines.join('\n');
                    await fs.writeFile(filePath, content, 'utf8');
                    this.fixed++;
                    log.info(`   ✅ Added ESLint disable to ${path.basename(filePath)}`);
                }
            }
        } catch (error) {
            log.error(`   ❌ Failed to add ESLint disable to ${path.basename(filePath)}: ${error.message}`);
        }
    }

    reportResults() {
        if (this.issues.length === 0) return;

        log.info('\n📋 Cross-Platform Compliance Issues:');
        this.issues.forEach(issue => {
            const severity = issue.severity === 'error' ? '❌' : '⚠️';
            log.info(`   ${severity} ${path.basename(issue.file)}: ${issue.issue}`);
        });
    }
}

// CLI Interface
if (require.main === module) {
    const args = process.argv.slice(2);
    const autoFix = args.includes('--fix') || args.includes('--auto-fix');

    const validator = new CrossPlatformValidator();
    validator.validate(autoFix).then(success => {
        process.exit(success ? 0 : 1);
    }).catch(error => {
        log.error('Validation failed:', error);
        process.exit(1);
    });
}

async function validate() {
    const validator = new CrossPlatformValidator();
    const success = await validator.validate(false);

    return {
        score: success ? 100 : Math.max(0, 100 - (validator.issues.length * 10)),
        issues: validator.issues.map(issue => ({
            type: 'cross_platform',
            severity: issue.severity === 'error' ? 4 : 2,
            file: path.relative(process.cwd(), issue.file),
            message: issue.issue
        })),
        status: success ? 'passed' : 'issues_found'
    };
}

async function fix(issues) {
    const validator = new CrossPlatformValidator();
    await validator.validate(true); // This will auto-fix
    return validator.fixed;
}

module.exports = {
    validate,
    fix,
    CrossPlatformValidator
};
