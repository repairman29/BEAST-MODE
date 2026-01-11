# Credit System Implementation

**Date:** 2026-01-10  
**Status:** ✅ Complete - Ready for Testing

---

## ✅ What's Been Implemented

### 1. Database Schema
**Migration:** `supabase/migrations/20250120000000_create_credit_system.sql`

**Tables Created:**
- `credit_purchases` - Tracks credit purchases
- `credit_usage` - Tracks when credits are consumed
- `credit_transactions` - Complete transaction history

**Columns Added to `user_subscriptions`:**
- `credits_balance` - Current credit balance
- `credits_total_purchased` - Total credits ever purchased
- `credits_total_used` - Total credits ever used

**Database Functions:**
- `add_credits_to_user()` - Add credits to balance
- `use_credits_from_user()` - Deduct credits from balance
- `get_user_credit_balance()` - Get current balance

### 2. API Endpoints

**GET `/api/credits/balance`**
- Returns current credit balance, total purchased, total used
- Query param: `userId`

**POST `/api/credits/purchase`**
- Creates Stripe checkout session for credit purchase
- Body: `{ priceId, userId, email? }`
- Returns: `{ sessionId, url, credits }`

**GET `/api/credits/history`**
- Returns purchase and usage history
- Query params: `userId`, `limit`, `type` (purchases|usage|transactions)

### 3. UI Components

**Enhanced UsageDashboard** (`components/customer-dashboard/UsageDashboard.tsx`)
- ✅ Credit balance display
- ✅ Usage limits with progress bars
- ✅ Warning messages at 80%+ usage
- ✅ "Buy Credits" button
- ✅ Color-coded progress bars (green/yellow/red)

**CreditPurchase Component** (`components/customer-dashboard/CreditPurchase.tsx`)
- ✅ Credit package selection
- ✅ Stripe checkout integration
- ✅ Package pricing display
- ✅ "How Credits Work" info section

**Updated BillingManager** (`components/customer-dashboard/BillingManager.tsx`)
- ✅ "Buy Credits" button in header
- ✅ Credit purchase view toggle
- ✅ Integration with CreditPurchase component

### 4. Webhook Handler

**Updated** `app/api/stripe/webhook/route.ts`
- ✅ Handles `checkout.session.completed` for credit purchases
- ✅ Handles `payment_intent.succeeded` for credit purchases
- ✅ Records purchase in database
- ✅ Adds credits to user balance
- ✅ Creates transaction records

---

## 📋 Setup Steps

### 1. Apply Database Migration
```bash
cd BEAST-MODE-PRODUCT
supabase db push --linked
```

Or manually via Supabase Dashboard SQL Editor:
- Run: `supabase/migrations/20250120000000_create_credit_system.sql`

### 2. Create Stripe Credit Products

**Option A: Use Script**
```bash
node scripts/create-stripe-credit-products.js
```

**Option B: Manual Creation**
Create products in Stripe Dashboard:
- 100 Credits - $5.00
- 500 Credits - $20.00
- 1,000 Credits - $35.00 (Most Popular)
- 5,000 Credits - $150.00
- 10,000 Credits - $250.00

**Important:** Add metadata to each price:
- `type: credit_package`
- `credits: <number>`

### 3. Update CreditPurchase Component

Update `CreditPurchase.tsx` with actual Stripe price IDs:
```typescript
const DEFAULT_PACKAGES: CreditPackage[] = [
  {
    name: '100 Credits',
    credits: 100,
    price: 500,
    priceId: 'price_xxxxx', // From Stripe
    // ...
  },
  // ...
];
```

Or fetch from API/config file.

### 4. Test Credit Purchase Flow

1. Visit `/dashboard/customer?tab=billing&buy-credits=true`
2. Select a credit package
3. Complete Stripe checkout
4. Verify webhook receives event
5. Check credit balance updated
6. Verify purchase appears in history

---

## 🎯 Usage Flow

### Customer Purchases Credits
1. Customer clicks "Buy Credits" in Billing or Usage tab
2. Selects credit package
3. Redirected to Stripe checkout
4. Completes payment
5. Webhook processes purchase
6. Credits added to balance
7. Customer redirected back to dashboard

### Credits Are Used
1. Customer exceeds monthly limit
2. System checks credit balance
3. If credits available, deducts and allows action
4. Records usage in `credit_usage` table
5. Updates balance in `user_subscriptions`

### Viewing Usage
1. Customer visits Usage tab
2. Sees current balance
3. Sees usage limits with progress bars
4. Gets warnings at 80%+ usage
5. Can purchase more credits if needed

---

## 🔧 Integration Points

### Rate Limiter
Update `lib/integrations/rateLimiter.js` to:
- Check credit balance when limit exceeded
- Use credits if available
- Call `use_credits_from_user()` function

### API Routes
Update routes that enforce limits to:
- Check credit balance before blocking
- Use credits when needed
- Provide clear error messages

---

## 📊 Credit Packages

| Package | Credits | Price | Price/Credit |
|---------|---------|-------|--------------|
| Starter | 100 | $5.00 | $0.050 |
| Small | 500 | $20.00 | $0.040 |
| Popular | 1,000 | $35.00 | $0.035 |
| Power | 5,000 | $150.00 | $0.030 |
| Maximum | 10,000 | $250.00 | $0.025 |

---

## 🧪 Testing Checklist

- [ ] Database migration applied
- [ ] Stripe products created
- [ ] Price IDs updated in component
- [ ] Credit purchase flow works
- [ ] Webhook receives events
- [ ] Credits added to balance
- [ ] Purchase history displays
- [ ] Usage dashboard shows balance
- [ ] Progress bars display correctly
- [ ] Warnings appear at 80%+ usage

---

## 📄 Related Files

- `supabase/migrations/20250120000000_create_credit_system.sql`
- `website/app/api/credits/balance/route.ts`
- `website/app/api/credits/purchase/route.ts`
- `website/app/api/credits/history/route.ts`
- `website/app/api/stripe/webhook/route.ts`
- `website/components/customer-dashboard/UsageDashboard.tsx`
- `website/components/customer-dashboard/CreditPurchase.tsx`
- `website/components/customer-dashboard/BillingManager.tsx`
- `scripts/create-stripe-credit-products.js`

---

**Status: Ready for testing! Apply migration and create Stripe products to complete setup.**
