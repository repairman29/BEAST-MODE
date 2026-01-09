#!/bin/bash

# BEAST MODE Production Deployment Script
# Automates the deployment process as much as possible

set -e  # Exit on error

echo "🚀 BEAST MODE Production Deployment"
echo "===================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Run pre-deployment checks
echo "📋 Step 1: Running pre-deployment checks..."
node scripts/production-deployment-checklist.js
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Pre-deployment checks failed${NC}"
    exit 1
fi
echo ""

# Step 2: Build locally to verify
echo "🔨 Step 2: Building locally..."
cd website
npm install
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Build successful${NC}"
echo ""

# Step 3: Check for Supabase CLI
echo "📦 Step 3: Checking database migrations..."
cd ..
if command -v supabase &> /dev/null; then
    echo "Supabase CLI found, checking if linked..."
    if supabase status &> /dev/null; then
        echo "Applying migrations..."
        supabase db push
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Migrations applied${NC}"
        else
            echo -e "${YELLOW}⚠️  Migration push failed (may need manual setup)${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  Supabase not linked. Please run: supabase link${NC}"
        echo "   Or apply migrations manually via Supabase Dashboard"
    fi
else
    echo -e "${YELLOW}⚠️  Supabase CLI not found${NC}"
    echo "   Please apply migrations manually via Supabase Dashboard"
fi
echo ""

# Step 4: Check for Vercel CLI
echo "🚀 Step 4: Deploying to Vercel..."
cd website
if command -v vercel &> /dev/null; then
    echo "Vercel CLI found, checking authentication..."
    if vercel whoami &> /dev/null; then
        echo "Deploying to production..."
        vercel --prod --yes
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Deployment successful!${NC}"
        else
            echo -e "${RED}❌ Deployment failed${NC}"
            exit 1
        fi
    else
        echo -e "${YELLOW}⚠️  Not logged in to Vercel. Please run: vercel login${NC}"
        echo "   Then run: vercel --prod --yes"
    fi
else
    echo -e "${YELLOW}⚠️  Vercel CLI not found${NC}"
    echo "   Install with: npm install -g vercel"
    echo "   Then run: vercel --prod --yes"
fi
echo ""

# Step 5: Verify environment variables
echo "🔐 Step 5: Environment Variables Checklist"
echo "   Please verify these are set in Vercel Dashboard:"
echo "   - NEXT_PUBLIC_SUPABASE_URL"
echo "   - NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "   - SUPABASE_SERVICE_ROLE_KEY"
echo "   - GITHUB_CLIENT_ID"
echo "   - GITHUB_CLIENT_SECRET"
echo "   - GITHUB_REDIRECT_URI"
echo "   - GITHUB_TOKEN_ENCRYPTION_KEY"
echo "   - JWT_SECRET"
echo "   - STRIPE_SECRET_KEY"
echo "   - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
echo "   - NEXT_PUBLIC_URL"
echo ""

echo "===================================="
echo -e "${GREEN}✅ Deployment process complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. Verify environment variables in Vercel Dashboard"
echo "  2. Test the deployed application"
echo "  3. Monitor for errors"
echo ""
