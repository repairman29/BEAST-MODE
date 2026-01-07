#!/usr/bin/env node

/**
 * Analyze Feature Consistency
 * 
 * Compares feature structures between old and new repos
 * to identify why model performance degraded
 */

const fs = require('fs-extra');
const path = require('path');

const SCANNED_DIR = path.join(__dirname, '../.beast-mode/training-data/scanned-repos');

/**
 * Load all scanned repos
 */
function loadAllRepos() {
  const files = fs.readdirSync(SCANNED_DIR)
    .filter(f => f.startsWith('scanned-repos-') && f.endsWith('.json'))
    .sort()
    .reverse();

  const allRepos = [];
  const seenRepos = new Set();

  for (const file of files) {
    const filePath = path.join(SCANNED_DIR, file);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const repos = data.trainingData || [];
    const isNewRepo = file.includes('missing-languages');

    for (const repo of repos) {
      const repoKey = repo.repo || repo.url || JSON.stringify(repo.features || {});
      if (!seenRepos.has(repoKey)) {
        seenRepos.add(repoKey);
        allRepos.push({ ...repo, _source: isNewRepo ? 'new' : 'old', _file: file });
      }
    }
  }

  return allRepos;
}

/**
 * Extract all feature keys from a repo
 */
function getFeatureKeys(repo) {
  const features = repo.features || {};
  const metadata = features.metadata || {};
  
  // Get all keys from both levels
  const keys = new Set();
  
  // Top-level features
  Object.keys(features).forEach(k => {
    if (k !== 'metadata' && typeof features[k] === 'number') {
      keys.add(k);
    }
  });
  
  // Metadata features
  Object.keys(metadata).forEach(k => {
    if (typeof metadata[k] === 'number') {
      keys.add(`metadata.${k}`);
    }
  });
  
  return Array.from(keys);
}

/**
 * Analyze feature consistency
 */
function analyzeFeatureConsistency(repos) {
  const oldRepos = repos.filter(r => r._source === 'old');
  const newRepos = repos.filter(r => r._source === 'new');
  
  console.log(`📊 Feature Consistency Analysis\n`);
  console.log(`   Old repos: ${oldRepos.length}`);
  console.log(`   New repos: ${newRepos.length}\n`);

  // Get all feature keys
  const allKeys = new Set();
  oldRepos.forEach(r => getFeatureKeys(r).forEach(k => allKeys.add(k)));
  newRepos.forEach(r => getFeatureKeys(r).forEach(k => allKeys.add(k)));

  // Count feature presence
  const oldFeatureCounts = {};
  const newFeatureCounts = {};
  
  allKeys.forEach(key => {
    oldFeatureCounts[key] = 0;
    newFeatureCounts[key] = 0;
    
    oldRepos.forEach(r => {
      const keys = getFeatureKeys(r);
      if (keys.includes(key)) oldFeatureCounts[key]++;
    });
    
    newRepos.forEach(r => {
      const keys = getFeatureKeys(r);
      if (keys.includes(key)) newFeatureCounts[key]++;
    });
  });

  // Find differences
  const differences = [];
  allKeys.forEach(key => {
    const oldPercent = (oldFeatureCounts[key] / oldRepos.length) * 100;
    const newPercent = (newFeatureCounts[key] / newRepos.length) * 100;
    const diff = Math.abs(oldPercent - newPercent);
    
    if (diff > 10) { // More than 10% difference
      differences.push({
        key,
        oldPercent: oldPercent.toFixed(1),
        newPercent: newPercent.toFixed(1),
        diff: diff.toFixed(1)
      });
    }
  });

  // Sample feature structures
  const oldSample = oldRepos[0];
  const newSample = newRepos[0];

  return {
    totalKeys: allKeys.size,
    differences,
    oldSample: {
      repo: oldSample.repo,
      hasMetadata: !!(oldSample.features?.metadata),
      topLevelKeys: Object.keys(oldSample.features || {}).filter(k => k !== 'metadata'),
      metadataKeys: Object.keys(oldSample.features?.metadata || {})
    },
    newSample: {
      repo: newSample.repo,
      hasMetadata: !!(newSample.features?.metadata),
      topLevelKeys: Object.keys(newSample.features || {}).filter(k => k !== 'metadata'),
      metadataKeys: Object.keys(newSample.features?.metadata || {})
    }
  };
}

/**
 * Check feature values
 */
