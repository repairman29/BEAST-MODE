#!/bin/bash
# Clean sensitive files from all public repository histories
# WARNING: This rewrites git history. Use with caution!

set -e

echo "⚠️  WARNING: This will rewrite git history for all public repos!"
echo "   Make sure you have backups and coordinate with your team."
echo ""
read -p "Continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
  echo "Aborted."
  exit 1
fi

REPO_DIRS=(
  "BEAST-MODE-PRODUCT"
  "echeo-landing"
)

SENSITIVE_PATTERNS=(
  "docs/PRICING_*.md"
  "docs/*MARGIN*.md"
  "docs/*COST*.md"
  "docs/INFRASTRUCTURE_COST_ANALYSIS.md"
  "docs/business/"
  "docs/STRATEGIC_ROADMAP*.md"
  "docs/ACTIONABLE_IMPLEMENTATION_PLAN.md"
  "docs/EXECUTIVE_SUMMARY*.md"
  "docs/MODEL_BUSINESS_VALUE_STRATEGY.md"
)

for repo_dir in "${REPO_DIRS[@]}"; do
  if [ ! -d "$repo_dir" ]; then
    continue
  fi

  echo ""
  echo "🧹 Cleaning: $repo_dir"
  echo "-----------------------------------"
  
  cd "$repo_dir" || continue

  # Check if sensitive files are in history
  HISTORY_COUNT=$(git log --all --full-history --oneline -- "${SENSITIVE_PATTERNS[@]}" 2>/dev/null | wc -l | tr -d ' ')

  if [ "$HISTORY_COUNT" -eq 0 ]; then
    echo "   ✅ No sensitive files in history"
    cd ..
    continue
  fi

  echo "   Found $HISTORY_COUNT commits with sensitive files"
  echo "   Removing from history..."

  # Use git filter-branch to remove
  for pattern in "${SENSITIVE_PATTERNS[@]}"; do
    # Expand pattern to actual files
    for file in $pattern; do
      if [ -f "$file" ] || [ -d "$file" ]; then
        echo "   Removing: $file"
        git filter-branch --force --index-filter \
          "git rm --cached --ignore-unmatch '$file'" \
          --prune-empty --tag-name-filter cat -- --all 2>/dev/null || true
      fi
    done
  done

  # Clean up
  git reflog expire --expire=now --all
  git gc --prune=now --aggressive

  echo "   ✅ History cleaned for $repo_dir"
  echo "   ⚠️  Remember to force push: git push origin --force --all --tags"
  
  cd ..
done

echo ""
echo "✅ Done! All public repos cleaned."
echo ""
echo "⚠️  Next steps:"
echo "   1. Review changes in each repo"
echo "   2. Force push: git push origin --force --all --tags"
echo "   3. Coordinate with team (they'll need to re-clone)"

