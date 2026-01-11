#!/bin/bash
# Remove .env.local.bak from git history

echo "🔧 Removing .env.local.bak from git history..."
echo ""

# Method 1: Interactive rebase to remove the file
echo "Option 1: Interactive rebase (safest)"
echo "  git rebase -i 58efcea7"
echo "  Then remove the line that adds .env.local.bak"
echo ""

# Method 2: Create new commit that removes it
echo "Option 2: Create new commit that explicitly removes it"
echo "  git rm --cached website/.env.local.bak"
echo "  git commit --amend --no-edit"
echo ""

# Method 3: Use git-filter-repo (if installed)
if command -v git-filter-repo &> /dev/null; then
  echo "Option 3: Using git-filter-repo"
  git-filter-repo --path website/.env.local.bak --invert-paths --force
else
  echo "Option 3: Install git-filter-repo: pip install git-filter-repo"
fi

echo ""
echo "⚠️  After removing from history:"
echo "  1. Force push: git push origin main --force"
echo "  2. Or use GitHub URL to unblock: https://github.com/repairman29/BEAST-MODE/security/secret-scanning/unblock-secret/385q4NqZe6WJl3DF5"
