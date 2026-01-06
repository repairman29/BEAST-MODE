# Database Integration Status
## How All Services Use ML & Database Integration

**Status**: ⚠️ **Partially Integrated** - READ ✅ | WRITE ⚠️

---

## 📊 Current Integration Summary

### ✅ **What We're Reading From Database**:

1. **`ai_gm_quality_feedback`** ✅
   - User feedback and CSAT scores
   - Used for: CSAT prediction, quality correlation
   - **Source**: AI GM service writes this

2. **`ai_gm_explanations`** ✅
   - AI-generated explanations with quality scores
   - Used for: Quality prediction, model performance
   - **Source**: AI GM service writes this

3. **`ai_gm_ab_testing`** ✅
   - A/B test results with user ratings
   - Used for: Model performance, prediction accuracy
   - **Source**: AI GM service writes this

### ⚠️ **What We're Writing To Database**:

**Only AI GM Services Write Back:**
- ✅ `ai_gm_quality_feedback` - AI GM writes user feedback
- ✅ `ai_gm_explanations` - AI GM writes explanations
- ✅ `ai_gm_ab_testing` - AI GM writes AB test results

**ML System Does NOT Write Back:**
- ❌ ML predictions are NOT stored in database
- ❌ Feedback from other services is NOT stored
- ❌ Performance metrics are NOT stored
- ❌ Model improvement data is NOT stored

---

## 🔌 How Each Service Uses ML

### 1. **Code Roach** (`smuggler-code-roach`)

**ML Usage:**
- ✅ Uses ML for code quality prediction
- ✅ Uses ensemble predictions
- ✅ Batch processing

**Database Integration:**
- ❌ **NOT writing predictions to database**
- ❌ **NOT writing feedback to database**
- ⚠️ Has its own tables (`code_roach_projects`, `expert_learning_data`) but ML predictions not stored there

**What Should Be Stored:**
```sql
-- Missing: Code Roach ML Predictions
CREATE TABLE code_roach_ml_predictions (
  id UUID PRIMARY KEY,
  project_id UUID,
  prediction_type TEXT, -- 'code-quality', 'fix-success'
  predicted_quality FLOAT,
  actual_quality FLOAT,
  context JSONB,
  model_version TEXT,
  created_at TIMESTAMP
);
```

---

### 2. **Oracle** (`smuggler-oracle`)

**ML Usage:**
- ✅ Uses ML for knowledge quality checks
- ✅ Uses ML for relevance prediction
- ✅ Enhances search results

**Database Integration:**
- ❌ **NOT writing predictions to database**
- ⚠️ Has feedback collection (`oracle_usage_tracker`) but ML predictions not stored
- ⚠️ Feedback stored in Redis, not Supabase

**What Should Be Stored:**
```sql
-- Missing: Oracle ML Predictions
CREATE TABLE oracle_ml_predictions (
  id UUID PRIMARY KEY,
  query TEXT,
  knowledge_id UUID,
  predicted_quality FLOAT,
  predicted_relevance FLOAT,
  actual_quality FLOAT,
  context JSONB,
  created_at TIMESTAMP
);
```

---

### 3. **Daisy Chain** (`smuggler-daisy-chain`)

**ML Usage:**
- ✅ Uses ML for automation quality prediction
- ✅ Uses ML for task success prediction

**Database Integration:**
- ❌ **NOT writing predictions to database**
- ❌ **NOT writing feedback to database**
- ❌ No database tables for Daisy Chain

**What Should Be Stored:**
```sql
-- Missing: Daisy Chain ML Predictions
CREATE TABLE daisy_chain_ml_predictions (
  id UUID PRIMARY KEY,
  task_id UUID,
  task_type TEXT,
  predicted_quality FLOAT,
  predicted_success FLOAT,
  actual_success BOOLEAN,
  context JSONB,
  created_at TIMESTAMP
);
```

---

### 4. **AI GM** (`smuggler-ai-gm`)

**ML Usage:**
- ✅ Uses ML for narrative quality prediction
- ✅ Uses ML-enhanced predictions

