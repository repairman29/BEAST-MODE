# MLOps Infrastructure

## Overview

This directory contains the MLOps infrastructure for BEAST MODE, including experiment tracking, data collection, and model training pipelines.

## Quick Start

### 1. Install MLflow (Optional but Recommended)

```bash
pip install mlflow
```

### 2. Start MLflow Tracking Server

```bash
npm run mlflow:start
# Or manually:
mlflow ui --port 5000 --host 0.0.0.0
```

Access MLflow UI at: http://localhost:5000

### 3. Train Your First Model

```bash
npm run train:quality
```

This will:
- Collect/generate training data
- Train a quality prediction model
- Log experiment to MLflow
- Save model to `.beast-mode/models/`

## Services

### MLflowService

Experiment tracking and model registry.

```javascript
const { getMLflowService } = require('./mlops/mlflowService');

const mlflow = getMLflowService();
await mlflow.initialize();
await mlflow.startRun('my-experiment');
await mlflow.logMetric('accuracy', 0.95);
await mlflow.logParam('learning_rate', 0.01);
await mlflow.endRun();
```

### DataCollectionService

Collects training data from various sources.

```javascript
const { getDataCollectionService } = require('./mlops/dataCollection');

const dataCollection = await getDataCollectionService();

// Collect quality data
await dataCollection.collectQualityData({
    codeMetrics: { codeQuality: 85, testCoverage: 80 },
    qualityScore: 82,
    csatScore: 0.85
});

// Get training data
const trainingData = await dataCollection.getTrainingData('quality', {
    minSamples: 100
});
```

### QualityPredictorTrainer

Trains quality prediction models.

```javascript
const { QualityPredictorTrainer } = require('./models/trainQualityPredictor');

const trainer = new QualityPredictorTrainer();
const result = await trainer.train({
    useMLflow: true,
    testSize: 0.2
});

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

## Directory Structure

```
lib/mlops/
├── mlflowService.js          # MLflow integration
├── dataCollection.js          # Data collection service
└── README.md                  # This file

lib/models/
├── trainQualityPredictor.js   # Quality predictor training
└── ...

scripts/
├── train-quality-model.js     # Training script
└── ...
```

## Environment Variables

```bash
# MLflow Configuration
MLFLOW_TRACKING_URI=http://localhost:5000
MLFLOW_EXPERIMENT_NAME=beast-mode-experiments

# Data Collection
BEAST_MODE_DATA_DIR=.beast-mode/data/training
```

## Data Storage

Training data is stored in:
- `.beast-mode/data/training/` - Collected training data
- `.beast-mode/models/` - Trained models
- MLflow artifacts (if MLflow server is running)

## Next Steps

1. **Collect Real Data**: Integrate data collection with existing services
2. **Improve Models**: Replace simple linear regression with XGBoost/Neural Networks
3. **Add More Models**: Train fix predictor, code quality scorer, etc.
4. **Production Deployment**: Set up model serving infrastructure

See `docs/AI_ML_MATURATION_ROADMAP.md` for the full 12-month plan.