function checkFeatureValues(repos) {
  const oldRepos = repos.filter(r => r._source === 'old');
  const newRepos = repos.filter(r => r._source === 'new');
  
  // Sample a few key features
  const keyFeatures = ['stars', 'forks', 'openIssues', 'fileCount', 'hasTests', 'hasCI'];
  
  const stats = {};
  
  keyFeatures.forEach(feature => {
    const oldValues = oldRepos.map(r => {
      const f = r.features?.metadata || r.features || {};
      return f[feature];
    }).filter(v => v !== undefined && v !== null);
    
    const newValues = newRepos.map(r => {
      const f = r.features?.metadata || r.features || {};
      return f[feature];
    }).filter(v => v !== undefined && v !== null);
    
    if (oldValues.length > 0 && newValues.length > 0) {
      const oldMean = oldValues.reduce((a, b) => a + b, 0) / oldValues.length;
      const newMean = newValues.reduce((a, b) => a + b, 0) / newValues.length;
      const oldMax = Math.max(...oldValues);
      const newMax = Math.max(...newValues);
      
      stats[feature] = {
        old: { mean: oldMean.toFixed(2), max: oldMax, count: oldValues.length },
        new: { mean: newMean.toFixed(2), max: newMax, count: newValues.length },
        diff: ((newMean - oldMean) / oldMean * 100).toFixed(1)
      };
    }
  });
  
  return stats;
}

/**
 * Main function
 */
async function main() {
  console.log('🔍 Analyzing Feature Consistency\n');
  console.log('='.repeat(60));

  const repos = loadAllRepos();
  console.log(`✅ Loaded ${repos.length} repositories\n`);

  const analysis = analyzeFeatureConsistency(repos);
  const valueStats = checkFeatureValues(repos);

  console.log('📊 Feature Structure Analysis:\n');
  console.log(`   Total unique features: ${analysis.totalKeys}`);
  console.log(`   Significant differences: ${analysis.differences.length}\n`);

  if (analysis.differences.length > 0) {
    console.log('⚠️  Feature Differences (>10%):\n');
    analysis.differences
      .sort((a, b) => parseFloat(b.diff) - parseFloat(a.diff))
      .slice(0, 20)
      .forEach(d => {
        console.log(`   ${d.key}:`);
        console.log(`      Old: ${d.oldPercent}% | New: ${d.newPercent}% | Diff: ${d.diff}%`);
      });
    console.log('');
  }

  console.log('📋 Structure Comparison:\n');
  console.log('Old Repo Sample:');
  console.log(`   Repo: ${analysis.oldSample.repo}`);
  console.log(`   Has metadata: ${analysis.oldSample.hasMetadata}`);
  console.log(`   Top-level keys: ${analysis.oldSample.topLevelKeys.length}`);
  console.log(`   Metadata keys: ${analysis.oldSample.metadataKeys.length}`);
  console.log('');
  console.log('New Repo Sample:');
  console.log(`   Repo: ${analysis.newSample.repo}`);
  console.log(`   Has metadata: ${analysis.newSample.hasMetadata}`);
  console.log(`   Top-level keys: ${analysis.newSample.topLevelKeys.length}`);
  console.log(`   Metadata keys: ${analysis.newSample.metadataKeys.length}`);
  console.log('');

  console.log('📈 Feature Value Statistics:\n');
  Object.entries(valueStats).forEach(([feature, stats]) => {
    console.log(`   ${feature}:`);
    console.log(`      Old: mean=${stats.old.mean}, max=${stats.old.max}, count=${stats.old.count}`);
    console.log(`      New: mean=${stats.new.mean}, max=${stats.new.max}, count=${stats.new.count}`);
    console.log(`      Diff: ${stats.diff}%`);
  });
  console.log('');

  // Recommendations
  console.log('💡 Recommendations:\n');
  
  if (analysis.oldSample.hasMetadata !== analysis.newSample.hasMetadata) {
    console.log('   ⚠️  Metadata structure mismatch!');
    console.log('      → Normalize all repos to use same structure\n');
  }
  
  if (analysis.differences.length > 10) {
    console.log('   ⚠️  Many feature differences found');
    console.log('      → Need to normalize feature extraction\n');
  }
  
  const missingFeatures = analysis.differences.filter(d => 
    parseFloat(d.newPercent) < 50 && parseFloat(d.oldPercent) > 50
  );
  
  if (missingFeatures.length > 0) {
    console.log('   ⚠️  Missing features in new repos:');
    missingFeatures.slice(0, 5).forEach(d => {
      console.log(`      → ${d.key} (${d.newPercent}% vs ${d.oldPercent}%)`);
    });
    console.log('');
  }

  console.log('='.repeat(60));
  console.log('✅ Analysis complete!\n');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { analyzeFeatureConsistency, checkFeatureValues };

