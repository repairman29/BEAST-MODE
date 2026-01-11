/**
 * BEAST MODE Vibe Restoration System
 * "Rewind to last working state" + analyze what broke
 * 
 * Features:
 * - Code state tracking
 * - Regression detection
 * - Automatic rollback
 * - Prompt-to-code correlation
 * - Timeline visualization
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

const log = createLogger('VibeRestorer');

class VibeRestorer {
    constructor(options = {}) {
        this.options = {
            enabled: false,
            autoTrack: true,
            qualityThreshold: 70, // Below this = regression
            rollbackEnabled: true,
            maxHistory: 100, // Keep last 100 states
            ...options
        };

        this.stateHistory = [];
        this.regressions = [];
        this.lastGoodState = null;
        this.tracking = false;
    }

    /**
     * Initialize vibe restoration system
     */
    async initialize() {
        log.info('🔄 Initializing Vibe Restoration System...');

        // Load state history
        await this.loadStateHistory();

        if (this.options.autoTrack) {
            await this.enableTracking();
        }

        log.info('✅ Vibe Restoration System ready');
    }

    /**
     * Enable automatic state tracking
     */
    async enableTracking() {
        this.tracking = true;
        this.options.enabled = true;

        // Track on quality check
        // This would integrate with Quality Engine
        log.info('📊 Automatic state tracking enabled');
    }

    /**
     * Track current code state
     */
    async trackState(metadata = {}) {
        if (!this.tracking && !this.options.enabled) {
            return;
        }

        try {
            const state = {
                timestamp: new Date().toISOString(),
                commit: this.getCurrentCommit(),
                branch: this.getCurrentBranch(),
                quality: await this.getCurrentQuality(),
                files: await this.getChangedFiles(),
                metadata
            };

            // Check for regression
            const regression = await this.detectRegression(state);
            if (regression) {
                this.regressions.push(regression);
                log.warn(`⚠️ Regression detected: Quality dropped from ${regression.previousQuality} to ${regression.currentQuality}`);
            }

            // Update last good state if quality is good
            if (state.quality >= this.options.qualityThreshold) {
                this.lastGoodState = state;
            }

            // Add to history
            this.stateHistory.push(state);
            if (this.stateHistory.length > this.options.maxHistory) {
                this.stateHistory.shift(); // Remove oldest
            }

            // Save history
            await this.saveStateHistory();

            return state;
        } catch (error) {
            log.error('Failed to track state:', error);
            return null;
        }
    }

    /**
     * Detect regression
     */
    async detectRegression(currentState) {
        if (this.stateHistory.length === 0) {
            return null;
        }

        const previousState = this.stateHistory[this.stateHistory.length - 1];

        // Check if quality dropped significantly
        const qualityDrop = previousState.quality - currentState.quality;
        if (qualityDrop > 10 && currentState.quality < this.options.qualityThreshold) {
            return {
                timestamp: currentState.timestamp,
                previousState,
                currentState,
                previousQuality: previousState.quality,
                currentQuality: currentState.quality,
                qualityDrop,
                affectedFiles: this.getAffectedFiles(previousState, currentState),
                severity: this.calculateSeverity(qualityDrop)
            };
        }

        return null;
    }

    /**
     * Get affected files between states
     */
    getAffectedFiles(previousState, currentState) {
        const previousFiles = new Set(previousState.files || []);
        const currentFiles = new Set(currentState.files || []);
        
        const changed = [];
        for (const file of currentFiles) {
            if (!previousFiles.has(file)) {
                changed.push(file);
            }
        }

        return changed;
    }

    /**
     * Calculate regression severity
     */
    calculateSeverity(qualityDrop) {
        if (qualityDrop > 30) return 'critical';
        if (qualityDrop > 20) return 'high';
        if (qualityDrop > 10) return 'medium';
        return 'low';
    }

    /**
     * Get current quality score
     */
    async getCurrentQuality() {
        try {
            // Try to get from Quality Engine
            const { QualityEngine } = require('../quality');
            const qualityEngine = new QualityEngine();
            await qualityEngine.initialize();
            const score = await qualityEngine.calculateScore();
            return score.overall || 0;
        } catch (error) {
            // Fallback: try to read from cache
            try {
                const cachePath = path.join(process.cwd(), '.beast-mode', 'data', 'quality-metrics.json');
                const data = JSON.parse(await fs.readFile(cachePath, 'utf8'));
                return data.overallScore || 0;
            } catch (e) {
                return 0;
            }
        }
    }

    /**
     * Get current commit hash
     */
    getCurrentCommit() {
        try {
            return execSync('git rev-parse HEAD', {
                cwd: process.cwd(),
                encoding: 'utf8'
            }).trim();
        } catch (error) {
            return null;
        }
    }

    /**
     * Get current branch
     */
    getCurrentBranch() {
        try {
            return execSync('git rev-parse --abbrev-ref HEAD', {
                cwd: process.cwd(),
                encoding: 'utf8'
            }).trim();
        } catch (error) {
            return null;
        }
    }

    /**
     * Get changed files
     */
    async getChangedFiles() {
        try {
            const output = execSync('git diff --name-only HEAD', {
                cwd: process.cwd(),
                encoding: 'utf8'
            }).trim();

            return output.split('\n').filter(Boolean);
        } catch (error) {
            return [];
        }
    }

    /**
     * Check for regressions
     */
    async check() {
        const currentState = await this.trackState();
        
        if (this.regressions.length > 0) {
            const latest = this.regressions[this.regressions.length - 1];
            return {
                hasRegression: true,
                regression: latest,
                currentState,
                lastGoodState: this.lastGoodState
            };
        }

        return {
            hasRegression: false,
            currentState,
            lastGoodState: this.lastGoodState
        };
    }

    /**
     * Restore to last good state
     */
    async restore(options = {}) {
        const {
            target = 'last-good',
            commit = null,
            createBranch = true
        } = options;

        if (!this.lastGoodState && !commit) {
            throw new Error('No good state found to restore to');
        }

        const targetCommit = commit || 
            (target === 'last-good' ? this.lastGoodState?.commit : null);

        if (!targetCommit) {
            throw new Error('No target commit specified');
        }

        log.info(`🔄 Restoring to commit: ${targetCommit.substring(0, 7)}...`);

        try {
            // Create restore branch
            if (createBranch) {
                const branchName = `beast-mode/restore-${Date.now()}`;
                execSync(`git checkout -b ${branchName}`, { cwd: process.cwd() });
                log.info(`✅ Created restore branch: ${branchName}`);
            }

            // Reset to target commit
            execSync(`git reset --hard ${targetCommit}`, { cwd: process.cwd() });

            // Track the restoration
            await this.trackState({
                action: 'restore',
                targetCommit,
                restoredFrom: this.getCurrentCommit()
            });

            log.info('✅ Restored to last good state');

            return {
                success: true,
                targetCommit,
                branch: createBranch ? execSync('git rev-parse --abbrev-ref HEAD', {
                    cwd: process.cwd(),
                    encoding: 'utf8'
                }).trim() : null
            };
        } catch (error) {
            log.error('Failed to restore:', error);
            throw error;
        }
    }

    /**
     * Analyze regression
     */
    async analyze(regressionIndex = null) {
        const regression = regressionIndex !== null 
            ? this.regressions[regressionIndex]
            : this.regressions[this.regressions.length - 1];

        if (!regression) {
            return { error: 'No regression found' };
        }

        // Analyze what changed
        const analysis = {
            regression,
            affectedFiles: regression.affectedFiles,
            qualityDrop: regression.qualityDrop,
            severity: regression.severity,
            timeline: await this.getTimeline(regression),
            suggestions: this.generateSuggestions(regression)
        };

        // Try to correlate with prompts/commits
        const correlation = await this.correlateWithCommits(regression);
        if (correlation) {
            analysis.correlation = correlation;
        }

        return analysis;
    }

    /**
     * Get timeline around regression
     */
    async getTimeline(regression) {
        const index = this.stateHistory.findIndex(s => s.timestamp === regression.timestamp);
        const start = Math.max(0, index - 5);
        const end = Math.min(this.stateHistory.length, index + 5);

        return this.stateHistory.slice(start, end).map(state => ({
            timestamp: state.timestamp,
            quality: state.quality,
            commit: state.commit?.substring(0, 7),
            filesChanged: state.files?.length || 0
        }));
    }

    /**
     * Generate suggestions for fixing regression
     */
    generateSuggestions(regression) {
        const suggestions = [];

        if (regression.qualityDrop > 20) {
            suggestions.push('Consider rolling back to previous commit');
        }

        if (regression.affectedFiles.length > 0) {
            suggestions.push(`Review changes in: ${regression.affectedFiles.slice(0, 3).join(', ')}`);
        }

        if (regression.severity === 'critical') {
            suggestions.push('Immediate action required - quality drop is critical');
        }

        return suggestions;
    }

    /**
     * Correlate regression with commits/messages
     */
    async correlateWithCommits(regression) {
        try {
            const commit = regression.currentState.commit;
            if (!commit) return null;

            const commitMessage = execSync(`git log -1 --pretty=format:"%s" ${commit}`, {
                cwd: process.cwd(),
                encoding: 'utf8'
            }).trim();

            return {
                commit,
                message: commitMessage,
                timestamp: regression.timestamp,
                correlation: 'high' // Could be enhanced with ML
            };
        } catch (error) {
            return null;
        }
    }

    /**
     * Load state history from disk
     */
    async loadStateHistory() {
        try {
            const historyPath = path.join(process.cwd(), '.beast-mode', 'data', 'vibe-history.json');
            const data = JSON.parse(await fs.readFile(historyPath, 'utf8'));
            this.stateHistory = data.stateHistory || [];
            this.regressions = data.regressions || [];
            this.lastGoodState = data.lastGoodState || null;
        } catch (error) {
            // No history yet
            this.stateHistory = [];
            this.regressions = [];
        }
    }

    /**
     * Save state history to disk
     */
    async saveStateHistory() {
        try {
            const dataDir = path.join(process.cwd(), '.beast-mode', 'data');
            await fs.mkdir(dataDir, { recursive: true });

            const historyPath = path.join(dataDir, 'vibe-history.json');
            await fs.writeFile(historyPath, JSON.stringify({
                stateHistory: this.stateHistory,
                regressions: this.regressions,
                lastGoodState: this.lastGoodState
            }, null, 2), 'utf8');
        } catch (error) {
            log.warn('Failed to save state history:', error.message);
        }
    }

    /**
     * Get status
     */
    getStatus() {
        return {
            enabled: this.options.enabled,
            tracking: this.tracking,
            lastGoodState: this.lastGoodState ? {
                timestamp: this.lastGoodState.timestamp,
                quality: this.lastGoodState.quality,
                commit: this.lastGoodState.commit?.substring(0, 7)
            } : null,
            regressions: this.regressions.length,
            historySize: this.stateHistory.length
        };
    }
}

module.exports = { VibeRestorer };

