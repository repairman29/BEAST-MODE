# Supabase Service Role Key Guide

## 🔑 What is the Service Role Key?

The **Service Role Key** (`sb_secret_...` or `eyJ...`) is a special Supabase API key that:

- **Bypasses Row Level Security (RLS)** - Has full database access
- **Server-side only** - Should NEVER be exposed to clients
- **Admin privileges** - Can read/write any table regardless of RLS policies

## 📍 Where to Find It in Supabase

1. **Go to Supabase Dashboard:**
   - https://supabase.com/dashboard
   - Select your project

2. **Navigate to Settings:**
   - Click **Settings** (gear icon) in the left sidebar
   - Click **API** under Project Settings

3. **Find the Service Role Key:**
   - Look for **"service_role"** key (NOT "anon" key)
   - It will be labeled as **"service_role" secret"**
   - Starts with `sb_secret_` or `eyJ...` (JWT format)
   - **⚠️ Keep this secret!** Never commit it to git

## 🔧 How It's Used in BEAST MODE

### 1. **API Routes** (Server-side)
```typescript
// website/app/api/stripe/webhook/route.ts
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);
```

**Why:** Webhooks don't have user context, so they need service role to access database.

### 2. **Credit System**
```typescript
// website/app/api/credits/balance/route.ts
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
```

**Why:** Server-side operations need to bypass RLS to read user credit balances.

### 3. **ML Operations**
```typescript
// lib/mlops/databaseWriter.js
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
```

**Why:** Background jobs and ML operations need full database access.

### 4. **Migrations & Scripts**
```typescript
// scripts/apply-credit-migration-via-exec-sql.js
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
```

**Why:** Database migrations need admin privileges.

## ⚠️ Security Notes

1. **Never expose to clients:**
   - ❌ Don't use in `NEXT_PUBLIC_*` environment variables
   - ❌ Don't include in client-side code
   - ✅ Only use in server-side API routes and scripts

2. **Environment Variables:**
   ```bash
   # .env.local (local development)
   SUPABASE_SERVICE_ROLE_KEY=sb_secret_...

   # Vercel (production)
   # Add via: vercel env add SUPABASE_SERVICE_ROLE_KEY
   ```

3. **Different from Anon Key:**
   - **Anon Key** (`NEXT_PUBLIC_SUPABASE_ANON_KEY`): Client-side, respects RLS
   - **Service Role Key** (`SUPABASE_SERVICE_ROLE_KEY`): Server-side, bypasses RLS

## 🔍 Current Usage in Codebase

The service role key is used in:

- ✅ **API Routes:** `/api/stripe/webhook`, `/api/github/webhook`, `/api/credits/*`, `/api/user/*`
- ✅ **ML Operations:** `databaseWriter.js`, `feedbackCollector.js`, `dataIntegration.js`
- ✅ **Scripts:** Migration scripts, monitoring scripts, data collection scripts
- ✅ **Background Jobs:** Training data extraction, feedback collection

## 📋 Verification

To verify your service role key is set:

```bash
# Check environment variable
grep SUPABASE_SERVICE_ROLE_KEY website/.env.local

# Test connection
node -e "
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
supabase.from('user_subscriptions').select('count').then(console.log);
"
```

## 🚨 If You Don't See It in Supabase

1. **Check you're in the right project**
2. **Check Settings > API** (not just the main dashboard)
3. **Look for "service_role"** (not "anon" or "public")
4. **If missing, you may need to:**
   - Regenerate API keys in Supabase
   - Or contact Supabase support

## 🔄 Regenerating the Key

If you need to regenerate:

1. Go to **Settings > API**
2. Click **"Reset service_role key"** (or similar)
3. **⚠️ Update all environment variables immediately:**
   - `.env.local` (local)
   - Vercel environment variables (production)
   - Any other deployment environments

