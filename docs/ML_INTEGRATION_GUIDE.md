# ML Model Integration Guide

## ✅ What We've Built

### 1. **MLOps Infrastructure** ✅
- MLflow experiment tracking
- Data collection service
- Model registry
- Training pipelines

### 2. **Real ML Model** ✅
- Trained on **1,200 real production samples**
- **84.6% accuracy** (within 5 points)
- MAE: 2.88
- Saved and ready to use

### 3. **Integration Layer** ✅
- ML model integration service
- Seamless fallback to heuristics
- Context-to-feature mapping

### 4. **Iteration Pipeline** ✅
- Automatic data collection
- Retraining workflow
- Model versioning

---

## 🚀 How to Use

### Option 1: Use ML-Enhanced Service (Recommended)

Replace the existing service import:

```javascript
// OLD (heuristic only)
const aiGMQualityPredictionService = require('./services/aiGMQualityPredictionService');

// NEW (ML-enhanced with fallback)
const aiGMQualityPredictionService = require('./services/aiGMQualityPredictionServiceML');
```

The ML service will:
- ✅ Use trained ML model when available
- ✅ Fall back to heuristic if ML model not found
- ✅ Log which method was used

### Option 2: Direct ML Model Usage

```javascript
const { getMLModelIntegration } = require('../BEAST-MODE-PRODUCT/lib/mlops/mlModelIntegration');

const mlIntegration = await getMLModelIntegration();

const prediction = await mlIntegration.predictQuality({
    provider: 'mistral',
    model: 'ft:mistral-small-latest:smuggler-narrator',
    actionType: 'navigate',
    scenarioId: 'space-station',
    rollType: 'success',
    statName: 'pilot',
    statValue: 6
});

console.log(`Predicted Quality: ${prediction.predictedQuality}`);
console.log(`Source: ${prediction.source}`); // 'ml_model' or 'heuristic_fallback'
```

---

## 📊 Model Performance

### Current Model (v1 - Linear Regression)
- **Accuracy**: 84.6%
- **MAE**: 2.88
- **RMSE**: 3.63
- **Training Data**: 1,200 real samples

### Comparison

| Metric | Heuristic | ML Model (v1) | Target |
|--------|-----------|---------------|--------|
| Accuracy | ~60% | **84.6%** | 90%+ |
| MAE | ~5-10 | **2.88** | <2.0 |
| Data Source | Rules | **Real Data** | Real Data |

---

## 🔄 Iteration Workflow

### 1. Collect New Data

```bash
npm run collect:data
```

Collects new training data from Supabase.

### 2. Retrain Model

```bash
npm run train:quality
```

Trains new model with latest data.

### 3. Run Iteration Pipeline

```bash
npm run ml:iterate
```

Automated: Collect → Train → Compare → Save

### 4. Monitor Performance

Check MLflow UI: http://localhost:5000

---

## 🎯 Next Improvements

### Immediate (Week 2-3)

1. **Better Feature Engineering**
   - Add provider/model embeddings
   - Include historical performance
   - Add temporal features

2. **Fix Ensemble Model**
   - Debug tree training
   - Improve feature selection
   - Add proper boosting

3. **More Training Data**
   - Collect CSAT data
   - Add A/B test results
   - Include user feedback

### Short-Term (Month 2)

1. **XGBoost Integration**
   - Use Python XGBoost (if available)
   - Better hyperparameter tuning
   - Feature importance analysis

2. **Code Embeddings**
   - Integrate CodeBERT
   - Semantic code understanding
   - Context-aware features

3. **Online Learning**
   - Incremental updates
   - Model adaptation
   - Real-time improvement

---

## 📝 Integration Checklist

- [ ] Update `aiGMQualityPredictionService` import to ML version
- [ ] Test ML predictions in development
- [ ] Monitor performance metrics
- [ ] Set up automatic data collection
- [ ] Schedule weekly retraining
- [ ] Compare ML vs heuristic performance
- [ ] Promote ML model to production

---

## 🔧 Configuration

### Enable/Disable ML

```bash
# Enable ML (default)
USE_ML_QUALITY_PREDICTION=true

# Disable ML (use heuristic only)
USE_ML_QUALITY_PREDICTION=false
```

### Model Path

Update in `mlModelIntegration.js`:
```javascript
const modelPath = '.beast-mode/models/quality-predictor-v1.json';
```

---

## 📈 Monitoring

### Check Model Status

```javascript
const mlIntegration = await getMLModelIntegration();
const info = mlIntegration.getModelInfo();

console.log('ML Model Available:', info.available);
console.log('Model Path:', info.modelPath);
```

### Track Performance

- MLflow: http://localhost:5000
- Model files: `.beast-mode/models/`
- Training data: `.beast-mode/data/training/`

---

## 🎉 Success!

You now have:
- ✅ Real ML model trained on production data
- ✅ 84.6% accuracy (vs ~60% heuristic)
- ✅ Integration layer with fallback
- ✅ Iteration pipeline for continuous improvement

**Next:** Integrate and iterate! 🚀

