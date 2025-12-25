/**
 * BEAST MODE Logger Utility
 * Centralized logging for all BEAST MODE components
 */

const winston = require('winston');

// BEAST MODE Log Levels
const LOG_LEVELS = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
    trace: 4
};

// BEAST MODE Colors
const LOG_COLORS = {
    ERROR: 'red',
    WARN: 'yellow',
    INFO: 'green',
    DEBUG: 'blue',
    TRACE: 'gray'
};

// Create logger instance
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    levels: LOG_LEVELS,
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
            const contextStr = context ? `[${context}] ` : '';
            const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
            return `${timestamp} ${level.toUpperCase()}: ${contextStr}${message}${metaStr}`;
        })
    ),
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize({ colors: LOG_COLORS }),
                winston.format.simple()
            )
        }),
        // File logging for production
        ...(process.env.NODE_ENV === 'production' ? [
            new winston.transports.File({
                filename: 'logs/beast-mode-error.log',
                level: 'error'
            }),
            new winston.transports.File({
                filename: 'logs/beast-mode.log'
            })
        ] : [])
    ]
});

/**
 * Create a contextual logger
 */
function createLogger(context) {
    return {
        error: (message, ...args) => logger.error(message, { context, ...args }),
        warn: (message, ...args) => logger.warn(message, { context, ...args }),
        info: (message, ...args) => logger.info(message, { context, ...args }),
        debug: (message, ...args) => logger.debug(message, { context, ...args }),
        trace: (message, ...args) => logger.trace(message, { context, ...args }),

        // Utility methods
        log: (level, message, ...args) => {
            const logMethod = logger[level.toLowerCase()];
            if (logMethod) {
                logMethod(message, { context, ...args });
            } else {
                logger.info(message, { context, level, ...args });
            }
        }
    };
}

// Default logger instance
const defaultLogger = createLogger('BEAST-MODE');

module.exports = {
    createLogger,
    logger: defaultLogger,
    LOG_LEVELS
};

