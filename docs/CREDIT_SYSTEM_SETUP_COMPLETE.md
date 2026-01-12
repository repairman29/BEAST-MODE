# Credit System Setup - Complete

**Date:** 2026-01-10  
**Status:** ✅ Implementation Complete - Ready for Manual Stripe Setup

---

## ✅ What's Been Done

### 1. Database Migration
- ✅ Migration file created: `supabase/migrations/20250120000000_create_credit_system.sql`
- ⚠️  Apply manually: `supabase db push --linked`
- Note: Migration may show trigger errors (existing triggers) - this is okay

### 2. API Endpoints
- ✅ `GET /api/credits/balance` - Get credit balance
- ✅ `POST /api/credits/purchase` - Create Stripe checkout
- ✅ `GET /api/credits/history` - Get purchase/usage history

### 3. UI Components
- ✅ Enhanced UsageDashboard with limits and progress bars
- ✅ CreditPurchase component
- ✅ Updated BillingManager with credit purchase

### 4. Webhook Handler
- ✅ Handles credit purchase events
- ✅ Adds credits to user balance

---

## 📋 Manual Setup Required

### Step 1: Apply Database Migration

```bash
cd BEAST-MODE-PRODUCT
supabase db push --linked
```

Or apply manually via Supabase Dashboard SQL Editor:
- File: `supabase/migrations/20250120000000_create_credit_system.sql`

### Step 2: Create Stripe Credit Products

**Option A: Via Stripe Dashboard**
1. Go to: https://dashboard.stripe.com/products
2. Create products with these details:

| Name | Credits | Price | Metadata |
|------|---------|-------|----------|
| 100 Credits | 100 | $5.00 | type: credit_package, credits: 100 |
| 500 Credits | 500 | $20.00 | type: credit_package, credits: 500 |
| 1,000 Credits | 1,000 | $35.00 | type: credit_package, credits: 1000 |
| 5,000 Credits | 5,000 | $150.00 | type: credit_package, credits: 5000 |
| 10,000 Credits | 10,000 | $250.00 | type: credit_package, credits: 10000 |

3. For each product, create a one-time price
4. Copy the Price IDs

**Option B: Via Stripe CLI**
```bash
# Create product
stripe products create \
  --name="100 Credits" \
  --description="Perfect for trying premium features" \
  --metadata[type]=credit_package \
  --metadata[credits]=100

# Create price (use product ID from above)
stripe prices create \
  --product=prod_xxxxx \
  --unit-amount=500 \
  --currency=usd \
  --metadata[type]=credit_package \
  --metadata[credits]=100
```

### Step 3: Add Price IDs to Environment

Add to `website/.env.local`:

```bash
# Stripe Credit Product Price IDs
NEXT_PUBLIC_STRIPE_PRICE_100_CREDITS=price_xxxxx # Public price ID - actual secret stored in DB # Public price ID - actual secret stored in DB
NEXT_PUBLIC_STRIPE_PRICE_500_CREDITS=price_xxxxx # Public price ID - actual secret stored in DB # Public price ID - actual secret stored in DB
NEXT_PUBLIC_STRIPE_PRICE_1000_CREDITS=price_xxxxx # Public price ID - actual secret stored in DB # Public price ID - actual secret stored in DB
NEXT_PUBLIC_STRIPE_PRICE_5000_CREDITS=price_xxxxx # Public price ID - actual secret stored in DB # Public price ID - actual secret stored in DB
NEXT_PUBLIC_STRIPE_PRICE_10000_CREDITS=price_xxxxx # Public price ID - actual secret stored in DB # Public price ID - actual secret stored in DB
```

---

## 🧪 Testing

1. **Test Credit Balance API:**
   ```bash
   curl http://localhost:3000/api/credits/balance?userId=YOUR_USER_ID
   ```

2. **Test Credit Purchase:**
   - Visit: `/dashboard/customer?tab=billing&buy-credits=true`
   - Select a package
   - Complete Stripe checkout
   - Verify webhook processes purchase
   - Check credit balance updated

3. **Test Usage Dashboard:**
   - Visit: `/dashboard/customer?tab=usage`
   - Verify credit balance displays
   - Verify progress bars show limits
   - Verify warnings at 80%+ usage

---

## 📄 Files Created

- `supabase/migrations/20250120000000_create_credit_system.sql`
- `website/app/api/credits/balance/route.ts`
- `website/app/api/credits/purchase/route.ts`
- `website/app/api/credits/history/route.ts`
- `website/components/customer-dashboard/CreditPurchase.tsx`
- `website/components/customer-dashboard/UsageDashboard.tsx` (updated)
- `website/components/customer-dashboard/BillingManager.tsx` (updated)
- `website/app/api/stripe/webhook/route.ts` (updated)

---

**Status: Code complete. Apply migration and create Stripe products to finish setup.**
