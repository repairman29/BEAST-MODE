/**
 * Data Integration Service
 * Connects to existing services and databases to collect real training data
 * 
 * Month 1: Real Data Collection from Production Systems
 */

const { createLogger } = require('../utils/logger');
const { getDataCollectionService } = require('./dataCollection');
const log = createLogger('DataIntegration');

class DataIntegrationService {
    constructor() {
        this.supabase = null;
        this.initialized = false;
        this.integrationSources = {
            aiGM: false,
            beastMode: false,
            supabase: false
        };
    }

    /**
     * Initialize data integration
     */
    async initialize() {
        if (this.initialized) return;

        log.info('Initializing data integration service...');

        // Try to connect to Supabase (if available)
        await this.initializeSupabase();

        // Try to connect to AI GM services (if available)
        await this.initializeAIGMServices();

        this.initialized = true;
        log.info('✅ Data integration service initialized');
    }

    /**
     * Initialize Supabase connection
     */
    async initializeSupabase() {
        try {
            // Load .env from smuggler-ai-gm directory first
            const path = require('path');
            const dotenv = require('dotenv');
            
            // Try to find and load .env from smuggler-ai-gm
            const possibleEnvPaths = [
                path.join(__dirname, '../../../smuggler-ai-gm/.env'),
                path.join(process.cwd(), '../smuggler-ai-gm/.env'),
                path.join(process.cwd(), 'smuggler-ai-gm/.env')
            ];

            for (const envPath of possibleEnvPaths) {
                try {
                    const fs = require('fs');
                    if (fs.existsSync(envPath)) {
                        dotenv.config({ path: envPath });
                        log.debug(`Loaded .env from: ${envPath}`);
                        break;
                    }
                } catch (error) {
                    // Try next path
                }
            }

            // Try to get Supabase from AI GM services
            // Try multiple paths to find config
            const possiblePaths = [
                path.join(__dirname, '../../../smuggler-ai-gm/src/config'),
                path.join(process.cwd(), '../smuggler-ai-gm/src/config'),
                path.join(process.cwd(), 'smuggler-ai-gm/src/config')
            ];

            let config = null;
            for (const configPath of possiblePaths) {
                try {
                    delete require.cache[require.resolve(configPath)];
                    config = require(configPath);
                    break;
                } catch (error) {
                    // Try next path
                }
            }

            if (!config) {
                log.debug('Config file not found');
                return;
            }

            // Try getSupabaseService first (if it exists)
            let supabaseConfig = null;
            if (typeof config.getSupabaseService === 'function') {
                supabaseConfig = config.getSupabaseService();
            } else if (config.supabase) {
                // Fallback to direct config.supabase
                supabaseConfig = config.supabase;
            } else {
                log.debug('No Supabase config found in config object');
                return;
            }
            
            if (supabaseConfig && supabaseConfig.url && supabaseConfig.serviceRoleKey) {
                const { createClient } = require('@supabase/supabase-js');
                this.supabase = createClient(
                    supabaseConfig.url,
                    supabaseConfig.serviceRoleKey
                );
                this.integrationSources.supabase = true;
                log.info('✅ Connected to Supabase');
            } else {
                log.warn('⚠️  Supabase credentials not fully configured');
                if (!supabaseConfig) {
                    log.debug('  - No supabase config object found');
                } else {
                    if (!supabaseConfig.url) log.debug('  - SUPABASE_URL missing');
                    if (!supabaseConfig.serviceRoleKey) log.debug('  - SUPABASE_SERVICE_ROLE_KEY missing');
                }
            }
        } catch (error) {
            log.debug('Supabase initialization skipped:', error.message);
        }
    }

    /**
     * Initialize AI GM services
     */
    async initializeAIGMServices() {
        try {
            // Check if AI GM services are available
            const aiGMQualityPredictionService = require('../../smuggler-ai-gm/src/services/aiGMQualityPredictionService');
            const aiGMCSATOptimizationService = require('../../smuggler-ai-gm/src/services/aiGMCSATOptimizationService');
            
            this.aiGMQualityPrediction = aiGMQualityPredictionService;
            this.aiGMCSAT = aiGMCSATOptimizationService;
            this.integrationSources.aiGM = true;
            log.info('✅ Connected to AI GM services');
        } catch (error) {
            log.debug('AI GM services not available:', error.message);
        }
    }

