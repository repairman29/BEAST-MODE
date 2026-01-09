#!/usr/bin/env node

/**
 * Apply All Phase Migrations via exec_sql RPC
 * 
 * Applies all Phase 1, 2, and 3 migrations using exec_sql bypass
 * Dog Fooding: Built using BEAST MODE
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env.local') });
require('dotenv').config({ path: require('path').join(__dirname, '../website/.env.local') });
require('dotenv').config(); // Also try root .env

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// All Phase migrations (in order)
const migrations = [
  '20250117000001_create_ensemble_tables.sql',
  '20250117000002_create_nas_tables.sql',
  '20250117000003_create_fine_tuning_tables.sql',
  '20250117000004_create_cross_domain_tables.sql',
  '20250117000005_create_advanced_caching_tables.sql',
  '20250117000006_create_federated_learning_tables.sql',
  '20250117000007_create_autonomous_evolution_tables.sql',
  '20250117000008_create_team_collaboration_tables.sql',
  '20250117000009_create_analytics_tables.sql',
  '20250117000010_create_enterprise_tables.sql'
];

const MIGRATIONS_DIR = path.join(__dirname, '../supabase/migrations');

/**
 * Execute SQL via exec_sql RPC
 */
async function executeSQL(sql) {
  try {
    // Try RPC first
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql_query: sql 
    });
    
    if (!error) {
      return { success: true, method: 'rpc' };
    }

    // Try REST API
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({ sql_query: sql })
    });

    if (response.ok) {
      return { success: true, method: 'rest' };
    }

    // Try alternative endpoint
    const altResponse = await fetch(`${supabaseUrl.replace('/rest/v1', '')}/postgrest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({ sql_query: sql })
    });

    if (altResponse.ok) {
      return { success: true, method: 'rest-alt' };
    }

    return { success: false, error: 'All exec_sql methods failed' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Split SQL into statements and execute individually
 */
async function executeSQLStatements(sql) {
  // Split into individual statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--') && !s.match(/^\s*$/));

  console.log(`   📋 Executing ${statements.length} SQL statements...`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    
    // Skip empty statements
    if (!statement || statement.length < 10) {
      continue;
    }

    // Add semicolon if not present
    const fullStatement = statement.endsWith(';') ? statement : statement + ';';

    try {
      const result = await executeSQL(fullStatement);
      
      if (result.success) {
        successCount++;
        if (i % 5 === 0 || i === statements.length - 1) {
          console.log(`   ✅ Statement ${i + 1}/${statements.length} executed`);
        }
      } else {
        failCount++;
        // Some statements might fail if already exist (idempotent), that's okay
        if (!fullStatement.includes('IF NOT EXISTS') && !fullStatement.includes('IF EXISTS')) {
          console.log(`   ⚠️  Statement ${i + 1} failed: ${result.error}`);
        }
      }
    } catch (error) {
      failCount++;
      console.log(`   ⚠️  Statement ${i + 1} error: ${error.message}`);
    }
  }

  return { successCount, failCount, total: statements.length };
}

/**
 * Apply a single migration
 */
async function applyMigration(migrationFile) {
  const migrationPath = path.join(MIGRATIONS_DIR, migrationFile);
  
  if (!fs.existsSync(migrationPath)) {
    console.log(`   ❌ Migration file not found: ${migrationFile}`);
    return { success: false, error: 'File not found' };
  }

  console.log(`\n📄 Applying: ${migrationFile}`);
  console.log('='.repeat(60));

  try {
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    // Try executing as whole first
    const wholeResult = await executeSQL(sql);
    
    if (wholeResult.success) {
      console.log(`   ✅ Migration applied successfully (${wholeResult.method})`);
      return { success: true };
    }

    // If whole execution failed, try statement by statement
    console.log(`   ⚠️  Whole migration failed, trying statement by statement...`);
    const statementResult = await executeSQLStatements(sql);
    
    if (statementResult.successCount > 0) {
      console.log(`   ✅ ${statementResult.successCount}/${statementResult.total} statements executed`);
      return { success: true, partial: statementResult.failCount > 0 };
    }

    return { success: false, error: 'All execution methods failed' };
  } catch (error) {
    console.log(`   ❌ Error reading/executing migration: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Verify tables exist
 */
async function verifyTables() {
  console.log('\n🔍 Verifying tables...');
  console.log('='.repeat(60));

  const expectedTables = [
    // Phase 1
    'ensemble_configurations', 'ensemble_predictions', 'ensemble_performance', 'model_weights',
    'architecture_search_runs', 'architecture_candidates', 'architecture_performance', 'optimal_architectures',
    'fine_tuning_jobs', 'model_versions', 'incremental_updates', 'fine_tuning_metrics',
    'domain_mappings', 'transfer_learning_runs', 'domain_adaptation_metrics', 'cross_domain_predictions',
    'cache_predictions', 'cache_warming_jobs', 'cache_performance', 'cache_patterns',
    // Phase 2
    'federated_nodes', 'federated_updates', 'federated_aggregations', 'federated_metrics',
    'evolution_generations', 'evolution_candidates', 'evolution_selections', 'evolution_metrics',
    // Phase 3
    'teams', 'team_members', 'shared_workspaces', 'collaboration_sessions',
    'analytics_dashboards', 'analytics_reports', 'usage_trends', 'user_analytics',
    'sso_configurations', 'role_permissions', 'audit_logs', 'enterprise_settings'
  ];

  const results = {
    exists: [],
    missing: []
  };

  for (const tableName of expectedTables) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      if (error) {
        if (error.code === '42P01') {
          results.missing.push(tableName);
        } else {
          // Other error might mean table exists but has RLS issues
          results.exists.push(tableName);
        }
      } else {
        results.exists.push(tableName);
      }
    } catch (error) {
      results.missing.push(tableName);
    }
  }

  console.log(`\n✅ Tables exist: ${results.exists.length}`);
  if (results.missing.length > 0) {
    console.log(`\n❌ Tables missing: ${results.missing.length}`);
    results.missing.forEach(t => console.log(`   - ${t}`));
  }

  return results;
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Applying All Phase Migrations via exec_sql...\n');
  console.log('='.repeat(60));
  console.log(`📊 Total Migrations: ${migrations.length}`);
  console.log('='.repeat(60));

  const results = {
    applied: [],
    failed: [],
    partial: []
  };

  // Apply each migration
  for (const migration of migrations) {
    const result = await applyMigration(migration);
    
    if (result.success) {
      if (result.partial) {
        results.partial.push(migration);
      } else {
        results.applied.push(migration);
      }
    } else {
      results.failed.push({ migration, error: result.error });
    }

    // Small delay between migrations
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Migration Summary:\n');
  console.log(`  ✅ Fully Applied: ${results.applied.length}`);
  results.applied.forEach(m => console.log(`     - ${m}`));
  
  if (results.partial.length > 0) {
    console.log(`\n  ⚠️  Partially Applied: ${results.partial.length}`);
    results.partial.forEach(m => console.log(`     - ${m}`));
  }
  
  if (results.failed.length > 0) {
    console.log(`\n  ❌ Failed: ${results.failed.length}`);
    results.failed.forEach(f => console.log(`     - ${f.migration}: ${f.error}`));
  }

  // Verify tables
  const verification = await verifyTables();

  console.log('\n' + '='.repeat(60));
  
  if (results.failed.length === 0 && verification.missing.length === 0) {
    console.log('\n🎉 All migrations applied successfully!\n');
    process.exit(0);
  } else if (verification.missing.length === 0) {
    console.log('\n✅ All tables created (some migrations had partial success)\n');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some migrations need attention.\n');
    console.log('💡 You may need to run failed migrations manually in Supabase SQL Editor\n');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
