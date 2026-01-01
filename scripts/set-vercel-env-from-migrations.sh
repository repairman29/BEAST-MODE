#!/bin/bash

# Set Vercel Environment Variables from ALL_MIGRATIONS.sql
# Extracts values from migration file and sets them in Vercel
# Usage: ./scripts/set-vercel-env-from-migrations.sh

set -e

echo "🔧 Setting Vercel Environment Variables from ALL_MIGRATIONS.sql..."
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

# Extract values from migrations file
echo "📄 Extracting values from $MIGRATIONS_FILE..."
echo ""

# Extract GitHub OAuth values
GITHUB_CLIENT_ID=$(grep -A 5 "'github_oauth'" "$MIGRATIONS_FILE" | grep "'client_id'" | sed "s/.*'client_id', '\([^']*\)'.*/\1/" | head -1)
GITHUB_CLIENT_SECRET=$(grep -A 5 "'github_oauth'" "$MIGRATIONS_FILE" | grep "'client_secret'" | sed "s/.*'client_secret', '\([^']*\)'.*/\1/" | head -1)
GITHUB_REDIRECT_URI=$(grep -A 5 "'github_oauth'" "$MIGRATIONS_FILE" | grep "'redirect_uri'" | sed "s/.*'redirect_uri', '\([^']*\)'.*/\1/" | head -1)
ENCRYPTION_KEY=$(grep -A 5 "'github_oauth'" "$MIGRATIONS_FILE" | grep "'encryption_key'" | sed "s/.*'encryption_key', '\([^']*\)'.*/\1/" | head -1)

# Function to set environment variable
set_env_var() {
  local key=$1
  local value=$2
  local environment=${3:-production}
  
  if [ -z "$value" ]; then
    echo "⚠️  Skipping $key (empty value)"
    return
  fi
  
  echo "Setting: $key"
  echo "  Environment: $environment"
  echo "  Value: ${value:0:20}..." # Show first 20 chars only
  
  # Set the variable
  echo "$value" | vercel env add "$key" "$environment" "$PROJECT_DIR" --force 2>&1 | grep -v "already exists" || true
  
  echo "  ✅ Set successfully!"
  echo ""
}

# Prompt for Supabase values (not in migrations file)
echo "📋 Supabase Configuration (not in migrations file):"
read -p "Enter NEXT_PUBLIC_SUPABASE_URL: " SUPABASE_URL
read -sp "Enter NEXT_PUBLIC_SUPABASE_ANON_KEY: " SUPABASE_ANON_KEY
echo ""
read -sp "Enter SUPABASE_SERVICE_ROLE_KEY: " SUPABASE_SERVICE_ROLE_KEY
echo ""
echo ""

# Set Supabase variables
if [ -n "$SUPABASE_URL" ]; then
  set_env_var "NEXT_PUBLIC_SUPABASE_URL" "$SUPABASE_URL" "production"
  set_env_var "NEXT_PUBLIC_SUPABASE_URL" "$SUPABASE_URL" "preview"
  set_env_var "NEXT_PUBLIC_SUPABASE_URL" "$SUPABASE_URL" "development"
fi

if [ -n "$SUPABASE_ANON_KEY" ]; then
  set_env_var "NEXT_PUBLIC_SUPABASE_ANON_KEY" "$SUPABASE_ANON_KEY" "production"
  set_env_var "NEXT_PUBLIC_SUPABASE_ANON_KEY" "$SUPABASE_ANON_KEY" "preview"
  set_env_var "NEXT_PUBLIC_SUPABASE_ANON_KEY" "$SUPABASE_ANON_KEY" "development"
fi

if [ -n "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  set_env_var "SUPABASE_SERVICE_ROLE_KEY" "$SUPABASE_SERVICE_ROLE_KEY" "production"
  set_env_var "SUPABASE_SERVICE_ROLE_KEY" "$SUPABASE_SERVICE_ROLE_KEY" "preview"
  set_env_var "SUPABASE_SERVICE_ROLE_KEY" "$SUPABASE_SERVICE_ROLE_KEY" "development"
fi

# Set GitHub OAuth from migrations
echo "📋 GitHub OAuth Configuration (from migrations file):"
if [ -n "$GITHUB_CLIENT_ID" ]; then
  set_env_var "GITHUB_CLIENT_ID" "$GITHUB_CLIENT_ID" "production"
  set_env_var "GITHUB_CLIENT_ID" "$GITHUB_CLIENT_ID" "preview"
  set_env_var "GITHUB_CLIENT_ID" "$GITHUB_CLIENT_ID" "development"
fi

if [ -n "$GITHUB_CLIENT_SECRET" ]; then
  set_env_var "GITHUB_CLIENT_SECRET" "$GITHUB_CLIENT_SECRET" "production"
  set_env_var "GITHUB_CLIENT_SECRET" "$GITHUB_CLIENT_SECRET" "preview"
  set_env_var "GITHUB_CLIENT_SECRET" "$GITHUB_CLIENT_SECRET" "development"
fi

if [ -n "$GITHUB_REDIRECT_URI" ]; then
  # Update redirect URI for production if needed
  read -p "Update GITHUB_OAUTH_CALLBACK_URL for production? (current: $GITHUB_REDIRECT_URI) (y/N): " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "Enter production callback URL: " PROD_CALLBACK
    if [ -n "$PROD_CALLBACK" ]; then
      set_env_var "GITHUB_OAUTH_CALLBACK_URL" "$PROD_CALLBACK" "production"
    fi
  else
    set_env_var "GITHUB_OAUTH_CALLBACK_URL" "$GITHUB_REDIRECT_URI" "production"
  fi
  set_env_var "GITHUB_OAUTH_CALLBACK_URL" "$GITHUB_REDIRECT_URI" "preview"
  set_env_var "GITHUB_OAUTH_CALLBACK_URL" "$GITHUB_REDIRECT_URI" "development"
fi

# Set encryption key as API_KEYS_ENCRYPTION_KEY
if [ -n "$ENCRYPTION_KEY" ]; then
  echo "📋 API Keys Encryption (from migrations file):"
  set_env_var "API_KEYS_ENCRYPTION_KEY" "$ENCRYPTION_KEY" "production"
  set_env_var "API_KEYS_ENCRYPTION_KEY" "$ENCRYPTION_KEY" "preview"
  set_env_var "API_KEYS_ENCRYPTION_KEY" "$ENCRYPTION_KEY" "development"
fi

# Set optional variables
echo "📋 Optional Variables:"
read -p "Set NEXT_PUBLIC_JANITOR_ENABLED? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  set_env_var "NEXT_PUBLIC_JANITOR_ENABLED" "true" "production"
  set_env_var "NEXT_PUBLIC_JANITOR_ENABLED" "true" "preview"
  set_env_var "NEXT_PUBLIC_JANITOR_ENABLED" "true" "development"
fi

read -p "Set NEXT_PUBLIC_JANITOR_OVERNIGHT_MODE? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  set_env_var "NEXT_PUBLIC_JANITOR_OVERNIGHT_MODE" "true" "production"
  set_env_var "NEXT_PUBLIC_JANITOR_OVERNIGHT_MODE" "true" "preview"
  set_env_var "NEXT_PUBLIC_JANITOR_OVERNIGHT_MODE" "true" "development"
fi

echo ""
echo "✅ Environment variables setup complete!"
echo ""
echo "📝 Verifying..."
vercel env ls
echo ""
echo "🚀 Next step: vercel --prod (to deploy with new env vars)"

