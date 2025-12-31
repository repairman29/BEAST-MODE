# Debugging Service Loading - All Services Missing

**Issue**: All 6 services showing as `undefined` - files not loading

---

## 🔍 **IMMEDIATE CHECKS**

### **1. Check Network Tab for 404 Errors**

In browser DevTools:
1. Open **Network** tab
2. Filter by **JS** (JavaScript)
3. Refresh the page
4. Look for these files:
   - `contextOptimizer.js` - Should be **200**, not **404**
   - `contextPredictor.js` - Should be **200**, not **404**
   - `contextManager.js` - Should be **200**, not **404**
   - `primaryNarrativeEngine.js` - Should be **200**, not **404**
   - `advancedNarrativeEngine.js` - Should be **200**, not **404**
   - `unifiedSystemIntegration.js` - Should be **200**, not **404**

**If you see 404 errors**: Files don't exist at those paths on the server.

### **2. Check Console for JavaScript Errors**

Look for:
- **Red error messages**
- **Syntax errors**
- **Reference errors**
- **Initialization errors**

Common errors:
- `Uncaught SyntaxError` - JavaScript syntax error in file
- `Uncaught ReferenceError` - Variable not defined
- `Failed to load resource` - File not found

### **3. Check for Initialization Messages**

You should see these messages if files load:
```
[ContextOptimizer] ✅ Initialized and available on window.contextOptimizer
[PrimaryNarrativeEngine] ✅ Initialized and available on window.primaryNarrativeEngine
[UnifiedSystemIntegration] ⏳ Waiting for SystemBridge...
```

**If you don't see these**: Files aren't executing (either not loading or have errors).

---

## 🔧 **POSSIBLE CAUSES**

### **Cause 1: Files Don't Exist on Server**

**Check**: Network tab shows 404 errors

**Fix**: 
- Verify files exist in `public/js/` directory
- Check file paths match HTML script tags exactly
- Ensure files are deployed to server

### **Cause 2: JavaScript Errors in Files**

**Check**: Console shows red errors

**Fix**:
- Look at specific error message
- Check line number mentioned in error
- Fix syntax/reference errors

### **Cause 3: Script Loading Order**

**Check**: Scripts load but services still undefined

**Fix**:
- Ensure services load before code that uses them
- Check HTML script order

### **Cause 4: Server Not Serving Files**

**Check**: Network tab shows no request for files

**Fix**:
- Verify server is running
- Check server configuration
- Verify static file serving is enabled

---

## 📋 **DEBUGGING STEPS**

### **Step 1: Verify Files Exist**

Run in terminal (from project root):
```bash
ls -la src/frontend/frontend/mvp-frontend-only/public/js/aiGM/contextOptimizer.js
ls -la src/frontend/frontend/mvp-frontend-only/public/js/aiGM/core/primaryNarrativeEngine.js
ls -la src/frontend/frontend/mvp-frontend-only/public/js/core/unifiedSystemIntegration.js
```

All should show file exists.

### **Step 2: Check Network Tab**

1. Open DevTools → Network tab
2. Filter by "JS"
3. Refresh page
4. Search for service file names
5. Check status codes

### **Step 3: Check Console for Errors**

1. Open DevTools → Console tab
2. Look for red errors
3. Note specific error messages
4. Check line numbers

### **Step 4: Manually Test File Loading**

Try loading a file directly in browser:
```
http://localhost:PORT/js/aiGM/contextOptimizer.js
```

Replace `PORT` with your server port. Should see JavaScript code, not 404.

---

## 🚨 **MOST LIKELY ISSUE**

Based on all services missing, most likely:

1. **Files not deployed to server** - Check if files exist in deployed location
2. **404 errors in Network tab** - Files don't exist at expected paths
3. **Server not serving static files** - Server configuration issue

---

## ✅ **NEXT STEPS**

1. **Check Network tab** - Look for 404 errors
2. **Check Console** - Look for JavaScript errors  
3. **Verify files exist** - Check file system
4. **Test direct file access** - Try loading file URL directly
5. **Check server logs** - Look for file serving errors

**Share the results**:
- Network tab status codes for service files
- Any console errors
- Whether files exist on file system

---

**Status**: 🔍 **Debugging Required - Check Network Tab First**

