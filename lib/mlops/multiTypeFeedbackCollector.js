/**
 * Multi-Type Feedback Collector
 * Handles all forms of feedback: users, bots, AI systems, surveys, comments, etc.
 */

const { getFeedbackCollector } = require('./feedbackCollector');
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
const log = createLogger('MultiTypeFeedbackCollector');

class MultiTypeFeedbackCollector {
  constructor() {
    this.collector = null;
  }

  async initialize() {
    if (!this.collector) {
      this.collector = await getFeedbackCollector();
    }
  }

  /**
   * Collect user feedback (human users)
   */
  async collectUserFeedback(predictionId, feedback) {
    await this.initialize();
    
    const {
      rating,           // 0-1 scale
      comment,          // Open-ended text
      survey,           // Survey responses
      context = {}
    } = feedback;

    // Record rating
    if (rating !== undefined) {
      await this.collector.recordOutcome(
        predictionId,
        rating,
        {
          ...context,
          feedbackType: 'user',
          source: 'human-user',
          hasComment: !!comment,
          hasSurvey: !!survey
        }
      );
    }

    // Store comment if provided
    if (comment) {
      await this.storeFeedbackComment(predictionId, {
        type: 'user-comment',
        text: comment,
        rating: rating,
        ...context
      });
    }

    // Store survey if provided
    if (survey) {
      await this.storeSurveyResponse(predictionId, {
        type: 'user-survey',
        responses: survey,
        rating: rating,
        ...context
      });
    }

    return { success: true, feedbackType: 'user' };
  }

  /**
   * Collect bot/AI system feedback
   */
  async collectBotFeedback(predictionId, feedback) {
    await this.initialize();
    
    const {
      outcome,           // Success/failure
      confidence,        // Bot's confidence in feedback
      reasoning,         // Why bot thinks this
      metrics,           // Performance metrics
      context = {}
    } = feedback;

    // Convert outcome to 0-1 scale
    const actualValue = outcome === 'success' || outcome === true ? 1.0 : 
                       outcome === 'failure' || outcome === false ? 0.0 :
                       typeof outcome === 'number' ? outcome : null;

    if (actualValue !== null) {
      await this.collector.recordOutcome(
        predictionId,
        actualValue,
        {
          ...context,
          feedbackType: 'bot',
          source: 'ai-system',
          botConfidence: confidence,
          botReasoning: reasoning,
          metrics: metrics
        }
      );
    }

    // Store bot reasoning
    if (reasoning) {
      await this.storeFeedbackComment(predictionId, {
        type: 'bot-reasoning',
        text: reasoning,
        confidence: confidence,
        metrics: metrics,
        ...context
      });
    }

    return { success: true, feedbackType: 'bot' };
  }

  /**
   * Collect survey feedback
   */
  async collectSurveyFeedback(predictionId, survey) {
    await this.initialize();
    
    const {
      questions,         // Survey questions
      responses,         // User responses
      rating,            // Overall rating (optional)
      context = {}
    } = survey;

    // Calculate rating from survey if not provided
    let calculatedRating = rating;
    if (!calculatedRating && responses) {
      // Average numeric responses
      const numericResponses = Object.values(responses)
        .filter(v => typeof v === 'number')
        .map(v => v / 5.0); // Normalize 1-5 to 0-1
      
      if (numericResponses.length > 0) {
        calculatedRating = numericResponses.reduce((a, b) => a + b, 0) / numericResponses.length;
      }
    }

    // Record rating
    if (calculatedRating !== undefined) {
      await this.collector.recordOutcome(
        predictionId,
        calculatedRating,
        {
          ...context,
          feedbackType: 'survey',
          source: 'survey',
          questionCount: questions?.length || 0,
          responseCount: Object.keys(responses || {}).length
        }
      );
    }

    // Store survey responses
    await this.storeSurveyResponse(predictionId, {
      type: 'survey',
      questions: questions,
      responses: responses,
      rating: calculatedRating,
      ...context
    });

    return { success: true, feedbackType: 'survey', rating: calculatedRating };
  }

  /**
   * Collect open-ended comment feedback
   */
  async collectCommentFeedback(predictionId, comment) {
    await this.initialize();
    
    const {
      text,              // Comment text
      sentiment,         // Sentiment analysis (optional)
      rating,            // Implied rating from comment (optional)
      context = {}
    } = comment;

    // Try to extract rating from sentiment if not provided
    let extractedRating = rating;
    if (!extractedRating && sentiment) {
      // Map sentiment to rating
      const sentimentMap = {
        'positive': 0.8,
        'very-positive': 0.9,
        'negative': 0.2,
        'very-negative': 0.1,
        'neutral': 0.5
      };
      extractedRating = sentimentMap[sentiment.toLowerCase()] || 0.5;
    }

    // Record rating if available
    if (extractedRating !== undefined) {
      await this.collector.recordOutcome(
        predictionId,
        extractedRating,
        {
          ...context,
          feedbackType: 'comment',
          source: 'open-ended',
          hasSentiment: !!sentiment,
          commentLength: text?.length || 0
        }
      );
    }

    // Store comment
    await this.storeFeedbackComment(predictionId, {
      type: 'comment',
      text: text,
      sentiment: sentiment,
      rating: extractedRating,
      ...context
    });

    return { success: true, feedbackType: 'comment', rating: extractedRating };
  }

