#!/usr/bin/env node

/**
 * Verify Storage Access
 * Tests that all archived files can be accessed from Storage
 * Run this before removing local files
 * 
 * Usage:
 *   node scripts/verify-storage-access.js
 */

const { getMLStorageClient } = require('../lib/mlops/storageClient');
const { loadTrainingData, loadScannedRepos, loadModel } = require('../lib/mlops/loadTrainingData');
const fs = require('fs');
const path = require('path');

const ARCHIVED_MANIFEST = path.join(__dirname, '../.beast-mode/archive/ARCHIVED_MANIFEST.json');

class StorageVerifier {
  constructor() {
    this.storage = getMLStorageClient();
    this.verified = [];
    this.failed = [];
  }

  log(message, type = 'info') {
    const icons = { info: 'ℹ️', success: '✅', error: '❌', warning: '⚠️', step: '🔍' };
    console.log(`${icons[type] || '•'} ${message}`);
  }

  async verifyFile(storagePath, fileName) {
    this.log(`Verifying: ${fileName}`, 'step');
    
    const exists = await this.storage.fileExists(storagePath);
    if (exists) {
      // JSONL files don't parse as JSON - just verify they exist
      if (fileName.endsWith('.jsonl')) {
        const size = await this.storage.getFileSize(storagePath);
        this.log(`  ✅ Verified: ${fileName} (${size} bytes, JSONL format)`, 'success');
        this.verified.push({ storagePath, fileName });
        return true;
      }
      
      // Try to load JSON files
      const data = await this.storage.loadJSON(storagePath);
      if (data) {
        const size = JSON.stringify(data).length;
        this.log(`  ✅ Verified: ${fileName} (${size} bytes)`, 'success');
        this.verified.push({ storagePath, fileName });
        return true;
      } else {
        this.log(`  ⚠️  Exists but couldn't load: ${fileName}`, 'warning');
        this.failed.push({ storagePath, fileName, reason: 'Load failed' });
        return false;
      }
    } else {
      this.log(`  ❌ Not found in Storage: ${fileName}`, 'error');
      this.failed.push({ storagePath, fileName, reason: 'Not in Storage' });
      return false;
    }
  }

  async verifyAll() {
    console.log('🔍 Verifying Storage Access\n');
    console.log('═══════════════════════════════════════════════════════\n');

    // Load manifest
    if (!fs.existsSync(ARCHIVED_MANIFEST)) {
      this.log('Manifest not found - no files to verify', 'warning');
      return;
    }

    const manifest = JSON.parse(fs.readFileSync(ARCHIVED_MANIFEST, 'utf8'));
    this.log(`Found ${manifest.files.length} files to verify\n`, 'info');

    // Verify each file
    for (const file of manifest.files) {
      await this.verifyFile(file.storagePath, file.fileName);
    }

    // Summary
    console.log('\n📊 Verification Summary:');
    console.log('═══════════════════════════════════════════════════════');
    this.log(`✅ Verified: ${this.verified.length}`, 'success');
    this.log(`❌ Failed: ${this.failed.length}`, this.failed.length > 0 ? 'error' : 'info');

    if (this.failed.length > 0) {
      console.log('\n❌ Failed verifications:');
      this.failed.forEach(({ fileName, reason }) => {
        this.log(`  ${fileName}: ${reason}`, 'error');
      });
      console.log('\n⚠️  DO NOT remove local files until these are fixed!');
    } else {
      console.log('\n✅ All files verified in Storage!');
      console.log('💡 Safe to remove local files if desired:');
      console.log('   node scripts/archive-files-moved-to-storage.js --remove');
    }
  }

  async testLoaders() {
    console.log('\n🧪 Testing Loader Functions\n');
    console.log('═══════════════════════════════════════════════════════\n');

    // Test loadTrainingData
    this.log('Test 1: loadTrainingData()', 'step');
    const trainingData = await loadTrainingData('enhanced-features-*.json', 'training-data');
    if (trainingData) {
      this.log(`  ✅ Loaded training data (${trainingData.trainingData?.length || 0} repos)`, 'success');
    } else {
      this.log(`  ⚠️  Training data not found (will use local fallback)`, 'warning');
    }

    // Test loadScannedRepos
    this.log('\nTest 2: loadScannedRepos()', 'step');
    const repos = await loadScannedRepos({ fromStorage: true, maxFiles: 3 });
    if (repos.length > 0) {
      this.log(`  ✅ Loaded ${repos.length} repos from Storage`, 'success');
    } else {
      this.log(`  ⚠️  No repos from Storage (will use local fallback)`, 'warning');
    }

    // Test loadModel
    this.log('\nTest 3: loadModel()', 'step');
    const model = await loadModel('model-notable-quality-*.json');
    if (model) {
      this.log(`  ✅ Loaded model: ${model.algorithm || 'N/A'}`, 'success');
    } else {
      this.log(`  ⚠️  Model not found (will use local fallback)`, 'warning');
    }
  }

  async run() {
    await this.verifyAll();
    await this.testLoaders();
    
    console.log('\n✅ Verification complete!');
  }
}

// Run if called directly
if (require.main === module) {
  const verifier = new StorageVerifier();
  verifier.run().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { StorageVerifier };

