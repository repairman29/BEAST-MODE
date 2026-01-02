# Callback URLs Setup Guide

## GitHub OAuth Apps

You need to configure callback URLs in **GitHub OAuth Apps** (not Supabase). Supabase is just storing the tokens - it doesn't need callback URLs.

### Development OAuth App

**App Name:** BEAST MODE Development  
**Client ID:** `Ov23lidLvmp68FVMEqEB`  
**Location:** https://github.com/settings/developers/oauth-apps

**Callback URLs to Add:**
```
http://localhost:7777/api/github/oauth/callback
```

**Steps:**
1. Go to https://github.com/settings/developers/oauth-apps
2. Find the app with Client ID: `Ov23lidLvmp68FVMEqEB`
3. Click "Edit" or the app name
4. In "Authorization callback URL", add:
   - `http://localhost:7777/api/github/oauth/callback`
5. Click "Update application"

---

### Production OAuth App

**App Name:** BEAST MODE Production  
**Client ID:** `Ov23liDKFkIrnPneWwny`  
**Location:** https://github.com/settings/developers/oauth-apps

**Callback URLs to Add:**
```
https://beastmode.dev/api/github/oauth/callback
https://beast-mode-website.vercel.app/api/github/oauth/callback
```

**Steps:**
1. Go to https://github.com/settings/developers/oauth-apps
2. Find the app with Client ID: `Ov23liDKFkIrnPneWwny`
3. Click "Edit" or the app name
4. In "Authorization callback URL", add **both**:
   - `https://beastmode.dev/api/github/oauth/callback` (your custom domain)
   - `https://beast-mode-website.vercel.app/api/github/oauth/callback` (Vercel preview URLs)
5. Click "Update application"

**Note:** GitHub allows multiple callback URLs separated by newlines or commas. Add both to support:
- Custom domain (beastmode.dev)
- Vercel preview deployments

---

## Supabase Configuration

**Supabase does NOT need callback URLs.** It's just storing the encrypted tokens in the database.

However, you DO need to:
1. ✅ Run the migration: `20250102000001_create_user_github_tokens.sql`
2. ✅ Ensure RLS policies are set (included in migration)
3. ✅ Have `SUPABASE_SERVICE_ROLE_KEY` in environment variables

---

## Verification Checklist

### GitHub OAuth Apps
- [ ] Development app has: `http://localhost:7777/api/github/oauth/callback`
- [ ] Production app has: `https://beastmode.dev/api/github/oauth/callback`
- [ ] Production app has: `https://beast-mode-website.vercel.app/api/github/oauth/callback`

### Environment Variables
- [ ] `GITHUB_REDIRECT_URI` matches the callback URL for your environment
- [ ] `NEXT_PUBLIC_URL` matches your domain
- [ ] `GITHUB_CLIENT_ID` matches the app you're using (dev vs prod)

### Testing
1. **Development:**
   - Start local server: `npm run dev`
   - Go to: `http://localhost:7777/dashboard`
   - Click "Connect GitHub"
   - Should redirect to GitHub and back successfully

2. **Production:**
   - Go to: `https://beastmode.dev/dashboard`
   - Click "Connect GitHub"
   - Should redirect to GitHub and back successfully

---

## Troubleshooting

### Error: "redirect_uri_mismatch"
- **Cause:** Callback URL in GitHub OAuth app doesn't match what's in your code
- **Fix:** 
  1. Check `GITHUB_REDIRECT_URI` environment variable
  2. Check callback URL in GitHub OAuth app settings
  3. They must match **exactly** (including http vs https, trailing slashes, etc.)

### Error: "Invalid client"
- **Cause:** Wrong Client ID for environment
- **Fix:**
  - Development: Use `Ov23lidLvmp68FVMEqEB`
  - Production: Use `Ov23liDKFkIrnPneWwny`

### OAuth works but token not stored
- **Cause:** Supabase migration not run or RLS policies blocking
- **Fix:**
  1. Run migration in Supabase SQL Editor
  2. Check `SUPABASE_SERVICE_ROLE_KEY` is set
  3. Check logs for Supabase errors