  /**
   * Collect AI system feedback (from other AI systems)
   */
  async collectAISystemFeedback(predictionId, feedback) {
    await this.initialize();
    
    const {
      systemName,        // Which AI system (e.g., 'code-roach', 'oracle')
      evaluation,        // AI's evaluation
      score,             // AI's score
      reasoning,         // AI's reasoning
      metrics,           // Performance metrics
      context = {}
    } = feedback;

    // Convert evaluation to 0-1 scale
    const actualValue = typeof score === 'number' ? score :
                       evaluation === 'good' || evaluation === 'success' ? 0.8 :
                       evaluation === 'excellent' ? 0.9 :
                       evaluation === 'poor' || evaluation === 'failure' ? 0.2 :
                       evaluation === 'bad' ? 0.1 :
                       0.5;

    await this.collector.recordOutcome(
      predictionId,
      actualValue,
      {
        ...context,
        feedbackType: 'ai-system',
        source: systemName || 'ai-system',
        aiEvaluation: evaluation,
        aiReasoning: reasoning,
        metrics: metrics
      }
    );

    // Store AI reasoning
    if (reasoning) {
      await this.storeFeedbackComment(predictionId, {
        type: 'ai-reasoning',
        text: reasoning,
        systemName: systemName,
        evaluation: evaluation,
        ...context
      });
    }

    return { success: true, feedbackType: 'ai-system', systemName };
  }

  /**
   * Store feedback comment (open-ended text)
   */
  async storeFeedbackComment(predictionId, commentData) {
    if (!this.collector || !this.collector.supabase) return;

    try {
      const { supabase } = this.collector;
      await supabase
        .from('ml_feedback')
        .insert({
          prediction_id: predictionId,
          service_name: commentData.service || 'unknown',
          feedback_type: commentData.type || 'comment',
          feedback_text: commentData.text,
          feedback_score: commentData.rating || null,
          metadata: {
            ...commentData,
            storedAt: new Date().toISOString()
          }
        });
    } catch (error) {
      log.warn('Failed to store feedback comment:', error.message);
    }
  }

  /**
   * Store survey response
   */
  async storeSurveyResponse(predictionId, surveyData) {
    if (!this.collector || !this.collector.supabase) return;

    try {
      const { supabase } = this.collector;
      await supabase
        .from('ml_feedback')
        .insert({
          prediction_id: predictionId,
          service_name: surveyData.service || 'unknown',
          feedback_type: 'survey',
          feedback_score: surveyData.rating || null,
          metadata: {
            questions: surveyData.questions,
            responses: surveyData.responses,
            ...surveyData,
            storedAt: new Date().toISOString()
          }
        });
    } catch (error) {
      log.warn('Failed to store survey response:', error.message);
    }
  }

  /**
   * Collect any type of feedback (unified interface)
   */
  async collectFeedback(predictionId, feedback) {
    const { type } = feedback;

    switch (type) {
      case 'user':
        return await this.collectUserFeedback(predictionId, feedback);
      
      case 'bot':
      case 'ai-bot':
        return await this.collectBotFeedback(predictionId, feedback);
      
      case 'survey':
        return await this.collectSurveyFeedback(predictionId, feedback);
      
      case 'comment':
      case 'open-ended':
        return await this.collectCommentFeedback(predictionId, feedback);
      
      case 'ai-system':
        return await this.collectAISystemFeedback(predictionId, feedback);
      
      default:
        // Try to infer type
        if (feedback.rating !== undefined) {
          return await this.collectUserFeedback(predictionId, feedback);
        } else if (feedback.outcome !== undefined) {
          return await this.collectBotFeedback(predictionId, feedback);
        } else if (feedback.text !== undefined) {
          return await this.collectCommentFeedback(predictionId, feedback);
        } else {
          throw new Error(`Unknown feedback type: ${type}`);
        }
    }
  }
}

// Singleton instance
let multiTypeCollectorInstance = null;

function getMultiTypeFeedbackCollector() {
  if (!multiTypeCollectorInstance) {
    multiTypeCollectorInstance = new MultiTypeFeedbackCollector();
  }
  return multiTypeCollectorInstance;
}

module.exports = {
  MultiTypeFeedbackCollector,
  getMultiTypeFeedbackCollector
};

