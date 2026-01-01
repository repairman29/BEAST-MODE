# API Keys Setup Guide
## Using Supabase user_api_keys Table

**BEAST MODE uses Supabase `user_api_keys` table for secure, encrypted storage of API keys.**

---

## 🔐 How It Works

### Storage
- API keys are stored in `user_api_keys` table in Supabase
- Keys are encrypted using **AES-256-GCM** encryption
- Format: `iv:authTag:encryptedData`
- Each user can have multiple keys for different providers

### Decryption
- Decryption happens server-side only (API routes)
- Uses `API_KEYS_ENCRYPTION_KEY` environment variable
- Utility functions in `lib/api-keys-decrypt.ts`

---

## 📋 Required Environment Variables

```bash
# Supabase Connection
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Encryption Key (for decrypting stored keys)
API_KEYS_ENCRYPTION_KEY=your-encryption-key-32-chars-minimum
```

**⚠️ Important:** The `API_KEYS_ENCRYPTION_KEY` must match the key used to encrypt the keys when they were stored.

---

## 🔧 Usage in Code

### Get a Single API Key

```typescript
import { getUserApiKey } from '@/lib/api-keys-decrypt';

// In an API route
const userId = request.cookies.get('github_oauth_user_id')?.value;
const openaiKey = await getUserApiKey(userId, 'openai');

if (openaiKey) {
  // Use the key
  const response = await fetch('https://api.openai.com/v1/...', {
    headers: {
      'Authorization': `Bearer ${openaiKey}`
    }
  });
}
```

### Get All API Keys for a User

```typescript
import { getUserApiKeys } from '@/lib/api-keys-decrypt';

const userId = request.cookies.get('github_oauth_user_id')?.value;
const keys = await getUserApiKeys(userId);

// keys = { openai: 'sk-...', anthropic: 'sk-ant-...', ... }
```

### Get Available Providers

```typescript
import { getAvailableProviders } from '@/lib/api-keys-decrypt';

const userId = request.cookies.get('github_oauth_user_id')?.value;
const providers = await getAvailableProviders(userId);

// providers = ['openai', 'anthropic', 'gemini', ...]
```

---

## 🗄️ Database Schema

### user_api_keys Table

```sql
CREATE TABLE user_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  provider TEXT NOT NULL,  -- 'openai', 'anthropic', 'gemini', etc.
  encrypted_key TEXT NOT NULL,  -- Format: iv:authTag:encryptedData
  key_name TEXT,  -- Optional: user-friendly name
  preferred_model TEXT,  -- Optional: preferred model for this provider
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, provider, key_name)
);
```

### Indexes

```sql
CREATE INDEX idx_user_api_keys_user_id ON user_api_keys(user_id);
CREATE INDEX idx_user_api_keys_provider ON user_api_keys(provider);
CREATE INDEX idx_user_api_keys_active ON user_api_keys(is_active);
```

---

## 🔒 Security

### Encryption
- **Algorithm:** AES-256-GCM
- **Key Derivation:** SHA-256 hash of `API_KEYS_ENCRYPTION_KEY`
- **Format:** `iv:authTag:encryptedData` (hex encoded)

### Access Control
- Keys are decrypted **server-side only** (never in client code)
- RLS policies ensure users can only access their own keys
- Service role key required for server-side access

### Best Practices
1. **Never** expose `API_KEYS_ENCRYPTION_KEY` in client code
2. **Never** log decrypted keys
3. **Always** use server-side API routes to access keys
4. **Rotate** encryption key periodically
5. **Monitor** key usage via `last_used_at` field

---

## 🛠️ Scripts Available

### Store Keys
- `scripts/store-porkbun-in-user-api-keys.js` - Store Porkbun credentials
- `scripts/add-porkbun-provider-and-store.js` - Add provider and store

### Retrieve Keys
- `scripts/get-porkbun-decrypted.js` - Get and decrypt Porkbun credentials
- `scripts/setup-vercel-env-from-supabase.js` - Export to Vercel env vars

### Check Keys
- `scripts/check-user-api-keys-structure.js` - Verify table structure
- `scripts/check-porkbun-in-supabase.js` - Check if keys exist

---

## 📝 Example: Using in Janitor Features

### Silent Refactoring (if using AI)

```typescript
// app/api/beast-mode/janitor/refactor/route.ts
import { getUserApiKey } from '@/lib/api-keys-decrypt';

export async function POST(request: NextRequest) {
  const userId = request.cookies.get('github_oauth_user_id')?.value;
  
  // Get OpenAI key for AI-powered refactoring
  const openaiKey = await getUserApiKey(userId, 'openai');
  
  if (!openaiKey) {
    return NextResponse.json(
      { error: 'OpenAI API key not configured' },
      { status: 400 }
    );
  }
  
  // Use the key for AI operations
  // ...
}
```

### Vibe Ops (Visual AI Testing)

```typescript
// app/api/beast-mode/janitor/vibe-ops/create-test/route.ts
import { getUserApiKey } from '@/lib/api-keys-decrypt';

export async function POST(request: NextRequest) {
  const userId = request.cookies.get('github_oauth_user_id')?.value;
  
  // Get Anthropic key for Claude (good for visual AI)
  const anthropicKey = await getUserApiKey(userId, 'anthropic');
  
  if (!anthropicKey) {
    return NextResponse.json(
      { error: 'Anthropic API key not configured' },
      { status: 400 }
    );
  }
  
  // Use the key for visual AI testing
  // ...
}
```

---

## 🚨 Troubleshooting

### "Failed to decrypt API key"
- Check that `API_KEYS_ENCRYPTION_KEY` matches the encryption key used when storing
- Verify the encrypted key format is `iv:authTag:encryptedData`

### "No key found"
- Verify the key exists in `user_api_keys` table
- Check `user_id` and `provider` match exactly
- Ensure `is_active = true`

### "Supabase not configured"
- Set `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
- Verify Supabase client can connect

---

## 📚 Related Documentation

- [Environment Setup](./ENV_SETUP.md)
- [Deployment Readiness](./DEPLOYMENT_READINESS.md)
- [Supabase Migration Guide](../supabase/migrations/README.md)

---

**Last Updated:** 2025-01-01

