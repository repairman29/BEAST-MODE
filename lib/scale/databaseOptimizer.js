/**
 * Database Optimizer Service
 * Optimizes database queries, indexes, and connections
 * 
 * Month 10: Scale & Performance
 */

const { createLogger } = require('../utils/logger');
const logger = createLogger('DatabaseOptimizer');

class DatabaseOptimizer {
  constructor() {
    this.queryHistory = [];
    this.slowQueries = [];
    this.indexRecommendations = [];
    this.connectionPool = null;
  }

  /**
   * Initialize database optimizer
   */
  async initialize(options = {}) {
    try {
      this.config = {
        slowQueryThreshold: 1000, // ms
        maxConnections: 100,
        connectionTimeout: 30000,
        ...options
      };

      this.setupConnectionPool();
      logger.info('✅ Database optimizer initialized');
      return true;
    } catch (error) {
      logger.error('Failed to initialize database optimizer:', error);
      return false;
    }
  }

  /**
   * Setup connection pool
   */
  setupConnectionPool() {
    // Simplified connection pool
    this.connectionPool = {
      connections: [],
      maxConnections: this.config.maxConnections,
      activeConnections: 0,
      waitingQueue: []
    };
  }

  /**
   * Get connection from pool
   */
  async getConnection() {
    return new Promise((resolve) => {
      if (this.connectionPool.activeConnections < this.connectionPool.maxConnections) {
        this.connectionPool.activeConnections++;
        resolve({ id: `conn_${Date.now()}` });
      } else {
        // Add to waiting queue
        this.connectionPool.waitingQueue.push(resolve);
      }
    });
  }

  /**
   * Release connection to pool
   */
  releaseConnection(connection) {
    this.connectionPool.activeConnections--;
    
    if (this.connectionPool.waitingQueue.length > 0) {
      const next = this.connectionPool.waitingQueue.shift();
      this.connectionPool.activeConnections++;
      next({ id: `conn_${Date.now()}` });
    }
  }

  /**
   * Optimize query
   */
  async optimizeQuery(query, params = []) {
    try {
      const startTime = Date.now();

      // Analyze query
      const analysis = this.analyzeQuery(query);

      // Optimize query
      const optimizedQuery = this.rewriteQuery(query, analysis);

      // Execute query (simulated)
      const result = await this.executeQuery(optimizedQuery, params);

      const duration = Date.now() - startTime;

      // Record query
      this.recordQuery(query, optimizedQuery, duration, analysis);

      // Check for slow queries
      if (duration > this.config.slowQueryThreshold) {
        this.recordSlowQuery(query, duration, analysis);
      }

      return result;
    } catch (error) {
      logger.error('Query optimization failed:', error);
      throw error;
    }
  }

  /**
   * Analyze query
   */
  analyzeQuery(query) {
    const analysis = {
      type: this.getQueryType(query),
      tables: this.extractTables(query),
      joins: this.countJoins(query),
      whereClauses: this.countWhereClauses(query),
      hasIndex: false,
      recommendations: []
    };

    // Check for missing indexes
    if (analysis.whereClauses > 0 && !analysis.hasIndex) {
      analysis.recommendations.push({
        type: 'index',
        table: analysis.tables[0],
        columns: this.extractWhereColumns(query),
        reason: 'Missing index on WHERE columns'
      });
    }

    return analysis;
  }

  /**
   * Get query type
   */
  getQueryType(query) {
    const upperQuery = query.toUpperCase().trim();
    if (upperQuery.startsWith('SELECT')) return 'SELECT';
    if (upperQuery.startsWith('INSERT')) return 'INSERT';
    if (upperQuery.startsWith('UPDATE')) return 'UPDATE';
    if (upperQuery.startsWith('DELETE')) return 'DELETE';
    return 'UNKNOWN';
  }

  /**
   * Extract tables
   */
  extractTables(query) {
    const tables = [];
    const fromMatch = query.match(/FROM\s+(\w+)/i);
    const joinMatch = query.match(/JOIN\s+(\w+)/gi);
    
    if (fromMatch) {
      tables.push(fromMatch[1]);
    }
    
    if (joinMatch) {
      joinMatch.forEach(match => {
        const table = match.match(/\w+$/);
        if (table) tables.push(table[0]);
      });
    }

    return tables;
  }

