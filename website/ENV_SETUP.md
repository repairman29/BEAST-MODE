# Environment Variables Setup Guide

This document explains all environment variables used in the BEAST MODE website.

## Quick Start

1. Copy the example file:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in your actual values in `.env.local`

3. **Never commit `.env.local`** - it's in `.gitignore`

## Required Variables

### JWT_SECRET
- **Required**: Yes
- **Purpose**: Used for generating session tokens
- **Generate**: `openssl rand -base64 32`
- **Example**: `JWT_SECRET=abc123xyz...`

## Optional Variables

### GitHub API

**GITHUB_TOKEN**
- **Required**: No (falls back to mock data)
- **Purpose**: Real repository scanning via GitHub API
- **Get from**: https://github.com/settings/tokens
- **Scopes**: `public_repo` (or `repo` for private repos)
- **Example**: `GITHUB_TOKEN=ghp_abc123...`

### Supabase Authentication

**NEXT_PUBLIC_SUPABASE_URL**
- **Required**: No (falls back to mock auth)
- **Purpose**: Supabase project URL
- **Get from**: Supabase Dashboard → Settings → API
- **Example**: `NEXT_PUBLIC_SUPABASE_URL=https://xyz.supabase.co`

**NEXT_PUBLIC_SUPABASE_ANON_KEY**
- **Required**: No (falls back to mock auth)
- **Purpose**: Supabase anonymous/public key (safe for client-side)
- **Get from**: Supabase Dashboard → Settings → API
- **Example**: `NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...`

**SUPABASE_SERVICE_ROLE_KEY**
- **Required**: No (falls back to mock auth)
- **Purpose**: Supabase service role key (server-only, has admin access)
- **Get from**: Supabase Dashboard → Settings → API
- **Example**: `SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...`
- **⚠️ Security**: Never expose this in client-side code!

### Stripe Payments

**STRIPE_SECRET_KEY**
- **Required**: No (payment features disabled if not set)
- **Purpose**: Stripe secret key for server-side operations
- **Get from**: https://dashboard.stripe.com/apikeys
- **Example**: `STRIPE_SECRET_KEY=sk_test_abc123...`

**NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY**
- **Required**: No (payment features disabled if not set)
- **Purpose**: Stripe publishable key for client-side operations
- **Get from**: https://dashboard.stripe.com/apikeys
- **Example**: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_abc123...`

### Application URLs

**NEXT_PUBLIC_URL**
- **Required**: No (defaults to localhost)
- **Purpose**: Base URL for the application
- **Development**: `http://localhost:7777`
- **Production**: `https://your-domain.com`
- **Example**: `NEXT_PUBLIC_URL=http://localhost:7777`

## File Structure

```
website/
├── .env.example          # Template (committed to git)
├── .env.local            # Your actual values (NOT committed)
└── ENV_SETUP.md          # This file
```

## Security Notes

1. **Never commit `.env.local`** - it contains secrets
2. **`.env.example` is safe to commit** - it only has placeholders
3. **Use different values for development and production**
4. **Rotate secrets regularly** - especially if exposed

## Verification

Check if your env vars are loaded:
```bash
# In Next.js, env vars starting with NEXT_PUBLIC_ are available in browser
# Other vars are server-only

# Check server-side vars (in API routes)
console.log(process.env.GITHUB_TOKEN ? '✅ GitHub token loaded' : '❌ GitHub token missing');

# Check client-side vars (in components)
console.log(process.env.NEXT_PUBLIC_URL || 'Using default URL');
```

## Troubleshooting

### "Mock data" warnings
- This means `GITHUB_TOKEN` is not set
- Repository scans will use deterministic mock data
- Set `GITHUB_TOKEN` for real GitHub API access

### "Mock auth" warnings
- This means Supabase credentials are not set
- Authentication will use mock JWT tokens
- Set Supabase vars for real authentication

### Variables not loading
- Make sure file is named `.env.local` (not `.env`)
- Restart the dev server after changing `.env.local`
- Check for typos in variable names
- Ensure no spaces around `=` sign
