/**
 * Model Marketplace
 * 
 * Public model sharing, ratings, and community features
 */

const { createLogger } = require('../utils/logger');
const log = createLogger('ModelMarketplace');

class ModelMarketplace {
  constructor() {
    this.publicModels = new Map(); // modelId -> model data
    this.ratings = new Map(); // modelId -> ratings[]
    this.reviews = new Map(); // modelId -> reviews[]
    this.downloads = new Map(); // modelId -> download count
  }

  /**
   * Publish model to marketplace
   */
  publishModel(modelId, userId, metadata = {}) {
    const publicModel = {
      modelId,
      userId,
      name: metadata.name || `Model ${modelId}`,
      description: metadata.description || '',
      category: metadata.category || 'general',
      tags: metadata.tags || [],
      publishedAt: new Date().toISOString(),
      downloads: 0,
      rating: 0,
      reviewCount: 0,
      status: 'published'
    };

    this.publicModels.set(modelId, publicModel);
    this.downloads.set(modelId, 0);
    this.ratings.set(modelId, []);
    this.reviews.set(modelId, []);

    log.info(`Model published to marketplace: ${modelId} by ${userId}`);
    return publicModel;
  }

  /**
   * Rate a model
   */
  rateModel(modelId, userId, rating, comment = '') {
    if (!this.publicModels.has(modelId)) {
      throw new Error(`Model not found in marketplace: ${modelId}`);
    }

    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    const ratings = this.ratings.get(modelId) || [];
    
    // Remove existing rating from same user
    const existingIndex = ratings.findIndex(r => r.userId === userId);
    if (existingIndex > -1) {
      ratings.splice(existingIndex, 1);
    }

    ratings.push({
      userId,
      rating,
      comment,
      timestamp: new Date().toISOString()
    });

    this.ratings.set(modelId, ratings);

    // Update model rating
    const model = this.publicModels.get(modelId);
    const avgRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
    model.rating = avgRating;
    model.reviewCount = ratings.length;
    this.publicModels.set(modelId, model);

    log.info(`Model rated: ${modelId} by ${userId} (${rating}/5)`);
    return { modelId, rating: avgRating, count: ratings.length };
  }

  /**
   * Get model ratings
   */
  getRatings(modelId) {
    return this.ratings.get(modelId) || [];
  }

  /**
   * Search marketplace
   */
  search(query, filters = {}) {
    let results = Array.from(this.publicModels.values());

    // Text search
    if (query) {
      const lowerQuery = query.toLowerCase();
      results = results.filter(model =>
        model.name.toLowerCase().includes(lowerQuery) ||
        model.description.toLowerCase().includes(lowerQuery) ||
        model.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
      );
    }

    // Category filter
    if (filters.category) {
      results = results.filter(model => model.category === filters.category);
    }

    // Rating filter
    if (filters.minRating) {
      results = results.filter(model => model.rating >= filters.minRating);
    }

    // Sort
    const sortBy = filters.sortBy || 'rating';
    if (sortBy === 'rating') {
      results.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'downloads') {
      results.sort((a, b) => b.downloads - a.downloads);
    } else if (sortBy === 'recent') {
      results.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    }

    // Limit
    if (filters.limit) {
      results = results.slice(0, filters.limit);
    }

    return results;
  }

  /**
   * Record download
   */
  recordDownload(modelId) {
    if (!this.publicModels.has(modelId)) {
      return { downloaded: false };
    }

    const downloads = (this.downloads.get(modelId) || 0) + 1;
    this.downloads.set(modelId, downloads);

    const model = this.publicModels.get(modelId);
    model.downloads = downloads;
    this.publicModels.set(modelId, model);

    return { modelId, downloads };
  }

  /**
   * Get popular models
   */
  getPopularModels(limit = 10) {
    const models = Array.from(this.publicModels.values());
    return models
      .sort((a, b) => {
        // Sort by rating * downloads (popularity score)
        const scoreA = a.rating * Math.log(a.downloads + 1);
        const scoreB = b.rating * Math.log(b.downloads + 1);
        return scoreB - scoreA;
      })
      .slice(0, limit);
  }
}

// Singleton instance
let marketplaceInstance = null;

function getModelMarketplace() {
  if (!marketplaceInstance) {
    marketplaceInstance = new ModelMarketplace();
  }
  return marketplaceInstance;
}

module.exports = {
  ModelMarketplace,
  getModelMarketplace
};
