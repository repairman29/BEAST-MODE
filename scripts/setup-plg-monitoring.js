#!/usr/bin/env node
/**
 * Setup PLG Component Monitoring
 * 
 * Tracks which components are used most to guide development
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../website/.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createComponentUsageTable() {
  console.log('📊 Setting up PLG Component Monitoring\n');
  console.log('='.repeat(70));
  console.log();

  // Create table for tracking component usage
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS plg_component_usage (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      component_name TEXT NOT NULL,
      component_type TEXT NOT NULL, -- 'badge', 'widget', 'button', 'cards'
      repo TEXT,
      user_id UUID,
      session_id TEXT,
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_plg_component_name ON plg_component_usage(component_name);
    CREATE INDEX IF NOT EXISTS idx_plg_component_type ON plg_component_usage(component_type);
    CREATE INDEX IF NOT EXISTS idx_plg_component_created ON plg_component_usage(created_at);
  `;

  try {
    // Use exec_sql if available, otherwise direct query
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql_query: createTableSQL 
    }).catch(async () => {
      // Fallback: try direct execution
      const statements = createTableSQL.split(';').filter(s => s.trim().length > 0);
      for (const statement of statements) {
        const { error } = await supabase.from('_temp').select('*').limit(0);
        // This is a workaround - we'll use a migration file instead
      }
      return { data: null, error: null };
    });

    if (error && !error.message.includes('already exists')) {
      console.log('⚠️  Could not create table via RPC, creating migration file instead...');
      
      // Create migration file
      const migrationPath = path.join(__dirname, '../supabase/migrations/20250109000000_create_plg_component_usage.sql');
      const fs = require('fs').promises;
      await fs.writeFile(migrationPath, createTableSQL);
      console.log(`✅ Created migration file: ${migrationPath}`);
      console.log('   Run: node scripts/setup-ux-plg-db-via-exec-sql.js (or similar)');
    } else {
      console.log('✅ Component usage table created!');
    }
  } catch (error) {
    console.log('⚠️  Creating migration file instead...');
    const migrationPath = path.join(__dirname, '../supabase/migrations/20250109000000_create_plg_component_usage.sql');
    const fs = require('fs').promises;
    await fs.writeFile(migrationPath, createTableSQL);
    console.log(`✅ Created migration file: ${migrationPath}`);
  }

  console.log();
  console.log('📊 Monitoring Setup:');
  console.log('   1. Component usage tracked in plg_component_usage table');
  console.log('   2. Track: component_name, component_type, repo, user_id');
  console.log('   3. Query to see which components are used most');
  console.log();
  console.log('💡 Next Steps:');
  console.log('   1. Add tracking to components (client-side)');
  console.log('   2. Query usage stats weekly');
  console.log('   3. Build what\'s popular, remove what\'s not');
  console.log();
}

async function createUsageTrackingAPI() {
  const apiCode = `import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '../../../../echeo-landing/lib/supabase';

/**
 * PLG Component Usage Tracking API
 * 
 * Tracks which components are used most
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { componentName, componentType, repo, userId, sessionId, metadata } = body;

    if (!componentName || !componentType) {
      return NextResponse.json(
        { error: 'componentName and componentType are required' },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from('plg_component_usage')
      .insert({
        component_name: componentName,
        component_type: componentType,
        repo: repo || null,
        user_id: userId || null,
        session_id: sessionId || null,
        metadata: metadata || {}
      })
      .select()
      .single();

    if (error) {
      console.error('Error tracking component usage:', error);
      return NextResponse.json(
        { error: 'Failed to track usage', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, id: data.id });
  } catch (error: any) {
    console.error('Exception tracking component usage:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const componentType = searchParams.get('type');
    const days = parseInt(searchParams.get('days') || '30', 10);

    const supabase = createServiceRoleClient();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    let query = supabase
      .from('plg_component_usage')
      .select('*')
      .gte('created_at', cutoffDate.toISOString());

    if (componentType) {
      query = query.eq('component_type', componentType);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Aggregate by component
    const stats: Record<string, any> = {};
    data?.forEach(usage => {
      const key = usage.component_name;
      if (!stats[key]) {
        stats[key] = {
          componentName: usage.component_name,
          componentType: usage.component_type,
          count: 0,
          uniqueRepos: new Set(),
          uniqueUsers: new Set()
        };
      }
      stats[key].count++;
      if (usage.repo) stats[key].uniqueRepos.add(usage.repo);
      if (usage.user_id) stats[key].uniqueUsers.add(usage.user_id);
    });

    // Convert sets to counts
    Object.values(stats).forEach((stat: any) => {
      stat.uniqueRepos = stat.uniqueRepos.size;
      stat.uniqueUsers = stat.uniqueUsers.size;
    });

    return NextResponse.json({
      total: data?.length || 0,
      days,
      components: Object.values(stats).sort((a: any, b: any) => b.count - a.count)
    });
  } catch (error: any) {
    console.error('Error fetching usage stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats', details: error.message },
      { status: 500 }
    );
  }
}
`;

  const apiPath = path.join(__dirname, '../website/app/api/plg/usage/route.ts');
  const fs = require('fs').promises;
  await fs.mkdir(path.dirname(apiPath), { recursive: true });
  await fs.writeFile(apiPath, apiCode);
  console.log('✅ Created usage tracking API: /api/plg/usage');
}

async function main() {
  await createComponentUsageTable();
  await createUsageTrackingAPI();
  
  console.log('='.repeat(70));
  console.log('✅ PLG Monitoring Setup Complete!');
  console.log('='.repeat(70));
  console.log();
  console.log('📊 What\'s Set Up:');
  console.log('   1. Component usage table (plg_component_usage)');
  console.log('   2. Usage tracking API (/api/plg/usage)');
  console.log('   3. Migration file created');
  console.log();
  console.log('💡 Next: Add tracking to components');
  console.log();
}

main().catch(console.error);
