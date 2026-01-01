# Vercel Environment Variables Setup
## Day 2 Operations - Quick Setup Guide

**Use Vercel CLI to set environment variables for Day 2 Operations.**

---

## 🚀 Quick Setup (Automated)

### Option 1: Interactive Script
```bash
cd BEAST-MODE-PRODUCT
./scripts/set-vercel-env-janitor.sh
```

This will:
- Prompt for each required variable
- Set for production, preview, and development
- Verify values before setting

### Option 2: Auto Script (reads from .env.local)
```bash
cd BEAST-MODE-PRODUCT
./scripts/set-vercel-env-janitor-auto.sh
```

This will:
- Load values from `website/.env.local` if it exists
- Prompt only for missing values
- Set for all environments automatically

---

## 📋 Manual Setup (Vercel CLI)

### 1. Login to Vercel
```bash
vercel login
```

### 2. Link Project (if not already)
```bash
cd website
vercel link
```

### 3. Set Required Variables

```bash
# Supabase
vercel env add NEXT_PUBLIC_SUPABASE_URL production website
# Paste: https://your-project.supabase.co

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production website
# Paste: your-anon-key

vercel env add SUPABASE_SERVICE_ROLE_KEY production website
# Paste: your-service-role-key

# API Keys Encryption
vercel env add API_KEYS_ENCRYPTION_KEY production website
# Paste: your-encryption-key-32-chars-minimum

# GitHub OAuth
vercel env add GITHUB_CLIENT_ID production website
# Paste: your-client-id

vercel env add GITHUB_CLIENT_SECRET production website
# Paste: your-client-secret

vercel env add GITHUB_OAUTH_CALLBACK_URL production website
# Paste: https://your-domain.com/api/github/oauth/callback
```

### 4. Set for All Environments

For each variable, also set for `preview` and `development`:

```bash
# Example: Set for preview
vercel env add NEXT_PUBLIC_SUPABASE_URL preview website
# Paste same value

# Example: Set for development
vercel env add NEXT_PUBLIC_SUPABASE_URL development website
# Paste same value
```

### 5. Set Optional Variables

```bash
# Feature flags
vercel env add NEXT_PUBLIC_JANITOR_ENABLED production website
# Paste: true

vercel env add NEXT_PUBLIC_JANITOR_OVERNIGHT_MODE production website
# Paste: true

# JWT Secret (if using sessions)
vercel env add JWT_SECRET production website
# Paste: your-jwt-secret
```

---

## 🔍 Verify Variables

### List All Variables
```bash
vercel env ls
```

### List for Specific Environment
```bash
vercel env ls production
vercel env ls preview
vercel env ls development
```

### Get Specific Variable
```bash
vercel env pull .env.local
# Downloads all env vars to .env.local
```

---

## 🚀 Deploy with New Variables

After setting variables, redeploy:

```bash
cd website
vercel --prod
```

Or trigger a new deployment:
```bash
vercel --prod --force
```

---

## 📝 Required Variables Checklist

- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `API_KEYS_ENCRYPTION_KEY`
- [ ] `GITHUB_CLIENT_ID`
- [ ] `GITHUB_CLIENT_SECRET`
- [ ] `GITHUB_OAUTH_CALLBACK_URL`

### Optional
- [ ] `NEXT_PUBLIC_JANITOR_ENABLED` (default: true)
- [ ] `NEXT_PUBLIC_JANITOR_OVERNIGHT_MODE` (default: true)
- [ ] `JWT_SECRET` (if using sessions)

---

## 🔒 Security Notes

1. **Never commit `.env.local`** - It's in `.gitignore`
2. **Service Role Key** - Keep secret, server-side only
3. **Encryption Key** - Must match key used to encrypt API keys
4. **GitHub Secrets** - Keep secure, never expose

---

## 🐛 Troubleshooting

### "Variable not found" after deployment
- Variables are set per-environment
- Make sure you set for `production` environment
- Redeploy after setting: `vercel --prod`

### "Supabase connection failed"
- Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
- Check `SUPABASE_SERVICE_ROLE_KEY` is set
- Verify Supabase project is active

### "API key decryption failed"
- Verify `API_KEYS_ENCRYPTION_KEY` matches encryption key
- Check key is 32+ characters
- Verify keys are stored in `user_api_keys` table

---

## 📚 Related Documentation

- [API Keys Setup](./API_KEYS_SETUP.md)
- [Deployment Readiness](./DEPLOYMENT_READINESS.md)
- [Environment Setup](../ENV_SETUP.md)

---

**Last Updated:** 2025-01-01

