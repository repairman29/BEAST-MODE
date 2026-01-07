/**
 * BEAST MODE Error Handler
 * Centralized error handling and validation utilities
 */

const { createLogger } = require('./logger');
const log = createLogger('error-handler');

// Use unified config if available
let getUnifiedConfig = null;
try {
  const path = require('path');
  const configPath = path.join(__dirname, '../../../shared-utils/unified-config');
  const unifiedConfig = require(configPath);
  getUnifiedConfig = unifiedConfig.getUnifiedConfig;
} catch (error) {
  // Unified config not available
}

// Helper function to get config value
function getConfigValue(key, defaultValue = null) {
  if (getUnifiedConfig) {
    try {
      const config = getUnifiedConfig();
      const value = config.get(key);
      if (value !== null && value !== undefined && value !== '') {
        return value;
      }
    } catch (error) {
      // Fallback to process.env
    }
  }
  // Fallback to process.env for backward compatibility
  return process.env[key] !== undefined && process.env[key] !== '' ? process.env[key] : defaultValue;
}

class BeastModeError extends Error {
  constructor(message, code, statusCode = 500, details = {}) {
    super(message);
    this.name = 'BeastModeError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date().toISOString();
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      error: {
        name: this.name,
        message: this.message,
        code: this.code,
        statusCode: this.statusCode,
        details: this.details,
        timestamp: this.timestamp
      }
    };
  }
}

/**
 * Validation error
 */
class ValidationError extends BeastModeError {
  constructor(message, field, value) {
    super(message, 'VALIDATION_ERROR', 400, { field, value });
    this.name = 'ValidationError';
  }
}

/**
 * Not found error
 */
class NotFoundError extends BeastModeError {
  constructor(resource, id) {
    super(`${resource} not found`, 'NOT_FOUND', 404, { resource, id });
    this.name = 'NotFoundError';
  }
}

/**
 * Authentication error
 */
class AuthenticationError extends BeastModeError {
  constructor(message = 'Authentication required') {
    super(message, 'AUTHENTICATION_ERROR', 401);
    this.name = 'AuthenticationError';
  }
}

/**
 * Authorization error
 */
class AuthorizationError extends BeastModeError {
  constructor(message = 'Insufficient permissions') {
    super(message, 'AUTHORIZATION_ERROR', 403);
    this.name = 'AuthorizationError';
  }
}

/**
 * Rate limit error
 */
class RateLimitError extends BeastModeError {
  constructor(message = 'Rate limit exceeded', retryAfter = 60) {
    super(message, 'RATE_LIMIT_ERROR', 429, { retryAfter });
    this.name = 'RateLimitError';
  }
}

/**
 * Handle errors in API routes
 */
function handleApiError(error, req, res, next) {
  log.error('API Error:', {
    message: error.message,
    code: error.code,
    stack: error.stack,
    path: req.path,
    method: req.method
  });

  // If response already sent, delegate to default handler
  if (res.headersSent) {
    return next(error);
  }

  // Handle known error types
  if (error instanceof BeastModeError) {
    return res.status(error.statusCode).json(error.toJSON());
  }

  // Handle validation errors (Joi, etc.)
  if (error.isJoi) {
    return res.status(400).json({
      error: {
        name: 'ValidationError',
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        statusCode: 400,
        details: {
          fields: error.details.map(d => ({
            field: d.path.join('.'),
            message: d.message
          }))
        },
        timestamp: new Date().toISOString()
      }
    });
  }

  // Default error response
  const statusCode = error.statusCode || error.status || 500;
  const nodeEnv = getConfigValue('NODE_ENV', 'development');
  const message = nodeEnv === 'production'
    ? 'Internal server error'
    : error.message;

  res.status(statusCode).json({
    error: {
      name: error.name || 'Error',
      message: message,
      code: 'INTERNAL_ERROR',
      statusCode: statusCode,
      ...(nodeEnv !== 'production' && { stack: error.stack }),
      timestamp: new Date().toISOString()
    }
  });
}

/**
 * Validate required fields
 */
function validateRequired(data, fields) {
  const missing = fields.filter(field => !data[field]);
  if (missing.length > 0) {
    throw new ValidationError(
      `Missing required fields: ${missing.join(', ')}`,
      'required',
      missing
    );
  }
}

/**
 * Validate field types
 */
function validateType(value, type, fieldName) {
  const actualType = Array.isArray(value) ? 'array' : typeof value;
  if (actualType !== type) {
    throw new ValidationError(
      `Field '${fieldName}' must be of type ${type}, got ${actualType}`,
      fieldName,
      value
    );
  }
}

/**
 * Validate string length
 */
function validateLength(value, min, max, fieldName) {
  if (typeof value !== 'string') {
    throw new ValidationError(`Field '${fieldName}' must be a string`, fieldName, value);
  }
  if (value.length < min) {
    throw new ValidationError(
      `Field '${fieldName}' must be at least ${min} characters`,
      fieldName,
      value
    );
  }
  if (max && value.length > max) {
    throw new ValidationError(
      `Field '${fieldName}' must be at most ${max} characters`,
      fieldName,
      value
    );
  }
}

/**
 * Validate email format
 */
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError('Invalid email format', 'email', email);
  }
}

/**
 * Validate URL format
 */
function validateURL(url) {
  try {
    new URL(url);
  } catch {
    throw new ValidationError('Invalid URL format', 'url', url);
  }
}

/**
 * Async error wrapper for route handlers
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Retry with exponential backoff
 */
async function retryWithBackoff(fn, maxRetries = 3, initialDelay = 1000) {
  let lastError;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, attempt);
        log.warn(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
}

module.exports = {
  BeastModeError,
  ValidationError,
  NotFoundError,
  AuthenticationError,
  AuthorizationError,
  RateLimitError,
  handleApiError,
  validateRequired,
  validateType,
  validateLength,
  validateEmail,
  validateURL,
  asyncHandler,
  retryWithBackoff
};

