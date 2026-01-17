# Model Configuration - Execution Guide

## Status

✅ **Plan created**
✅ **Scripts created**  
✅ **SQL migration created**
⏳ **Waiting for Supabase credentials or CLI setup**

## Quick Execution Options

### Option 1: Supabase CLI (Recommended per cursorrules)

```bash
# 1. Ensure Supabase CLI is installed
brew install supabase/tap/supabase
# OR
npm install -g supabase

# 2. Link project (if not already linked)
cd BEAST-MODE-PRODUCT
supabase link --project-ref YOUR_PROJECT_REF

# 3. Apply migration
supabase db push --linked --include-all --yes

# OR use the script:
node website/scripts/configure-models-via-cli.js
```

### Option 2: SQL Editor (If CLI doesn't work)

1. Go to Supabase Dashboard → SQL Editor
2. Copy/paste contents of:
   ```
   supabase/migrations/20250122000000_configure_beast_mode_models.sql
   ```
3. Execute

### Option 3: Fix Credentials & Use Script

1. Get correct `SUPABASE_SERVICE_ROLE_KEY` from Supabase Dashboard
2. Update `website/.env.local`:
   ```bash
   SUPABASE_URL=https://rbfzlqmkwhbvrrfdcain.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```
3. Run:
   ```bash
   node website/scripts/configure-models-via-exec-sql.js
   ```

## Migration SQL

The migration file contains:

```sql
INSERT INTO custom_models (
  model_id,
  model_name,
  endpoint_url,
  provider,
  is_active,
  is_public,
  config,
  description,
  user_id
) VALUES (
  'beast-mode-code-generator',
  'BEAST MODE Code Generator',
  'https://api.beast-mode.dev/v1/chat/completions',
  'openai-compatible',
  true,
  true,
  '{"model": "beast-mode-code-generator", "temperature": 0.3, "max_tokens": 4000}'::jsonb,
  'Primary code generation model for BEAST MODE',
  NULL
)
ON CONFLICT (model_id) DO UPDATE SET
  model_name = EXCLUDED.model_name,
  endpoint_url = EXCLUDED.endpoint_url,
  provider = EXCLUDED.provider,
  is_active = EXCLUDED.is_active,
  is_public = EXCLUDED.is_public,
  config = EXCLUDED.config,
  description = EXCLUDED.description,
  updated_at = NOW();
```

## Verification

After configuration:

```bash
# Check models
node website/scripts/check-beast-mode-models.js

# Test code generation
node website/scripts/test-beast-mode-backend.js
```

## Files Created

1. ✅ `supabase/migrations/20250122000000_configure_beast_mode_models.sql` - SQL migration
2. ✅ `website/scripts/configure-models-via-exec-sql.js` - exec_sql script
3. ✅ `website/scripts/configure-models-via-cli.js` - CLI script
4. ✅ `website/scripts/configure-all-models.js` - Interactive script

All ready to execute once Supabase access is available!
