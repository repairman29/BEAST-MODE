#!/usr/bin/env node

/**
 * Upload ML Artifacts to Supabase Storage
 * CLI/API-First: No UI required - everything automated!
 * 
 * Uploads large ML training data, models, and catalog files to Supabase Storage
 * 
 * Usage:
 *   node scripts/upload-ml-artifacts-to-storage.js
 *   node scripts/upload-ml-artifacts-to-storage.js --dry-run
 *   node scripts/upload-ml-artifacts-to-storage.js --file path/to/file.json
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.join(__dirname, '../website/.env.local') });

const BUCKET_NAME = 'ml-artifacts';
const BEAST_MODE_DIR = path.join(__dirname, '..');
const TRAINING_DATA_DIR = path.join(BEAST_MODE_DIR, '.beast-mode/training-data');
const MODELS_DIR = path.join(BEAST_MODE_DIR, '.beast-mode/models');
const CATALOG_DIR = path.join(__dirname, '../../payload-cli/docs/repo-catalog');
const ORACLE_DIR = path.join(__dirname, '../../smuggler-oracle/data');
const AUDIT_DIR = path.join(BEAST_MODE_DIR, '.beast-mode/audit');

// Files to upload (organized by folder)
const FILES_TO_UPLOAD = {
  'training-data': [
    'enhanced-features-*.json',  // 3-3.4MB files
    'dataset.json',              // If > 100KB
    'dataset-split.json',        // If > 100KB
    'high-quality-repos-analysis.json',  // 172KB
    'scanned-repos/scanned-repos-*.json',  // > 500KB files
    'discovered-repos/*.json'  // > 100KB files
  ],
  'models': [
    'model-notable-quality-*.json'  // > 500KB files
  ],
  'catalogs': [
    'COMPLETE_CATALOG_FIXED.json',  // 5.5MB
    'TOP_REPOS_WITH_CODE.json',     // 4.4MB
    'COMPLETE_CATALOG.json'          // 1.1MB
  ],
  'oracle': [
    'oracle-embeddings.json',  // 11MB - HIGH PRIORITY!
    'oracle_manifest.json'     // 3.6MB
  ],
  'audit': [
    'export-*.json',  // > 500KB files
    'audit-*.jsonl'   // > 500KB files
  ]
};

class MLArtifactUploader {
  constructor() {
    this.supabase = null;
    this.dryRun = process.argv.includes('--dry-run');
    this.specificFile = process.argv.find(arg => arg.startsWith('--file='))?.split('=')[1];
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
    console.log('✅ Supabase client initialized');
  }

  log(message, type = 'info') {
    const icons = { info: 'ℹ️', success: '✅', error: '❌', warning: '⚠️', step: '📤' };
    const prefix = this.dryRun ? '[DRY RUN]' : '';
    console.log(`${icons[type] || '•'} ${prefix} ${message}`);
  }

  async checkBucketExists() {
    try {
      const { data, error } = await this.supabase.storage.listBuckets();
      
      if (error) {
        this.log(`Error checking buckets: ${error.message}`, 'error');
        return false;
      }

      const bucket = data.find(b => b.name === BUCKET_NAME);
      if (!bucket) {
        this.log(`Bucket '${BUCKET_NAME}' does not exist!`, 'error');
        this.log('   Run migration first: supabase db push --linked --include-all --yes', 'warning');
        this.log('   Or apply migration: node scripts/apply-ml-storage-migration.js', 'warning');
        return false;
      }

      this.log(`Bucket '${BUCKET_NAME}' exists`, 'success');
      return true;
    } catch (error) {
      this.log(`Error checking bucket: ${error.message}`, 'error');
      return false;
    }
  }

  getFileSize(filePath) {
    try {
      const stats = fs.statSync(filePath);
      return stats.size;
    } catch (error) {
      return 0;
    }
  }

  formatSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  findFiles(pattern, directory) {
    const files = [];
    
    if (!fs.existsSync(directory)) {
      return files;
    }

    // Handle patterns with subdirectories (e.g., 'scanned-repos/*.json')
    if (pattern.includes('/')) {
      const [subdir, filePattern] = pattern.split('/');
      const subdirPath = path.join(directory, subdir);
      if (fs.existsSync(subdirPath) && fs.statSync(subdirPath).isDirectory()) {
        const dirFiles = fs.readdirSync(subdirPath);
        const regex = new RegExp('^' + filePattern.replace(/\*/g, '.*') + '$');
        for (const file of dirFiles) {
          if (regex.test(file)) {
            const filePath = path.join(subdirPath, file);
            if (fs.statSync(filePath).isFile()) {
              files.push(filePath);
            }
          }
        }
      }
      return files;
    }

    // Handle simple patterns
    const dirFiles = fs.readdirSync(directory);
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');

    for (const file of dirFiles) {
      if (regex.test(file)) {
        const filePath = path.join(directory, file);
        if (fs.statSync(filePath).isFile()) {
          files.push(filePath);
        }
      }
    }

    return files;
  }

  async uploadFile(localPath, storageFolder) {
    const fileName = path.basename(localPath);
    const storagePath = `${storageFolder}/${fileName}`;
    const fileSize = this.getFileSize(localPath);

    this.log(`Uploading: ${fileName} (${this.formatSize(fileSize)})`, 'step');

    if (this.dryRun) {
      this.log(`  Would upload to: ${storagePath}`, 'info');
      return { success: true, path: storagePath };
    }

    try {
      const fileContent = fs.readFileSync(localPath);
      
      const { data, error } = await this.supabase.storage
        .from(BUCKET_NAME)
        .upload(storagePath, fileContent, {
          contentType: 'application/json',
          upsert: true // Overwrite if exists
        });

      if (error) {
        this.log(`  Error: ${error.message}`, 'error');
        return { success: false, error: error.message };
      }

      this.log(`  ✅ Uploaded: ${storagePath}`, 'success');
      return { success: true, path: storagePath, data };
    } catch (error) {
      this.log(`  Error: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  }

  async uploadAllFiles() {
    if (!await this.checkBucketExists()) {
      return false;
    }

    const results = {
      uploaded: [],
      failed: [],
      skipped: []
    };

    // Upload training data files
    this.log('\n📊 Uploading training data files...', 'info');
    for (const pattern of FILES_TO_UPLOAD['training-data']) {
      const files = this.findFiles(pattern, TRAINING_DATA_DIR);
      for (const file of files) {
        const size = this.getFileSize(file);
        if (size > 100 * 1024) { // > 100KB
          const result = await this.uploadFile(file, 'training-data');
          if (result.success) {
            results.uploaded.push(result.path);
          } else {
            results.failed.push({ path: file, error: result.error });
          }
        } else {
          results.skipped.push({ path: file, reason: 'Too small (< 100KB)' });
        }
      }
    }

    // Upload model files
    this.log('\n🤖 Uploading model files...', 'info');
    for (const pattern of FILES_TO_UPLOAD['models']) {
      const files = this.findFiles(pattern, MODELS_DIR);
      for (const file of files) {
        const size = this.getFileSize(file);
        if (size > 500 * 1024) { // > 500KB
          const result = await this.uploadFile(file, 'models');
          if (result.success) {
            results.uploaded.push(result.path);
          } else {
            results.failed.push({ path: file, error: result.error });
          }
        } else {
          results.skipped.push({ path: file, reason: 'Too small (< 500KB)' });
        }
      }
    }

    // Upload catalog files
    this.log('\n📚 Uploading catalog files...', 'info');
    for (const pattern of FILES_TO_UPLOAD['catalogs']) {
      const files = this.findFiles(pattern, CATALOG_DIR);
      for (const file of files) {
        const size = this.getFileSize(file);
        if (size > 100 * 1024) { // > 100KB
          const result = await this.uploadFile(file, 'catalogs');
          if (result.success) {
            results.uploaded.push(result.path);
          } else {
            results.failed.push({ path: file, error: result.error });
          }
        } else {
          results.skipped.push({ path: file, reason: 'Too small (< 100KB)' });
        }
      }
    }

    // Upload Oracle files (HIGH PRIORITY - 11MB + 3.6MB)
    this.log('\n🔮 Uploading Oracle files...', 'info');
    for (const pattern of FILES_TO_UPLOAD['oracle']) {
      const files = this.findFiles(pattern, ORACLE_DIR);
      for (const file of files) {
        const size = this.getFileSize(file);
        if (size > 100 * 1024) { // > 100KB
          const result = await this.uploadFile(file, 'oracle');
          if (result.success) {
            results.uploaded.push(result.path);
          } else {
            results.failed.push({ path: file, error: result.error });
          }
        } else {
          results.skipped.push({ path: file, reason: 'Too small (< 100KB)' });
        }
      }
    }

    // Upload audit files
    this.log('\n📋 Uploading audit files...', 'info');
    for (const pattern of FILES_TO_UPLOAD['audit']) {
      const files = this.findFiles(pattern, AUDIT_DIR);
      for (const file of files) {
        const size = this.getFileSize(file);
        if (size > 500 * 1024) { // > 500KB for audit files
          const folder = file.endsWith('.jsonl') ? 'audit/logs' : 'audit/exports';
          const result = await this.uploadFile(file, folder);
          if (result.success) {
            results.uploaded.push(result.path);
          } else {
            results.failed.push({ path: file, error: result.error });
          }
        } else {
          results.skipped.push({ path: file, reason: 'Too small (< 500KB)' });
        }
      }
    }

    // Summary
    this.log('\n📊 Upload Summary:', 'info');
    this.log(`  ✅ Uploaded: ${results.uploaded.length}`, 'success');
    this.log(`  ❌ Failed: ${results.failed.length}`, results.failed.length > 0 ? 'error' : 'info');
    this.log(`  ⏭️  Skipped: ${results.skipped.length}`, 'info');

    if (results.failed.length > 0) {
      this.log('\n❌ Failed uploads:', 'error');
      results.failed.forEach(({ path, error }) => {
        this.log(`  ${path}: ${error}`, 'error');
      });
    }

    if (results.skipped.length > 0 && !this.dryRun) {
      this.log('\n⏭️  Skipped files (too small):', 'info');
      results.skipped.forEach(({ path, reason }) => {
        this.log(`  ${path}: ${reason}`, 'info');
      });
    }

    return results.uploaded.length > 0;
  }

  async uploadSpecificFile(filePath) {
    if (!fs.existsSync(filePath)) {
      this.log(`File not found: ${filePath}`, 'error');
      return false;
    }

    if (!await this.checkBucketExists()) {
      return false;
    }

    // Determine folder based on file location
    let folder = 'exports';
    if (filePath.includes('training-data') || filePath.includes('.beast-mode/training-data')) {
      folder = 'training-data';
    } else if (filePath.includes('models') || filePath.includes('.beast-mode/models')) {
      folder = 'models';
    } else if (filePath.includes('catalog') || filePath.includes('repo-catalog')) {
      folder = 'catalogs';
    } else if (filePath.includes('oracle') || filePath.includes('smuggler-oracle')) {
      folder = 'oracle';
    } else if (filePath.includes('audit') || filePath.includes('.beast-mode/audit')) {
      folder = filePath.endsWith('.jsonl') ? 'audit/logs' : 'audit/exports';
    }

    const result = await this.uploadFile(filePath, folder);
    return result.success;
  }

  async run() {
    console.log('🚀 ML Artifacts Uploader\n');
    console.log('📋 CLI/API-First: No UI required - everything automated!\n');

    if (this.dryRun) {
      this.log('DRY RUN MODE - No files will be uploaded', 'warning');
    }

    if (this.specificFile) {
      await this.uploadSpecificFile(this.specificFile);
    } else {
      await this.uploadAllFiles();
    }

    console.log('\n✅ Done!');
  }
}

// Run if called directly
if (require.main === module) {
  const uploader = new MLArtifactUploader();
  uploader.run().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { MLArtifactUploader };

