#!/bin/bash
# Check for sensitive files in git history and working directory
# Run this before committing to public repos

set -e

echo "🔍 Checking for sensitive business files..."
echo ""

REPO_DIR="${1:-.}"
cd "$REPO_DIR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

SENSITIVE_PATTERNS=(
  "docs/*PRICING*.md"
  "docs/*MARGIN*.md"
  "docs/*COST*.md"
  "docs/INFRASTRUCTURE_COST_ANALYSIS.md"
  "docs/business/"
  "docs/*STRATEGY*.md"
  "docs/EXECUTIVE_SUMMARY*.md"
  "docs/MODEL_BUSINESS_VALUE_STRATEGY.md"
)

FOUND_IN_HISTORY=0
FOUND_IN_WORKING=0

echo "📋 Checking git history..."
for pattern in "${SENSITIVE_PATTERNS[@]}"; do
  if git log --all --full-history --oneline -- "$pattern" 2>/dev/null | grep -q .; then
    echo -e "${RED}⚠️  Found in git history: $pattern${NC}"
    git log --all --full-history --oneline -- "$pattern" 2>/dev/null | head -5
    FOUND_IN_HISTORY=1
  fi
done

echo ""
echo "📋 Checking working directory..."
for pattern in "${SENSITIVE_PATTERNS[@]}"; do
  # Expand pattern
  for file in $pattern; do
    if [ -f "$file" ] || [ -d "$file" ]; then
      if ! git check-ignore "$file" >/dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  Not in .gitignore: $file${NC}"
        FOUND_IN_WORKING=1
      fi
    fi
  done
done

echo ""
if [ $FOUND_IN_HISTORY -eq 0 ] && [ $FOUND_IN_WORKING -eq 0 ]; then
  echo -e "${GREEN}✅ No sensitive files found!${NC}"
  exit 0
elif [ $FOUND_IN_HISTORY -eq 1 ]; then
  echo -e "${RED}❌ Sensitive files found in git history!${NC}"
  echo "   Run: git filter-branch or BFG Repo-Cleaner to remove"
  exit 1
else
  echo -e "${YELLOW}⚠️  Sensitive files found but not in .gitignore${NC}"
  echo "   Add them to .gitignore before committing"
  exit 1
fi

