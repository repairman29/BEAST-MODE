# Vercel Deployment Debugging Guide

## Quick Reference: Common Build Errors & Fixes

### 1. **Module Not Found Errors**

**Error:**
```
Module not found: Can't resolve '@/lib/supabase'
```

**Fix:**
- Replace TypeScript path aliases (`@/lib/`) with relative paths
- Example: `@/lib/supabase` → `../../../../lib/supabase`
- Check `tsconfig.json` to see if path aliases are configured correctly

**How to find all instances:**
```bash
# Find all @/ imports
grep -r "@/lib" website/app/api --include="*.ts" --include="*.tsx"

# Find all @/ imports in components
grep -r "@/lib" website/components --include="*.ts" --include="*.tsx"
```

**Automated fix:**
```bash
# Use find and replace (be careful!)
find website/app/api -name "*.ts" -type f -exec sed -i '' 's|@/lib/supabase|../../../../lib/supabase|g' {} \;
```

---

### 2. **Syntax Errors: Missing Braces/Semicolons**

**Error:**
```
Expression expected
Expected a semicolon
```

**How to debug:**

1. **Check the file structure:**
```bash
# Count opening and closing braces
grep -o '{' website/app/api/ml/predict/route.ts | wc -l
grep -o '}' website/app/api/ml/predict/route.ts | wc -l
# These should match!
```

2. **Use TypeScript compiler locally:**
```bash
cd website
npx tsc --noEmit
# This will show syntax errors before deploying
```

3. **Check for common issues:**
   - Missing closing braces `}`
   - Missing semicolons after function declarations
   - Unclosed try-catch blocks
   - Missing return statements

**Visual inspection checklist:**
- [ ] Every `{` has a matching `}`
- [ ] Every `try {` has a matching `catch` and `}`
- [ ] Every `async function` has a closing `}`
- [ ] Every `export async function` is properly closed

---

### 3. **"Cannot reassign to an imported binding"**

**Error:**
```
cannot reassign to an imported binding
```

**Problem:**
You're trying to reassign a value that was imported:
```typescript
// ❌ WRONG
import { withProductionIntegration } from '../../lib/api-middleware';
let withProductionIntegration = null; // Error!

// ✅ CORRECT
let withProductionIntegration: any = null;
try {
  const middleware = require('../../lib/api-middleware');
  withProductionIntegration = middleware.withProductionIntegration;
} catch (error) {
  // Handle missing module
}
```

**Fix:**
Remove the static import and use dynamic `require()` instead.

---

### 4. **Missing Dependencies in Production**

**Error:**
```
Cannot find module '@tailwindcss/postcss'
Cannot find module 'autoprefixer'
```

**Fix:**
Move packages from `devDependencies` to `dependencies` in `package.json`:

```json
{
  "dependencies": {
    "@tailwindcss/postcss": "^0.0.x",
    "autoprefixer": "^10.x.x",
    "typescript": "^5.x.x"
  }
}
```

**Why?** Vercel only installs `dependencies` in production builds, not `devDependencies`.

---

### 5. **Dynamic Import Warnings**

**Warning:**
```
Critical dependency: the request of a dependency is an expression
```

**This is usually OK** - it's just a webpack warning about dynamic imports. You can suppress it:

```typescript
// Add webpack ignore comment
const module = await import(/* webpackIgnore: true */ `../../lib/${moduleName}`);
```

---

## Step-by-Step Debugging Process

### Step 1: Reproduce Locally

**Before deploying, test locally:**

```bash
cd website

# Install dependencies
npm install

# Run type checking
npx tsc --noEmit

# Run build locally
npm run build

# If build succeeds locally, it should work on Vercel
```

### Step 2: Check Git Status

**Make sure all changes are committed:**

```bash
cd /Users/jeffadkins/Smugglers/BEAST-MODE-PRODUCT

# Check what's changed
git status

# See the actual changes
git diff

# If you see uncommitted changes, commit them
git add -A
git commit -m "fix: Description of fix"
git push origin main
```

### Step 3: Verify File Structure

**Check for syntax errors in specific files:**

```bash
# Check a specific file
npx tsc --noEmit website/app/api/ml/predict/route.ts

# Or check all TypeScript files
npx tsc --noEmit
```

### Step 4: Clear Vercel Cache

**If build keeps failing with old errors:**

1. **Via Vercel Dashboard:**
   - Go to your project → Settings → General
   - Look for "Clear Build Cache" button
   - Or redeploy with "Clear Cache" option

