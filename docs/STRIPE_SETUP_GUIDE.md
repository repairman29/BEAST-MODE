# Stripe Setup Guide for BEAST MODE

**Account:** acct_1So8HhHftdvxqEbU  
**Dashboard:** https://dashboard.stripe.com/acct_1So8HhHftdvxqEbU/products

---

## 🚀 Quick Setup (Stripe CLI)

### Step 1: Login to Stripe CLI
```bash
stripe login
```

### Step 2: Create Products and Prices

**BEAST MODE Pro ($19/month):**
```bash
# Create product
stripe products create \
  --name="BEAST MODE Pro" \
  --description="Pro plan - $19/month - Unlimited PR analysis, advanced features" \
  --metadata[planId]=pro \
  --metadata[beastMode]=true

# Create price (replace PRODUCT_ID with the ID from above)
stripe prices create \
  --product=PRODUCT_ID \
  --unit-amount=1900 \
  --currency=usd \
  --recurring[interval]=month
```

**BEAST MODE Team ($99/month):**
```bash
stripe products create \
  --name="BEAST MODE Team" \
  --description="Team plan - $99/month - Team collaboration, dashboards, advanced analytics" \
  --metadata[planId]=team \
  --metadata[beastMode]=true

stripe prices create \
  --product=TEAM_PRODUCT_ID \
  --unit-amount=9900 \
  --currency=usd \
  --recurring[interval]=month
```

**BEAST MODE Enterprise ($499/month):**
```bash
stripe products create \
  --name="BEAST MODE Enterprise" \
  --description="Enterprise plan - $499/month - Custom pricing, SSO, dedicated support" \
  --metadata[planId]=enterprise \
  --metadata[beastMode]=true

stripe prices create \
  --product=ENTERPRISE_PRODUCT_ID \
  --unit-amount=49900 \
  --currency=usd \
  --recurring[interval]=month
```

### Step 3: Create Webhook

```bash
stripe webhooks create \
  --url="https://beast-mode.dev/api/stripe/webhook" \
  --enabled-events=checkout.session.completed \
  --enabled-events=customer.subscription.updated \
  --enabled-events=customer.subscription.deleted \
  --enabled-events=invoice.payment_succeeded \
  --enabled-events=invoice.payment_failed
```

**Get webhook secret:**
```bash
# List webhooks to get ID
stripe webhooks list

# Get signing secret (or get from dashboard)
stripe webhook_endpoints retrieve WEBHOOK_ID
```

---

## 📋 Manual Setup (Stripe Dashboard)

### Step 1: Create Products

1. Go to: https://dashboard.stripe.com/acct_1So8HhHftdvxqEbU/products
2. Click "Add product"
3. Create each product:

**BEAST MODE Pro:**
- Name: `BEAST MODE Pro`
- Description: `Pro plan - $19/month - Unlimited PR analysis, advanced features`
- Pricing: Recurring, $19.00 USD, Monthly
- Metadata: `planId: pro`, `beastMode: true`

**BEAST MODE Team:**
- Name: `BEAST MODE Team`
- Description: `Team plan - $99/month - Team collaboration, dashboards, advanced analytics`
- Pricing: Recurring, $99.00 USD, Monthly
- Metadata: `planId: team`, `beastMode: true`

**BEAST MODE Enterprise:**
- Name: `BEAST MODE Enterprise`
- Description: `Enterprise plan - $499/month - Custom pricing, SSO, dedicated support`
- Pricing: Recurring, $499.00 USD, Monthly
- Metadata: `planId: enterprise`, `beastMode: true`

### Step 2: Create Webhook

1. Go to: https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Endpoint URL: `https://beast-mode.dev/api/stripe/webhook`
4. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Click "Add endpoint"
6. Copy "Signing secret" (starts with `whsec_`)

### Step 3: Add Webhook Secret

**To .env.local:**
```bash
STRIPE_WEBHOOK_SECRET=whsec_...
```

**To Vercel:**
1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. Add: `STRIPE_WEBHOOK_SECRET` = `whsec_...`

---

## ✅ Verification

After setup, verify:

1. **Products exist:**
   ```bash
   stripe products list
   ```

2. **Prices exist:**
   ```bash
   stripe prices list
   ```

3. **Webhook exists:**
   ```bash
   stripe webhooks list
   ```

4. **Test checkout:**
   - Use a test card: `4242 4242 4242 4242`
   - Any future expiry date
   - Any CVC

---

## 📝 Product IDs Reference

After creating products, save the IDs:

```json
{
  "pro": {
    "productId": "prod_...",
    "priceId": "price_..."
  },
  "team": {
    "productId": "prod_...",
    "priceId": "price_..."
  },
  "enterprise": {
    "productId": "prod_...",
    "priceId": "price_..."
  }
}
```

These can be used in your code if you need to reference specific products.

---

## 🔧 Troubleshooting

### API Key Invalid
- Check that `STRIPE_SECRET_KEY` in `.env.local` matches your Stripe account
- Ensure it starts with `sk_test_` (test) or `sk_live_` (production)
- Verify no extra whitespace

### Products Already Exist
- If products exist, the script will find and use them
- Or delete and recreate in dashboard

### Webhook Secret
- Always get from Stripe Dashboard → Webhooks → Signing secret
- Never hardcode in code
- Keep secure (use environment variables)
