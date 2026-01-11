# Production Testing Plan

**Date:** 2026-01-10  
**Status:** Ready for Testing

---

## 🎯 Testing Objectives

1. Verify all pages load correctly
2. Test authentication flows
3. Test payment/subscription flows
4. Verify API endpoints work
5. Test webhook integrations
6. Verify monitoring and error tracking

---

## 📋 Pre-Deployment Testing

### 1. Local Build Test
```bash
cd BEAST-MODE-PRODUCT/website
npm run build
```

**Expected:** Build succeeds without errors

### 2. Local Production Preview
```bash
npm run start
# Or
vercel dev
```

**Test:**
- [ ] Homepage loads
- [ ] Navigation works
- [ ] All pages accessible
- [ ] No console errors

---

## 🚀 Post-Deployment Testing

### Phase 1: Basic Functionality (5 minutes)

#### 1.1 Page Load Tests
- [ ] **Homepage** (`https://beast-mode.dev`)
  - Loads without errors
  - Navigation visible
  - All sections render
  
- [ ] **Pricing Page** (`https://beast-mode.dev/pricing`)
  - All plans display
  - Pricing correct ($19, $99, $499)
  - Upgrade buttons visible

- [ ] **Documentation** (`https://beast-mode.dev/docs`)
  - All doc pages load
  - Navigation works
  - Content renders

- [ ] **Dashboard** (`https://beast-mode.dev/dashboard`)
  - Auth check works
  - Redirects if not authenticated
  - Loads if authenticated

