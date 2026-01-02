# Quick Fix Cheat Sheet 🚀

## Before Every Deployment

```bash
cd website
npm run build        # Test build locally first!
git status           # Make sure everything is committed
git push origin main # Push your changes
vercel --prod --yes  # Deploy
```

---

## Common Errors → Quick Fixes

### ❌ Error: `Module not found: Can't resolve '@/lib/supabase'`

**Fix:** Replace `@/` with relative path

```typescript
// ❌ BEFORE
import { getSupabaseClient } from '@/lib/supabase';

// ✅ AFTER  
import { getSupabaseClient } from '../../../../lib/supabase';
```

**Find all:** `grep -r "@/lib" website/app/api`

---

### ❌ Error: `cannot reassign to an imported binding`

**Fix:** Remove static import, use dynamic require

```typescript
// ❌ BEFORE
import { withProductionIntegration } from '../../lib/api-middleware';
let withProductionIntegration = null; // ERROR!

// ✅ AFTER
let withProductionIntegration: any = null;
try {
  const middleware = require('../../lib/api-middleware');
  withProductionIntegration = middleware.withProductionIntegration;
} catch (error) {
  // Module not available - that's OK
}
```

---

### ❌ Error: `Expression expected` or `Expected a semicolon`

**Fix:** Check for missing braces `}`

```typescript
// ❌ BEFORE - Missing closing brace
async function handler(req: NextRequest) {
  try {
    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    return NextResponse.json({ error: 'failed' });
  }
// Missing } here!

// ✅ AFTER - All braces closed
async function handler(req: NextRequest) {
  try {
    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    return NextResponse.json({ error: 'failed' });
  }
} // ✅ Closing brace added
```

**Quick check:** Count braces match
```bash
grep -o '{' file.ts | wc -l  # Should equal
grep -o '}' file.ts | wc -l  # this number
```

---

### ❌ Error: `Cannot find module '@tailwindcss/postcss'`

**Fix:** Move from `devDependencies` to `dependencies`

```json
// package.json
{
  "dependencies": {  // ✅ Put it here
    "@tailwindcss/postcss": "^0.0.x",
    "autoprefixer": "^10.x.x"
  },
  "devDependencies": {  // ❌ Not here
    // ...
  }
}
```

---

## File Structure Template

Use this template for new API routes:

```typescript
import { NextRequest, NextResponse } from 'next/server';

async function handler(req: NextRequest) {
  try {
    // Optional module loading
    let optionalModule: any = null;
    try {
      optionalModule = require('../../lib/optional-module');
    } catch (error) {
      // Module not available - that's OK
    }

    if (req.method === 'GET') {
      return NextResponse.json({ status: 'ok' });
    }

    if (req.method === 'POST') {
      const body = await req.json();
      return NextResponse.json({ status: 'ok', data: body });
    }

    return NextResponse.json(
      { error: 'Method not allowed' },
      { status: 405 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return handler(req);
}

export async function POST(req: NextRequest) {
  return handler(req);
}
```

---

## Debugging Workflow

```
1. Read the error message
   ↓
2. Find the file and line number
   ↓
3. Open the file and check that line
   ↓
4. Look for:
   - Missing } or {
   - Missing semicolon ;
   - Unclosed try-catch
   - Wrong import path
   ↓
5. Fix it
   ↓
6. Test locally: npm run build
   ↓
7. Commit and push
   ↓
8. Deploy: vercel --prod --yes
```

---

## Quick Commands

```bash
# Check TypeScript errors
cd website && npx tsc --noEmit

# Build locally
cd website && npm run build

# Find all @/ imports
grep -r "@/lib" website/app/api

# Count braces in a file
file="website/app/api/ml/predict/route.ts"
echo "Opens: $(grep -o '{' "$file" | wc -l)"
echo "Closes: $(grep -o '}' "$file" | wc -l)"

# Check git status
git status

# See what changed
git diff

# Commit and push
git add -A
git commit -m "fix: Description"
git push origin main
```

---

## Checklist Before Deploying

- [ ] `npm run build` works locally
- [ ] `npx tsc --noEmit` shows no errors  
- [ ] All changes committed (`git status` is clean)
- [ ] No `@/` imports in API routes
- [ ] All optional modules use `require()` not `import`
- [ ] All braces `{}` match
- [ ] All try-catch blocks closed

---

## Still Stuck?

1. **Check the exact error** - Vercel shows file + line number
2. **Read that line** - Look for syntax issues
3. **Compare with working file** - Use similar route as template
4. **Test locally first** - `npm run build` catches most issues
5. **Clear Vercel cache** - Sometimes old errors stick around

---

## Pro Tips 💡

- **Use bracket matching in your editor** - Highlights matching braces
- **Build locally first** - Saves time vs waiting for Vercel
- **One fix at a time** - Don't try to fix everything at once
- **Commit after each fix** - Easy to revert if needed
- **Use the check script** - `./scripts/check-before-deploy.sh`