2. **Via Vercel CLI:**
```bash
# Remove .vercel cache
rm -rf website/.vercel

# Redeploy
cd website
vercel --prod --yes
```

### Step 5: Check Build Logs

**Get detailed error information:**

```bash
# View latest deployment logs
cd website
vercel logs [deployment-url]

# Or use the inspect URL from deployment output
# Example: vercel inspect https://beast-mode-website-xxx.vercel.app
```

---

## Common File Patterns to Check

### Pattern 1: API Route Handler

**Correct structure:**
```typescript
import { NextRequest, NextResponse } from 'next/server';

async function handler(req: NextRequest) {
  try {
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

**Common mistakes:**
- ❌ Missing closing brace for handler function
- ❌ Missing return statement in GET/POST exports
- ❌ Unclosed try-catch block

### Pattern 2: Optional Module Loading

**Correct pattern:**
```typescript
// ✅ CORRECT: Dynamic require with try-catch
let optionalModule: any = null;
try {
  const path = require('path');
  const modulePath = path.join(process.cwd(), '../../lib/optional-module');
  optionalModule = require(modulePath);
} catch (error) {
  // Module not available - that's OK
  console.debug('Optional module not available');
}

// Use it safely
if (optionalModule) {
  // Use the module
}
```

**Wrong patterns:**
```typescript
// ❌ WRONG: Static import that might not exist
import { optionalModule } from '../../lib/optional-module';

// ❌ WRONG: Reassigning imported binding
import { withProductionIntegration } from '../../lib/middleware';
let withProductionIntegration = null; // Error!
```

---

## Quick Fix Commands

### Find All Problematic Imports

```bash
# Find all @/ imports that need fixing
grep -rn "@/lib" website/app/api --include="*.ts" --include="*.tsx"

# Find all static imports of optional modules
grep -rn "import.*withProductionIntegration" website/app/api --include="*.ts"
```

### Verify All Route Files

```bash
# Check all route files for syntax errors
find website/app/api -name "route.ts" -exec npx tsc --noEmit {} \;
```

### Count Braces (Quick Syntax Check)

```bash
# Check if braces match in a file
file="website/app/api/ml/predict/route.ts"
opens=$(grep -o '{' "$file" | wc -l | tr -d ' ')
closes=$(grep -o '}' "$file" | wc -l | tr -d ' ')
echo "Opens: $opens, Closes: $closes"
# Should be equal!
```

---

## Deployment Checklist

Before deploying, verify:

- [ ] `npm run build` succeeds locally
- [ ] `npx tsc --noEmit` shows no errors
- [ ] All changes are committed and pushed
- [ ] No `@/` path aliases in API routes (use relative paths)
- [ ] All optional modules use dynamic `require()` not static `import`
- [ ] All try-catch blocks are properly closed
- [ ] All functions have closing braces
- [ ] Required packages are in `dependencies` not `devDependencies`

---

## Getting Help

If you're stuck:

1. **Check the exact error message** - Vercel shows the file and line number
2. **Read the file at that line** - Look for missing braces, semicolons, etc.
3. **Compare with a working file** - Use a similar route file as a template
4. **Test locally first** - `npm run build` should catch most issues
5. **Check git diff** - Make sure your changes are what you expect

---

## Example: Fixing a Broken Route File

Let's say you have this error:
```
./app/api/ml/predict/route.ts:65:1
Expression expected
```

**Step 1:** Read the file around line 65
```bash
sed -n '60,70p' website/app/api/ml/predict/route.ts
```

**Step 2:** Look for:
- Missing closing brace `}`
- Missing semicolon `;`
- Unclosed string or template literal
- Missing return statement

**Step 3:** Fix it and verify:
```bash
npx tsc --noEmit website/app/api/ml/predict/route.ts
```

**Step 4:** Test build:
```bash
cd website && npm run build
```

**Step 5:** Commit and deploy:
```bash
git add website/app/api/ml/predict/route.ts
git commit -m "fix: Fix syntax error in predict route"
git push origin main
cd website && vercel --prod --yes
```

---

## Pro Tips

1. **Use your IDE's bracket matching** - Most editors highlight matching braces
2. **Use Prettier/ESLint** - They catch many syntax issues
3. **Build locally first** - Saves time vs waiting for Vercel
4. **One fix at a time** - Don't try to fix everything at once
5. **Use git commits** - Commit after each fix so you can revert if needed

---

## Resources

- [Next.js API Routes Docs](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [TypeScript Error Messages](https://www.typescriptlang.org/docs/handbook/error-messages.html)
- [Vercel Build Logs](https://vercel.com/docs/concepts/deployments/build-logs)