#### 1.2 API Health Checks
```bash
# Health check
curl https://beast-mode.dev/api/health

# GitHub webhook (should return 200 even if no event)
curl -X POST https://beast-mode.dev/api/github/webhook \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

- [ ] Health endpoint returns 200
- [ ] API endpoints respond (not 500 errors)

---

### Phase 2: Authentication Testing (10 minutes)

#### 2.1 GitHub OAuth Flow
- [ ] **Click "Login with GitHub"**
  - Redirects to GitHub
  - Shows authorization screen
  - Returns to dashboard after auth

- [ ] **Dashboard Access**
  - Unauthenticated: Redirects to home
  - Authenticated: Shows dashboard
  - User context loads

#### 2.2 Admin Routes
- [ ] **Admin Pages** (`/admin/*`)
  - Non-admin: Shows "Access Denied"
  - Admin: Shows admin dashboard
  - All admin sub-routes protected

---

### Phase 3: Payment Flow Testing (15 minutes)

#### 3.1 Stripe Checkout
- [ ] **Create Checkout Session**
  ```bash
  curl -X POST https://beast-mode.dev/api/stripe/create-checkout \
    -H "Content-Type: application/json" \
    -d '{"planId": "pro"}'
  ```
  - Returns checkout URL
  - URL is valid Stripe checkout

- [ ] **Test Checkout Flow**
  - Click "Upgrade to Pro" on pricing page
  - Redirects to Stripe checkout
  - Use test card: `4242 4242 4242 4242`
  - Complete payment
  - Redirects back to dashboard

#### 3.2 Webhook Testing
- [ ] **Verify Webhook in Stripe Dashboard**
  - Go to: https://dashboard.stripe.com/webhooks
  - Find webhook: `we_1So8jnGa3zSfMp7oFeeGxHRs`
  - Status: Enabled
  - Events: All 5 events enabled

- [ ] **Test Webhook Delivery**
  - Use Stripe CLI:
    ```bash
    stripe listen --forward-to https://beast-mode.dev/api/stripe/webhook
    stripe trigger checkout.session.completed
    ```
  - Check webhook logs in Stripe dashboard
  - Verify events received

- [ ] **Verify Subscription Activation**
  - After test payment, check:
    - Subscription created in Stripe
    - User subscription updated in database
    - User tier upgraded in app

#### 3.3 Subscription Management
- [ ] **Check Subscription Status**
  ```bash
  curl https://beast-mode.dev/api/user/subscription
  ```
  - Returns current subscription
  - Tier matches purchased plan

---

### Phase 4: Integration Testing (10 minutes)

#### 4.1 GitHub App
- [ ] **Create Test PR**
  - Create PR in test repo
  - Verify webhook receives event
  - Check PR comment appears
  - Verify status check created

- [ ] **Webhook Events**
  - `pull_request.opened` → Analysis runs
  - PR comment posted
  - Status check created

#### 4.2 API Endpoints
- [ ] **Quality Analysis**
  ```bash
  curl -X POST https://beast-mode.dev/api/repos/quality \
    -H "Content-Type: application/json" \
    -d '{"repo": "test/repo", "owner": "test"}'
  ```
  - Returns quality score
  - Recommendations included

- [ ] **Other Endpoints**
  - `/api/repos/benchmark`
  - `/api/models/custom/monitoring`
  - `/api/health`

---

### Phase 5: Error Handling & Monitoring (5 minutes)

#### 5.1 Error Scenarios
- [ ] **Invalid Routes**
  - 404 page shows
  - Not-found page renders

- [ ] **API Errors**
  - Invalid requests return proper errors
  - Error messages are clear

#### 5.2 Monitoring
- [ ] **Check Error Logs**
  - Vercel logs: No critical errors
  - Stripe logs: Webhook deliveries successful
  - Supabase logs: No connection errors

- [ ] **Monitoring Dashboard**
  - `/monitoring` page loads
  - Shows metrics (if available)
  - No errors in console

---

## 🧪 Test Scenarios

### Scenario 1: New User Signup Flow
1. Visit homepage
2. Click "Get Started"
3. Authenticate with GitHub
4. Complete onboarding
5. View dashboard
6. Upgrade to Pro plan
7. Verify subscription active

**Expected:** All steps complete without errors

### Scenario 2: Existing User Upgrade
1. Login to dashboard
2. Navigate to pricing
3. Click "Upgrade to Team"
4. Complete Stripe checkout
5. Verify tier upgraded
6. Check subscription status

**Expected:** Subscription upgrades correctly

### Scenario 3: PR Analysis Flow
1. Create PR in connected repo
2. Wait for webhook
3. Verify PR comment appears
4. Check status check
5. View quality score

**Expected:** Analysis completes and results displayed

---

## 🔧 Testing Tools

### Stripe CLI
```bash
# Install
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Listen to webhooks
stripe listen --forward-to https://beast-mode.dev/api/stripe/webhook

# Trigger test events
stripe trigger checkout.session.completed
stripe trigger customer.subscription.updated
```

### Browser DevTools
- Network tab: Check API calls
- Console: Check for errors
- Application: Check localStorage/cookies

### Vercel Dashboard
- Functions: Check serverless function logs
- Analytics: Check traffic
- Deployments: Verify latest deployment

---

## 📊 Test Results Template

```
Date: __________
Tester: __________
Environment: Production (beast-mode.dev)

Phase 1: Basic Functionality
[ ] Homepage loads
[ ] Pricing page loads
[ ] Documentation loads
[ ] Dashboard loads
[ ] Health check passes

Phase 2: Authentication
[ ] GitHub OAuth works
[ ] Dashboard auth check works
[ ] Admin routes protected

Phase 3: Payments
[ ] Checkout creates session
[ ] Payment completes
[ ] Webhook receives events
[ ] Subscription activates

Phase 4: Integrations
[ ] GitHub App works
[ ] PR analysis works
[ ] API endpoints respond

Phase 5: Monitoring
[ ] No critical errors
[ ] Monitoring dashboard works

Issues Found:
1. 
2. 
3. 

Status: [ ] Pass [ ] Fail [ ] Needs Fix
```

---

## 🚨 Critical Issues to Watch For

1. **Authentication Failures**
   - Users can't login
   - Dashboard not accessible
   - Admin routes accessible to non-admins

2. **Payment Failures**
   - Checkout doesn't create session
   - Webhook doesn't receive events
   - Subscriptions don't activate

3. **API Errors**
   - 500 errors on endpoints
   - Timeouts
   - Database connection failures

4. **Build Errors**
   - Pages don't load
   - JavaScript errors in console
   - Missing environment variables

---

## ✅ Success Criteria

**Production is ready when:**
- ✅ All pages load without errors
- ✅ Authentication works end-to-end
- ✅ Payment flow completes successfully
- ✅ Webhooks receive and process events
- ✅ API endpoints respond correctly
- ✅ No critical errors in logs
- ✅ Monitoring shows healthy status

---

## 📋 Quick Test Checklist

**5-Minute Smoke Test:**
- [ ] Homepage loads
- [ ] Pricing page loads
- [ ] Can create checkout session
- [ ] Health check returns 200
- [ ] No console errors

**15-Minute Full Test:**
- [ ] All pages load
- [ ] Auth flow works
- [ ] Complete test payment
- [ ] Verify webhook
- [ ] Check monitoring

**30-Minute Comprehensive Test:**
- [ ] All test scenarios pass
- [ ] All integrations work
- [ ] Error handling works
- [ ] Monitoring active
- [ ] Documentation complete

---

## 🔄 Continuous Testing

### Daily Checks
- [ ] Health endpoint
- [ ] Error logs review
- [ ] Webhook delivery status

### Weekly Checks
- [ ] Full test scenario run
- [ ] Performance metrics
- [ ] User feedback review

---

**Ready to start testing! 🚀**
