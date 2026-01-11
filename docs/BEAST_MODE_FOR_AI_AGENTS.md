# BEAST MODE for AI Agents

**Purpose:** Complete guide for Cursor bots and AI agents to use BEAST MODE  
**Last Updated:** January 11, 2025  
**Status:** ✅ Active

---

## 🎯 Quick Start

As an AI agent, you can use BEAST MODE to:
1. **Generate code at extreme speeds** (20,000+ files/second)
2. **Self-heal and improve code quality** (automated quality tracking)
3. **Use existing APIs** to build features
4. **Leverage patterns** from the codebase

---

## ⚡ Speed Generation

### Generate Components Instantly

```bash
# Generate 5 components + APIs in < 3ms
node scripts/beast-mode-speed-test.js

# Generate 20 features in < 5ms
node scripts/beast-mode-batch-generate.js 20

# Generate 50 features (150 files) in < 10ms
node scripts/beast-mode-velocity-demo.js 50
```

### Use in Your Code

```javascript
const { generateComponent, generateAPIRoute } = require('./scripts/beast-mode-speed-test');

// Generate a component
const component = generateComponent({
  name: 'MyFeature',
  type: 'dashboard',
  features: ['stats', 'charts', 'filters']
});

// Generate an API route
const apiRoute = generateAPIRoute({
  name: 'MyFeature',
  type: 'dashboard'
});
```

---

## 🛠️ Self-Healing System

### Check Code Quality

```bash
# Analyze code quality
node scripts/dogfood-self-heal.js

# Check specific files
node scripts/dogfood-self-heal.js --file=path/to/file.tsx
```

### Track Improvements

The self-healing system:
- Analyzes code quality (0-100 score)
- Identifies issues (error handling, types, accessibility)
- Tracks improvements in Supabase
- Provides actionable recommendations

### Use Quality Tracking

```javascript
const { analyzeCodeQuality } = require('./scripts/dogfood-self-heal');

const analysis = analyzeCodeQuality('path/to/file.tsx');
console.log(`Quality Score: ${analysis.qualityScore}/100`);
console.log(`Issues: ${analysis.issues.length}`);
```

---

## 🔌 Using BEAST MODE APIs

### Codebase Chat API

```javascript
// Use BEAST MODE's codebase chat to generate code
const response = await fetch('http://localhost:3000/api/codebase/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sessionId: 'my-session',
    message: 'Generate a dashboard component with statistics',
    repo: 'BEAST-MODE-PRODUCT',
    useLLM: true
  })
});
```

### Self-Improve API

```javascript
// Analyze and improve code
const response = await fetch('http://localhost:3000/api/beast-mode/self-improve', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({})
});
```

### Refactoring API

```javascript
// Refactor code automatically
const response = await fetch('http://localhost:3000/api/codebase/refactor', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'analyze',
    filePath: 'path/to/file.tsx',
    fileContent: codeContent
  })
});
```

---

## 📋 Common Patterns

### Pattern 1: Generate Dashboard Component

```typescript
// Use existing dashboard patterns
import BeastModeDashboard from '@/components/beast-mode/BeastModeDashboard';
import InterceptorDashboard from '@/components/beast-mode/InterceptorDashboard';

// Follow the same structure:
// 1. useState for data/loading/error
// 2. useCallback for data loading
// 3. useMemo for filtered data
// 4. ErrorBoundary wrapper
// 5. Loading/Error states
```

### Pattern 2: Generate API Route

```typescript
// Follow API route patterns
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    // Supabase connection
    const supabase = createClient(url, key);
    
    // Query data
    const { data, error } = await supabase.from('table').select('*');
    
    // Return response
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
```

### Pattern 3: Use Existing Components

```typescript
// Reuse existing UI components
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import LoadingState from '@/components/ui/LoadingState';
import EmptyState from '@/components/ui/EmptyState';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
```

---

## 🚀 Quick Commands

### Generate Features Fast

```bash
# Speed test (5 components)
node scripts/beast-mode-speed-test.js

# Batch generate (N features)
node scripts/beast-mode-batch-generate.js 20

# Velocity demo (extreme speed)
node scripts/beast-mode-velocity-demo.js 50
```

### Quality Checks

```bash
# Self-heal analysis
node scripts/dogfood-self-heal.js

# Check specific threshold
node scripts/dogfood-self-heal.js --threshold=95
```

### Database Operations

```bash
# Apply migrations via exec_sql
node scripts/apply-intercepted-commits-migration-via-exec-sql.js

# Apply quality tracking migration
node scripts/apply-quality-tracking-migration.js
```

---

## 📚 Key Files to Know

