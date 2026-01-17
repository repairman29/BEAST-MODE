# ML/LLM/AI Expert Onboarding

**Date:** 2026-01-22  
**Purpose:** Complete expert-level understanding of BEAST MODE's ML/LLM/AI infrastructure

---

## 🎯 Core Philosophy

**BEAST MODE is the galaxy's best vibe-coder's oasis.**

- **Self-contained AI:** Uses BEAST MODE custom models, not external providers
- **MLOps at scale:** 117 MLOps files covering the full ML lifecycle
- **Quality-first AI:** All predictions feed back into quality engine
- **Zero-configuration:** Auto-discovery of models, smart routing, context-aware generation

---

## 🏗️ ML/LLM Architecture Overview

### High-Level Flow

```
User Request
    ↓
Smart Model Selector (auto-discovers best model)
    ↓
Model Router (routes to custom or provider model)
    ↓
LLM Code Generator (with Knowledge RAG)
    ↓
Generated Code → Quality Prediction
    ↓
Database Writer → Supabase (predictions + feedback)
    ↓
Feedback Collector → Training Pipeline
    ↓
Model Training → Improved Models
```

### Key Components

1. **Model Router** (`lib/mlops/modelRouter.js`)
   - Routes requests to appropriate models
   - Supports custom models and provider models
   - Multi-tier caching (L1: memory, L2: Redis, L3: database)
   - Semantic similarity matching

2. **Smart Model Selector** (`lib/mlops/smartModelSelector.js`)
   - Auto-detects custom models
   - Falls back to provider models
   - Context-aware selection
   - Task-specific selection
   - Zero configuration required

3. **LLM Code Generator** (`lib/mlops/llmCodeGenerator.js`)
   - Handles LLM API calls
   - Knowledge RAG integration
   - Context-aware generation
   - Codebase style matching

4. **Quality Router** (`lib/mlops/qualityRouter.js`)
   - Routes based on predicted quality
   - Quality-based model selection
   - Performance optimization

5. **Context-Aware Generator** (`lib/mlops/contextAwareGenerator.js`)
   - Analyzes codebase style
   - Matches indentation, naming, patterns
   - Detects language conventions
   - Generates style-consistent code

---

## 🤖 Model System

### Custom Models

**Storage:** Supabase `custom_models` table

**Schema:**
```sql
model_id          VARCHAR PRIMARY KEY
model_name        VARCHAR
endpoint_url      VARCHAR
provider          VARCHAR (e.g., 'openai-compatible', 'anthropic', 'custom')
is_active         BOOLEAN
is_public         BOOLEAN
user_id           UUID (NULL for system models)
config            JSONB (temperature, max_tokens, etc.)
api_key_encrypted  BYTEA
api_key_iv       BYTEA
```

**Model ID Format:**
- Custom: `custom:{model-id}`
- Provider: `{provider}:{model-name}` (e.g., `openai:gpt-4`)

**Default Models:**
- `beast-mode-code-generator` - Primary code generation
- `beast-mode-quality-analyzer` - Quality analysis
- `beast-mode-code-explainer` - Code explanation

### Model Selection Logic

1. **User's custom models** (highest priority)
2. **Public custom models** (system models)
3. **Provider models** (requires paid tier)
4. **Fallback** (error message)

### Model Configuration

**Temperature Settings:**
- Code generation: `0.3` (focused, deterministic)
- Chat: `0.7` (balanced)
- Refactoring: `0.2` (precise)
- Testing: `0.1` (very precise)
- Documentation: `0.5` (balanced)

**Max Tokens:**
- Code generation: `4000`
- Chat: `2000`
- Refactoring: `4000`
- Testing: `2000`
- Documentation: `3000`

---

## 🧠 AI Capabilities

### 1. Code Generation

**Location:** `lib/mlops/llmCodeGenerator.js`

**Features:**
- Knowledge RAG integration
- Context-aware generation
- Codebase style matching
- Multi-file generation
- Error handling and type safety

**Prompt Engineering:**
```javascript
systemPrompt: 'You are an expert software developer. Generate production-ready code that follows best practices, includes error handling, tests, and documentation. Match the codebase style and patterns exactly.'
```

### 2. Quality Prediction

**Location:** `lib/models/trainQualityPredictor.js`

**Model Types:**
- Linear regression (baseline)
- XGBoost (advanced)
- Neural networks (transformer-based)
- Ensemble models

**Features:**
- Code quality scoring
- Test coverage prediction
- Security analysis
- Performance prediction
- Maintainability scoring

### 3. Context-Aware Generation

**Location:** `lib/mlops/contextAwareGenerator.js`

