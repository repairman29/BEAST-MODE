# Bot Integration Roadmap - Quality Predictions

**Date:** January 8, 2026  
**Status:** ✅ Infrastructure Ready, 🔄 Integration In Progress

## Overview

Get all bots to use quality predictions and record outcomes. This creates a feedback loop that improves the model with real bot outcomes.

## Bot Services to Integrate

### 1. Code Roach ✅ (Priority 1)
**Service:** `smuggler-code-roach`  
**Integration Point:** `fixApplicationService.js` → `recordFixApplication()`  
**What to do:**
- Get quality prediction before applying fix
- Use quality to adjust fix confidence
- Record fix success/failure as feedback

**Status:** 🔄 Ready for integration

### 2. AI GM ✅ (Priority 2)
**Service:** `smuggler-ai-gm`  
**Integration Point:** `narrativeGenerationService.js` → `generateNarrative()`  
**What to do:**
- Get quality prediction for game repo
- Use quality to adjust narrative confidence
- Record narrative quality outcomes

**Status:** 🔄 Ready for integration

### 3. Oracle ✅ (Priority 3)
**Service:** `smuggler-oracle`  
**Integration Point:** `knowledgeRetrievalService.js` → `retrieveKnowledge()`  
**What to do:**
- Get quality prediction for knowledge repo
- Use quality to adjust retrieval strategy
- Record answer relevance outcomes

**Status:** 🔄 Ready for integration

### 4. Daisy Chain ✅ (Priority 4)
**Service:** `smuggler-daisy-chain`  
**Integration Point:** `super-task-worker-daisy-chain.js` → `processTask()`  
**What to do:**
- Get quality prediction for task repo
- Use quality to adjust execution strategy
- Record task completion outcomes

**Status:** 🔄 Ready for integration

## Integration Steps

### Step 1: Add Helper Import

```javascript
const { getQualityPredictionHelper } = require('../../../BEAST-MODE-PRODUCT/lib/mlops/qualityPredictionHelper');
```

### Step 2: Get Quality Before Decision

```javascript
const helper = getQualityPredictionHelper();
const { quality, predictionId } = await helper.getQuality(repo);
```

### Step 3: Use Quality in Decision

```javascript
// Adjust confidence/strategy based on quality
const adjustedConfidence = quality > 0.7 ? originalConfidence : originalConfidence * 0.7;
```

### Step 4: Record Outcome After Task

```javascript
// After task completes
await helper.recordOutcome(predictionId, success, {
  repo,
  botName: 'code-roach',
  ...context
});
```

## Quick Integration Template

```javascript
// At top of file
const { getQualityPredictionHelper } = require('../../../BEAST-MODE-PRODUCT/lib/mlops/qualityPredictionHelper');

// In your bot function
async function yourBotFunction(...args) {
  const helper = getQualityPredictionHelper();
  
  // Extract repo from args
  const repo = extractRepo(args);
  
  // Get quality prediction
  let quality = 0.5;
  let predictionId = null;
  if (repo) {
    const qualityData = await helper.getQuality(repo);
    quality = qualityData.quality;
    predictionId = qualityData.predictionId;
  }
  
  // Use quality to make decision
  const decision = makeDecision(quality);
  
  // Execute task
  const result = await executeTask(decision);
  
  // Record outcome
  if (predictionId) {
    await helper.recordOutcome(predictionId, result.success, {
      repo,
      botName: 'your-bot-name',
      ...result.context
    });
  }
  
  return result;
}
```

## Testing Each Integration

```bash
# Test Code Roach
cd smuggler-code-roach && npm test

# Test AI GM
cd smuggler-ai-gm && npm test

# Test Oracle
cd smuggler-oracle && npm test

# Test Daisy Chain
cd smuggler-daisy-chain && npm test
```

## Monitoring

After integration, monitor feedback collection:

```bash
# Check feedback rate
node scripts/track-feedback-collection-rate.js

# Should see bot feedback increasing
```

## Expected Results

After all bots are integrated:
- **Bot feedback**: 100+ examples per week
- **Real feedback rate**: 50%+ (up from 0%)
- **Model improvement**: R² should improve with real feedback

## Files

- ✅ `lib/mlops/qualityPredictionHelper.js` - Shared helper
- ✅ `docs/HOW_BOTS_CAN_PROVIDE_FEEDBACK.md` - Quick start
- ✅ `docs/BOT_FEEDBACK_INTEGRATION.md` - Full guide
- ✅ `docs/INTEGRATE_QUALITY_PREDICTIONS_INTO_ALL_BOTS.md` - Integration guide
- 🔄 Bot-specific integrations (in progress)

## Next Actions

1. ✅ Create shared helper utility
2. 🔄 Integrate into Code Roach (highest priority)
3. 🔄 Integrate into AI GM
4. 🔄 Integrate into Oracle
5. 🔄 Integrate into Daisy Chain
6. 🔄 Test all integrations
7. 🔄 Monitor feedback collection
8. 🔄 Retrain model with bot feedback
