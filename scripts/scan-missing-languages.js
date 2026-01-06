#!/usr/bin/env node

/**
 * Scan Missing Languages Repositories
 * 
 * Scans the discovered missing language repositories
 */

const path = require('path');
const fs = require('fs-extra');
const { PublicRepoScanner } = require('../lib/mlops/publicRepoScanner');
const { Octokit } = require('@octokit/rest');

// Load environment variables
try {
  const envPath = path.join(__dirname, '../../echeo-landing/.env.local');
  if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
  }
} catch (e) {
  // Ignore
}

const DISCOVERED_DIR = path.join(__dirname, '../.beast-mode/training-data/discovered-repos');
const SCANNED_DIR = path.join(__dirname, '../.beast-mode/training-data/scanned-repos');
fs.ensureDirSync(SCANNED_DIR);

/**
 * Get GitHub token
 */
async function getGitHubToken() {
  if (process.env.GITHUB_TOKEN || process.env.GH_TOKEN) {
    return process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  }

  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data: config } = await supabase
        .from('app_config')
        .select('value')
        .eq('key', 'github')
        .maybeSingle();

      if (config?.value) {
        const value = typeof config.value === 'string' ? JSON.parse(config.value) : config.value;
        if (value.token) return value.token;
        if (typeof value === 'string' && value.startsWith('ghp_')) return value;
      }
    }
  } catch (error) {
    // Ignore
  }

  return null;
}

/**
 * Load latest missing-languages discovery file
 */
function loadLatestDiscovery() {
  const files = fs.readdirSync(DISCOVERED_DIR)
    .filter(f => f.startsWith('missing-languages-') && f.endsWith('.json'))
    .sort()
    .reverse();

  if (files.length === 0) {
    throw new Error('No missing-languages discovery files found');
  }

  const latestFile = files[0];
  const filePath = path.join(DISCOVERED_DIR, latestFile);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  console.log(`📂 Loaded: ${latestFile}`);
  console.log(`   Repositories: ${data.repositories?.length || 0}\n`);

  return data.repositories || [];
}

/**
 * Scan repositories
 */
async function scanMissingLanguages(options = {}) {
  const { maxRepos = 1000, delayBetweenScans = 500, concurrency = 3 } = options;

  console.log('🔍 Scanning Missing Languages Repositories\n');
  console.log('='.repeat(60));

  const repos = loadLatestDiscovery();
  const reposToScan = repos.slice(0, maxRepos);
  const repoNamesToScan = reposToScan.map(r => r.repo || r.url);

  console.log(`📊 Scanning ${reposToScan.length} repositories with ${concurrency} concurrent requests...`);
  console.log(`⏱️  Delay between batches: ${delayBetweenScans}ms\n`);

  const token = await getGitHubToken();
  if (!token) {
    throw new Error('GITHUB_TOKEN not found');
  }

  const octokit = new Octokit({ auth: token });
  const scanner = new PublicRepoScanner(octokit);

  const scanResults = await scanner.batchScan(repoNamesToScan, {
    maxRepos: reposToScan.length,
    delayBetweenScans: delayBetweenScans,
    concurrency: concurrency,
    onProgress: (current, total, repo, status) => {
      const percent = Math.round((current / total) * 100);
      const bar = '█'.repeat(Math.floor(percent / 2)) + '░'.repeat(50 - Math.floor(percent / 2));
      
      if (current % 10 === 0 || status === 'error' || status === 'opted-out' || current === total) {
        console.log(`[${bar}] ${percent}% (${current}/${total}) - ${repo || 'Starting...'}`);
      }
    }
  });

  const trainingData = scanResults
    .filter(r => r && r.features)
    .map(r => ({
      repo: r.repo,
      url: r.url || `https://github.com/${r.repo}`,
      features: r.features,
      language: r.language || reposToScan.find(repo => (repo.repo || repo.url) === r.repo)?.language
    }));

  // Save results
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outputPath = path.join(SCANNED_DIR, `scanned-repos-missing-languages-${timestamp}.json`);

  await fs.writeJson(outputPath, {
    metadata: {
      scannedAt: new Date().toISOString(),
      source: 'missing-languages-discovery',
      totalRepos: reposToScan.length,
      successful: trainingData.length,
      failed: reposToScan.length - trainingData.length,
      languages: [...new Set(trainingData.map(r => r.language).filter(Boolean))]
    },
    trainingData
  }, { spaces: 2 });

  console.log(`\n✅ Scanned ${trainingData.length} repositories`);
  console.log(`📄 Saved to: ${outputPath}\n`);

  return outputPath;
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const maxRepos = parseInt(args.find(a => a.startsWith('--max='))?.split('=')[1] || '1000');

  try {
    await scanMissingLanguages({ maxRepos });
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { scanMissingLanguages };