**Capabilities:**
- Detects indentation (tabs vs spaces, 2 vs 4)
- Detects naming conventions (camelCase, snake_case, PascalCase)
- Detects common patterns
- Detects import/export style
- Detects comment style
- Detects primary language

### 4. Multi-File Refactoring

**Location:** `lib/ai/multiFileRefactoring.js`

**Capabilities:**
- Cross-file refactoring
- Dependency analysis
- Conflict detection
- Safe refactoring

### 5. Intelligent Test Generation

**Location:** `lib/ai/intelligentTestGenerator.js`

**Capabilities:**
- Unit test generation
- Integration test generation
- Test coverage analysis
- Test quality scoring

### 6. Documentation Generation

**Location:** `lib/ai/documentationGenerator.js`

**Capabilities:**
- API documentation
- Code comments
- README generation
- Architecture documentation

### 7. Code Review Automation

**Location:** `lib/ai/codeReviewAutomation.js`

**Capabilities:**
- Automated code review
- Security scanning
- Best practices checking
- Performance analysis

### 8. Predictive Capabilities

**Location:** `lib/ai/predictiveCapabilities.js`

**Capabilities:**
- Bug prediction
- Performance prediction
- Maintenance prediction
- Team optimization

### 9. Learning System

**Location:** `lib/ai/learningSystem.js`

**Capabilities:**
- Continuous learning from feedback
- Model improvement
- Pattern recognition
- Adaptation to codebase

---

## 📊 MLOps Infrastructure

### Data Collection

**Location:** `lib/mlops/dataCollection.js`

**Data Sources:**
- Production predictions
- GitHub code (The Pantry)
- User feedback
- Quality metrics
- Performance metrics

**Data Storage:**
- Database: `ml_predictions` table
- Storage: Supabase Storage (`ml-artifacts` bucket)
- Local: `.beast-mode/training-data/`

### Training Pipeline

**Location:** `lib/mlops/trainingPipeline.js`

**Pipeline Steps:**
1. Extract production data
2. Load GitHub code
3. Combine datasets
4. Preprocess data
5. Feature engineering
6. Train model
7. Evaluate model
8. Deploy model

**Training Data Sources:**
- Production predictions with outcomes
- GitHub repositories (scanned)
- User feedback
- Quality scores

### Model Training

**Location:** `lib/models/trainQualityPredictor.js`

**Model Types:**
1. **Linear Regression** (baseline)
   - Simple, fast
   - Good for initial models

2. **XGBoost** (`trainQualityPredictorXGBoost.js`)
   - Gradient boosting
   - High accuracy
   - Feature importance

3. **Neural Networks** (`neuralNetworkTrainer.js`)
   - Deep learning
   - Complex patterns
   - Requires more data

4. **Transformers** (`transformerTrainer.js`)
   - Attention mechanism
   - State-of-the-art
   - Best for complex tasks

### Feature Engineering

**Location:** `lib/features/enhancedFeatureEngineering.js`

**Features:**
- Code metrics (lines, complexity, etc.)
- Quality metrics (test coverage, security, etc.)
- Performance metrics
- Maintainability metrics
- Derived features
- Cross-domain features

### Data Preprocessing

**Location:** `lib/mlops/dataPreprocessing.js`

**Steps:**
1. Normalization
2. Categorical encoding
3. Feature scaling
4. Missing value handling
5. Outlier detection

### Model Evaluation

**Metrics:**
- R² score (coefficient of determination)
- MAE (Mean Absolute Error)
- RMSE (Root Mean Squared Error)
- Accuracy
- Precision/Recall (for classification)

### MLflow Integration

**Location:** `lib/mlops/mlflowService.js`

**Features:**
- Experiment tracking
- Model registry
- Artifact storage
- Metric logging
- Parameter logging

**Usage:**
```javascript
const mlflow = getMLflowService();
await mlflow.initialize();
await mlflow.startRun('experiment-name');
await mlflow.logMetric('accuracy', 0.95);
await mlflow.logParam('learning_rate', 0.01);
await mlflow.endRun();
```

---

## 💾 Storage System

### Supabase Storage

**Bucket:** `ml-artifacts`

**Structure:**
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

### Storage Client

**Location:** `lib/mlops/storageClient.js`

**API:**
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

### Load Training Data

**Location:** `lib/mlops/loadTrainingData.js`

**Pattern: Storage-First with Local Fallback**

```javascript
const { loadTrainingData, loadScannedRepos, loadModel } = require('./loadTrainingData');

// Load training data (checks Storage first, then local)
const data = await loadTrainingData('enhanced-features-*.json', 'training-data');

// Load scanned repos
const repos = await loadScannedRepos({ fromStorage: true, maxFiles: 10 });

// Load model
const model = await loadModel('model-notable-quality-*.json');
```

