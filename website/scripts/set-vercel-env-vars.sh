#!/bin/bash
# Set GitHub OAuth environment variables in Vercel

echo "🔧 Setting GitHub OAuth environment variables in Vercel..."
echo ""

# Production values from ENV_VALUES.txt
GITHUB_CLIENT_ID="Ov23liDKFkIrnPneWwny"
GITHUB_CLIENT_SECRET="014c7fab1ba6cc6a7398b5bde04e26463f16f4e9"
GITHUB_REDIRECT_URI="https://beast-mode.dev/api/github/oauth/callback"
GITHUB_TOKEN_ENCRYPTION_KEY="20abb6f3b973e2fdeea6e2c417ce93824e7b64962f9fee4bfd6339264c8e792c"
NEXT_PUBLIC_URL="https://beast-mode.dev"

echo "Setting environment variables for beast-mode-website project..."
echo ""

vercel env add GITHUB_CLIENT_ID production <<< "$GITHUB_CLIENT_ID" || echo "⚠️  GITHUB_CLIENT_ID may already exist"
vercel env add GITHUB_CLIENT_SECRET production <<< "$GITHUB_CLIENT_SECRET" || echo "⚠️  GITHUB_CLIENT_SECRET may already exist"
vercel env add GITHUB_REDIRECT_URI production <<< "$GITHUB_REDIRECT_URI" || echo "⚠️  GITHUB_REDIRECT_URI may already exist"
vercel env add GITHUB_TOKEN_ENCRYPTION_KEY production <<< "$GITHUB_TOKEN_ENCRYPTION_KEY" || echo "⚠️  GITHUB_TOKEN_ENCRYPTION_KEY may already exist"
vercel env add NEXT_PUBLIC_URL production <<< "$NEXT_PUBLIC_URL" || echo "⚠️  NEXT_PUBLIC_URL may already exist"

echo ""
echo "✅ Environment variables set!"
echo ""
echo "📋 Variables set:"
echo "   • GITHUB_CLIENT_ID"
echo "   • GITHUB_CLIENT_SECRET"
echo "   • GITHUB_REDIRECT_URI"
echo "   • GITHUB_TOKEN_ENCRYPTION_KEY"
echo "   • NEXT_PUBLIC_URL"
echo ""
echo "🔄 Redeploy to apply changes:"
echo "   vercel --prod --yes"
