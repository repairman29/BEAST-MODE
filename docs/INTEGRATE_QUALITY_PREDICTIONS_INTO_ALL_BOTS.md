# Integrate Quality Predictions into All Bots

**Date:** January 8, 2026  
**Status:** ✅ Helper Created, 🔄 Integration Needed

## Overview

All bots should use quality predictions to make better decisions and record their outcomes as feedback. This creates a feedback loop that improves the model.

## Shared Helper Utility

**File:** `lib/mlops/qualityPredictionHelper.js`

This helper makes it easy for any bot to:
1. Get quality predictions
2. Use them for decisions
3. Record outcomes automatically

## Integration Pattern

### Basic Integration (3 Steps)

```javascript
const { getQualityPredictionHelper } = require('./lib/mlops/qualityPredictionHelper');

// Step 1: Get quality prediction
const helper = getQualityPredictionHelper();
const { quality, predictionId } = await helper.getQuality(repo);

// Step 2: Use quality to make decision
const decision = makeDecision(quality);

// Step 3: Record outcome
await helper.recordOutcome(predictionId, decision.success);
```

### Advanced Integration (1 Step)

```javascript
const { getQualityPredictionHelper } = require('./lib/mlops/qualityPredictionHelper');

const helper = getQualityPredictionHelper();
const result = await helper.useQualityForDecision(repo, async ({ quality, confidence }) => {
  // Bot makes decision using quality
  if (quality > 0.7) {
    return { success: true, type: 'high-confidence-action' };
  } else {
    return { success: false, type: 'low-quality-repo' };
  }
});

// Outcome automatically recorded!
```

## Bot-Specific Integrations

### 1. Code Roach (Fix Suggestions)

**File:** `smuggler-code-roach/src/services/fixApplicationService.js`

```javascript
const { getQualityPredictionHelper } = require('../../../BEAST-MODE-PRODUCT/lib/mlops/qualityPredictionHelper');

async function applyFixWithQualityCheck(error, fix, repo) {
  const helper = getQualityPredictionHelper();
  const { quality, predictionId } = await helper.getQuality(repo);

  // Use quality to adjust fix confidence
  const adjustedConfidence = quality > 0.7 ? fix.confidence : fix.confidence * 0.7;
  const adjustedFix = { ...fix, confidence: adjustedConfidence };

  // Apply fix
  const result = await applyFix(adjustedFix);

  // Record outcome
  await helper.recordOutcome(predictionId, result.success && !result.reverted, {
    repo,
    botName: 'code-roach',
    fixType: fix.type,
    applied: result.applied,
    reverted: result.reverted
  });

  return result;
}
```

### 2. AI GM (Narrative Quality)

**File:** `smuggler-ai-gm/src/services/narrativeGenerationService.js`

```javascript
const { getQualityPredictionHelper } = require('../../../BEAST-MODE-PRODUCT/lib/mlops/qualityPredictionHelper');

async function generateNarrativeWithQualityCheck(context, repo) {
  const helper = getQualityPredictionHelper();
  const { quality, predictionId } = await helper.getQuality(repo);

  // Use quality to adjust narrative confidence
  const narrativeConfidence = quality > 0.6 ? 0.9 : 0.7;
  const narrative = await generateNarrative(context, { confidence: narrativeConfidence });

  // Check if narrative was successful (e.g., user engaged, no errors)
  const success = narrative.quality > 0.7 && !narrative.errors;

  // Record outcome
  await helper.recordOutcome(predictionId, success, {
    repo,
    botName: 'ai-gm',
    narrativeQuality: narrative.quality,
    userEngagement: narrative.engagement
  });

  return narrative;
}
```

### 3. Oracle (Knowledge Retrieval)

**File:** `smuggler-oracle/src/services/knowledgeRetrievalService.js`

```javascript
const { getQualityPredictionHelper } = require('../../../BEAST-MODE-PRODUCT/lib/mlops/qualityPredictionHelper');

async function retrieveKnowledgeWithQualityCheck(query, repo) {
  const helper = getQualityPredictionHelper();
  const { quality, predictionId } = await helper.getQuality(repo);

  // Use quality to adjust retrieval strategy
  const retrievalStrategy = quality > 0.7 ? 'comprehensive' : 'focused';
  const results = await retrieveKnowledge(query, { strategy: retrievalStrategy });

  // Check if results were useful
  const success = results.relevance > 0.7 && results.answers.length > 0;

  // Record outcome
  await helper.recordOutcome(predictionId, success, {
    repo,
    botName: 'oracle',
    query,
    relevance: results.relevance,
    answerCount: results.answers.length
  });

  return results;
}
```

### 4. Daisy Chain (Task Execution)

**File:** `smuggler-daisy-chain/scripts/super-task-worker-daisy-chain.js`

