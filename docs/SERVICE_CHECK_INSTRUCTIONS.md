# Service Check Instructions

**Quick Check**: Run this in browser console:

```javascript
quickCheck()
```

This will show a simple status of all 6 services.

---

## 🔍 **What to Look For**

### **If All Services Load (✅)**
```
✅ ContextOptimizer              LOADED (object, 15 methods)
✅ ContextPredictor              LOADED (object, 12 methods)
✅ ContextManager                LOADED (object, 10 methods)
✅ PrimaryNarrativeEngine         LOADED (object, 8 methods)
✅ AdvancedNarrativeEngine        LOADED (object, 6 methods)
✅ UnifiedSystemIntegration      LOADED (object, 20 methods)

📊 Result: 6/6 services loaded
✅ All services are loaded and ready!
```

### **If Some Services Missing (⚠️)**
```
✅ ContextOptimizer              LOADED (object, 15 methods)
❌ ContextPredictor              MISSING (undefined, 0 methods)
   └─ window.contextpredictor is undefined
✅ ContextManager                LOADED (object, 10 methods)
...

📊 Result: 4/6 services loaded
⚠️  2 service(s) failed to load. Check console for errors.
```

### **If No Services Load (❌)**
```
❌ ContextOptimizer              MISSING (undefined, 0 methods)
❌ ContextPredictor              MISSING (undefined, 0 methods)
...

📊 Result: 0/6 services loaded
❌ No services loaded. Possible issues:
   1. Check Network tab for 404 errors
   2. Check Console for JavaScript errors
   3. Verify files exist at expected paths
   4. Check script loading order
```

---

## 🚨 **Troubleshooting**

### **Check Network Tab**
1. Open DevTools → Network tab
2. Filter by "JS"
3. Look for these files:
   - `contextOptimizer.js`
   - `contextPredictor.js`
   - `contextManager.js`
   - `primaryNarrativeEngine.js`
   - `advancedNarrativeEngine.js`
   - `unifiedSystemIntegration.js`
4. Check status codes:
   - ✅ 200 = Loaded successfully
   - ❌ 404 = File not found
   - ❌ 500 = Server error

### **Check Console for Errors**
Look for:
- Red error messages
- Syntax errors
- Reference errors
- Initialization errors

### **Check Initialization Messages**
You should see:
```
[ContextOptimizer] ✅ Initialized and available on window.contextOptimizer
[PrimaryNarrativeEngine] ✅ Initialized and available on window.primaryNarrativeEngine
[UnifiedSystemIntegration] ⏳ Waiting for SystemBridge...
```

If you don't see these, the files might not be loading.

---

## 📋 **Next Steps Based on Results**

### **If All Loaded ✅**
- Services are working!
- You can now use them in your code
- Proceed with integration

### **If Some Missing ⚠️**
- Check Network tab for failed file loads
- Check Console for specific errors
- Verify file paths in HTML

### **If None Loaded ❌**
- Check if files exist on server
- Verify HTML script tags are correct
- Check for JavaScript errors blocking execution
- Verify server is serving files correctly

---

**Run**: `quickCheck()` in console to see status

