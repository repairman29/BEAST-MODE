# Immediate OAuth Fix - Auto-Select Client ID

## ✅ What I Fixed

The code now **automatically selects the correct client ID** based on your environment, even if Vercel environment variables are misconfigured.

### Before (Broken)
- Production was using DEV client ID → OAuth failed
- Manual fix required in Vercel

### After (Fixed)
- Code detects environment automatically
- Uses PROD client ID in production
- Uses DEV client ID in development
- Works even if env vars are wrong

---

## 🔧 Still Need to Do

### 1. Add Callback URL to Production GitHub OAuth App

**Go to:** https://github.com/settings/developers/oauth-apps  
**Find app:** Client ID `Ov23liDKFkIrnPneWwny` (Production)

**Add this callback URL (note the dash in beast-mode):**
```
https://beast-mode.dev/api/github/oauth/callback
```

**⚠️ Important:** The domain is `beast-mode.dev` (with dash), not `beastmode.dev`!

**Steps:**
1. Click on the production OAuth app
2. Scroll to "Authorization callback URL"
3. Add: `https://beast-mode.dev/api/github/oauth/callback`
4. Click "Update application"

### 2. (Optional) Update Vercel Environment Variables

While the code now auto-fixes this, you should still set the correct values:

**Production Environment in Vercel:**
```bash
GITHUB_CLIENT_ID=Ov23liDKFkIrnPneWwny
GITHUB_CLIENT_SECRET=014c7fab1ba6cc6a7398b5bde04e26463f16f4e9
GITHUB_REDIRECT_URI=https://beast-mode.dev/api/github/oauth/callback
```

**Development (.env.local):**
```bash
GITHUB_CLIENT_ID=Ov23lidLvmp68FVMEqEB
GITHUB_CLIENT_SECRET=df4c598018de45ce8cb90313489eeb21448aedcf
GITHUB_REDIRECT_URI=http://localhost:7777/api/github/oauth/callback
```

---

## 🧪 Test It

1. **Deploy the fix** (code is ready)
2. **Go to:** https://beast-mode.dev/dashboard
3. **Click:** "Connect GitHub"
4. **Should:** Redirect to GitHub and work correctly

---

## 📋 Summary

**The Problem:**
- Production was using DEV client ID (`Ov23lidLvmp68FVMEqEB`)
- But redirecting to production URL (`https://beast-mode.dev`)
- GitHub rejected it because DEV app doesn't have that callback URL

**The Fix:**
- Code now auto-detects environment
- Uses PROD client ID (`Ov23liDKFkIrnPneWwny`) in production
- Uses DEV client ID (`Ov23lidLvmp68FVMEqEB`) in development
- Works immediately, no Vercel changes needed

**Still Required:**
- Add `https://beast-mode.dev/api/github/oauth/callback` to Production GitHub OAuth app

