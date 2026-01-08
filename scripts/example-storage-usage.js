#!/usr/bin/env node

/**
 * Example: Using ML Storage in Training Scripts
 * Demonstrates Storage-first pattern with local fallback
 */

const { loadTrainingData, loadScannedRepos, loadModel } = require('../lib/mlops/loadTrainingData');
const { getMLStorageClient } = require('../lib/mlops/storageClient');

async function example1_loadEnhancedFeatures() {
  console.log('📊 Example 1: Load Enhanced Features\n');
  
  // Storage-first: Checks Storage, falls back to local
  const data = await loadTrainingData('enhanced-features-*.json', 'training-data');
  
  if (data && data.trainingData) {
    console.log(`✅ Loaded ${data.trainingData.length} repos`);
    console.log(`   Features: ${data.metadata?.featureCount || 'N/A'}`);
  } else {
    console.log('❌ No data found');
  }
}

async function example2_loadScannedRepos() {
  console.log('\n📊 Example 2: Load Scanned Repos\n');
  
  // Combines multiple files from Storage or local
  const repos = await loadScannedRepos({ 
    fromStorage: true,  // Try Storage first
    maxFiles: 5        // Limit to 5 most recent files
  });
  
  console.log(`✅ Loaded ${repos.length} unique repos`);
}

async function example3_loadModel() {
  console.log('\n🤖 Example 3: Load Model\n');
  
  // Load latest model matching pattern
  const model = await loadModel('model-notable-quality-*.json');
  
  if (model) {
    console.log(`✅ Loaded model: ${model.algorithm || 'N/A'}`);
    console.log(`   R²: ${model.metrics?.r2?.toFixed(3) || 'N/A'}`);
    console.log(`   MAE: ${model.metrics?.mae?.toFixed(3) || 'N/A'}`);
  } else {
    console.log('❌ No model found');
  }
}

async function example4_directStorageAccess() {
  console.log('\n🔧 Example 4: Direct Storage Access\n');
  
  const storage = getMLStorageClient();
  
  // List all files in training-data folder
  const files = await storage.listFiles('training-data');
  console.log(`📁 Found ${files.length} files in training-data/`);
  
  // Get latest enhanced-features file
  const latest = await storage.getLatestFile('training-data', 'enhanced-features-*.json');
  if (latest) {
    console.log(`📄 Latest: ${latest}`);
    
    // Load it
    const data = await storage.loadJSON(latest);
    if (data) {
      console.log(`✅ Loaded ${data.trainingData?.length || 0} repos`);
    }
  }
}

async function main() {
  console.log('🚀 ML Storage Usage Examples\n');
  console.log('═══════════════════════════════════════════════════════\n');
  
  await example1_loadEnhancedFeatures();
  await example2_loadScannedRepos();
  await example3_loadModel();
  await example4_directStorageAccess();
  
  console.log('\n✅ Examples complete!');
  console.log('\n💡 Key Takeaways:');
  console.log('   - Use loadTrainingData() instead of fs.readFileSync()');
  console.log('   - Storage-first pattern: checks Storage, falls back to local');
  console.log('   - Pattern matching: use *.json to get latest file');
  console.log('   - All utilities handle missing files gracefully');
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
}

module.exports = { main };


