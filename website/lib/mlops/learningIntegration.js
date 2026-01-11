/**
 * Learning Integration
 * Integrates feedback collection with learning tracker
 */

const path = require('path');

let LearningTracker = null;

async function getLearningTracker() {
  if (LearningTracker) {
    return LearningTracker;
  }

  try {
    // Try to load from shared-utils
    const possiblePaths = [
      path.join(process.cwd(), '../../shared-utils/learning-tracker'),
      path.join(process.cwd(), '../shared-utils/learning-tracker'),
      path.join(process.cwd(), 'shared-utils/learning-tracker'),
      path.join(__dirname, '../../../shared-utils/learning-tracker')
    ];

    for (const trackerPath of possiblePaths) {
      try {
        const trackerModule = require(trackerPath);
        LearningTracker = trackerModule.default || trackerModule;
        if (LearningTracker) {
          return LearningTracker;
        }
      } catch (error) {
        // Try next path
      }
    }

    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Record learning from feedback
 */
async function recordLearningFromFeedback(predictionId, actualValue, predictedValue, context = {}) {
  try {
    const Tracker = await getLearningTracker();
    if (!Tracker) {
      return null;
    }

    const tracker = new Tracker();
    
    // Calculate error
    const error = Math.abs(predictedValue - actualValue);
    
    // Determine learning type
    const learningType = error < 0.1 ? 'accurate' : error < 0.3 ? 'moderate' : 'inaccurate';
    
    // Record learning
    const learning = {
      type: 'prediction-feedback',
      category: context.serviceName || 'unknown',
      insight: `Prediction error: ${error.toFixed(3)} (${learningType})`,
      context: {
        predictionId,
        predictedValue,
        actualValue,
        error,
        learningType,
        ...context
      },
      metadata: {
        service: context.serviceName,
        predictionType: context.predictionType,
        modelVersion: context.modelVersion
      }
    };

    await tracker.recordLearning(learning);
    
    return learning;
  } catch (error) {
    console.error('[Learning Integration] Failed to record learning:', error.message);
    return null;
  }
}

/**
 * Get learnings for a service
 */
async function getLearningsForService(serviceName, options = {}) {
  try {
    const Tracker = await getLearningTracker();
    if (!Tracker) {
      return [];
    }

    const tracker = new Tracker();
    const learnings = await tracker.getLearnings({
      category: serviceName,
      ...options
    });

    return learnings;
  } catch (error) {
    console.error('[Learning Integration] Failed to get learnings:', error.message);
    return [];
  }
}

/**
 * Apply learnings to improve predictions
 */
async function applyLearningsToPrediction(serviceName, predictionType, context = {}) {
  try {
    const learnings = await getLearningsForService(serviceName, {
      type: 'prediction-feedback',
      limit: 10
    });

    if (learnings.length === 0) {
      return null;
    }

    // Analyze learnings
    const insights = {
      averageError: 0,
      commonIssues: [],
      recommendations: []
    };

    let totalError = 0;
    const issues = {};

    for (const learning of learnings) {
      const error = learning.context?.error || 0;
      totalError += error;

      const issue = learning.context?.learningType || 'unknown';
      issues[issue] = (issues[issue] || 0) + 1;
    }

    insights.averageError = totalError / learnings.length;
    insights.commonIssues = Object.entries(issues)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([issue, count]) => ({ issue, count }));

    // Generate recommendations
    if (insights.averageError > 0.3) {
      insights.recommendations.push('Consider retraining model with more data');
    }
    if (issues.inaccurate > issues.accurate) {
      insights.recommendations.push('Model accuracy needs improvement');
    }

    return insights;
  } catch (error) {
    console.error('[Learning Integration] Failed to apply learnings:', error.message);
    return null;
  }
}

module.exports = {
  getLearningTracker,
  recordLearningFromFeedback,
  getLearningsForService,
  applyLearningsToPrediction
};

