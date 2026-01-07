# 🚀 Quick Start: ML/AI Maturation

## Get Started in 5 Minutes!

### Step 1: Setup MLflow (Optional but Recommended)

```bash
# Install MLflow
pip install mlflow

# Or if you prefer npm (if available)
npm install -g mlflow
```

### Step 2: Initialize Infrastructure

```bash
cd BEAST-MODE-PRODUCT
npm run mlflow:init
```

This creates necessary directories and configuration files.

### Step 3: Start MLflow Server (Optional)

```bash
npm run mlflow:start
```

Access MLflow UI at: http://localhost:5000

### Step 4: Train Your First Model!

```bash
npm run train:quality
```

This will:
- ✅ Generate synthetic training data (if needed)
- ✅ Train a quality prediction model
- ✅ Log experiment to MLflow
- ✅ Save model to `.beast-mode/models/`

### Step 5: View Results

1. **MLflow UI**: http://localhost:5000
   - View experiments
   - Compare model performance
   - Download models

2. **Model Files**: `.beast-mode/models/quality-predictor-v1.json`

## What's Next?

### Integrate with Existing Services

Replace heuristic models with real ML:

```javascript
// In aiGMQualityPredictionService.js
const { QualityPredictorTrainer } = require('./models/trainQualityPredictor');
const trainer = new QualityPredictorTrainer();
await trainer.loadModel('.beast-mode/models/quality-predictor-v1.json');

// Use model
const prediction = trainer.predict({
    codeQuality: 85,
    testCoverage: 80,
    security: 90,
    performance: 75,
    maintainability: 80,
    complexity: 30
});
```

### Collect Real Data

Integrate data collection with your services:

```javascript
const { getDataCollectionService } = require('./mlops/dataCollection');

const dataCollection = await getDataCollectionService();

// Collect quality data from actual usage
await dataCollection.collectQualityData({
    codeMetrics: { /* actual metrics */ },
    qualityScore: actualScore,
    csatScore: userFeedback
});
```

## Available Commands

```bash
# MLflow
npm run mlflow:start      # Start MLflow server
npm run mlflow:init       # Initialize infrastructure

# Training
npm run train:quality    # Train quality predictor model

# Status
npm run ml:status         # Check ML system status
```

## Troubleshooting

### MLflow Not Found

```bash
pip install mlflow
```

### Port 5000 Already in Use

```bash
# Use different port
MLFLOW_TRACKING_URI=http://localhost:5001 mlflow ui --port 5001
```

### Insufficient Training Data

The training script will automatically generate synthetic data for demonstration. For production, integrate with real data collection.

## Full Roadmap

See `docs/AI_ML_MATURATION_ROADMAP.md` for the complete 12-month plan!

---

**🎉 You're ready to start! Run `npm run train:quality` to train your first model!**

