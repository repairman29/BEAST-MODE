# Secret Management Rules

## 🚨 CRITICAL RULE: Never Store Secrets in Documentation

**ALL secrets, API keys, credentials, and sensitive values MUST be stored in the database, NOT in documentation files.**

## Rules for AI Agents and Developers

### ✅ DO:
1. **Store secrets in Supabase `secrets` table**
   - Use the `secrets` table for all system secrets
   - Include category, description, and source information
   - Use proper key naming: `{category}_{type}` (e.g., `github_clientSecret`)

2. **Reference secrets in documentation**
   - Use placeholders: `[STORED_IN_DB]`, `[REDACTED]`, or `{SECRET_NAME}`
   - Include instructions on how to retrieve from database
   - Document which table/column stores the secret

3. **Use environment variables for local development**
   - Store in `.env.local` (never commit)
   - Reference `.env.example` with placeholders
   - Document required env vars in README

4. **Scan before committing**
   - Run `node scripts/scan-docs-for-secrets.js` to check for secrets
   - Use pre-commit hooks to prevent accidental commits
   - Review all markdown files before pushing

### ❌ NEVER:
1. **Hardcode secrets in documentation**
   - No actual API keys, tokens, or passwords in `.md` files
   - No real credentials in code examples
   - No production secrets in any committed files

2. **Commit secrets to git**
   - Never commit `.env.local` or `.env` files
   - Never commit actual secret values
   - Use `.gitignore` to exclude sensitive files

3. **Share secrets in documentation**
   - Don't paste real secrets in setup guides
   - Don't include actual credentials in examples
   - Don't document real production secrets

## Secret Storage Locations

### Database Tables

#### `secrets` table (Primary)
- **Purpose**: Store all system secrets and credentials
- **Schema**: `key`, `value`, `description`, `created_at`, `updated_at`
- **Access**: Service role only (RLS protected)
- **Usage**: All secrets from documentation should be here

#### `github_app_credentials` table
- **Purpose**: GitHub OAuth and App credentials
- **Schema**: `client_id`, `client_secret`, `webhook_secret`, etc.
- **Access**: Service role only

#### `user_api_keys` table
- **Purpose**: User-provided API keys (encrypted)
- **Schema**: `user_id`, `provider`, `encrypted_key`, etc.
- **Access**: Users can only access their own keys

### Environment Variables (Local Only)
- **Location**: `website/.env.local` (never committed)
- **Purpose**: Local development configuration
- **Template**: `website/.env.example` (with placeholders)

## Documentation Standards

### ✅ Correct Documentation Format

```markdown
## GitHub OAuth Setup

### Production Credentials
- **Client ID**: `Ov23liDKFkIrnPneWwny` (stored in database)
- **Client Secret**: `[STORED_IN_DB]` (retrieve from `secrets` table, key: `github_clientSecret`)
- **Webhook Secret**: `[STORED_IN_DB]` (retrieve from `secrets` table, key: `github_webhookSecret`)

### How to Retrieve
```sql
SELECT value FROM secrets WHERE key = 'github_clientSecret';
```

### Environment Variables
Set in Vercel or `.env.local`:
```bash
GITHUB_CLIENT_ID=Ov23liDKFkIrnPneWwny
GITHUB_CLIENT_SECRET=[STORED_IN_DB]
```
```

### ❌ Incorrect Documentation Format

```markdown
## GitHub OAuth Setup

### Production Credentials
- **Client ID**: `Ov23liDKFkIrnPneWwny`
- **Client Secret**: `014c7fab1ba6cc6a7398b5bde04e26463f16f4e9` ❌ NEVER DO THIS
- **Webhook Secret**: `[EXAMPLE_SECRET_HASH]` ❌ NEVER DO THIS (use [STORED_IN_DB] instead)
```

## Pre-Commit Checklist

Before committing any documentation changes:

1. ✅ Run secret scanner: `node scripts/scan-docs-for-secrets.js`
2. ✅ Check for hardcoded secrets: `grep -r "sk-\|ghp_\|whsec_\|sb_secret_" docs/`
3. ✅ Verify `.env.local` is in `.gitignore`
4. ✅ Review all markdown files for actual secret values
5. ✅ Replace any found secrets with placeholders
6. ✅ Store secrets in database if not already stored

## Automated Checks

### Pre-Commit Hook
A pre-commit hook automatically checks for secrets before commits:

```bash
# Install hook
npm run setup:hooks

# Manual check
node scripts/check-secrets-in-docs.js
```

### Secret Scanner
Regularly scan documentation for secrets:

```bash
# Scan and store in database
node scripts/scan-docs-for-secrets.js

# Check only (no storage)
node scripts/check-secrets-in-docs.js --check-only
```

## Enforcement

### For AI Agents
- **Always** check documentation before writing secrets
- **Always** use placeholders in documentation
- **Always** store secrets in database first
- **Never** hardcode secrets in examples
- **Never** commit actual secret values

### For Developers
- **Review** all documentation before committing
- **Run** secret scanner before pushing
- **Use** placeholders in all examples
- **Store** secrets in database, not docs

## Migration Guide

If you find secrets in existing documentation:

1. **Extract** the secret value
2. **Store** in database using `scripts/scan-docs-for-secrets.js`
3. **Replace** in documentation with placeholder
4. **Update** documentation to reference database
5. **Commit** the changes

## Examples

### ✅ Good: Stripe Setup Guide
```markdown
## Stripe Configuration

### Webhook Secret
The Stripe webhook secret is stored in the database.

**Retrieve from database:**
```sql
SELECT value FROM secrets WHERE key = 'stripe_webhookSecret';
```

**Or set in environment:**
```bash
STRIPE_WEBHOOK_SECRET=[STORED_IN_DB]
```

**Get from Stripe Dashboard:**
1. Go to Stripe Dashboard → Webhooks
2. Click on your webhook
3. Copy the "Signing secret" (starts with `whsec_`)
4. Store in database or environment variable
```
```

### ❌ Bad: Stripe Setup Guide
```markdown
## Stripe Configuration

### Webhook Secret
```bash
STRIPE_WEBHOOK_SECRET=whsec_1234567890abcdef ❌ NEVER DO THIS
```
```

## Related Documentation

- [Secret Scanning Guide](./FIX_SECRET_SCANNING.md)
- [GitHub OAuth Credentials](./GITHUB_OAUTH_CREDENTIALS.md)
- [Stripe Webhook Secret Guide](./STRIPE_WEBHOOK_SECRET_GUIDE.md)
- [Supabase Service Role Key Guide](./SUPABASE_SERVICE_ROLE_KEY_GUIDE.md)

## Questions?

If you're unsure whether something should be stored in the database:
1. **Ask**: Is this a secret, API key, or credential?
2. **If yes**: Store in database, use placeholder in docs
3. **If no**: You can document it normally

**When in doubt, store it in the database!**
