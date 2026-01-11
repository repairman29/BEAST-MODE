# Monetization Deployment Checklist

**Date:** 2026-01-09  
**Status:** Ready for Production

---

## ✅ Pre-Deployment Checklist

### 1. Database Migrations
- [ ] Apply Supabase migrations:
  ```bash
  supabase db push --include-all --yes
  ```
- [ ] Verify tables exist:
  - `user_subscriptions`
  - `user_usage`
  - `github_installations`
- [ ] Test helper functions:
  - `get_or_create_user_subscription`
  - `get_or_create_user_usage`

### 2. Environment Variables
- [ ] Set `NEXT_PUBLIC_SUPABASE_URL`
- [ ] Set `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Set `STRIPE_SECRET_KEY`
- [ ] Set `STRIPE_WEBHOOK_SECRET`
- [ ] Set `GITHUB_APP_ID`
- [ ] Set `GITHUB_APP_PRIVATE_KEY`
- [ ] Set `GITHUB_APP_WEBHOOK_SECRET`
- [ ] Set `NEXT_PUBLIC_APP_URL=https://beast-mode.dev`

### 3. Stripe Setup
- [ ] Create products in Stripe dashboard:
  - Pro: $19/month
  - Team: $99/month
  - Enterprise: $499/month (custom)
- [ ] Set up webhook endpoint:
  - URL: `https://beast-mode.dev/api/stripe/webhook`
  - Events: `checkout.session.completed`, `customer.subscription.*`, `invoice.*`
- [ ] Get webhook signing secret
- [ ] Test webhook with Stripe CLI:
  ```bash
  stripe listen --forward-to localhost:3000/api/stripe/webhook
  ```

### 4. GitHub App
- [ ] Verify App ID: `2628268`
- [ ] Verify webhook URL: `https://beast-mode.dev/api/github/webhook`
- [ ] Verify webhook secret is set
- [ ] Test webhook delivery

### 5. Testing
- [ ] Run monetization test:
  ```bash
  node scripts/test-monetization-with-supabase.js
  ```
- [ ] Test rate limiting (free tier: 10 PRs/month)
- [ ] Test upgrade flow
- [ ] Test Stripe checkout
- [ ] Test webhook handling

---

## 🚀 Deployment Steps

### Step 1: Apply Migrations
```bash
cd BEAST-MODE-PRODUCT
supabase db push --include-all --yes
```

### Step 2: Verify Environment
```bash
# Check Supabase connection
supabase status

# Test with script
node scripts/test-monetization-with-supabase.js
```

### Step 3: Deploy to Vercel
```bash
cd BEAST-MODE-PRODUCT
vercel --prod --yes
```

### Step 4: Configure Stripe Webhook
1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://beast-mode.dev/api/stripe/webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy webhook signing secret
5. Add to Vercel env: `STRIPE_WEBHOOK_SECRET`

### Step 5: Test End-to-End
1. Create test user
2. Install GitHub App
3. Create test PR (should work)
4. Create 11th PR (should hit rate limit)
5. Upgrade via Stripe checkout
6. Verify subscription activated
7. Create PR (should work unlimited)

---

## 📋 Post-Deployment Verification

### API Endpoints
- [ ] `/api/user/subscription` - Returns subscription
- [ ] `/api/user/usage` - Returns usage and limits
- [ ] `/api/stripe/create-checkout` - Creates checkout session
- [ ] `/api/stripe/webhook` - Handles Stripe events
- [ ] `/api/github/webhook` - Handles GitHub events

### Pages
- [ ] `/pricing` - Pricing page loads
- [ ] `/dashboard` - Shows usage if logged in

### GitHub App
- [ ] Webhook deliveries successful
- [ ] PR comments posted
- [ ] Status checks created
- [ ] Rate limiting works

### Stripe
- [ ] Checkout sessions create successfully
- [ ] Webhooks received and processed
- [ ] Subscriptions update correctly

---

## 🐛 Troubleshooting

### Migration Issues
```bash
# Check migration status
supabase migration list

# Apply specific migration
supabase db push --include-all
```

### Supabase Connection
```bash
# Check if linked
supabase status

# Link to project
supabase link --project-ref YOUR_PROJECT_REF
```

### Stripe Webhook Testing
```bash
# Test locally
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Trigger test event
stripe trigger checkout.session.completed
```

---

## ✅ Success Criteria

- [ ] All migrations applied
- [ ] All environment variables set
- [ ] Stripe webhook configured
- [ ] GitHub App working
- [ ] Rate limiting enforced
- [ ] Upgrade flow working
- [ ] First paying customer can subscribe

---

**Ready to deploy! 🚀**
