#!/bin/bash

# Set Vercel Environment Variables for Day 2 Operations (Janitor)
# Automated version - reads from .env.local or prompts
# Usage: ./scripts/set-vercel-env-janitor-auto.sh

set -e

echo "🔧 Setting Vercel Environment Variables for Day 2 Operations (Auto)..."
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

# Load .env.local if it exists
if [ -f "$PROJECT_DIR/.env.local" ]; then
  echo "📄 Loading values from .env.local..."
  source <(grep -v '^#' "$PROJECT_DIR/.env.local" | grep -v '^$' | sed 's/^/export /')
  echo ""
fi

# Required environment variables
declare -A ENV_VARS=(
  ["NEXT_PUBLIC_SUPABASE_URL"]="Supabase project URL"
  ["NEXT_PUBLIC_SUPABASE_ANON_KEY"]="Supabase anonymous key"
  ["SUPABASE_SERVICE_ROLE_KEY"]="Supabase service role key"
  ["API_KEYS_ENCRYPTION_KEY"]="API keys encryption key"
  ["GITHUB_CLIENT_ID"]="GitHub OAuth client ID"
  ["GITHUB_CLIENT_SECRET"]="GitHub OAuth client secret"
  ["GITHUB_OAUTH_CALLBACK_URL"]="GitHub OAuth callback URL"
)

# Optional environment variables with defaults
declare -A OPTIONAL_ENV_VARS=(
  ["NEXT_PUBLIC_JANITOR_ENABLED"]="true"
  ["NEXT_PUBLIC_JANITOR_OVERNIGHT_MODE"]="true"
  ["JWT_SECRET"]=""
)

# Function to get value from env or prompt
get_value() {
  local key=$1
  local description=$2
  
  # Check if already in environment
  local env_key=$(echo "$key" | tr '[:lower:]' '[:upper:]' | tr '-' '_')
  local value="${!env_key}"
  
  if [ -n "$value" ]; then
    echo "$value"
    return
  fi
  
  # Prompt for value
  read -sp "Enter $description: " value
  echo
  echo "$value"
}

# Function to set environment variable
set_env_var() {
  local key=$1
  local description=$2
  local value=$3
  local environment=${4:-production}
  
  if [ -z "$value" ]; then
    echo "⚠️  Skipping $key (empty value)"
    return
  fi
  
  echo "Setting: $key"
  echo "  Environment: $environment"
  
  # Set the variable
  echo "$value" | vercel env add "$key" "$environment" "$PROJECT_DIR" --force 2>&1 | grep -v "already exists" || true
  
  echo "  ✅ Set successfully!"
  echo ""
}

# Set required variables
echo "📋 Setting Required Environment Variables:"
echo ""

for key in "${!ENV_VARS[@]}"; do
  value=$(get_value "$key" "${ENV_VARS[$key]}")
  if [ -n "$value" ]; then
    set_env_var "$key" "${ENV_VARS[$key]}" "$value" "production"
    set_env_var "$key" "${ENV_VARS[$key]}" "$value" "preview"
    set_env_var "$key" "${ENV_VARS[$key]}" "$value" "development"
  fi
done

# Set optional variables
echo ""
echo "📋 Setting Optional Environment Variables:"
echo ""

for key in "${!OPTIONAL_ENV_VARS[@]}"; do
  default_value="${OPTIONAL_ENV_VARS[$key]}"
  if [ -n "$default_value" ]; then
    value=$(get_value "$key" "$key (default: $default_value)")
    if [ -z "$value" ] && [ -n "$default_value" ]; then
      value="$default_value"
    fi
    if [ -n "$value" ]; then
      set_env_var "$key" "$key" "$value" "production"
      set_env_var "$key" "$key" "$value" "preview"
      set_env_var "$key" "$key" "$value" "development"
    fi
  fi
done

echo ""
echo "✅ Environment variables setup complete!"
echo ""
echo "📝 Verifying..."
vercel env ls
echo ""
echo "🚀 Next step: vercel --prod (to deploy with new env vars)"

