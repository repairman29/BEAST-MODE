# ML Training Logging

**Date:** January 8, 2026  
**Status:** ✅ **Training Results Logging Implemented**

## 📊 What We Log

### Database Tables

1. **`ml_predictions`** - All predictions made
   - Service name, prediction type, predicted/actual values
   - Confidence, context (features), model version
   - Created automatically when predictions are made

2. **`ml_feedback`** - All feedback collected
   - Prediction ID, feedback type, feedback score
   - User ID, metadata (source, bot name, etc.)
   - Created automatically when feedback is collected

3. **`ml_performance_metrics`** - Training results
   - Service name, metric name (r2_train, r2_test, r2_cv, mae, rmse)
   - Metric value, period (start/end), metadata
   - **Created by logging scripts** ✅

## 🔧 Logging Scripts

### 1. `log-training-results.js`
Manually log training results to database:
```bash
node scripts/log-training-results.js
```

Or with specific values:
```bash
node scripts/log-training-results.js xgboost 0.305 -0.097 -0.085 0.187 0.231 174 33
```

### 2. `auto-log-training-results.py`
Automatically logs from latest model metadata:
```bash
python3 scripts/auto-log-training-results.py
```

### 3. `query-training-history.js`
View all logged training results:
```bash
node scripts/query-training-history.js
```

## 🔄 Auto-Logging

### Integrated into Training Scripts

**`train_xgboost.py`:**
- ✅ Automatically logs results after training
- Reads from model metadata file
- Logs to `ml_performance_metrics` table

**`comprehensive-model-improvements.py`:**
- ✅ Automatically logs best model results
- Logs after comparing all models
- Includes model type and hyperparameters

## 📈 What Gets Logged

### Metrics Logged
- **R² (train)** - Training set R² score
- **R² (test)** - Test set R² score
- **R² (CV)** - Cross-validation R² score (with std)
- **MAE** - Mean Absolute Error
- **RMSE** - Root Mean Squared Error

### Metadata Logged
- Model type (xgboost, random-forest, neural-network)
- Dataset size (number of examples)
- Feature count
- Hyperparameters
- Training date
- CV standard deviation

## 🎯 Usage

### After Training
```bash
# Train model (auto-logs)
python3 scripts/train_xgboost.py --data real-only

# Or manually log
node scripts/log-training-results.js
```

### View History
```bash
# See all training runs
node scripts/query-training-history.js
```

### Query Database Directly
```sql
SELECT * FROM ml_performance_metrics 
WHERE service_name = 'beast-mode' 
ORDER BY created_at DESC 
LIMIT 20;
```

## 📊 Example Output

```
📊 Training History from Database

======================================================================

📈 Found 3 training runs:

Run 1: 1/8/2026, 9:37:21 AM
   Model: xgboost-tuned
   Dataset: 174 examples
   Features: 33
   R² (train): 0.305
   R² (test):  -0.097 ❌
   R² (CV):    -0.085 (+/- 0.078) ❌
   MAE:        0.187
   RMSE:       0.231

Run 2: 1/8/2026, 9:33:57 AM
   Model: xgboost
   Dataset: 174 examples
   Features: 33
   R² (train): 0.218
   R² (test):  -0.013 ❌
   R² (CV):    -0.032 (+/- 0.057) ❌
   MAE:        0.116
   RMSE:       0.164

📈 Trend:
   R² (CV): -0.032 → -0.085 (⬇️ -0.053)
```

## ✅ Status

- ✅ Database tables exist (`ml_performance_metrics`)
- ✅ Logging scripts created
- ✅ Auto-logging integrated into training scripts
- ✅ Query script for viewing history
- ✅ All training results are now logged!

---

**Next:** All future training runs will be automatically logged! 🎉
