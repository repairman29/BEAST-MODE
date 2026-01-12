# BEAST MODE - Production Deployment Guide

**Last Updated:** January 2025  
**Status:** 🚀 Ready for Production

---

## 📋 Pre-Deployment Checklist

### ✅ 1. Database Migrations

**Status:** Ready to apply

**Migrations to Apply:**
```bash
# Navigate to BEAST-MODE-PRODUCT directory
cd BEAST-MODE-PRODUCT

# Apply all migrations
supabase db push

# Or apply individually via Supabase Dashboard:
# 1. Go to Supabase Dashboard → SQL Editor
# 2. Run each migration file in order:
#    - supabase/migrations/20250106000000_create_ml_artifacts_storage_bucket.sql
#    - supabase/migrations/20250107000000_create_quality_feedback_table.sql
#    - supabase/migrations/20250108000000_create_quality_improvement_tables.sql
#    - supabase/migrations/20250108000001_create_custom_models_table.sql
```

**Verify:**
- All tables created successfully
- RLS policies enabled
- Indexes created
- Storage buckets configured

---

### ✅ 2. Stripe Integration

**Status:** ✅ Code is active (already uncommented)

**Verify:**
- [x] Stripe SDK installed (`npm install stripe`)
- [x] Code is uncommented in `app/api/stripe/create-checkout/route.ts`
- [ ] `STRIPE_SECRET_KEY` set in Vercel
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` set in Vercel

**Test:**
```bash
# Test checkout session creation
curl -X POST https://your-domain.com/api/stripe/create-checkout \
  -H "Content-Type: application/json" \
  -d '{"planId": "developer"}'
```

---

### ✅ 3. Environment Variables

**Required Variables in Vercel:**

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# GitHub OAuth
GITHUB_CLIENT_ID=your-client-id
GITHUB_CLIENT_SECRET=your-client-secret
GITHUB_REDIRECT_URI=https://your-domain.com/api/auth/github/callback
GITHUB_TOKEN_ENCRYPTION_KEY=your-encryption-key

# JWT
JWT_SECRET=your-jwt-secret

# Stripe
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=[STORED_IN_DB] # Public key - retrieve from Supabase 'secrets' table

# App
NEXT_PUBLIC_URL=https://your-domain.com
```

**Set in Vercel:**
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add each variable for Production environment
3. Verify all are set

---

### ✅ 4. Run Pre-Deployment Checks

```bash
# Run production checklist
cd BEAST-MODE-PRODUCT
node scripts/production-deployment-checklist.js
```

This will verify:
- ✅ Migration files exist
- ✅ Stripe integration is active
- ✅ Dependencies are installed

---

## 🚀 Deployment Steps

### Step 1: Build Locally (Test)

```bash
cd BEAST-MODE-PRODUCT/website
npm install
npm run build
```

**Verify:**
- Build completes without errors
- No TypeScript errors
- All routes compile successfully

---

### Step 2: Apply Database Migrations

```bash
# Option 1: Via Supabase CLI
cd BEAST-MODE-PRODUCT
supabase db push

# Option 2: Via Supabase Dashboard
# Go to SQL Editor and run each migration file
```

---

### Step 3: Set Environment Variables

1. Go to Vercel Dashboard
2. Navigate to Project → Settings → Environment Variables
3. Add all required variables (see list above)
4. Ensure they're set for "Production" environment

---

### Step 4: Deploy to Vercel

```bash
cd BEAST-MODE-PRODUCT/website
vercel --prod --yes
```

**Or via Git:**
```bash
git add -A
git commit -m "Production deployment"
git push origin main
# Vercel will auto-deploy
```

---

### Step 5: Verify Deployment

**Health Check:**
```bash
curl https://your-domain.com/api/health
```

**Test Key Endpoints:**
```bash
# GitHub OAuth
curl https://your-domain.com/api/auth/github

# Repository Scan
curl -X POST https://your-domain.com/api/repos/scan \
  -H "Content-Type: application/json" \
  -d '{"repo": "facebook/react"}'

# Stripe Checkout
curl -X POST https://your-domain.com/api/stripe/create-checkout \
  -H "Content-Type: application/json" \
  -d '{"planId": "developer"}'
```

