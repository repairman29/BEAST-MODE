#!/bin/bash
# Untrack sensitive files that are already in git
# This allows .gitignore to work on them

set -e

echo "🗑️  Untracking sensitive files from git..."
echo ""

SENSITIVE_FILES=(
  "docs/PRICING_90_PERCENT_MARGIN_STRATEGY.md"
  "docs/PRICING_MODEL_DESIGN.md"
  "docs/PRICING_STRATEGY_REVIEW.md"
  "docs/COMPETITIVE_PRICING_ANALYSIS.md"
  "docs/INFRASTRUCTURE_COST_ANALYSIS.md"
  "docs/MODEL_BUSINESS_VALUE_STRATEGY.md"
  "docs/EXECUTIVE_SUMMARY_XGBOOST.md"
  "docs/NPM_PACKAGING_LICENSING_STRATEGY.md"
)

for file in "${SENSITIVE_FILES[@]}"; do
  if git ls-files --error-unmatch "$file" >/dev/null 2>&1; then
    echo "Untracking: $file"
    git rm --cached "$file" 2>/dev/null || true
  fi
done

echo ""
echo "✅ Done! Files are now untracked and .gitignore will work."
echo "⚠️  Note: Files still exist locally, just not tracked by git."
