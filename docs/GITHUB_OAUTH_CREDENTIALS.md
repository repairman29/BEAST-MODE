# GitHub OAuth Credentials

## Development (Local)

**OAuth App:** BEAST MODE Development
- **Client ID**: `Ov23lidLvmp68FVMEqEB`
- **Client Secret**: `df4c598018de45ce8cb90313489eeb21448aedcf`
- **Callback URL**: `http://localhost:7777/api/github/oauth/callback`

**Used in:** `.env.local`

## Production (Vercel)

**OAuth App:** BEAST MODE Production
- **Client ID**: `Ov23liDKFkIrnPneWwny`
- **Client Secret**: `014c7fab1ba6cc6a7398b5bde04e26463f16f4e9`
- **Callback URL**: `https://beast-mode.dev/api/github/oauth/callback`

**Used in:** Vercel Environment Variables

## Setup Instructions

### Local Development
1. Copy values to `.env.local`:
   ```bash
   GITHUB_CLIENT_ID=Ov23lidLvmp68FVMEqEB
   GITHUB_CLIENT_SECRET=df4c598018de45ce8cb90313489eeb21448aedcf
   GITHUB_REDIRECT_URI=http://localhost:7777/api/github/oauth/callback
   NEXT_PUBLIC_URL=http://localhost:7777
   ```

### Production (Vercel)
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add these variables for **Production** environment:
   ```bash
   GITHUB_CLIENT_ID=Ov23liDKFkIrnPneWwny
   GITHUB_CLIENT_SECRET=014c7fab1ba6cc6a7398b5bde04e26463f16f4e9
   GITHUB_REDIRECT_URI=https://beast-mode.dev/api/github/oauth/callback
   NEXT_PUBLIC_URL=https://beast-mode.dev
   ```
3. Redeploy after adding variables

## Security Notes

- ✅ Separate apps for dev/prod (better security)
- ✅ Secrets stored in environment variables (not in code)
- ✅ Never commit secrets to git
- ✅ Production secrets different from development

## Verification

**Development:**
- OAuth App: https://github.com/settings/developers
- Look for app with Client ID: `Ov23lidLvmp68FVMEqEB`

**Production:**
- OAuth App: https://github.com/settings/developers
- Look for app with Client ID: `Ov23liDKFkIrnPneWwny`

