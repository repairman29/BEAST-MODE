# Chat Sessions - Quick Setup Guide

**Status:** ✅ SQL Migration Ready  
**Action Required:** Apply migration to Supabase

---

## 🚀 Quick Setup (2 minutes)

### Step 1: Open Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** (left sidebar)
3. Click **New Query**

### Step 2: Paste & Run

The SQL is already copied to your clipboard! Just:

1. **Paste** (Cmd+V / Ctrl+V) into the SQL Editor
2. Click **Run** (or press Cmd+Enter / Ctrl+Enter)
3. Wait for "Success" message

### Step 3: Verify

Run this query to verify the table was created:

```sql
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'codebase_chat_sessions'
ORDER BY ordinal_position;
```

You should see columns like: `id`, `session_id`, `user_id`, `conversation_history`, etc.

---

## ✅ What This Does

- ✅ Creates `codebase_chat_sessions` table
- ✅ Stores all chat conversations in database
- ✅ Automatically recovers sessions after server restart
- ✅ Prevents data loss on crashes

---

## 🧪 Test It

After applying the migration:

1. **Start a chat session** in your app
2. **Send a few messages**
3. **Restart your server**
4. **Reopen the same chat** - it should recover automatically! 🎉

---

## 📚 More Info

See `docs/CHAT_SESSION_PERSISTENCE.md` for:
- How it works
- Monitoring queries
- Troubleshooting
- API changes

---

## 🆘 Need Help?

If the migration fails:

1. Check for error messages in Supabase
2. Make sure you have the right permissions
3. Try running sections of the SQL separately
4. Check the migration file: `supabase/migrations/20250118000000_create_codebase_chat_sessions.sql`
