# E2E Testing - Fixes Needed

**Date:** 2026-01-10  
**Status:** Tests Complete - Issues Identified

---

## 🔍 Issues Found

### 1. Credit Purchases Table Not Accessible
**Error:** `Could not find the table 'public.credit_purchases' in the schema cache`

**Status:** Migration shows as applied but table not accessible

**Fix:**
```bash
# Reapply migration
cd BEAST-MODE-PRODUCT
supabase db push --linked --include-all
```

**Or verify manually:**
```sql
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'credit_purchases'
);
```

---

### 2. Stripe API Key Configuration
**Error:** `Invalid API Key provided: sk_test_...`

**Status:** Stripe key may be incorrect or from wrong environment

**Fix:**
1. Verify `STRIPE_SECRET_KEY` in `website/.env.local`
2. Ensure it matches the Stripe account
3. Test with: `stripe balance retrieve`

---

### 3. Production API Routes Returning 404
**APIs Affected:**
- `/api/user/usage` → 404
- `/api/user/subscription` → 404
- `/api/credits/balance` → 404
- `/api/credits/history` → 404

**Status:** Routes may not be deployed or routing issue

**Fix:**
1. Verify routes exist in `website/app/api/`
2. Check Next.js build output
3. Redeploy to Vercel if needed
4. Verify route handlers export correct functions

---

### 4. GitHub App Environment Variables
**Missing:**
- `GITHUB_APP_ID`
- `GITHUB_APP_PRIVATE_KEY`
- `GITHUB_WEBHOOK_SECRET`

**Status:** Required for GitHub App to function

**Fix:**
1. Add to `website/.env.local`
2. Get from GitHub App settings
3. Ensure private key is properly formatted

---

## ✅ What's Working

1. **Pages:** All core pages load (100%)
2. **Health API:** Working
3. **PR Analysis API:** Working via BEAST MODE
4. **Monitoring Setup:** Complete
5. **Database Tables:** Most tables accessible

---

## 🎯 Priority Fixes

### High Priority
1. Fix credit_purchases table access
2. Verify Stripe API key
3. Fix production API routes

### Medium Priority
4. Configure GitHub App env vars
5. Test webhook processing
6. Verify all API endpoints

---

## 📋 Testing Checklist

After fixes:
- [ ] Credit purchase flow works end-to-end
- [ ] Webhook processes purchases
- [ ] Credit balance updates correctly
- [ ] GitHub App responds to PRs
- [ ] All API endpoints accessible
- [ ] Production monitoring captures events

---

**Next:** Apply fixes and re-run tests
