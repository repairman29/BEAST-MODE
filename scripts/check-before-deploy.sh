#!/bin/bash

# Pre-Deployment Check Script
# Run this before deploying to catch common issues

set -e

echo "🔍 Running Pre-Deployment Checks..."
echo ""

cd "$(dirname "$0")/../website" || exit 1

# Check 1: TypeScript compilation
echo "✅ Checking TypeScript compilation..."
if npx tsc --noEmit; then
  echo "   ✓ TypeScript: OK"
else
  echo "   ❌ TypeScript: ERRORS FOUND"
  exit 1
fi

# Check 2: Build locally
echo "✅ Running local build..."
if npm run build > /tmp/build.log 2>&1; then
  echo "   ✓ Build: OK"
else
  echo "   ❌ Build: FAILED"
  echo "   Check /tmp/build.log for details"
  exit 1
fi

# Check 3: Find @/ imports in API routes (should use relative paths)
echo "✅ Checking for @/ imports in API routes..."
if grep -r "@/lib" app/api --include="*.ts" --include="*.tsx" > /dev/null 2>&1; then
  echo "   ⚠️  Found @/ imports - these may cause issues on Vercel"
  echo "   Files with @/ imports:"
  grep -r "@/lib" app/api --include="*.ts" --include="*.tsx" -l
else
  echo "   ✓ No @/ imports found"
fi

# Check 4: Check for common syntax issues
echo "✅ Checking for common syntax issues..."

# Check for unclosed braces in route files
route_files=$(find app/api -name "route.ts" -type f)
issues_found=0

for file in $route_files; do
  opens=$(grep -o '{' "$file" | wc -l | tr -d ' ')
  closes=$(grep -o '}' "$file" | wc -l | tr -d ' ')
  
  if [ "$opens" != "$closes" ]; then
    echo "   ⚠️  Brace mismatch in $file (opens: $opens, closes: $closes)"
    issues_found=$((issues_found + 1))
  fi
done

if [ $issues_found -eq 0 ]; then
  echo "   ✓ All braces match"
else
  echo "   ❌ Found $issues_found file(s) with brace mismatches"
fi

# Check 5: Verify dependencies are in package.json
echo "✅ Checking critical dependencies..."
required_deps=("@tailwindcss/postcss" "autoprefixer" "typescript")
missing_deps=()

for dep in "${required_deps[@]}"; do
  if ! grep -q "\"$dep\"" package.json; then
    missing_deps+=("$dep")
  fi
done

if [ ${#missing_deps[@]} -eq 0 ]; then
  echo "   ✓ All critical dependencies found"
else
  echo "   ⚠️  Missing dependencies: ${missing_deps[*]}"
  echo "   Make sure they're in 'dependencies' not 'devDependencies'"
fi

echo ""
echo "✨ Pre-deployment checks complete!"
echo ""
echo "If all checks passed, you're ready to deploy:"
echo "  cd website && vercel --prod --yes"

