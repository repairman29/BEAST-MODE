# Stripe Webhook Setup Guide

## 🔍 Current Status

**Issue:** No webhook endpoint configured in Stripe for BEAST MODE.

**Webhook Secret:** `whsec_S1KddqBFLxxoqWJ5nb4rMnzFwDtjtdAi` exists in `.env.local`, but webhook endpoint may not be created.

## 🔧 Setup Methods

### Method 1: Stripe Dashboard (Recommended)

1. **Go to Stripe Dashboard:**
   - https://dashboard.stripe.com/webhooks
   - Or: https://dashboard.stripe.com/test/webhooks (for test mode)

2. **Click "Add endpoint"**

3. **Configure:**
   - **Endpoint URL:** `https://beast-mode.dev/api/stripe/webhook`
   - **Description:** `BEAST MODE - Subscription and payment webhooks`

4. **Select Events to Listen To:**
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_succeeded`
   - ✅ `invoice.payment_failed`
   - ✅ `payment_intent.succeeded`

5. **Click "Add endpoint"**

6. **Get Signing Secret:**
   - After creation, click on the webhook
   - Click "Reveal" next to "Signing secret"
   - Copy the `whsec_...` value

7. **Update Environment:**
   ```bash
   # .env.local
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

---

### Method 2: Stripe CLI

```bash
# Create webhook endpoint
stripe webhooks create \
  --url="https://beast-mode.dev/api/stripe/webhook" \
  --enabled-events="checkout.session.completed" \
  --enabled-events="customer.subscription.created" \
  --enabled-events="customer.subscription.updated" \
  --enabled-events="customer.subscription.deleted" \
  --enabled-events="invoice.payment_succeeded" \
  --enabled-events="invoice.payment_failed" \
  --enabled-events="payment_intent.succeeded" \
  --description="BEAST MODE - Subscription and payment webhooks"

# Get signing secret (after creation)
stripe webhooks retrieve <webhook_id>
# Or check in dashboard
```

---

### Method 3: Stripe API (if API key is valid)

```bash
node scripts/setup-stripe-webhook.js
```

**Note:** This requires a valid `STRIPE_SECRET_KEY` in `.env.local`.

---

## ✅ Verification

After setup, verify:

1. **Webhook exists in Stripe:**
   - Go to: https://dashboard.stripe.com/webhooks
   - Should see: `https://beast-mode.dev/api/stripe/webhook`

2. **Signing secret matches:**
   ```bash
   grep STRIPE_WEBHOOK_SECRET website/.env.local
   # Should match the secret from Stripe dashboard
   ```

3. **Test webhook:**
   ```bash
   # Use Stripe CLI to send test event
   stripe trigger checkout.session.completed
   ```

---

## 🔗 Webhook URL

**Production:**
```
https://beast-mode.dev/api/stripe/webhook
```

**Local Development:**
```
http://localhost:3000/api/stripe/webhook
```

For local testing, use Stripe CLI:
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

---

## 📋 Events Handled

The webhook handler processes these events:

- ✅ `checkout.session.completed` - New subscription or credit purchase
- ✅ `customer.subscription.created` - Subscription activated
- ✅ `customer.subscription.updated` - Subscription changed (upgrade/downgrade)
- ✅ `customer.subscription.deleted` - Subscription canceled
- ✅ `invoice.payment_succeeded` - Payment successful
- ✅ `invoice.payment_failed` - Payment failed
- ✅ `payment_intent.succeeded` - Credit purchase completed

---

## 🚨 Troubleshooting

### Issue: "Invalid signature" error

**Cause:** Webhook secret mismatch

**Fix:**
1. Verify secret in Stripe matches `.env.local`
2. Check secret in Vercel environment variables
3. Ensure no extra spaces or newlines

### Issue: Webhook not receiving events

**Check:**
1. Webhook URL is correct: `https://beast-mode.dev/api/stripe/webhook`
2. Events are subscribed in Stripe
3. Webhook is active (not disabled)
4. Check webhook delivery logs in Stripe dashboard

### Issue: API key invalid

**Fix:**
- Use Stripe Dashboard (Method 1) instead
- Or use Stripe CLI (Method 2)
- Or update `STRIPE_SECRET_KEY` in `.env.local`

---

## 📝 Next Steps

1. ✅ Create webhook endpoint in Stripe
2. ✅ Get signing secret (`whsec_...`)
3. ✅ Update `STRIPE_WEBHOOK_SECRET` in `.env.local`
4. ✅ Add to Vercel environment variables
5. ✅ Test with a real checkout session

