# GitHub OAuth Redirect URI Configuration

## Current Configuration

**Local Development:**
```
http://localhost:7777/api/github/oauth/callback
```

**Production:**
```
https://beast-mode.dev/api/github/oauth/callback
```

## ⚠️ Critical: Must Match GitHub OAuth App

The redirect URI in your code **MUST EXACTLY MATCH** the "Authorization callback URL" in your GitHub OAuth App settings.

## How to Verify/Fix

1. **Go to GitHub OAuth Apps:**
   - Visit: https://github.com/settings/developers
   - Click "OAuth Apps" → Your app (or create new)

2. **Set Authorization callback URL:**
   - For local dev: `http://localhost:7777/api/github/oauth/callback`
   - For production: `https://beast-mode.dev/api/github/oauth/callback`

3. **Common Mistakes:**
   - ❌ Trailing slash: `http://localhost:7777/api/github/oauth/callback/`
   - ❌ Wrong port: `http://localhost:3000/api/github/oauth/callback`
   - ❌ HTTP vs HTTPS mismatch
   - ❌ Missing `/api` prefix

## Environment Variables

Make sure `.env.local` has:
```bash
GITHUB_REDIRECT_URI=http://localhost:7777/api/github/oauth/callback
NEXT_PUBLIC_URL=http://localhost:7777
```

## Testing

1. Click "Connect GitHub Account" in Settings
2. Should redirect to GitHub (no redirect_uri error)
3. After authorization, redirects back to dashboard

## Error Messages

If you see "redirect_uri_mismatch":
- Check GitHub OAuth App callback URL matches exactly
- Verify `.env.local` has correct `GITHUB_REDIRECT_URI`
- Restart dev server after changing env vars

