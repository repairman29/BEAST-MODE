#!/bin/bash

# Set Vercel Environment Variables using CLI (non-interactive)
# Uses expect or here-document to provide input

cd "$(dirname "$0")/../website" || exit 1

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo ""
echo "🚀 Setting Vercel Environment Variables via CLI"
echo "=============================================="
echo ""

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Install with: npm install -g vercel"
    exit 1
fi

# Check if logged in
if ! vercel whoami &> /dev/null; then
    echo "❌ Not logged into Vercel. Run: vercel login"
    exit 1
fi

echo "✅ Vercel CLI ready"
echo ""

# Credentials from Supabase (from previous script output)
declare -A ENV_VARS=(
    ["GITHUB_CLIENT_ID"]="Ov23lidLvmp68FVMEqEB"
    ["GITHUB_CLIENT_SECRET"]="df4c598018de45ce8cb90313489eeb21448aedcf"
    ["GITHUB_TOKEN_ENCRYPTION_KEY"]="20abb6f3b973e2fdeea6e2c417ce93824e7b64962f9fee4bfd6339264c8e792c"
    ["GITHUB_REDIRECT_URI"]="https://beast-mode.dev/api/github/oauth/callback"
    ["NEXT_PUBLIC_SUPABASE_URL"]="https://rbfzlqmkwhbvrrfdcain.supabase.co"
    ["SUPABASE_URL"]="https://rbfzlqmkwhbvrrfdcain.supabase.co"
    ["SUPABASE_SERVICE_ROLE_KEY"]="sb_secret_Ct-MkMyeSNyQo7RST6gCvw_j8u3_gIH"
    ["NEXT_PUBLIC_URL"]="https://beast-mode.dev"
)

SUCCESS=0
FAILED=0

for key in "${!ENV_VARS[@]}"; do
    value="${ENV_VARS[$key]}"
    echo -n "Setting ${key}... "
    
    # Use printf to pipe value to vercel env add
    if printf "%s\n" "$value" | vercel env add "$key" production --yes 2>&1 | grep -q "Added"; then
        echo -e "${GREEN}✅${NC}"
        ((SUCCESS++))
    else
        # Try to update if it already exists
        if printf "%s\n" "$value" | vercel env rm "$key" production --yes 2>&1 > /dev/null; then
            if printf "%s\n" "$value" | vercel env add "$key" production --yes 2>&1 | grep -q "Added"; then
                echo -e "${GREEN}✅ (updated)${NC}"
                ((SUCCESS++))
            else
                echo -e "${YELLOW}⚠️  (may need manual setup)${NC}"
                ((FAILED++))
            fi
        else
            echo -e "${YELLOW}⚠️  (may need manual setup)${NC}"
            ((FAILED++))
        fi
    fi
done

echo ""
echo "📊 Summary:"
echo "   ✅ Set: $SUCCESS"
echo "   ⚠️  Failed: $FAILED"
echo ""

if [ $SUCCESS -gt 0 ]; then
    echo "✅ Variables set! Vercel will auto-redeploy."
fi

