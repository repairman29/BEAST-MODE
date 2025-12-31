# ML System - Data Integration Overview
## How All Services Use the ML System & Database Integration

**Status**: ✅ **Integrated** | ⚠️ **Data Collection Needs Enhancement**

---

## 🔍 Current Integration Status

### ✅ **Services Using ML System** (6/7):

1. **Code Roach** ✅ - Uses ML for code quality prediction
2. **Oracle** ✅ - Uses ML for knowledge quality checks
3. **Daisy Chain** ✅ - Uses ML for automation quality
4. **AI GM** ✅ - Uses ML for narrative quality prediction
5. **First Mate** ✅ - Uses ML for dice roll predictions
6. **Main Game App** ✅ - Uses ML for narrative quality

### ⚠️ **Database Integration**:

**Current State:**
- ✅ Can READ from Supabase tables
- ⚠️ Limited WRITE back to database
- ⚠️ Feedback collection needs enhancement
- ⚠️ Not all data types are being collected

---

## 📊 Data Flow Architecture

### Current Data Flow:

```
┌─────────────────────────────────────────────────────────┐
│                    SUPABASE DATABASE                     │
│  ┌──────────────────────────────────────────────────┐   │
│  │ ai_gm_quality_feedback                           │   │
│  │ ai_gm_explanations                                │   │
│  │ ai_gm_ab_testing                                  │   │
│  └──────────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────────┘
                     │ READ
                     ▼
┌─────────────────────────────────────────────────────────┐
│              DATA INTEGRATION SERVICE                    │
│  (dataIntegration.js)                                    │
│  - Collects quality feedback                             │
│  - Collects explanations                                 │
│  - Collects AB testing data                             │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              DATA COLLECTION SERVICE                    │
│  (dataCollection.js)                                     │
│  - Stores locally in .beast-mode/data/                  │
│  - Prepares for training                                 │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              MODEL TRAINING                              │
│  - Trains on collected data                              │
│  - Creates quality-predictor-v3-advanced.json           │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              ML MODEL INTEGRATION                       │
│  (mlModelIntegration.js)                                 │
│  - Loads trained model                                   │
│  - Provides predictions                                  │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              SERVICE INTEGRATIONS                       │
│  - Code Roach                                            │
│  - Oracle                                                │
│  - Daisy Chain                                           │
│  - AI GM                                                 │
│  - First Mate                                            │
│  - Game App                                              │
└────────────────────┬────────────────────────────────────┘
                     │ PREDICTIONS
                     ▼
┌─────────────────────────────────────────────────────────┐
│              PRODUCTION MONITORING                      │
│  (productionMonitoring.js)                              │
│  - Records predictions                                  │
│  - Tracks performance                                    │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              FEEDBACK LOOP                              │
│  (feedbackLoop.js)                                      │
│  - Collects feedback                                    │
│  - Processes in batches                                 │
└────────────────────┬────────────────────────────────────┘
                     │
                     ⚠️ NOT FULLY WRITING BACK TO DB
```

---

## 🔌 How Each Service Uses ML

### 1. **Code Roach** (`smuggler-code-roach`)

**Integration Point**: `lib/mlCodeQualityIntegration.js`

**What it does:**
- Predicts code quality BEFORE generating code
- Uses ensemble predictions (87%+ confidence)
- Batch processes multiple files

**Data Flow:**
```javascript
// Before code generation
const prediction = await ml.predictCodeQuality({
  codeMetrics: { ... },
  context: { ... }
});

if (prediction.shouldRetry) {
  // Retry with different approach
}
```

**Database Connection:**
- ⚠️ **NOT directly connected** to database
- ✅ Uses ML predictions
- ⚠️ **NOT writing feedback back** to database

---

### 2. **Oracle** (`smuggler-oracle`)

**Integration Point**: `lib/mlKnowledgeQuality.js`

**What it does:**
- Predicts knowledge quality
- Predicts relevance scores
- Enhances search results

