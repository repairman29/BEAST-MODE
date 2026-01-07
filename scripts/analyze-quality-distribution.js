#!/usr/bin/env node

/**
 * Analyze Quality Distribution
 * 
 * Complementary work: Analyzes current quality distribution
 * Prepares for balanced dataset while other agents add new repos
 */

const fs = require('fs-extra');
const path = require('path');
const { calculateNotableQuality } = require('./analyze-high-quality-repos');

const SCANNED_DIR = path.join(__dirname, '../.beast-mode/training-data/scanned-repos');
const ENHANCED_DIR = path.join(__dirname, '../.beast-mode/training-data');
const OUTPUT_DIR = path.join(__dirname, '../.beast-mode/quality-analysis');
fs.ensureDirSync(OUTPUT_DIR);

/**
 * Load all repos
 */
function loadAllRepos() {
  // Try enhanced features first
  const enhancedFiles = fs.readdirSync(ENHANCED_DIR)
    .filter(f => f.startsWith('enhanced-features-') && f.endsWith('.json'))
    .sort()
    .reverse();

  let repos = [];
  
  if (enhancedFiles.length > 0) {
    const latestFile = path.join(ENHANCED_DIR, enhancedFiles[0]);
    const data = JSON.parse(fs.readFileSync(latestFile, 'utf8'));
    repos = data.trainingData || [];
    console.log(`✅ Loaded ${repos.length} repos from enhanced features\n`);
  } else {
    // Fallback to scanned repos
    const scannedFiles = fs.readdirSync(SCANNED_DIR)
      .filter(f => f.startsWith('scanned-repos-') && f.endsWith('.json'))
      .sort()
      .reverse();

    if (scannedFiles.length === 0) {
      throw new Error('No training data found');
    }

    const seenRepos = new Set();

    for (const file of scannedFiles) {
      const filePath = path.join(SCANNED_DIR, file);
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const fileRepos = data.trainingData || [];

      for (const repo of fileRepos) {
        const repoKey = repo.repo || repo.url || JSON.stringify(repo.features || {});
        if (!seenRepos.has(repoKey)) {
          seenRepos.add(repoKey);
          repos.push(repo);
        }
      }
    }

    console.log(`✅ Loaded ${repos.length} repos from scanned data\n`);
  }

  return repos;
}

/**
 * Normalize features
 */
function normalizeFeatures(repo) {
  const features = repo.features || {};
  if (features.metadata) {
    const normalized = { ...features.metadata, ...features };
    delete normalized.metadata;
    return normalized;
  }
  return features;
}

/**
 * Analyze quality distribution
 */
function analyzeQualityDistribution(repos) {
  console.log('📊 Analyzing Quality Distribution...\n');

  // Calculate quality for each repo
  const reposWithQuality = repos.map(repo => {
    const normalizedFeatures = normalizeFeatures(repo);
    const normalizedRepo = { ...repo, features: normalizedFeatures };
    const quality = calculateNotableQuality(normalizedRepo);
    return { ...repo, quality };
  });

  // Quality buckets
  const high = reposWithQuality.filter(r => r.quality >= 0.7);
  const medium = reposWithQuality.filter(r => r.quality >= 0.4 && r.quality < 0.7);
  const low = reposWithQuality.filter(r => r.quality < 0.4);

  // Language distribution
  const languageDistribution = {};
  reposWithQuality.forEach(repo => {
    const lang = repo.features?.primaryLanguage || repo.features?.language || 'Unknown';
    if (!languageDistribution[lang]) {
      languageDistribution[lang] = { total: 0, high: 0, medium: 0, low: 0 };
    }
    languageDistribution[lang].total++;
    if (repo.quality >= 0.7) languageDistribution[lang].high++;
    else if (repo.quality >= 0.4) languageDistribution[lang].medium++;
    else languageDistribution[lang].low++;
  });

  // Quality statistics
  const qualities = reposWithQuality.map(r => r.quality);
  const mean = qualities.reduce((a, b) => a + b, 0) / qualities.length;
  const std = Math.sqrt(qualities.reduce((sum, q) => sum + Math.pow(q - mean, 2), 0) / qualities.length);
  const min = Math.min(...qualities);
  const max = Math.max(...qualities);

  // Target distribution (60/30/10)
  const targetHigh = Math.floor(repos.length * 0.6);
  const targetMedium = Math.floor(repos.length * 0.3);
  const targetLow = Math.floor(repos.length * 0.1);

  // Gaps
  const highGap = targetHigh - high.length;
  const mediumGap = targetMedium - medium.length;
  const lowGap = targetLow - low.length;

  return {
    total: repos.length,
    distribution: {
      high: { count: high.length, percentage: (high.length / repos.length * 100).toFixed(1), target: targetHigh, gap: highGap },
      medium: { count: medium.length, percentage: (medium.length / repos.length * 100).toFixed(1), target: targetMedium, gap: mediumGap },
      low: { count: low.length, percentage: (low.length / repos.length * 100).toFixed(1), target: targetLow, gap: lowGap }
    },
    statistics: { mean, std, min, max },
    languageDistribution,
    reposByQuality: {
      high: high.slice(0, 10).map(r => ({ repo: r.repo || r.url, quality: r.quality })),
      medium: medium.slice(0, 10).map(r => ({ repo: r.repo || r.url, quality: r.quality })),
      low: low.slice(0, 10).map(r => ({ repo: r.repo || r.url, quality: r.quality }))
    }
  };
}