  /**
   * Count joins
   */
  countJoins(query) {
    return (query.match(/JOIN/gi) || []).length;
  }

  /**
   * Count WHERE clauses
   */
  countWhereClauses(query) {
    const whereMatch = query.match(/WHERE\s+(.+?)(?:ORDER|GROUP|LIMIT|$)/i);
    if (!whereMatch) return 0;
    
    return (whereMatch[1].match(/AND|OR/gi) || []).length + 1;
  }

  /**
   * Extract WHERE columns
   */
  extractWhereColumns(query) {
    const whereMatch = query.match(/WHERE\s+(.+?)(?:ORDER|GROUP|LIMIT|$)/i);
    if (!whereMatch) return [];

    const columns = [];
    const conditions = whereMatch[1].split(/AND|OR/i);
    
    conditions.forEach(condition => {
      const columnMatch = condition.match(/(\w+)\s*[=<>]/);
      if (columnMatch) {
        columns.push(columnMatch[1]);
      }
    });

    return columns;
  }

  /**
   * Rewrite query
   */
  rewriteQuery(query, analysis) {
    let optimized = query;

    // Add LIMIT if missing for SELECT queries
    if (analysis.type === 'SELECT' && !query.match(/LIMIT/i)) {
      optimized += ' LIMIT 1000';
    }

    // Optimize JOINs
    if (analysis.joins > 3) {
      // Would suggest query restructuring
      logger.warn('Query has many JOINs, consider restructuring');
    }

    return optimized;
  }

  /**
   * Execute query (simulated)
   */
  async executeQuery(query, params) {
    // Simulate query execution
    await new Promise(resolve => setTimeout(resolve, 10));
    return { rows: [], count: 0 };
  }

  /**
   * Record query
   */
  recordQuery(original, optimized, duration, analysis) {
    const record = {
      original,
      optimized,
      duration,
      analysis,
      timestamp: Date.now()
    };

    this.queryHistory.push(record);

    // Keep only last 10000 queries
    if (this.queryHistory.length > 10000) {
      this.queryHistory.shift();
    }
  }

  /**
   * Record slow query
   */
  recordSlowQuery(query, duration, analysis) {
    const slowQuery = {
      query,
      duration,
      analysis,
      timestamp: Date.now()
    };

    this.slowQueries.push(slowQuery);
    logger.warn(`Slow query detected: ${duration}ms`, { query: query.substring(0, 100) });

    // Keep only last 1000 slow queries
    if (this.slowQueries.length > 1000) {
      this.slowQueries.shift();
    }
  }

  /**
   * Get index recommendations
   */
  getIndexRecommendations() {
    const recommendations = new Map();

    // Analyze slow queries
    for (const slowQuery of this.slowQueries) {
      for (const rec of slowQuery.analysis.recommendations) {
        if (rec.type === 'index') {
          const key = `${rec.table}.${rec.columns.join(',')}`;
          if (!recommendations.has(key)) {
            recommendations.set(key, {
              table: rec.table,
              columns: rec.columns,
              count: 0,
              avgDuration: 0
            });
          }
          const recData = recommendations.get(key);
          recData.count++;
          recData.avgDuration = (recData.avgDuration * (recData.count - 1) + slowQuery.duration) / recData.count;
        }
      }
    }

    return Array.from(recommendations.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  /**
   * Get query statistics
   */
  getQueryStatistics() {
    const totalQueries = this.queryHistory.length;
    const avgDuration = totalQueries > 0
      ? this.queryHistory.reduce((sum, q) => sum + q.duration, 0) / totalQueries
      : 0;

    const byType = {};
    for (const query of this.queryHistory) {
      const type = query.analysis.type;
      byType[type] = (byType[type] || 0) + 1;
    }

    return {
      totalQueries,
      slowQueries: this.slowQueries.length,
      avgDuration: avgDuration.toFixed(2) + 'ms',
      byType,
      connectionPool: {
        active: this.connectionPool.activeConnections,
        max: this.connectionPool.maxConnections,
        waiting: this.connectionPool.waitingQueue.length
      },
      timestamp: Date.now()
    };
  }
}

// Singleton instance
let instance = null;

function getDatabaseOptimizer() {
  if (!instance) {
    instance = new DatabaseOptimizer();
  }
  return instance;
}

module.exports = {
  DatabaseOptimizer,
  getDatabaseOptimizer
};

