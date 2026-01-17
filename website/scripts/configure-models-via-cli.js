#!/usr/bin/env node

/**
 * Configure BEAST MODE Models via Supabase CLI
 * 
 * Uses Supabase CLI to apply the migration (per cursorrules - CLI is 10x faster!)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const migrationFile = path.join(__dirname, '../../supabase/migrations/20250122000000_configure_beast_mode_models.sql');

async function main() {
  console.log('🚀 Configuring BEAST MODE Models via Supabase CLI');
  console.log('='.repeat(60));
  console.log('\nPer cursorrules: CLI is 10x faster than UI!\n');

  // Check if migration file exists
  if (!fs.existsSync(migrationFile)) {
    console.error(`❌ Migration file not found: ${migrationFile}`);
    process.exit(1);
  }

  console.log(`📋 Migration file: ${migrationFile}\n`);

  try {
    // Check if Supabase CLI is installed
    console.log('🔍 Checking Supabase CLI...');
    try {
      execSync('supabase --version', { stdio: 'ignore' });
      console.log('   ✅ Supabase CLI found\n');
    } catch (error) {
      console.error('   ❌ Supabase CLI not found');
      console.error('   Install via: brew install supabase/tap/supabase');
      console.error('   Or: npm install -g supabase');
      process.exit(1);
    }

    // Check if project is linked
    console.log('🔍 Checking if project is linked...');
    try {
      const projectRef = execSync('cat supabase/.temp/project-ref 2>/dev/null', { encoding: 'utf8', cwd: path.join(__dirname, '../..') }).trim();
      if (projectRef) {
        console.log(`   ✅ Project linked: ${projectRef}\n`);
      } else {
        throw new Error('Not linked');
      }
    } catch (error) {
      console.log('   ⚠️  Project not linked');
      console.log('   Linking project...\n');
      
      // Try to link (user will need to provide project ref)
      console.log('   Please run: supabase link --project-ref YOUR_PROJECT_REF');
      console.log('   Or provide project ref:');
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      
      const projectRef = await new Promise((resolve) => {
        rl.question('   Project ref: ', resolve);
      });
      rl.close();
      
      if (projectRef) {
        execSync(`supabase link --project-ref ${projectRef}`, { 
          cwd: path.join(__dirname, '../..'),
          stdio: 'inherit'
        });
        console.log('   ✅ Project linked\n');
      } else {
        console.error('   ❌ Project ref required');
        process.exit(1);
      }
    }

    // Apply migration
    console.log('📝 Applying migration...\n');
    execSync('supabase db push --linked --include-all --yes', {
      cwd: path.join(__dirname, '../..'),
      stdio: 'inherit'
    });

    console.log('\n' + '='.repeat(60));
    console.log('✅ Migration applied successfully!');
    console.log('='.repeat(60));
    console.log('\nNext steps:');
    console.log('1. Test models: node scripts/check-beast-mode-models.js');
    console.log('2. Test code generation: node scripts/test-beast-mode-backend.js');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\nAlternative: Run SQL directly in Supabase SQL Editor:');
    console.error(`   File: ${migrationFile}`);
    process.exit(1);
  }
}

// Handle async main
main().catch(console.error);
