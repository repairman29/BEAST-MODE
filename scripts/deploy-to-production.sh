#!/bin/bash
#
# Deploy to Production
#
# Complete deployment script for BEAST MODE
#

set -e  # Exit on error

echo "🚀 BEAST MODE Production Deployment"
echo "===================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Verify readiness
echo -e "${YELLOW}Step 1: Verifying production readiness...${NC}"
node scripts/verify-production-readiness.js
if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Production readiness check failed${NC}"
  exit 1
fi
echo ""

# Step 2: Apply migrations (optional - can skip if already applied)
echo -e "${YELLOW}Step 2: Apply database migrations? (y/n)${NC}"
read -r apply_migrations
if [ "$apply_migrations" = "y" ]; then
  echo "Applying migrations..."
  node scripts/apply-all-migrations.js
  if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Migration failed${NC}"
    exit 1
  fi
  echo ""
fi

# Step 3: Build
echo -e "${YELLOW}Step 3: Building website...${NC}"
cd website
npm run build
if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Build failed${NC}"
  exit 1
fi
echo ""

# Step 4: Deploy to Vercel
echo -e "${YELLOW}Step 4: Deploying to Vercel...${NC}"
vercel --prod --yes
if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Deployment failed${NC}"
  exit 1
fi
echo ""

# Step 5: Verify deployment
echo -e "${YELLOW}Step 5: Verifying deployment...${NC}"
vercel ls --limit 1
echo ""

echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. Verify deployment: vercel ls"
echo "  2. Check logs: vercel logs"
echo "  3. Monitor: http://localhost:3000/admin/feedback"
echo ""
