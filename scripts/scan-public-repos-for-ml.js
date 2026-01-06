#!/usr/bin/env node

/**
 * Scan Public Repositories for ML Training
 * 
 * Safely scans public GitHub repositories for ML training data
 * Respects opt-outs, licenses, and rate limits
 */

const { Octokit } = require('@octokit/rest');
const { PublicRepoScanner } = require('../lib/mlops/publicRepoScanner');
const { getEnhancedFeatureEngineering } = require('../lib/mlops/enhancedFeatureEngineering');
const fs = require('fs-extra');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '../.beast-mode/training-data/public-repos');
fs.ensureDirSync(OUTPUT_DIR);

/**
 * Get GitHub token
 */
function getGitHubToken() {
  // Try environment variable first
  if (process.env.GITHUB_TOKEN) {
    return process.env.GITHUB_TOKEN;
  }

  // Try from .env.local
  try {
    const envPath = path.join(__dirname, '../website/.env.local');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const match = envContent.match(/GITHUB_TOKEN=(.+)/);
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
 * Get popular repositories to scan
 */
async function getPopularRepos(octokit, options = {}) {
  const {
    language = 'javascript',
    sort = 'stars',
    order = 'desc',
    perPage = 100,
    maxRepos = 1000,
  } = options;

  const repos = [];
  let page = 1;

  console.log(`📡 Fetching popular ${language} repositories...`);

  while (repos.length < maxRepos) {
    try {
      const { data } = await octokit.search.repos({
        q: `language:${language} stars:>10`,
        sort,
        order,
        per_page: Math.min(perPage, maxRepos - repos.length),
        page,
      });

      if (data.items.length === 0) break;

      data.items.forEach(item => {
        repos.push(`${item.owner.login}/${item.name}`);
      });

      console.log(`   Fetched ${repos.length} repositories...`);

      page++;
      
      // Rate limit delay
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`❌ Error fetching repos:`, error.message);
      break;
    }
  }

  return repos.slice(0, maxRepos);
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Public Repository Scanner for ML Training\n');
  console.log('='.repeat(60));
  console.log('📋 This script will:');
  console.log('   1. Scan public GitHub repositories');
  console.log('   2. Extract metadata only (no source code)');
  console.log('   3. Respect opt-outs (.ai_exclude files)');
  console.log('   4. Honor rate limits');
  console.log('   5. Generate training data\n');

  // Get GitHub token
  const token = getGitHubToken();
  if (!token) {
    console.error('❌ GITHUB_TOKEN not found!');
    console.error('   Set GITHUB_TOKEN environment variable or add to .env.local');
    process.exit(1);
  }

  const octokit = new Octokit({ auth: token });
  const scanner = new PublicRepoScanner(octokit);
  const featureEngineer = await getEnhancedFeatureEngineering();

  // Get repositories to scan
  console.log('📡 Fetching repositories to scan...\n');
  const repos = await getPopularRepos(octokit, {
    language: 'javascript',
    maxRepos: 100, // Start small
  });

  if (repos.length === 0) {
    console.error('❌ No repositories found');
    process.exit(1);
  }

  console.log(`✅ Found ${repos.length} repositories to scan\n`);

  // Scan repositories
  const scanResults = await scanner.batchScan(repos, {
    maxRepos: 100,
    delayBetweenScans: 1000,
    onProgress: (current, total, successful) => {
      if (current % 10 === 0 || current === total) {
        console.log(`   Progress: ${current}/${total} (${successful} successful)`);
      }
    },
  });

  console.log('\n📊 Scan Results:');
  console.log(`   Total: ${scanResults.totalScanned}`);
  console.log(`   Successful: ${scanResults.successful}`);
  console.log(`   Opted Out: ${scanResults.optedOut}`);
  console.log(`   Failed: ${scanResults.totalScanned - scanResults.successful - scanResults.optedOut}\n`);

  if (scanResults.results.length === 0) {
    console.log('⚠️  No repositories scanned successfully');
    process.exit(1);
  }

  // Extract enhanced features
  console.log('🔧 Extracting enhanced features...\n');
  const enhanced = await featureEngineer.batchExtractFeatures(
    scanResults.results.map(r => r.metadata)
  );

  // Prepare training data
  const trainingData = enhanced.map((features, i) => ({
    repo: scanResults.results[i].metadata.repo,
    url: scanResults.results[i].metadata.url,
    features,
    source: 'public-repo',
    scannedAt: scanResults.results[i].scannedAt,
    license: scanResults.results[i].metadata.license,
  }));

  // Save results
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outputPath = path.join(OUTPUT_DIR, `public-repos-${timestamp}.json`);
  
  await fs.writeFile(outputPath, JSON.stringify({
    metadata: {
      scannedAt: new Date().toISOString(),
      totalRepos: scanResults.totalScanned,
      successful: scanResults.successful,
      optedOut: scanResults.optedOut,
      optedOutRepos: scanResults.optedOutRepos,
    },
    trainingData,
  }, null, 2));

  console.log(`💾 Saved training data to: ${outputPath}\n`);
  console.log(`📊 Training Data Summary:`);
  console.log(`   Examples: ${trainingData.length}`);
  console.log(`   Features per example: ${Object.keys(trainingData[0]?.features || {}).length}`);
  console.log(`   Opted out repos: ${scanResults.optedOutRepos.length}\n`);

  if (scanResults.optedOutRepos.length > 0) {
    console.log('⏭️  Repositories that opted out:');
    scanResults.optedOutRepos.forEach(repo => {
      console.log(`   - ${repo}`);
    });
    console.log('');
  }

  console.log('✅ Public repository scanning complete!\n');
  console.log('💡 Next steps:');
  console.log('   1. Review the training data');
  console.log('   2. Combine with existing training data');
  console.log('   3. Train improved models');
  console.log('   4. Document compliance\n');
}

// Run
main().catch(error => {
  console.error('❌ Error:', error.message);
  console.error(error.stack);
  process.exit(1);
});

