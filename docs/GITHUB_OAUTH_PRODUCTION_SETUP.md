# GitHub OAuth Production Setup

## Current Issue

GitHub is showing: "The `redirect_uri` is not associated with this application"

This happens because the redirect URI in your code doesn't match what's configured in your GitHub OAuth App.

## Solution: Create Separate OAuth Apps

**GitHub OAuth Apps only allow ONE callback URL at a time.**

The best solution is to create **separate OAuth Apps** for development and production:

### Development OAuth App (Current)
- **Client ID**: `Ov23lidLvmp68FVMEqEB`
- **Callback URL**: `http://localhost:7777/api/github/oauth/callback`
- **Use for**: Local development

### Production OAuth App (Create New)
1. **Go to:** https://github.com/settings/developers
2. **Click "New OAuth App"**
3. **Fill in:**
   - **Application name**: `BEAST MODE Production`
   - **Homepage URL**: `https://beast-mode.dev`
   - **Authorization callback URL**: `https://beast-mode.dev/api/github/oauth/callback`
4. **Save** and copy the new Client ID and Client Secret

## Environment Variables

### Local Development (.env.local)
```bash
GITHUB_CLIENT_ID=Ov23lidLvmp68FVMEqEB
GITHUB_CLIENT_SECRET=[STORED_IN_DB]
GITHUB_REDIRECT_URI=http://localhost:7777/api/github/oauth/callback
NEXT_PUBLIC_URL=http://localhost:7777
```

### Production (Vercel Environment Variables)
```bash
# Production OAuth App credentials
GITHUB_CLIENT_ID=Ov23liDKFkIrnPneWwny
GITHUB_CLIENT_SECRET=[STORED_IN_DB]
GITHUB_REDIRECT_URI=https://beast-mode.dev/api/github/oauth/callback
NEXT_PUBLIC_URL=https://beast-mode.dev
```

**✅ Production credentials configured!**

## Code Already Handles This

The code automatically uses the correct redirect URI based on environment:

```typescript
const redirectUri = process.env.GITHUB_REDIRECT_URI || 
                   `${process.env.NEXT_PUBLIC_URL || 'http://localhost:7777'}/api/github/oauth/callback`;
```

So you just need to:
1. Set `GITHUB_REDIRECT_URI` in Vercel environment variables for production
2. Make sure GitHub OAuth App has the production callback URL

## Quick Fix for Now (Development)

**To fix the current error for local development:**

1. Go to: https://github.com/settings/developers
2. Click your OAuth App (Client ID: `Ov23lidLvmp68FVMEqEB`)
3. Update "Authorization callback URL" to:
   ```
   http://localhost:7777/api/github/oauth/callback
   ```
4. Save
5. Try connecting again

**Note:** This will break production if you're using the same app. That's why separate apps are recommended.

## Production Checklist

- [ ] Create new GitHub OAuth App for production
- [ ] Set production callback URL: `https://beast-mode.dev/api/github/oauth/callback`
- [ ] Copy production Client ID and Client Secret
- [ ] Set `GITHUB_CLIENT_ID` in Vercel (production app)
- [ ] Set `GITHUB_CLIENT_SECRET` in Vercel (production app)
- [ ] Set `GITHUB_REDIRECT_URI` in Vercel: `https://beast-mode.dev/api/github/oauth/callback`
- [ ] Set `NEXT_PUBLIC_URL` in Vercel: `https://beast-mode.dev`
- [ ] Test OAuth flow in production
- [ ] Verify callback URL matches exactly (no trailing slash, correct protocol)

## Why Separate Apps?

- ✅ Development and production can run simultaneously
- ✅ No need to change callback URL when deploying
- ✅ Better security isolation
- ✅ Can revoke/update one without affecting the other