    /**
     * Collect real training data from Supabase
     * 
     * Sources:
     * 1. ai_gm_quality_feedback - CSAT scores and feedback
     * 2. ai_gm_explanations - Quality scores and predictions
     * 3. ai_gm_ab_testing - A/B test results with CSAT
     */
    async collectFromSupabase(options = {}) {
        if (!this.supabase) {
            log.warn('Supabase not available - cannot collect data');
            return { collected: 0, sources: [] };
        }

        const {
            limit = 1000,
            startDate = null,
            endDate = null
        } = options;

        log.info('Collecting real training data from Supabase...');
        const dataCollection = await getDataCollectionService();
        let totalCollected = 0;

        try {
            // 1. Collect from ai_gm_quality_feedback (CSAT data)
            const feedbackData = await this.collectFeedbackData(limit, startDate, endDate);
            for (const feedback of feedbackData) {
                await dataCollection.collectCSATData({
                    sessionId: feedback.session_id,
                    actionType: feedback.action_type || 'unknown',
                    provider: feedback.provider,
                    model: feedback.model,
                    csatScore: feedback.quality_rating || 0,
                    feedback: feedback.feedback_text,
                    context: {
                        responseId: feedback.response_id,
                        userId: feedback.user_id
                    },
                    timestamp: feedback.created_at
                });
                totalCollected++;
            }
            log.info(`  ✅ Collected ${feedbackData.length} CSAT samples from quality_feedback`);

            // 2. Collect from ai_gm_explanations (Quality scores)
            const explanationData = await this.collectExplanationData(limit, startDate, endDate);
            for (const explanation of explanationData) {
                // Convert quality score to training format
                const qualityScore = explanation.quality_score || 0;
                const codeMetrics = this.extractMetricsFromExplanation(explanation);
                
                await dataCollection.collectQualityData({
                    codeMetrics: codeMetrics,
                    qualityScore: qualityScore * 100, // Convert 0-1 to 0-100
                    csatScore: null, // Not available in explanations
                    context: {
                        provider: explanation.provider,
                        model: explanation.model,
                        actionType: explanation.action_type,
                        scenarioId: explanation.scenario_id
                    },
                    timestamp: explanation.created_at
                });
                totalCollected++;
            }
            log.info(`  ✅ Collected ${explanationData.length} quality samples from explanations`);

            // 3. Collect from ai_gm_ab_testing (A/B test results)
            const abTestData = await this.collectABTestData(limit, startDate, endDate);
            for (const test of abTestData) {
                if (test.user_rating !== null) {
                    await dataCollection.collectModelPerformance({
                        modelName: `${test.experiment_name}_${test.variant}`,
                        provider: test.provider || 'unknown',
                        model: test.model || 'unknown',
                        prediction: test.predicted_quality || 0,
                        actual: test.user_rating,
                        context: {
                            experimentName: test.experiment_name,
                            variant: test.variant,
                            responseId: test.response_id
                        },
                        timestamp: test.created_at
                    });
                    totalCollected++;
                }
            }
            log.info(`  ✅ Collected ${abTestData.length} model performance samples from A/B testing`);

            log.info(`🎉 Total collected: ${totalCollected} training samples`);
            return {
                collected: totalCollected,
                sources: ['quality_feedback', 'explanations', 'ab_testing']
            };

        } catch (error) {
            log.error('Error collecting from Supabase:', error.message);
            return { collected: totalCollected, error: error.message };
        }
    }

    /**
     * Collect feedback data from ai_gm_quality_feedback table
     */
    async collectFeedbackData(limit, startDate, endDate) {
        let query = this.supabase
            .from('ai_gm_quality_feedback')
            .select('*')
            .not('quality_rating', 'is', null)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (startDate) {
            query = query.gte('created_at', startDate);
        }
        if (endDate) {
            query = query.lte('created_at', endDate);
        }

        const { data, error } = await query;

        if (error) {
            if (error.code === 'PGRST205') {
                log.warn('Table ai_gm_quality_feedback not found - run migration');
                return [];
            }
            throw error;
        }

        return data || [];
    }

    /**
     * Collect explanation data from ai_gm_explanations table
     */
    async collectExplanationData(limit, startDate, endDate) {
        let query = this.supabase
            .from('ai_gm_explanations')
            .select('*')
            .not('quality_score', 'is', null)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (startDate) {
            query = query.gte('created_at', startDate);
        }
        if (endDate) {
            query = query.lte('created_at', endDate);
        }

        const { data, error } = await query;

        if (error) {
            if (error.code === 'PGRST205') {
                log.warn('Table ai_gm_explanations not found - run migration');
                return [];
            }
            throw error;
        }

        return data || [];
    }

