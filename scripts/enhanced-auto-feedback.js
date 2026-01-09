#!/usr/bin/env node

/**
 * Automated Feedback Collection Service
 * Runs continuously to collect feedback from service outcomes
 */

const { getFeedbackCollector } = require('../lib/mlops/feedbackCollector');
const { getDatabaseWriter } = require('../lib/mlops/databaseWriter');

async function collectFeedback() {
  const collector = await getFeedbackCollector();
  const dbWriter = await getDatabaseWriter();
  
  // Get recent predictions
  const predictions = await collector.getPredictionsNeedingFeedback({
    limit: 100,
    daysOld: 7
  });
  
  let collected = 0;
  
  for (const pred of predictions) {
    // Try to infer feedback from context/metadata
    const inferred = await inferFeedback(pred);
    
    if (inferred) {
      await collector.recordOutcome(
        pred.id,
        inferred.actualValue,
        {
          source: 'auto-inferred',
          confidence: inferred.confidence,
          method: inferred.method
        }
      );
      collected++;
    }
  }
  
  return collected;
}

async function inferFeedback(prediction) {
  const service = prediction.service_name;
  const context = prediction.context || {};
  const metadata = prediction.metadata || {};
  
  // Service-specific inference logic
  if (service === 'code-roach') {
    // Strategy 1: Check fixSuccess flag
    if (metadata.fixSuccess !== undefined) {
      return {
        actualValue: metadata.fixSuccess ? 1.0 : 0.0,
        confidence: 0.8,
        method: 'fix-success-flag'
      };
    }
    
    // Strategy 2: Check if fix was applied and not reverted
    if (metadata.fixApplied && !metadata.fixReverted) {
      return {
        actualValue: 1.0,
        confidence: 0.7,
        method: 'fix-applied-not-reverted'
      };
    }
    
    // Strategy 3: Check validation results
    if (metadata.validation) {
      if (metadata.validation.passed === true) {
        return {
          actualValue: 1.0,
          confidence: 0.9,
          method: 'validation-passed'
        };
      } else if (metadata.validation.passed === false) {
        return {
          actualValue: 0.0,
          confidence: 0.9,
          method: 'validation-failed'
        };
      } else if (metadata.validation.score !== undefined) {
        const score = typeof metadata.validation.score === 'number' 
          ? metadata.validation.score 
          : parseFloat(metadata.validation.score);
        return {
          actualValue: score > 1 ? score / 100 : score,
          confidence: 0.8,
          method: 'validation-score'
        };
      }
    }
  }
  
  // AI GM: Check quality ratings
  if (service === 'ai-gm') {
    if (metadata.qualityRating !== undefined) {
      const rating = typeof metadata.qualityRating === 'number' 
        ? metadata.qualityRating 
        : parseFloat(metadata.qualityRating);
      return {
        actualValue: rating > 1 ? rating / 5.0 : rating,
        confidence: 0.7,
        method: 'quality-rating'
      };
    }
    
    if (metadata.characterScore !== undefined) {
      const score = typeof metadata.characterScore === 'number' 
        ? metadata.characterScore 
        : parseFloat(metadata.characterScore);
      return {
        actualValue: score > 1 ? score / 100 : score,
        confidence: 0.6,
        method: 'character-score'
      };
    }
  }
  
  // First Mate: Check dice roll outcomes
  if (service === 'first-mate') {
    if (context.diceResult !== undefined) {
      const result = context.diceResult;
      if (typeof result === 'boolean') {
        return {
          actualValue: result ? 1.0 : 0.0,
          confidence: 0.8,
          method: 'dice-result-boolean'
        };
      } else if (typeof result === 'number') {
      // Normalize to 0-1 if needed
        return {
          actualValue: result > 1 ? result / 20 : result,
          confidence: 0.7,
          method: 'dice-result-number'
        };
      }
    }
  }
  
  // Oracle: Check answer relevance
  if (service === 'oracle') {
    if (metadata.relevanceScore !== undefined) {
      const score = typeof metadata.relevanceScore === 'number' 
        ? metadata.relevanceScore 
        : parseFloat(metadata.relevanceScore);
      return {
        actualValue: score > 1 ? score / 100 : score,
        confidence: 0.7,
        method: 'relevance-score'
      };
    }
  }
  
  return null;
}

// Run every 5 minutes
setInterval(async () => {
  const collected = await collectFeedback();
  if (collected > 0) {
    console.log(`✅ Collected ${collected} feedback entries`);
  }
}, 5 * 60 * 1000);

console.log('🤖 Automated feedback collection service started');