---

## 🔄 Feedback Loop

### Feedback Collection

**Location:** `lib/mlops/feedbackCollector.js`

**Process:**
1. User provides feedback (thumbs up/down, corrections)
2. Feedback linked to prediction via `prediction_id`
3. Actual value recorded
4. Used for training data

**Database:**
- `ml_predictions` table stores predictions
- `quality_feedback` table stores feedback
- Linked via `prediction_id`

### Database Writer

**Location:** `lib/mlops/databaseWriter.js`

**Features:**
- Writes predictions to Supabase
- Batch processing (50 items)
- Auto-flush (5 seconds)
- Retry logic
- Error handling

**Tables:**
- `ml_predictions` - Prediction results
- `quality_feedback` - User feedback
- `quality_improvements` - Improvement tracking

---

## 🎯 Model Selection Strategies

### 1. Smart Selection (Default)

**Location:** `lib/mlops/smartModelSelector.js`

**Logic:**
1. Check user's custom models
2. Check public custom models
3. Check provider models (if paid tier)
4. Fallback to default

### 2. Context-Aware Selection

**Location:** `lib/mlops/contextAwareModelSelector.js`

**Logic:**
- Analyzes code context
- Selects model based on code patterns
- Optimizes for specific tasks

### 3. Task-Specific Selection

**Location:** `lib/mlops/taskModelSelector.js`

**Logic:**
- Routes based on task type
- Code generation → code model
- Quality analysis → quality model
- Documentation → explainer model

### 4. Quality-Based Routing

**Location:** `lib/mlops/qualityRouter.js`

**Logic:**
- Predicts quality for each model
- Selects model with highest predicted quality
- Optimizes for performance

---

## 🔧 Configuration & Tuning

### Model Configuration

**Temperature Tuning:**
- Low (0.1-0.3): Precise, deterministic
- Medium (0.5-0.7): Balanced
- High (0.8-1.0): Creative, varied

**Max Tokens:**
- Short responses: 1000-2000
- Medium responses: 2000-4000
- Long responses: 4000-8000

### Performance Tuning

**Location:** `lib/mlops/modelPerformanceTuner.js`

**Optimizations:**
- Temperature adjustment based on quality
- Max tokens optimization based on usage
- Task-specific profiles
- Quality-based recommendations

### Caching

**Multi-Tier Cache:**
- L1: Memory cache (1 hour TTL)
- L2: Redis cache (2 hours TTL)
- L3: Database cache (24 hours TTL)
- Semantic similarity matching

**Location:** `lib/mlops/multiTierCache.js`

---

## 📈 Training & Evaluation

### Training Scripts

**Quality Model:**
```bash
npm run train:quality
```

**Neural Network:**
```bash
npm run train:neural-network
```

**Transformer:**
```bash
npm run train:transformer
```

### Evaluation Metrics

**Regression (Quality Prediction):**
- R² score
- MAE (Mean Absolute Error)
- RMSE (Root Mean Squared Error)

**Classification:**
- Accuracy
- Precision
- Recall
- F1 score

### Model Comparison

**Location:** `lib/mlops/modelComparison.js`

**Features:**
- Compare multiple models
- A/B testing
- Performance benchmarking
- Cost analysis

---

## 🚀 Advanced Features

### 1. Ensemble Models

**Location:** `lib/mlops/ensembleService.js`

**Features:**
- Multiple model voting
- Weighted averaging
- Confidence scoring
- Fallback strategies

### 2. Fine-Tuning

**Location:** `lib/mlops/fineTuningService.js`

**Features:**
- Custom model fine-tuning
- Domain-specific adaptation
- Continuous improvement

### 3. Neural Architecture Search (NAS)

**Location:** `lib/mlops/nasService.js`

**Features:**
- Automatic architecture search
- Hyperparameter optimization
- Model efficiency

### 4. Federated Learning

**Location:** `lib/mlops/federatedLearningService.js`

**Features:**
- Distributed training
- Privacy-preserving
- Collaborative learning

### 5. Autonomous Evolution

**Location:** `lib/mlops/autonomousEvolutionService.js`

**Features:**
- Self-improving models
- Automatic retraining
- Continuous adaptation

---

## 📚 Key Files Reference

### Core ML/LLM Files