    /**
     * Collect A/B test data from ai_gm_ab_testing table
     */
    async collectABTestData(limit, startDate, endDate) {
        let query = this.supabase
            .from('ai_gm_ab_testing')
            .select('*')
            .not('user_rating', 'is', null)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (startDate) {
            query = query.gte('created_at', startDate);
        }
        if (endDate) {
            query = query.lte('created_at', endDate);
        }

        const { data, error } = await query;

        if (error) {
            if (error.code === 'PGRST205') {
                log.warn('Table ai_gm_ab_testing not found - run migration');
                return [];
            }
            throw error;
        }

        return data || [];
    }

    /**
     * Extract metrics from explanation data
     * Converts explanation metadata to code metrics format
     */
    extractMetricsFromExplanation(explanation) {
        // Try to extract metrics from explanation metadata or use defaults
        const metadata = explanation.metadata || {};
        
        return {
            codeQuality: metadata.codeQuality || 75,
            testCoverage: metadata.testCoverage || 70,
            security: metadata.security || 85,
            performance: metadata.performance || 80,
            maintainability: metadata.maintainability || 75,
            complexity: metadata.complexity || 50
        };
    }

    /**
     * Collect data from AI GM CSAT Optimization Service
     */
    async collectFromCSATService() {
        if (!this.aiGMCSAT) {
            log.warn('AI GM CSAT service not available');
            return { collected: 0 };
        }

        try {
            const csatData = this.aiGMCSAT.csatData;
            const dataCollection = await getDataCollectionService();
            let collected = 0;

            // Collect CSAT by quality ranges
            for (const [qualityRange, data] of Object.entries(csatData.csatByQuality || {})) {
                if (data.count > 0) {
                    const qualityMin = parseFloat(qualityRange.split('-')[0]) || 0;
                    const qualityMax = parseFloat(qualityRange.split('-')[1]) || 1;
                    const avgQuality = (qualityMin + qualityMax) / 2;

                    await dataCollection.collectCSATData({
                        sessionId: 'csat-service',
                        actionType: 'quality-range',
                        provider: null,
                        model: null,
                        csatScore: data.averageCSAT,
                        feedback: null,
                        context: {
                            qualityRange: qualityRange,
                            qualityMin: qualityMin,
                            qualityMax: qualityMax,
                            count: data.count
                        },
                        timestamp: new Date().toISOString()
                    });
                    collected++;
                }
            }

            log.info(`✅ Collected ${collected} CSAT samples from CSAT service`);
            return { collected };

        } catch (error) {
            log.error('Error collecting from CSAT service:', error.message);
            return { collected: 0, error: error.message };
        }
    }

    /**
     * Collect all available data sources
     */
    async collectAll(options = {}) {
        log.info('🔄 Collecting data from all available sources...');
        
        const results = {
            supabase: { collected: 0 },
            csatService: { collected: 0 },
            total: 0
        };

        // Collect from Supabase
        if (this.integrationSources.supabase) {
            results.supabase = await this.collectFromSupabase(options);
        }

        // Collect from CSAT service
        if (this.integrationSources.aiGM) {
            results.csatService = await this.collectFromCSATService();
        }

        results.total = results.supabase.collected + results.csatService.collected;

        log.info(`🎉 Total collected: ${results.total} samples`);
        return results;
    }

    /**
     * Get data collection statistics
     */
    async getStatistics() {
        const dataCollection = await getDataCollectionService();
        const stats = dataCollection.getDataStatistics();

        return {
            local: stats,
            integration: {
                supabase: this.integrationSources.supabase,
                aiGM: this.integrationSources.aiGM,
                beastMode: this.integrationSources.beastMode
            }
        };
    }

    /**
     * Schedule automatic data collection
     */
    async startAutoCollection(intervalMinutes = 60) {
        log.info(`Starting automatic data collection (every ${intervalMinutes} minutes)`);

        // Collect immediately
        await this.collectAll();

        // Schedule periodic collection
        setInterval(async () => {
            log.info('🔄 Running scheduled data collection...');
            await this.collectAll();
        }, intervalMinutes * 60 * 1000);
    }
}

// Singleton instance
let dataIntegrationInstance = null;

async function getDataIntegrationService() {
    if (!dataIntegrationInstance) {
        dataIntegrationInstance = new DataIntegrationService();
        await dataIntegrationInstance.initialize();
    }
    return dataIntegrationInstance;
}

module.exports = {
    DataIntegrationService,
    getDataIntegrationService
};