**Data Flow:**
```javascript
// Before returning knowledge
const quality = await ml.predictQuality(knowledgeItem);
const relevance = await ml.predictRelevance(query, knowledgeItem);
```

**Database Connection:**
- ⚠️ **NOT directly connected** to database
- ✅ Uses ML predictions
- ⚠️ **NOT writing feedback back** to database

---

### 3. **Daisy Chain** (`smuggler-daisy-chain`)

**Integration Point**: `lib/mlQualityIntegration.js`

**What it does:**
- Predicts automation task quality
- Predicts success rates
- Quality checks for workflows

**Data Flow:**
```javascript
// Before task execution
const prediction = await ml.predictQuality(taskContext);
```

**Database Connection:**
- ⚠️ **NOT directly connected** to database
- ✅ Uses ML predictions
- ⚠️ **NOT writing feedback back** to database

---

### 4. **AI GM** (`smuggler-ai-gm`)

**Integration Point**: `src/services/aiGMQualityPredictionServiceML.js`

**What it does:**
- Predicts narrative quality BEFORE generation
- Uses ML-enhanced predictions
- Provides retry recommendations

**Data Flow:**
```javascript
// Before narrative generation
const prediction = await aiGMService.predictQuality(context);
if (prediction.shouldRetry) {
  // Consider retry
}
```

**Database Connection:**
- ✅ **READS from**: `ai_gm_quality_feedback`, `ai_gm_explanations`, `ai_gm_ab_testing`
- ✅ Uses ML predictions
- ⚠️ **Limited writing back** - only through data collection service

---

### 5. **First Mate** (`first-mate-app`)

**Integration Point**: `lib/mlPlayerExperience.js`

**What it does:**
- Predicts dice roll success probability
- Predicts action success rates
- Shows recommendations in UI

**Data Flow:**
```javascript
// Before dice roll
const prediction = await ml.predictDiceRollSuccess(stat, statValue, modifier);
// Shows in UI: "85% chance of success"
```

**Database Connection:**
- ⚠️ **NOT directly connected** to database
- ✅ Uses ML predictions via API
- ⚠️ **NOT writing feedback back** to database

---

### 6. **Main Game App** (`src/frontend/...`)

**Integration Point**: `js/ml/GameMLIntegration.js`

**What it does:**
- Predicts narrative quality before generation
- Frontend and backend integration
- Provides retry logic

**Data Flow:**
```javascript
// Before narrative generation
const prediction = await ml.predictNarrativeQuality(context);
```

**Database Connection:**
- ⚠️ **NOT directly connected** to database
- ✅ Uses ML predictions via API
- ⚠️ **NOT writing feedback back** to database

---

## 📊 Database Tables & Data Sources

### Current Tables We READ From:

1. **`ai_gm_quality_feedback`**
   - Quality scores
   - User feedback
   - Prediction vs actual

2. **`ai_gm_explanations`**
   - Explanation data
   - Context information

3. **`ai_gm_ab_testing`**
   - AB test results
   - Model comparisons

### ⚠️ **Missing Database Integration**:

**We're NOT writing back:**
- ❌ Prediction results
- ❌ Actual outcomes
- ❌ Feedback from services
- ❌ Performance metrics
- ❌ Model predictions

**We're NOT collecting from:**
- ❌ Code Roach quality data
- ❌ Oracle knowledge feedback
- ❌ Daisy Chain task results
- ❌ First Mate dice roll outcomes
- ❌ Game app narrative feedback

---

## 🔄 What Should Be Integrated

### 1. **Feedback Collection** (Missing):

Each service should write back:
```javascript
// After prediction
await feedbackLoop.recordFeedback('code-roach', {
  prediction: prediction.predictedQuality,
  actual: actualQuality,
  context: context,
  timestamp: new Date()
});
```

### 2. **Database Tables** (Need to Create):

