# End-to-End Testing Guide
## MVP Week 2 Day 3-4

**Date:** January 2026  
**Status:** ✅ **Testing Framework Ready**

---

## 🧪 **TESTING FRAMEWORK**

### **Automated E2E Tests**
**File:** `scripts/test-e2e-flows.js`

**Tests Included:**
1. ✅ Health Check
2. ✅ Quality API (GET)
3. ✅ Quality API (POST) - No Auth
4. ✅ Quality API (POST) - With Auth
5. ✅ Auth Validation
6. ✅ Usage Tracking
7. ✅ Error Logging
8. ✅ Analytics
9. ✅ Performance Monitoring
10. ✅ Sitemap

---

## 🚀 **RUNNING TESTS**

### **Local Testing:**
```bash
cd BEAST-MODE-PRODUCT/website
npm run test:e2e
```

### **With API Key:**
```bash
TEST_API_KEY=your_api_key npm run test:e2e
```

### **Custom Base URL:**
```bash
TEST_BASE_URL=https://beastmode.dev npm run test:e2e
```

---

## 📋 **MANUAL TESTING CHECKLIST**

### **1. Signup Flow** ✅
- [ ] Navigate to `/dashboard?view=auth&action=signup`
- [ ] Create account
- [ ] Verify email (if required)
- [ ] Sign in successfully
- [ ] See dashboard

**Expected:**
- User can sign up
- User can sign in
- Dashboard loads correctly

---

### **2. GitHub Connection** ✅
- [ ] Navigate to Settings
- [ ] Click "Connect GitHub"
- [ ] Authorize GitHub
- [ ] Verify connection status
- [ ] See connected repositories

**Expected:**
- GitHub OAuth works
- Connection status updates
- Repositories visible

---

### **3. Repository Scanning** ✅
- [ ] Navigate to Quality tab
- [ ] Enter repository (e.g., `facebook/react`)
- [ ] Click "Scan Repository"
- [ ] Wait for scan to complete
- [ ] See quality score (0-100)
- [ ] See issues detected
- [ ] See recommendations

**Expected:**
- Scan completes successfully
- Quality score displays (0-100)
- Issues are listed
- Recommendations are actionable

---

### **4. Quality Score Display** ✅
- [ ] Scan a repository
- [ ] Verify score is between 0-100
- [ ] Check confidence level
- [ ] Review percentile
- [ ] See factor breakdown
- [ ] See recommendations

**Expected:**
- Score is valid (0-100)
- Confidence is shown
- Percentile is calculated
- Factors are explained
- Recommendations are clear

---

### **5. Recommendations** ✅
- [ ] View recommendations after scan
- [ ] Check priority levels (high/medium/low)
- [ ] Verify action descriptions
- [ ] Check impact estimates

**Expected:**
- Recommendations are actionable
- Priority levels are clear
- Impact is described
- Actions are specific

---

### **6. Upgrade Flow** ✅
- [ ] Navigate to Pricing (`/pricing` or `?view=pricing`)
- [ ] View pricing tiers
- [ ] Click "Upgrade" on a tier
- [ ] Complete checkout (if Stripe integrated)
- [ ] Verify tier upgrade
- [ ] Check new limits

**Expected:**
- Pricing page loads
- Tiers are clear
- Upgrade button works
- Checkout completes (if integrated)
- Tier updates correctly
- Limits reflect new tier

---

### **7. Value Metrics** ✅
- [ ] Sign in to dashboard
- [ ] View welcome screen
- [ ] See "Time Saved" metric
- [ ] See "Estimated Value" metric
- [ ] See "Quality Improvement" metric
- [ ] Verify metrics update with usage

**Expected:**
- Metrics display correctly
- Values are reasonable
- Metrics update with usage
- Upgrade prompts appear when appropriate

---

### **8. ROI Calculator** ✅
- [ ] View dashboard welcome screen
- [ ] See ROI calculator
- [ ] Verify pre-filled values (if logged in)
- [ ] Adjust inputs
- [ ] See ROI calculations
- [ ] Check upgrade prompts

**Expected:**
- Calculator displays
- Pre-filled with user data (if logged in)
- Calculations are correct
- Upgrade prompts work

---

### **9. API Key Management** ✅
- [ ] Navigate to Settings or Customer Dashboard
- [ ] View API keys section
- [ ] Generate new API key
- [ ] Copy API key
- [ ] Revoke API key
- [ ] Verify revocation

**Expected:**
- API keys list displays
- New key generation works
- Key can be copied
- Revocation works
- Key is removed from list

---

### **10. Error Handling** ✅
- [ ] Test invalid repository name
- [ ] Test invalid API key
- [ ] Test rate limit (if applicable)
- [ ] Verify error messages
- [ ] Check error logging

**Expected:**
- Errors are caught
- Error messages are clear
- Errors are logged
- User can recover

---

## 🐛 **KNOWN ISSUES**

### **Development Environment:**
- Model may not be available (returns 503) - **Expected**
- Some features require Supabase connection - **Expected**
- Mock data may be used - **Expected**

### **Production Environment:**
- All features should work
- Model should be available
- Real data should be used

---

## ✅ **SUCCESS CRITERIA**

### **All Tests Pass:**
- ✅ Health check returns 200
- ✅ API endpoints respond correctly
- ✅ Error handling works
- ✅ Monitoring tracks metrics

### **User Can Complete Full Flow:**
- ✅ Sign up → Sign in → Scan → View Score → Upgrade
- ✅ No critical errors
- ✅ All features accessible
- ✅ Value metrics visible

---

## 📊 **TEST RESULTS**

Run tests and document results:

```bash
npm run test:e2e
```

**Expected Output:**
```
🚀 Starting End-to-End Tests
Base URL: http://localhost:3000
API Key: Not provided

🧪 Testing: Health Check
   Status: healthy
✅ PASS: Health Check

...

📊 Test Summary
✅ Passed: 10
❌ Failed: 0
⏭️  Skipped: 0
```

---

## 🔄 **CONTINUOUS TESTING**

### **Pre-Deployment:**
```bash
npm run test:all
```

### **CI/CD Integration:**
Add to GitHub Actions or similar:
```yaml
- name: Run E2E Tests
  run: npm run test:e2e
  env:
    TEST_BASE_URL: ${{ secrets.TEST_URL }}
    TEST_API_KEY: ${{ secrets.TEST_API_KEY }}
```

---

**Status:** ✅ **E2E Testing Framework Ready - Run tests to verify MVP readiness!**

