#!/bin/bash
# Check Vercel Deployment Logs
# Usage: ./check-vercel-logs.sh [deployment-url]

set -e

if [ -z "$1" ]; then
  echo "📋 Recent Vercel deployments:"
  vercel list --limit 5
  echo ""
  echo "💡 Usage: ./check-vercel-logs.sh <deployment-url>"
  echo "   Or: vercel logs <deployment-url>"
  exit 0
fi

DEPLOYMENT_URL="$1"
echo "📊 Fetching logs for: $DEPLOYMENT_URL"
echo ""

vercel logs "$DEPLOYMENT_URL" --follow

