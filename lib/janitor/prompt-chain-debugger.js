/**
 * BEAST MODE Prompt Chain Debugger
 * Debug by Prompt History, Not Code
 * 
 * The Future: English is Source Code, Code is Assembly Language
 * 
 * Features:
 * - Track prompt history as source of truth
 * - Debug by prompt chain, not code
 * - Re-compile from English instructions
 * - Prompt-to-code correlation
 */

const { createLogger } = require('../utils/logger');
const fs = require('fs').promises;
const path = require('path');

const log = createLogger('PromptChainDebugger');

class PromptChainDebugger {
    constructor(options = {}) {
        this.options = {
            enabled: false,
            trackPrompts: true,
            storeHistory: true,
            historyFile: '.beast-mode/prompt-history.json',
            ...options
        };

        this.promptHistory = [];
        this.codeSnapshots = new Map(); // promptId -> code state
        this.correlations = []; // prompt -> code changes
    }

    /**
     * Initialize Prompt Chain Debugger
     */
    async initialize() {
        log.info('🔗 Initializing Prompt Chain Debugger...');

        // Load history if available
        if (this.options.storeHistory) {
            await this.loadHistory();
        }

        log.info('✅ Prompt Chain Debugger ready');
    }

    /**
     * Track a prompt
     */
    async trackPrompt(prompt, context = {}) {
        if (!this.options.trackPrompts) return;

        const promptEntry = {
            id: `prompt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            prompt,
            context,
            timestamp: new Date().toISOString(),
            codeState: await this.captureCodeState(),
            metadata: {
                files: context.files || [],
                user: context.user || 'unknown',
                tool: context.tool || 'unknown' // cursor, windsurf, etc.
            }
        };

        this.promptHistory.push(promptEntry);

        // Save history
        if (this.options.storeHistory) {
            await this.saveHistory();
        }

        log.debug(`📝 Prompt tracked: ${prompt.substring(0, 50)}...`);

        return promptEntry;
    }

    /**
     * Track code change after prompt
     */
    async trackCodeChange(promptId, changes) {
        const prompt = this.promptHistory.find(p => p.id === promptId);
        if (!prompt) {
            log.warn(`Prompt not found: ${promptId}`);
            return;
        }

        // Capture code state after change
        const afterState = await this.captureCodeState();

        const correlation = {
            promptId,
            prompt: prompt.prompt,
            beforeState: prompt.codeState,
            afterState,
            changes,
            timestamp: new Date().toISOString()
        };

        this.correlations.push(correlation);
        prompt.codeState = afterState;

        // Save history
        if (this.options.storeHistory) {
            await this.saveHistory();
        }

        log.debug(`🔗 Code change correlated with prompt: ${promptId}`);

        return correlation;
    }

    /**
     * Capture current code state
     */
    async captureCodeState() {
        const state = {
            timestamp: new Date().toISOString(),
            files: {},
            quality: null,
            structure: {}
        };

        try {
            // Get quality score if available
            try {
                const { QualityEngine } = require('../quality');
                const qualityEngine = new QualityEngine();
                await qualityEngine.initialize();
                const score = await qualityEngine.calculateScore();
                state.quality = score.overall;
            } catch (error) {
                // Quality engine not available
            }

            // Capture file structure
            const codebasePath = process.cwd();
            const files = await this.getChangedFiles();
            
            for (const file of files.slice(0, 20)) { // Limit to 20 files
                try {
                    const content = await fs.readFile(file, 'utf8');
                    state.files[file] = {
                        size: content.length,
                        lines: content.split('\n').length,
                        hash: this.hashCode(content)
                    };
                } catch (error) {
                    // Skip files we can't read
                }
            }

            return state;
        } catch (error) {
            log.debug('Failed to capture code state:', error.message);
            return state;
        }
    }

    /**
     * Get changed files
     */
    async getChangedFiles() {
        try {
            const { execSync } = require('child_process');
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
     * Debug by prompt chain
     */
    async debugByPrompt(issueDescription) {
        log.info(`🔍 Debugging by prompt chain: "${issueDescription}"`);

        // Find relevant prompts
        const relevantPrompts = this.findRelevantPrompts(issueDescription);

        // Analyze prompt chain
        const analysis = {
            issue: issueDescription,
            relevantPrompts,
            chain: this.buildPromptChain(relevantPrompts),
            correlations: this.findCorrelations(relevantPrompts),
            suggestions: this.generateSuggestions(relevantPrompts, issueDescription)
        };

        return analysis;
    }

    /**
     * Find relevant prompts for an issue
     */
    findRelevantPrompts(issueDescription) {
        // Simple keyword matching (would be enhanced with ML)
        const keywords = issueDescription.toLowerCase().split(/\s+/);
        
        return this.promptHistory.filter(prompt => {
            const promptText = prompt.prompt.toLowerCase();
            return keywords.some(keyword => promptText.includes(keyword));
        }).slice(-10); // Last 10 relevant prompts
    }

    /**
     * Build prompt chain
     */
    buildPromptChain(prompts) {
        return prompts.map(p => ({
            id: p.id,
            prompt: p.prompt,
            timestamp: p.timestamp,
            quality: p.codeState?.quality,
            files: p.metadata.files
        }));
    }

    /**
     * Find correlations
     */
    findCorrelations(prompts) {
        const promptIds = prompts.map(p => p.id);
        return this.correlations.filter(c => promptIds.includes(c.promptId));
    }

    /**
     * Generate suggestions
     */
    generateSuggestions(prompts, issueDescription) {
        const suggestions = [];

        // Check if quality dropped after a prompt
        for (let i = 1; i < prompts.length; i++) {
            const prev = prompts[i - 1];
            const curr = prompts[i];

            if (prev.codeState?.quality && curr.codeState?.quality) {
                const drop = prev.codeState.quality - curr.codeState.quality;
                if (drop > 10) {
                    suggestions.push({
                        type: 'quality-drop',
                        message: `Quality dropped ${drop} points after prompt: "${curr.prompt.substring(0, 50)}..."`,
                        suggestion: 'Consider reverting changes from this prompt'
                    });
                }
            }
        }

        // Check for patterns
        if (prompts.length > 3) {
            suggestions.push({
                type: 'chain-length',
                message: `Long prompt chain detected (${prompts.length} prompts)`,
                suggestion: 'Consider breaking into smaller, focused prompts'
            });
        }

        return suggestions;
    }

    /**
     * Re-compile from English (replay prompts)
     */
    async recompileFromEnglish(promptIds) {
        log.info(`🔄 Re-compiling from English (${promptIds.length} prompts)...`);

        const prompts = this.promptHistory.filter(p => promptIds.includes(p.id));
        const steps = [];

        for (const prompt of prompts) {
            steps.push({
                prompt: prompt.prompt,
                context: prompt.context,
                expectedState: prompt.codeState,
                timestamp: prompt.timestamp
            });
        }

        return {
            steps,
            instructions: this.generateInstructions(steps)
        };
    }

    /**
     * Generate instructions from prompt chain
     */
    generateInstructions(steps) {
        return steps.map((step, index) => ({
            step: index + 1,
            instruction: step.prompt,
            context: step.context,
            expected: step.expectedState
        }));
    }

    /**
     * Get prompt history
     */
    getHistory(options = {}) {
        const {
            limit = 50,
            filter = null,
            since = null
        } = options;

        let history = [...this.promptHistory];

        // Filter
        if (filter) {
            history = history.filter(p => 
                p.prompt.toLowerCase().includes(filter.toLowerCase())
            );
        }

        // Since date
        if (since) {
            const sinceDate = new Date(since);
            history = history.filter(p => new Date(p.timestamp) >= sinceDate);
        }

        // Limit
        return history.slice(-limit);
    }

    /**
     * Get correlations for a prompt
     */
    getCorrelations(promptId) {
        return this.correlations.filter(c => c.promptId === promptId);
    }

    /**
     * Hash code for comparison
     */
    hashCode(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString();
    }

    /**
     * Load history from disk
     */
    async loadHistory() {
        try {
            const historyPath = path.join(process.cwd(), this.options.historyFile);
            const data = JSON.parse(await fs.readFile(historyPath, 'utf8'));
            this.promptHistory = data.promptHistory || [];
            this.correlations = data.correlations || [];
            log.debug(`Loaded ${this.promptHistory.length} prompts from history`);
        } catch (error) {
            // No history yet
            this.promptHistory = [];
            this.correlations = [];
        }
    }

    /**
     * Save history to disk
     */
    async saveHistory() {
        try {
            const historyPath = path.join(process.cwd(), this.options.historyFile);
            const dir = path.dirname(historyPath);
            await fs.mkdir(dir, { recursive: true });

            const data = {
                promptHistory: this.promptHistory,
                correlations: this.correlations,
                lastUpdated: new Date().toISOString()
            };

            await fs.writeFile(historyPath, JSON.stringify(data, null, 2), 'utf8');
        } catch (error) {
            log.warn('Failed to save prompt history:', error.message);
        }
    }

    /**
     * Get status
     */
    getStatus() {
        return {
            enabled: this.options.enabled,
            trackPrompts: this.options.trackPrompts,
            promptsTracked: this.promptHistory.length,
            correlations: this.correlations.length,
            lastPrompt: this.promptHistory[this.promptHistory.length - 1]?.timestamp || null
        };
    }
}

module.exports = { PromptChainDebugger };

