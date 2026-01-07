/**
 * BEAST MODE Railway Integration
 * 
 * Provides utilities for integrating BEAST MODE with Railway deployments
 */

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

class RailwayIntegration {
  constructor(options = {}) {
    this.options = {
      healthCheck: options.healthCheck !== false,
      autoScaling: options.autoScaling !== false,
      minScore: options.minScore || 75,
      ...options
    };
  }

  /**
   * Run deployment health check
   */
  async healthCheck() {
    try {
      const railwayEnv = getConfigValue('RAILWAY_ENVIRONMENT');
      if (!railwayEnv) {
        return { skipped: true, reason: 'Not in Railway environment' };
      }

      const serviceUrl = getConfigValue('RAILWAY_PUBLIC_DOMAIN');
      const environment = railwayEnv;

      console.log(`\n🚂 BEAST MODE Railway Health Check`);
      console.log(`Environment: ${environment}`);
      console.log(`Service URL: ${serviceUrl || 'Not available'}`);

      // Check service health
      if (serviceUrl) {
        const health = await this.checkServiceHealth(serviceUrl);
        return health;
      }

      return {
        healthy: true,
        message: 'Railway environment detected',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Railway health check error:', error);
      return { error: error.message };
    }
  }

  /**
   * Check service health
   */
  async checkServiceHealth(url) {
    try {
      const https = require('https');
      const http = require('http');
      const { URL } = require('url');
      
      const parsedUrl = new URL(url.startsWith('http') ? url : `https://${url}`);
      const client = parsedUrl.protocol === 'https:' ? https : http;

      return new Promise((resolve) => {
        const req = client.get(parsedUrl, { timeout: 5000 }, (res) => {
          resolve({
            healthy: res.statusCode < 500,
            statusCode: res.statusCode,
            timestamp: new Date().toISOString()
          });
        });

        req.on('error', () => {
          resolve({
            healthy: false,
            error: 'Connection failed',
            timestamp: new Date().toISOString()
          });
        });

        req.on('timeout', () => {
          req.destroy();
          resolve({
            healthy: false,
            error: 'Timeout',
            timestamp: new Date().toISOString()
          });
        });
      });
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Generate scaling recommendations
   */
  async generateScalingRecommendations() {
    try {
      // This would analyze metrics and provide recommendations
      // For now, return basic recommendations
      return {
        recommendations: [
          'Monitor memory usage - consider scaling if consistently above 80%',
          'Check CPU utilization - scale horizontally if needed',
          'Review database connection pool size',
          'Consider caching for frequently accessed data'
        ],
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error generating scaling recommendations:', error);
      return { error: error.message };
    }
  }

  /**
   * Generate railway.json configuration
   */
  static generateRailwayConfig(options = {}) {
    return {
      build: {
        builder: options.builder || 'NIXPACKS',
        buildCommand: options.buildCommand || 'npm run build'
      },
      deploy: {
        startCommand: options.startCommand || 'npm start',
        healthcheckPath: options.healthcheckPath || '/health',
        healthcheckTimeout: options.healthcheckTimeout || 100,
        restartPolicyType: options.restartPolicyType || 'ON_FAILURE',
        restartPolicyMaxRetries: options.restartPolicyMaxRetries || 10
      },
      ...options
    };
  }
}

module.exports = RailwayIntegration;

