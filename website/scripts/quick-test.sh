#!/bin/bash

# Quick Test Script for BEAST MODE
# Tests the application and reports what's working/missing

echo ""
echo "🧪 BEAST MODE - Quick Test"
echo "=========================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BASE_URL="${1:-https://beast-mode.dev}"

echo "Testing: $BASE_URL"
echo ""

# Test 1: Health Check
echo "1️⃣  Testing Health Endpoint..."
HEALTH=$(curl -s "$BASE_URL/api/health" 2>/dev/null)
if [ $? -eq 0 ] && [ ! -z "$HEALTH" ]; then
    echo -e "${GREEN}✅ Health endpoint responding${NC}"
else
    echo -e "${RED}❌ Health endpoint not responding${NC}"
fi
echo ""

# Test 2: GitHub OAuth Status
echo "2️⃣  Testing GitHub OAuth Configuration..."
OAUTH=$(curl -s "$BASE_URL/api/github/oauth/authorize" 2>/dev/null)
if echo "$OAUTH" | grep -q "redirect" || echo "$OAUTH" | grep -q "github.com"; then
    echo -e "${GREEN}✅ GitHub OAuth configured${NC}"
elif echo "$OAUTH" | grep -q "not configured"; then
    echo -e "${YELLOW}⚠️  GitHub OAuth not configured${NC}"
    echo "   Missing: GITHUB_CLIENT_ID"
else
    echo -e "${RED}❌ GitHub OAuth error${NC}"
fi
echo ""

# Test 3: API Routes
echo "3️⃣  Testing API Routes..."
ROUTES=(
    "/api/beast-mode/analytics/unified"
    "/api/beast-mode/janitor/status"
    "/api/beast-mode/enterprise/integrations"
)

for route in "${ROUTES[@]}"; do
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$route" 2>/dev/null)
    if [ "$RESPONSE" = "200" ] || [ "$RESPONSE" = "401" ] || [ "$RESPONSE" = "403" ]; then
        echo -e "   ${GREEN}✅${NC} $route (HTTP $RESPONSE)"
    else
        echo -e "   ${RED}❌${NC} $route (HTTP $RESPONSE)"
    fi
done
echo ""

# Test 4: Database Connection (if we can test it)
echo "4️⃣  Database Status..."
echo "   Run this in Supabase SQL Editor to check:"
echo "   SELECT COUNT(*) FROM app_config;"
echo ""

echo "📋 Next Steps:"
echo "   1. If health check fails → Check Vercel deployment"
echo "   2. If OAuth fails → Add GITHUB_CLIENT_ID to Vercel"
echo "   3. If APIs return 500 → Check Supabase env vars"
echo "   4. If APIs return 401 → Normal (needs auth)"
echo ""
echo "💡 Tip: Open browser console at $BASE_URL to see detailed errors"
echo ""

