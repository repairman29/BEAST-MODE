# Getting ML Models Running

## ✅ Status: Models Are Working!

The ML models are now functional. Here's what was fixed and how to verify:

## 🔧 What Was Fixed

1. **Missing `path` import in `loadModel()`** - Added `const path = require('path');` at the start of the function
2. **Model path resolution** - Fixed directory detection for XGBoost models
3. **Fallback support** - API now uses fallback when model unavailable (no more 503 errors)

## 🧪 Verification

Run the test script to verify everything works:

```bash
cd /Users/jeffadkins/Smugglers/BEAST-MODE-PRODUCT
node scripts/test-model-loading.js
```

Expected output:
- ✅ Model available: true
- ✅ Prediction successful!
- Quality: [some percentage]
- Confidence: [some percentage]
- Source: ml_model

## 🚀 How It Works

### Model Loading Process

1. **Initialization** (`mlModelIntegration.initialize()`):
   - Searches for XGBoost models in `.beast-mode/models/`
   - Falls back to `model-notable-quality-*.json` if no XGBoost found
   - Loads model metadata and sets up prediction function

2. **Prediction** (`mlIntegration.predictQuality()`):
   - Extracts features from context
   - Calls Python script (`predict_xgboost.py`) for XGBoost models
   - Returns quality score (0-1) with confidence

### Model Files Required

For XGBoost models:
- `model-xgboost-YYYY-MM-DDTHH-MM-SS/model.json` - The trained model
- `model-xgboost-YYYY-MM-DDTHH-MM-SS/model-metadata.json` - Model metadata

Location: `.beast-mode/models/`

## 🔍 Troubleshooting

### If models still don't load:

1. **Check model files exist:**
   ```bash
   ls -la .beast-mode/models/model-xgboost-*/
   ```

2. **Check Python/XGBoost:**
   ```bash
   python3 --version
   python3 -c "import xgboost; print(xgboost.__version__)"
   ```

3. **Check server logs:**
   - Look for `[Quality API] ML Integration initialized successfully`
   - Look for `[Quality API] Model available: true`
   - Check for any error messages

4. **Test from website directory:**
   ```bash
   cd website
   node ../scripts/test-model-loading.js
   ```

### Common Issues

**Issue: "path is not defined"**
- ✅ Fixed: Added `path` import to `loadModel()`

**Issue: "Model not available"**
- Check model files exist in `.beast-mode/models/`
- Check path resolution (especially when running from `website/` subdirectory)

**Issue: "Python script not found"**
- Verify `scripts/predict_xgboost.py` exists
- Check path resolution when running from `website/` subdirectory

**Issue: "XGBoost not installed"**
- Install: `pip3 install xgboost numpy scikit-learn`

## 📊 Current Model Status

- **XGBoost Model**: ✅ Available
- **Location**: `.beast-mode/models/model-xgboost-2026-01-06T19-06-51/`
- **Python**: ✅ Python 3.9.6
- **XGBoost**: ✅ Version 2.1.4
- **Test Prediction**: ✅ Working (29.0% quality, 99.0% confidence)

## 🎯 Next Steps

1. **Restart dev server** to pick up the fix:
   ```bash
   cd website
   PORT=7777 npm run dev
   ```

2. **Test the API**:
   ```bash
   curl -X POST http://localhost:7777/api/repos/quality \
     -H "Content-Type: application/json" \
     -d '{"repo": "test/repo", "features": {"stars": 100, "forks": 50}}'
   ```

3. **Check browser console** - Should see successful API calls (no more 503 errors)

4. **Verify predictions** - Quality scores should be from ML model, not fallback

## 📝 Notes

- The API will use fallback (0.75 quality) if model fails to load
- Fallback responses include `"warning": "Using fallback prediction - ML model not available"`
- When model is working, responses include `"source": "ml_model"`

