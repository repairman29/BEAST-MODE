# BEAST MODE API Key Setup for Code Generation

## Overview

BEAST MODE code generation requires provider API keys (Anthropic or OpenAI) to actually generate code. The BEAST MODE API key (`bm_live_...`) is used for authentication, but code generation needs provider keys.

## Current Setup

✅ **BEAST MODE API Key Configured:**
- Added to `.env.local`: `BEAST_MODE_API_KEY=bm_live_w4fXAvRuXAs6AqAEOhv47boa3AIgTpOnI9IbpoSBS0g`

## How It Works

The code generation system tries to get provider API keys in this order:

1. **User API Keys** (from Supabase `user_api_keys` table)
   - If user is logged in, tries to get their Anthropic/OpenAI keys
   
2. **System Environment Variables** (if BEAST MODE API key is present)
   - `ANTHROPIC_API_KEY` or `ANTHROPIC_KEY`
   - `OPENAI_API_KEY` or `OPENAI_KEY`
   
3. **BEAST MODE Backend API** (if configured)
   - Falls back to calling BEAST MODE backend API endpoint

## To Enable Code Generation

### Option 1: Add Provider API Keys to Environment (Recommended)

Add to `.env.local`:

```bash
# BEAST MODE API Key (already added)
BEAST_MODE_API_KEY=bm_live_w4fXAvRuXAs6AqAEOhv47boa3AIgTpOnI9IbpoSBS0g

# Provider API Keys (add one or both)
ANTHROPIC_API_KEY=sk-ant-...
# OR
OPENAI_API_KEY=sk-...
```

### Option 2: Store Provider Keys in Supabase

1. Add provider API keys to `user_api_keys` table in Supabase
2. The system will automatically use them when the BEAST MODE API key is present

### Option 3: Use BEAST MODE Backend API

If you have a BEAST MODE backend API endpoint, configure:

```bash
BEAST_MODE_API_URL=https://api.beast-mode.dev
```

## Testing

Once provider API keys are configured, test code generation:

```bash
# Test direct code generation
curl -X POST http://localhost:7777/api/beast-mode/generate-code \
  -H "Content-Type: application/json" \
  -H "X-BEAST-MODE-API-KEY: bm_live_w4fXAvRuXAs6AqAEOhv47boa3AIgTpOnI9IbpoSBS0g" \
  -d '{"prompt":"Create a React button component","language":"typescript"}'

# Run E2E tests
node scripts/e2e-test-beast-mode.js
node scripts/fix-and-test-code-generation.js
```

## Next Steps

1. **Add provider API keys** to `.env.local` (Anthropic or OpenAI)
2. **Restart the dev server** to load new environment variables
3. **Test code generation** using the scripts above
4. **Verify E2E tests pass** once keys are configured

## Security Notes

- BEAST MODE API key is for authentication only
- Provider API keys are what actually generate code
- Never commit API keys to git
- Use environment variables or Supabase for secure storage
