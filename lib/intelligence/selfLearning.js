/**
 * Self-Learning System Service
 * Implements reinforcement learning and adaptive algorithms
 * 
 * Month 9: Advanced Intelligence
 */

const { createLogger } = require('../utils/logger');
const logger = createLogger('SelfLearning');

class SelfLearning {
  constructor() {
    this.learningHistory = [];
    this.policies = new Map();
    this.rewards = new Map();
    this.adaptations = [];
  }

  /**
   * Initialize self-learning system
   */
  async initialize() {
    try {
      this.setupDefaultPolicies();
      logger.info('✅ Self-learning system initialized');
      return true;
    } catch (error) {
      logger.error('Failed to initialize self-learning system:', error);
      return false;
    }
  }

  /**
   * Setup default policies
   */
  setupDefaultPolicies() {
    // Default policy for model selection
    this.policies.set('model_selection', {
      strategy: 'explore_exploit',
      explorationRate: 0.1,
      qValues: new Map()
    });

    // Default policy for routing
    this.policies.set('routing', {
      strategy: 'reinforcement',
      rewards: new Map(),
      actions: []
    });
  }

  /**
   * Learn from experience (reinforcement learning)
   */
  learnFromExperience(action, reward, state, policyName = 'default') {
    try {
      const policy = this.policies.get(policyName);
      if (!policy) {
        throw new Error(`Policy ${policyName} not found`);
      }

      // Update Q-values (simplified Q-learning)
      if (policy.qValues) {
        const currentQ = policy.qValues.get(action) || 0;
        const learningRate = 0.1;
        const discountFactor = 0.9;
        const newQ = currentQ + learningRate * (reward - currentQ);
        policy.qValues.set(action, newQ);
      }

      // Record learning
      const learning = {
        policy: policyName,
        action,
        reward,
        state,
        timestamp: Date.now()
      };

      this.learningHistory.push(learning);

      // Keep only last 10000 learning events
      if (this.learningHistory.length > 10000) {
        this.learningHistory.shift();
      }

      logger.debug(`Learning recorded: ${policyName} - action=${action}, reward=${reward}`);
      return learning;
    } catch (error) {
      logger.error('Learning from experience failed:', error);
      return null;
    }
  }

  /**
   * Select action using policy
   */
  selectAction(state, policyName = 'default') {
    const policy = this.policies.get(policyName);
    if (!policy) {
      return null;
    }

    if (policy.strategy === 'explore_exploit') {
      return this.exploreExploit(state, policy);
    } else if (policy.strategy === 'reinforcement') {
      return this.reinforcementSelection(state, policy);
    }

    return null;
  }

  /**
   * Explore-exploit strategy
   */
  exploreExploit(state, policy) {
    const explorationRate = policy.explorationRate || 0.1;

    // Explore: random action
    if (Math.random() < explorationRate) {
      const actions = Array.from(policy.qValues.keys());
      return actions[Math.floor(Math.random() * actions.length)];
    }

    // Exploit: best known action
    let bestAction = null;
    let bestQ = -Infinity;

    for (const [action, qValue] of policy.qValues.entries()) {
      if (qValue > bestQ) {
        bestQ = qValue;
        bestAction = action;
      }
    }

    return bestAction || 'default';
  }

  /**
   * Reinforcement selection
   */
  reinforcementSelection(state, policy) {
    // Select action based on rewards
    const actions = policy.actions || [];
    if (actions.length === 0) {
      return 'default';
    }

    // Select action with highest average reward
    let bestAction = null;
    let bestReward = -Infinity;

    for (const action of actions) {
      const rewards = this.rewards.get(`${policy.name}_${action}`) || [];
      const avgReward = rewards.length > 0
        ? rewards.reduce((a, b) => a + b, 0) / rewards.length
        : 0;

      if (avgReward > bestReward) {
        bestReward = avgReward;
        bestAction = action;
      }
    }

    return bestAction || actions[0];
  }

  /**
   * Adapt based on feedback
   */
  adapt(feedback, context = {}) {
    try {
      const adaptation = {
        id: `adaptation_${Date.now()}`,
        feedback,
        context,
        changes: [],
        timestamp: Date.now()
      };

      // Analyze feedback and make adaptations
      if (feedback.performance < 0.8) {
        adaptation.changes.push({
          type: 'parameter_adjustment',
          parameter: 'learning_rate',
          adjustment: 'increase',
          reason: 'low_performance'
        });
      }

      if (feedback.errorRate > 0.05) {
        adaptation.changes.push({
          type: 'strategy_change',
          from: 'current',
          to: 'conservative',
          reason: 'high_error_rate'
        });
      }

      this.adaptations.push(adaptation);
      logger.info(`Adaptation recorded: ${adaptation.changes.length} changes`);
      return adaptation;
    } catch (error) {
      logger.error('Adaptation failed:', error);
      return null;
    }
  }

  /**
   * Online learning update
   */
  onlineLearningUpdate(newData, model) {
    try {
      // Simplified online learning
      logger.info('Online learning update initiated');

      // Would update model incrementally with new data
      const update = {
        id: `update_${Date.now()}`,
        dataPoints: newData.length,
        model: model || 'default',
        timestamp: Date.now()
      };

      this.learningHistory.push(update);
      return update;
    } catch (error) {
      logger.error('Online learning update failed:', error);
      return null;
    }
  }

  /**
   * Get learning statistics
   */
  getLearningStatistics() {
    return {
      totalLearningEvents: this.learningHistory.length,
      policies: Array.from(this.policies.keys()),
      adaptations: this.adaptations.length,
      recentAdaptations: this.adaptations.slice(-10),
      timestamp: Date.now()
    };
  }
}

// Singleton instance
let instance = null;

function getSelfLearning() {
  if (!instance) {
    instance = new SelfLearning();
  }
  return instance;
}

module.exports = {
  SelfLearning,
  getSelfLearning
};

