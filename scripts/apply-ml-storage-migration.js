#!/usr/bin/env node

/**
 * Apply ML Storage Migration
 * CLI/API-First: No UI required - everything automated!
 * 
 * Applies the ml-artifacts storage bucket migration using CLI/API methods
 * 
 * Usage:
 *   node scripts/apply-ml-storage-migration.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.join(__dirname, '../website/.env.local') });

const MIGRATION_FILE = path.join(__dirname, '../supabase/migrations/20250106000000_create_ml_artifacts_storage_bucket.sql');
const BUCKET_NAME = 'ml-artifacts';

class MLStorageMigrationApplier {
  constructor() {
    this.supabase = null;
    this.initSupabase();
  }

  initSupabase() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Missing Supabase credentials!');
      console.error('   Required: NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL)');
      console.error('   Required: SUPABASE_SERVICE_ROLE_KEY');
      console.error('   Set in: website/.env.local');
      process.exit(1);
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  log(message, type = 'info') {
    const icons = { info: 'ℹ️', success: '✅', error: '❌', warning: '⚠️', step: '🔧' };
    console.log(`${icons[type] || '•'} ${message}`);
  }

  async checkBucketExists() {
    try {
      const { data, error } = await this.supabase.storage.listBuckets();
      
      if (error) {
        return false;
      }

      return data.some(b => b.name === BUCKET_NAME);
    } catch (error) {
      return false;
    }
  }

  async createBucketViaAPI() {
    this.log('Creating bucket via Storage API...', 'step');

    try {
      // Note: Supabase Storage API doesn't have a direct create bucket endpoint
      // We need to use the Management API or SQL
      // For now, we'll use the SQL migration approach
      
      // Read migration SQL
      const sql = fs.readFileSync(MIGRATION_FILE, 'utf8');
      
      // Extract bucket creation SQL (the commented INSERT statement)
      const bucketInsertMatch = sql.match(/INSERT INTO storage\.buckets[^;]+;/s);
      
      if (!bucketInsertMatch) {
        this.log('Could not extract bucket creation SQL from migration', 'error');
        return false;
      }

      // Execute via RPC if exec_sql exists, otherwise use Management API
      // For now, we'll guide the user to use CLI
      this.log('Bucket creation requires SQL execution', 'info');
      this.log('Using Supabase CLI method...', 'step');
      return false; // Will fall back to CLI
    } catch (error) {
      this.log(`Error creating bucket via API: ${error.message}`, 'error');
      return false;
    }
  }

  async applyViaCLI() {
    this.log('Applying migration via Supabase CLI...', 'step');

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
        this.log('Project not linked to Supabase', 'warning');
        this.log('Run: cd BEAST-MODE-PRODUCT && supabase link --project-ref YOUR_PROJECT_REF', 'info');
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

      this.log('Migration applied via CLI', 'success');
      return true;
    } catch (error) {
      this.log(`CLI error: ${error.message}`, 'error');
      return false;
    }
  }

  async verifyBucket() {
    this.log('Verifying bucket exists...', 'step');
    
    const exists = await this.checkBucketExists();
    if (exists) {
      this.log(`Bucket '${BUCKET_NAME}' exists and is ready!`, 'success');
      return true;
    } else {
      this.log(`Bucket '${BUCKET_NAME}' not found`, 'error');
      return false;
    }
  }

  async run() {
    console.log('🚀 ML Storage Migration Applier\n');
    console.log('📋 CLI/API-First: No UI required - everything automated!\n');

    // Check if already exists
    if (await this.checkBucketExists()) {
      this.log(`Bucket '${BUCKET_NAME}' already exists!`, 'success');
      return;
    }

    // Try CLI first (recommended)
    this.log('Method 1: Applying via Supabase CLI...', 'info');
    const cliSuccess = await this.applyViaCLI();

    if (cliSuccess) {
      await this.verifyBucket();
      return;
    }

    // Fallback: Manual instructions
    this.log('\n⚠️  CLI method failed. Manual steps:', 'warning');
    this.log('\nOption 1: Apply migration via CLI manually:', 'info');
    this.log('  cd BEAST-MODE-PRODUCT', 'info');
    this.log('  supabase db push --linked --include-all --yes', 'info');
    
    this.log('\nOption 2: Create bucket via SQL Editor (one-time):', 'info');
    this.log('  1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT_REF/storage/buckets', 'info');
    this.log('  2. Click "New bucket"', 'info');
    this.log('  3. Name: ml-artifacts', 'info');
    this.log('  4. Public: false (private)', 'info');
    this.log('  5. File size limit: 50MB', 'info');
    this.log('  6. Then run policies SQL from migration file', 'info');
    
    this.log('\nOption 3: Use Management API script:', 'info');
    this.log('  (Requires supabase login first)', 'info');
    this.log('  node scripts/create-bucket-via-management-api.js', 'info');

    // Read migration SQL for reference
    const sql = fs.readFileSync(MIGRATION_FILE, 'utf8');
    this.log('\n📄 Migration SQL file:', 'info');
    this.log(`   ${MIGRATION_FILE}`, 'info');
  }
}

// Run if called directly
if (require.main === module) {
  const applier = new MLStorageMigrationApplier();
  applier.run().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { MLStorageMigrationApplier };

