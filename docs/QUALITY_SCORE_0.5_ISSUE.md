# Quality Score 0.5 Issue Analysis

**Date:** January 2026  
**Status:** ⚠️ **Issue Identified**

---

## 🔍 **PROBLEM**

Quality scores are consistently returning **0.5** for all repositories, which indicates a fallback is being used.

---

## 📊 **FINDINGS**

### **Fallback Values:**
1. **Default Fallback:** `0.75` (when model not available)
2. **XGBoost Failure Fallback:** `0.5` (when XGBoost prediction fails)
3. **Sync Prediction Fallback:** `0.5` (when `predictSync` is called instead of async)

### **Code Locations:**

**File:** `lib/mlops/mlModelIntegration.js`

```javascript
// Line 260: XGBoost prediction failure
catch (error) {
    log.warn('XGBoost prediction failed, using fallback:', error.message);
    return 0.5; // Fallback
}

// Line 268: Sync prediction fallback
log.warn('XGBoost requires async prediction - use predictQuality() instead of predictQualitySync()');
return 0.5; // Fallback
```

**File:** `website/app/api/repos/quality/route.ts`

```javascript
// Line 870-872: Warning when quality is exactly 0.5
if (quality === 0.5 && !usingFallback) {
  console.warn(`[Quality API] Warning: Quality score is exactly 0.5 for ${repo}. This may indicate a prediction issue.`);
}
```

---

## 🐛 **ROOT CAUSE**

The quality score of **0.5** indicates one of these issues:

1. **XGBoost Model Failure:**
   - Model file not found or corrupted
   - Model loading error
   - Prediction execution error

2. **Async/Sync Mismatch:**
   - `predictQualitySync()` being called instead of `predictQuality()`
   - XGBoost requires async prediction

3. **Feature Extraction Issues:**
   - Missing or invalid features
   - Feature vector format mismatch

---

## ✅ **SOLUTION**

### **1. Check Model Availability:**
```javascript
if (!mlIntegration || !mlIntegration.isMLModelAvailable()) {
  // Use default fallback (0.75)
}
```

### **2. Use Async Prediction:**
```javascript
// ✅ CORRECT: Use async
const prediction = await mlIntegration.predictQuality({ features });

// ❌ WRONG: Don't use sync
const prediction = mlIntegration.predictQualitySync({ features });
```

### **3. Check Model Loading:**
- Verify model file exists: `models/model-notable-quality-*.json`
- Check model initialization logs
- Verify XGBoost is properly installed

### **4. Improve Error Handling:**
- Log detailed error messages when XGBoost fails
- Distinguish between "model not available" vs "prediction failed"
- Add retry logic for transient failures

---

## 🔧 **RECOMMENDED FIXES**

### **Fix 1: Better Error Logging**
```javascript
catch (error) {
    log.error('XGBoost prediction failed:', {
        error: error.message,
        stack: error.stack,
        features: Object.keys(features).length,
        modelPath: this.modelPath
    });
    return 0.5; // Fallback
}
```

### **Fix 2: Distinguish Fallback Types**
```javascript
// Return different fallback values to identify the issue
if (error.message.includes('model not found')) {
    return { predictedQuality: 0.75, source: 'model_not_found' };
} else if (error.message.includes('async')) {
    return { predictedQuality: 0.5, source: 'sync_call_error' };
} else {
    return { predictedQuality: 0.5, source: 'prediction_failed' };
}
```

### **Fix 3: Check Model Status**
```javascript
// Add method to check model health
isModelHealthy() {
    return this.qualityPredictor && 
           this.qualityPredictor.trained && 
           this.modelPath && 
           require('fs').existsSync(this.modelPath);
}
```

---

## 📝 **TOKEN HANDLING (Supabase)**

According to cursor rules and codebase:

### **Storage:**
- API keys stored in Supabase `user_api_keys` table
- Encrypted using AES-256-GCM
- Format: `iv:authTag:encryptedData`

### **Retrieval:**
- Function: `getUserApiKey(userId, provider)` in `lib/api-keys-decrypt.ts`
- Decrypts server-side only
- Uses `API_KEYS_ENCRYPTION_KEY` environment variable

### **Providers Supported:**
- `openai`, `anthropic`, `gemini`, `mistral`, `together`
- `replicate`, `cohere`, `groq`, `stability`, `elevenlabs`, `suno`
- `linear`, `github`, `stripe`

---

## 🎯 **NEXT STEPS**

1. **Check Model Status:**
   ```bash
   # Verify model file exists
   ls -la BEAST-MODE-PRODUCT/models/model-notable-quality-*.json
   ```

2. **Check Logs:**
   - Look for "XGBoost prediction failed" warnings
   - Check for "XGBoost requires async prediction" warnings
   - Verify model initialization logs

3. **Test Prediction:**
   - Test with a known good repository
   - Check if model loads successfully
   - Verify feature extraction works

4. **Fix Async/Sync Issue:**
   - Ensure all calls use `predictQuality()` (async)
   - Remove any `predictQualitySync()` calls

---

**Status:** ⚠️ **Needs Investigation** | 🔧 **Action Required**
