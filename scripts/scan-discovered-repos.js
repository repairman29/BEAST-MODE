#!/usr/bin/env node

/**
 * Scan Discovered High-Value Repositories
 * 
 * Scans the discovered high-value repositories for ML training data
 */

const { Octokit } = require('@octokit/rest');
const { PublicRepoScanner } = require('../lib/mlops/publicRepoScanner');
const { getEnhancedFeatureEngineering } = require('../lib/mlops/enhancedFeatureEngineering');
const fs = require('fs-extra');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../website/.env.local') });

const OUTPUT_DIR = path.join(__dirname, '../.beast-mode/training-data/scanned-repos');
fs.ensureDirSync(OUTPUT_DIR);

/**
 * Get GitHub token from multiple sources
 */
async function getGitHubToken() {
  // Try environment variable first (after dotenv load)
  if (process.env.GITHUB_TOKEN) {
    return process.env.GITHUB_TOKEN;
  }

  // Try Supabase app_config
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Try app_config.github
      const { data: config } = await supabase
        .from('app_config')
        .select('value')
        .eq('key', 'github')
        .maybeSingle();

      if (config?.value?.token) {
        return config.value.token;
      }

      // Try app_config.echeo_env
      const { data: envConfig } = await supabase
        .from('app_config')
        .select('value')
        .eq('key', 'echeo_env')
        .maybeSingle();

      if (envConfig?.value?.GITHUB_TOKEN || envConfig?.value?.GITHUB_PAT) {
        const value = typeof envConfig.value === 'string' 
          ? JSON.parse(envConfig.value) 
          : envConfig.value;
        return value.GITHUB_TOKEN || value.GITHUB_PAT;
      }
    }
  } catch (error) {
    // Ignore
  }

  // Try reading .env.local directly
  try {
    const envPath = path.join(__dirname, '../website/.env.local');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const match = envContent.match(/GITHUB_TOKEN\s*=\s*(.+)/);
      if (match) {
        return match[1].trim().replace(/^["']|["']$/g, '');
      }
    }
  } catch (error) {
    // Ignore
  }

  return null;
}

/**
 * Load discovered repositories
 */
async function loadDiscoveredRepos() {
  const discoveredDir = path.join(__dirname, '../.beast-mode/training-data/discovered-repos');
  
  // Find most recent discovery file
  const files = await fs.readdir(discoveredDir);
  const discoveryFiles = files.filter(f => f.startsWith('high-value-repos-') && f.endsWith('.json'));
  
  if (discoveryFiles.length === 0) {
    throw new Error('No discovery file found. Run discover-high-value-repos.js first.');
  }

  // Get most recent
  discoveryFiles.sort().reverse();
  const latestFile = discoveryFiles[0];
  const filePath = path.join(discoveredDir, latestFile);

  console.log(`📂 Loading: ${latestFile}\n`);

  const data = JSON.parse(await fs.readFile(filePath, 'utf8'));
  return data.repositories;
}

/**
 * Main function
 */
