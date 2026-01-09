# Bot Feedback Integration Guide

**Date:** January 8, 2026  
**Status:** ✅ Infrastructure Ready

## Overview

Since we don't have real users but have bots that either get predictions right the first time or don't, we can use **bot success/failure as real feedback** to improve the model.

## How It Works

### 1. Bot Uses Quality Prediction
- Bot calls `/api/repos/quality` with a repository
- Gets quality prediction with `predictionId`
- Uses prediction to make decisions

### 2. Bot Succeeds or Fails
- **Success**: Bot gets it right the first time → High quality score (0.8-1.0)
- **Failure**: Bot doesn't get it right → Low quality score (0.0-0.3)

### 3. Record Bot Outcome
Bot can record outcome via:
- **Direct API call**: `/api/feedback/bot` with `outcome: 'success'` or `'failure'`
- **Automatic inference**: Script analyzes prediction context to infer outcomes

## Integration Methods

### Method 1: Direct Bot Feedback (Recommended)

Bots call the feedback API directly when they know the outcome:

```javascript
// Bot succeeded
await fetch('/api/feedback/bot', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    predictionId: '...',
    outcome: 'success', // or 'failure'
    confidence: 0.9,
    reasoning: 'Bot completed task successfully using this prediction',
    metrics: {
      taskCompleted: true,
      timeToComplete: 5000,
      accuracy: 0.95
    },
    context: {
      botName: 'code-roach',
      taskType: 'fix-suggestion',
      repo: 'owner/repo'
    }
  })
});
```

### Method 2: Automatic Inference

Run `capture-bot-outcomes-as-feedback.js` to automatically infer outcomes from prediction context:

```bash
node scripts/capture-bot-outcomes-as-feedback.js
```

This script:
1. Finds predictions without feedback
2. Analyzes context for bot usage patterns
3. Infers success/failure from:
   - `fixApplied && !fixReverted` → Success
   - `fixApplied && fixReverted` → Failure
   - `validation.passed` → Success
   - `taskCompleted` → Success
   - `taskFailed` → Failure
4. Records outcomes as feedback

## Bot Outcome Inference Rules

### Code Roach (Fix Suggestions)
- **Success**: `fixApplied && !fixReverted` → 1.0
- **Failure**: `fixApplied && fixReverted` → 0.0
- **Partial**: `fixApplied` but unclear → 0.5

### AI GM (Narrative Quality)
- **Success**: `narrativeQuality > 0.7` → Use that value
- **Failure**: `narrativeQuality < 0.3` → Use that value

### Oracle (Answer Relevance)
- **Success**: `answerRelevance > 0.7` → Use that value
- **Failure**: `answerRelevance < 0.3` → Use that value

### Generic Bot Tasks
- **Success**: `taskCompleted && !taskFailed` → 1.0
- **Failure**: `taskFailed` → 0.0
- **Validation**: `validation.passed` → 1.0, `validation.passed === false` → 0.0

## API Endpoints

### `/api/feedback/bot`
Collect bot/AI system feedback.

**Request:**
```json
{
  "predictionId": "uuid",
  "outcome": "success" | "failure" | "partial",
  "confidence": 0.9,
  "reasoning": "Why bot thinks this",
  "metrics": { ... },
  "context": { ... }
}
```

**Response:**
```json
{
  "success": true,
  "predictionId": "uuid",
  "feedbackType": "bot"
}
```

## Usage Examples

### Example 1: Code Roach Fix Suggestion

```javascript
// 1. Get quality prediction
const qualityResponse = await fetch('/api/repos/quality', {
  method: 'POST',
  body: JSON.stringify({ repo: 'owner/repo', platform: 'beast-mode' })
});
const { quality, predictionId } = await qualityResponse.json();

// 2. Use prediction to suggest fix
const fixSuggestion = generateFixSuggestion(quality);

// 3. Apply fix
const fixResult = await applyFix(fixSuggestion);

// 4. Record outcome
await fetch('/api/feedback/bot', {
  method: 'POST',
  body: JSON.stringify({
    predictionId,
    outcome: fixResult.success ? 'success' : 'failure',
    confidence: 0.9,
    reasoning: `Fix ${fixResult.success ? 'succeeded' : 'failed'}: ${fixResult.reason}`,
    metrics: {
      fixApplied: fixResult.applied,
      fixReverted: fixResult.reverted,
      timeToApply: fixResult.timeMs
    },
    context: {
      botName: 'code-roach',
      fixType: fixSuggestion.type,
      repo: 'owner/repo'
    }
  })
});
```

### Example 2: Automatic Inference

```bash
# Run script to infer outcomes from existing predictions
node scripts/capture-bot-outcomes-as-feedback.js

# This will:
# - Find predictions with bot usage patterns
# - Infer success/failure from context
# - Record as feedback automatically
```

## Benefits

1. **Real Feedback**: Bot outcomes are based on actual results, not synthetic data
2. **High Volume**: Bots can generate feedback much faster than humans
3. **Consistent**: Bot outcomes are more consistent than human feedback
4. **Actionable**: Directly tied to prediction accuracy

## Next Steps

1. ✅ Infrastructure ready (`/api/feedback/bot`, `collectBotFeedback`)
2. ✅ Inference script created (`capture-bot-outcomes-as-feedback.js`)
3. 🔄 Integrate into bot workflows
4. 🔄 Run inference script on existing predictions
5. 🔄 Retrain model with bot feedback
6. 🔄 Compare performance improvements

## Files

- ✅ `lib/mlops/multiTypeFeedbackCollector.js` - Bot feedback collection
- ✅ `website/app/api/feedback/bot/route.ts` - Bot feedback API
- ✅ `scripts/capture-bot-outcomes-as-feedback.js` - Outcome inference
- ✅ `scripts/integrate-bot-feedback-into-quality-api.js` - API integration

## Conclusion

Bot success/failure is **real feedback** because it's based on actual outcomes. This is much better than synthetic feedback and can help improve the model significantly.

**The key insight**: If a bot gets it right the first time, the prediction was good. If it doesn't, the prediction needs improvement.