### Components
- `website/components/beast-mode/BeastModeDashboard.tsx` - Main dashboard
- `website/components/beast-mode/InterceptorDashboard.tsx` - Interceptor dashboard
- `website/components/ui/` - Reusable UI components

### APIs
- `website/app/api/codebase/chat/route.ts` - Codebase chat API
- `website/app/api/beast-mode/self-improve/route.ts` - Self-improvement API
- `website/app/api/codebase/refactor/route.ts` - Refactoring API

### Scripts
- `scripts/beast-mode-speed-test.js` - Speed generation
- `scripts/dogfood-self-heal.js` - Quality analysis
- `scripts/build-real-feature.js` - Feature builder

### Documentation
- `docs/AI_AGENT_ONBOARDING.md` - Main onboarding
- `docs/BEAST_MODE_SPEED_BENCHMARKS.md` - Speed benchmarks
- `docs/DOGFOOD_SELF_HEALING_GUIDE.md` - Self-healing guide

---

## 💡 Best Practices

### 1. Use Existing Patterns
- Look at `InterceptorDashboard.tsx` for component patterns
- Look at `website/app/api/intercepted-commits/route.ts` for API patterns
- Reuse UI components from `website/components/ui/`

### 2. Generate Fast, Iterate Fast
- Use speed scripts to generate boilerplate
- Use self-healing to improve quality
- Iterate quickly with BEAST MODE tools

### 3. Track Quality
- Run `dogfood-self-heal.js` after generating code
- Aim for 90+ quality score
- Fix high-priority issues first

### 4. Use BEAST MODE APIs
- Leverage codebase chat for code generation
- Use self-improve API for analysis
- Use refactoring API for improvements

---

## 🎯 Example Workflow

### Generate a New Dashboard Feature

```bash
# Step 1: Generate component + API (fast)
node scripts/beast-mode-speed-test.js

# Step 2: Check quality
node scripts/dogfood-self-heal.js

# Step 3: Integrate into BeastModeDashboard
# Add to Sidebar.tsx
# Add to BeastModeDashboard.tsx

# Step 4: Test and iterate
npm run dev
```

### Self-Improve Existing Code

```bash
# Step 1: Analyze
node scripts/dogfood-self-heal.js

# Step 2: Review issues
# Fix high-priority issues

# Step 3: Re-analyze
node scripts/dogfood-self-heal.js

# Step 4: Track in Supabase
# Quality scores automatically tracked
```

---

## 🔗 Integration Points

### With Oracle
- Oracle can query intercepted commits
- Oracle can provide commit safety context
- See `lib/oracle/interceptor-integration.js`

### With Interceptor
- Pre-commit hooks check code quality
- Intercepted data stored in Supabase
- Accessible via API endpoints

### With Supabase
- Quality tracking in `quality_tracking` table
- Intercepted commits in `intercepted_commits` table
- Use `exec_sql` RPC for migrations

---

## 📊 Performance Expectations

### Generation Speed
- **Components:** 2,000+ per second
- **API Routes:** 2,000+ per second
- **Lines of Code:** 80,000+ per second
- **Files:** 20,000+ per second

### Quality Standards
- **Target Score:** 90+/100
- **Type Safety:** 80%+
- **Error Handling:** All async operations
- **Accessibility:** ARIA labels on interactive elements

---

## 🆘 Troubleshooting

### Speed Scripts Not Working
- Check Node.js version (v18+)
- Ensure you're in BEAST-MODE-PRODUCT directory
- Check file permissions (`chmod +x scripts/*.js`)

### Quality Analysis Failing
- Check Supabase credentials in `.env.local`
- Ensure `quality_tracking` table exists
- Run migration: `node scripts/apply-quality-tracking-migration.js`

### APIs Not Responding
- Check if dev server is running (`npm run dev`)
- Verify API endpoints exist
- Check authentication/authorization

---

## 📖 Additional Resources

- **Main Onboarding:** `docs/AI_AGENT_ONBOARDING.md`
- **Speed Benchmarks:** `docs/BEAST_MODE_SPEED_BENCHMARKS.md`
- **Self-Healing Guide:** `docs/DOGFOOD_SELF_HEALING_GUIDE.md`
- **Interceptor Guide:** `docs/BRAND_REPUTATION_INTERCEPTOR_GUIDE.md`

---

## 🎓 Learning Path

1. **Start Here:** Read this guide
2. **Try Speed Generation:** Run `beast-mode-speed-test.js`
3. **Try Self-Healing:** Run `dogfood-self-heal.js`
4. **Build a Feature:** Generate component + API
5. **Integrate:** Add to dashboard
6. **Iterate:** Use self-healing to improve

---

**Last Updated:** January 11, 2025  
**For Questions:** Check `docs/AI_AGENT_ONBOARDING.md` or existing code patterns
