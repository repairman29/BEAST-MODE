#!/bin/bash
# Remove sensitive files from git history
# WARNING: This rewrites git history. Use with caution!

set -e

echo "⚠️  WARNING: This will rewrite git history!"
echo "   Make sure you have a backup and coordinate with your team."
echo ""
read -p "Continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
  echo "Aborted."
  exit 1
fi

REPO_DIR="${1:-.}"
cd "$REPO_DIR"

SENSITIVE_FILES=(
  "docs/PRICING_90_PERCENT_MARGIN_STRATEGY.md"
  "docs/PRICING_MODEL_DESIGN.md"
  "docs/PRICING_STRATEGY_REVIEW.md"
  "docs/COMPETITIVE_PRICING_ANALYSIS.md"
  "docs/INFRASTRUCTURE_COST_ANALYSIS.md"
  "docs/business/"
  "docs/STRATEGIC_ROADMAP*.md"
  "docs/ACTIONABLE_IMPLEMENTATION_PLAN.md"
  "docs/EXECUTIVE_SUMMARY*.md"
  "docs/MODEL_BUSINESS_VALUE_STRATEGY.md"
)

echo "🗑️  Removing sensitive files from git history..."
echo ""

# Method 1: Using git filter-branch (slower but built-in)
echo "Using git filter-branch..."
for file in "${SENSITIVE_FILES[@]}"; do
  echo "Removing: $file"
  git filter-branch --force --index-filter \
    "git rm --cached --ignore-unmatch '$file'" \
    --prune-empty --tag-name-filter cat -- --all 2>/dev/null || true
done

echo ""
echo "✅ Done! History rewritten."
echo ""
echo "⚠️  Next steps:"
echo "   1. Force push: git push origin --force --all"
echo "   2. Force push tags: git push origin --force --tags"
echo "   3. Coordinate with team (they'll need to re-clone)"
echo ""
echo "💡 Alternative: Use BFG Repo-Cleaner for faster removal"

