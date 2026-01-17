#!/usr/bin/env node

/**
 * Apply Model Configuration Migration Directly
 * 
 * Uses Supabase CLI to execute SQL directly, bypassing migration history conflicts
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const migrationFile = path.join(__dirname, '../supabase/migrations/20250122000000_configure_beast_mode_models.sql');

async function main() {
  console.log('🚀 Applying BEAST MODE Model Configuration');
  console.log('='.repeat(60));
  console.log('\nUsing Supabase CLI to execute SQL directly\n');

  if (!fs.existsSync(migrationFile)) {
    console.error(`❌ Migration file not found: ${migrationFile}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(migrationFile, 'utf8');
  
  // Extract just the INSERT statement (skip the DO block for now)
  const insertSQL = sql.split('-- Verify')[0].trim();

  console.log('📝 Executing SQL...\n');
  console.log(insertSQL.substring(0, 200) + '...\n');

  try {
    // Use supabase db execute with psql
    // First, get the connection string from the linked project
    const projectRef = execSync('cat supabase/.temp/project-ref', { 
      encoding: 'utf8',
      cwd: path.join(__dirname, '..')
    }).trim();

    console.log(`   Project: ${projectRef}\n`);

    // Try using supabase db execute (newer CLI versions)
    try {
      execSync(`echo "${insertSQL.replace(/"/g, '\\"')}" | supabase db execute --linked`, {
        cwd: path.join(__dirname, '..'),
        stdio: 'inherit'
      });
      console.log('\n✅ Migration applied successfully!');
    } catch (error) {
      // If that doesn't work, try psql directly
      console.log('   Trying alternative method...\n');
      
      // Check for DB password in env
      const envPath = path.join(__dirname, '../website/.env.local');
      let dbPassword = null;
      
      if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        const match = envContent.match(/SUPABASE_DB_PASSWORD=(.+)/);
        if (match) {
          dbPassword = match[1].trim().replace(/^["']|["']$/g, '');
        }
      }

      if (dbPassword) {
        // Use psql with connection string
        const connectionString = `postgresql://postgres:${dbPassword}@db.${projectRef}.supabase.co:5432/postgres`;
        
        execSync(`psql "${connectionString}" -c "${insertSQL.replace(/"/g, '\\"')}"`, {
          stdio: 'inherit'
        });
        console.log('\n✅ Migration applied successfully!');
      } else {
        console.error('❌ SUPABASE_DB_PASSWORD not found in .env.local');
        console.error('   Please add it or use Supabase Dashboard SQL Editor');
        console.error('\n   SQL to execute:');
        console.error('   ' + '='.repeat(60));
        console.error(insertSQL);
        console.error('   ' + '='.repeat(60));
        process.exit(1);
      }
    }

    // Verify
    console.log('\n🔍 Verifying model configuration...\n');
    const verifySQL = `SELECT model_id, model_name, is_active, is_public FROM custom_models WHERE model_id = 'beast-mode-code-generator';`;
    
    try {
      if (dbPassword) {
        const connectionString = `postgresql://postgres:${dbPassword}@db.${projectRef}.supabase.co:5432/postgres`;
        const result = execSync(`psql "${connectionString}" -c "${verifySQL}" -t`, { encoding: 'utf8' });
        console.log('   Result:', result.trim());
      }
    } catch (error) {
      console.log('   ⚠️  Could not verify automatically');
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Configuration Complete!');
    console.log('='.repeat(60));
    console.log('\nNext steps:');
    console.log('1. Test models: cd website && node scripts/check-beast-mode-models.js');
    console.log('2. Test code generation: cd website && node scripts/test-beast-mode-backend.js');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\nAlternative: Copy/paste this SQL into Supabase Dashboard → SQL Editor:');
    console.error('\n' + '='.repeat(60));
    console.error(insertSQL);
    console.error('='.repeat(60));
    process.exit(1);
  }
}

main().catch(console.error);
