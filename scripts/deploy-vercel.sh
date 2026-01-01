#!/bin/bash
# Automated Vercel Deployment Script
# Handles commit, push, and deployment with error checking

set -e  # Exit on error

PROJECT_ROOT="/Users/jeffadkins/Smugglers/BEAST-MODE-PRODUCT"
WEBSITE_DIR="$PROJECT_ROOT/website"
LOG_FILE="/tmp/vercel-deploy-$(date +%Y%m%d-%H%M%S).log"

echo "🚀 Starting Vercel Deployment Process..."
echo "📝 Log file: $LOG_FILE"
echo ""

# Step 1: Check for uncommitted changes
cd "$PROJECT_ROOT"
if [ -n "$(git status --porcelain)" ]; then
  echo "📦 Staging all changes..."
  git add -A
  
  echo "💾 Committing changes..."
  COMMIT_MSG="${1:-fix: Automated deployment}"
  git commit -m "$COMMIT_MSG" || echo "⚠️  No changes to commit"
else
  echo "✅ No uncommitted changes"
fi

# Step 2: Push to remote
echo "📤 Pushing to origin/main..."
git push origin main || {
  echo "❌ Failed to push to remote"
  exit 1
}

# Step 3: Deploy to Vercel
cd "$WEBSITE_DIR"
echo "🌐 Deploying to Vercel..."
echo ""

# Run deployment and capture output
if vercel --prod --yes 2>&1 | tee "$LOG_FILE"; then
  echo ""
  echo "✅ Deployment successful!"
  echo "📋 Full logs saved to: $LOG_FILE"
  
  # Extract deployment URL from logs
  DEPLOY_URL=$(grep -oP 'https://[^\s]+\.vercel\.app' "$LOG_FILE" | tail -1 || echo "")
  if [ -n "$DEPLOY_URL" ]; then
    echo "🔗 Production URL: $DEPLOY_URL"
  fi
  
  # Check for build warnings
  if grep -q "Compiled with warnings" "$LOG_FILE"; then
    echo "⚠️  Build completed with warnings (check logs)"
  fi
  
  exit 0
else
  echo ""
  echo "❌ Deployment failed!"
  echo "📋 Error logs saved to: $LOG_FILE"
  echo ""
  echo "🔍 Last 30 lines of error output:"
  tail -30 "$LOG_FILE"
  exit 1
fi

