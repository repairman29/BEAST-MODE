# Vercel Deployment Fix

**Date:** 2026-01-10  
**Issue:** Vercel project path configuration error

---

## 🔍 Problem

**Error:**
```
Error: The provided path "~/Smugglers/BEAST-MODE-PRODUCT/website/website" does not exist.
```

**Root Cause:**
- Vercel project is configured with incorrect root directory
- Expects: `website/website` (doesn't exist)
- Should be: `website/` (actual location)

---

## 🔧 Solutions

### Option 1: Update Vercel Project Settings (Recommended)

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/jeff-adkins-projects/beast-mode-website/settings

2. **Update Root Directory**
   - Go to: Settings → General → Root Directory
   - Current: `website/website` (incorrect)
   - Change to: `website` or leave empty
   - Click "Save"

3. **Redeploy**
   - Go to: Deployments tab
   - Click "Redeploy" on latest deployment
   - Or push to git if auto-deploy enabled

---

### Option 2: Deploy via Git Push

If auto-deploy is enabled:

```bash
cd /Users/jeffadkins/Smugglers/BEAST-MODE-PRODUCT
git add .
git commit -m "Fix: Update API routes and credit system"
git push origin main
```

Vercel will automatically deploy from the correct path.

---

### Option 3: Manual Deployment via Dashboard

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/jeff-adkins-projects/beast-mode-website

2. **Redeploy Latest**
   - Go to: Deployments tab
   - Find latest deployment
   - Click "..." → "Redeploy"
   - Select "Use existing Build Cache" (optional)
   - Click "Redeploy"

---

### Option 4: Fix Vercel CLI Configuration

If you want to fix the CLI configuration:

```bash
cd /Users/jeffadkins/Smugglers/BEAST-MODE-PRODUCT/website

# Remove incorrect .vercel directory
rm -rf .vercel

# Re-link project with correct path
vercel link

# When prompted:
# - Set root directory to: . (current directory)
# - Or leave empty

# Deploy
vercel --prod --yes
```

---

## ✅ Verification

After deployment, verify routes:

```bash
cd /Users/jeffadkins/Smugglers/BEAST-MODE-PRODUCT
node scripts/fix-production-api-routes.js
```

**Expected:** All routes should return 200 or 401 (not 404)

---

## 📋 Current Status

**Routes Returning 404:**
- `/api/user/usage`
- `/api/user/subscription`
- `/api/credits/balance`
- `/api/credits/history`
- `/api/credits/purchase`
- `/api/stripe/webhook`
- `/api/github/webhook`

**Routes Working:**
- `/api/health` ✅

**Fix:** Update Vercel root directory setting, then redeploy.

---

**Last Updated:** 2026-01-10
