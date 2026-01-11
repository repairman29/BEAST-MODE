# Quick Start: Monetization Implementation

**Goal:** Get paying customers in 30 days

---

## 🎯 Phase 1: Foundation (Week 1-2)

### 1. User Management
**Goal:** Link GitHub installations to user accounts

**Steps:**
1. Create `user_subscriptions` table in Supabase
2. Link GitHub OAuth to user accounts
3. Track GitHub App installations per user
4. Store subscription tier per user

**Files to create/modify:**
- `supabase/migrations/XXXX_create_user_subscriptions.sql`
- `website/app/api/user/subscription/route.ts`
- `website/lib/user-subscription.ts`

---

### 2. Rate Limiting
**Goal:** Enforce free tier (10 PRs/month)

**Steps:**
1. Track PRs analyzed per user per month
2. Check limit before processing PR
3. Show usage dashboard
4. Block analysis when limit reached

**Files to create/modify:**
- `lib/integrations/rateLimiter.js`
- `website/app/api/github/webhook/route.ts` (add rate limit check)
- `website/components/usage-dashboard.tsx`

---

## 🎯 Phase 2: Monetization (Week 3-4)

### 3. Stripe Integration
**Goal:** Process payments and manage subscriptions

**Steps:**
1. Set up Stripe account (if not done)
2. Create Stripe products/prices
3. Add checkout flow
4. Handle webhooks (subscription events)

**Files to create/modify:**
- `website/app/api/stripe/checkout/route.ts`
- `website/app/api/stripe/webhook/route.ts`
- `website/components/upgrade-prompt.tsx`

---

### 4. Upgrade Flow
**Goal:** Convert free users to paid

**Steps:**
1. Show upgrade prompt when limit reached
2. Highlight value proposition
3. Smooth checkout experience
4. Activate subscription immediately

**Files to create/modify:**
- `website/components/upgrade-prompt.tsx`
- `website/app/pricing/page.tsx`
- `website/app/checkout/page.tsx`

---

## 📋 Implementation Checklist

### Week 1
- [ ] Create user_subscriptions table
- [ ] Link GitHub OAuth to users
- [ ] Track GitHub App installations
- [ ] Store subscription tier

### Week 2
- [ ] Implement rate limiting
- [ ] Track PRs analyzed per user
- [ ] Create usage dashboard
- [ ] Add limit enforcement

### Week 3
- [ ] Set up Stripe products
- [ ] Create checkout flow
- [ ] Handle subscription webhooks
- [ ] Update user subscription status

### Week 4
- [ ] Create upgrade prompts
- [ ] Build pricing page
- [ ] Test checkout flow
- [ ] Launch to first customers

---

## 🚀 Quick Commands

```bash
# Create migration for user subscriptions
supabase migration new create_user_subscriptions

# Test Stripe webhook locally
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Check user subscription
beast-mode user subscription check

# Test rate limiting
beast-mode rate-limit test
```

---

**Let's start with Week 1: User Management! 🎉**