async function main() {
  console.log('📡 Scanning Discovered High-Value Repositories\n');
  console.log('='.repeat(60));

  // Get GitHub token
  const token = await getGitHubToken();
  if (!token) {
    console.error('❌ GITHUB_TOKEN not found!');
    console.error('   Set GITHUB_TOKEN environment variable or add to .env.local');
    process.exit(1);
  }

  console.log(`✅ GitHub token found (${token.substring(0, 10)}...)\n`);

  // Load discovered repos
  const discoveredRepos = await loadDiscoveredRepos();
  console.log(`📊 Loaded ${discoveredRepos.length} target repositories\n`);

  const octokit = new Octokit({ auth: token });
  const scanner = new PublicRepoScanner(octokit);
  const featureEngineer = await getEnhancedFeatureEngineering();

  // Scan repositories
  console.log('🔍 Scanning repositories...\n');
  const repoList = discoveredRepos.map(r => r.fullName);
  
  // Progress tracking
  let lastProgressUpdate = 0;
  const progressInterval = setInterval(() => {
    const scanned = scanner.scannedRepos.size;
    const optedOut = scanner.optedOutRepos.size;
    const progress = (scanned / repoList.length) * 100;
    
    if (scanned > lastProgressUpdate) {
      console.log(`\n📊 Progress Update:`);
      console.log(`   Scanned: ${scanned}/${repoList.length} (${progress.toFixed(1)}%)`);
      console.log(`   Opted Out: ${optedOut}`);
      console.log(`   Successful: ${scanned - optedOut}`);
      console.log(`   Rate Limit Remaining: ${scanner.rateLimitRemaining}\n`);
      lastProgressUpdate = scanned;
    }
  }, 5000); // Update every 5 seconds
  
  const scanResults = await scanner.batchScan(repoList, {
    maxRepos: discoveredRepos.length,
    delayBetweenScans: 1000,
    onProgress: (current, total, successful) => {
      if (current % 10 === 0 || current === total) {
        const progress = (current / total) * 100;
        console.log(`\n   📈 Progress: ${current}/${total} (${progress.toFixed(1)}%) - ${successful} successful`);
        
        // Show sample of recently scanned repos
        const recent = Array.from(scanner.scannedRepos).slice(-5);
        if (recent.length > 0) {
          console.log(`   Recent: ${recent.join(', ')}`);
        }
      }
    },
  });
  
  clearInterval(progressInterval);

  console.log(`\n✅ Scanned ${scanResults.successful} repositories`);
  console.log(`   Opted out: ${scanResults.optedOut}`);
  console.log(`   Failed: ${scanResults.totalScanned - scanResults.successful - scanResults.optedOut}`);
  console.log(`   Success Rate: ${((scanResults.successful / scanResults.totalScanned) * 100).toFixed(1)}%\n`);

  if (scanResults.results.length === 0) {
    console.log('⚠️  No repositories scanned successfully');
    process.exit(1);
  }

  // Extract enhanced features
  console.log('🔧 Extracting enhanced features...\n');
  const enhanced = [];
  let featureStats = {
    totalFeatures: 0,
    featureTypes: {},
  };

  for (let i = 0; i < scanResults.results.length; i++) {
    const result = scanResults.results[i];
    try {
      const features = await featureEngineer.extractEnhancedFeatures({
        repo: result.metadata.repo,
        url: result.metadata.url,
        features: result.metadata,
        created_at: result.metadata.createdAt,
        updated_at: result.metadata.updatedAt,
        pushed_at: result.metadata.pushedAt,
        description: result.metadata.description,
      });

      enhanced.push({
        repo: result.metadata.repo,
        url: result.metadata.url,
        features,
        source: 'discovered-high-value',
        scannedAt: result.scannedAt,
        license: result.metadata.license,
        language: result.metadata.language,
        score: discoveredRepos.find(r => r.fullName === result.metadata.repo)?.score || 0,
      });

      // Track feature statistics
      const featureCount = Object.keys(features).length;
      featureStats.totalFeatures = Math.max(featureStats.totalFeatures, featureCount);
      
      // Categorize features
      Object.keys(features).forEach(key => {
        const category = key.includes('Interaction') ? 'interaction' :
                        key.includes('Time') || key.includes('Age') || key.includes('Activity') ? 'temporal' :
                        key.includes('Language') || key.includes('TypeScript') || key.includes('JavaScript') ? 'language' :
                        key.includes('Architecture') || key.includes('Monorepo') ? 'architecture' :
                        key.includes('Quality') || key.includes('Community') ? 'quality' : 'basic';
        featureStats.featureTypes[category] = (featureStats.featureTypes[category] || 0) + 1;
      });

      if ((i + 1) % 10 === 0) {
        const progress = ((i + 1) / scanResults.results.length) * 100;
        console.log(`\n   📊 Feature Extraction: ${i + 1}/${scanResults.results.length} (${progress.toFixed(1)}%)`);
        console.log(`   Features per repo: ${featureCount}`);
        console.log(`   Categories: ${Object.keys(featureStats.featureTypes).join(', ')}`);
      }
    } catch (error) {
      console.warn(`   ⚠️  Failed to extract features from ${result.metadata.repo}:`, error.message);
    }
  }

  console.log(`\n✅ Extracted features from ${enhanced.length} repositories\n`);
  
  // Feature statistics
  console.log('📊 Feature Statistics:');
  console.log(`   Total Features: ${featureStats.totalFeatures}`);
  console.log(`   Feature Categories:`);
  Object.entries(featureStats.featureTypes)
    .sort((a, b) => b[1] - a[1])
    .forEach(([category, count]) => {
      console.log(`      ${category}: ${count} features`);
    });
  console.log('');

  // Save results
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outputPath = path.join(OUTPUT_DIR, `scanned-repos-${timestamp}.json`);

  await fs.writeFile(outputPath, JSON.stringify({
    metadata: {
      scannedAt: new Date().toISOString(),
      totalRepos: scanResults.totalScanned,
      successful: scanResults.successful,
      optedOut: scanResults.optedOut,
      optedOutRepos: scanResults.optedOutRepos,
    },
    trainingData: enhanced,
  }, null, 2));

  console.log(`💾 Saved training data to: ${outputPath}\n`);

  // Statistics
  const byLanguage = {};
  enhanced.forEach(r => {
    const lang = r.language || 'Unknown';
    byLanguage[lang] = (byLanguage[lang] || 0) + 1;
  });

  console.log('📊 Training Data Summary:');
  console.log(`   Examples: ${enhanced.length}`);
  console.log(`   Features per example: ${Object.keys(enhanced[0]?.features || {}).length}`);
  console.log(`   Languages: ${Object.keys(byLanguage).length}\n`);

  console.log('📋 Language Distribution:');
  Object.entries(byLanguage)
    .sort((a, b) => b[1] - a[1])
    .forEach(([lang, count]) => {
      console.log(`   ${lang}: ${count} repos`);
    });
  console.log('');

  if (scanResults.optedOutRepos.length > 0) {
    console.log('⏭️  Repositories that opted out:');
    scanResults.optedOutRepos.slice(0, 10).forEach(repo => {
      console.log(`   - ${repo}`);
    });
    if (scanResults.optedOutRepos.length > 10) {
      console.log(`   ... and ${scanResults.optedOutRepos.length - 10} more`);
    }
    console.log('');
  }

  console.log('✅ Scanning Complete!\n');
  console.log('💡 Next Steps:');
  console.log(`   1. Review training data: ${outputPath}`);
  console.log(`   2. Combine with existing data`);
  console.log(`   3. Train improved models\n`);
}

main();

