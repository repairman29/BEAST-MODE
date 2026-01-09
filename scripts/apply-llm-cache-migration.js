#!/usr/bin/env node
/**
 * Apply LLM Cache Migration
 * 
 * Applies the L3 cache table migration to Supabase
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs').promises;
require('dotenv').config({ path: path.join(__dirname, '../website/.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('   Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  console.log('📦 Applying LLM Cache Migration\n');
  console.log('='.repeat(70));
  console.log();

  try {
    // Read migration file
    const migrationPath = path.join(__dirname, '../supabase/migrations/20250119000000_create_llm_cache_table.sql');
    const migrationSQL = await fs.readFile(migrationPath, 'utf8');

    console.log('📄 Migration file:', migrationPath);
    console.log('📊 SQL size:', migrationSQL.length, 'bytes');
    console.log();

    // Apply migration via Supabase
    console.log('🔄 Applying migration...');
    
    // Split by semicolons and execute each statement
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    let successCount = 0;
    let errorCount = 0;

    for (const statement of statements) {
      if (statement.length < 10) continue; // Skip very short statements
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
        
        if (error) {
          // If exec_sql doesn't exist, try direct query
          const { error: directError } = await supabase.from('_migrations').select('*').limit(1);
          
          if (directError && directError.message.includes('exec_sql')) {
            console.log('   ⚠️  exec_sql RPC not available, trying direct execution...');
            // For CREATE TABLE, we can use raw SQL via PostgREST if available
            // Otherwise, user will need to apply manually
            console.log('   ℹ️  Please apply migration manually via Supabase Dashboard SQL Editor');
            console.log('   📄 File:', migrationPath);
            return;
          }
          
          // Some errors are expected (IF NOT EXISTS, etc.)
          if (error.message.includes('already exists') || 
              error.message.includes('duplicate') ||
              error.message.includes('IF NOT EXISTS')) {
            console.log('   ⚠️  (Expected):', error.message.split('\n')[0]);
            successCount++;
          } else {
            console.log('   ❌ Error:', error.message.split('\n')[0]);
            errorCount++;
          }
        } else {
          successCount++;
        }
      } catch (err) {
        // Try alternative: direct SQL execution
        console.log('   ⚠️  exec_sql not available, migration needs manual application');
        console.log('   📄 Please run this SQL in Supabase Dashboard SQL Editor:');
        console.log('   📁 File:', migrationPath);
        console.log();
        console.log('   Or use Supabase CLI:');
        console.log('   supabase db push --linked');
        return;
      }
    }

    console.log();
    console.log('='.repeat(70));
    
    if (errorCount === 0) {
      console.log('✅ Migration applied successfully!');
      console.log(`   ${successCount} statements executed`);
    } else {
      console.log('⚠️  Migration completed with some warnings');
      console.log(`   ${successCount} successful, ${errorCount} errors`);
    }

    // Verify table exists
    console.log();
    console.log('🔍 Verifying table creation...');
    const { data, error } = await supabase
      .from('llm_cache')
      .select('*')
      .limit(1);

    if (error && error.message.includes('relation "llm_cache" does not exist')) {
      console.log('   ⚠️  Table not found - migration may need manual application');
      console.log('   📄 Run SQL from:', migrationPath);
    } else if (error) {
      console.log('   ⚠️  Verification error:', error.message);
    } else {
      console.log('   ✅ llm_cache table exists!');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error();
    console.error('📄 Please apply migration manually:');
    console.error('   1. Go to Supabase Dashboard → SQL Editor');
    console.error('   2. Copy contents of: supabase/migrations/20250119000000_create_llm_cache_table.sql');
    console.error('   3. Run the SQL');
    process.exit(1);
  }
}

// Run migration
if (require.main === module) {
  applyMigration().catch(console.error);
}

module.exports = { applyMigration };
