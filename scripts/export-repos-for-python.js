#!/usr/bin/env node

/**
 * Export All Repos for Python Training
 * 
 * Loads all repos from Storage (or local) and exports to a single JSON file
 * that Python can easily load
 */

const fs = require('fs-extra');
const path = require('path');
const { loadScannedRepos } = require('../lib/mlops/loadTrainingData');

const OUTPUT_DIR = path.join(__dirname, '../.beast-mode/training-data');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'all-repos-for-python.json');

async function main() {
  console.log('📤 Exporting All Repos for Python Training\n');
  console.log('='.repeat(60));

  try {
    // Load all repos from Storage (or local fallback)
    console.log('📥 Loading repos from Storage (or local fallback)...');
    const repos = await loadScannedRepos({ fromStorage: true });
    
    console.log(`✅ Loaded ${repos.length} repositories\n`);

    // Save to single JSON file
    await fs.ensureDir(OUTPUT_DIR);
    await fs.writeJson(OUTPUT_FILE, {
      metadata: {
        exportedAt: new Date().toISOString(),
        totalRepos: repos.length,
        source: 'storage-first'
      },
      repositories: repos
    }, { spaces: 2 });

    console.log(`💾 Exported ${repos.length} repos to:`);
    console.log(`   ${OUTPUT_FILE}\n`);
    console.log('='.repeat(60));
    console.log('✅ Export complete!\n');
    console.log('💡 Next: Run Python training script');
    console.log('   python3 scripts/train_xgboost.py\n');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

