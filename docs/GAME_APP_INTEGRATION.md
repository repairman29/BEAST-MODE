# Main Game App ML Integration
## Narrative Quality Prediction Integration

**Status**: ✅ **Integration Code Ready**  
**Month 4**: Week 1

---

## Overview

The main game application can now use BEAST MODE ML system for predicting narrative quality before generation, enabling better narrative selection and retry logic.

## Integration Points

### 1. **Game Narrative ML Integration**
**File**: `BEAST-MODE-PRODUCT/lib/mlops/gameNarrativeIntegration.js`

**What it does:**
- Predicts narrative quality before generation
- Uses ensemble predictions for better accuracy
- Provides recommendations based on predictions
- Extracts features from narrative context

**Features:**
- Quality prediction before generation
- Ensemble support for better accuracy
- Feature extraction from game context
- Recommendation system

### 2. **Game ML Prediction API**
**File**: `BEAST-MODE-PRODUCT/website/app/api/game/ml-predict/route.ts`

**What it does:**
- Provides ML predictions for game narratives
- Handles game-specific context
- Falls back to heuristics if ML unavailable

**Endpoints:**
- POST `/api/game/ml-predict` - Get quality prediction
- GET `/api/game/ml-predict` - Health check

---

## Integration Details

### Quality Prediction

The integration predicts narrative quality before generation:

```javascript
const { getGameNarrativeIntegration } = require('./lib/mlops/gameNarrativeIntegration');
const gameIntegration = getGameNarrativeIntegration();

// Before generating narrative
const prediction = await gameIntegration.predictNarrativeQuality({
  provider: 'openai',
  model: 'gpt-4',
  actionType: 'narrative-generation',
  scenarioId: 'smuggler-mission',
  rollType: 'success',
  statName: 'cunning',
  statValue: 25
});

if (prediction && prediction.shouldRetry) {
  // Consider retry or alternative approach
  console.log(prediction.recommendation);
}
```

### Ensemble Enhancement

Enhance narratives with ensemble predictions:

```javascript
// After generating narrative
const enhanced = await gameIntegration.enhanceWithEnsemble(narrative, context);

if (enhanced.mlEnhanced) {
  console.log(`ML Quality Score: ${enhanced.mlQualityScore}`);
  console.log(`Confidence: ${enhanced.mlConfidence}`);
}
```

### API Usage

```javascript
// From game application
const response = await fetch('/api/game/ml-predict', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    context: {
      provider: 'openai',
      model: 'gpt-4',
      actionType: 'narrative-generation',
      scenarioId: 'smuggler-mission',
      rollType: 'success',
      statName: 'cunning',
      statValue: 25
    }
  })
});

const data = await response.json();
if (data.prediction.shouldRetry) {
  // Consider retry
}
```

---

## Benefits

### Current Benefits:
- **Better narratives**: Predict quality before generation
- **Retry logic**: Know when to retry for better results
- **Recommendations**: Get actionable advice
- **Ensemble support**: Better accuracy with multiple models

### Future Benefits:
- **Personalization**: Adapt to player preferences
- **Learning**: Models improve from game feedback
- **Predictive analytics**: Forecast narrative outcomes

---

## Implementation Steps

### Step 1: Add Integration to Game App

In your game application code:

```javascript
// Before narrative generation
const prediction = await fetch('/api/game/ml-predict', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    context: {
      provider: selectedProvider,
      model: selectedModel,
      actionType: 'narrative-generation',
      scenarioId: currentScenario,
      rollType: rollResult.type,
      statName: rollResult.stat,
      statValue: rollResult.value
    }
  })
}).then(r => r.json());

if (prediction.prediction && prediction.prediction.shouldRetry) {
  // Consider retry or alternative approach
  console.log(prediction.prediction.recommendation);
}
```

### Step 2: Use Predictions for Retry Logic

```javascript
let narrative = null;
let attempts = 0;
const maxAttempts = 3;

while (!narrative && attempts < maxAttempts) {
  const prediction = await getQualityPrediction(context);
  
  if (prediction && !prediction.shouldRetry) {
    // Generate narrative
    narrative = await generateNarrative(context);
  } else {
    // Retry with different parameters
    context.model = getAlternativeModel(context.model);
    attempts++;
  }
}
```

---

## API Endpoint

### POST `/api/game/ml-predict`

**Request:**
```json
{
  "context": {
    "provider": "openai",
    "model": "gpt-4",
    "actionType": "narrative-generation",
    "scenarioId": "smuggler-mission",
    "rollType": "success",
    "statName": "cunning",
    "statValue": 25
  }
}
```

**Response:**
```json
{
  "prediction": {
    "predictedQuality": 0.85,
    "confidence": 0.8,
    "source": "ml_model",
    "shouldRetry": false,
    "recommendation": "High quality expected - proceed with generation"
  },
  "timestamp": "2025-12-30T23:40:00.000Z",
  "mlAvailable": true
}
```

### GET `/api/game/ml-predict`

**Response:**
```json
{
  "status": "ok",
  "mlAvailable": true,
  "ensembleAvailable": true,
  "timestamp": "2025-12-30T23:40:00.000Z"
}
```

---

## Next Steps

1. **Integrate in Game App**: Add prediction calls before narrative generation
2. **Implement Retry Logic**: Use predictions to decide when to retry
3. **Collect Feedback**: Feed game results back to ML system
4. **Optimize**: Tune models based on game data

---

**Status**: ✅ **Integration Code Ready**  
**Next**: Game App Integration & Testing

