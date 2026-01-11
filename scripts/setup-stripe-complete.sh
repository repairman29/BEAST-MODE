#!/bin/bash

# Complete Stripe Setup for BEAST MODE
# Creates products, prices, and webhook

set -e

echo "💳 Complete Stripe Setup for BEAST MODE"
echo "========================================"
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

# Get webhook URL
WEBHOOK_URL="${NEXT_PUBLIC_APP_URL:-https://beast-mode.dev}/api/stripe/webhook"
echo "📡 Webhook URL: $WEBHOOK_URL"
echo ""

# Create products and prices
echo "📦 Creating Products and Prices..."
echo ""

# Pro Plan
echo "1. BEAST MODE Pro (\$19/month)..."
PRO_PRODUCT_OUTPUT=$(stripe products create \
  --name="BEAST MODE Pro" \
  --description="Pro plan - \$19/month - Unlimited PR analysis, advanced features" \
  --metadata[planId]=pro \
  --metadata[beastMode]=true \
  --format=json 2>&1)

if echo "$PRO_PRODUCT_OUTPUT" | grep -q "already exists"; then
  # Product exists, find it
  PRO_PRODUCT=$(stripe products list --limit=100 --format=json | jq -r '.data[] | select(.name=="BEAST MODE Pro") | .id' | head -1)
  echo "   ℹ️  Product already exists: $PRO_PRODUCT"
else
  PRO_PRODUCT=$(echo "$PRO_PRODUCT_OUTPUT" | jq -r '.id // empty')
  if [ -z "$PRO_PRODUCT" ]; then
    echo "   ❌ Failed to create product"
    echo "   Output: $PRO_PRODUCT_OUTPUT"
    PRO_PRODUCT=""
  else
    echo "   ✅ Product created: $PRO_PRODUCT"
  fi
fi

if [ -n "$PRO_PRODUCT" ]; then
  PRO_PRICE_OUTPUT=$(stripe prices create \
    --product="$PRO_PRODUCT" \
    --unit-amount=1900 \
    --currency=usd \
    --recurring[interval]=month \
    --format=json 2>&1)
  
  PRO_PRICE=$(echo "$PRO_PRICE_OUTPUT" | jq -r '.id // empty')
  if [ -z "$PRO_PRICE" ]; then
    # Check if price exists
    PRO_PRICE=$(stripe prices list --product="$PRO_PRODUCT" --limit=10 --format=json | jq -r '.data[] | select(.unit_amount==1900 and .recurring.interval=="month") | .id' | head -1)
    if [ -n "$PRO_PRICE" ]; then
      echo "   ✅ Price already exists: $PRO_PRICE"
    else
      echo "   ❌ Failed to create price"
      PRO_PRICE=""
    fi
  else
    echo "   ✅ Price created: $PRO_PRICE"
  fi
else
  PRO_PRICE=""
fi

echo "   ✅ Product: $PRO_PRODUCT"
echo "   ✅ Price: $PRO_PRICE"
echo ""

# Team Plan
echo "2. BEAST MODE Team (\$99/month)..."
TEAM_PRODUCT_OUTPUT=$(stripe products create \
  --name="BEAST MODE Team" \
  --description="Team plan - \$99/month - Team collaboration, dashboards, advanced analytics" \
  --metadata[planId]=team \
  --metadata[beastMode]=true \
  --format=json 2>&1)

if echo "$TEAM_PRODUCT_OUTPUT" | grep -q "already exists"; then
  TEAM_PRODUCT=$(stripe products list --limit=100 --format=json | jq -r '.data[] | select(.name=="BEAST MODE Team") | .id' | head -1)
  echo "   ℹ️  Product already exists: $TEAM_PRODUCT"
else
  TEAM_PRODUCT=$(echo "$TEAM_PRODUCT_OUTPUT" | jq -r '.id // empty')
  if [ -z "$TEAM_PRODUCT" ]; then
    echo "   ❌ Failed to create product"
    TEAM_PRODUCT=""
  else
    echo "   ✅ Product created: $TEAM_PRODUCT"
  fi
fi

if [ -n "$TEAM_PRODUCT" ]; then
  TEAM_PRICE_OUTPUT=$(stripe prices create \
    --product="$TEAM_PRODUCT" \
    --unit-amount=9900 \
    --currency=usd \
    --recurring[interval]=month \
    --format=json 2>&1)
  
  TEAM_PRICE=$(echo "$TEAM_PRICE_OUTPUT" | jq -r '.id // empty')
  if [ -z "$TEAM_PRICE" ]; then
    TEAM_PRICE=$(stripe prices list --product="$TEAM_PRODUCT" --limit=10 --format=json | jq -r '.data[] | select(.unit_amount==9900 and .recurring.interval=="month") | .id' | head -1)
    if [ -n "$TEAM_PRICE" ]; then
      echo "   ✅ Price already exists: $TEAM_PRICE"
    else
      echo "   ❌ Failed to create price"
      TEAM_PRICE=""
    fi
  else
    echo "   ✅ Price created: $TEAM_PRICE"
  fi
else
  TEAM_PRICE=""
fi

echo "   ✅ Product: $TEAM_PRODUCT"
echo "   ✅ Price: $TEAM_PRICE"
echo ""

