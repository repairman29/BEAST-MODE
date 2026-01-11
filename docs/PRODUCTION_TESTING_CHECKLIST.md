# Production Testing Checklist

**Quick reference for production testing**

---

## 🚀 Pre-Deployment

- [ ] Build succeeds: `npm run build`
- [ ] No TypeScript errors
- [ ] All environment variables set in Vercel
- [ ] Stripe webhook configured
- [ ] GitHub App webhook configured

---

## ✅ Post-Deployment Quick Test (5 min)

### Pages
- [ ] Homepage: https://beast-mode.dev
- [ ] Pricing: https://beast-mode.dev/pricing
- [ ] Docs: https://beast-mode.dev/docs
- [ ] Dashboard: https://beast-mode.dev/dashboard (should redirect if not auth)

### APIs
- [ ] Health: `curl https://beast-mode.dev/api/health`
- [ ] No 500 errors in browser console

---

## 🔐 Authentication Test (5 min)

- [ ] Click "Login with GitHub"
- [ ] Redirects to GitHub OAuth
- [ ] Returns to dashboard after auth
- [ ] Dashboard loads for authenticated user
- [ ] Admin routes show "Access Denied" for non-admins

---

## 💳 Payment Test (10 min)

### Checkout
- [ ] Click "Upgrade to Pro" on pricing page
- [ ] Redirects to Stripe checkout
- [ ] Test card works: `4242 4242 4242 4242`
- [ ] Payment completes
- [ ] Redirects back to dashboard

### Webhook
- [ ] Check Stripe dashboard → Webhooks
- [ ] Webhook `we_1So8jnGa3zSfMp7oFeeGxHRs` is enabled
- [ ] Test webhook delivery (use Stripe CLI)
- [ ] Verify subscription created in database

### Subscription
- [ ] Check `/api/user/subscription` returns subscription
- [ ] User tier upgraded in app
- [ ] Subscription shows in Stripe dashboard

---

## 🔗 Integration Test (10 min)

### GitHub App
- [ ] Create test PR in connected repo
- [ ] Webhook receives `pull_request.opened`
- [ ] PR comment appears
- [ ] Status check created

### API Endpoints
- [ ] `/api/repos/quality` - Returns quality score
- [ ] `/api/repos/benchmark` - Returns benchmark data
- [ ] `/api/models/custom/monitoring` - Returns metrics

---

## 📊 Monitoring Test (5 min)

- [ ] `/monitoring` page loads
- [ ] No critical errors in Vercel logs
- [ ] No critical errors in Stripe logs
- [ ] No critical errors in Supabase logs

---

## 🧪 Automated Test

```bash
# Run automated tests
node scripts/test-production.js
```

**Expected:** All tests pass

---

## ✅ Success Criteria

- [ ] All pages load (37/37)
- [ ] Authentication works
- [ ] Payment flow completes
- [ ] Webhooks receive events
- [ ] No critical errors
- [ ] Monitoring active

---

## 🚨 If Tests Fail

1. Check Vercel deployment logs
2. Check environment variables
3. Verify webhook URLs
4. Check Stripe dashboard
5. Review error messages

---

**Ready to test! 🚀**
