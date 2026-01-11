/**
 * Business Intelligence Integration Service
 * Integrates with BI tools and data warehouses
 * 
 * Month 9: Advanced Analytics & Intelligence
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
const logger = createLogger('BIIntegration');

class BIIntegration {
  constructor() {
    this.exportFormats = ['csv', 'json', 'xlsx', 'parquet'];
    this.integrations = new Map();
    this.exportHistory = [];
  }

  /**
   * Initialize BI integration
   */
  async initialize() {
    try {
      this.setupDefaultIntegrations();
      logger.info('✅ BI integration initialized');
      return true;
    } catch (error) {
      logger.error('Failed to initialize BI integration:', error);
      return false;
    }
  }

  /**
   * Setup default integrations
   */
  setupDefaultIntegrations() {
    // Tableau integration (placeholder)
    this.integrations.set('tableau', {
      name: 'Tableau',
      enabled: false,
      endpoint: null,
      format: 'csv'
    });

    // Power BI integration (placeholder)
    this.integrations.set('powerbi', {
      name: 'Power BI',
      enabled: false,
      endpoint: null,
      format: 'csv'
    });

    // Data warehouse integration (placeholder)
    this.integrations.set('warehouse', {
      name: 'Data Warehouse',
      enabled: false,
      endpoint: null,
      format: 'parquet'
    });
  }

  /**
   * Export data for BI
   */
  async exportForBI(data, format = 'csv', options = {}) {
    try {
      logger.info(`Exporting data for BI: ${format}`);

      let exported = null;

      switch (format) {
        case 'csv':
          exported = this.exportToCSV(data);
          break;
        case 'json':
          exported = JSON.stringify(data, null, 2);
          break;
        case 'xlsx':
          exported = this.exportToXLSX(data);
          break;
        case 'parquet':
          exported = this.exportToParquet(data);
          break;
        default:
          exported = this.exportToCSV(data);
      }

      const exportRecord = {
        id: `export_${Date.now()}`,
        format,
        size: exported.length,
        timestamp: Date.now(),
        options
      };

      this.exportHistory.push(exportRecord);

      return {
        data: exported,
        format,
        size: exported.length,
        exportId: exportRecord.id
      };
    } catch (error) {
      logger.error('BI export failed:', error);
      return null;
    }
  }

  /**
   * Export to CSV
   */
  exportToCSV(data) {
    if (!Array.isArray(data) || data.length === 0) {
      return '';
    }

    const headers = Object.keys(data[0]);
    const rows = [headers.join(',')];

    for (const item of data) {
      const values = headers.map(h => {
        const value = item[h];
        if (value === null || value === undefined) return '';
        if (typeof value === 'string') return `"${value.replace(/"/g, '""')}"`;
        return value;
      });
      rows.push(values.join(','));
    }

    return rows.join('\n');
  }

  /**
   * Export to XLSX (placeholder)
   */
  exportToXLSX(data) {
    // Would use exceljs library
    logger.warn('XLSX export not fully implemented, using CSV');
    return this.exportToCSV(data);
  }

  /**
   * Export to Parquet (placeholder)
   */
  exportToParquet(data) {
    // Would use parquetjs library
    logger.warn('Parquet export not fully implemented, using JSON');
    return JSON.stringify(data);
  }

  /**
   * Generate BI report
   */
  async generateBIReport(reportType, data, options = {}) {
    try {
      logger.info(`Generating BI report: ${reportType}`);

      const report = {
        id: `report_${Date.now()}`,
        type: reportType,
        data: null,
        format: options.format || 'csv',
        timestamp: Date.now()
      };

      // Generate report data based on type
      switch (reportType) {
        case 'performance':
          report.data = this.generatePerformanceReport(data);
          break;
        case 'cost':
          report.data = this.generateCostReport(data);
          break;
        case 'usage':
          report.data = this.generateUsageReport(data);
          break;
        default:
          report.data = data;
      }

      // Export in requested format
      const exported = await this.exportForBI(report.data, report.format, options);
      report.exported = exported;

      return report;
    } catch (error) {
      logger.error('BI report generation failed:', error);
      return null;
    }
  }

  /**
   * Generate performance report
   */
  generatePerformanceReport(data) {
    return {
      summary: {
        totalPredictions: data.totalPredictions || 0,
        avgLatency: data.avgLatency || 0,
        accuracy: data.accuracy || 0
      },
      metrics: data.metrics || [],
      trends: data.trends || []
    };
  }

  /**
   * Generate cost report
   */
  generateCostReport(data) {
    return {
      summary: {
        totalCost: data.totalCost || 0,
        avgCostPerPrediction: data.avgCostPerPrediction || 0,
        costByOperation: data.costByOperation || {}
      },
      breakdown: data.breakdown || []
    };
  }

  /**
   * Generate usage report
   */
  generateUsageReport(data) {
    return {
      summary: {
        totalUsage: data.totalUsage || 0,
        activeUsers: data.activeUsers || 0,
        usageByTenant: data.usageByTenant || {}
      },
      details: data.details || []
    };
  }

  /**
   * Configure BI integration
   */
  configureIntegration(integrationId, config) {
    const integration = this.integrations.get(integrationId);
    if (!integration) {
      throw new Error(`Integration ${integrationId} not found`);
    }

    Object.assign(integration, config);
    this.integrations.set(integrationId, integration);

    logger.info(`BI integration configured: ${integrationId}`);
    return integration;
  }

  /**
   * Get integration status
   */
  getIntegrationStatus(integrationId = null) {
    if (integrationId) {
      return this.integrations.get(integrationId) || null;
    }

    return Object.fromEntries(this.integrations);
  }

  /**
   * Get export history
   */
  getExportHistory(limit = 50) {
    return this.exportHistory.slice(-limit).reverse();
  }
}

// Singleton instance
let instance = null;

function getBIIntegration() {
  if (!instance) {
    instance = new BIIntegration();
  }
  return instance;
}

module.exports = {
  BIIntegration,
  getBIIntegration
};

