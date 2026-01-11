/**
 * BEAST MODE Vercel Integration
 * 
 * Provides utilities for integrating BEAST MODE with Vercel deployments
 */

const { execSync } = require('child_process');

// Use unified config if available
let getUnifiedConfig = null;
try {
  const path = require('path');
  const configPath = path.join(__dirname, '../../shared-utils/unified-config');
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

class VercelIntegration {
  constructor(options = {}) {
    this.options = {
      preDeployCheck: options.preDeployCheck !== false,
      postDeployMonitor: options.postDeployMonitor !== false,
      minScore: options.minScore || 75,
      ...options
    };
  }

  /**
   * Run pre-deployment quality check
   */
  async preDeployCheck() {
    try {
      const vercelEnv = getConfigValue('VERCEL');
      if (!vercelEnv) {
        return { skipped: true, reason: 'Not in Vercel environment' };
      }

      const { QualityEngine } = require('../quality');
      const qualityEngine = new QualityEngine();
      
      // Get files to check
      const files = this.getDeploymentFiles();
      
      // Run quality check
      const results = await qualityEngine.calculateScore({
        files,
        includeRecommendations: true
      });

      // Log results
      console.log(`\n🔍 BEAST MODE Pre-Deployment Check`);
      console.log(`Quality Score: ${results.score}/100`);
      console.log(`Issues Found: ${results.issues?.length || 0}`);

      // Warn if score is low but don't block deployment
      if (results.score < this.options.minScore) {
        console.warn(`⚠️  Quality score is below recommended minimum (${this.options.minScore})`);
        console.warn(`Consider addressing issues before deploying to production.`);
      }

      return results;
    } catch (error) {
      console.error('Pre-deployment check error:', error);
      // Don't fail deployment on check errors
      return { error: error.message };
    }
  }

  /**
   * Get files included in deployment
   */
  getDeploymentFiles() {
    try {
      // Vercel provides deployment info via environment variables
      const vercelEnv = getConfigValue('VERCEL_ENV');
      const projectRoot = getConfigValue('VERCEL_PROJECT_ROOT') || process.cwd();
      
      // Get all source files (excluding node_modules, .next, etc.)
      const output = execSync(
        `find ${projectRoot} -type f -name "*.js" -o -name "*.ts" -o -name "*.tsx" -o -name "*.jsx" | grep -v node_modules | grep -v .next | grep -v dist`,
        { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }
      );
      
      return output.trim().split('\n').filter(Boolean);
    } catch (error) {
      console.error('Error getting deployment files:', error);
      return [];
    }
  }

  /**
   * Post-deployment monitoring
   */
  async postDeployMonitor() {
    try {
      const vercelEnv = getConfigValue('VERCEL');
      if (!vercelEnv) {
        return { skipped: true };
      }

      const deploymentUrl = getConfigValue('VERCEL_URL');
      const deploymentEnv = getConfigValue('VERCEL_ENV');

      console.log(`\n📊 BEAST MODE Post-Deployment Monitor`);
      console.log(`Environment: ${deploymentEnv}`);
      console.log(`URL: ${deploymentUrl}`);

      // Run health checks
      const healthCheck = await this.runHealthCheck(deploymentUrl);
      
      // Log results
      if (healthCheck.healthy) {
        console.log(`✅ Deployment is healthy`);
      } else {
        console.warn(`⚠️  Deployment health check failed`);
      }

      return healthCheck;
    } catch (error) {
      console.error('Post-deployment monitor error:', error);
      return { error: error.message };
    }
  }

  /**
   * Run health check on deployment
   */
  async runHealthCheck(url) {
    try {
      const https = require('https');
      const http = require('http');
      const { URL } = require('url');
      
      const parsedUrl = new URL(url.startsWith('http') ? url : `https://${url}`);
      const client = parsedUrl.protocol === 'https:' ? https : http;

      return new Promise((resolve) => {
        const req = client.get(parsedUrl, { timeout: 5000 }, (res) => {
          resolve({
            healthy: res.statusCode === 200 || res.statusCode === 404, // 404 is ok for root
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
   * Generate vercel.json configuration
   */
  static generateVercelConfig(options = {}) {
    return {
      buildCommand: options.buildCommand || 'npm run build',
      devCommand: options.devCommand || 'npm run dev',
      installCommand: options.installCommand || 'npm install',
      framework: options.framework || null,
      outputDirectory: options.outputDirectory || '.next',
      ignoreCommand: 'npx @beast-mode/core quality --check',
      ...options
    };
  }
}

module.exports = VercelIntegration;

