# Training Data Explained

## What Are We Training On?

### Current State (Synthetic Data)

Right now, the training script generates **synthetic data** for demonstration purposes. This includes:

- **Quality Scores**: Simulated code quality metrics (0-100)
- **Code Metrics**: Synthetic code quality, test coverage, security, performance, maintainability, complexity
- **CSAT Scores**: Simulated customer satisfaction scores (0-1)

**Why Synthetic?** To get started immediately without waiting for real data collection.

---

## Real Data Sources (Available Now!)

Your system has **real training data** available from these sources:

### 1. **Supabase Database Tables**

#### `ai_gm_quality_feedback`
- **What**: User feedback and CSAT scores
- **Fields**: 
  - `quality_rating` (0-1) - CSAT score
  - `feedback_text` - User feedback
  - `provider` - LLM provider (mistral, openai, together)
  - `model` - Specific model name
  - `action_type` - Type of action
  - `session_id` - Game session
- **Use For**: CSAT prediction, quality correlation

#### `ai_gm_explanations`
- **What**: AI-generated explanations with quality scores
- **Fields**:
  - `quality_score` (0-1) - Predicted/actual quality
  - `provider` - LLM provider
  - `model` - Model name
  - `action_type` - Action type
  - `scenario_id` - Game scenario
- **Use For**: Quality prediction, model performance

#### `ai_gm_ab_testing`
- **What**: A/B test results with user ratings
- **Fields**:
  - `user_rating` - Actual user rating
  - `predicted_quality` - Predicted quality
  - `experiment_name` - A/B test name
  - `variant` - Test variant
  - `provider`, `model` - Model info
- **Use For**: Model performance, prediction accuracy

### 2. **AI GM Services**

#### CSAT Optimization Service
- **What**: Aggregated CSAT data by quality ranges, providers, models
- **Data**: 
  - CSAT by quality range (0.0-0.5, 0.5-0.7, etc.)
  - CSAT by provider (mistral, openai, together)
  - CSAT by model
  - Optimal quality ranges
- **Use For**: CSAT prediction, quality optimization

#### Quality Prediction Service
- **What**: Historical quality predictions and outcomes
- **Data**: Provider/model baselines, action type baselines
- **Use For**: Quality prediction model training

---

## How to Collect Real Data

### Option 1: One-Time Collection

```bash
# Collect last 30 days of data
npm run collect:data -- --days 30 --limit 1000
```

This will:
1. Connect to your Supabase database
2. Query `ai_gm_quality_feedback`, `ai_gm_explanations`, `ai_gm_ab_testing`
3. Transform data into training format
4. Save to `.beast-mode/data/training/`

### Option 2: Automatic Collection

```bash
# Start auto-collection (runs every hour)
npm run ml:auto-collect
```

This continuously collects new data as it's generated.

### Option 3: Integration in Code

```javascript
const { getDataIntegrationService } = require('./lib/mlops/dataIntegration');

const integration = await getDataIntegrationService();

// Collect from Supabase
await integration.collectFromSupabase({
    limit: 1000,
    startDate: '2025-01-01',
    endDate: '2025-01-31'
});

// Collect from CSAT service
await integration.collectFromCSATService();
```

---

## Data Transformation

### From Supabase → Training Format

**CSAT Data** (`ai_gm_quality_feedback`):
```javascript
{
    quality_rating: 0.85,        // → csatScore: 0.85
    provider: 'mistral',         // → provider: 'mistral'
    model: 'ft:mistral-...',    // → model: 'ft:mistral-...'
    action_type: 'navigate',     // → actionType: 'navigate'
    session_id: 'abc123',        // → sessionId: 'abc123'
    feedback_text: 'Great!',     // → feedback: 'Great!'
    created_at: '2025-01-15'    // → timestamp: '2025-01-15'
}
```

**Quality Data** (`ai_gm_explanations`):
```javascript
{
    quality_score: 0.82,         // → qualityScore: 82 (0-100)
    provider: 'openai',          // → context.provider
    model: 'gpt-4o-mini',        // → context.model
    action_type: 'combat',       // → context.actionType
    scenario_id: 'space-station' // → context.scenarioId
}
```

**Model Performance** (`ai_gm_ab_testing`):
```javascript
{
    user_rating: 0.90,           // → actual: 0.90
    predicted_quality: 0.85,     // → prediction: 0.85
    experiment_name: 'model-v1', // → modelName: 'model-v1'
    variant: 'variant-a',        // → context.variant
    provider: 'gemini',          // → provider: 'gemini'
    model: 'gemini-2.5-pro'     // → model: 'gemini-2.5-pro'
}
```

---

## Training Data Structure

### Quality Prediction Model

**Input Features:**
- `codeQuality` (0-100)
- `testCoverage` (0-100)
- `security` (0-100)
- `performance` (0-100)
- `maintainability` (0-100)
- `complexity` (0-100)
- `csat` (0-1) - Optional

**Target:**
- `qualityScore` (0-100)

**Sources:**
- `ai_gm_explanations` → Quality scores
- `ai_gm_quality_feedback` → CSAT correlation

### CSAT Prediction Model

**Input Features:**
- `provider` (categorical)
- `model` (categorical)
- `actionType` (categorical)
- `qualityScore` (0-1)
- `responseTime` (ms) - Optional

**Target:**
- `csatScore` (0-1)

**Sources:**
- `ai_gm_quality_feedback` → Direct CSAT scores
- `ai_gm_ab_testing` → User ratings

### Model Performance Model

**Input Features:**
- `provider` (categorical)
- `model` (categorical)
- `context` (various)
- `prediction` (0-1)

**Target:**
- `actual` (0-1)

**Sources:**
- `ai_gm_ab_testing` → Prediction vs. actual

---

## Data Quality

### Minimum Requirements

- **Quality Prediction**: 100+ samples
- **CSAT Prediction**: 200+ samples
- **Model Performance**: 500+ samples

### Data Quality Checks

The system automatically:
- ✅ Filters out null/missing values
- ✅ Validates data ranges
- ✅ Checks for duplicates
- ✅ Validates timestamps

---

## Next Steps

1. **Collect Real Data**:
   ```bash
   npm run collect:data
   ```

2. **Train with Real Data**:
   ```bash
   npm run train:quality
   ```

3. **Set Up Auto-Collection**:
   ```bash
   npm run ml:auto-collect
   ```

4. **Monitor Data Quality**:
   - Check `.beast-mode/data/training/` files
   - Review statistics: `npm run ml:status`

---

## Questions?

- **Where is data stored?** `.beast-mode/data/training/`
- **How often is it collected?** Configurable (default: hourly)
- **Can I use my own data?** Yes! Add to data collection service
- **What if I don't have Supabase?** System falls back to synthetic data

---

**Ready to collect real data? Run `npm run collect:data`!** 🚀

