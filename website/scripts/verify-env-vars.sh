#!/bin/bash

# Script to verify all required environment variables
# Usage: ./scripts/verify-env-vars.sh

echo "🔍 Verifying Environment Variables"
echo ""

REQUIRED_VARS=(
    "NEXT_PUBLIC_SUPABASE_URL"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    "SUPABASE_SERVICE_ROLE_KEY"
    "GITHUB_CLIENT_ID"
    "GITHUB_CLIENT_SECRET"
    "GITHUB_REDIRECT_URI"
    "GITHUB_TOKEN_ENCRYPTION_KEY"
    "JWT_SECRET"
    "STRIPE_SECRET_KEY"
    "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
    "NEXT_PUBLIC_URL"
)

OPTIONAL_VARS=(
    "GITHUB_TOKEN"
)

MISSING=()
PRESENT=()

# Check .env.local file
if [ -f ".env.local" ]; then
    echo "📄 Checking .env.local file..."
    echo ""
    
    for var in "${REQUIRED_VARS[@]}"; do
        if grep -q "^${var}=" .env.local; then
            PRESENT+=("$var")
            echo "  ✅ $var"
        else
            MISSING+=("$var")
            echo "  ❌ $var (MISSING)"
        fi
    done
    
    echo ""
    echo "Optional variables:"
    for var in "${OPTIONAL_VARS[@]}"; do
        if grep -q "^${var}=" .env.local; then
            echo "  ✅ $var"
        else
            echo "  ⚠️  $var (optional)"
        fi
    done
else
    echo "❌ .env.local file not found"
    echo "   Create it from .env.example"
    exit 1
fi

echo ""
echo "📊 Summary:"
echo "   ✅ Present: ${#PRESENT[@]}/${#REQUIRED_VARS[@]}"
echo "   ❌ Missing: ${#MISSING[@]}"

if [ ${#MISSING[@]} -gt 0 ]; then
    echo ""
    echo "❌ Missing required variables:"
    for var in "${MISSING[@]}"; do
        echo "   • $var"
    done
    echo ""
    echo "⚠️  Add these to .env.local before deploying"
    exit 1
else
    echo ""
    echo "✅ All required environment variables are present!"
fi

