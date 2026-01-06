#!/usr/bin/env node

/**
 * Scan Notable Repositories
 * 
 * Scans the discovered notable repositories to extract features
 * for ML training
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../website/.env.local') });

const fs = require('fs-extra');
const { PublicRepoScanner } = require('../lib/mlops/publicRepoScanner');
const { getAuditTrail } = require('../lib/mlops/auditTrail');
const { Octokit } = require('@octokit/rest');

const OUTPUT_DIR = path.join(__dirname, '../.beast-mode/training-data');
const DISCOVERED_DIR = path.join(OUTPUT_DIR, 'discovered-repos');
const SCANNED_DIR = path.join(OUTPUT_DIR, 'scanned-repos');
fs.ensureDirSync(SCANNED_DIR);

/**
 * Load latest discovered repos
 */
function loadLatestDiscovered() {
  const files = fs.readdirSync(DISCOVERED_DIR)
    .filter(f => f.startsWith('notable-repos-') && f.endsWith('.json'))
    .sort()
    .reverse();

  if (files.length === 0) {
    throw new Error('No discovered repository files found. Run discover-notable-repos.js first.');
  }

  const latestFile = files[0];
  const filePath = path.join(DISCOVERED_DIR, latestFile);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  console.log(`📂 Loaded: ${latestFile}`);
  console.log(`   Repositories: ${data.repositories?.length || 0}\n`);

  return data.repositories || [];
}

/**
 * Scan repositories with parallel processing for speed
 */
async function scanNotableRepos(options = {}) {
  const { 
    maxRepos = 1000, 
    delayBetweenScans = 500,  // Reduced from 2000ms to 500ms
    concurrency = 3  // Process 3 repos in parallel
  } = options;

  console.log('🔍 Scanning Notable Repositories (Optimized)\n');
  console.log('='.repeat(60));

  const repos = loadLatestDiscovered();
  const reposToScan = repos.slice(0, maxRepos);

  console.log(`📊 Scanning ${reposToScan.length} repositories...`);
  console.log(`⚡ Concurrency: ${concurrency} parallel requests`);
  console.log(`⏱️  Delay between batches: ${delayBetweenScans}ms\n`);

  // Get GitHub token
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (!token) {
    throw new Error('GITHUB_TOKEN or GH_TOKEN environment variable required');
  }

  const octokit = new Octokit({ auth: token });
  const scanner = new PublicRepoScanner(octokit);

  const results = {
    successful: 0,
    failed: 0,
    optedOut: 0,
    trainingData: []
  };

  let progress = 0;
  const total = reposToScan.length;
  const startTime = Date.now();

  // Progress callback
  const onProgress = (current, total, repo, status) => {
    progress++;
    const percent = Math.round((progress / total) * 100);
    const bar = '█'.repeat(Math.floor(percent / 2)) + '░'.repeat(50 - Math.floor(percent / 2));
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
    const rate = progress > 0 ? (progress / ((Date.now() - startTime) / 1000)).toFixed(1) : 0;
    const remaining = total - progress;
    const eta = rate > 0 ? Math.round(remaining / rate) : 0;
    
    if (progress % 10 === 0 || status === 'error' || status === 'opted-out' || progress === total) {
      console.log(`[${bar}] ${percent}% (${progress}/${total}) | ${rate}/s | ETA: ${eta}s | ${repo || 'Starting...'}`);
    }
  };

  // Process repos in parallel batches
  for (let i = 0; i < reposToScan.length; i += concurrency) {
    const batch = reposToScan.slice(i, i + concurrency);
    
    // Process batch in parallel
    const batchPromises = batch.map(async (repoInfo) => {
      const repoName = repoInfo.repo || repoInfo.url;
      
      try {
        const [owner, repo] = repoName.split('/');
        if (!owner || !repo) {
          results.failed++;
          onProgress(progress, total, repoName, 'error');
          return null;
        }

        // Check opt-out
        const optedOut = await scanner.checkOptOut(owner, repo);
        if (optedOut) {
          results.optedOut++;
          onProgress(progress, total, repoName, 'opted-out');
          return null;
        }

        // Scan repository
        const features = await scanner.scanPublicRepo(owner, repo);
        
        if (features) {
          results.successful++;
          onProgress(progress, total, repoName, 'success');
          return {
            repo: repoName,
            url: repoInfo.url || `https://github.com/${repoName}`,
            features,
            discoveredAt: repoInfo.created_at || new Date().toISOString(),
            originalStars: repoInfo.stars,
            originalForks: repoInfo.forks
          };
        } else {
          results.failed++;
          onProgress(progress, total, repoName, 'error');
          return null;
        }

      } catch (error) {
        results.failed++;
        onProgress(progress, total, repoName, 'error');
        
        if (error.status === 403) {
          console.log(`\n⚠️  Rate limit exceeded. Waiting 60 seconds...`);
          await new Promise(resolve => setTimeout(resolve, 60000));
        } else if (error.status !== 404) {
          console.log(`\n⚠️  Error scanning ${repoName}: ${error.message}`);
        }
        return null;
      }
    });

    // Wait for batch to complete
    const batchResults = await Promise.all(batchPromises);
    
    // Add successful results
    batchResults.forEach(result => {
      if (result) {
        results.trainingData.push(result);
      }
    });

    // Rate limit handling - delay between batches (not individual repos)
    if (i + concurrency < reposToScan.length) {
      await new Promise(resolve => setTimeout(resolve, delayBetweenScans));
    }
  }

  console.log('\n📊 Scanning Complete!\n');
  console.log('='.repeat(60));
  console.log(`✅ Successful: ${results.successful}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`⏭️  Opted out: ${results.optedOut}`);
  console.log(`📈 Success rate: ${((results.successful / reposToScan.length) * 100).toFixed(1)}%\n`);

  // Save results
  const output = {
    metadata: {
      scannedAt: new Date().toISOString(),
      source: 'notable-repos',
      totalAttempted: reposToScan.length,
      successful: results.successful,
      failed: results.failed,
      optedOut: results.optedOut,
      successRate: (results.successful / reposToScan.length) * 100
    },
    trainingData: results.trainingData
  };

  const outputPath = path.join(SCANNED_DIR, `scanned-repos-notable-${new Date().toISOString().replace(/:/g, '-').split('.')[0]}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

  console.log(`💾 Saved to: ${outputPath}\n`);

  const auditTrail = await getAuditTrail();
  await auditTrail.log('scan_complete', {
    type: 'notable-repos',
    successful: results.successful,
    failed: results.failed,
    optedOut: results.optedOut,
    outputPath
  });

  return results;
}

if (require.main === module) {
  // Optimized settings: 3x faster with parallel processing
  scanNotableRepos({ 
    maxRepos: 1000, 
    delayBetweenScans: 500,  // Reduced delay
    concurrency: 3  // 3 parallel requests
  })
    .then(() => {
      console.log('✅ Scanning complete!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Error:', error);
      process.exit(1);
    });
}

module.exports = { scanNotableRepos };

