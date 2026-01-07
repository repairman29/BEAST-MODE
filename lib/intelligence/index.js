/**
 * BEAST MODE Intelligence Module Exports
 * CLI-friendly wrapper functions for intelligence operations
 */

const { createLogger } = require('../utils/logger');
const log = createLogger('intelligence');

/**
 * Run organization quality intelligence analysis
 */
async function runIntelligenceAnalysis(options = {}) {
  const { type = 'quality', deep = false } = options;

  try {
    const { OrganizationQualityIntelligence } = require('./organization-quality-intelligence');
    const intelligence = new OrganizationQualityIntelligence();
    await intelligence.initialize();

    let result;
    if (type === 'quality') {
      result = await intelligence.analyzeOrganizationQuality({ deep });
    } else if (type === 'team') {
      result = await intelligence.analyzeTeamPerformance({ deep });
    } else if (type === 'repo') {
      result = await intelligence.analyzeRepositoryQuality({ deep });
    } else {
      throw new Error(`Unknown analysis type: ${type}`);
    }

    log.info(`✅ Intelligence analysis complete (${type})`);
    return result;
  } catch (error) {
    log.error('Intelligence analysis failed:', error);
    throw error;
  }
}

/**
 * Run predictive analytics
 */
async function runPredictiveAnalytics(options = {}) {
  const { metric = 'quality', horizon = 30 } = options;

  try {
    const { PredictiveDevelopmentAnalytics } = require('./predictive-development-analytics');
    const analytics = new PredictiveDevelopmentAnalytics();
    await analytics.initialize();

    const prediction = await analytics.predict({
      metric,
      horizon: parseInt(horizon)
    });

    log.info(`✅ Predictive analytics complete (${metric}, ${horizon} days)`);
    return prediction;
  } catch (error) {
    log.error('Predictive analytics failed:', error);
    throw error;
  }
}

/**
 * Run team performance optimization
 */
async function runTeamOptimization(options = {}) {
  const { team = null, auto = false } = options;

  try {
    const { AutomatedTeamOptimization } = require('./automated-team-optimization');
    const optimizer = new AutomatedTeamOptimization();
    await optimizer.initialize();

    const optimization = await optimizer.optimizeTeam({
      teamId: team,
      autoApply: auto
    });

    log.info(`✅ Team optimization complete${team ? ` for ${team}` : ''}`);
    return optimization;
  } catch (error) {
    log.error('Team optimization failed:', error);
    throw error;
  }
}

/**
 * Manage enterprise knowledge
 */
async function manageKnowledge(options = {}) {
  const { search = null, capture = false } = options;

  try {
    const { EnterpriseKnowledgeManagement } = require('./enterprise-knowledge-management');
    const knowledge = new EnterpriseKnowledgeManagement();
    await knowledge.initialize();

    if (search) {
      const results = await knowledge.searchKnowledge(search);
      log.info(`Found ${results.length} knowledge items`);
      return results;
    }

    if (capture) {
      const captured = await knowledge.captureKnowledge();
      log.info(`✅ Captured new knowledge`);
      return captured;
    }

    log.info('Use --search <query> to search or --capture to capture new knowledge');
    return { message: 'No action specified' };
  } catch (error) {
    log.error('Knowledge management failed:', error);
    throw error;
  }
}

module.exports = {
  runIntelligenceAnalysis,
  runPredictiveAnalytics,
  runTeamOptimization,
  manageKnowledge
};

