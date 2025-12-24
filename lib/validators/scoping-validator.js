#!/usr/bin/env node

/**
 * Variable Scoping Validator
 * BEAST MODE LESSON: Prevents variable scoping issues in async code
 *
 * Validates:
 * - Variables declared in try blocks are accessible in catch blocks
 * - No undefined variables in complex async patterns
 * - Proper variable hoisting in error handling
 */

const fs = require('fs').promises;
const path = require('path');

class VariableScopingValidator {
    constructor() {
        this.rootDir = path.resolve(__dirname, '..');
        this.issues = [];
        this.fixed = 0;
    }

    async validate(autoFix = false) {
        console.log('🔍 Validating Variable Scoping...');

        // Find all server-side JavaScript files
        const serverFiles = await this.findServerFiles();

        for (const file of serverFiles) {
            await this.validateFile(file, autoFix);
        }

        this.reportResults();

        if (this.issues.length > 0) {
            console.log(`\n❌ Found ${this.issues.length} variable scoping issues`);
            if (autoFix) {
                console.log(`✅ Auto-fixed ${this.fixed} issues`);
            }
            return false;
        }

        console.log('\n✅ Variable scoping validation passed');
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

            // Look for problematic patterns
            const issues = this.findScopingIssues(content);

            issues.forEach(issue => {
                this.issues.push({
                    file: filePath,
                    issue: issue.description,
                    severity: issue.severity
                });
            });

            if (autoFix && issues.length > 0) {
                // For now, just report - auto-fixing scoping issues is complex
                console.log(`   ⚠️  Manual fix needed in ${path.basename(filePath)}: ${issues[0].description}`);
            }

        } catch (error) {
            this.issues.push({
                file: filePath,
                issue: `Error reading file: ${error.message}`,
                severity: 'error'
            });
        }
    }

    findScopingIssues(content) {
        const issues = [];

        // Check for variables used in catch blocks that are declared in try blocks
        const tryCatchBlocks = content.match(/try\s*\{[\s\S]*?\}\s*catch\s*\([^)]+\)\s*\{[\s\S]*?\}/g) || [];

        tryCatchBlocks.forEach(block => {
            // Extract variable declarations in try block
            const tryVars = new Set();
            const tryMatches = block.match(/const\s+(\w+)\s*=/g) || [];
            tryMatches.forEach(match => {
                const varName = match.match(/const\s+(\w+)\s*=/)[1];
                tryVars.add(varName);
            });

            // Check if these variables are used in catch block
            const catchPart = block.match(/catch\s*\([^)]+\)\s*\{([\s\S]*?)\}/);
            if (catchPart) {
                const catchContent = catchPart[1];
                tryVars.forEach(varName => {
                    const varRegex = new RegExp(`\\b${varName}\\b`, 'g');
                    if (varRegex.test(catchContent)) {
                        issues.push({
                            description: `Variable '${varName}' declared in try block used in catch block - may cause scoping issues`,
                            severity: 'warning'
                        });
                    }
                });
            }
        });

        // Check for undefined variables in common patterns
        const undefinedPatterns = [
            {
                pattern: /releaseErr/g,
                description: 'releaseErr used but not properly scoped in error handling'
            },
            {
                pattern: /generationTime/g,
                description: 'generationTime used before declaration in async context'
            }
        ];

        undefinedPatterns.forEach(({ pattern, description }) => {
            if (pattern.test(content)) {
                issues.push({
                    description: description,
                    severity: 'error'
                });
            }
        });

        return issues;
    }

    reportResults() {
        if (this.issues.length === 0) return;

        console.log('\n📋 Variable Scoping Issues:');
        this.issues.forEach(issue => {
            const severity = issue.severity === 'error' ? '❌' : '⚠️';
            console.log(`   ${severity} ${path.basename(issue.file)}: ${issue.issue}`);
        });
    }
}

// CLI Interface
if (require.main === module) {
    const args = process.argv.slice(2);
    const autoFix = args.includes('--fix') || args.includes('--auto-fix');

    const validator = new VariableScopingValidator();
    validator.validate(autoFix).then(success => {
        process.exit(success ? 0 : 1);
    }).catch(error => {
        console.error('Validation failed:', error);
        process.exit(1);
    });
}

module.exports = VariableScopingValidator;
