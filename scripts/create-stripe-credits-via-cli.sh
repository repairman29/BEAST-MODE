#!/bin/bash

# Create Stripe Credit Products via CLI
# This script creates all credit packages using Stripe CLI

set -e

echo "💳 Creating Stripe Credit Products via CLI..."
echo "=============================================="
echo ""

# Check if Stripe CLI is authenticated
if ! stripe config --list > /dev/null 2>&1; then
  echo "⚠️  Stripe CLI not authenticated. Run: stripe login"
  exit 1
fi

RESULTS_FILE="stripe-credit-products-cli.json"
RESULTS='{"products":[],"errors":[]}'

# Function to create product and price
create_credit_package() {
  local name=$1
  local credits=$2
  local price_cents=$3
  local description=$4
  
  echo "📦 Creating: $name ($credits credits - \$$((price_cents / 100)).00)"
  
  # Create product
  PRODUCT_OUTPUT=$(stripe products create \
    --name="$name" \
    --description="$description" \
    --metadata[type]=credit_package \
    --metadata[credits]=$credits \
    2>&1)
  
  if [ $? -ne 0 ]; then
    echo "   ❌ Error creating product: $PRODUCT_OUTPUT"
    RESULTS=$(echo "$RESULTS" | jq ".errors += [{\"package\": \"$name\", \"error\": \"$PRODUCT_OUTPUT\"}]")
    return 1
  fi
  
  PRODUCT_ID=$(echo "$PRODUCT_OUTPUT" | grep -o '"id": "[^"]*' | cut -d'"' -f4 | head -1)
  
  if [ -z "$PRODUCT_ID" ]; then
    # Try alternative parsing
    PRODUCT_ID=$(echo "$PRODUCT_OUTPUT" | jq -r '.id' 2>/dev/null || echo "")
  fi
  
  if [ -z "$PRODUCT_ID" ]; then
    echo "   ❌ Could not extract product ID"
    RESULTS=$(echo "$RESULTS" | jq ".errors += [{\"package\": \"$name\", \"error\": \"Could not extract product ID\"}]")
    return 1
  fi
  
  echo "   ✅ Product created: $PRODUCT_ID"
  
  # Create price
  PRICE_OUTPUT=$(stripe prices create \
    --product="$PRODUCT_ID" \
    --unit-amount=$price_cents \
    --currency=usd \
    --metadata[type]=credit_package \
    --metadata[credits]=$credits \
    2>&1)
  
  if [ $? -ne 0 ]; then
    echo "   ❌ Error creating price: $PRICE_OUTPUT"
    RESULTS=$(echo "$RESULTS" | jq ".errors += [{\"package\": \"$name\", \"error\": \"Price creation failed\"}]")
    return 1
  fi
  
  PRICE_ID=$(echo "$PRICE_OUTPUT" | grep -o '"id": "[^"]*' | cut -d'"' -f4 | head -1)
  
  if [ -z "$PRICE_ID" ]; then
    PRICE_ID=$(echo "$PRICE_OUTPUT" | jq -r '.id' 2>/dev/null || echo "")
  fi
  
  if [ -z "$PRICE_ID" ]; then
    echo "   ❌ Could not extract price ID"
    RESULTS=$(echo "$RESULTS" | jq ".errors += [{\"package\": \"$name\", \"error\": \"Could not extract price ID\"}]")
    return 1
  fi
  
  echo "   ✅ Price created: $PRICE_ID"
  echo ""
  
  # Add to results
  RESULTS=$(echo "$RESULTS" | jq ".products += [{
    \"name\": \"$name\",
    \"credits\": $credits,
    \"price\": $price_cents,
    \"productId\": \"$PRODUCT_ID\",
    \"priceId\": \"$PRICE_ID\"
  }]")
}

# Create all packages
create_credit_package "100 Credits" 100 500 "Perfect for trying premium features"
create_credit_package "500 Credits" 500 2000 "Great for small projects"
create_credit_package "1,000 Credits" 1000 3500 "Best value for regular users"
create_credit_package "5,000 Credits" 5000 15000 "For power users and teams"
create_credit_package "10,000 Credits" 10000 25000 "Maximum value for heavy usage"

# Save results
echo "$RESULTS" | jq '.' > "$RESULTS_FILE"

echo "=============================================="
echo ""
echo "📊 Results saved to: $RESULTS_FILE"
echo ""
echo "📋 Created Products:"
echo "$RESULTS" | jq -r '.products[] | "\(.name): \(.priceId)"'
echo ""
