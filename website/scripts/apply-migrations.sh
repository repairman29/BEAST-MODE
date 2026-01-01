#!/bin/bash

# Script to apply all database migrations to Supabase
# Usage: ./scripts/apply-migrations.sh

set -e

echo "🗄️  Applying BEAST MODE Database Migrations to Supabase"
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found"
    echo "   Install: npm install -g supabase"
    echo ""
    echo "   Or apply migrations manually via Supabase Dashboard:"
    echo "   1. Go to Supabase Dashboard → SQL Editor"
    echo "   2. Run each migration file in order:"
    ls -1 supabase/migrations/*.sql | sort
    exit 1
fi

# Check if we're in the right directory
if [ ! -d "supabase/migrations" ]; then
    echo "❌ migrations directory not found"
    echo "   Run this script from the website directory"
    exit 1
fi

echo "📋 Migration files to apply:"
ls -1 supabase/migrations/*.sql | sort
echo ""

# Apply migrations
echo "🚀 Applying migrations..."
supabase db push

echo ""
echo "✅ Migrations applied successfully!"
echo ""
echo "📊 Verify in Supabase Dashboard:"
echo "   • Tables should be created"
echo "   • Indexes should be created"
echo "   • RLS policies should be enabled"

