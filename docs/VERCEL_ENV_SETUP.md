# Vercel Environment Variables Setup

## Production GitHub OAuth Configuration

Use the Vercel CLI to set up production environment variables:

### Quick Setup (Interactive)

```bash
cd website
vercel env add GITHUB_CLIENT_ID production
# Enter: Ov23liDKFkIrnPneWwny

vercel env add GITHUB_CLIENT_SECRET production
# Enter: 014c7fab1ba6cc6a7398b5bde04e26463f16f4e9

vercel env add GITHUB_REDIRECT_URI production
# Enter: https://beastmode.dev/api/github/oauth/callback

vercel env add NEXT_PUBLIC_URL production
# Enter: https://beastmode.dev
```

### Verify Setup

```bash
vercel env ls production
```

### Production Values

- **GITHUB_CLIENT_ID**: `Ov23liDKFkIrnPneWwny`
- **GITHUB_CLIENT_SECRET**: `014c7fab1ba6cc6a7398b5bde04e26463f16f4e9`
- **GITHUB_REDIRECT_URI**: `https://beastmode.dev/api/github/oauth/callback`
- **NEXT_PUBLIC_URL**: `https://beastmode.dev`

### After Setup

1. **Redeploy** to apply new environment variables:
   ```bash
   vercel --prod
   ```

2. **Verify** the GitHub OAuth App has the correct callback URL:
   - Go to: https://github.com/settings/developers
   - Find app with Client ID: `Ov23liDKFkIrnPneWwny`
   - Verify callback URL: `https://beastmode.dev/api/github/oauth/callback`

### Alternative: Vercel Dashboard

You can also set these in the Vercel Dashboard:
1. Go to: https://vercel.com/dashboard
2. Select your project
3. Settings → Environment Variables
4. Add each variable for **Production** environment

