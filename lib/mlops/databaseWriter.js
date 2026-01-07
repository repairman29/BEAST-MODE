/**
 * Database Writer Service
 * Handles writing ML predictions and feedback to Supabase database
 * 
 * Month 4: Database Integration
 */

// Optional logger - handle gracefully if not available
let log = null;
try {
  const { createLogger } = require('../utils/logger');
  log = createLogger('DatabaseWriter');
} catch (error) {
  // Logger not available - use console as fallback
  log = {
    info: (...args) => console.log('[DatabaseWriter]', ...args),
    error: (...args) => console.error('[DatabaseWriter]', ...args),
    warn: (...args) => console.warn('[DatabaseWriter]', ...args),
    debug: (...args) => console.debug('[DatabaseWriter]', ...args)
  };
}

class DatabaseWriter {
    constructor() {
        this.supabase = null;
        this.initialized = false;
        this.writeQueue = [];
        this.batchSize = 50;
        this.flushInterval = 5000; // 5 seconds
        this.flushTimer = null;
    }

    /**
     * Initialize database connection
     */
    async initialize() {
        if (this.initialized) return;

        try {
            // Try to get Supabase connection from data integration
            const path = require('path');
            const possiblePaths = [
                path.join(__dirname, './dataIntegration'),
                path.join(__dirname, '../../../smuggler-ai-gm/src/config'),
                path.join(process.cwd(), '../smuggler-ai-gm/src/config'),
                path.join(process.cwd(), 'smuggler-ai-gm/src/config')
            ];

            let supabaseConfig = null;
            for (const configPath of possiblePaths) {
                try {
                    delete require.cache[require.resolve(configPath)];
                    const config = require(configPath);
                    
                    if (typeof config.getSupabaseService === 'function') {
                        supabaseConfig = config.getSupabaseService();
                    } else if (config.supabase) {
                        supabaseConfig = config.supabase;
                    }
                    
                    if (supabaseConfig && supabaseConfig.url && supabaseConfig.serviceRoleKey) {
                        break;
                    }
                } catch (error) {
                    // Try next path
                }
            }

            // Also try from data integration service
            if (!supabaseConfig) {
                try {
                    const { getDataIntegrationService } = require('./dataIntegration');
                    const dataIntegration = await getDataIntegrationService();
                    if (dataIntegration && dataIntegration.supabase) {
                        this.supabase = dataIntegration.supabase;
                        this.initialized = true;
                        this.startFlushTimer();
                        log.info('✅ Database writer initialized (via data integration)');
                        return;
                    }
                } catch (error) {
                    // Data integration not available - continue
                }
            }

            if (supabaseConfig && supabaseConfig.url && supabaseConfig.serviceRoleKey) {
                const { createClient } = require('@supabase/supabase-js');
                this.supabase = createClient(
                    supabaseConfig.url,
                    supabaseConfig.serviceRoleKey
                );
                this.initialized = true;
                this.startFlushTimer();
                log.info('✅ Database writer initialized');
            } else {
                log.warn('⚠️  Supabase not configured - database writes will be queued only');
                this.initialized = true; // Mark as initialized even without DB
            }
        } catch (error) {
            log.warn('Database writer initialization failed:', error.message);
            this.initialized = true; // Mark as initialized to prevent retries
        }
    }

    /**
     * Start flush timer
     */
    startFlushTimer() {
        if (this.flushTimer) {
            clearInterval(this.flushTimer);
        }

        this.flushTimer = setInterval(() => {
            this.flushQueue();
        }, this.flushInterval);
    }

    /**
     * Write prediction to database
     */
    async writePrediction(predictionData) {
        await this.initialize();

        const {
            serviceName,
            predictionType,
            predictedValue,
            actualValue,
            confidence,
            context,
            modelVersion,
            source
        } = predictionData;

        // Generate ID now so we can return it immediately
        const predictionId = require('crypto').randomUUID();
        
        log.info(`[Database Writer] Writing prediction: id=${predictionId.substring(0, 8)}..., service=${serviceName}, type=${predictionType}, value=${predictedValue?.toFixed(3) || 'N/A'}`);
        
        const prediction = {
            id: predictionId, // Include ID in prediction data
            service_name: serviceName,
            prediction_type: predictionType,
            predicted_value: predictedValue,
            actual_value: actualValue || null,
            confidence: confidence || null,
            context: context || {},
            model_version: modelVersion || null,
            source: source || 'ml_model',
            error: actualValue !== null && actualValue !== undefined
                ? Math.abs(predictedValue - actualValue)
                : null
        };

        // Add to queue with ID
        this.writeQueue.push({
            table: 'ml_predictions',
            data: prediction,
            predictionId: predictionId // Store for return
        });

        // Phase 2: Trigger auto-feedback for high-value predictions
        try {
            const { getAutoFeedbackTrigger } = require('./autoFeedbackTrigger');
            const trigger = getAutoFeedbackTrigger();
            await trigger.triggerFeedback(predictionId, {
                service_name: serviceName,
                prediction_type: predictionType,
                confidence: confidence,
                context: context
            });
        } catch (error) {
            // Non-critical - don't fail prediction write if trigger fails
            log.debug('[Database Writer] Auto-feedback trigger failed:', error.message);
        }

        // Also write to service-specific table if applicable
        const serviceTable = this.getServiceTable(serviceName);
        if (serviceTable) {
            const serviceData = this.formatServiceData(serviceName, predictionData);
            if (serviceData) {
                this.writeQueue.push({
                    table: serviceTable,
                    data: serviceData
                });
            }
        }

        // Flush if queue is large
        if (this.writeQueue.length >= this.batchSize) {
            await this.flushQueue();
        }

        // Return prediction with ID
        return {
            ...prediction,
            id: predictionId
        };
    }

