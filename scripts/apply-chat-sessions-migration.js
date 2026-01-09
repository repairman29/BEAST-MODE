#!/usr/bin/env node

/**
 * Apply Chat Sessions Migration
 * 
 * Applies the codebase_chat_sessions table migration to Supabase.
 * Uses multiple methods: CLI → exec_sql → Manual instructions
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const MIGRATION_FILE = path.join(__dirname, '../supabase/migrations/20250118000000_create_codebase_chat_sessions.sql');

// Load environment variables
function loadEnv() {
  // Try website/.env.local first
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
  
  // Also try root .env.local
  const rootEnvPath = path.join(__dirname, '../../.env.local');
  if (fs.existsSync(rootEnvPath)) {
    const envContent = fs.readFileSync(rootEnvPath, 'utf8');
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

console.log('🚀 Applying Chat Sessions Migration...\n');
console.log('📋 This will create the codebase_chat_sessions table to prevent chat data loss.\n');

// Method 1: Try Supabase CLI (fastest if linked)
function tryCLI() {
  try {
    console.log('📋 Method 1: Trying Supabase CLI...');
    const projectDir = path.join(__dirname, '..');
    const result = execSync(
      'supabase db push --linked --include-all --yes',
      { encoding: 'utf-8', stdio: 'pipe', cwd: projectDir }
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
      console.log('   Need: SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL)');
      console.log('   Need: SUPABASE_SERVICE_ROLE_KEY');
      return false;
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    const sql = fs.readFileSync(MIGRATION_FILE, 'utf8');
    
    // Try exec_sql RPC function
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.log('⚠️  exec_sql RPC not available or error:', error.message);
      return false;
    }
    
    console.log('✅ Migration applied via exec_sql!');
    return true;
  } catch (error) {
    console.log('⚠️  exec_sql method failed:', error.message);
    return false;
  }
}

// Method 3: Manual instructions
function showManualInstructions() {
  console.log('\n⚠️  Automated methods failed. Manual steps:\n');
  
  console.log('Option 1: Apply via Supabase CLI:');
  console.log('  cd BEAST-MODE-PRODUCT');
  console.log('  supabase link --project-ref YOUR_PROJECT_REF');
  console.log('  supabase db push --linked --include-all --yes');
  
  console.log('\nOption 2: Apply via Supabase Dashboard SQL Editor (Recommended):');
  console.log('  1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT_REF/sql');
  console.log('  2. Click "New query"');
  console.log('  3. Copy and paste the SQL from the migration file');
  console.log('  4. Click "Run"');
  console.log('  5. Verify table was created');
  
  console.log('\n📄 Migration file location:');
  console.log(`   ${MIGRATION_FILE}`);
  
  console.log('\n💡 Quick copy command:');
  console.log(`   cat "${MIGRATION_FILE}" | pbcopy  # macOS`);
  console.log(`   cat "${MIGRATION_FILE}" | xclip -selection clipboard  # Linux`);
}

// Verify migration was applied
async function verifyMigration() {
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.log('\n⚠️  Cannot verify (missing credentials)');
      return false;
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Check if table exists
    const { data, error } = await supabase
      .from('codebase_chat_sessions')
      .select('id')
      .limit(1);
    
    if (error) {
      if (error.code === '42P01') {
        console.log('\n❌ Table does not exist - migration may have failed');
        return false;
      }
      // Other errors might be okay (RLS, etc.)
    }
    
    console.log('\n✅ Verification: Table exists!');
    return true;
  } catch (error) {
    console.log('\n⚠️  Could not verify:', error.message);
    return false;
  }
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
    const verified = await verifyMigration();
    if (verified) {
      console.log('\n🎉 Migration applied and verified successfully!');
      console.log('\n💡 Chat sessions will now persist across server restarts.');
      return;
    }
  }
  
  // Try exec_sql
  if (await tryExecSQL()) {
    const verified = await verifyMigration();
    if (verified) {
      console.log('\n🎉 Migration applied and verified successfully!');
      console.log('\n💡 Chat sessions will now persist across server restarts.');
      return;
    }
  }
  
  // Show manual instructions
  showManualInstructions();
  
  console.log('\n📚 After applying, see: docs/CHAT_SESSION_PERSISTENCE.md');
}

main().catch(error => {
  console.error('\n❌ Error:', error);
  process.exit(1);
});