/**
 * Main function
 */
async function main() {
  console.log('📊 Quality Distribution Analysis\n');
  console.log('='.repeat(60));
  console.log('Complementary Work: Quality Distribution Analysis');
  console.log('='.repeat(60));

  const repos = loadAllRepos();
  const analysis = analyzeQualityDistribution(repos);

  // Print results
  console.log('📊 Overall Distribution:');
  console.log(`   Total Repos: ${analysis.total}`);
  console.log(`   Mean Quality: ${analysis.statistics.mean.toFixed(3)}`);
  console.log(`   Std Dev: ${analysis.statistics.std.toFixed(3)}`);
  console.log(`   Range: ${analysis.statistics.min.toFixed(3)} - ${analysis.statistics.max.toFixed(3)}\n`);

  console.log('📊 Quality Buckets:');
  console.log(`   ⭐ High (≥0.7): ${analysis.distribution.high.count} (${analysis.distribution.high.percentage}%)`);
  console.log(`      Target: ${analysis.distribution.high.target}, Gap: ${analysis.distribution.high.gap > 0 ? '+' : ''}${analysis.distribution.high.gap}`);
  console.log(`   📊 Medium (0.4-0.7): ${analysis.distribution.medium.count} (${analysis.distribution.medium.percentage}%)`);
  console.log(`      Target: ${analysis.distribution.medium.target}, Gap: ${analysis.distribution.medium.gap > 0 ? '+' : ''}${analysis.distribution.medium.gap}`);
  console.log(`   📉 Low (<0.4): ${analysis.distribution.low.count} (${analysis.distribution.low.percentage}%)`);
  console.log(`      Target: ${analysis.distribution.low.target}, Gap: ${analysis.distribution.low.gap > 0 ? '+' : ''}${analysis.distribution.low.gap}\n`);

  // Target distribution (60/30/10)
  const targetPercentages = { high: 60, medium: 30, low: 10 };
  const currentPercentages = {
    high: parseFloat(analysis.distribution.high.percentage),
    medium: parseFloat(analysis.distribution.medium.percentage),
    low: parseFloat(analysis.distribution.low.percentage)
  };

  console.log('🎯 Target Distribution (60/30/10):');
  console.log(`   High: ${currentPercentages.high.toFixed(1)}% (target: ${targetPercentages.high}%) - ${currentPercentages.high >= targetPercentages.high ? '✅' : '⚠️  Need more'}`);
  console.log(`   Medium: ${currentPercentages.medium.toFixed(1)}% (target: ${targetPercentages.medium}%) - ${currentPercentages.medium >= targetPercentages.medium ? '✅' : '⚠️  Need more'}`);
  console.log(`   Low: ${currentPercentages.low.toFixed(1)}% (target: ${targetPercentages.low}%) - ${currentPercentages.low >= targetPercentages.low ? '✅' : '⚠️  Need more'}\n`);

  // Language distribution
  console.log('🌍 Language Distribution (Top 10):');
  const sortedLangs = Object.entries(analysis.languageDistribution)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 10);

  sortedLangs.forEach(([lang, dist]) => {
    const highPct = (dist.high / dist.total * 100).toFixed(1);
    const mediumPct = (dist.medium / dist.total * 100).toFixed(1);
    const lowPct = (dist.low / dist.total * 100).toFixed(1);
    console.log(`   ${lang}: ${dist.total} repos (H:${highPct}% M:${mediumPct}% L:${lowPct}%)`);
  });
  console.log('');

  // Recommendations
  console.log('💡 Recommendations:');
  if (analysis.distribution.low.gap > 0) {
    console.log(`   ⚠️  Need ${analysis.distribution.low.gap} more low-quality repos (0.0-0.4 range)`);
  }
  if (analysis.distribution.medium.gap > 0) {
    console.log(`   ⚠️  Need ${analysis.distribution.medium.gap} more medium-quality repos (0.4-0.7 range)`);
  }
  if (analysis.distribution.high.gap < 0) {
    console.log(`   ✅ Have ${Math.abs(analysis.distribution.high.gap)} more high-quality repos than target`);
  }
  console.log('');

  // Save analysis
  const outputPath = path.join(OUTPUT_DIR, `quality-distribution-${Date.now()}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(analysis, null, 2));
  console.log(`💾 Analysis saved: ${outputPath}\n`);

  // Summary
  const isBalanced = 
    currentPercentages.high >= targetPercentages.high * 0.9 &&
    currentPercentages.medium >= targetPercentages.medium * 0.9 &&
    currentPercentages.low >= targetPercentages.low * 0.9;

  if (isBalanced) {
    console.log('✅ Quality distribution is well-balanced!');
  } else {
    console.log('⚠️  Quality distribution needs improvement for better model training');
    console.log('   Consider discovering more repos in underrepresented quality ranges');
  }
}

main().catch(console.error);

