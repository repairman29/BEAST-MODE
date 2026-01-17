# BEAST MODE Model Configuration Guide

## Current Status

❌ **Supabase connection issue detected** - "Unregistered API key" error

This suggests the `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` may be incorrect or expired.

## Configuration Options

### Option 1: Fix Supabase Credentials (Recommended)

1. **Get correct Supabase credentials:**
   - Go to Supabase Dashboard → Project Settings → API
   - Copy the `service_role` key (not the `anon` key)
   - Update `.env.local`:
     ```bash
     SUPABASE_URL=https://your-project.supabase.co
     SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
     ```

2. **Run configuration script:**
   ```bash
   node scripts/configure-models-via-exec-sql.js
   ```

### Option 2: Manual SQL Configuration

If the script doesn't work, configure models directly via Supabase SQL Editor:

1. **Go to Supabase Dashboard → SQL Editor**

2. **Run this SQL:**

```sql
-- Create/Update BEAST MODE Code Generator Model
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

3. **Verify the model was created:**

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

### Option 3: Supabase Dashboard

1. Go to Supabase Dashboard → Table Editor → `custom_models`
2. Click "Insert row"
3. Fill in:
   - `model_id`: `beast-mode-code-generator`
   - `model_name`: `BEAST MODE Code Generator`
   - `endpoint_url`: `https://api.beast-mode.dev/v1/chat/completions`
   - `provider`: `openai-compatible`
   - `is_active`: `true`
   - `is_public`: `true`
   - `config`: `{"model": "beast-mode-code-generator", "temperature": 0.3, "max_tokens": 4000}`
   - `description`: `Primary code generation model for BEAST MODE`
   - `user_id`: Leave NULL (system model)

## Model Endpoint Configuration

### Current Default Endpoint

- **URL:** `https://api.beast-mode.dev/v1/chat/completions`
- **Provider:** `openai-compatible`

### If Using Different Endpoint

If you have your own model endpoint, update the `endpoint_url`:

**Examples:**
- Local Ollama: `http://localhost:11434/v1/chat/completions`
- Cloud service: `https://your-model-api.com/v1/chat/completions`
- Custom BEAST MODE service: `https://api.beast-mode.dev/v1/chat/completions`

## Verification

After configuring, verify the model:

```bash
# Check models
node scripts/check-beast-mode-models.js

# Test code generation
node scripts/test-beast-mode-backend.js
```

## Troubleshooting

### "Unregistered API key" Error

- **Cause:** Supabase service role key is incorrect or expired
- **Solution:** 
  1. Get fresh key from Supabase Dashboard
  2. Update `.env.local`
  3. Or use manual SQL method (Option 2)

### "Permission denied" Error

- **Cause:** RLS policies blocking service role
- **Solution:** Use service role key (not anon key) or configure via SQL Editor

### "Model not found" Error

- **Cause:** Model not created or `is_active = false`
- **Solution:** 
  1. Verify model exists: `SELECT * FROM custom_models WHERE model_id = 'beast-mode-code-generator';`
  2. Ensure `is_active = true`
  3. Ensure `is_public = true` or `user_id` matches

## Next Steps

Once models are configured:

1. ✅ Test model configuration
2. ✅ Test code generation
3. ✅ Use in IDE for code generation
4. ✅ Monitor model usage and performance
