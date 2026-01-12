# GitHub OAuth Setup - Quick Start

**Your GitHub OAuth credentials are configured!** 🎉

## ✅ Credentials Configured

- **Client ID**: `Ov23lidLvmp68FVMEqEB`
- **Client Secret**: `[STORED_IN_DB]` (retrieve from Supabase `secrets` table, key: `github_clientSecret`)

## 🔧 Environment Variables

Your `.env.local` file should contain:

```bash
# GitHub OAuth
GITHUB_CLIENT_ID=Ov23lidLvmp68FVMEqEB
GITHUB_CLIENT_SECRET=[STORED_IN_DB]
GITHUB_REDIRECT_URI=http://localhost:7777/api/github/oauth/callback

# Token Encryption (generate with: openssl rand -hex 32)
GITHUB_TOKEN_ENCRYPTION_KEY=your_generated_key_here

# App URL
NEXT_PUBLIC_URL=http://localhost:7777
```

## 🚀 Quick Setup

1. **Generate Encryption Key:**
   ```bash
   openssl rand -hex 32
   ```
   Copy the output and add it to `.env.local` as `GITHUB_TOKEN_ENCRYPTION_KEY`

2. **Update Redirect URI for Production:**
   - Development: `http://localhost:7777/api/github/oauth/callback`
   - Production: `https://beast-mode.dev/api/github/oauth/callback`
   
   Update the callback URL in your GitHub OAuth App settings to match.

3. **Restart Dev Server:**
   ```bash
   npm run dev
   ```

## ✅ Verify Setup

1. Go to Settings tab in dashboard
2. You should see "GitHub Connection" card
3. Click "Connect GitHub Account"
4. Should redirect to GitHub for authorization

## 🔒 Security Notes

- ✅ Client Secret is stored in `.env.local` (not committed to git)
- ✅ Tokens are encrypted with AES-256-CBC
- ✅ Encryption key should be unique per environment
- ✅ Never commit `.env.local` to git

## 📋 GitHub OAuth App Settings

Make sure your GitHub OAuth App has:
- **Authorization callback URL**: `http://localhost:7777/api/github/oauth/callback` (dev) or `https://beast-mode.dev/api/github/oauth/callback` (prod)
- **Scopes**: `repo`, `read:user`, `user:email`

## 🎯 Ready to Use!

Your dev friends can now:
1. Connect their GitHub account
2. Scan their private repositories
3. Get quality insights on private code

---

**Status**: ✅ **CONFIGURED & READY!** 🚀

