# AI Agent Quick Reference - BEAST MODE

**For:** Cursor bots and AI agents  
**Purpose:** Quick commands and patterns

---

## ⚡ Speed Generation (Use These!)

```bash
# Generate 5 components + APIs (< 3ms)
node scripts/beast-mode-speed-test.js

# Generate 20 features (< 5ms)
node scripts/beast-mode-batch-generate.js 20

# Generate 50 features - 150 files (< 10ms)
node scripts/beast-mode-velocity-demo.js 50
```

**Speed:** 20,000+ files/second, 80,000+ lines/second

---

## 🛠️ Quality & Self-Healing

```bash
# Check code quality
node scripts/dogfood-self-heal.js

# Check with custom threshold
node scripts/dogfood-self-heal.js --threshold=95
```

**Output:** Quality scores, issues, improvements

---

## 📋 Common Patterns

### Generate Component
```typescript
// Follow InterceptorDashboard.tsx pattern
"use client";
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import LoadingState from '../ui/LoadingState';
import { ErrorBoundary } from '../ui/ErrorBoundary';

export default function MyComponent() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const loadData = useCallback(async () => { /* ... */ }, []);
  useEffect(() => { void loadData(); }, [loadData]);
  // ... rest of component
}
```

### Generate API Route
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(url, key);
    const { data, error } = await supabase.from('table').select('*');
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
```

---

## 🔌 BEAST MODE APIs

### Codebase Chat
```javascript
POST /api/codebase/chat
{ sessionId, message, repo, useLLM }
```

### Self-Improve
```javascript
POST /api/beast-mode/self-improve
```

### Refactor
```javascript
POST /api/codebase/refactor
{ action: 'analyze', filePath, fileContent }
```

---

## 📚 Key Files

- **Components:** `website/components/beast-mode/InterceptorDashboard.tsx`
- **APIs:** `website/app/api/intercepted-commits/route.ts`
- **Scripts:** `scripts/beast-mode-speed-test.js`
- **Docs:** `docs/BEAST_MODE_FOR_AI_AGENTS.md`

---

## 🎯 Workflow

1. **Generate:** `node scripts/beast-mode-speed-test.js`
2. **Check Quality:** `node scripts/dogfood-self-heal.js`
3. **Integrate:** Add to dashboard
4. **Iterate:** Use self-healing to improve

---

**Full Guide:** `docs/BEAST_MODE_FOR_AI_AGENTS.md`
