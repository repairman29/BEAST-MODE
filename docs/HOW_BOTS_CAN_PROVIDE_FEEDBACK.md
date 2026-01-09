# How Bots Can Provide Feedback for Quality Predictions

**Date:** January 8, 2026  
**Status:** ✅ Infrastructure Ready

## Overview

Since we don't have real users but have bots that either get predictions right the first time or don't, we can use **bot success/failure as real feedback** to improve the model.

## The Key Insight

**If a bot gets it right the first time → the quality prediction was good (high score)**  
**If a bot doesn't get it right → the quality prediction needs improvement (low score)**

This is **real feedback** because it's based on actual outcomes, not synthetic data.

## How It Works

### Step 1: Bot Gets Quality Prediction

```javascript
// Bot calls quality API
const response = await fetch('/api/repos/quality', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    repo: 'owner/repo', 
    platform: 'beast-mode' 
  })
});

const { quality, predictionId, recommendations } = await response.json();
// predictionId is the key - we'll use it to record feedback later
```

### Step 2: Bot Uses Prediction to Make Decision

```javascript
// Bot uses quality score to decide what to do
if (quality > 0.7) {
  // High quality repo - proceed with confidence
  await performAction(highConfidence: true);
} else {
  // Lower quality - be more cautious
  await performAction(highConfidence: false);
}
```

### Step 3: Bot Records Outcome

**When bot succeeds:**
```javascript
// Bot got it right the first time
await fetch('/api/feedback/bot', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    predictionId: predictionId, // From step 1
    outcome: 'success',
    confidence: 1.0,
    reasoning: 'Bot completed task successfully using this prediction',
    context: {
      repo: 'owner/repo',
      botName: 'code-roach',
      taskType: 'fix-suggestion'
    }
  })
});
```

**When bot fails:**
```javascript
// Bot didn't get it right
await fetch('/api/feedback/bot', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    predictionId: predictionId,
    outcome: 'failure',
    confidence: 1.0,
    reasoning: 'Bot failed to complete task - prediction may have been inaccurate',
    context: {
      repo: 'owner/repo',
      botName: 'code-roach',
      taskType: 'fix-suggestion',
      failureReason: 'Fix was reverted'
    }
  })
});
```

## Integration Examples

### Example 1: Code Roach Fix Suggestion

```javascript
// 1. Get quality prediction
const qualityResponse = await fetch('/api/repos/quality', {
  method: 'POST',
  body: JSON.stringify({ repo: repoName, platform: 'beast-mode' })
});
const { quality, predictionId } = await qualityResponse.json();

// 2. Use quality to decide fix confidence
const fixConfidence = quality > 0.7 ? 0.9 : 0.6;
const fix = await generateFix(error, { confidence: fixConfidence });

// 3. Apply fix
const result = await applyFix(fix);

// 4. Record outcome
await fetch('/api/feedback/bot', {
  method: 'POST',
  body: JSON.stringify({
    predictionId,
    outcome: result.success && !result.reverted ? 'success' : 'failure',
    confidence: 1.0,
    reasoning: `Fix ${result.success ? 'succeeded' : 'failed'}`,
    context: {
      repo: repoName,
      botName: 'code-roach',
      fixType: fix.type,
      applied: result.applied,
      reverted: result.reverted
    }
  })
});
```

### Example 2: Using Helper Script

```bash
# After bot uses quality prediction and succeeds
node scripts/record-bot-quality-outcome.js <predictionId> success owner/repo

# After bot uses quality prediction and fails
node scripts/record-bot-quality-outcome.js <predictionId> failure owner/repo
```

### Example 3: Direct API Integration

```javascript
const { getMultiTypeFeedbackCollector } = require('./lib/mlops/multiTypeFeedbackCollector');

// In bot code
const collector = await getMultiTypeFeedbackCollector();
await collector.collectBotFeedback(predictionId, {
  outcome: botSucceeded ? 'success' : 'failure',
  confidence: 1.0,
  reasoning: 'Bot outcome based on task completion',
  context: {
    repo: repoName,
    botName: 'my-bot',
    taskCompleted: botSucceeded
  }
});
```

## What Counts as Success/Failure?

### Success (High Score: 0.8-1.0)
- Bot completes task successfully on first try
- Fix is applied and not reverted
- Validation passes
- Task completed without errors

### Failure (Low Score: 0.0-0.3)
- Bot fails to complete task
- Fix is applied but then reverted
- Validation fails
- Task errors or times out

### Partial (Medium Score: 0.4-0.7)
- Bot partially succeeds
- Task completed but with warnings
- Fix applied but needs manual intervention

## Benefits

1. **Real Feedback**: Based on actual bot outcomes, not synthetic data
2. **High Volume**: Bots can generate feedback much faster than humans
3. **Consistent**: Bot outcomes are more consistent than human feedback
4. **Actionable**: Directly tied to prediction accuracy

## Current Status

- ✅ Infrastructure ready (`/api/feedback/bot`, `collectBotFeedback`)
- ✅ Helper script created (`record-bot-quality-outcome.js`)
- ✅ Documentation complete
- 🔄 **Need**: Bots to actually use quality predictions and record outcomes

## Next Steps

1. **Integrate into bot workflows**
   - When bots use quality predictions, record outcomes
   - Use `predictionId` from quality API response
   - Call `/api/feedback/bot` when task completes

2. **Run inference script**
   - `node scripts/capture-bot-outcomes-as-feedback.js`
   - Analyzes existing predictions for bot usage patterns

3. **Retrain model**
   - Once we have bot feedback, retrain XGBoost
   - Compare performance improvements

## Files

- ✅ `lib/mlops/multiTypeFeedbackCollector.js` - Bot feedback collection
- ✅ `website/app/api/feedback/bot/route.ts` - Bot feedback API
- ✅ `scripts/record-bot-quality-outcome.js` - Helper script
- ✅ `scripts/capture-bot-outcomes-as-feedback.js` - Outcome inference
- ✅ `docs/BOT_FEEDBACK_INTEGRATION.md` - Full integration guide

## Quick Start

```bash
# 1. Bot gets quality prediction
curl -X POST http://localhost:3000/api/repos/quality \
  -H "Content-Type: application/json" \
  -d '{"repo":"owner/repo","platform":"beast-mode"}'
# Response includes: {"quality": 0.75, "predictionId": "abc123..."}

# 2. Bot uses prediction and succeeds
node scripts/record-bot-quality-outcome.js abc123 success owner/repo

# 3. Check feedback collection
node scripts/track-feedback-collection-rate.js
```

## Conclusion

Bot success/failure is **real feedback** because it's based on actual outcomes. This is much better than synthetic feedback and can help improve the model significantly.

**The key**: When bots use quality predictions, record whether they succeeded or failed. That's real feedback!
