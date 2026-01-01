#!/bin/bash

# Set Vercel Environment Variables automatically from ALL_MIGRATIONS.sql
# Non-interactive version - extracts and sets all values
# Usage: ./scripts/set-vercel-env-auto.sh [supabase_url] [supabase_anon_key] [supabase_service_key]

set -e

echo "🔧 Setting Vercel Environment Variables from ALL_MIGRATIONS.sql (Auto)..."
echo ""

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
  echo "❌ Vercel CLI not found. Install with: npm install -g vercel"
  exit 1
fi

# Check if logged in
if ! vercel whoami &> /dev/null; then
  echo "❌ Not logged in to Vercel. Run: vercel login"
  exit 1
fi

# Get project directory
PROJECT_DIR="website"
MIGRATIONS_FILE="website/ALL_MIGRATIONS.sql"
cd "$(dirname "$0")/.."

if [ ! -f "$MIGRATIONS_FILE" ]; then
  echo "❌ Migrations file not found: $MIGRATIONS_FILE"
  exit 1
fi

# Get Supabase values from command line or environment
SUPABASE_URL="${1:-${NEXT_PUBLIC_SUPABASE_URL}}"
SUPABASE_ANON_KEY="${2:-${NEXT_PUBLIC_SUPABASE_ANON_KEY}}"
SUPABASE_SERVICE_KEY="${3:-${SUPABASE_SERVICE_ROLE_KEY}}"

# Extract values from migrations file
echo "📄 Extracting values from $MIGRATIONS_FILE..."
echo ""

# Extract GitHub OAuth values using more robust parsing
GITHUB_CLIENT_ID=$(grep -A 10 "'github_oauth'" "$MIGRATIONS_FILE" | grep -o "'client_id', '[^']*'" | sed "s/.*'client_id', '\([^']*\)'.*/\1/" | head -1)
GITHUB_CLIENT_SECRET=$(grep -A 10 "'github_oauth'" "$MIGRATIONS_FILE" | grep -o "'client_secret', '[^']*'" | sed "s/.*'client_secret', '\([^']*\)'.*/\1/" | head -1)
GITHUB_REDIRECT_URI=$(grep -A 10 "'github_oauth'" "$MIGRATIONS_FILE" | grep -o "'redirect_uri', '[^']*'" | sed "s/.*'redirect_uri', '\([^']*\)'.*/\1/" | head -1)
ENCRYPTION_KEY=$(grep -A 10 "'github_oauth'" "$MIGRATIONS_FILE" | grep -o "'encryption_key', '[^']*'" | sed "s/.*'encryption_key', '\([^']*\)'.*/\1/" | head -1)

# Function to set environment variable
set_env_var() {
  local key=$1
  local value=$2
  local environment=${3:-production}
  
  if [ -z "$value" ]; then
    echo "⚠️  Skipping $key (empty value)"
    return 1
  fi
  
  echo "Setting: $key [$environment]"
  
  # Set the variable (suppress output)
  echo "$value" | vercel env add "$key" "$environment" "$PROJECT_DIR" --force > /dev/null 2>&1 || true
  
  return 0
}

# Set Supabase variables
if [ -n "$SUPABASE_URL" ]; then
  echo "📋 Setting Supabase variables..."
  set_env_var "NEXT_PUBLIC_SUPABASE_URL" "$SUPABASE_URL" "production"
  set_env_var "NEXT_PUBLIC_SUPABASE_URL" "$SUPABASE_URL" "preview"
  set_env_var "NEXT_PUBLIC_SUPABASE_URL" "$SUPABASE_URL" "development"
  echo "  ✅ NEXT_PUBLIC_SUPABASE_URL set"
fi

if [ -n "$SUPABASE_ANON_KEY" ]; then
  set_env_var "NEXT_PUBLIC_SUPABASE_ANON_KEY" "$SUPABASE_ANON_KEY" "production"
  set_env_var "NEXT_PUBLIC_SUPABASE_ANON_KEY" "$SUPABASE_ANON_KEY" "preview"
  set_env_var "NEXT_PUBLIC_SUPABASE_ANON_KEY" "$SUPABASE_ANON_KEY" "development"
  echo "  ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY set"
fi

