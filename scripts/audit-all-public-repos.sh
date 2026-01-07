#!/bin/bash
# Audit all public repositories for sensitive files
# Checks git history and working directory

set -e

echo "🔍 AUDITING ALL PUBLIC REPOSITORIES"
echo "===================================="
echo ""

REPO_DIRS=(
  "BEAST-MODE-PRODUCT"
  "echeo-landing"
  "payload-cli"
)

TOTAL_FOUND=0
TOTAL_PROTECTED=0

for repo_dir in "${REPO_DIRS[@]}"; do
  if [ ! -d "$repo_dir" ]; then
    continue
  fi

  echo "📁 Checking: $repo_dir"
  echo "-----------------------------------"
  
  cd "$repo_dir" || continue

  # Check git remote
  REMOTE=$(git remote get-url origin 2>/dev/null | sed 's|.*github.com[:/]||' | sed 's|\.git$||' || echo "unknown")
  echo "   Remote: $REMOTE"

  # Check if sensitive files exist
  SENSITIVE_COUNT=0
  if [ -f "docs/PRICING_90_PERCENT_MARGIN_STRATEGY.md" ] || \
     [ -f "docs/PRICING_MODEL_DESIGN.md" ] || \
     [ -f "docs/MARGIN_OPTIMIZATION_PLAN.md" ]; then
    SENSITIVE_COUNT=$(find docs -name "*PRICING*" -o -name "*MARGIN*" -o -name "*COST*" 2>/dev/null | wc -l | tr -d ' ')
  fi

  # Check .gitignore
  if grep -q "PRICING\|MARGIN\|COST" .gitignore 2>/dev/null; then
    PROTECTED="✅ Protected"
    TOTAL_PROTECTED=$((TOTAL_PROTECTED + 1))
  else
    PROTECTED="⚠️  Not Protected"
  fi

  # Check git history
  HISTORY_COUNT=$(git log --all --full-history --oneline -- "docs/*PRICING*.md" "docs/*MARGIN*.md" "docs/*COST*.md" 2>/dev/null | wc -l | tr -d ' ')

  echo "   Sensitive files: $SENSITIVE_COUNT"
  echo "   Protection: $PROTECTED"
  echo "   In history: $HISTORY_COUNT commits"
  
  if [ "$HISTORY_COUNT" -gt 0 ]; then
    TOTAL_FOUND=$((TOTAL_FOUND + 1))
    echo "   ⚠️  ACTION NEEDED: Clean history"
  fi

  echo ""
  cd ..
done

echo "📊 SUMMARY"
echo "=========="
echo "Repos checked: ${#REPO_DIRS[@]}"
echo "Protected: $TOTAL_PROTECTED"
echo "Need history cleanup: $TOTAL_FOUND"
echo ""

