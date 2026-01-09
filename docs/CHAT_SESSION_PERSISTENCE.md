# Chat Session Persistence - Recovery Guide

**Date:** January 18, 2026  
**Status:** ✅ **Implemented**

---

## 🎯 Problem Solved

Chat sessions were stored **in-memory only** (`Map`), causing **complete data loss** on server crashes or restarts.

---

## ✅ Solution Implemented

### 1. **Database Migration Created**
- **File:** `supabase/migrations/20250118000000_create_codebase_chat_sessions.sql`
- **Table:** `codebase_chat_sessions`
- **Features:**
  - Stores conversation history (JSONB)
  - Stores context cache (JSONB)
  - Tracks repo, current file, user ID
  - Row Level Security (RLS) enabled
  - Indexes for performance

### 2. **Codebase Chat Updated**
- **File:** `lib/mlops/codebaseChat.js`
- **Changes:**
  - ✅ Loads sessions from database on first access
  - ✅ Saves sessions to database (debounced, 500ms)
  - ✅ Maintains in-memory cache for performance
  - ✅ Graceful fallback if database unavailable

### 3. **API Route Updated**
- **File:** `website/app/api/codebase/chat/route.ts`
- **Changes:**
  - ✅ All `getHistory()` calls are now async
  - ✅ All `clearHistory()` calls are now async

---

## 🚀 Setup Instructions

### Step 1: Apply Database Migration

**Option A: Via Supabase Dashboard**
1. Go to Supabase Dashboard → SQL Editor
2. Open `BEAST-MODE-PRODUCT/supabase/migrations/20250118000000_create_codebase_chat_sessions.sql`
3. Copy entire contents
4. Paste into SQL Editor
5. Click **Run**

**Option B: Via Supabase CLI**
```bash
cd BEAST-MODE-PRODUCT
supabase db push
```

### Step 2: Verify Migration

Check that the table exists:
```sql
SELECT * FROM codebase_chat_sessions LIMIT 1;
```

---

## 📊 How It Works

### Session Lifecycle

1. **First Message:**
   - Check in-memory cache → Not found
   - Load from database → Not found
   - Create new session in memory
   - Save to database (debounced)

2. **Subsequent Messages:**
   - Check in-memory cache → Found
   - Use cached history
   - Save to database (debounced)

3. **After Server Restart:**
   - Check in-memory cache → Not found (server restarted)
   - Load from database → Found ✅
   - Restore session to memory
   - Continue conversation seamlessly

### Performance

- **In-Memory Cache:** Fast access (no DB query)
- **Database Persistence:** Debounced saves (500ms) to reduce DB writes
- **Lazy Loading:** Sessions loaded from DB only when needed
- **Graceful Degradation:** Works even if database unavailable (in-memory only)

---

## 🔄 Recovery Process

### Automatic Recovery

Sessions are **automatically recovered** when:
- Server restarts
- User opens chat with existing `sessionId`
- API calls `getHistory(sessionId)`

### Manual Recovery

If you need to recover a specific session:

```javascript
const codebaseChat = require('./lib/mlops/codebaseChat');
const session = await codebaseChat.loadSessionFromDB('your-session-id');
console.log('Recovered session:', session);
```

### List All Sessions

```sql
SELECT 
  session_id,
  user_id,
  repo,
  last_activity,
  jsonb_array_length(conversation_history) as message_count
FROM codebase_chat_sessions
ORDER BY last_activity DESC
LIMIT 50;
```

---

## 🛡️ Data Safety

### What's Protected

✅ **Conversation History** - All messages preserved  
✅ **Context Cache** - Codebase context preserved  
✅ **Session Metadata** - Repo, file, user ID preserved

### What's Not Recoverable

❌ **Sessions lost before migration** - Only new sessions are persisted  
❌ **In-memory-only sessions** - If DB was unavailable when session was created

---

## 📝 API Changes

### Before (Synchronous)
```javascript
const history = codebaseChat.getHistory(sessionId);
codebaseChat.clearHistory(sessionId);
```

### After (Asynchronous)
```javascript
const history = await codebaseChat.getHistory(sessionId);
await codebaseChat.clearHistory(sessionId);
```

---

## 🔍 Monitoring

### Check Session Count
```sql
SELECT COUNT(*) FROM codebase_chat_sessions;
```

### Check Recent Activity
```sql
SELECT 
  session_id,
  last_activity,
  jsonb_array_length(conversation_history) as messages
FROM codebase_chat_sessions
WHERE last_activity > NOW() - INTERVAL '24 hours'
ORDER BY last_activity DESC;
```

### Check Database Size
```sql
SELECT 
  pg_size_pretty(pg_total_relation_size('codebase_chat_sessions')) as table_size;
```

---

## 🐛 Troubleshooting

### Sessions Not Persisting

1. **Check Supabase Connection:**
   ```javascript
   const { getSupabaseClient } = require('./website/lib/supabase');
   const supabase = await getSupabaseClient();
   console.log('Supabase connected:', !!supabase);
   ```

2. **Check Table Exists:**
   ```sql
   SELECT EXISTS (
     SELECT FROM information_schema.tables 
     WHERE table_name = 'codebase_chat_sessions'
   );
   ```

3. **Check RLS Policies:**
   ```sql
   SELECT * FROM pg_policies 
   WHERE tablename = 'codebase_chat_sessions';
   ```

### Sessions Not Loading

1. **Check Session ID Format:**
   - Should match: `chat-{timestamp}-{random}`
   - Example: `chat-1705622400000-abc123xyz`

2. **Check Database Logs:**
   - Look for errors in Supabase logs
   - Check for RLS policy violations

---

## 📚 Related Files

- **Migration:** `supabase/migrations/20250118000000_create_codebase_chat_sessions.sql`
- **Chat Service:** `lib/mlops/codebaseChat.js`
- **API Route:** `website/app/api/codebase/chat/route.ts`

---

## ✅ Status

- ✅ Database migration created
- ✅ Codebase chat updated with persistence
- ✅ API routes updated for async operations
- ✅ Automatic recovery on server restart
- ✅ Graceful degradation if DB unavailable

**Next Steps:**
1. Apply migration to Supabase
2. Test session recovery after server restart
3. Monitor database for session growth
