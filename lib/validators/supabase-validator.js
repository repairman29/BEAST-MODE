#!/usr/bin/env node

/**
 * Supabase Safety Validator
 * BEAST MODE LESSON: Ensures safe Supabase client usage patterns
 *
 * Validates:
 * - No direct supabase variable usage without proper initialization
 * - Use of getSupabaseService() utility
 * - Proper error handling for Supabase operations
 */

const fs = require('fs').promises;
const path = require('path');

class SupabaseSafetyValidator {
    constructor() {
        this.rootDir = path.resolve(__dirname, '..');
        this.issues = [];
        this.fixed = 0;
    }

    async validate(autoFix = false) {
        console.log('🔍 Validating Supabase Safety...');

        // Find all server-side JavaScript files
        const serverFiles = await this.findServerFiles();

        for (const file of serverFiles) {
            await this.validateFile(file, autoFix);
        }

        this.reportResults();

        if (this.issues.length > 0) {
            console.log(`\n❌ Found ${this.issues.length} Supabase safety issues`);
            if (autoFix) {
                console.log(`✅ Auto-fixed ${this.fixed} issues`);
            }
            return false;
        }

        console.log('\n✅ Supabase safety validation passed');
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

            // Check for unsafe supabase usage
            const unsafePatterns = [
                // Direct supabase usage without initialization
                /supabase\./,

                // Missing getSupabaseService import when using supabase
                /supabase\./
            ];

            const hasUnsafeSupabase = /supabase\./.test(content);
            const hasSafeImport = /getSupabaseService/.test(content);
            const hasSupabaseImport = /@supabase\/supabase-js/.test(content);

            if (hasUnsafeSupabase && !hasSafeImport && !hasSupabaseImport) {
                this.issues.push({
                    file: filePath,
                    issue: 'Unsafe supabase usage - missing proper client initialization',
                    severity: 'error'
                });

                if (autoFix) {
                    await this.fixSupabaseSafety(filePath, content);
                }
            }

            // Check for proper error handling patterns
            if (hasUnsafeSupabase && !this.hasProperErrorHandling(content)) {
                this.issues.push({
                    file: filePath,
                    issue: 'Supabase operations missing proper error handling',
                    severity: 'warning'
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

    hasProperErrorHandling(content) {
        // Check if supabase operations are wrapped in try-catch
        const supabaseOps = content.match(/supabase\.\w+\(/g) || [];
        const tryCatchBlocks = (content.match(/try\s*\{[\s\S]*?supabase\./g) || []).length;

        return tryCatchBlocks >= supabaseOps.length * 0.8; // 80% coverage
    }

    async fixSupabaseSafety(filePath, content) {
        try {
            // Add proper Supabase import
            if (!/getSupabaseService/.test(content)) {
                const supabaseImport = `\nconst { getSupabaseService } = require('../utils/supabaseClient');`;

                // Find a good place to insert the import
                const lastRequireMatch = content.match(/const\s+\w+\s*=\s*require\([^)]+\);/g);
                if (lastRequireMatch) {
                    const lastRequire = lastRequireMatch[lastRequireMatch.length - 1];
                    content = content.replace(lastRequire, lastRequire + supabaseImport);
                }
            }

            await fs.writeFile(filePath, content, 'utf8');
            this.fixed++;
            console.log(`   ✅ Fixed Supabase safety in ${path.basename(filePath)}`);
        } catch (error) {
            console.error(`   ❌ Failed to fix ${path.basename(filePath)}: ${error.message}`);
        }
    }

    reportResults() {
        if (this.issues.length === 0) return;

        console.log('\n📋 Supabase Safety Issues:');
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

    const validator = new SupabaseSafetyValidator();
    validator.validate(autoFix).then(success => {
        process.exit(success ? 0 : 1);
    }).catch(error => {
        console.error('Validation failed:', error);
        process.exit(1);
    });
}

module.exports = SupabaseSafetyValidator;
