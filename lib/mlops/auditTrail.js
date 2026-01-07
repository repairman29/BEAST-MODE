/**
 * ML Operations Audit Trail
 * 
 * Tracks all ML operations for compliance, debugging, and transparency
 */

const { createLogger } = require('../utils/logger');
const log = createLogger('AuditTrail');
const fs = require('fs-extra');
const path = require('path');

class AuditTrail {
  constructor() {
    this.logs = [];
    this.initialized = false;
    this.auditDir = path.join(__dirname, '../../.beast-mode/audit');
  }

  /**
   * Initialize audit trail
   */
  async initialize() {
    if (this.initialized) return;

    // Ensure audit directory exists
    await fs.ensureDir(this.auditDir);

    this.initialized = true;
    log.info('✅ Audit trail initialized');
  }

  /**
   * Log an operation
   */
  async log(operation, details = {}) {
    await this.initialize();

    const auditEntry = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      operation,
      details,
      metadata: {
        nodeVersion: process.version,
        platform: process.platform,
        user: process.env.USER || 'unknown',
      },
    };

    this.logs.push(auditEntry);

    // Persist to file
    await this.persist(auditEntry);

    log.debug(`📝 Audit: ${operation}`, details);

    return auditEntry.id;
  }

  /**
   * Generate unique ID
   */
  generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Persist audit entry to file
   */
  async persist(entry) {
    const date = new Date().toISOString().split('T')[0];
    const auditFile = path.join(this.auditDir, `audit-${date}.jsonl`);

    // Append to daily log file (JSONL format)
    await fs.appendFile(auditFile, JSON.stringify(entry) + '\n');
  }

  /**
   * Log repository scan
   */
  async logRepositoryScan(repo, result) {
    return await this.log('repository_scan', {
      repo,
      success: result !== null,
      optedOut: result?.optedOut || false,
      license: result?.metadata?.license || 'unknown',
      metadataCollected: result ? Object.keys(result.metadata || {}).length : 0,
      sourceCodeCollected: false, // We never collect source code
    });
  }

  /**
   * Log model training
   */
  async logModelTraining(modelType, metrics, datasetSize) {
    return await this.log('model_training', {
      modelType,
      metrics,
      datasetSize,
      features: metrics.featureCount || 0,
      performance: {
        r2: metrics.r2 || 0,
        mae: metrics.mae || 0,
        rmse: metrics.rmse || 0,
      },
    });
  }

  /**
   * Log model deployment
   */
  async logModelDeployment(modelId, version, previousVersion) {
    return await this.log('model_deployment', {
      modelId,
      version,
      previousVersion,
      deployedAt: new Date().toISOString(),
    });
  }

  /**
   * Log data collection
   */
  async logDataCollection(source, count, metadata = {}) {
    return await this.log('data_collection', {
      source,
      count,
      metadata,
      collectedAt: new Date().toISOString(),
    });
  }

  /**
   * Log feature engineering
   */
  async logFeatureEngineering(repoCount, featureCount, featureTypes) {
    return await this.log('feature_engineering', {
      repoCount,
      featureCount,
      featureTypes,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log opt-out detection
   */
  async logOptOut(repo, reason) {
    return await this.log('opt_out_detected', {
      repo,
      reason,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log rate limit event
   */
  async logRateLimit(action, remaining, resetTime) {
    return await this.log('rate_limit', {
      action,
      remaining,
      resetTime,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Query audit logs
   */
  async query(filters = {}) {
    await this.initialize();

    const {
      operation,
      startDate,
      endDate,
      repo,
      limit = 100,
    } = filters;

    // Load relevant audit files
    const files = await this.getAuditFiles(startDate, endDate);
    const entries = [];

    for (const file of files) {
      const content = await fs.readFile(file, 'utf8');
      const lines = content.split('\n').filter(line => line.trim());

      for (const line of lines) {
        try {
          const entry = JSON.parse(line);

          // Apply filters
          if (operation && entry.operation !== operation) continue;
          if (repo && !entry.details?.repo?.includes(repo)) continue;
          if (startDate && entry.timestamp < startDate) continue;
          if (endDate && entry.timestamp > endDate) continue;

          entries.push(entry);
        } catch (error) {
          log.warn(`⚠️  Failed to parse audit entry:`, error.message);
        }
      }
    }

    // Sort by timestamp (newest first)
    entries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return entries.slice(0, limit);
  }

  /**
   * Get audit files for date range
   */
  async getAuditFiles(startDate, endDate) {
    const files = [];
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default: 30 days
    const end = endDate ? new Date(endDate) : new Date();

    // Generate date range
    const current = new Date(start);
    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0];
      const file = path.join(this.auditDir, `audit-${dateStr}.jsonl`);
      
      if (await fs.pathExists(file)) {
        files.push(file);
      }

      current.setDate(current.getDate() + 1);
    }

    return files;
  }

  /**
   * Get statistics
   */
  async getStatistics(startDate, endDate) {
    const entries = await this.query({ startDate, endDate, limit: 10000 });

    const stats = {
      total: entries.length,
      byOperation: {},
      repositoryScans: 0,
      optedOut: 0,
      modelTrainings: 0,
      dataCollections: 0,
      rateLimits: 0,
    };

    entries.forEach(entry => {
      stats.byOperation[entry.operation] = (stats.byOperation[entry.operation] || 0) + 1;

      if (entry.operation === 'repository_scan') {
        stats.repositoryScans++;
        if (entry.details?.optedOut) {
          stats.optedOut++;
        }
      } else if (entry.operation === 'model_training') {
        stats.modelTrainings++;
      } else if (entry.operation === 'data_collection') {
        stats.dataCollections++;
      } else if (entry.operation === 'rate_limit') {
        stats.rateLimits++;
      }
    });

    return stats;
  }

  /**
   * Export audit trail
   */
  async export(format = 'json', outputPath = null) {
    await this.initialize();

    if (!outputPath) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      outputPath = path.join(this.auditDir, `export-${timestamp}.${format}`);
    }

    const entries = await this.query({ limit: 10000 });

    if (format === 'json') {
      await fs.writeFile(outputPath, JSON.stringify(entries, null, 2));
    } else if (format === 'csv') {
      // Simple CSV export
      const headers = ['timestamp', 'operation', 'details'];
      const rows = entries.map(e => [
        e.timestamp,
        e.operation,
        JSON.stringify(e.details),
      ]);

      const csv = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      await fs.writeFile(outputPath, csv);
    }

    log.info(`✅ Exported ${entries.length} audit entries to ${outputPath}`);

    return outputPath;
  }
}

// Singleton instance
let instance = null;

async function getAuditTrail() {
  if (!instance) {
    instance = new AuditTrail();
    await instance.initialize();
  }
  return instance;
}

module.exports = {
  AuditTrail,
  getAuditTrail,
};

