# Vercel Deployment Configuration Fix

**Issue:** Vercel CLI error: `The provided path "~/Smugglers/BEAST-MODE-PRODUCT/website/website" does not exist`

**Root Cause:** Vercel project settings have incorrect root directory configuration.

---

## Solution Options

### **Option 1: Fix in Vercel Dashboard (Recommended)**
1. Go to: https://vercel.com/jeff-adkins-projects/beast-mode-website/settings
2. Navigate to **General** → **Root Directory**
3. Set Root Directory to: `website` (if deploying from repo root) OR `.` (if deploying from website directory)
4. Save settings
5. Deploy: `cd BEAST-MODE-PRODUCT/website && vercel --prod --yes`

### **Option 2: Deploy via Git Push (Auto-Deploy)**
```bash
cd BEAST-MODE-PRODUCT
git add -A
git commit -m "Deploy: All migrations and services ready"
git push origin main
```
Vercel will auto-deploy on push (if connected to GitHub).

### **Option 3: Use Root Directory Deployment**
If project root is set to repo root:
```bash
cd BEAST-MODE-PRODUCT
vercel --prod --yes
```
This uses `vercel.json` in root with `buildCommand: "cd website && npm install && npm run build"`

### **Option 4: Re-link Project**
```bash
cd BEAST-MODE-PRODUCT/website
vercel unlink
vercel link
# Select existing project or create new
# Set root directory correctly during linking
vercel --prod --yes
```

---

## Current Configuration

**Root `vercel.json`:**
- Build Command: `cd website && npm install && npm run build`
- Output Directory: `website/.next`
- Install Command: `cd website && npm install`

**Website `vercel.json`:**
- Framework: `nextjs`
- Headers configured
- No build commands (uses Next.js defaults)

---

## Recommended Fix

**Best approach:** Use Option 2 (Git Push) for now, then fix root directory in dashboard for future CLI deployments.

**Status:** All code is ready. Deployment blocked only by configuration.
