# Troubleshooting Service Loading Issues

**Issue**: Services showing as `undefined` in browser console

---

## 🔍 **DIAGNOSIS**

If you see `undefined` when checking for services:
```javascript
console.log('ContextOptimizer:', !!window.contextOptimizer); // undefined
```

This means the services aren't loading. Possible causes:

1. **File Path Issues**: Files don't exist at expected paths
2. **JavaScript Errors**: Files have errors preventing execution
3. **Loading Order**: Services loading after code tries to use them
4. **Script Tag Issues**: Scripts not being loaded in HTML

---

## ✅ **VERIFICATION STEPS**

### **1. Check Files Exist**

Verify files exist at these paths:
- `/js/aiGM/contextOptimizer.js`
- `/js/aiGM/contextPredictor.js`
- `/js/aiGM/contextManager.js`
- `/js/aiGM/core/primaryNarrativeEngine.js`
- `/js/aiGM/core/advancedNarrativeEngine.js`
- `/js/core/unifiedSystemIntegration.js`

### **2. Check Browser Console for Errors**

Open browser DevTools Console and check for:
- 404 errors (file not found)
- JavaScript syntax errors
- Reference errors

### **3. Check Network Tab**

In DevTools Network tab:
- Filter by "JS"
- Look for the service files
- Check if they're loading (status 200) or failing (404, 500)

### **4. Verify Script Loading Order**

Services should load **before** `core.js`:
```javascript
// Correct order:
"/js/aiGM/contextOptimizer.js",
"/js/aiGM/contextPredictor.js",
"/js/aiGM/contextManager.js",
"/js/aiGM/core/primaryNarrativeEngine.js",
"/js/aiGM/core/advancedNarrativeEngine.js",
"/js/core/unifiedSystemIntegration.js",
// ... other scripts ...
"/js/aiGM/core.js", // Loads AFTER unified services
```

---

## 🔧 **FIXES**

### **Fix 1: Verify File Paths**

Check that files exist in the public directory:
```bash
# From project root
ls -la src/frontend/frontend/mvp-frontend-only/public/js/aiGM/contextOptimizer.js
ls -la src/frontend/frontend/mvp-frontend-only/public/js/aiGM/core/primaryNarrativeEngine.js
ls -la src/frontend/frontend/mvp-frontend-only/public/js/core/unifiedSystemIntegration.js
```

### **Fix 2: Check for JavaScript Errors**

Open browser console and look for:
- Syntax errors
- Reference errors
- Type errors

Common issues:
- Missing dependencies
- Undefined variables
- Incorrect module exports

### **Fix 3: Add Debug Logging**

Add to service files to verify they're executing:
```javascript
// At end of contextOptimizer.js
if (typeof window !== "undefined") {
  console.log("[ContextOptimizer] Initializing...");
  window.contextOptimizer = new ContextOptimizer();
  console.log("[ContextOptimizer] ✅ Initialized:", !!window.contextOptimizer);
}
```

### **Fix 4: Check Loading Timing**

Services might load asynchronously. Wait for them:
```javascript
// Wait for services to load
function waitForServices(callback, maxWait = 5000) {
  const start = Date.now();
  const check = setInterval(() => {
    if (window.contextOptimizer && 
        window.primaryNarrativeEngine && 
        window.unifiedSystemIntegration) {
      clearInterval(check);
      callback();
    } else if (Date.now() - start > maxWait) {
      clearInterval(check);
      console.error("Services failed to load within", maxWait, "ms");
    }
  }, 100);
}

waitForServices(() => {
  console.log("All services loaded!");
  console.log('ContextOptimizer:', !!window.contextOptimizer);
  console.log('PrimaryNarrativeEngine:', !!window.primaryNarrativeEngine);
  console.log('UnifiedSystemIntegration:', !!window.unifiedSystemIntegration);
});
```

---

## 📋 **QUICK CHECKLIST**

- [ ] Files exist at correct paths
- [ ] No 404 errors in Network tab
- [ ] No JavaScript errors in Console
- [ ] Scripts load in correct order
- [ ] Services initialize after DOM ready
- [ ] Check for timing issues (async loading)

---

## 🚨 **COMMON ISSUES**

### **Issue: Files Not Found (404)**

**Solution**: Verify file paths match HTML script tags exactly.

### **Issue: Syntax Errors**

**Solution**: Check browser console for specific error messages.

### **Issue: Services Load But Are Undefined**

**Solution**: Check that services export to `window` correctly:
```javascript
// Should be in each service file:
if (typeof window !== "undefined") {
  window.serviceName = new ServiceName();
}
```

### **Issue: Timing - Services Load After Code Runs**

**Solution**: Use `DOMContentLoaded` or wait for services:
```javascript
document.addEventListener('DOMContentLoaded', () => {
  // Services should be available now
  console.log('ContextOptimizer:', !!window.contextOptimizer);
});
```

---

**Status**: 📋 **Troubleshooting Guide**

