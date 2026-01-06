# Deployment Checklist
## Repository Quality Model - Production Deployment

**Date:** January 6, 2026  
**Status:** Ready for Deployment

---

## ✅ Pre-Deployment Verification

### BEAST MODE
- [x] Model file exists: `.beast-mode/models/model-notable-quality-*.json`
- [x] Quality API endpoint: `/api/repos/quality`
- [x] Benchmark API endpoint: `/api/repos/benchmark`
- [x] Dashboard integration: ML quality display added
- [x] Model loading: Verified working
- [x] API testing: Both endpoints tested

### Echeo
- [x] Integration code: `lib/repo-quality-integration.ts`
- [x] Trust score enhancement: `lib/trust-score.ts` updated
- [x] Bounty quality API: `/api/bounties/[id]/quality`
- [x] Bounty quality badge: Component created
- [x] Feed integration: Badge added to feed page

---

## 🚀 Deployment Steps

### Step 1: BEAST MODE Deployment

```bash
cd BEAST-MODE-PRODUCT

# 1. Verify all changes are committed
git status

# 2. Build and test locally
cd website
npm run build

# 3. Deploy to Vercel
cd ..
vercel --prod --yes

# 4. Verify deployment
vercel ls --limit 1
```

**Checklist:**
- [ ] Build succeeds without errors
- [ ] Model file is included in deployment
- [ ] API routes are accessible
- [ ] Dashboard loads correctly

---

### Step 2: Echeo Deployment

```bash
cd echeo-landing

# 1. Verify all changes are committed
git status

# 2. Build and test locally
npm run build

# 3. Deploy to Vercel
vercel --prod --yes

# 4. Verify deployment
vercel ls --limit 1
```

**Checklist:**
- [ ] Build succeeds without errors
- [ ] Trust score calculation works
- [ ] Bounty quality badge displays
- [ ] API endpoints are accessible

---

## 🔍 Post-Deployment Verification

### BEAST MODE
- [ ] Quality API responds: `POST https://playsmuggler.com/api/repos/quality`
- [ ] Benchmark API responds: `POST https://playsmuggler.com/api/repos/benchmark`
- [ ] Dashboard shows ML quality scores
- [ ] Model loads correctly in production

### Echeo
- [ ] Trust scores include repo quality component
- [ ] Bounty quality badges display on feed
- [ ] Bounty quality API responds: `GET /api/bounties/[id]/quality`
- [ ] No console errors in browser

---

## 📊 Monitoring

### Metrics to Track
1. **API Usage**
   - Quality API requests/day
   - Benchmark API requests/day
   - Average response time
   - Error rate

2. **Model Performance**
   - Prediction accuracy
   - Model loading time
   - Cache hit rate

3. **User Engagement**
   - Trust score changes
   - Bounty quality views
   - Dashboard quality scans

### Tools
- Vercel Analytics
- Supabase logs
- Custom monitoring dashboard

---

## 🐛 Troubleshooting

### Issue: Model not loading
**Solution:**
- Check model file path in production
- Verify file is included in deployment
- Check Vercel build logs

### Issue: API returns 503
**Solution:**
- Check model file exists
- Verify path resolution
- Check server logs

### Issue: Quality scores not displaying
**Solution:**
- Check API responses in network tab
- Verify component is rendering
- Check for console errors

---

## 🔄 Rollback Plan

If issues occur:

1. **BEAST MODE:**
   ```bash
   cd BEAST-MODE-PRODUCT
   vercel rollback
   ```

2. **Echeo:**
   ```bash
   cd echeo-landing
   vercel rollback
   ```

---

## ✅ Success Criteria

- [ ] All APIs respond correctly
- [ ] No build errors
- [ ] No runtime errors
- [ ] Quality scores display correctly
- [ ] Trust scores include quality component
- [ ] Bounty badges display correctly

---

**Ready to Deploy!** 🚀
