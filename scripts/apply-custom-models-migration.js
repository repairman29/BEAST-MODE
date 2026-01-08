#!/usr/bin/env node

/**
 * Apply Custom Models Migration
 * 
 * Applies the custom_models table migration to Supabase.
 * Uses multiple methods: CLI → exec_sql → Management API
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const MIGRATION_FILE = path.join(__dirname, '../supabase/migrations/20250108000001_create_custom_models_table.sql');

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

console.log('🚀 Applying Custom Models Migration...\n');

// Method 1: Try Supabase CLI (fastest if linked)
function tryCLI() {
  try {
    console.log('📋 Method 1: Trying Supabase CLI...');
    const result = execSync(
      'cd .. && supabase db push --linked --include-all --yes',
      { encoding: 'utf-8', stdio: 'pipe', cwd: __dirname }
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
    console.log('\n📋 Method 2: Trying exec_sql RPC...');
    
    const { createClient } = require('@supabase/supabase-js');
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.log('⚠️  Missing Supabase credentials');
      return false;
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    const sql = fs.readFileSync(MIGRATION_FILE, 'utf8');
    
    // Try exec_sql RPC function
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.log('⚠️  exec_sql RPC not available');
      return false;
    }
    
    console.log('✅ Migration applied via exec_sql!');
    return true;
  } catch (error) {
    console.log('⚠️  exec_sql method failed');
    return false;
  }
}

// Method 3: Manual instructions
function showManualInstructions() {
  console.log('\n⚠️  Automated methods failed. Manual steps:');
  console.log('\nOption 1: Apply via Supabase CLI:');
  console.log('  cd BEAST-MODE-PRODUCT');
  console.log('  supabase link --project-ref YOUR_PROJECT_REF');
  console.log('  supabase db push --linked --include-all --yes');
  
  console.log('\nOption 2: Apply via Supabase Dashboard SQL Editor:');
  console.log('  1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT_REF/sql');
  console.log('  2. Click "New query"');
  console.log('  3. Paste the SQL from:', MIGRATION_FILE);
  console.log('  4. Click "Run"');
  
  console.log('\n📄 Migration file location:');
  console.log(`   ${MIGRATION_FILE}`);
}

// Main
async function main() {
  // Check if migration file exists
  if (!fs.existsSync(MIGRATION_FILE)) {
    console.error(`❌ Migration file not found: ${MIGRATION_FILE}`);
    process.exit(1);
  }
  
  // Try CLI first
  if (tryCLI()) {
    console.log('\n✅ Migration applied successfully!');
    return;
  }
  
  // Try exec_sql
  if (await tryExecSQL()) {
    console.log('\n✅ Migration applied successfully!');
    return;
  }
  
  // Show manual instructions
  showManualInstructions();
}

main().catch(error => {
  console.error('\n❌ Error:', error);
  process.exit(1);
});