```javascript
const { getQualityPredictionHelper } = require('../../../BEAST-MODE-PRODUCT/lib/mlops/qualityPredictionHelper');

async function processTaskWithQualityCheck(task) {
  const helper = getQualityPredictionHelper();
  const repo = task.repo || extractRepoFromTask(task);
  
  if (repo) {
    const { quality, predictionId } = await helper.getQuality(repo);

    // Use quality to adjust task execution strategy
    const executionStrategy = quality > 0.7 ? 'aggressive' : 'conservative';
    const result = await processTask(task, { strategy: executionStrategy });

    // Record outcome
    await helper.recordOutcome(predictionId, result.success, {
      repo,
      botName: 'daisy-chain',
      taskType: task.type,
      taskId: task.id,
      errors: result.errors.length
    });

    return result;
  } else {
    // No repo - process normally
    return await processTask(task);
  }
}
```

## Automatic Integration (Middleware Pattern)

Create a middleware that automatically wraps bot functions:

```javascript
/**
 * Quality-Aware Bot Wrapper
 * Automatically gets quality predictions and records outcomes
 */
function withQualityPrediction(botFunction, options = {}) {
  return async function(...args) {
    const helper = getQualityPredictionHelper();
    
    // Extract repo from args (customize based on bot)
    const repo = options.extractRepo ? options.extractRepo(...args) : null;
    
    let quality = 0.5;
    let predictionId = null;
    
    if (repo) {
      const qualityData = await helper.getQuality(repo);
      quality = qualityData.quality;
      predictionId = qualityData.predictionId;
    }

    // Call original function with quality context
    const result = await botFunction(...args, { quality, predictionId });

    // Record outcome if we have predictionId
    if (predictionId && result.success !== undefined) {
      await helper.recordOutcome(predictionId, result.success, {
        repo,
        botName: options.botName || 'unknown',
        ...result.context
      });
    }

    return result;
  };
}

// Usage:
const originalFixFunction = applyFix;
const qualityAwareFix = withQualityPrediction(originalFixFunction, {
  botName: 'code-roach',
  extractRepo: (error) => error.repo || error.filePath?.split('/')[0]
});
```

## Integration Checklist

For each bot service:

- [ ] **Code Roach**
  - [ ] Integrate into `fixApplicationService.js`
  - [ ] Record fix success/failure
  - [ ] Use quality to adjust fix confidence

- [ ] **AI GM**
  - [ ] Integrate into narrative generation
  - [ ] Record narrative quality outcomes
  - [ ] Use quality to adjust narrative confidence

- [ ] **Oracle**
  - [ ] Integrate into knowledge retrieval
  - [ ] Record answer relevance outcomes
  - [ ] Use quality to adjust retrieval strategy

- [ ] **Daisy Chain**
  - [ ] Integrate into task processing
  - [ ] Record task completion outcomes
  - [ ] Use quality to adjust execution strategy

- [ ] **Other Bots**
  - [ ] Identify decision points
  - [ ] Get quality predictions
  - [ ] Record outcomes

## Testing Integration

```javascript
// Test helper
const { getQualityPredictionHelper } = require('./lib/mlops/qualityPredictionHelper');

async function testIntegration() {
  const helper = getQualityPredictionHelper();
  
  // Test 1: Get quality
  const { quality, predictionId } = await helper.getQuality('facebook/react');
  console.log(`Quality: ${quality}, PredictionId: ${predictionId}`);
  
  // Test 2: Record outcome
  const feedback = await helper.recordOutcome(predictionId, true, {
    botName: 'test-bot',
    test: true
  });
  console.log(`Feedback recorded: ${feedback.success}`);
  
  // Test 3: Use for decision
  const result = await helper.useQualityForDecision('facebook/react', async ({ quality }) => {
    return { success: quality > 0.7, type: 'test' };
  });
  console.log(`Decision: ${result.decision.success}`);
}
```

## Benefits

1. **Consistent**: All bots use the same helper
2. **Easy**: Just 3 lines of code to integrate
3. **Automatic**: Outcomes recorded automatically
4. **Real Feedback**: Bot outcomes = real feedback for model improvement

## Files

- ✅ `lib/mlops/qualityPredictionHelper.js` - Shared helper utility
- ✅ `docs/HOW_BOTS_CAN_PROVIDE_FEEDBACK.md` - Quick start guide
- ✅ `docs/BOT_FEEDBACK_INTEGRATION.md` - Full integration guide
- 🔄 Bot-specific integrations (in progress)

## Next Steps

1. ✅ Create shared helper utility
2. 🔄 Integrate into Code Roach
3. 🔄 Integrate into AI GM
4. 🔄 Integrate into Oracle
5. 🔄 Integrate into Daisy Chain
6. 🔄 Test all integrations
7. 🔄 Monitor feedback collection
8. 🔄 Retrain model with bot feedback