---

## 🔍 Post-Deployment Verification

### 1. Database Connection
- [ ] Verify Supabase connection works
- [ ] Test table queries
- [ ] Verify RLS policies
- [ ] Test insert/update operations

### 2. Authentication
- [ ] Test GitHub OAuth flow
- [ ] Verify token encryption
- [ ] Test JWT generation
- [ ] Verify session management

### 3. API Endpoints
- [ ] Test all API routes
- [ ] Verify error handling
- [ ] Check response times
- [ ] Verify CORS settings

### 4. Stripe Integration
- [ ] Test checkout session creation
- [ ] Verify webhook handling
- [ ] Test subscription flow
- [ ] Verify payment processing

### 5. Frontend
- [ ] Test all dashboard views
- [ ] Verify plugin system
- [ ] Test chat interface
- [ ] Verify analytics tracking

---

## 🛡️ Security Checklist

- [ ] All environment variables are set (no hardcoded secrets)
- [ ] RLS policies are enabled on all tables
- [ ] API routes have proper authentication
- [ ] CORS is configured correctly
- [ ] Rate limiting is in place (if implemented)
- [ ] Error messages don't leak sensitive info
- [ ] HTTPS is enforced
- [ ] Security headers are set

---

## 📊 Monitoring Setup

### Error Tracking (Recommended: Sentry)

1. **Install Sentry:**
```bash
npm install @sentry/nextjs
```

2. **Configure:**
```javascript
// next.config.js
const { withSentryConfig } = require('@sentry/nextjs');

module.exports = withSentryConfig({
  // Your Next.js config
}, {
  // Sentry options
});
```

3. **Set Environment Variable:**
```bash
SENTRY_DSN=your-sentry-dsn
```

### Performance Monitoring

- [ ] Set up Vercel Analytics
- [ ] Configure uptime monitoring
- [ ] Set up alerting for errors
- [ ] Monitor API response times

---

## 🐛 Troubleshooting

### Build Errors

**Issue:** TypeScript errors
**Solution:** Run `npm run build` locally to identify issues

**Issue:** Missing dependencies
**Solution:** Run `npm install` and verify `package.json`

### Database Issues

**Issue:** Migrations fail
**Solution:** Check Supabase connection, verify SQL syntax

**Issue:** RLS policies blocking queries
**Solution:** Verify policies are correctly configured

### Environment Variables

**Issue:** Variables not available
**Solution:** 
- Verify variables are set in Vercel
- Check environment (Production vs Preview)
- Restart deployment after adding variables

### Stripe Issues

**Issue:** Checkout fails
**Solution:**
- Verify `STRIPE_SECRET_KEY` is set
- Check Stripe dashboard for errors
- Verify webhook URLs are correct

---

## 📝 Post-Deployment Tasks

1. **Monitor for 24 hours**
   - Check error logs
   - Monitor performance
   - Watch for user issues

2. **Collect Feedback**
   - Monitor analytics
   - Track feature usage
   - Collect user feedback

3. **Optimize**
   - Fix any critical bugs
   - Optimize slow queries
   - Improve performance

---

## ✅ Success Criteria

- [ ] All migrations applied
- [ ] All environment variables set
- [ ] Build succeeds
- [ ] Deployment successful
- [ ] Health check passes
- [ ] Key endpoints work
- [ ] Authentication works
- [ ] Stripe integration works
- [ ] No critical errors in logs
- [ ] Performance is acceptable

---

## 🎉 Ready to Deploy!

Once all checklist items are complete, you're ready for production!

**Quick Deploy Command:**
```bash
cd BEAST-MODE-PRODUCT/website && vercel --prod --yes
```

**Status:** ✅ All code is production-ready  
**Next:** Deploy and monitor!

---

*BEAST MODE - Unleash the power of AI-driven development* 🏆⚔️🚀
