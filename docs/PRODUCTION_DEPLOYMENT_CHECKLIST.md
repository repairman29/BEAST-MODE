# Production Deployment Checklist

**Date:** 2026-01-10  
**Status:** In Progress

---

## ✅ Pre-Deployment Verification

### Environment Variables
- [x] `NEXT_PUBLIC_SUPABASE_URL` - Set
- [x] `SUPABASE_SERVICE_ROLE_KEY` - Set
- [x] `STRIPE_SECRET_KEY` - Set
- [ ] `STRIPE_WEBHOOK_SECRET` - **NEEDS SETUP** (get from Stripe dashboard after webhook creation)
- [x] `GITHUB_APP_ID` - Set (2628268)
- [x] `GITHUB_APP_PRIVATE_KEY` - Set
- [x] `GITHUB_APP_WEBHOOK_SECRET` - Set
- [ ] `NEXT_PUBLIC_APP_URL` - **NEEDS SETUP** (should be `https://beast-mode.dev`)

### Integration Status
- [x] Stripe integration code - Active
- [x] GitHub App - Configured
- [x] Supabase - Configured (24 migrations)
- [x] API endpoints - All exist
- [ ] Monitoring (Sentry) - Optional but recommended

---

## 🚀 Deployment Steps

### Step 1: Set Missing Environment Variables

**In `.env.local` (for local testing):**
```bash
NEXT_PUBLIC_APP_URL=https://beast-mode.dev
STRIPE_WEBHOOK_SECRET=whsec_... # Get from Stripe dashboard
```

**In Vercel (for production):**
1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. Add:
   - `NEXT_PUBLIC_APP_URL` = `https://beast-mode.dev`
   - `STRIPE_WEBHOOK_SECRET` = (get from Stripe after webhook setup)

### Step 2: Apply Database Migrations

```bash
cd BEAST-MODE-PRODUCT
supabase db push --linked --include-all --yes
```

Verify migrations:
```bash
supabase migration list
```

### Step 3: Configure Stripe Webhook

1. **Deploy to Vercel first** (to get production URL)
2. **Go to Stripe Dashboard** → Developers → Webhooks
3. **Add endpoint:**
   - URL: `https://beast-mode.dev/api/stripe/webhook`
   - Events to listen to:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
4. **Copy webhook signing secret** (starts with `whsec_`)
5. **Add to Vercel env vars:** `STRIPE_WEBHOOK_SECRET`

### Step 4: Verify GitHub App Webhook

1. **Go to GitHub** → Settings → Developer settings → GitHub Apps
2. **Select BEAST MODE app**
3. **Verify webhook URL:** `https://beast-mode.dev/api/github/webhook`
4. **Test webhook delivery** (create a test PR)

### Step 5: Deploy to Vercel

```bash
cd BEAST-MODE-PRODUCT
vercel --prod --yes
```

Or via Vercel dashboard:
- Push to main branch (auto-deploys if configured)
- Or manually deploy from dashboard

### Step 6: Post-Deployment Verification

Run verification script:
```bash
node scripts/verify-production-deployment.js
```

Test endpoints:
- [ ] Health check: `https://beast-mode.dev/api/health`
- [ ] GitHub webhook: Create test PR
- [ ] Stripe checkout: Test payment flow
- [ ] Quality API: `https://beast-mode.dev/api/repos/quality`

---

## 🔧 Optional: Monitoring Setup

### Sentry (Error Tracking)

1. **Create Sentry account:** https://sentry.io
2. **Create project** for Next.js
3. **Get DSN** from project settings
4. **Add to Vercel env:** `SENTRY_DSN=https://...@...`
5. **Install Sentry SDK:**
   ```bash
   npm install @sentry/nextjs
   ```
6. **Initialize Sentry** in `next.config.js`

### Analytics

- [ ] Google Analytics (if using)
- [ ] PostHog (if using)
- [ ] Custom analytics dashboard

---

## ✅ Final Checklist

Before going live:

- [ ] All environment variables set in Vercel
- [ ] Database migrations applied
- [ ] Stripe webhook configured and tested
- [ ] GitHub App webhook verified
- [ ] Domain configured (beast-mode.dev)
- [ ] SSL certificate active
- [ ] Error monitoring set up (optional)
- [ ] Test payment flow end-to-end
- [ ] Test GitHub App with real PR
- [ ] Verify all API endpoints work
- [ ] Check logs for errors

---

## 🐛 Troubleshooting

### Stripe Webhook Not Working
- Verify webhook URL is correct
- Check webhook secret matches
- Test with Stripe CLI: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
- Check Vercel function logs

### GitHub App Not Responding
- Verify webhook secret matches
- Check webhook URL in GitHub App settings
- Test with: `node scripts/test-github-app-webhook.js`
- Check Vercel function logs

### Database Connection Issues
- Verify Supabase URL and keys
- Check Supabase project is active
- Test connection: `supabase status`
- Check migration status

---

## 📋 Quick Reference

**Deploy Command:**
```bash
vercel --prod --yes
```

**Verify Deployment:**
```bash
node scripts/verify-production-deployment.js
```

**Test Webhook:**
```bash
node scripts/test-github-app-webhook.js
```

**Check Status:**
```bash
vercel ls --limit 1
```
