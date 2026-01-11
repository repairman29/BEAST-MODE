/**
 * Deployment Automation Service
 * Automates model deployment, versioning, and rollback
 * 
 * Month 6: Week 3 - Production Deployment
 */

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
const { getProductionDeployment } = require('./productionDeployment');
const logger = createLogger('DeploymentAutomation');

class DeploymentAutomation {
  constructor() {
    this.deploymentHistory = [];
    this.rollbackStack = [];
    this.autoDeployEnabled = false;
  }

  /**
   * Initialize deployment automation
   */
  async initialize() {
    try {
      this.productionDeployment = getProductionDeployment();
      logger.info('✅ Deployment automation initialized');
      return true;
    } catch (error) {
      logger.error('Failed to initialize deployment automation:', error);
      return false;
    }
  }

  /**
   * Automated deployment with checks
   */
  async autoDeploy(modelPath, modelVersion, options = {}) {
    try {
      logger.info(`🚀 Auto-deploying model: ${modelVersion}`);

      // Pre-deployment checks
      const checks = await this.runPreDeploymentChecks(modelPath, modelVersion);
      if (!checks.passed) {
        logger.error('Pre-deployment checks failed:', checks.errors);
        return {
          success: false,
          error: 'Pre-deployment checks failed',
          checks
        };
      }

      // Backup current model
      const backup = await this.backupCurrentModel();
      if (backup) {
        this.rollbackStack.push(backup);
      }

      // Deploy model
      const deployment = await this.productionDeployment.deployModel(
        modelPath,
        modelVersion,
        options
      );

      if (deployment.success) {
        // Post-deployment validation
        const validation = await this.validateDeployment(modelVersion);
        
        // Record deployment
        this.deploymentHistory.push({
          modelVersion,
          timestamp: Date.now(),
          deployment,
          validation,
          backup
        });

        logger.info(`✅ Model ${modelVersion} deployed successfully`);
        return {
          success: true,
          deployment,
          validation
        };
      } else {
        // Rollback on failure
        if (backup) {
          await this.rollback(backup);
        }
        return {
          success: false,
          error: 'Deployment failed',
          deployment
        };
      }
    } catch (error) {
      logger.error('Auto-deployment failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Run pre-deployment checks
   */
  async runPreDeploymentChecks(modelPath, modelVersion) {
    const errors = [];
    const warnings = [];

    // Check model file exists
    try {
      const fs = require('fs').promises;
      await fs.access(modelPath);
    } catch (error) {
      errors.push('Model file not found');
    }

    // Check model version format
    if (!modelVersion || typeof modelVersion !== 'string') {
      errors.push('Invalid model version');
    }

    // Check disk space (simplified)
    try {
      const fs = require('fs');
      const stats = fs.statSync(modelPath);
      if (stats.size > 100 * 1024 * 1024) { // 100MB
        warnings.push('Model file is large (>100MB)');
      }
    } catch (error) {
      // Ignore
    }

    return {
      passed: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Backup current model
   */
  async backupCurrentModel() {
    try {
      const { getMLModelIntegration } = require('./mlModelIntegration');
      const mlIntegration = await getMLModelIntegration();
      
      if (mlIntegration.modelPath) {
        const fs = require('fs').promises;
        const path = require('path');
        
        const backupPath = path.join(
          path.dirname(mlIntegration.modelPath),
          `backup_${Date.now()}.json`
        );
        
        await fs.copyFile(mlIntegration.modelPath, backupPath);
        
        return {
          originalPath: mlIntegration.modelPath,
          backupPath,
          timestamp: Date.now()
        };
      }
    } catch (error) {
      logger.warn('Backup failed:', error.message);
    }
    return null;
  }

  /**
   * Validate deployment
   */
  async validateDeployment(modelVersion) {
    try {
      const { getMLModelIntegration } = require('./mlModelIntegration');
      const mlIntegration = await getMLModelIntegration();
      await mlIntegration.initialize();

      // Test prediction
      const testContext = {
        qualityScore: 7.5,
        healthScore: 8.0,
        csat: 0.85
      };

      const prediction = mlIntegration.predictQualitySync(testContext);
      
      return {
        valid: prediction && prediction.predictedQuality !== undefined,
        testPrediction: prediction,
        timestamp: Date.now()
      };
    } catch (error) {
      logger.warn('Deployment validation failed:', error.message);
      return {
        valid: false,
        error: error.message,
        timestamp: Date.now()
      };
    }
  }

  /**
   * Rollback to previous version
   */
  async rollback(backup) {
    try {
      logger.info(`Rolling back to backup: ${backup.backupPath}`);

      const fs = require('fs').promises;
      await fs.copyFile(backup.backupPath, backup.originalPath);

      // Reinitialize ML integration
      const { getMLModelIntegration } = require('./mlModelIntegration');
      const mlIntegration = await getMLModelIntegration();
      await mlIntegration.initialize();

      logger.info('✅ Rollback successful');
      return {
        success: true,
        restored: backup
      };
    } catch (error) {
      logger.error('Rollback failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get deployment history
   */
  getDeploymentHistory() {
    return this.deploymentHistory;
  }

  /**
   * Get rollback stack
   */
  getRollbackStack() {
    return this.rollbackStack;
  }
}

// Singleton instance
let instance = null;

function getDeploymentAutomation() {
  if (!instance) {
    instance = new DeploymentAutomation();
  }
  return instance;
}

module.exports = {
  DeploymentAutomation,
  getDeploymentAutomation
};

