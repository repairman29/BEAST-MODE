# Stripe Webhook Secret Guide

## 🔑 What is the Webhook Secret?

The **Stripe Webhook Secret** (`whsec_...`) is used to:

- **Verify webhook requests** - Ensures requests are actually from Stripe
- **Security** - Prevents unauthorized webhook calls
- **Signature validation** - Stripe signs each webhook with this secret

## 📍 Where to Find It in Stripe

1. **Go to Stripe Dashboard:**
   - https://dashboard.stripe.com/webhooks
   - Or: https://dashboard.stripe.com/test/webhooks (for test mode)

2. **Select Your Webhook Endpoint:**
   - Click on your webhook endpoint (e.g., `https://beast-mode.dev/api/stripe/webhook`)

3. **Find the Signing Secret:**
   - Look for **"Signing secret"** section
   - It starts with `whsec_`
   - Click **"Reveal"** to see the full secret
   - **⚠️ Keep this secret!** Never commit it to git

## 🔧 How It's Used in BEAST MODE

### Webhook Handler
```typescript
// website/app/api/stripe/webhook/route.ts
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Verify webhook signature
const event = stripe.webhooks.constructEvent(
  body,
  signature,
  webhookSecret
);
```

**Why:** This ensures the webhook request is actually from Stripe and hasn't been tampered with.

## ⚠️ Security Notes

1. **Never expose to clients:**
   - ❌ Don't use in `NEXT_PUBLIC_*` environment variables
   - ❌ Don't include in client-side code
   - ✅ Only use in server-side webhook handler

2. **Environment Variables:**
   ```bash
   # .env.local (local development)
   STRIPE_WEBHOOK_SECRET=whsec_...

   # Vercel (production)
   # Add via: vercel env add STRIPE_WEBHOOK_SECRET
   ```

3. **Different Secrets for Different Environments:**
   - **Test mode:** One webhook secret
   - **Live mode:** Different webhook secret
   - Make sure you use the correct one for each environment

## 🔍 Current Usage in Codebase

The webhook secret is used in:

- ✅ **Webhook Handler:** `/api/stripe/webhook/route.ts`
- ✅ **Event Verification:** Validates all Stripe webhook events
- ✅ **Security:** Prevents unauthorized webhook calls

## 📋 Verification

To verify your webhook secret is set:

```bash
# Check environment variable
grep STRIPE_WEBHOOK_SECRET website/.env.local

# Test webhook (use Stripe CLI)
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

## 🚨 If You Don't See It in Stripe

1. **Check you're in the right mode** (test vs live)
2. **Check the webhook endpoint** exists
3. **Look for "Signing secret"** (not API keys)
4. **If missing, you may need to:**
   - Create a new webhook endpoint
   - Or regenerate the signing secret

## 🔄 Regenerating the Secret

If you need to regenerate:

1. Go to **Webhooks** in Stripe Dashboard
2. Click on your webhook endpoint
3. Click **"Reveal"** next to signing secret
4. Click **"Reset"** to generate a new one
5. **⚠️ Update all environment variables immediately:**
   - `.env.local` (local)
   - Vercel environment variables (production)
   - Stripe CLI (if using `stripe listen`)

## 🔗 Related

- **Stripe Webhook Events:** Handles `checkout.session.completed`, `customer.subscription.updated`, etc.
- **Webhook URL:** `https://beast-mode.dev/api/stripe/webhook`
- **Environment Variable:** `STRIPE_WEBHOOK_SECRET`

