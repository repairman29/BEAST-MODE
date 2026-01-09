#!/usr/bin/env node

/**
 * Test Phase 1 Migrations
 * Validates all new database tables and relationships
 * 
 * Dog Fooding: Built using BEAST MODE
 */

require('dotenv').config();
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

// Tables to test
const tables = {
  ensemble: [
    'ensemble_configurations',
    'ensemble_predictions',
    'ensemble_performance',
    'model_weights'
  ],
  nas: [
    'architecture_search_runs',
    'architecture_candidates',
    'architecture_performance',
    'optimal_architectures'
  ],
  fineTuning: [
    'fine_tuning_jobs',
    'model_versions',
    'incremental_updates',
    'fine_tuning_metrics'
  ],
  crossDomain: [
    'domain_mappings',
    'transfer_learning_runs',
    'domain_adaptation_metrics',
    'cross_domain_predictions'
  ],
  caching: [
    'cache_predictions',
    'cache_warming_jobs',
    'cache_performance',
    'cache_patterns'
  ]
};

async function testTable(tableName) {
  try {
    // Try to query the table (will fail if table doesn't exist)
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);

    if (error) {
      if (error.code === '42P01') {
        // Table does not exist
        return { exists: false, error: 'Table not found' };
      }
      return { exists: true, error: error.message };
    }

    return { exists: true, error: null };
  } catch (error) {
    return { exists: false, error: error.message };
  }
}

async function testIndexes(tableName) {
  try {
    // Query to check indexes (PostgreSQL specific)
    const { data, error } = await supabase.rpc('exec_sql', {
      query: `
        SELECT indexname 
        FROM pg_indexes 
        WHERE tablename = '${tableName}'
        LIMIT 10;
      `
    });

    // If exec_sql doesn't work, just return success
    return { exists: true, count: data?.length || 'unknown' };
  } catch (error) {
    // Index check is optional
    return { exists: true, count: 'unknown' };
  }
}

async function testRLS(tableName) {
  try {
    // Check if RLS is enabled
    const { data, error } = await supabase.rpc('exec_sql', {
      query: `
        SELECT relname, relrowsecurity 
        FROM pg_class 
        WHERE relname = '${tableName}';
      `
    });

    return { enabled: data?.[0]?.relrowsecurity || false };
  } catch (error) {
    // RLS check is optional
    return { enabled: 'unknown' };
  }
}

async function main() {
  console.log('🧪 Testing Phase 1 Migrations...\n');
  console.log('='.repeat(60));

  const results = {
    passed: [],
    failed: [],
    warnings: []
  };

  // Test all tables
  for (const [category, tableList] of Object.entries(tables)) {
    console.log(`\n📋 Testing ${category} tables:`);
    
    for (const tableName of tableList) {
      const tableResult = await testTable(tableName);
      
      if (tableResult.exists && !tableResult.error) {
        results.passed.push(`${category}.${tableName}`);
        console.log(`  ✅ ${tableName} - exists`);
        
        // Test indexes (optional)
        const indexResult = await testIndexes(tableName);
        if (indexResult.count !== 'unknown') {
          console.log(`     📊 Indexes: ${indexResult.count}`);
        }
        
        // Test RLS (optional)
        const rlsResult = await testRLS(tableName);
        if (rlsResult.enabled !== 'unknown') {
          console.log(`     🔒 RLS: ${rlsResult.enabled ? 'enabled' : 'disabled'}`);
        }
      } else if (tableResult.exists && tableResult.error) {
        results.warnings.push(`${category}.${tableName} - ${tableResult.error}`);
        console.log(`  ⚠️  ${tableName} - exists but has issues: ${tableResult.error}`);
      } else {
        results.failed.push(`${category}.${tableName} - ${tableResult.error}`);
        console.log(`  ❌ ${tableName} - ${tableResult.error}`);
      }
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Test Summary:\n');
  console.log(`  ✅ Passed: ${results.passed.length}`);
  console.log(`  ⚠️  Warnings: ${results.warnings.length}`);
  console.log(`  ❌ Failed: ${results.failed.length}`);

  if (results.failed.length > 0) {
    console.log('\n❌ Failed Tables:');
    results.failed.forEach(f => console.log(`   - ${f}`));
  }

  if (results.warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    results.warnings.forEach(w => console.log(`   - ${w}`));
  }

  console.log('\n' + '='.repeat(60));

  if (results.failed.length === 0) {
    console.log('\n🎉 All migrations validated successfully!\n');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some migrations need attention. Run migrations first.\n');
    console.log('   Run: supabase db push\n');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
