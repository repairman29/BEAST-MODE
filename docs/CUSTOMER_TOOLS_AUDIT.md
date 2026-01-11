# Customer Tools Audit - Usage, Upgrades, and Credits

**Date:** 2026-01-10  
**Status:** Partially Implemented - Missing Credit Purchase System

---

## ✅ What's Currently Implemented

### 1. Usage Dashboard
**Location:** `/dashboard/customer` → Usage tab  
**Component:** `UsageDashboard.tsx`

**Features:**
- ✅ View predictions (total, with feedback)
- ✅ View API calls (total requests)
- ✅ Feedback rate percentage
- ✅ Time period selector (7/30/90 days)
- ✅ Fetches from `/api/customer/usage`

**Limitations:**
- ❌ Doesn't show usage limits per tier
- ❌ Doesn't show remaining credits/quota
- ❌ No visual progress bars for usage vs limits
- ❌ No warnings when approaching limits

### 2. Billing Manager
**Location:** `/dashboard/customer` → Billing tab  
**Component:** `BillingManager.tsx`

**Features:**
- ✅ View current subscription tier
- ✅ View subscription status
- ✅ View monthly price
- ✅ View next billing date
- ✅ "Change Plan" button (links to pricing)
- ✅ Payment history (recent payments)
- ✅ Cancel subscription button (placeholder)

**Limitations:**
- ❌ Cancel subscription not fully implemented
- ❌ No credit purchase option
- ❌ No one-time payment option

### 3. Pricing Page
**Location:** `/pricing`  
**Component:** `pricing/page.tsx`

**Features:**
- ✅ View all plan tiers (Free, Pro, Team, Enterprise)
- ✅ Shows current tier badge
- ✅ Shows usage on pricing page (PRs analyzed)
- ✅ Upgrade buttons for each tier
- ✅ Links to Stripe checkout
- ✅ Monthly/Annual billing toggle

**Limitations:**
- ❌ Only shows PRs analyzed, not all usage types
- ❌ No credit purchase option
- ❌ No "add credits" without changing plan

### 4. API Endpoints

**Usage API:**
- ✅ `GET /api/user/usage` - Get usage stats and limits
- ✅ `POST /api/user/usage/increment` - Increment usage (internal)

**Subscription API:**
- ✅ `GET /api/user/subscription` - Get subscription info
- ✅ `POST /api/user/subscription` - Update subscription (admin)

---

## ❌ What's Missing

### 1. Credit Purchase System
**Status:** Not Implemented

**Needed Features:**
- One-time credit purchase (without changing subscription)
- Credit packages (e.g., 1000 credits for $10, 5000 for $40)
- Stripe integration for one-time payments
- Credit balance display
- Credit usage tracking
- Credit expiration (optional)

**Use Cases:**
- User wants to exceed monthly limit temporarily
- User doesn't want to upgrade plan but needs more credits
- User wants to try premium features without subscription

### 2. Enhanced Usage Display
**Status:** Partially Implemented

**Missing:**
- Visual progress bars (usage vs limits)
- Remaining credits/quota display
- Usage breakdown by type (PRs, repos, API calls)
- Usage history charts/graphs
- Limit warnings (80%, 90%, 100%)
- "Upgrade" or "Buy Credits" CTAs when at limit

### 3. Credit Management
**Status:** Not Implemented

**Needed:**
- Credit balance in database
- Credit purchase history
- Credit usage tracking
- Credit expiration rules
- Credit transfer (optional, for teams)

### 4. Upgrade Flow Improvements
**Status:** Basic Implementation

**Missing:**
- Side-by-side comparison of current vs new tier
- Usage-based upgrade recommendations
- "You've used X% of your limit" prompts
- Upgrade incentives (e.g., "Upgrade now, get 20% off first month")

---

## 🎯 Recommended Implementation Plan

### Phase 1: Credit Purchase System (High Priority)
1. **Database Schema:**
   - Add `credits_balance` to `user_subscriptions` or create `user_credits` table
   - Add `credit_purchases` table (history)
   - Add `credit_usage` table (tracking)

2. **Stripe Products:**
   - Create credit packages as one-time products
   - Set up prices (e.g., $10 for 1000 credits)

3. **API Endpoints:**
   - `POST /api/credits/purchase` - Create checkout session for credits
   - `GET /api/credits/balance` - Get current credit balance
   - `GET /api/credits/history` - Get purchase/usage history

4. **UI Components:**
   - Credit balance widget (dashboard header)
   - "Buy Credits" button/page
   - Credit purchase flow
   - Credit usage display

### Phase 2: Enhanced Usage Display (Medium Priority)
1. **Usage Dashboard Improvements:**
   - Add progress bars for each usage type
   - Show remaining quota
   - Add limit warnings
   - Add usage charts

2. **Dashboard Header:**
   - Show credit balance
   - Show usage percentage
   - Quick "Buy Credits" button

### Phase 3: Upgrade Flow Improvements (Low Priority)
1. **Smart Recommendations:**
   - Analyze usage patterns
   - Suggest upgrades when approaching limits
   - Show cost savings with annual plans

2. **Comparison View:**
   - Side-by-side tier comparison
   - Highlight what you get with upgrade

---

## 📋 Quick Wins (Can Do Now)

1. **Add Credit Balance to Usage Dashboard**
   - Display current credit balance
   - Show "Buy Credits" button

2. **Add Usage Limits to Usage Dashboard**
   - Show limits per tier
   - Show remaining quota
   - Add progress bars

3. **Add "Buy Credits" to Billing Manager**
   - Add credit purchase section
   - Link to credit purchase page

4. **Create Credit Purchase Page**
   - List credit packages
   - Stripe checkout integration
   - Purchase history

---

## 🔗 Related Files

- `website/app/dashboard/customer/page.tsx` - Customer dashboard
- `website/components/customer-dashboard/UsageDashboard.tsx` - Usage display
- `website/components/customer-dashboard/BillingManager.tsx` - Billing display
- `website/app/pricing/page.tsx` - Pricing page
- `website/app/api/user/usage/route.ts` - Usage API
- `website/app/api/user/subscription/route.ts` - Subscription API

---

**Next Steps:** Implement credit purchase system (Phase 1)
