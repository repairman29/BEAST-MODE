/**
 * Real-Time Data Streaming
 * Streams feedback and training data in real-time
 * 
 * Month 2: Week 3 - Data Pipeline
 */

const { createLogger } = require('../utils/logger');
const { getDataCollectionService } = require('./dataCollection');
const { getOnlineLearning } = require('./onlineLearning');
const { getModelMonitoring } = require('./modelMonitoring');
const EventEmitter = require('events');

const log = createLogger('DataStreaming');

class DataStreaming extends EventEmitter {
    constructor() {
        super();
        this.streams = new Map();
        this.buffer = [];
        this.bufferSize = 50;
        this.flushInterval = 5000; // 5 seconds
        this.enabled = true;
    }

    /**
     * Start streaming data
     */
    async start() {
        if (!this.enabled) {
            return;
        }

        log.info('Starting data streaming...');

        // Flush buffer periodically
        this.flushTimer = setInterval(() => {
            this.flushBuffer();
        }, this.flushInterval);

        // Listen for feedback events
        this.on('feedback', async (data) => {
            await this.processFeedback(data);
        });

        // Listen for prediction events
        this.on('prediction', async (data) => {
            await this.processPrediction(data);
        });

        log.info('✅ Data streaming started');
    }

    /**
     * Stop streaming
     */
    stop() {
        if (this.flushTimer) {
            clearInterval(this.flushTimer);
        }
        this.flushBuffer(); // Flush remaining data
        log.info('Data streaming stopped');
    }

    /**
     * Stream feedback data
     */
    async streamFeedback(feedback) {
        if (!this.enabled) {
            return;
        }

        const data = {
            type: 'feedback',
            timestamp: new Date().toISOString(),
            ...feedback
        };

        this.buffer.push(data);
        this.emit('feedback', data);

        // Flush if buffer is full
        if (this.buffer.length >= this.bufferSize) {
            await this.flushBuffer();
        }
    }

    /**
     * Stream prediction data
     */
    async streamPrediction(prediction) {
        if (!this.enabled) {
            return;
        }

        const data = {
            type: 'prediction',
            timestamp: new Date().toISOString(),
            ...prediction
        };

        this.buffer.push(data);
        this.emit('prediction', data);

        // Flush if buffer is full
        if (this.buffer.length >= this.bufferSize) {
            await this.flushBuffer();
        }
    }

    /**
     * Process feedback
     */
    async processFeedback(data) {
        try {
            const onlineLearning = getOnlineLearning();
            const monitoring = getModelMonitoring();

            // Record in monitoring
            if (data.prediction !== undefined && data.actual !== undefined) {
                await monitoring.recordPrediction(
                    data.prediction,
                    data.actual,
                    data.latency || 0,
                    { feedback: true, ...data.metadata }
                );
            }

            // Process for online learning
            if (data.features && data.actual !== undefined) {
                await onlineLearning.processFeedback(
                    data.predictionId || Date.now().toString(),
                    data.actual,
                    {
                        prediction: data.prediction,
                        features: data.features,
                        latency: data.latency
                    }
                );
            }

        } catch (error) {
            log.warn('Failed to process feedback:', error.message);
        }
    }

    /**
     * Process prediction
     */
    async processPrediction(data) {
        try {
            const monitoring = getModelMonitoring();

            // Record prediction for monitoring
            if (data.prediction !== undefined) {
                await monitoring.recordPrediction(
                    data.prediction,
                    data.actual || null,
                    data.latency || 0,
                    data.metadata || {}
                );
            }

        } catch (error) {
            log.warn('Failed to process prediction:', error.message);
        }
    }

    /**
     * Flush buffer to storage
     */
    async flushBuffer() {
        if (this.buffer.length === 0) {
            return;
        }

        try {
            const dataCollection = await getDataCollectionService();
            const toFlush = [...this.buffer];
            this.buffer = [];

            // Store feedback data
            const feedbackData = toFlush.filter(d => d.type === 'feedback');
            if (feedbackData.length > 0) {
                for (const data of feedbackData) {
                    await dataCollection.collectQualityFeedback({
                        prediction: data.prediction,
                        actual: data.actual,
                        features: data.features,
                        metadata: data.metadata
                    });
                }
            }

            log.debug(`Flushed ${toFlush.length} data points`);

        } catch (error) {
            log.warn('Failed to flush buffer:', error.message);
            // Put data back in buffer to retry later
            this.buffer.unshift(...toFlush);
        }
    }

    /**
     * Get streaming statistics
     */
    getStats() {
        return {
            enabled: this.enabled,
            bufferSize: this.buffer.length,
            maxBufferSize: this.bufferSize,
            flushInterval: this.flushInterval,
            streams: Array.from(this.streams.keys())
        };
    }

    /**
     * Configure streaming
     */
    configure(options) {
        if (options.bufferSize !== undefined) {
            this.bufferSize = options.bufferSize;
        }
        if (options.flushInterval !== undefined) {
            this.flushInterval = options.flushInterval;
            if (this.flushTimer) {
                clearInterval(this.flushTimer);
                this.flushTimer = setInterval(() => {
                    this.flushBuffer();
                }, this.flushInterval);
            }
        }
        if (options.enabled !== undefined) {
            this.enabled = options.enabled;
        }
    }
}

// Singleton instance
let dataStreamingInstance = null;

function getDataStreaming() {
    if (!dataStreamingInstance) {
        dataStreamingInstance = new DataStreaming();
        dataStreamingInstance.start();
    }
    return dataStreamingInstance;
}

module.exports = {
    DataStreaming,
    getDataStreaming
};

