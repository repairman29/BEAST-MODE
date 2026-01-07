/**
 * BEAST MODE Janitor Utilities
 * Shared utilities for janitor systems
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

/**
 * Get all code files in directory
 */
async function getAllCodeFiles(rootPath, extensions = ['.js', '.ts', '.jsx', '.tsx']) {
    const files = [];

    async function walkDir(dir) {
        try {
            const entries = await fs.readdir(dir, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);

                if (entry.name.startsWith('.') || 
                    entry.name === 'node_modules' || 
                    entry.name === 'dist' ||
                    entry.name === 'build' ||
                    entry.name === '.next' ||
                    entry.name === '.git') {
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
 * Hash code for comparison
 */
function hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash.toString();
}

/**
 * Get current git commit
 */
function getCurrentCommit() {
    try {
        return execSync('git rev-parse HEAD', {
            encoding: 'utf8',
            cwd: process.cwd()
        }).trim();
    } catch (error) {
        return null;
    }
}

/**
 * Get current git branch
 */
function getCurrentBranch() {
    try {
        return execSync('git rev-parse --abbrev-ref HEAD', {
            encoding: 'utf8',
            cwd: process.cwd()
        }).trim();
    } catch (error) {
        return null;
    }
}

/**
 * Get changed files
 */
function getChangedFiles() {
    try {
        const output = execSync('git diff --name-only HEAD', {
            encoding: 'utf8',
            cwd: process.cwd()
        }).trim();
        return output.split('\n').filter(Boolean);
    } catch (error) {
        return [];
    }
}

/**
 * Detect file type
 */
function detectFileType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const dir = path.dirname(filePath).toLowerCase();
    const name = path.basename(filePath).toLowerCase();

    if (name.includes('test') || name.includes('spec')) return 'test';
    if (name.includes('config')) return 'config';
    if (ext === '.jsx' || ext === '.tsx') return 'component';
    if (ext === '.js' || ext === '.ts') {
        if (dir.includes('api') || dir.includes('routes')) return 'api';
        if (dir.includes('utils') || dir.includes('helpers')) return 'utility';
        return 'module';
    }
    if (ext === '.css' || ext === '.scss') return 'style';
    if (ext === '.json') return 'config';
    return 'other';
}

/**
 * Check if file is frontend
 */
function isFrontendFile(filePath) {
    const dir = path.dirname(filePath).toLowerCase();
    const frontendDirs = ['components', 'pages', 'src/components', 'src/pages', 'app'];
    return frontendDirs.some(d => dir.includes(d)) || 
           /\.(jsx|tsx|vue)$/.test(filePath);
}

/**
 * Check if content contains secrets
 */
function containsSecrets(content) {
    const secretPatterns = [
        /api[_-]?key\s*[:=]\s*['"][^'"]{10,}['"]/i,
        /secret\s*[:=]\s*['"][^'"]{10,}['"]/i,
        /password\s*[:=]\s*['"][^'"]{10,}['"]/i,
        /token\s*[:=]\s*['"][^'"]{10,}['"]/i
    ];

    return secretPatterns.some(pattern => pattern.test(content));
}

/**
 * Format duration
 */
function formatDuration(ms) {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
}

/**
 * Format file size
 */
function formatFileSize(bytes) {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

module.exports = {
    getAllCodeFiles,
    hashCode,
    getCurrentCommit,
    getCurrentBranch,
    getChangedFiles,
    detectFileType,
    isFrontendFile,
    containsSecrets,
    formatDuration,
    formatFileSize
};

