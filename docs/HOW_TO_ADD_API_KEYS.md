# How to Add API Keys

## Quick Answer

**You have 2 options:**

1. **Via Script (Easiest):**
   ```bash
   node scripts/add-api-key-simple.js --user-id=YOUR_USER_ID --provider=openai --key=sk-...
   ```

2. **Via Console/UI:**
   - Navigate to: `/dashboard/settings/api-keys`
   - Or use Supabase dashboard directly

---

## 📋 What I Found

**Your User ID:** `35379b45-d966-45d7-8644-1233338c542d`

**Current Status:**
- ✅ 6 provider API keys found (but no encrypted values stored)
- ✅ 9 custom models found (but decryption failing - encryption key mismatch)

**Issue:** The API keys exist in the database but either:
- Don't have encrypted values stored (just metadata)
- Can't be decrypted (encryption key mismatch)

---

## 🔧 How to Add API Keys

### Option 1: Use the Script (Recommended)

```bash
# Add OpenAI API key
node scripts/add-api-key-simple.js \
  --user-id=35379b45-d966-45d7-8644-1233338c542d \
  --provider=openai \
  --key=sk-your-actual-openai-key

# Add Anthropic API key
node scripts/add-api-key-simple.js \
  --user-id=35379b45-d966-45d7-8644-1233338c542d \
  --provider=anthropic \
  --key=sk-ant-your-actual-anthropic-key
```

**What it does:**
- Encrypts the key
- Stores it in `user_api_keys` table
- Ready to use immediately

### Option 2: Use the UI

1. Navigate to: `http://localhost:3000/dashboard/settings/api-keys`
2. Click "Add API Key"
3. Select provider
4. Enter your key
5. Save

### Option 3: Use Supabase Console

1. Go to Supabase dashboard
2. Navigate to `user_api_keys` table
3. Insert new row:
   ```sql
   INSERT INTO user_api_keys (user_id, provider, encrypted_key, iv, auth_tag, is_active)
   VALUES (
     '35379b45-d966-45d7-8644-1233338c542d',
     'openai',
     'encrypted_value',
     'iv_value',
     'auth_tag_value',
     true
   );
   ```
4. (But you'd need to encrypt it first - easier to use the script!)

---

## 🔑 Where to Get API Keys

### OpenAI
- URL: https://platform.openai.com/api-keys
- Format: `sk-...`
- Create new key → Copy → Use in script

### Anthropic
- URL: https://console.anthropic.com/settings/keys
- Format: `sk-ant-...`
- Create new key → Copy → Use in script

### Other Providers
- Google Gemini: https://makersuite.google.com/app/apikey
- Groq: https://console.groq.com/keys
- Mistral: https://console.mistral.ai/api-keys

---

## ✅ After Adding API Keys

**Test it:**
```bash
# 1. Verify key was added
node scripts/get-user-api-keys.js --user-id=YOUR_USER_ID

# 2. Test code generation
node scripts/build-real-feature.js --user-id=YOUR_USER_ID

# 3. Check monitoring
node scripts/monitor-custom-models.js
```

---

## 💡 Quick Commands

```bash
# Get existing keys
node scripts/get-user-api-keys.js --user-id=YOUR_USER_ID

# Add new key
node scripts/add-api-key-simple.js --user-id=YOUR_USER_ID --provider=openai --key=sk-...

# Test with key
node scripts/build-real-feature.js --user-id=YOUR_USER_ID
```

---

## 🎯 Recommendation

**Use the script** - it's the easiest:
1. Get your API key from the provider
2. Run: `node scripts/add-api-key-simple.js --user-id=YOUR_USER_ID --provider=openai --key=sk-...`
3. Done! Ready to use.

**No console needed** - the script handles everything! ✨