**Database Integration:**
- ✅ **WRITES to database** (only service that does!)
- ✅ Writes to `ai_gm_quality_feedback`
- ✅ Writes to `ai_gm_explanations`
- ✅ Writes to `ai_gm_ab_testing`
- ⚠️ But ML predictions themselves not stored separately

**What's Missing:**
```sql
-- Missing: AI GM ML Predictions (separate from feedback)
CREATE TABLE ai_gm_ml_predictions (
  id UUID PRIMARY KEY,
  response_id UUID,
  predicted_quality FLOAT,
  actual_quality FLOAT,
  model_version TEXT,
  context JSONB,
  created_at TIMESTAMP
);
```

---

### 5. **First Mate** (`first-mate-app`)

**ML Usage:**
- ✅ Uses ML for dice roll success prediction
- ✅ Uses ML for action success prediction
- ✅ Shows predictions in UI

**Database Integration:**
- ❌ **NOT writing predictions to database**
- ❌ **NOT writing feedback to database**
- ❌ No database connection at all

**What Should Be Stored:**
```sql
-- Missing: First Mate ML Predictions
CREATE TABLE first_mate_ml_predictions (
  id UUID PRIMARY KEY,
  user_id UUID,
  roll_type TEXT, -- 'dice', 'action'
  stat_name TEXT,
  stat_value INTEGER,
  predicted_success FLOAT,
  actual_success BOOLEAN,
  context JSONB,
  created_at TIMESTAMP
);
```

---

### 6. **Main Game App** (`src/frontend/...`)

**ML Usage:**
- ✅ Uses ML for narrative quality prediction
- ✅ Frontend and backend integration

**Database Integration:**
- ❌ **NOT writing predictions to database**
- ❌ **NOT writing feedback to database**
- ⚠️ Uses API endpoint, but predictions not stored

**What Should Be Stored:**
```sql
-- Missing: Game App ML Predictions
CREATE TABLE game_app_ml_predictions (
  id UUID PRIMARY KEY,
  session_id UUID,
  narrative_id UUID,
  predicted_quality FLOAT,
  actual_quality FLOAT,
  context JSONB,
  created_at TIMESTAMP
);
```

---

## 📊 Data Flow Analysis

### Current Flow (Incomplete):

```
┌─────────────────────────────────────────┐
│         SUPABASE DATABASE               │
│  ✅ ai_gm_quality_feedback              │
│  ✅ ai_gm_explanations                  │
│  ✅ ai_gm_ab_testing                    │
└──────────────┬──────────────────────────┘
               │ READ
               ▼
┌─────────────────────────────────────────┐
│      DATA INTEGRATION SERVICE            │
│  (dataIntegration.js)                    │
│  - Reads from 3 AI GM tables             │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│      DATA COLLECTION SERVICE             │
│  (dataCollection.js)                     │
│  - Stores locally in .beast-mode/data/   │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│         MODEL TRAINING                   │
│  - Trains on collected data              │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│      ML MODEL INTEGRATION               │
│  - Provides predictions                  │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│      SERVICE INTEGRATIONS               │
│  - Code Roach                            │
│  - Oracle                                │
│  - Daisy Chain                           │
│  - AI GM                                 │
│  - First Mate                            │
│  - Game App                              │
└──────────────┬──────────────────────────┘
               │ PREDICTIONS (NOT STORED)
               ▼
         ❌ NOT WRITING BACK TO DB
```

### Ideal Flow (Complete):

