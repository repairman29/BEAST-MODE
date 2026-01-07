#!/usr/bin/env node

/**
 * Scan Lower Quality Repositories
 * 
 * Scans the discovered lower-quality repos to add to training dataset
 */

const fs = require('fs-extra');
const path = require('path');
const { Octokit } = require('@octokit/rest');
const { PublicRepoScanner } = require('../lib/mlops/publicRepoScanner');
require('dotenv').config({ path: path.join(__dirname, '../../echeo-landing/.env.local') });

const DISCOVERED_DIR = path.join(__dirname, '../.beast-mode/training-data/discovered-repos');
const SCANNED_DIR = path.join(__dirname, '../.beast-mode/training-data/scanned-repos');
fs.ensureDirSync(SCANNED_DIR);

/**
 * Load latest lower-quality discovery
 */
function loadLatestDiscovery() {
  const files = fs.readdirSync(DISCOVERED_DIR)
    .filter(f => f.startsWith('lower-quality-repos-') && f.endsWith('.json'))
    .sort()
    .reverse();

  if (files.length === 0) {
    throw new Error('No lower-quality discovery files found. Run discover-lower-quality-repos.js first.');
  }

  const filePath = path.join(DISCOVERED_DIR, files[0]);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  return data.repositories || [];
}

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

      const { data: tokenConfig } = await supabase
        .from('app_config')
        .select('value')
        .eq('key', 'github_token')
        .maybeSingle();

      if (tokenConfig?.value) {
        const value = typeof tokenConfig.value === 'string' 
          ? JSON.parse(tokenConfig.value) 
          : tokenConfig.value;
        return value.token || value;
      }

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
    console.log('⚠️  Error checking Supabase:', error.message);
  }

  return null;
}

/**
 * Scan repositories
 */
async function scanLowerQualityRepos(options = {}) {
  const { maxRepos = 500, delayBetweenScans = 500, concurrency = 3 } = options;

  console.log('📉 Scanning Lower Quality Repositories\n');
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

  const resultsArray = scanResults?.results || (Array.isArray(scanResults) ? scanResults : []);

  console.log(`\n📊 Processing ${resultsArray.length} scan results...`);

  const trainingData = resultsArray
    .filter(r => r && (r.repo || r.metadata))
    .map(r => {
      const metadata = r.metadata || r;
      const repoName = metadata.repo || r.repo;
      const originalRepo = reposToScan.find(repo => {
        const repoKey = repo.repo || repo.url?.replace('https://github.com/', '');
        return repoKey === repoName || repoKey === `https://github.com/${repoName}`;
      });
      
      const normalizedMetadata = {
        repo: repoName,
        url: metadata.url || originalRepo?.url || `https://github.com/${repoName}`,
        stars: metadata.stars || 0,
        forks: metadata.forks || 0,
        openIssues: metadata.openIssues || 0,
        fileCount: metadata.fileCount || 0,
        codeFileCount: metadata.codeFileCount || 0,
        hasLicense: metadata.hasLicense || 0,
        hasDescription: metadata.hasDescription || 0,
        hasTopics: metadata.hasTopics || 0,
        hasTests: metadata.hasTests || 0,
        hasCI: metadata.hasCI || 0,
        hasDocker: metadata.hasDocker || 0,
        hasConfig: metadata.hasConfig || 0,
        hasReadme: metadata.hasReadme || 0,
        language: metadata.language || originalRepo?.language || 'Unknown',
        primaryLanguage: metadata.language || originalRepo?.language || 'Unknown',
        createdAt: metadata.createdAt,
        updatedAt: metadata.updatedAt,
        pushedAt: metadata.pushedAt,
        repoAgeDays: metadata.createdAt ? Math.floor((Date.now() - new Date(metadata.createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 0,
        daysSincePush: metadata.pushedAt ? Math.floor((Date.now() - new Date(metadata.pushedAt).getTime()) / (1000 * 60 * 60 * 24)) : 365,
        daysSinceUpdate: metadata.updatedAt ? Math.floor((Date.now() - new Date(metadata.updatedAt).getTime()) / (1000 * 60 * 60 * 24)) : 365,
        isActive: metadata.pushedAt ? (Date.now() - new Date(metadata.pushedAt).getTime() < 90 * 24 * 60 * 60 * 1000 ? 1 : 0) : 0,
        starsForksRatio: metadata.forks > 0 ? metadata.stars / metadata.forks : 0,
        starsPerFile: metadata.fileCount > 0 ? metadata.stars / metadata.fileCount : 0,
        engagementPerIssue: metadata.openIssues > 0 ? (metadata.stars + metadata.forks) / metadata.openIssues : 0,
        codeFileRatio: metadata.fileCount > 0 ? metadata.codeFileCount / metadata.fileCount : 0,
        codeQualityScore: 0,
        communityHealth: 0,
        totalFiles: metadata.fileCount || 0,
        totalLines: 0,
      };
      
      const features = {
        metadata: normalizedMetadata
      };
      
      return {
        repo: repoName || originalRepo?.repo || 'unknown',
        url: normalizedMetadata.url,
        features: features,
        language: normalizedMetadata.language
      };
    });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outputPath = path.join(SCANNED_DIR, `scanned-repos-lower-quality-${timestamp}.json`);

  await fs.writeJson(outputPath, {
    metadata: {
      scannedAt: new Date().toISOString(),
      source: 'quality-balancing',
      totalRepos: reposToScan.length,
      successful: trainingData.length,
      failed: reposToScan.length - trainingData.length,
      languages: [...new Set(trainingData.map(r => r.language).filter(Boolean))]
    },
    trainingData
  }, { spaces: 2 });

  console.log(`\n✅ Scanned ${trainingData.length} repositories`);
  console.log(`📄 Saved to: ${outputPath}\n`);
  console.log('='.repeat(60));
  console.log('✅ Scanning complete!\n');
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const maxRepos = args.find(arg => arg.startsWith('--max='))?.split('=')[1];
  scanLowerQualityRepos({ maxRepos: maxRepos ? parseInt(maxRepos) : undefined }).catch(console.error);
}

