/**
 * Recommendation Engine Service
 * Provides intelligent recommendations using multiple strategies
 * 
 * Month 9: Advanced Intelligence
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
const logger = createLogger('RecommendationEngine');

class RecommendationEngine {
  constructor() {
    this.recommendations = new Map();
    this.userPreferences = new Map();
    this.itemFeatures = new Map();
    this.interactions = [];
  }

  /**
   * Initialize recommendation engine
   */
  async initialize() {
    try {
      logger.info('✅ Recommendation engine initialized');
      return true;
    } catch (error) {
      logger.error('Failed to initialize recommendation engine:', error);
      return false;
    }
  }

  /**
   * Generate recommendations
   */
  async recommend(userId, strategy = 'hybrid', options = {}) {
    try {
      const {
        limit = 10,
        context = {}
      } = options;

      let recommendations = [];

      switch (strategy) {
        case 'content_based':
          recommendations = this.contentBasedRecommendations(userId, limit, context);
          break;
        case 'collaborative':
          recommendations = this.collaborativeFiltering(userId, limit, context);
          break;
        case 'hybrid':
          recommendations = this.hybridRecommendations(userId, limit, context);
          break;
        default:
          recommendations = this.hybridRecommendations(userId, limit, context);
      }

      // Rank recommendations
      const ranked = this.rankRecommendations(recommendations, userId, context);

      const result = {
        userId,
        strategy,
        recommendations: ranked.slice(0, limit),
        count: ranked.length,
        timestamp: Date.now()
      };

      this.recommendations.set(`${userId}_${Date.now()}`, result);
      return result;
    } catch (error) {
      logger.error('Recommendation generation failed:', error);
      return null;
    }
  }

  /**
   * Content-based recommendations
   */
  contentBasedRecommendations(userId, limit, context) {
    const userPrefs = this.userPreferences.get(userId) || {};
    const recommendations = [];

    // Simulate content-based recommendations
    for (const [itemId, features] of this.itemFeatures.entries()) {
      const score = this.calculateContentSimilarity(userPrefs, features);
      if (score > 0.5) {
        recommendations.push({
          itemId,
          score,
          reason: 'content_similarity',
          features: Object.keys(features)
        });
      }
    }

    return recommendations;
  }

  /**
   * Collaborative filtering
   */
  collaborativeFiltering(userId, limit, context) {
    const recommendations = [];
    const userInteractions = this.interactions.filter(i => i.userId === userId);
    const similarUsers = this.findSimilarUsers(userId);

    // Get items liked by similar users
    for (const similarUser of similarUsers) {
      const similarUserInteractions = this.interactions.filter(
        i => i.userId === similarUser.userId && i.rating > 3
      );

      for (const interaction of similarUserInteractions) {
        // Check if user hasn't already interacted
        if (!userInteractions.find(i => i.itemId === interaction.itemId)) {
          recommendations.push({
            itemId: interaction.itemId,
            score: similarUser.similarity * (interaction.rating / 5),
            reason: 'similar_users_liked',
            similarUser: similarUser.userId
          });
        }
      }
    }

    return recommendations;
  }

  /**
   * Hybrid recommendations
   */
  hybridRecommendations(userId, limit, context) {
    const contentBased = this.contentBasedRecommendations(userId, limit, context);
    const collaborative = this.collaborativeFiltering(userId, limit, context);

    // Combine and deduplicate
    const combined = new Map();

    // Add content-based (weight: 0.4)
    for (const rec of contentBased) {
      const existing = combined.get(rec.itemId);
      if (existing) {
        existing.score = existing.score * 0.4 + rec.score * 0.4;
      } else {
        combined.set(rec.itemId, { ...rec, score: rec.score * 0.4 });
      }
    }

    // Add collaborative (weight: 0.6)
    for (const rec of collaborative) {
      const existing = combined.get(rec.itemId);
      if (existing) {
        existing.score = existing.score + rec.score * 0.6;
      } else {
        combined.set(rec.itemId, { ...rec, score: rec.score * 0.6 });
      }
    }

    return Array.from(combined.values());
  }

  /**
   * Calculate content similarity
   */
  calculateContentSimilarity(userPrefs, itemFeatures) {
    if (!userPrefs || Object.keys(userPrefs).length === 0) {
      return 0.5; // Default score
    }

    let similarity = 0;
    let count = 0;

    for (const [feature, userValue] of Object.entries(userPrefs)) {
      if (itemFeatures[feature] !== undefined) {
        const itemValue = itemFeatures[feature];
        similarity += 1 - Math.abs(userValue - itemValue);
        count++;
      }
    }

    return count > 0 ? similarity / count : 0.5;
  }

  /**
   * Find similar users
   */
  findSimilarUsers(userId, limit = 10) {
    const userInteractions = this.interactions.filter(i => i.userId === userId);
    const userRatings = new Map();
    for (const interaction of userInteractions) {
      userRatings.set(interaction.itemId, interaction.rating);
    }

    const similarities = [];
    const otherUsers = new Set(this.interactions.map(i => i.userId).filter(id => id !== userId));

    for (const otherUserId of otherUsers) {
      const otherUserInteractions = this.interactions.filter(i => i.userId === otherUserId);
      const otherUserRatings = new Map();
      for (const interaction of otherUserInteractions) {
        otherUserRatings.set(interaction.itemId, interaction.rating);
      }

      // Calculate cosine similarity
      const similarity = this.cosineSimilarity(userRatings, otherUserRatings);
      if (similarity > 0.3) {
        similarities.push({
          userId: otherUserId,
          similarity
        });
      }
    }

    return similarities.sort((a, b) => b.similarity - a.similarity).slice(0, limit);
  }

  /**
   * Cosine similarity
   */
  cosineSimilarity(ratings1, ratings2) {
    const commonItems = Array.from(ratings1.keys()).filter(id => ratings2.has(id));
    if (commonItems.length === 0) return 0;

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (const itemId of commonItems) {
      const r1 = ratings1.get(itemId);
      const r2 = ratings2.get(itemId);
      dotProduct += r1 * r2;
      norm1 += r1 * r1;
      norm2 += r2 * r2;
    }

    if (norm1 === 0 || norm2 === 0) return 0;
    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  /**
   * Rank recommendations
   */
  rankRecommendations(recommendations, userId, context) {
    return recommendations
      .map(rec => {
        // Boost score based on context
        let finalScore = rec.score;
        
        if (context.preferences) {
          const contextMatch = this.calculateContextMatch(rec, context.preferences);
          finalScore = finalScore * 0.7 + contextMatch * 0.3;
        }

        return {
          ...rec,
          finalScore
        };
      })
      .sort((a, b) => b.finalScore - a.finalScore);
  }

  /**
   * Calculate context match
   */
  calculateContextMatch(recommendation, contextPrefs) {
    // Simplified context matching
    return 0.7; // Placeholder
  }

  /**
   * Record user interaction
   */
  recordInteraction(userId, itemId, rating, metadata = {}) {
    const interaction = {
      userId,
      itemId,
      rating,
      timestamp: Date.now(),
      metadata
    };

    this.interactions.push(interaction);

    // Update user preferences
    this.updateUserPreferences(userId, itemId, rating);

    // Keep only last 10000 interactions
    if (this.interactions.length > 10000) {
      this.interactions.shift();
    }

    return interaction;
  }

  /**
   * Update user preferences
   */
  updateUserPreferences(userId, itemId, rating) {
    const itemFeatures = this.itemFeatures.get(itemId) || {};
    const userPrefs = this.userPreferences.get(userId) || {};

    // Update preferences based on interaction
    for (const [feature, value] of Object.entries(itemFeatures)) {
      const current = userPrefs[feature] || 0.5;
      const weight = rating / 5; // Normalize rating
      userPrefs[feature] = current * 0.8 + value * weight * 0.2; // Exponential moving average
    }

    this.userPreferences.set(userId, userPrefs);
  }

  /**
   * Set item features
   */
  setItemFeatures(itemId, features) {
    this.itemFeatures.set(itemId, features);
  }
}

// Singleton instance
let instance = null;

function getRecommendationEngine() {
  if (!instance) {
    instance = new RecommendationEngine();
  }
  return instance;
}

module.exports = {
  RecommendationEngine,
  getRecommendationEngine
};

