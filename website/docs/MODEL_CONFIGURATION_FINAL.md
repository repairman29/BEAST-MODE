# Model Configuration - Final Execution

## Status

✅ **Plan complete**
✅ **SQL migration ready**
⏳ **Ready to execute manually**

## Quick Execution (Copy/Paste SQL)

Since the Supabase CLI has migration conflicts and the service role key needs to be updated, here's the **fastest way** to configure the model:

### Step 1: Go to Supabase Dashboard

1. Open: https://supabase.com/dashboard/project/rbfzlqmkwhbvrrfdcain/sql/new
2. Or: Dashboard → SQL Editor → New Query

### Step 2: Copy/Paste This SQL

```sql
-- Configure BEAST MODE Code Generator Model
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
  'Primary code generation model for BEAST MODE - the galaxy''s best vibe-coder''s oasis',
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

### Step 3: Click "Run"

That's it! The model will be configured.

### Step 4: Verify

Run this SQL to verify:

```sql
SELECT 
  model_id,
  model_name,
  endpoint_url,
  is_active,
  is_public,
  provider
FROM custom_models
WHERE model_id = 'beast-mode-code-generator';
```

You should see:
- `model_id`: `beast-mode-code-generator`
- `is_active`: `true`
- `is_public`: `true`

## After Configuration

Once the model is configured, test it:

```bash
# Check models
cd website
node scripts/check-beast-mode-models.js

# Test code generation
node scripts/test-beast-mode-backend.js
```

## Alternative: Fix Service Role Key First

If you want to use the automated scripts:

1. **Get correct service role key:**
   - Supabase Dashboard → Settings → API
   - Copy `service_role` key (starts with `sb_secret_` or `eyJ...`)

2. **Update `.env.local`:**
   ```bash
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   ```

3. **Run script:**
   ```bash
   node website/scripts/apply-model-config-direct.js
   ```

## Files Ready

- ✅ `supabase/migrations/20250122000000_configure_beast_mode_models.sql` - SQL migration
- ✅ `website/scripts/apply-model-config-direct.js` - Direct insert script
- ✅ `website/scripts/configure-models-via-exec-sql.js` - exec_sql script
- ✅ `website/scripts/configure-models-via-cli.js` - CLI script

All ready - just need to execute the SQL!
