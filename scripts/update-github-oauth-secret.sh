#!/bin/bash
# Script to update GitHub OAuth client secret in Vercel

echo "🔑 GitHub OAuth Secret Updater"
echo ""
echo "This script will help you update the GitHub OAuth client secret in Vercel."
echo ""
echo "📋 Prerequisites:"
echo "   1. Go to: https://github.com/settings/developers"
echo "   2. Find OAuth App with Client ID: Ov23liDKFkIrnPneWwny"
echo "   3. Get the client secret (click 'Generate a new client secret' if needed)"
echo ""
read -p "Have you retrieved the secret from GitHub? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Please get the secret from GitHub first, then run this script again."
    exit 1
fi

echo ""
echo "📝 Enter the GitHub OAuth Client Secret:"
echo "   (The secret will be hidden as you type)"
read -s GITHUB_SECRET

if [ -z "$GITHUB_SECRET" ]; then
    echo "❌ Secret cannot be empty!"
    exit 1
fi

if [ ${#GITHUB_SECRET} -lt 20 ]; then
    echo "⚠️  Warning: Secret seems too short (${#GITHUB_SECRET} chars). GitHub secrets are usually 40+ characters."
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""
echo "🔄 Updating Vercel environment variable..."
echo ""

# Remove old secret
echo "$GITHUB_SECRET" | vercel env rm GITHUB_CLIENT_SECRET production 2>&1 | grep -v "Enter" || true

# Add new secret
echo "$GITHUB_SECRET" | vercel env add GITHUB_CLIENT_SECRET production 2>&1

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Secret updated successfully!"
    echo ""
    echo "🚀 Next steps:"
    echo "   • The next deployment will use the new secret"
    echo "   • Or trigger a redeploy: vercel --prod --yes"
    echo "   • Test OAuth at: https://beast-mode.dev"
else
    echo ""
    echo "❌ Failed to update secret. Please try manually:"
    echo "   vercel env rm GITHUB_CLIENT_SECRET production"
    echo "   vercel env add GITHUB_CLIENT_SECRET production"
fi
