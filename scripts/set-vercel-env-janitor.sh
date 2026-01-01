#!/bin/bash

# Set Vercel Environment Variables for Day 2 Operations (Janitor)
# Usage: ./scripts/set-vercel-env-janitor.sh

set -e

echo "🔧 Setting Vercel Environment Variables for Day 2 Operations..."
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
cd "$(dirname "$0")/.."

# Required environment variables
declare -A ENV_VARS=(
  ["NEXT_PUBLIC_SUPABASE_URL"]="Supabase project URL"
  ["NEXT_PUBLIC_SUPABASE_ANON_KEY"]="Supabase anonymous key"
  ["SUPABASE_SERVICE_ROLE_KEY"]="Supabase service role key"
  ["API_KEYS_ENCRYPTION_KEY"]="API keys encryption key (32+ chars)"
  ["GITHUB_CLIENT_ID"]="GitHub OAuth client ID"
  ["GITHUB_CLIENT_SECRET"]="GitHub OAuth client secret"
  ["GITHUB_OAUTH_CALLBACK_URL"]="GitHub OAuth callback URL"
)

# Optional environment variables
declare -A OPTIONAL_ENV_VARS=(
  ["NEXT_PUBLIC_JANITOR_ENABLED"]="true"
  ["NEXT_PUBLIC_JANITOR_OVERNIGHT_MODE"]="true"
  ["JWT_SECRET"]="JWT secret for sessions"
)

echo "📋 Required Environment Variables:"
echo ""

# Function to set environment variable
set_env_var() {
  local key=$1
  local description=$2
  local environment=${3:-production}
  
  echo "Setting: $key"
  echo "  Description: $description"
  echo "  Environment: $environment"
  
  # Check if already set
  if vercel env ls "$key" --environment "$environment" &> /dev/null; then
    read -p "  ⚠️  Already exists. Overwrite? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      echo "  ⏭️  Skipping..."
      return
    fi
  fi
  
  # Prompt for value
  read -sp "  Enter value: " value
  echo
  
  if [ -z "$value" ]; then
    echo "  ⚠️  Empty value, skipping..."
    return
  fi
  
  # Set for production
  echo "$value" | vercel env add "$key" production "$PROJECT_DIR"
  
  # Also set for preview (optional)
  read -p "  Set for preview environment too? (y/N): " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "$value" | vercel env add "$key" preview "$PROJECT_DIR"
  fi
  
  # Also set for development (optional)
  read -p "  Set for development environment too? (y/N): " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "$value" | vercel env add "$key" development "$PROJECT_DIR"
  fi
  
  echo "  ✅ Set successfully!"
  echo ""
}

# Set required variables
for key in "${!ENV_VARS[@]}"; do
  set_env_var "$key" "${ENV_VARS[$key]}"
done

# Set optional variables
echo ""
echo "📋 Optional Environment Variables:"
echo ""

for key in "${!OPTIONAL_ENV_VARS[@]}"; do
  read -p "Set $key? (y/N): " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    set_env_var "$key" "${OPTIONAL_ENV_VARS[$key]}"
  fi
done

echo ""
echo "✅ Environment variables setup complete!"
echo ""
echo "📝 Next steps:"
echo "  1. Verify variables: vercel env ls"
echo "  2. Redeploy: vercel --prod"
echo ""