```sql
-- ML Predictions Table
CREATE TABLE ml_predictions (
  id UUID PRIMARY KEY,
  service_name TEXT,
  prediction_type TEXT,
  predicted_quality FLOAT,
  actual_quality FLOAT,
  context JSONB,
  model_version TEXT,
  timestamp TIMESTAMP
);

-- ML Feedback Table
CREATE TABLE ml_feedback (
  id UUID PRIMARY KEY,
  service_name TEXT,
  prediction_id UUID,
  feedback_score FLOAT,
  user_id UUID,
  timestamp TIMESTAMP
);

-- ML Performance Metrics
CREATE TABLE ml_performance (
  id UUID PRIMARY KEY,
  service_name TEXT,
  metric_name TEXT,
  metric_value FLOAT,
  timestamp TIMESTAMP
);
```

### 3. **Service-Specific Data** (Need to Collect):

- **Code Roach**: Code quality scores, fix success rates
- **Oracle**: Knowledge relevance, search quality
- **Daisy Chain**: Task success rates, automation quality
- **First Mate**: Dice roll outcomes, action success
- **Game App**: Narrative quality, player satisfaction

---

## 🎯 Integration Gaps

### Current State:
- ✅ **ML Predictions**: Working across all services
- ✅ **Model Training**: Can read from database
- ⚠️ **Feedback Collection**: Limited to AI GM only
- ❌ **Database Writes**: Not writing predictions back
- ❌ **Service-Specific Data**: Not collecting from all services

### What's Missing:
1. **Database write-back** for all predictions
2. **Feedback collection** from all services
3. **Service-specific tables** for each service
4. **Real-time data streaming** to database
5. **Unified feedback schema** across services

---

## 🚀 Recommended Enhancements

### 1. **Create Database Tables**:
```sql
-- Unified ML predictions table
CREATE TABLE ml_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name TEXT NOT NULL,
  prediction_type TEXT NOT NULL,
  predicted_quality FLOAT,
  actual_quality FLOAT,
  context JSONB,
  model_version TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Service-specific feedback tables
CREATE TABLE code_roach_feedback (...);
CREATE TABLE oracle_feedback (...);
CREATE TABLE daisy_chain_feedback (...);
CREATE TABLE first_mate_feedback (...);
CREATE TABLE game_app_feedback (...);
```

### 2. **Enhance Feedback Loop**:
```javascript
// Write to database after prediction
await supabase.from('ml_predictions').insert({
  service_name: 'code-roach',
  prediction_type: 'code-quality',
  predicted_quality: prediction.predictedQuality,
  context: context
});
```

### 3. **Service-Specific Collectors**:
- Code Roach: Collect code quality metrics
- Oracle: Collect knowledge relevance scores
- Daisy Chain: Collect task success rates
- First Mate: Collect dice roll outcomes
- Game App: Collect narrative quality scores

---

## 📈 Current vs. Ideal State

### Current:
- ✅ ML predictions working
- ✅ Can read from database (AI GM only)
- ⚠️ Limited feedback collection
- ❌ Not writing back to database

### Ideal:
- ✅ ML predictions working
- ✅ Reading from all relevant tables
- ✅ Writing all predictions to database
- ✅ Collecting feedback from all services
- ✅ Real-time data streaming
- ✅ Unified feedback schema

---

**Status**: ⚠️ **Partially Integrated**  
**Next Steps**: Enhance database integration and feedback collection

---

## 📋 Quick Summary

### ✅ **What's Working**:
- **ML Predictions**: All 6 services use ML predictions ✅
- **Database READ**: Can read from 3 AI GM tables ✅
- **AI GM Integration**: Fully integrated with database ✅

### ⚠️ **What's Missing**:
- **Database WRITE**: ML predictions not stored in database ❌
- **Feedback Collection**: Not collecting from all services ❌
- **Service-Specific Tables**: No tables for Code Roach, Oracle, Daisy Chain, First Mate, Game App ❌

### 🎯 **Recommendation**:
See `DATABASE_INTEGRATION_STATUS.md` for detailed analysis and recommended database tables.

