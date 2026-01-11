/**
 * Oracle Integration for Brand/Reputation/Secret Interceptor
 * 
 * Allows Oracle to:
 * - Query intercepted commits from Supabase
 * - Understand what was blocked and why
 * - Provide context to AI agents about commit safety
 * - Access intercepted data that bots need
 */

const { createClient } = require('@supabase/supabase-js');

let createLogger;
try {
  const loggerModule = require('../utils/logger');
  createLogger = loggerModule.createLogger || loggerModule.default?.createLogger || loggerModule;
} catch (e) {
  createLogger = (name) => ({
    info: (...args) => console.log(`[${name}]`, ...args),
    warn: (...args) => console.warn(`[${name}]`, ...args),
    error: (...args) => console.error(`[${name}]`, ...args),
    debug: (...args) => console.debug(`[${name}]`, ...args),
  });
}

const log = createLogger('OracleInterceptorIntegration');

class OracleInterceptorIntegration {
  constructor() {
    this.supabase = null;
    this.initialized = false;
  }

  /**
   * Initialize Supabase connection
   */
  async initialize() {
    if (this.initialized) return;

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        log.warn('⚠️  Supabase credentials not found - interceptor integration unavailable');
        return;
      }

      this.supabase = createClient(supabaseUrl, supabaseKey);
      this.initialized = true;
      log.info('✅ Oracle Interceptor Integration initialized');
    } catch (error) {
      log.warn('⚠️  Could not initialize Oracle Interceptor Integration:', error.message);
    }
  }

  /**
   * Query intercepted commits for Oracle knowledge
   */
  async queryInterceptedCommits(query, options = {}) {
    if (!this.supabase) {
      await this.initialize();
      if (!this.supabase) {
        return [];
      }
    }

    try {
      const {
        repoName = null,
        limit = 50,
        status = null,
        severity = null
      } = options;

      let queryBuilder = this.supabase
        .from('intercepted_commits')
        .select('*')
        .order('intercepted_at', { ascending: false })
        .limit(limit);

      if (repoName) {
        queryBuilder = queryBuilder.eq('repo_name', repoName);
      }

      if (status) {
        queryBuilder = queryBuilder.eq('status', status);
      }

      // If query provided, search in file_path and issues
      if (query) {
        queryBuilder = queryBuilder.or(`file_path.ilike.%${query}%,reason.ilike.%${query}%`);
      }

      const { data, error } = await queryBuilder;

      if (error) {
        log.warn('⚠️  Could not query intercepted commits:', error.message);
        return [];
      }

      // Filter by severity if specified
      let results = data || [];
      if (severity) {
        results = results.filter(item => {
          const severities = item.issues?.map(i => i.severity) || [];
          return severities.includes(severity);
        });
      }

      return results;
    } catch (error) {
      log.warn('⚠️  Error querying intercepted commits:', error.message);
      return [];
    }
  }

  /**
   * Get intercepted data for a specific file
   */
  async getInterceptedFile(filePath, repoName = null) {
    if (!this.supabase) {
      await this.initialize();
      if (!this.supabase) {
        return null;
      }
    }

    try {
      let queryBuilder = this.supabase
        .from('intercepted_commits')
        .select('*')
        .eq('file_path', filePath)
        .order('intercepted_at', { ascending: false })
        .limit(1);

      if (repoName) {
        queryBuilder = queryBuilder.eq('repo_name', repoName);
      }

      const { data, error } = await queryBuilder;

      if (error) {
        log.warn('⚠️  Could not get intercepted file:', error.message);
        return null;
      }

      return data && data.length > 0 ? data[0] : null;
    } catch (error) {
      log.warn('⚠️  Error getting intercepted file:', error.message);
      return null;
    }
  }

  /**
   * Get summary statistics for Oracle context
   */
  async getInterceptorStats(repoName = null) {
    if (!this.supabase) {
      await this.initialize();
      if (!this.supabase) {
        return null;
      }
    }

    try {
      let queryBuilder = this.supabase
        .from('intercepted_commits')
        .select('*');

      if (repoName) {
        queryBuilder = queryBuilder.eq('repo_name', repoName);
      }

      const { data, error } = await queryBuilder;

      if (error) {
        log.warn('⚠️  Could not get interceptor stats:', error.message);
        return null;
      }

      const commits = data || [];
      const stats = {
        total: commits.length,
        byType: {},
        bySeverity: { critical: 0, high: 0, medium: 0, low: 0 },
        byStatus: {},
        recent: commits.slice(0, 10).map(c => ({
          file: c.file_path,
          issues: c.issues?.length || 0,
          intercepted_at: c.intercepted_at
        }))
      };

      commits.forEach(commit => {
        // Count by issue type
        commit.issues?.forEach(issue => {
          stats.byType[issue.type] = (stats.byType[issue.type] || 0) + 1;
          stats.bySeverity[issue.severity] = (stats.bySeverity[issue.severity] || 0) + 1;
        });

        // Count by status
        stats.byStatus[commit.status] = (stats.byStatus[commit.status] || 0) + 1;
      });

      return stats;
    } catch (error) {
      log.warn('⚠️  Error getting interceptor stats:', error.message);
      return null;
    }
  }

  /**
   * Provide Oracle context about commit safety
   */
  async getCommitSafetyContext(filePath, repoName = null) {
    const intercepted = await this.getInterceptedFile(filePath, repoName);
    
    if (!intercepted) {
      return {
        safe: true,
        message: 'File has not been intercepted - appears safe to commit'
      };
    }

    return {
      safe: false,
      intercepted: true,
      file: filePath,
      issues: intercepted.issues || [],
      reason: intercepted.reason,
      intercepted_at: intercepted.intercepted_at,
      message: `File was intercepted with ${intercepted.issues?.length || 0} issue(s). Review before committing.`,
      recommendations: this.generateRecommendations(intercepted.issues || [])
    };
  }

  /**
   * Generate recommendations based on issues
   */
  generateRecommendations(issues) {
    const recommendations = [];

    issues.forEach(issue => {
      if (issue.type === 'secret') {
        recommendations.push({
          type: 'secret',
          action: 'Remove secret and use environment variable',
          example: `Replace ${issue.match} with process.env.${issue.name.toUpperCase().replace(/\s+/g, '_')}`
        });
      } else if (issue.type === 'internal_document') {
        recommendations.push({
          type: 'internal_document',
          action: 'Store in Supabase instead of committing',
          example: 'Use intercepted_commits table or app_config table'
        });
      } else if (issue.type === 'business_content') {
        recommendations.push({
          type: 'business_content',
          action: 'Remove business-sensitive content or store in Supabase',
          example: 'Move to Supabase app_config or secrets table'
        });
      }
    });

    return recommendations;
  }
}

// Singleton instance
let oracleInterceptorIntegration = null;

function getOracleInterceptorIntegration() {
  if (!oracleInterceptorIntegration) {
    oracleInterceptorIntegration = new OracleInterceptorIntegration();
  }
  return oracleInterceptorIntegration;
}

module.exports = {
  OracleInterceptorIntegration,
  getOracleInterceptorIntegration
};
