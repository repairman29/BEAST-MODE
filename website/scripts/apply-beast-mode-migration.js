#!/usr/bin/env node

/**
 * Apply BEAST MODE subscriptions migration
 * Uses multiple methods: CLI → exec_sql → Management API
 * Based on expert docs: CLI/API-FIRST philosophy
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const MIGRATION_FILE = path.join(__dirname, '../supabase/migrations/20250121000001_create_beast_mode_subscriptions.sql');

console.log('🚀 Applying BEAST MODE subscriptions migration...\n');

// Method 1: Try Supabase CLI (fastest if linked)
function tryCLI() {
  try {
    console.log('📋 Method 1: Trying Supabase CLI...');
    const result = execSync(
      'cd website && supabase db push --linked --include-all --yes',
      { encoding: 'utf-8', stdio: 'pipe' }
    );
    console.log('✅ Migration applied via CLI!');
    return true;
  } catch (error) {
    console.log('⚠️  CLI not available or not linked');
    return false;
  }
}

// Method 2: Try direct SQL execution via exec_sql RPC
async function tryExecSQL() {
  try {
    console.log('📋 Method 2: Trying exec_sql RPC...');
    const { createClient } = require('@supabase/supabase-js');
    require('dotenv').config({ path: path.join(__dirname, '../.env.local') });
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.log('⚠️  Missing Supabase credentials');
      return false;
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    const sql = fs.readFileSync(MIGRATION_FILE, 'utf-8');
    
    // Split SQL into statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    for (const statement of statements) {
      const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
      if (error) {
        console.log('⚠️  exec_sql RPC not available or error:', error.message);
        return false;
      }
    }
    
    console.log('✅ Migration applied via exec_sql RPC!');
    return true;
  } catch (error) {
    console.log('⚠️  exec_sql method failed:', error.message);
    return false;
  }
}

// Method 3: Manual instructions
function showManualInstructions() {
  console.log('\n📋 Method 3: Manual Application Required\n');
  console.log('The migration file is ready. Apply it manually:');
  console.log(`\n1. Open: ${MIGRATION_FILE}`);
  console.log('2. Copy the SQL content');
  console.log('3. Go to Supabase Dashboard → SQL Editor');
  console.log('4. Paste and run the SQL');
  console.log('\nOr use Supabase CLI:');
  console.log('  cd website && supabase link --project-ref YOUR_PROJECT_REF');
  console.log('  supabase db push --linked --include-all --yes');
}

// Main execution
async function main() {
  if (!fs.existsSync(MIGRATION_FILE)) {
    console.error(`❌ Migration file not found: ${MIGRATION_FILE}`);
    process.exit(1);
  }
  
  // Try methods in order
  if (tryCLI()) {
    console.log('\n✅ Migration complete!');
    return;
  }
  
  if (await tryExecSQL()) {
    console.log('\n✅ Migration complete!');
    return;
  }
  
  showManualInstructions();
}

main().catch(console.error);

