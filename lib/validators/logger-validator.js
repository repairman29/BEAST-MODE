/**
 * Logger Infrastructure Validator
 * Validates proper logger imports and usage across the codebase
 */

const fs = require('fs').promises;
const path = require('path');
const { glob } = require('glob');
const { createLogger } = require('../utils/logger');

const log = createLogger('LoggerValidator');

class LoggerInfrastructureValidator {
    constructor() {
        this.rootDir = process.cwd();
        this.issues = [];
        this.score = 0;
    }

    async validate() {
        log.info('Running logger infrastructure validation...');

        this.issues = [];
        this.score = 100;

        try {
            // Find all JavaScript/TypeScript files
            const files = await this.findCodeFiles();

            for (const file of files) {
                await this.validateFile(file);
            }

            // Calculate score based on issues
            const issueScore = Math.max(0, 100 - (this.issues.length * 5));
            this.score = Math.min(100, issueScore);

            log.info(`Logger validation complete: ${this.issues.length} issues found, score: ${this.score}`);

            return {
                score: this.score,
                issues: this.issues,
                filesChecked: files.length,
                status: this.issues.length === 0 ? 'passed' : 'issues_found'
            };

        } catch (error) {
            log.error('Logger validation failed:', error.message);
            return {
                score: 0,
                issues: [{
                    type: 'validation_error',
                    severity: 5,
                    file: 'validator',
                    message: `Logger validation failed: ${error.message}`
                }],
                status: 'error'
            };
        }
    }

    async findCodeFiles() {
        try {
            const files = await glob('**/*.{js,ts,jsx,tsx}', {
                cwd: this.rootDir,
                ignore: [
                    'node_modules/**',
                    '.git/**',
                    'dist/**',
                    'build/**',
                    'coverage/**',
                    '.beast-mode/**'
                ]
            });
            return files.map(f => path.join(this.rootDir, f));
        } catch (error) {
            log.warn('Failed to find code files:', error.message);
            return [];
        }
    }

    async validateFile(filePath) {
        try {
            const content = await fs.readFile(filePath, 'utf8');
            const lines = content.split('\n');

            // Check for console.log usage (should use logger)
            // But allow console.log in CLI/bin files and validator files (which may contain validation logic)
            const isCliFile = filePath.includes('/bin/') || filePath.includes('\\bin\\') || path.basename(filePath) === 'beast-mode.js';
            const isValidatorFile = filePath.includes('/validators/') || filePath.includes('\\validators\\');
            const shouldSkipConsoleCheck = isCliFile || isValidatorFile;
            const consoleLogMatches = content.match(/console\.log\(/g);

            if (!shouldSkipConsoleCheck && consoleLogMatches && consoleLogMatches.length > 0) {
                // Find line numbers
                const consoleLines = [];
                lines.forEach((line, index) => {
                    if (line.includes('console.log(')) {
                        consoleLines.push(index + 1);
                    }
                });

                this.issues.push({
                    type: 'console_log_usage',
                    severity: 2,
                    file: path.relative(this.rootDir, filePath),
                    lines: consoleLines,
                    message: `Found ${consoleLogMatches.length} console.log() calls. Use logger instead.`,
                    recommendation: 'Replace console.log() with log.info(), log.warn(), or log.error()'
                });
            }

            // Check for logger import
            const hasLoggerImport = content.includes('createLogger') ||
                                  content.includes('require.*logger');

            if (!hasLoggerImport && !shouldSkipConsoleCheck && consoleLogMatches) {
                this.issues.push({
                    type: 'missing_logger_import',
                    severity: 3,
                    file: path.relative(this.rootDir, filePath),
                    message: 'File uses console.log but does not import logger',
                    recommendation: 'Add: const { createLogger } = require(\'../utils/logger\'); const log = createLogger(\'' + path.basename(filePath, path.extname(filePath)) + '\');'
                });
            }

        } catch (error) {
            log.warn(`Failed to validate file ${filePath}:`, error.message);
        }
    }

    async fix(issues) {
        const fixed = [];

        for (const issue of issues) {
            try {
                if (issue.type === 'missing_logger_import') {
                    await this.addLoggerImport(issue);
                    fixed.push(issue);
                } else if (issue.type === 'console_log_usage') {
                    await this.replaceConsoleLogs(issue);
                    fixed.push(issue);
                }
            } catch (error) {
                log.warn(`Failed to fix issue in ${issue.file}:`, error.message);
            }
        }

        return fixed;
    }

    async addLoggerImport(issue) {
        const filePath = path.join(this.rootDir, issue.file);
        const content = await fs.readFile(filePath, 'utf8');
        const lines = content.split('\n');

        // Find the first require/import statement
        let insertIndex = 0;
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes('require(') || lines[i].includes('import ')) {
                insertIndex = i + 1;
                break;
            }
        }

        // Add logger import
        const loggerName = path.basename(issue.file, path.extname(issue.file));
        const importLine = `const { createLogger } = require('../utils/logger');\nconst log = createLogger('${loggerName}');`;
        lines.splice(insertIndex, 0, importLine);

        await fs.writeFile(filePath, lines.join('\n'));
        log.info(`Added logger import to ${issue.file}`);
    }

    async replaceConsoleLogs(issue) {
        const filePath = path.join(this.rootDir, issue.file);
        let content = await fs.readFile(filePath, 'utf8');

        // Replace console.log with log.info
        content = content.replace(/console\.log\(/g, 'log.info(');

        // Replace console.error with log.error
        content = content.replace(/console\.error\(/g, 'log.error(');

        // Replace console.warn with log.warn
        content = content.replace(/console\.warn\(/g, 'log.warn(');

        await fs.writeFile(filePath, content);
        log.info(`Replaced console methods with logger in ${issue.file}`);
    }
}

async function validate() {
    const validator = new LoggerInfrastructureValidator();
    return await validator.validate();
}

async function fix(issues) {
    const validator = new LoggerInfrastructureValidator();
    return await validator.fix(issues);
}

module.exports = {
    validate,
    fix,
    LoggerInfrastructureValidator
};

