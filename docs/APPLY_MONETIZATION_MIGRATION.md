# Apply Monetization Migration

**Quick Guide:** Apply the monetization database schema

---

## Option 1: Supabase Dashboard (Recommended)

1. Go to: https://supabase.com/dashboard/project/rbfzlqmkwhbvrrfdcain
2. Click **"SQL Editor"** in the left sidebar
3. Click **"New query"**
4. Copy the contents of: `supabase/migrations/20250110000001_create_user_subscriptions_table.sql`
5. Paste into the SQL Editor
6. Click **"Run"**
7. Verify success message

---

## Option 2: Supabase CLI

```bash
cd BEAST-MODE-PRODUCT

# Apply just the monetization migration
supabase db push --include-all --yes
```

**Note:** If you get trigger conflicts, you can:
1. Skip the conflicting migration temporarily
2. Apply monetization migration directly via Dashboard
3. Then apply other migrations

---

## Option 3: Direct SQL Execution

If you have direct database access:

```bash
# Connect to Supabase database
psql "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"

# Then run the migration SQL
\i supabase/migrations/20250110000001_create_user_subscriptions_table.sql
```

---

## Verify Migration

After applying, verify tables exist:

```sql
-- Check tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_subscriptions', 'user_usage', 'github_installations');

-- Check functions
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('get_or_create_user_subscription', 'get_or_create_user_usage');
```

---

## Test After Migration

```bash
node scripts/test-monetization-with-supabase.js
```

Should show:
- ✅ All tables exist
- ✅ Subscription creation works
- ✅ Rate limiting works
- ✅ Usage tracking works

---

**Quick Link:** https://supabase.com/dashboard/project/rbfzlqmkwhbvrrfdcain/editor
