#!/bin/bash

# Setup Stripe Products using Stripe CLI
# Requires: stripe login first

set -e

echo "💳 Setting Up Stripe Products for BEAST MODE"
echo "=============================================="
echo ""

# Check if Stripe CLI is logged in
if ! stripe config --list > /dev/null 2>&1; then
  echo "⚠️  Stripe CLI not logged in"
  echo ""
  echo "Please run: stripe login"
  echo "Then run this script again"
  exit 1
fi

echo "✅ Stripe CLI is authenticated"
echo ""

# Create products
echo "📦 Creating BEAST MODE Pro..."
stripe products create \
  --name="BEAST MODE Pro" \
  --description="Pro plan - \$19/month - Unlimited PR analysis, advanced features" \
  --metadata[planId]=pro \
  --metadata[beastMode]=true

echo ""
echo "📦 Creating BEAST MODE Team..."
stripe products create \
  --name="BEAST MODE Team" \
  --description="Team plan - \$99/month - Team collaboration, dashboards, advanced analytics" \
  --metadata[planId]=team \
  --metadata[beastMode]=true

echo ""
echo "📦 Creating BEAST MODE Enterprise..."
stripe products create \
  --name="BEAST MODE Enterprise" \
  --description="Enterprise plan - \$499/month - Custom pricing, SSO, dedicated support" \
  --metadata[planId]=enterprise \
  --metadata[beastMode]=true

echo ""
echo "✅ Products created!"
echo ""
echo "📋 Next: Create prices for each product"
echo "   Use: stripe prices create --product=<product_id> --unit-amount=<amount> --currency=usd --recurring[interval]=month"
echo ""
