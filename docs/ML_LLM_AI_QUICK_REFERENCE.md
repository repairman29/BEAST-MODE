# ML/LLM/AI Quick Reference

**For:** ML/LLM/AI Experts  
**Purpose:** Fast lookup for ML/LLM/AI operations

---

## 🚀 Quick Commands

```bash
# Training
npm run train:quality          # Train quality model
npm run train:neural-network   # Train neural network
npm run train:transformer      # Train transformer

# MLOps
npm run ml:health-check        # Check ML database
npm run ml:status              # ML system status
npm run ml:feedback-stats       # Feedback statistics
npm run ml:performance         # Performance metrics

# MLflow
npm run mlflow:start           # Start MLflow server
npm run mlflow:stop            # Stop MLflow server
```

---

## 🤖 Model System

### Model ID Format

- **Custom:** `custom:{model-id}`
- **Provider:** `{provider}:{model-name}` (e.g., `openai:gpt-4`)

### Default Models

| Model ID | Purpose | Temperature | Max Tokens |
|----------|---------|-------------|------------|
| `beast-mode-code-generator` | Code generation | 0.3 | 4000 |
| `beast-mode-quality-analyzer` | Quality analysis | 0.2 | 2000 |
| `beast-mode-code-explainer` | Code explanation | 0.5 | 3000 |

### Model Selection Priority

1. User's custom models
2. Public custom models
3. Provider models (paid tier)
4. Fallback (error)

---

## 📊 Temperature Settings

| Task | Temperature | Purpose |
|------|-------------|---------|
| Code generation | 0.3 | Focused, deterministic |
| Chat | 0.7 | Balanced |
| Refactoring | 0.2 | Precise |
| Testing | 0.1 | Very precise |
| Documentation | 0.5 | Balanced |

---

## 🔧 Key Files

| File | Purpose |
|------|---------|
| `lib/mlops/modelRouter.js` | Model routing |
| `lib/mlops/smartModelSelector.js` | Auto model selection |
| `lib/mlops/llmCodeGenerator.js` | LLM code generation |
| `lib/mlops/contextAwareGenerator.js` | Context-aware generation |
| `lib/mlops/databaseWriter.js` | Prediction storage |
| `lib/mlops/feedbackCollector.js` | Feedback collection |
| `lib/mlops/trainingPipeline.js` | Training pipeline |
| `lib/mlops/storageClient.js` | Storage access |

---

## 💾 Storage System

### Storage-First Pattern

```javascript
const { loadTrainingData, loadScannedRepos, loadModel } = require('./loadTrainingData');

// Load training data (checks Storage first, then local)
const data = await loadTrainingData('enhanced-features-*.json', 'training-data');

// Load scanned repos
const repos = await loadScannedRepos({ fromStorage: true, maxFiles: 10 });

// Load model
const model = await loadModel('model-notable-quality-*.json');
```

### Storage Client API

```javascript
const { getMLStorageClient } = require('./storageClient');
const storage = getMLStorageClient();

// Download file
await storage.downloadFile('training-data/file.json', './local.json');

// Load JSON
const data = await storage.loadJSON('training-data/file.json');

// Check existence
const exists = await storage.fileExists('training-data/file.json');

// List files
const files = await storage.listFiles('training-data');

// Get latest file
const latest = await storage.getLatestFile('training-data', 'enhanced-features-*.json');
```

---

## 🗄️ Database Tables

| Table | Purpose |
|-------|---------|
| `custom_models` | Model configurations |
| `ml_predictions` | Prediction results |
| `quality_feedback` | User feedback |
| `quality_improvements` | Improvement tracking |

---

## 🧠 AI Capabilities

| Capability | File | Status |
|------------|------|--------|
| Code Generation | `lib/mlops/llmCodeGenerator.js` | ✅ Active |
| Quality Prediction | `lib/models/trainQualityPredictor.js` | ✅ Active |
| Context-Aware Generation | `lib/mlops/contextAwareGenerator.js` | ✅ Active |
| Multi-File Refactoring | `lib/ai/multiFileRefactoring.js` | ✅ Active |
| Test Generation | `lib/ai/intelligentTestGenerator.js` | ✅ Active |
| Documentation | `lib/ai/documentationGenerator.js` | ✅ Active |
| Code Review | `lib/ai/codeReviewAutomation.js` | ✅ Active |
| Predictive Analytics | `lib/ai/predictiveCapabilities.js` | ✅ Active |
| Learning System | `lib/ai/learningSystem.js` | ✅ Active |

---

## 📈 Training Metrics

### Regression (Quality Prediction)

- **R² score** - Coefficient of determination
- **MAE** - Mean Absolute Error
- **RMSE** - Root Mean Squared Error

### Classification

- **Accuracy** - Overall correctness
- **Precision** - True positives / (True positives + False positives)
- **Recall** - True positives / (True positives + False negatives)
- **F1 score** - Harmonic mean of precision and recall

---

## 🔄 Feedback Loop

### Process

1. User provides feedback
2. Feedback linked to prediction via `prediction_id`
3. Actual value recorded
4. Used for training data

### Database

- `ml_predictions` - Stores predictions
- `quality_feedback` - Stores feedback
- Linked via `prediction_id`

---

## 🎯 Model Selection Strategies

| Strategy | File | When to Use |
|----------|------|-------------|
| Smart Selection | `smartModelSelector.js` | Default (auto-discovery) |
| Context-Aware | `contextAwareModelSelector.js` | Code context available |
| Task-Specific | `taskModelSelector.js` | Known task type |
| Quality-Based | `qualityRouter.js` | Quality optimization needed |

---

## 🚨 Common Issues

| Issue | Solution |
|-------|----------|
| Model not found | Check `custom_models` table, ensure `is_active = true` |
| Low quality predictions | Collect more training data, retrain model |
| Slow generation | Check caching, use faster models, reduce max_tokens |
| Storage access issues | Check `SUPABASE_SERVICE_ROLE_KEY`, verify bucket exists |

---

## 📊 Storage Structure

```
ml-artifacts/
├── training-data/
│   ├── enhanced-features-*.json
│   ├── scanned-repos-*.json
│   └── discovered-repos-*.json
├── models/
│   ├── model-notable-quality-*.json
│   └── quality-predictor-*.json
├── catalogs/
│   ├── COMPLETE_CATALOG.json
│   └── TOP_REPOS_WITH_CODE.json
├── oracle/
│   ├── oracle-embeddings.json
│   └── oracle_manifest.json
└── audit/
    ├── exports/
    └── logs/
```

---

## 🔐 Configuration

### Model Configuration

```sql
INSERT INTO custom_models (
  model_id,
  model_name,
  endpoint_url,
  provider,
  is_active,
  is_public,
  config
) VALUES (
  'beast-mode-code-generator',
  'BEAST MODE Code Generator',
  'https://api.beast-mode.dev/v1/chat/completions',
  'openai-compatible',
  true,
  true,
  '{"model": "beast-mode-code-generator", "temperature": 0.3, "max_tokens": 4000}'::jsonb
);
```

---

## ✅ Best Practices

1. **Always use Smart Model Selector** - Don't hardcode models
2. **Prefer custom models** - 97% cost savings
3. **Use Storage-first pattern** - Check Storage, fallback to local
4. **Collect feedback actively** - Auto-prompts, user feedback
5. **Track experiments** - Use MLflow
6. **Evaluate properly** - Multiple metrics, cross-validation

---

**Last Updated:** 2026-01-22
