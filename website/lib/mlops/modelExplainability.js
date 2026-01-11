/**
 * Model Explainability Service
 * Provides feature importance, SHAP values, and prediction explanations
 * 
 * Month 6: Advanced Model Architectures
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
const logger = createLogger('ModelExplainability');

class ModelExplainability {
  constructor() {
    this.featureImportance = {};
    this.shapValues = {};
    this.explanations = [];
  }

  /**
   * Calculate feature importance
   */
  calculateFeatureImportance(model, X, y) {
    logger.info('Calculating feature importance...');

    const importances = [];
    const baselineError = this.calculateBaselineError(X, y, model);

    // Calculate importance for each feature
    for (let i = 0; i < X[0].length; i++) {
      // Permute feature and measure error increase
      const permutedX = X.map(x => {
        const permuted = [...x];
        permuted[i] = Math.random() * (Math.max(...X.map(xx => xx[i])) - Math.min(...X.map(xx => xx[i]))) + Math.min(...X.map(xx => xx[i]));
        return permuted;
      });

      const permutedError = this.calculateError(permutedX, y, model);
      const importance = permutedError - baselineError;
      importances.push({
        feature: i,
        importance: Math.abs(importance),
        impact: importance > 0 ? 'positive' : 'negative'
      });
    }

    // Normalize importances
    const maxImportance = Math.max(...importances.map(i => i.importance));
    importances.forEach(imp => {
      imp.normalizedImportance = maxImportance > 0 ? imp.importance / maxImportance : 0;
    });

    // Sort by importance
    importances.sort((a, b) => b.importance - a.importance);

    this.featureImportance = {
      features: importances,
      baselineError,
      timestamp: Date.now()
    };

    logger.info(`Feature importance calculated for ${importances.length} features`);
    return this.featureImportance;
  }

  /**
   * Calculate baseline error
   */
  calculateBaselineError(X, y, model) {
    let totalError = 0;
    for (let i = 0; i < X.length; i++) {
      const prediction = model.predict(X[i]);
      const error = Math.abs(prediction - y[i]);
      totalError += error * error;
    }
    return totalError / X.length;
  }

  /**
   * Calculate error with permuted features
   */
  calculateError(X, y, model) {
    let totalError = 0;
    for (let i = 0; i < X.length; i++) {
      const prediction = model.predict(X[i]);
      const error = Math.abs(prediction - y[i]);
      totalError += error * error;
    }
    return totalError / X.length;
  }

  /**
   * Calculate SHAP values (simplified)
   */
  calculateSHAPValues(model, instance, X_train, featureNames = []) {
    logger.debug('Calculating SHAP values...');

    const shapValues = [];
    const baseline = this.calculateAveragePrediction(X_train, model);

    for (let i = 0; i < instance.length; i++) {
      // Simplified SHAP: marginal contribution
      const withFeature = this.calculateMarginalContribution(model, instance, i, X_train, true);
      const withoutFeature = this.calculateMarginalContribution(model, instance, i, X_train, false);
      
      shapValues.push({
        feature: i,
        featureName: featureNames[i] || `feature_${i}`,
        shapValue: withFeature - withoutFeature,
        contribution: (withFeature - withoutFeature) / baseline
      });
    }

    this.shapValues = {
      instance: instance,
      shapValues: shapValues,
      baseline,
      timestamp: Date.now()
    };

    return this.shapValues;
  }

  /**
   * Calculate average prediction
   */
  calculateAveragePrediction(X, model) {
    let sum = 0;
    for (const x of X) {
      sum += model.predict(x);
    }
    return sum / X.length;
  }

  /**
   * Calculate marginal contribution
   */
  calculateMarginalContribution(model, instance, featureIndex, X_train, includeFeature) {
    // Simplified: average prediction with/without feature
    let sum = 0;
    let count = 0;

    for (const x of X_train) {
      const modified = [...x];
      if (!includeFeature) {
        modified[featureIndex] = instance[featureIndex];
      }
      sum += model.predict(modified);
      count++;
    }

    return count > 0 ? sum / count : 0;
  }

  /**
   * Explain prediction
   */
  explainPrediction(model, instance, prediction, featureNames = [], context = {}) {
    logger.debug('Generating prediction explanation...');

    const explanation = {
      prediction: prediction,
      timestamp: Date.now(),
      context: context,
      factors: []
    };

    // Get feature contributions
    if (this.shapValues && this.shapValues.shapValues) {
      explanation.factors = this.shapValues.shapValues.map(shap => ({
        feature: shap.featureName,
        contribution: shap.shapValue,
        impact: shap.shapValue > 0 ? 'increases' : 'decreases',
        magnitude: Math.abs(shap.shapValue)
      })).sort((a, b) => b.magnitude - a.magnitude);
    }

    // Get top contributing features
    if (this.featureImportance && this.featureImportance.features) {
      const topFeatures = this.featureImportance.features.slice(0, 5);
      explanation.topFeatures = topFeatures.map(f => ({
        feature: featureNames[f.feature] || `feature_${f.feature}`,
        importance: f.normalizedImportance,
        impact: f.impact
      }));
    }

    // Generate natural language explanation
    explanation.summary = this.generateSummary(explanation);

    this.explanations.push(explanation);
    return explanation;
  }

  /**
   * Generate natural language summary
   */
  generateSummary(explanation) {
    if (!explanation.factors || explanation.factors.length === 0) {
      return `Prediction: ${explanation.prediction.toFixed(2)}`;
    }

    const topFactor = explanation.factors[0];
    const summary = `Prediction: ${explanation.prediction.toFixed(2)}. ` +
      `Most influenced by ${topFactor.feature} (${topFactor.impact} prediction by ${Math.abs(topFactor.contribution).toFixed(2)}).`;

    return summary;
  }

  /**
   * Get explainability dashboard data
   */
  getDashboardData() {
    return {
      featureImportance: this.featureImportance,
      recentExplanations: this.explanations.slice(-10),
      totalExplanations: this.explanations.length
    };
  }
}

// Singleton instance
let instance = null;

function getModelExplainability() {
  if (!instance) {
    instance = new ModelExplainability();
  }
  return instance;
}

module.exports = {
  ModelExplainability,
  getModelExplainability
};