```
┌─────────────────────────────────────────┐
│         SUPABASE DATABASE               │
│  ✅ ai_gm_quality_feedback              │
│  ✅ ai_gm_explanations                  │
│  ✅ ai_gm_ab_testing                    │
│  ✅ ml_predictions (NEW)                │
│  ✅ code_roach_ml_predictions (NEW)     │
│  ✅ oracle_ml_predictions (NEW)         │
│  ✅ daisy_chain_ml_predictions (NEW)    │
│  ✅ first_mate_ml_predictions (NEW)     │
│  ✅ game_app_ml_predictions (NEW)       │
└──────────────┬──────────────────────────┘
               │ READ & WRITE
               ▼
┌─────────────────────────────────────────┐
│      DATA INTEGRATION SERVICE            │
│  - Reads from all tables                 │
│  - Writes predictions back               │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│      FEEDBACK LOOP                       │
│  - Collects from all services            │
│  - Writes to database                    │
└─────────────────────────────────────────┘
```

---

## 🎯 Integration Gaps

### Missing Database Tables:

1. **Unified ML Predictions Table** ❌
   - Store all ML predictions in one place
   - Track model version
   - Track service source

2. **Service-Specific Tables** ❌
   - Code Roach predictions
   - Oracle predictions
   - Daisy Chain predictions
   - First Mate predictions
   - Game App predictions

3. **Feedback Tables** ❌
   - Feedback from all services
   - Actual vs predicted quality
   - User ratings

4. **Performance Metrics Table** ❌
   - Model performance over time
   - Error rates
   - Latency metrics

---

## 🚀 Recommended Enhancements

### 1. **Create Unified ML Predictions Table**:

```sql
CREATE TABLE ml_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name TEXT NOT NULL, -- 'code-roach', 'oracle', 'daisy-chain', etc.
  prediction_type TEXT NOT NULL, -- 'quality', 'success', 'relevance'
  predicted_value FLOAT NOT NULL,
  actual_value FLOAT,
  context JSONB,
  model_version TEXT,
  confidence FLOAT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ml_predictions_service ON ml_predictions(service_name);
CREATE INDEX idx_ml_predictions_type ON ml_predictions(prediction_type);
CREATE INDEX idx_ml_predictions_created ON ml_predictions(created_at DESC);
```

### 2. **Enhance Feedback Loop to Write to Database**:

```javascript
// In feedbackLoop.js
async recordFeedback(serviceName, prediction, actual, context) {
  // Store in feedback queue
  this.feedbackQueue.push({...});
  
  // Write to database
  if (this.supabase) {
    await this.supabase.from('ml_predictions').insert({
      service_name: serviceName,
      prediction_type: 'quality',
      predicted_value: prediction.predictedQuality,
      actual_value: actual,
      context: context,
      model_version: this.getModelVersion(),
      confidence: prediction.confidence
    });
  }
}
```

### 3. **Add Database Writing to Each Service**:

```javascript
// In each service integration
async predictQuality(context) {
  const prediction = await mlIntegration.predictQualitySync(context);
  
  // Write to database
  await writePredictionToDatabase({
    service: 'code-roach',
    prediction: prediction,
    context: context
  });
  
  return prediction;
}
```

---

## 📈 Current vs. Ideal State

### Current:
- ✅ **READ**: Can read from 3 AI GM tables
- ⚠️ **WRITE**: Only AI GM writes back
- ❌ **ML Predictions**: Not stored
- ❌ **Feedback**: Not collected from all services
- ❌ **Performance**: Not tracked in database

### Ideal:
- ✅ **READ**: Read from all relevant tables
- ✅ **WRITE**: Write all predictions to database
- ✅ **ML Predictions**: Stored with model version
- ✅ **Feedback**: Collected from all services
- ✅ **Performance**: Tracked in database

---

## 🎯 Next Steps

1. **Create Database Tables** (Priority: High)
   - Unified ML predictions table
   - Service-specific tables
   - Feedback tables

2. **Enhance Feedback Loop** (Priority: High)
   - Write predictions to database
   - Write feedback to database
   - Track performance metrics

3. **Add Database Writing to Services** (Priority: Medium)
   - Code Roach
   - Oracle
   - Daisy Chain
   - First Mate
   - Game App

4. **Create Data Collection Scripts** (Priority: Medium)
   - Collect from all services
   - Aggregate metrics
   - Generate reports

---

**Status**: ⚠️ **Partially Integrated**  
**Action Required**: Enhance database writing for all services

