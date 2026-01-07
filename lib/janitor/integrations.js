/**
 * BEAST MODE Janitor Integrations
 * Integrates janitor systems with existing BEAST MODE services
 */

const { createLogger } = require('../utils/logger');
const log = createLogger('JanitorIntegrations');

class JanitorIntegrations {
    constructor(janitor) {
        this.janitor = janitor;
    }

    /**
     * Integrate with Quality Engine
     */
    async integrateWithQualityEngine(qualityEngine) {
        // Use quality scores for refactoring decisions
        if (this.janitor.silentRefactoring) {
            this.janitor.silentRefactoring.getCurrentQuality = async () => {
                const score = await qualityEngine.calculateScore();
                return score.overall;
            };
        }

        // Use quality scores for vibe restoration
        if (this.janitor.vibeRestorer) {
            this.janitor.vibeRestorer.getCurrentQuality = async () => {
                const score = await qualityEngine.calculateScore();
                return score.overall;
            };
        }

        log.info('✅ Integrated with Quality Engine');
    }

    /**
     * Integrate with ML Prediction System
     */
    async integrateWithML(mlSystem) {
        // Use ML predictions for smarter refactoring
        if (this.janitor.silentRefactoring) {
            this.janitor.silentRefactoring.predictRefactoringImpact = async (change) => {
                try {
                    const prediction = await mlSystem.predict({
                        type: 'refactoring-impact',
                        change,
                        context: await this.janitor.repoMemory?.getContext(change.file)
                    });
                    return prediction;
                } catch (error) {
                    return { confidence: 0.5, impact: 'unknown' };
                }
            };
        }

        // Use ML for architecture rule suggestions
        if (this.janitor.architectureEnforcer) {
            this.janitor.architectureEnforcer.suggestRules = async (codebase) => {
                try {
                    const suggestions = await mlSystem.predict({
                        type: 'architecture-rules',
                        codebase
                    });
                    return suggestions;
                } catch (error) {
                    return [];
                }
            };
        }

        log.info('✅ Integrated with ML Prediction System');
    }

    /**
     * Integrate with Code Roach
     */
    async integrateWithCodeRoach(codeRoach) {
        // Use Code Roach for better bug detection
        if (this.janitor.silentRefactoring) {
            this.janitor.silentRefactoring.findBugs = async (files) => {
                try {
                    const bugs = await codeRoach.detectBugs(files);
                    return bugs;
                } catch (error) {
                    return [];
                }
            };
        }

        log.info('✅ Integrated with Code Roach');
    }

    /**
     * Integrate with Oracle AI
     */
    async integrateWithOracle(oracle) {
        // Use Oracle for architectural insights
        if (this.janitor.repoMemory) {
            this.janitor.repoMemory.getArchitecturalInsights = async (file) => {
                try {
                    const insights = await oracle.analyzeArchitecture(file);
                    return insights;
                } catch (error) {
                    return null;
                }
            };
        }

        log.info('✅ Integrated with Oracle AI');
    }

    /**
     * Integrate with Supabase
     */
    async integrateWithSupabase(supabase) {
        // Store prompt history in Supabase
        if (this.janitor.promptChainDebugger) {
            this.janitor.promptChainDebugger.saveToSupabase = async (prompt) => {
                try {
                    await supabase.from('prompt_history').insert({
                        prompt_id: prompt.id,
                        prompt_text: prompt.prompt,
                        context: prompt.context,
                        code_state: prompt.codeState,
                        timestamp: prompt.timestamp
                    });
                } catch (error) {
                    log.debug('Failed to save prompt to Supabase:', error.message);
                }
            };
        }

        // Store refactoring stats
        if (this.janitor.silentRefactoring) {
            this.janitor.silentRefactoring.saveStatsToSupabase = async (stats) => {
                try {
                    await supabase.from('refactoring_stats').insert({
                        total_runs: stats.totalRuns,
                        total_fixes: stats.totalFixes,
                        security_fixes: stats.totalSecurityFixes,
                        deduplications: stats.totalDeduplications,
                        timestamp: new Date().toISOString()
                    });
                } catch (error) {
                    log.debug('Failed to save stats to Supabase:', error.message);
                }
            };
        }

        log.info('✅ Integrated with Supabase');
    }

    /**
     * Integrate with GitHub
     */
    async integrateWithGitHub(githubClient) {
        // Create PRs for refactoring
        if (this.janitor.silentRefactoring) {
            this.janitor.silentRefactoring.createGitHubPR = async (results) => {
                try {
                    const pr = await githubClient.createPullRequest({
                        title: `chore(janitor): ${this.janitor.silentRefactoring.generateSummary(results)}`,
                        body: 'Automated refactoring by BEAST MODE Janitor',
                        branch: `beast-mode/janitor-${Date.now()}`
                    });
                    return pr;
                } catch (error) {
                    log.warn('Failed to create GitHub PR:', error.message);
                    return null;
                }
            };
        }

        // Get commit history for prompt correlation
        if (this.janitor.promptChainDebugger) {
            this.janitor.promptChainDebugger.getCommitHistory = async (since) => {
                try {
                    const commits = await githubClient.getCommits({ since });
                    return commits;
                } catch (error) {
                    return [];
                }
            };
        }

        log.info('✅ Integrated with GitHub');
    }

    /**
     * Integrate all systems
     */
    async integrateAll(beastMode) {
        log.info('🔗 Integrating Janitor with BEAST MODE systems...');

        if (beastMode.quality) {
            await this.integrateWithQualityEngine(beastMode.quality);
        }

        // Try to get ML system
        try {
            const { getDatabaseWriter } = require('../mlops/databaseWriter');
            const mlSystem = { predict: async () => ({}) }; // Placeholder
            await this.integrateWithML(mlSystem);
        } catch (error) {
            log.debug('ML system not available');
        }

        if (beastMode.codeRoach) {
            await this.integrateWithCodeRoach(beastMode.codeRoach);
        }

        if (beastMode.oracle) {
            await this.integrateWithOracle(beastMode.oracle);
        }

        // Try to get Supabase
        try {
            const { getDatabaseWriter } = require('../mlops/databaseWriter');
            const dbWriter = getDatabaseWriter();
            if (dbWriter.supabase) {
                await this.integrateWithSupabase(dbWriter.supabase);
            }
        } catch (error) {
            log.debug('Supabase not available');
        }

        log.info('✅ All integrations complete');
    }
}

module.exports = { JanitorIntegrations };

