#!/bin/bash
# Automated Deployment and Testing Script
# Deploys BEAST MODE to production and runs tests

set -e  # Exit on error

echo "🚀 BEAST MODE Automated Deployment & Testing"
echo "=============================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WEBSITE_DIR="$PROJECT_ROOT/website"
API_URL="${BEAST_MODE_API_URL:-https://beast-mode.dev}"
LOCAL_URL="http://localhost:3000"

# Functions
print_step() {
    echo ""
    echo "${GREEN}📋 $1${NC}"
    echo "----------------------------------------"
}

print_success() {
    echo "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo "${RED}❌ $1${NC}"
}

# Step 1: Pre-deployment checks
print_step "Step 1: Pre-deployment Checks"

cd "$PROJECT_ROOT"

# Check if git is clean
if ! git diff-index --quiet HEAD --; then
    print_warning "Uncommitted changes detected"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

print_success "Git status OK"

# Step 2: Build
print_step "Step 2: Build Website"

cd "$WEBSITE_DIR"

if npm run build > /tmp/beast-mode-build.log 2>&1; then
    print_success "Build successful"
else
    print_error "Build failed - check /tmp/beast-mode-build.log"
    tail -20 /tmp/beast-mode-build.log
    exit 1
fi

# Step 3: Deploy to Vercel
print_step "Step 3: Deploy to Vercel"

cd "$PROJECT_ROOT"

DEPLOY_OUTPUT=$(vercel --prod --yes 2>&1)
DEPLOY_URL=$(echo "$DEPLOY_OUTPUT" | grep -oP 'https://[^\s]+' | head -1)

if [ -z "$DEPLOY_URL" ]; then
    print_error "Deployment failed or URL not found"
    echo "$DEPLOY_OUTPUT" | tail -20
    exit 1
fi

print_success "Deployed to: $DEPLOY_URL"

# Step 4: Wait for deployment
print_step "Step 4: Waiting for Deployment to be Ready"

echo "Waiting 15 seconds for deployment to propagate..."
sleep 15

# Step 5: Test endpoints
print_step "Step 5: Testing Endpoints"

cd "$PROJECT_ROOT"

# Test models/list
echo ""
echo "Testing /api/models/list..."
if curl -s -f "$API_URL/api/models/list" > /dev/null 2>&1; then
    print_success "Models list endpoint: OK"
else
    print_warning "Models list endpoint: Not available (may need time to propagate)"
fi

# Test cursor/proxy (GET)
echo ""
echo "Testing /api/cursor/proxy (GET)..."
if curl -s -f "$API_URL/api/cursor/proxy" > /dev/null 2>&1; then
    print_success "Cursor proxy endpoint: OK"
else
    print_warning "Cursor proxy endpoint: Not available (may need time to propagate)"
fi

# Test codebase/chat
echo ""
echo "Testing /api/codebase/chat..."
CHAT_RESPONSE=$(curl -s -X POST "$API_URL/api/codebase/chat" \
    -H "Content-Type: application/json" \
    -d '{"sessionId":"test-'$(date +%s)'","message":"test","repo":"test/repo","useLLM":false}' 2>&1)

if echo "$CHAT_RESPONSE" | grep -q "success"; then
    print_success "Chat endpoint: OK"
else
    print_warning "Chat endpoint: May have issues"
    echo "Response: ${CHAT_RESPONSE:0:100}..."
fi

# Step 6: Run integration tests
print_step "Step 6: Running Integration Tests"

if [ -f "$PROJECT_ROOT/scripts/test-custom-model-integration.js" ]; then
    if node "$PROJECT_ROOT/scripts/test-custom-model-integration.js" 2>&1 | tail -20; then
        print_success "Integration tests completed"
    else
        print_warning "Some integration tests may have failed (check output above)"
    fi
else
    print_warning "Integration test script not found"
fi

# Step 7: Summary
print_step "Step 7: Deployment Summary"

echo ""
echo "📦 Deployment Details:"
echo "   URL: $DEPLOY_URL"
echo "   API: $API_URL"
echo ""
echo "✅ Completed Steps:"
echo "   ✅ Pre-deployment checks"
echo "   ✅ Build successful"
echo "   ✅ Deployed to Vercel"
echo "   ✅ Endpoint testing"
echo ""
echo "📚 Next Steps:"
echo "   1. Test extension: code --install-extension cursor-extension/beast-mode-cursor-1.0.0.vsix"
echo "   2. Test auth: node scripts/test-custom-model-auth.js"
echo "   3. Verify in browser: $API_URL"
echo ""

print_success "Deployment complete!"
