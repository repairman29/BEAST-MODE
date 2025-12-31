# Database Setup Instructions
## How to Set Up ML Predictions Database

**Status**: ✅ **SQL Migration Ready**

---

## 🚀 Quick Setup

### Step 1: Open Supabase SQL Editor

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**

---

### Step 2: Run Migration

**Option A: Copy from File**
1. Open `BEAST-MODE-PRODUCT/supabase/migrations/20250101000000_create_ml_predictions_tables.sql`
2. Copy entire contents
3. Paste into Supabase SQL Editor
4. Click **Run**

**Option B: Paste SQL Directly**

Copy and paste this SQL:

```sql
-- ML System Database Tables
-- Migration: 20250101000000_create_ml_predictions_tables.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Unified ML Predictions Table
CREATE TABLE IF NOT EXISTS ml_predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_name TEXT NOT NULL,
    prediction_type TEXT NOT NULL,
    predicted_value FLOAT NOT NULL,
    actual_value FLOAT,
    confidence FLOAT,
    context JSONB DEFAULT '{}',
    model_version TEXT,
    source TEXT DEFAULT 'ml_model',
    error FLOAT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ML Feedback Table
CREATE TABLE IF NOT EXISTS ml_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prediction_id UUID REFERENCES ml_predictions(id) ON DELETE CASCADE,
    service_name TEXT NOT NULL,
    feedback_type TEXT,
    feedback_score FLOAT,
    feedback_text TEXT,
    user_id UUID,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ML Performance Metrics Table
CREATE TABLE IF NOT EXISTS ml_performance_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_name TEXT NOT NULL,
    metric_name TEXT NOT NULL,
    metric_value FLOAT NOT NULL,
    metric_unit TEXT,
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Service-Specific Tables
CREATE TABLE IF NOT EXISTS code_roach_ml_predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID,
    file_path TEXT,
    prediction_type TEXT NOT NULL,
    predicted_quality FLOAT NOT NULL,
    actual_quality FLOAT,
    code_metrics JSONB,
    context JSONB DEFAULT '{}',
    model_version TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS oracle_ml_predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    query TEXT,
    knowledge_id UUID,
    predicted_quality FLOAT NOT NULL,
    predicted_relevance FLOAT NOT NULL,
    actual_quality FLOAT,
    actual_relevance FLOAT,
    context JSONB DEFAULT '{}',
    model_version TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS daisy_chain_ml_predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID,
    task_type TEXT,
    predicted_quality FLOAT NOT NULL,
    predicted_success FLOAT NOT NULL,
    actual_success BOOLEAN,
    context JSONB DEFAULT '{}',
    model_version TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS first_mate_ml_predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    roll_type TEXT NOT NULL,
    stat_name TEXT,
    stat_value INTEGER,
    modifier INTEGER,
    predicted_success FLOAT NOT NULL,
    actual_success BOOLEAN,
    context JSONB DEFAULT '{}',
    model_version TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS game_app_ml_predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID,
    narrative_id UUID,
    predicted_quality FLOAT NOT NULL,
    actual_quality FLOAT,
    scenario_id TEXT,
    roll_type TEXT,
    context JSONB DEFAULT '{}',
    model_version TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_ml_predictions_service ON ml_predictions(service_name);
CREATE INDEX IF NOT EXISTS idx_ml_predictions_type ON ml_predictions(prediction_type);
CREATE INDEX IF NOT EXISTS idx_ml_predictions_created ON ml_predictions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ml_predictions_model ON ml_predictions(model_version);

CREATE INDEX IF NOT EXISTS idx_ml_feedback_prediction ON ml_feedback(prediction_id);
CREATE INDEX IF NOT EXISTS idx_ml_feedback_service ON ml_feedback(service_name);
CREATE INDEX IF NOT EXISTS idx_ml_feedback_created ON ml_feedback(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ml_performance_service ON ml_performance_metrics(service_name);
CREATE INDEX IF NOT EXISTS idx_ml_performance_metric ON ml_performance_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_ml_performance_period ON ml_performance_metrics(period_start, period_end);

-- Enable RLS
ALTER TABLE ml_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE code_roach_ml_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE oracle_ml_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daisy_chain_ml_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE first_mate_ml_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_app_ml_predictions ENABLE ROW LEVEL SECURITY;
```

---

### Step 3: Verify Tables Created

Run this query to verify:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (table_name LIKE 'ml_%' OR table_name LIKE '%_ml_%')
ORDER BY table_name;
```

You should see:
- ✅ `ml_predictions`
- ✅ `ml_feedback`
- ✅ `ml_performance_metrics`
- ✅ `code_roach_ml_predictions`
- ✅ `oracle_ml_predictions`
- ✅ `daisy_chain_ml_predictions`
- ✅ `first_mate_ml_predictions`
- ✅ `game_app_ml_predictions`

---

### Step 4: Test Database Writing

```bash
cd BEAST-MODE-PRODUCT
npm run test:db-writer
```

This will:
- ✅ Test database connection
- ✅ Write a test prediction
- ✅ Write test feedback
- ✅ Write test metric
- ✅ Verify data in database

---

## ✅ Success Indicators

### If Setup Successful:
- ✅ All 8 tables created
- ✅ Indexes created
- ✅ RLS enabled
- ✅ Test script passes
- ✅ Predictions appearing in database

### If Issues:
- ⚠️ Check Supabase credentials in `smuggler-ai-gm/.env`
- ⚠️ Verify service role key has write permissions
- ⚠️ Check table names match exactly

---

## 📊 After Setup

### Check Predictions:
```sql
SELECT service_name, COUNT(*) as count
FROM ml_predictions
GROUP BY service_name;
```

### Recent Predictions:
```sql
SELECT service_name, prediction_type, predicted_value, created_at
FROM ml_predictions
ORDER BY created_at DESC
LIMIT 20;
```

---

**Status**: ✅ **Ready to Deploy**  
**Next**: Run SQL migration in Supabase