    /**
     * Write feedback to database
     */
    async writeFeedback(feedbackData) {
        await this.initialize();

        const {
            predictionId,
            serviceName,
            feedbackType,
            feedbackScore,
            feedbackText,
            userId,
            metadata
        } = feedbackData;

        const feedback = {
            prediction_id: predictionId || null,
            service_name: serviceName,
            feedback_type: feedbackType || 'system',
            feedback_score: feedbackScore || null,
            feedback_text: feedbackText || null,
            user_id: userId || null,
            metadata: metadata || {}
        };

        this.writeQueue.push({
            table: 'ml_feedback',
            data: feedback
        });

        if (this.writeQueue.length >= this.batchSize) {
            await this.flushQueue();
        }

        return feedback;
    }

    /**
     * Write performance metric
     */
    async writePerformanceMetric(metricData) {
        await this.initialize();

        const {
            serviceName,
            metricName,
            metricValue,
            metricUnit,
            periodStart,
            periodEnd,
            metadata
        } = metricData;

        const metric = {
            service_name: serviceName,
            metric_name: metricName,
            metric_value: metricValue,
            metric_unit: metricUnit || null,
            period_start: periodStart || new Date().toISOString(),
            period_end: periodEnd || new Date().toISOString(),
            metadata: metadata || {}
        };

        this.writeQueue.push({
            table: 'ml_performance_metrics',
            data: metric
        });

        if (this.writeQueue.length >= this.batchSize) {
            await this.flushQueue();
        }

        return metric;
    }

    /**
     * Flush write queue
     */
    async flushQueue() {
        if (this.writeQueue.length === 0 || !this.supabase) {
            return;
        }

        const batch = this.writeQueue.splice(0, this.batchSize);
        log.debug(`[Database Writer] Flushing ${batch.length} items to database`);

        // Group by table
        const byTable = {};
        for (const item of batch) {
            if (!byTable[item.table]) {
                byTable[item.table] = [];
            }
            byTable[item.table].push(item.data);
        }

        // Write each table's batch
        for (const [table, data] of Object.entries(byTable)) {
            try {
                const { error } = await this.supabase
                    .from(table)
                    .insert(data);

                if (error) {
                    if (error.code === 'PGRST205') {
                        log.warn(`[Database Writer] Table ${table} not found - run migration`);
                    } else {
                        log.error(`[Database Writer] Error writing to ${table}:`, error.message);
                    }
                } else {
                    log.debug(`[Database Writer] ✅ Wrote ${data.length} items to ${table}`);
                }
            } catch (error) {
                log.error(`[Database Writer] Error writing to ${table}:`, error.message);
            }
        }
    }

    /**
     * Get service-specific table name
     */
    getServiceTable(serviceName) {
        const tables = {
            'code-roach': 'code_roach_ml_predictions',
            'oracle': 'oracle_ml_predictions',
            'daisy-chain': 'daisy_chain_ml_predictions',
            'first-mate': 'first_mate_ml_predictions',
            'game-app': 'game_app_ml_predictions'
        };
        return tables[serviceName] || null;
    }

    /**
     * Format service-specific data
     */
    formatServiceData(serviceName, predictionData) {
        const { context, predictedValue, actualValue, modelVersion } = predictionData;

        switch (serviceName) {
            case 'code-roach':
                return {
                    project_id: context.projectId || null,
                    file_path: context.filePath || null,
                    prediction_type: predictionData.predictionType || 'code-quality',
                    predicted_quality: predictedValue,
                    actual_quality: actualValue || null,
                    code_metrics: context.codeMetrics || {},
                    context: context,
                    model_version: modelVersion || null
                };

            case 'oracle':
                return {
                    query: context.query || null,
                    knowledge_id: context.knowledgeId || null,
                    predicted_quality: predictedValue,
                    predicted_relevance: context.relevance || predictedValue,
                    actual_quality: actualValue || null,
                    actual_relevance: context.actualRelevance || null,
                    context: context,
                    model_version: modelVersion || null
                };

            case 'daisy-chain':
                return {
                    task_id: context.taskId || null,
                    task_type: context.taskType || null,
                    predicted_quality: predictedValue,
                    predicted_success: context.successProbability || predictedValue,
                    actual_success: actualValue !== null ? (actualValue > 0.5) : null,
                    context: context,
                    model_version: modelVersion || null
                };

            case 'first-mate':
                return {
                    user_id: context.userId || null,
                    roll_type: context.rollType || 'dice',
                    stat_name: context.statName || null,
                    stat_value: context.statValue || null,
                    modifier: context.modifier || 0,
                    predicted_success: predictedValue,
                    actual_success: actualValue !== null ? (actualValue > 0.5) : null,
                    context: context,
                    model_version: modelVersion || null
                };

            case 'game-app':
                return {
                    session_id: context.sessionId || null,
                    narrative_id: context.narrativeId || null,
                    predicted_quality: predictedValue,
                    actual_quality: actualValue || null,
                    scenario_id: context.scenarioId || null,
                    roll_type: context.rollType || null,
                    context: context,
                    model_version: modelVersion || null
                };

            default:
                return null;
        }
    }

    /**
     * Stop flush timer
     */
    stop() {
        if (this.flushTimer) {
            clearInterval(this.flushTimer);
            this.flushTimer = null;
        }
        // Flush remaining items
        this.flushQueue();
    }
}

// Singleton instance
let databaseWriterInstance = null;

function getDatabaseWriter() {
    if (!databaseWriterInstance) {
        databaseWriterInstance = new DatabaseWriter();
    }
    return databaseWriterInstance;
}

module.exports = {
    DatabaseWriter,
    getDatabaseWriter
};

