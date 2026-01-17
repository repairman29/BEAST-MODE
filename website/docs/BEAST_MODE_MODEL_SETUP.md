# BEAST MODE Custom Model Setup

## Overview

BEAST MODE code generation requires a custom model to be configured in Supabase. This model is what actually generates the code - it's BEAST MODE's own infrastructure.

## Quick Setup

### Option 1: Interactive Setup Script

```bash
cd website
node scripts/setup-beast-mode-model.js
```

This will:
- Check if model exists
- Create the model if needed
- Prompt for endpoint URL and configuration
- Activate the model

### Option 2: Manual Supabase Setup

1. Go to Supabase Dashboard → Table Editor → `custom_models`
2. Insert a new row with:
   ```sql
   INSERT INTO custom_models (
     model_id,
     model_name,
     endpoint_url,
     provider,
     is_active,
     is_public,
     config
   ) VALUES (
     'beast-mode-code-generator',
     'BEAST MODE Code Generator',
     'https://your-model-endpoint.com/v1/chat/completions',
     'openai-compatible',
     true,
     true,
     '{"model": "beast-mode-code-generator", "temperature": 0.3, "max_tokens": 4000}'::jsonb
   );
   ```

## Model Configuration

### Required Fields

- `model_id`: `'beast-mode-code-generator'` (or any unique ID)
- `model_name`: Display name for the model
- `endpoint_url`: URL of your BEAST MODE model endpoint
- `provider`: `'openai-compatible'`, `'anthropic-compatible'`, or `'custom'`
- `is_active`: `true` (must be active to use)
- `is_public`: `true` (if you want it available to all users)

### Optional Fields

- `api_key_encrypted`: Encrypted API key for the model endpoint (if required)
- `headers`: Additional headers to send with requests
- `config`: JSON configuration (temperature, max_tokens, etc.)

## Model Endpoint Requirements

Your BEAST MODE model endpoint should:

1. **Accept POST requests** to the endpoint URL
2. **Handle OpenAI-compatible format** (if using `openai-compatible` provider):
   ```json
   {
     "model": "beast-mode-code-generator",
     "messages": [
       {"role": "system", "content": "..."},
       {"role": "user", "content": "..."}
     ],
     "temperature": 0.3,
     "max_tokens": 4000
   }
   ```
3. **Return OpenAI-compatible response**:
   ```json
   {
     "choices": [{
       "message": {
         "content": "```typescript\n// generated code\n```"
       }
     }]
   }
   ```

## Testing

Once the model is configured:

```bash
# Test the backend API
node scripts/test-beast-mode-backend.js

# Test code generation directly
curl -X POST http://localhost:7777/api/v1/code/generate \
  -H "Content-Type: application/json" \
  -H "X-BEAST-MODE-API-KEY: bm_live_..." \
  -d '{"prompt":"Create a React button component","language":"typescript"}'
```

## Troubleshooting

### "No BEAST MODE custom models available"

- Check that `is_active = true` in Supabase
- Verify the model exists in `custom_models` table
- Check that `is_public = true` or `user_id` matches your user

### "Model endpoint not found" or connection errors

- Verify the `endpoint_url` is correct and accessible
- Check that the endpoint accepts the expected request format
- Verify API keys/authentication if required

### Code generation returns errors

- Check model endpoint logs
- Verify the endpoint returns valid responses
- Ensure the response format matches the provider type

## Architecture

```
User Request
    ↓
BEAST MODE API Key
    ↓
/api/v1/code/generate
    ↓
Model Router
    ↓
Custom Model (from Supabase)
    ↓
Your BEAST MODE Model Endpoint
    ↓
Generated Code ✨
```

## Next Steps

1. **Set up your model endpoint** (if not already done)
2. **Run the setup script** or manually create the model in Supabase
3. **Test code generation** using the test scripts
4. **Use in IDE** - code generation will now work!
