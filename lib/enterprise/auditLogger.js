/**
 * Audit Logger
 * 
 * Logs all important actions for compliance and security
 */

const { createLogger } = require('../utils/logger');
const log = createLogger('AuditLogger');

class AuditLogger {
  constructor() {
    this.logs = []; // In-memory log storage
    this.maxLogs = 10000; // Keep last 10k logs
  }

  /**
   * Log an audit event
   */
  log(action, userId, details = {}) {
    const auditEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      action,
      userId,
      timestamp: new Date().toISOString(),
      ip: details.ip || null,
      userAgent: details.userAgent || null,
      resource: details.resource || null,
      resourceId: details.resourceId || null,
      changes: details.changes || null,
      result: details.result || 'success',
      metadata: details.metadata || {}
    };

    this.logs.push(auditEntry);

    // Keep only last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    log.info(`Audit: ${action} by ${userId}`, details);
    return auditEntry;
  }

  /**
   * Get audit logs
   */
  getLogs(filters = {}) {
    let filtered = [...this.logs];

    if (filters.userId) {
      filtered = filtered.filter(log => log.userId === filters.userId);
    }

    if (filters.action) {
      filtered = filtered.filter(log => log.action === filters.action);
    }

    if (filters.resource) {
      filtered = filtered.filter(log => log.resource === filters.resource);
    }

    if (filters.startDate) {
      filtered = filtered.filter(log => new Date(log.timestamp) >= new Date(filters.startDate));
    }

    if (filters.endDate) {
      filtered = filtered.filter(log => new Date(log.timestamp) <= new Date(filters.endDate));
    }

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Apply limit
    if (filters.limit) {
      filtered = filtered.slice(0, filters.limit);
    }

    return filtered;
  }

  /**
   * Get audit statistics
   */
  getStats(timeRange = '7d') {
    const days = timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);

    const recentLogs = this.logs.filter(log => 
      new Date(log.timestamp).getTime() >= cutoff
    );

    const stats = {
      total: recentLogs.length,
      byAction: {},
      byUser: {},
      byResult: { success: 0, failure: 0 },
      byResource: {}
    };

    recentLogs.forEach(log => {
      stats.byAction[log.action] = (stats.byAction[log.action] || 0) + 1;
      stats.byUser[log.userId] = (stats.byUser[log.userId] || 0) + 1;
      stats.byResult[log.result] = (stats.byResult[log.result] || 0) + 1;
      if (log.resource) {
        stats.byResource[log.resource] = (stats.byResource[log.resource] || 0) + 1;
      }
    });

    return stats;
  }

  /**
   * Export audit logs
   */
  exportLogs(filters = {}, format = 'json') {
    const logs = this.getLogs(filters);

    if (format === 'csv') {
      const headers = ['id', 'action', 'userId', 'timestamp', 'resource', 'result'];
      const rows = logs.map(log => [
        log.id,
        log.action,
        log.userId,
        log.timestamp,
        log.resource || '',
        log.result
      ]);

      return {
        format: 'csv',
        data: [headers, ...rows].map(row => row.join(',')).join('\n')
      };
    }

    return {
      format: 'json',
      data: logs
    };
  }

  /**
   * Clear old logs
   */
  clearLogs(olderThanDays = 90) {
    const cutoff = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000);
    const beforeCount = this.logs.length;
    
    this.logs = this.logs.filter(log => 
      new Date(log.timestamp).getTime() >= cutoff
    );

    const removed = beforeCount - this.logs.length;
    log.info(`Cleared ${removed} audit logs older than ${olderThanDays} days`);
    return { removed, remaining: this.logs.length };
  }
}

// Singleton instance
let auditLoggerInstance = null;

function getAuditLogger() {
  if (!auditLoggerInstance) {
    auditLoggerInstance = new AuditLogger();
  }
  return auditLoggerInstance;
}

module.exports = {
  AuditLogger,
  getAuditLogger
};