| File | Purpose |
|------|---------|
| `lib/mlops/modelRouter.js` | Model routing and API calls |
| `lib/mlops/smartModelSelector.js` | Auto model selection |
| `lib/mlops/llmCodeGenerator.js` | LLM code generation |
| `lib/mlops/contextAwareGenerator.js` | Context-aware generation |
| `lib/mlops/qualityRouter.js` | Quality-based routing |
| `lib/mlops/databaseWriter.js` | Prediction storage |
| `lib/mlops/feedbackCollector.js` | Feedback collection |
| `lib/mlops/trainingPipeline.js` | Training pipeline |
| `lib/mlops/storageClient.js` | Storage access |
| `lib/mlops/loadTrainingData.js` | Training data loader |

### Model Training Files

| File | Purpose |
|------|---------|
| `lib/models/trainQualityPredictor.js` | Quality predictor training |
| `lib/models/trainQualityPredictorXGBoost.js` | XGBoost training |
| `lib/models/neuralNetworkTrainer.js` | Neural network training |
| `lib/models/transformerTrainer.js` | Transformer training |

### AI Capability Files

| File | Purpose |
|------|---------|
| `lib/ai/codeReviewAutomation.js` | Automated code review |
| `lib/ai/contextAwareGenerator.js` | Context-aware generation |
| `lib/ai/documentationGenerator.js` | Documentation generation |
| `lib/ai/intelligentTestGenerator.js` | Test generation |
| `lib/ai/learningSystem.js` | Learning system |
| `lib/ai/multiFileRefactoring.js` | Multi-file refactoring |
| `lib/ai/predictiveCapabilities.js` | Predictive analytics |

---

## 🎓 Best Practices

### 1. Model Selection

- **Always use Smart Model Selector** - Don't hardcode models
- **Prefer custom models** - 97% cost savings
- **Fallback gracefully** - Handle model unavailability

### 2. Code Generation

- **Use Knowledge RAG** - Enhances context
- **Match codebase style** - Use context-aware generator
- **Include error handling** - Production-ready code
- **Add tests** - Comprehensive test coverage

### 3. Training Data

- **Use Storage-first pattern** - Check Storage, fallback to local
- **Combine multiple sources** - Production + GitHub + feedback
- **Validate data quality** - Remove outliers, handle missing values
- **Feature engineering** - Extract meaningful features

### 4. Model Training

- **Start with baseline** - Linear regression first
- **Iterate gradually** - XGBoost → Neural Network → Transformer
- **Track experiments** - Use MLflow
- **Evaluate properly** - Multiple metrics, cross-validation

### 5. Feedback Loop

- **Collect feedback actively** - Auto-prompts, user feedback
- **Link to predictions** - Use `prediction_id`
- **Update models regularly** - Retrain with new data
- **Monitor performance** - Track accuracy over time

---

## 🔍 Troubleshooting

### Model Not Found

**Issue:** No models available for code generation

**Solutions:**
1. Check `custom_models` table in Supabase
2. Ensure `is_active = true`
3. Run `node scripts/setup-beast-mode-model.js`
4. Verify endpoint URL is correct

### Low Quality Predictions

**Issue:** Quality predictions are inaccurate

**Solutions:**
1. Collect more training data
2. Retrain model with latest data
3. Check feature engineering
4. Try different model types (XGBoost, Neural Network)

### Slow Generation

**Issue:** Code generation is slow

**Solutions:**
1. Check caching (multi-tier cache)
2. Use faster models (GPT-3.5 vs GPT-4)
3. Reduce max_tokens
4. Optimize prompts

### Storage Access Issues

**Issue:** Cannot access Supabase Storage

**Solutions:**
1. Check `SUPABASE_SERVICE_ROLE_KEY`
2. Verify bucket exists (`ml-artifacts`)
3. Check RLS policies
4. Use local fallback

---

## 📊 Monitoring & Analytics

### Model Performance

**Location:** `lib/mlops/modelMonitoring.js`

**Metrics:**
- Request count
- Response time
- Error rate
- Quality scores
- Cost tracking

### Quality Metrics

**Location:** `lib/mlops/qualityMonitoring.js`

**Metrics:**
- Prediction accuracy
- Feedback rate
- Improvement rate
- Model performance

### Analytics Dashboard

**Location:** `lib/mlops/monitoringDashboard.js`

**Features:**
- Real-time metrics
- Model comparison
- Cost analysis
- Performance trends

---

## ✅ Expert Checklist

As an ML/LLM/AI expert, you should know:

- [x] Model routing and selection strategies
- [x] Custom model system and configuration
- [x] Training pipeline and data collection
- [x] Storage system (Supabase Storage)
- [x] Feedback loop and continuous learning
- [x] Context-aware generation
- [x] Quality prediction models
- [x] AI capabilities (9 integrated systems)
- [x] Model training and evaluation
- [x] Performance tuning and optimization
- [x] Troubleshooting common issues

---

**Last Updated:** 2026-01-22  
**Status:** ✅ Expert Onboarding Complete
