#!/usr/bin/env node

/**
 * Discover Lower Quality Repositories
 * 
 * Discovers repos with lower stars/engagement to balance the dataset
 * and improve model training with diverse quality distribution
 */

const fs = require('fs-extra');
const path = require('path');
const { Octokit } = require('@octokit/rest');
require('dotenv').config({ path: path.join(__dirname, '../../echeo-landing/.env.local') });

const DISCOVERED_DIR = path.join(__dirname, '../.beast-mode/training-data/discovered-repos');

/**
 * Get GitHub token from multiple sources
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
 * Discover repos in specific star ranges for quality diversity
 */
async function discoverReposByStarRange(octokit, minStars, maxStars, count, language = null) {
  const repos = [];
  let page = 1;
  const perPage = 100;
  const maxPages = 10;

  const languageQuery = language ? ` language:${language}` : '';
  const query = `stars:${minStars}..${maxStars}${languageQuery} sort:updated`;

  console.log(`   🔍 Discovering ${count} repos (${minStars}-${maxStars} stars${language ? `, ${language}` : ''})...`);

  while (repos.length < count && page <= maxPages) {
    try {
      const { data } = await octokit.rest.search.repos({
        q: query,
        per_page: Math.min(perPage, count - repos.length),
        page: page,
        sort: 'updated',
        order: 'desc'
      });

      if (data.items.length === 0) break;

      for (const repo of data.items) {
        if (repos.length >= count) break;
        
        // Filter out forks and archived repos
        if (repo.fork || repo.archived) continue;
        
        repos.push({
          repo: repo.full_name,
          url: repo.html_url,
          stars: repo.stargazers_count,
          forks: repo.forks_count,
          language: repo.language || language || 'Unknown',
          description: repo.description,
          _targetQuality: 'low' // Mark for quality balancing
        });
      }

      page++;
      
      // Rate limit: wait 1 second between pages
      if (page <= maxPages && repos.length < count) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      if (error.status === 403) {
        console.error(`   ❌ Rate limit exceeded. Waiting 60s...`);
        await new Promise(resolve => setTimeout(resolve, 60 * 1000));
      } else {
        console.error(`   ❌ Error: ${error.message}`);
        break;
      }
    }
  }
  
  console.log(`   ✅ Found ${repos.length} repos`);
  return repos;
}

/**
 * Main function
 */
async function main() {
  console.log('📉 Discovering Lower Quality Repos for Dataset Balance\n');
  console.log('='.repeat(60));

  const token = await getGitHubToken();
  if (!token) {
    console.error('❌ GITHUB_TOKEN not found');
    process.exit(1);
  }

  const octokit = new Octokit({ auth: token });

  // Discover repos across different star ranges to get quality diversity
  // Target: ~1000 repos, heavily weighted toward low engagement
  const discoveryTargets = [
    { minStars: 5, maxStars: 20, count: 300, label: 'very-low' },       // Very low engagement
    { minStars: 20, maxStars: 50, count: 250, label: 'low' },            // Low engagement
    { minStars: 50, maxStars: 100, count: 200, label: 'medium-low' },    // Medium-low engagement
    { minStars: 100, maxStars: 200, count: 150, label: 'medium' },       // Medium engagement
    { minStars: 200, maxStars: 500, count: 100, label: 'medium-high' },  // Medium-high (already have many high)
  ];

  const allRepos = [];
  const languages = ['JavaScript', 'Python', 'TypeScript', 'Java', 'Go', 'Rust', 'C++', 'C#'];

  for (const target of discoveryTargets) {
    console.log(`\n📊 Discovering ${target.label} quality repos (${target.minStars}-${target.maxStars} stars)...`);
    
    // Get some repos without language filter (diverse)
    const generalRepos = await discoverReposByStarRange(
      octokit, 
      target.minStars, 
      target.maxStars, 
      Math.floor(target.count * 0.6)
    );
    allRepos.push(...generalRepos);

    // Get some repos for each language (diverse languages)
    const perLanguage = Math.floor((target.count * 0.4) / languages.length);
    for (const lang of languages.slice(0, 3)) { // Limit to 3 languages to avoid too many API calls
      const langRepos = await discoverReposByStarRange(
        octokit,
        target.minStars,
        target.maxStars,
        perLanguage,
        lang
      );
      allRepos.push(...langRepos);
      
      // Rate limit
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.log(`\n✅ Discovered ${allRepos.length} repos across quality spectrum`);

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outputPath = path.join(DISCOVERED_DIR, `lower-quality-repos-${timestamp}.json`);

  await fs.ensureDir(DISCOVERED_DIR);
  await fs.writeJson(outputPath, {
    metadata: {
      discoveredAt: new Date().toISOString(),
      source: 'quality-balancing',
      totalDiscovered: allRepos.length,
      starRanges: discoveryTargets.map(t => `${t.minStars}-${t.maxStars}`),
      purpose: 'Balance dataset quality distribution for better model training'
    },
    repositories: allRepos
  }, { spaces: 2 });

  console.log(`📄 Saved to: ${outputPath}\n`);
  console.log('='.repeat(60));
  console.log('✅ Discovery complete!\n');
  console.log('💡 Next: Scan these repos with:');
  console.log('   node scripts/scan-lower-quality-repos.js\n');
}

if (require.main === module) {
  main().catch(console.error);
}

