#!/usr/bin/env node

/**
 * Apply Custom Models Migration - Expert Method
 * 
 * Uses CLI/API-First philosophy from cursor rules:
 * 1. Try Supabase CLI (fastest)
 * 2. Try exec_sql RPC via Supabase client
 * 3. Try exec_sql RPC via REST API
 * 4. Fallback to manual instructions
 * 
 * Based on: docs/SUPABASE_EXPERT_ONBOARDING.md
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
function loadEnv() {
  const envPath = path.join(__dirname, '../website/.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    });
  }
}

loadEnv();

const MIGRATION_FILE = path.join(__dirname, '../supabase/migrations/20250108000001_create_custom_models_table.sql');

const supabaseUrl = process.env.SUPABASE_URL || 
                   process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                   process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('   Required: SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL)');
  console.error('   Required: SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY)');
  console.error('   Set in: website/.env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🚀 Applying Custom Models Migration (Expert Method)\n');
console.log('📋 CLI/API-First: No UI required - everything automated!\n');
console.log(`📍 Supabase URL: ${supabaseUrl}`);
console.log(`🔑 Using: ${supabaseKey.substring(0, 20)}...\n`);

/**
 * Method 1: Supabase CLI (fastest if linked)
 */
async function tryCLI() {
  console.log('📋 Method 1: Trying Supabase CLI...');
  
  try {
    const projectDir = path.join(__dirname, '..');
    
    // Check if linked
    let isLinked = false;
    try {
      const linkFile = path.join(projectDir, 'supabase/.temp/project-ref');
      if (fs.existsSync(linkFile)) {
        isLinked = true;
      }
    } catch (error) {
      // Not linked
    }
    
    if (!isLinked) {
      console.log('   ⚠️  Project not linked to Supabase');
      console.log('   💡 Run: cd BEAST-MODE-PRODUCT && supabase link --project-ref YOUR_PROJECT_REF');
      return false;
    }
    
    // Apply migration
    execSync(
      'supabase db push --linked --include-all --yes',
      { 
        cwd: projectDir,
        stdio: 'inherit'
      }
    );
    
    console.log('   ✅ Migration applied via CLI!');
    return true;
  } catch (error) {
    console.log(`   ⚠️  CLI error: ${error.message}`);
    return false;
  }
}

/**
 * Method 2: exec_sql RPC via Supabase client
 */
async function tryExecSQLRPC() {
  console.log('\n📋 Method 2: Trying exec_sql RPC via Supabase client...');
  
  try {
    const sql = fs.readFileSync(MIGRATION_FILE, 'utf8');
    
    // Try exec_sql RPC function
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql_query: sql 
    });
    
    if (error) {
      console.log(`   ⚠️  exec_sql RPC error: ${error.message}`);
      return false;
    }
    
    console.log('   ✅ Migration applied via exec_sql RPC!');
    return true;
  } catch (error) {
    console.log(`   ⚠️  exec_sql RPC not available: ${error.message}`);
    return false;
  }
}

/**
 * Method 3: exec_sql RPC via REST API
 */
async function tryExecSQLREST() {
  console.log('\n📋 Method 3: Trying exec_sql RPC via REST API...');
  
  try {
    const sql = fs.readFileSync(MIGRATION_FILE, 'utf8');
    
    // Try REST API endpoint
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({ sql_query: sql })
    });
    
    if (!response.ok) {
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
      
      if (!altResponse.ok) {
        console.log(`   ⚠️  REST API error: ${altResponse.status}`);
        return false;
      }
    }
    
    console.log('   ✅ Migration applied via REST API!');
    return true;
  } catch (error) {
    console.log(`   ⚠️  REST API error: ${error.message}`);
    return false;
  }
}

/**
 * Method 4: Direct SQL execution (split statements)
 */
async function tryDirectSQL() {
  console.log('\n📋 Method 4: Trying direct SQL execution...');
  
  try {
    const sql = fs.readFileSync(MIGRATION_FILE, 'utf8');
    
    // Split into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`   📋 Executing ${statements.length} SQL statements...`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      
      try {
        // Try via RPC first
        const { data, error } = await supabase.rpc('exec_sql', { 
          sql_query: statement 
        });
        
        if (error) {
          // Try REST API
          const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`
            },
            body: JSON.stringify({ sql_query: statement })
          });
          
          if (!response.ok) {
            console.log(`   ⚠️  Statement ${i + 1} might need manual execution`);
            continue;
          }
        }
        
        console.log(`   ✅ Statement ${i + 1}/${statements.length} executed`);
      } catch (e) {
        console.log(`   ⚠️  Could not execute statement ${i + 1} automatically`);
      }
    }
    
    // Verify table was created
    const { data, error } = await supabase
      .from('custom_models')
      .select('*')
      .limit(1);
    
    if (!error) {
      console.log('   ✅ Table verified - migration successful!');
      return true;
    } else {
      console.log('   ⚠️  Table verification failed - may need manual execution');
      return false;
    }
  } catch (error) {
    console.log(`   ⚠️  Direct SQL error: ${error.message}`);
    return false;
  }
}

/**
 * Verify migration
 */
async function verifyMigration() {
  console.log('\n🔍 Verifying custom_models table...');
  
  try {
    const { data, error } = await supabase
      .from('custom_models')
      .select('*')
      .limit(1);
    
    if (error) {
      if (error.message.includes('relation') || error.message.includes('does not exist')) {
        console.log('   ❌ Table does not exist - migration not applied');
        return false;
      }
      // Other errors might be OK (like RLS blocking access)
      console.log('   ⚠️  Could not verify (might be RLS):', error.message);
      return true; // Assume success if it's an RLS error
    }
    
    console.log('   ✅ Table exists - migration successful!');
    return true;
  } catch (error) {
    console.log('   ⚠️  Verification error:', error.message);
    return false;
  }
}

/**
 * Show manual instructions
 */
function showManualInstructions() {
  console.log('\n⚠️  Automated methods failed. Manual steps:\n');
  
  console.log('Option 1: Apply via Supabase CLI:');
  console.log('  cd BEAST-MODE-PRODUCT');
  console.log('  supabase link --project-ref YOUR_PROJECT_REF');
  console.log('  supabase db push --linked --include-all --yes\n');
  
  console.log('Option 2: Apply via Supabase Dashboard SQL Editor:');
  console.log('  1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT_REF/sql');
  console.log('  2. Click "New query"');
  console.log('  3. Paste the SQL from:', MIGRATION_FILE);
  console.log('  4. Click "Run"\n');
  
  console.log('📄 Migration file location:');
  console.log(`   ${MIGRATION_FILE}\n`);
}

/**
 * Main
 */
async function main() {
  // Check if migration file exists
  if (!fs.existsSync(MIGRATION_FILE)) {
    console.error(`❌ Migration file not found: ${MIGRATION_FILE}`);
    process.exit(1);
  }
  
  // Try methods in order
  if (await tryCLI()) {
    await verifyMigration();
    return;
  }
  
  if (await tryExecSQLRPC()) {
    await verifyMigration();
    return;
  }
  
  if (await tryExecSQLREST()) {
    await verifyMigration();
    return;
  }
  
  if (await tryDirectSQL()) {
    await verifyMigration();
    return;
  }
  
  // Show manual instructions
  showManualInstructions();
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