if [ -n "$SUPABASE_SERVICE_KEY" ]; then
  set_env_var "SUPABASE_SERVICE_ROLE_KEY" "$SUPABASE_SERVICE_KEY" "production"
  set_env_var "SUPABASE_SERVICE_ROLE_KEY" "$SUPABASE_SERVICE_KEY" "preview"
  set_env_var "SUPABASE_SERVICE_ROLE_KEY" "$SUPABASE_SERVICE_KEY" "development"
  echo "  ✅ SUPABASE_SERVICE_ROLE_KEY set"
fi

# Set GitHub OAuth from migrations
if [ -n "$GITHUB_CLIENT_ID" ]; then
  echo ""
  echo "📋 Setting GitHub OAuth (from migrations file)..."
  set_env_var "GITHUB_CLIENT_ID" "$GITHUB_CLIENT_ID" "production"
  set_env_var "GITHUB_CLIENT_ID" "$GITHUB_CLIENT_ID" "preview"
  set_env_var "GITHUB_CLIENT_ID" "$GITHUB_CLIENT_ID" "development"
  echo "  ✅ GITHUB_CLIENT_ID set"
fi

if [ -n "$GITHUB_CLIENT_SECRET" ]; then
  set_env_var "GITHUB_CLIENT_SECRET" "$GITHUB_CLIENT_SECRET" "production"
  set_env_var "GITHUB_CLIENT_SECRET" "$GITHUB_CLIENT_SECRET" "preview"
  set_env_var "GITHUB_CLIENT_SECRET" "$GITHUB_CLIENT_SECRET" "development"
  echo "  ✅ GITHUB_CLIENT_SECRET set"
fi

if [ -n "$GITHUB_REDIRECT_URI" ]; then
  # For production, update to production URL if localhost
  PROD_CALLBACK="$GITHUB_REDIRECT_URI"
  if [[ "$GITHUB_REDIRECT_URI" == *"localhost"* ]]; then
    PROD_CALLBACK="https://beastmode.dev/api/github/oauth/callback"
  fi
  set_env_var "GITHUB_OAUTH_CALLBACK_URL" "$PROD_CALLBACK" "production"
  set_env_var "GITHUB_OAUTH_CALLBACK_URL" "$GITHUB_REDIRECT_URI" "preview"
  set_env_var "GITHUB_OAUTH_CALLBACK_URL" "$GITHUB_REDIRECT_URI" "development"
  echo "  ✅ GITHUB_OAUTH_CALLBACK_URL set"
fi

# Set encryption key as API_KEYS_ENCRYPTION_KEY
if [ -n "$ENCRYPTION_KEY" ]; then
  echo ""
  echo "📋 Setting API Keys Encryption (from migrations file)..."
  set_env_var "API_KEYS_ENCRYPTION_KEY" "$ENCRYPTION_KEY" "production"
  set_env_var "API_KEYS_ENCRYPTION_KEY" "$ENCRYPTION_KEY" "preview"
  set_env_var "API_KEYS_ENCRYPTION_KEY" "$ENCRYPTION_KEY" "development"
  echo "  ✅ API_KEYS_ENCRYPTION_KEY set"
fi

# Set optional variables
echo ""
echo "📋 Setting Optional Variables..."
set_env_var "NEXT_PUBLIC_JANITOR_ENABLED" "true" "production"
set_env_var "NEXT_PUBLIC_JANITOR_ENABLED" "true" "preview"
set_env_var "NEXT_PUBLIC_JANITOR_ENABLED" "true" "development"
echo "  ✅ NEXT_PUBLIC_JANITOR_ENABLED set"

set_env_var "NEXT_PUBLIC_JANITOR_OVERNIGHT_MODE" "true" "production"
set_env_var "NEXT_PUBLIC_JANITOR_OVERNIGHT_MODE" "true" "preview"
set_env_var "NEXT_PUBLIC_JANITOR_OVERNIGHT_MODE" "true" "development"
echo "  ✅ NEXT_PUBLIC_JANITOR_OVERNIGHT_MODE set"

echo ""
echo "✅ Environment variables setup complete!"
echo ""
echo "📝 Verifying (showing first 10 variables)..."
vercel env ls | head -15
echo ""
echo "🚀 Next step: cd website && vercel --prod"

