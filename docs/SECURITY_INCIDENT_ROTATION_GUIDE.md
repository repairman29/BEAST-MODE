# Security Incident: Secret Rotation Guide

## 🚨 CRITICAL: Secrets Exposed in Git History

**Date:** 2026-01-12  
**Commit:** 6dac51fe  
**File:** `website/.env.vercel.new`

## Exposed Secrets

The following secrets were committed to git and are visible in git history:

1. **GITHUB_CLIENT_SECRET** - `014c7fab1ba6cc6a7398b5bde04e26463f16f4e9`
2. **GITHUB_TOKEN_ENCRYPTION_KEY** - `20abb6f3b973e2fdeea6e2c417ce93824e7b64962f9fee4bfd6339264c8e792c`
3. **STRIPE_WEBHOOK_SECRET** - `whsec_rKUFl59BlCKm3PXKK86W2tImFxqUV5zB` ⚠️ CRITICAL
4. **SUPABASE_SERVICE_ROLE_KEY** - `sb_secret_QHGa9Odl9BAXdF0YkBxaOA_TTVO2l1s` ⚠️ CRITICAL

## Immediate Actions Taken

✅ Removed file from git tracking  
✅ Added `.env.vercel.*` to `.gitignore`  
✅ Deleted file from filesystem  
✅ Committed security fix  

## Required: Rotate All Secrets

### Quick Start: Automated Rotation

**Option 1: Interactive Script (Recommended)**
```bash
node scripts/rotate-all-secrets-interactive.js
```
This script guides you through rotating all secrets interactively.

**Option 2: Stripe Webhook (Automated)**
```bash
node scripts/rotate-stripe-webhook-secret.js
```
This script automatically creates a new Stripe webhook and provides the new secret.

**Option 3: Full API Automation**
```bash
# Set required tokens
export STRIPE_SECRET_KEY="sk_..."
export SUPABASE_ACCESS_TOKEN="..."
export GITHUB_TOKEN="..."
export VERCEL_TOKEN="..."

node scripts/rotate-exposed-secrets.js
```

### Manual Rotation (If Scripts Don't Work)

### 1. GitHub OAuth Client Secret

**Location:** GitHub Developer Settings  
**URL:** https://github.com/settings/developers

1. Go to your OAuth App settings
2. Click "Generate a new client secret"
3. Copy the new secret
4. Update in Vercel: `GITHUB_CLIENT_SECRET`
5. Update in Supabase secrets table (if stored there)

### 2. GitHub Token Encryption Key

**Action:** Generate new encryption key

```bash
# Generate new 64-character hex key
openssl rand -hex 32
```

1. Generate new key using command above
2. Update in Vercel: `GITHUB_TOKEN_ENCRYPTION_KEY`
3. **⚠️ WARNING:** Existing encrypted tokens will be invalid
4. Users may need to re-authenticate

### 3. Stripe Webhook Secret ⚠️ CRITICAL

**Location:** Stripe Dashboard  
**URL:** https://dashboard.stripe.com/webhooks

1. Go to Stripe Dashboard → Developers → Webhooks
2. Find your webhook endpoint
3. Click "Reveal" next to "Signing secret"
4. Click "Reveal test key" or "Reveal live key"
5. Copy the new secret (starts with `whsec_`)
6. Update in Vercel: `STRIPE_WEBHOOK_SECRET`
7. **⚠️ IMPORTANT:** Old webhook secret will stop working immediately

### 4. Supabase Service Role Key ⚠️ CRITICAL

**Location:** Supabase Dashboard  
**URL:** https://supabase.com/dashboard

1. Go to your project → Settings → API
2. Scroll to "Project API keys"
3. Find "service_role" key (⚠️ Secret, not anon key)
4. Click "Reset" or "Reveal" to regenerate
5. Copy the new key (starts with `sb_secret_`)
6. Update in Vercel: `SUPABASE_SERVICE_ROLE_KEY`
7. **⚠️ WARNING:** This key has full database access - rotate immediately!

## Update Vercel Environment Variables

After rotating each secret:

1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. Update each variable:
   - `GITHUB_CLIENT_SECRET`
   - `GITHUB_TOKEN_ENCRYPTION_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. Redeploy the application

## Remove from Git History (Optional but Recommended)

To completely remove the secrets from git history:

```bash
# Using git filter-branch (slower but built-in)
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch website/.env.vercel.new' \
  --prune-empty --tag-name-filter cat -- --all

# Force push (⚠️ WARNING: This rewrites history)
git push origin --force --all
git push origin --force --tags
```

**⚠️ WARNING:** Force pushing rewrites git history. Coordinate with team first!

## Prevention

✅ Added `.env.vercel.*` to `.gitignore`  
✅ File removed from repository  
✅ Pre-commit hooks should catch future secrets  

## Verification

After rotation, verify:

1. ✅ GitHub OAuth still works
2. ✅ Stripe webhooks are receiving events
3. ✅ Supabase connections are working
4. ✅ No errors in Vercel logs

## Timeline

- **2026-01-12:** Secrets exposed in commit 6dac51fe
- **2026-01-12:** File removed from git tracking
- **2026-01-12:** `.gitignore` updated
- **PENDING:** All secrets rotated
- **PENDING:** Git history cleaned (optional)

## Notes

- The file `.env.vercel.new` should never have been committed
- All `.env*` files are now in `.gitignore`
- Consider using Vercel's environment variable UI instead of files
- Store secrets in Supabase `secrets` table for centralized management
