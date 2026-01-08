# Testing Custom Model Registration

## Quick Start

### Option 1: Test with User ID (Recommended)

1. **Get your User ID:**
   ```bash
   # Method 1: From browser cookies
   # 1. Log into https://beast-mode.dev
   # 2. Open browser DevTools (F12)
   # 3. Go to Application/Storage > Cookies
   # 4. Find 'github_oauth_user_id' cookie value
   
   # Method 2: From Supabase (if you have access)
   # SELECT id FROM auth.users WHERE email = 'your-email@example.com';
   ```

2. **Run the test:**
   ```bash
   cd BEAST-MODE-PRODUCT
   node scripts/test-custom-model-registration.js --user-id=YOUR_USER_ID
   ```

### Option 2: Test with Environment Variable

```bash
export TEST_USER_ID=YOUR_USER_ID
cd BEAST-MODE-PRODUCT
node scripts/test-custom-model-registration.js
```

### Option 3: Test Without Auth (Partial Test)

```bash
cd BEAST-MODE-PRODUCT
node scripts/test-custom-model-registration.js
# Will test everything except registration
```

## What Gets Tested

1. ✅ **User ID Check** - Verifies authentication
2. ✅ **Register Custom Model** - Creates a test model
3. ✅ **List Models** - Verifies model appears in list
4. ✅ **Get Model Details** - Retrieves model information
5. ✅ **Use in Chat** - Tests custom model in codebase chat
6. ✅ **Update Model** - Modifies model description
7. ⚠️ **Delete Model** - Optional (commented out by default)

## Expected Results

### With Authentication ✅
```
🧪 Check User ID... ✅ PASSED
🧪 Register Custom Model... ✅ PASSED
🧪 List Models (includes custom)... ✅ PASSED
🧪 Get Model Details... ✅ PASSED
🧪 Use Custom Model in Chat... ✅ PASSED
🧪 Update Custom Model... ✅ PASSED

📊 Test Results
✅ Passed: 6
❌ Failed: 0
📈 Success Rate: 100.0%
```

### Without Authentication ⚠️
```
🧪 Check User ID... ❌ FAILED: User ID required
🧪 Register Custom Model... ❌ FAILED: Authentication required
🧪 List Models (includes custom)... ✅ PASSED
🧪 Get Model Details... ❌ FAILED: Authentication required
🧪 Use Custom Model in Chat... ✅ PASSED (model router works)
🧪 Update Custom Model... ❌ FAILED: Authentication required

📊 Test Results
✅ Passed: 2
❌ Failed: 4
📈 Success Rate: 33.3%
```

## Getting Your User ID

### Method 1: Browser Cookies (Easiest)

1. Open https://beast-mode.dev in your browser
2. Log in with GitHub OAuth
3. Open Developer Tools (F12 or Cmd+Option+I)
4. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
5. Click **Cookies** → `https://beast-mode.dev`
6. Find `github_oauth_user_id` cookie
7. Copy the **Value** (this is your user ID)

### Method 2: Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Users**
3. Find your user account
4. Copy the **User UID** (this is your user ID)

### Method 3: API Call (If you have a session)

```bash
# Make a request to any authenticated endpoint
# The error message might include user info, or check response headers
curl -v https://beast-mode.dev/api/models/list \
  -H "Cookie: github_oauth_user_id=YOUR_USER_ID"
```

## Test Model Configuration

The test uses this model configuration:

```javascript
{
  modelName: 'Test Code Generation Model',
  modelId: 'custom:test-code-gen-model',
  endpointUrl: 'https://api.openai.com/v1/chat/completions',
  provider: 'openai-compatible',
  apiKey: 'test-key-12345', // This won't work, but tests the flow
  description: 'Test model for code generation',
  contextWindow: 8192,
  maxTokens: 4000,
  temperature: 0.7
}
```

**Note:** The API key is fake, so actual API calls will fail, but the registration and routing will work.

## Troubleshooting

### "Authentication required" Error

**Problem:** User ID not provided or invalid

**Solution:**
1. Make sure you're logged into beast-mode.dev
2. Get the correct user ID from cookies
3. Use `--user-id=YOUR_USER_ID` flag

### "Model already exists" Error

**Problem:** Test model was already registered

**Solution:**
1. This is OK - the test will use the existing model
2. Or delete it first via API:
   ```bash
   curl -X DELETE https://beast-mode.dev/api/models/custom \
     -H "Cookie: github_oauth_user_id=YOUR_USER_ID" \
     -H "Content-Type: application/json" \
     -d '{"modelId": "custom:test-code-gen-model"}'
   ```

### "Database connection failed" Error

**Problem:** Supabase not configured or unavailable

**Solution:**
1. Check `.env.local` has `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
2. Verify Supabase project is active
3. Check database connection

### "Codebase chat not available" Error

**Problem:** Module not loaded (production vs local)

**Solution:**
1. Test locally: `npm run dev` in `website/` directory
2. Set `BEAST_MODE_URL=http://localhost:3000`
3. Run test script

## Full Test Flow

```bash
# 1. Start local server (optional, for full testing)
cd BEAST-MODE-PRODUCT/website
npm run dev

# 2. In another terminal, get your user ID
# (Follow "Getting Your User ID" instructions above)

# 3. Run the test
cd BEAST-MODE-PRODUCT
BEAST_MODE_URL=http://localhost:3000 \
  node scripts/test-custom-model-registration.js --user-id=YOUR_USER_ID
```

## Success Criteria

✅ All tests pass (6/6)  
✅ Model registered successfully  
✅ Model appears in list  
✅ Model can be used in codebase chat  
✅ Model can be updated  
✅ Model router properly routes to custom model  

## Next Steps

After successful testing:

1. **Register a real custom model** with your actual API endpoint
2. **Use it in code generation** via `/api/codebase/chat`
3. **Monitor usage** in BEAST MODE dashboard
4. **Save money** by using custom models instead of paid providers!

---

**Ready to test?** Get your user ID and run the test script! 🚀