# Enterprise Plan
echo "3. BEAST MODE Enterprise (\$499/month)..."
ENT_PRODUCT_OUTPUT=$(stripe products create \
  --name="BEAST MODE Enterprise" \
  --description="Enterprise plan - \$499/month - Custom pricing, SSO, dedicated support" \
  --metadata[planId]=enterprise \
  --metadata[beastMode]=true \
  --format=json 2>&1)

if echo "$ENT_PRODUCT_OUTPUT" | grep -q "already exists"; then
  ENT_PRODUCT=$(stripe products list --limit=100 --format=json | jq -r '.data[] | select(.name=="BEAST MODE Enterprise") | .id' | head -1)
  echo "   ℹ️  Product already exists: $ENT_PRODUCT"
else
  ENT_PRODUCT=$(echo "$ENT_PRODUCT_OUTPUT" | jq -r '.id // empty')
  if [ -z "$ENT_PRODUCT" ]; then
    echo "   ❌ Failed to create product"
    ENT_PRODUCT=""
  else
    echo "   ✅ Product created: $ENT_PRODUCT"
  fi
fi

if [ -n "$ENT_PRODUCT" ]; then
  ENT_PRICE_OUTPUT=$(stripe prices create \
    --product="$ENT_PRODUCT" \
    --unit-amount=49900 \
    --currency=usd \
    --recurring[interval]=month \
    --format=json 2>&1)
  
  ENT_PRICE=$(echo "$ENT_PRICE_OUTPUT" | jq -r '.id // empty')
  if [ -z "$ENT_PRICE" ]; then
    ENT_PRICE=$(stripe prices list --product="$ENT_PRODUCT" --limit=10 --format=json | jq -r '.data[] | select(.unit_amount==49900 and .recurring.interval=="month") | .id' | head -1)
    if [ -n "$ENT_PRICE" ]; then
      echo "   ✅ Price already exists: $ENT_PRICE"
    else
      echo "   ❌ Failed to create price"
      ENT_PRICE=""
    fi
  else
    echo "   ✅ Price created: $ENT_PRICE"
  fi
else
  ENT_PRICE=""
fi

echo "   ✅ Product: $ENT_PRODUCT"
echo "   ✅ Price: $ENT_PRICE"
echo ""

# Create webhook
echo "🔗 Creating Webhook..."
WEBHOOK_OUTPUT=$(stripe webhooks create \
  --url="$WEBHOOK_URL" \
  --enabled-events=checkout.session.completed \
  --enabled-events=customer.subscription.updated \
  --enabled-events=customer.subscription.deleted \
  --enabled-events=invoice.payment_succeeded \
  --enabled-events=invoice.payment_failed \
  --format=json 2>&1)

if echo "$WEBHOOK_OUTPUT" | grep -q "already exists" || echo "$WEBHOOK_OUTPUT" | grep -q "duplicate"; then
  # Webhook exists, find it
  WEBHOOK_ID=$(stripe webhooks list --limit=100 --format=json | jq -r ".data[] | select(.url==\"$WEBHOOK_URL\") | .id" | head -1)
  echo "   ℹ️  Webhook already exists: $WEBHOOK_ID"
  WEBHOOK_SECRET="Get from dashboard"
else
  WEBHOOK_ID=$(echo "$WEBHOOK_OUTPUT" | jq -r '.id // empty')
  if [ -z "$WEBHOOK_ID" ]; then
    echo "   ❌ Failed to create webhook"
    echo "   Output: $WEBHOOK_OUTPUT"
    WEBHOOK_ID=""
    WEBHOOK_SECRET="Get from dashboard"
  else
    echo "   ✅ Webhook created: $WEBHOOK_ID"
    # Try to get secret
    WEBHOOK_SECRET=$(echo "$WEBHOOK_OUTPUT" | jq -r '.secret // "Get from dashboard"')
  fi
fi

echo "   ✅ Webhook: $WEBHOOK_ID"
echo ""

# Save results
cat > stripe-setup-results.json << EOF
{
  "products": {
    "pro": {
      "productId": "$PRO_PRODUCT",
      "priceId": "$PRO_PRICE"
    },
    "team": {
      "productId": "$TEAM_PRODUCT",
      "priceId": "$TEAM_PRICE"
    },
    "enterprise": {
      "productId": "$ENT_PRODUCT",
      "priceId": "$ENT_PRICE"
    }
  },
  "webhook": {
    "id": "$WEBHOOK_ID",
    "url": "$WEBHOOK_URL",
    "secret": "$WEBHOOK_SECRET"
  },
  "createdAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
}
EOF

echo "📊 Summary:"
echo "==========="
echo ""
echo "Products:"
echo "  • Pro: $PRO_PRODUCT / $PRO_PRICE"
echo "  • Team: $TEAM_PRODUCT / $TEAM_PRICE"
echo "  • Enterprise: $ENT_PRODUCT / $ENT_PRICE"
echo ""
echo "Webhook:"
echo "  • ID: $WEBHOOK_ID"
echo "  • URL: $WEBHOOK_URL"
echo "  • Secret: $WEBHOOK_SECRET"
echo ""
echo "💾 Results saved to: stripe-setup-results.json"
echo ""
echo "📝 Next Steps:"
echo "  1. Add STRIPE_WEBHOOK_SECRET to .env.local:"
echo "     STRIPE_WEBHOOK_SECRET=$WEBHOOK_SECRET"
echo "  2. Add STRIPE_WEBHOOK_SECRET to Vercel environment variables"
echo "  3. Test checkout flow"
echo ""
