# Copy Unified Service Files to Deployment

**Issue**: Files exist in source but server might be serving from deployment directory

---

## 📋 **FILES TO COPY**

The unified service files need to be in the deployment directory:

**Source**: `src/frontend/frontend/mvp-frontend-only/public/js/`
**Deploy**: `playsmuggler-deploy/js/`

### **Files to Copy**:

1. `js/aiGM/contextOptimizer.js`
2. `js/aiGM/contextPredictor.js`
3. `js/aiGM/contextManager.js`
4. `js/aiGM/core/primaryNarrativeEngine.js`
5. `js/aiGM/core/advancedNarrativeEngine.js`
6. `js/core/unifiedSystemIntegration.js`
7. `js/utils/checkUnifiedServices.js` (optional)
8. `js/utils/quickServiceCheck.js` (optional)

---

## 🔧 **COPY COMMAND**

```bash
# From project root
cp src/frontend/frontend/mvp-frontend-only/public/js/aiGM/contextOptimizer.js playsmuggler-deploy/js/aiGM/
cp src/frontend/frontend/mvp-frontend-only/public/js/aiGM/contextPredictor.js playsmuggler-deploy/js/aiGM/
cp src/frontend/frontend/mvp-frontend-only/public/js/aiGM/contextManager.js playsmuggler-deploy/js/aiGM/
cp src/frontend/frontend/mvp-frontend-only/public/js/aiGM/core/primaryNarrativeEngine.js playsmuggler-deploy/js/aiGM/core/
cp src/frontend/frontend/mvp-frontend-only/public/js/aiGM/core/advancedNarrativeEngine.js playsmuggler-deploy/js/aiGM/core/
cp src/frontend/frontend/mvp-frontend-only/public/js/core/unifiedSystemIntegration.js playsmuggler-deploy/js/core/
cp src/frontend/frontend/mvp-frontend-only/public/js/utils/checkUnifiedServices.js playsmuggler-deploy/js/utils/
cp src/frontend/frontend/mvp-frontend-only/public/js/utils/quickServiceCheck.js playsmuggler-deploy/js/utils/
```

---

## ✅ **VERIFY**

After copying, verify files exist:

```bash
ls -la playsmuggler-deploy/js/aiGM/contextOptimizer.js
ls -la playsmuggler-deploy/js/aiGM/core/primaryNarrativeEngine.js
ls -la playsmuggler-deploy/js/core/unifiedSystemIntegration.js
```

---

## 🚀 **AFTER COPYING**

1. **Restart server** (if needed)
2. **Refresh browser**
3. **Check Network tab** - files should load with 200 status
4. **Run diagnostic**: `quickCheck()` in console

---

**Status**: 📋 **Files Need to be Copied to Deployment Directory**

