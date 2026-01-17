# BEAST MODE Models Check

## How to Check Available Models

The code generation system automatically finds and uses any active custom models in Supabase.

### Check Models via API

```bash
# Health check (shows model status)
curl http://localhost:7777/api/v1/health

# Try code generation (will use first available model)
curl -X POST http://localhost:7777/api/v1/code/generate \
  -H "Content-Type: application/json" \
  -H "X-BEAST-MODE-API-KEY: bm_live_..." \
  -d '{"prompt":"Create a React button","language":"typescript"}'
```

### Check Models in Supabase

1. Go to Supabase Dashboard
2. Table Editor → `custom_models`
3. Filter: `is_active = true`
4. Check for models with:
   - `is_active = true`
   - `endpoint_url` configured
   - `is_public = true` OR `user_id` matches your user

### Model Selection Logic

BEAST MODE automatically:
1. Finds all active custom models
2. Prefers public models first
3. Then user-specific models
4. Tries each model until one works
5. Uses the first working model

### If No Models Found

The error message will be:
```
No BEAST MODE custom models available. Please ensure custom models are configured in Supabase custom_models table with is_active=true.
```

To fix:
1. Check Supabase `custom_models` table
2. Ensure at least one model has `is_active = true`
3. Ensure the model has a valid `endpoint_url`
4. Ensure `is_public = true` or `user_id` matches

### Testing

```bash
# Run test suite
node scripts/test-beast-mode-backend.js

# Check what models are being used
# Look for console logs: "[BEAST MODE Backend] Found X active model(s)"
```
