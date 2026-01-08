# Custom Models - Improvements Needed

## Test Results Summary

**Date:** January 8, 2026  
**Status:** ✅ Core functionality working, ⚠️ Some improvements needed

---

## ✅ What's Working

1. **Model Registration** ✅
   - Setup wizard works perfectly
   - Models stored in database
   - Encryption working

2. **Auto-Selection** ✅
   - Smart model selector working
   - Automatically picks custom models
   - Falls back to provider models

3. **Model Listing** ✅
   - Shows all models (custom + provider)
   - Easy to see what's available

4. **Monitoring Infrastructure** ✅
   - Monitoring API exists
   - Metrics structure in place
   - Health status tracking

---

## ⚠️ Issues Found

### 1. Monitoring Not Tracking Failed Requests

**Issue:** When a custom model request fails (e.g., invalid API key), the monitoring doesn't record it.

**Current Behavior:**
- Request fails before reaching monitoring
- Metrics show 0 requests
- Can't track failure rates

**Fix Needed:**
- Track requests even when they fail
- Record failures in monitoring
- Update metrics on error

**Location:** `lib/mlops/modelRouter.js` - monitoring only called on success

### 2. Feature Generation Module Not Available

**Issue:** `/api/repos/quality/generate-feature` endpoint not working.

**Current Behavior:**
- Returns "Module not available" error
- Feature generation doesn't work

**Fix Needed:**
- Check if module exists
- Load module correctly
- Handle missing module gracefully

**Location:** `website/app/api/repos/quality/generate-feature/route.ts`

### 3. Error Messages Could Be More Helpful

**Issue:** Some errors are generic ("Failed to use custom model").

**Current Behavior:**
- Generic error messages
- Hard to debug issues

**Fix Needed:**
- More specific error messages
- Include actionable tips
- Better error context

**Location:** `lib/mlops/modelRouter.js` - error handling

---

## 🔧 What Needs to be Built/Updated

### Priority 1: Fix Monitoring to Track All Requests

**File:** `lib/mlops/modelRouter.js`

**Changes:**
```javascript
// Current: Only tracks on success
if (success) {
  monitoring.recordRequest(...);
}

// Needed: Track all requests
monitoring.recordRequest(modelId, endpoint, latency, success, error, usage);
```

**Impact:** High - Need to track failures for debugging

### Priority 2: Fix Feature Generation Endpoint

**File:** `website/app/api/repos/quality/generate-feature/route.ts`

**Changes:**
- Check if module exists
- Load module correctly
- Add error handling
- Integrate model router

**Impact:** Medium - Feature generation is a key feature

### Priority 3: Improve Error Messages

**File:** `lib/mlops/modelRouter.js`

**Changes:**
- Add specific error types
- Include helpful tips
- Better error context

**Impact:** Medium - Improves UX

### Priority 4: Add Request Tracking Before Failure

**File:** `website/app/api/codebase/chat/route.ts`

**Changes:**
- Track request attempt before calling model
- Record even if model call fails
- Better error context

**Impact:** Low - Nice to have

---

## 📋 Implementation Plan

### Step 1: Fix Monitoring (High Priority)

1. Update `modelRouter.js` to track all requests
2. Update `customModelMonitoring.js` to handle failures
3. Test with real failures
4. Verify metrics update correctly

### Step 2: Fix Feature Generation (Medium Priority)

1. Check if module exists
2. Load module correctly
3. Add model router integration
4. Test feature generation

### Step 3: Improve Error Messages (Medium Priority)

1. Add error types
2. Include helpful tips
3. Better error context
4. Test error scenarios

### Step 4: Add Request Tracking (Low Priority)

1. Track request attempts
2. Record failures
3. Better error context
4. Test tracking

---

## 🧪 Testing Checklist

- [ ] Monitoring tracks failed requests
- [ ] Feature generation works
- [ ] Error messages are helpful
- [ ] Request tracking works
- [ ] Metrics update correctly
- [ ] Health status accurate

---

## 💡 Quick Wins

1. **Fix monitoring** - Track all requests (30 min)
2. **Add error context** - Better error messages (15 min)
3. **Check feature generation** - See if module exists (15 min)

---

## 📊 Current Status

- ✅ Core functionality: Working
- ⚠️ Monitoring: Needs improvement
- ❌ Feature generation: Not working
- ⚠️ Error messages: Could be better

**Overall:** 75% complete, needs polish

---

## 🎯 Next Steps

1. Fix monitoring to track all requests
2. Check feature generation module
3. Improve error messages
4. Test end-to-end with real API key
