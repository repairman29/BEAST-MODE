#!/usr/bin/env node

/**
 * Discover More High-Value Repositories
 * 
 * Options:
 * 1. Discover more repos with different criteria
 * 2. Discover repos in different languages
 * 3. Discover repos with different quality ranges
 */

const { Octokit } = require('@octokit/rest');
const { RepositoryDiscovery } = require('../lib/mlops/repositoryDiscovery');
const fs = require('fs-extra');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '../website/.env.local') });

const OUTPUT_DIR = path.join(__dirname, '../.beast-mode/training-data/discovered-repos');
fs.ensureDirSync(OUTPUT_DIR);

/**
 * Get GitHub token
 */
async function getGitHubToken() {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
  
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

      if (config?.value?.token) return config.value.token;
      
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

  return null;
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const targetCount = parseInt(args[0]) || 500;
  const strategy = args[1] || 'diverse'; // diverse, high-quality, different-languages

  console.log('🔍 Discovering More High-Value Repositories\n');
  console.log('='.repeat(60));
  console.log(`📋 Strategy: ${strategy}`);
  console.log(`📊 Target: ${targetCount} repositories\n`);

  const token = await getGitHubToken();
  if (!token) {
    console.error('❌ GITHUB_TOKEN not found!');
    process.exit(1);
  }

  const octokit = new Octokit({ auth: token });
  const discovery = new RepositoryDiscovery(octokit);

  // Different strategies
  let searchCriteria, diversityCriteria;

  if (strategy === 'high-quality') {
    // Focus on very high-quality repos
    searchCriteria = {
      languages: ['typescript', 'javascript', 'python', 'rust', 'go'],
      minStars: 100,      // Higher threshold
      maxStars: 50000,
      minForks: 20,       // More engagement
      hasLicense: true,
    };
    diversityCriteria = {
      minPerLanguage: 50,
      maxPerLanguage: 200,
      languageDistribution: 'proportional',
    };
  } else if (strategy === 'different-languages') {
    // Focus on less common languages
    searchCriteria = {
      languages: ['rust', 'go', 'swift', 'kotlin', 'scala', 'clojure', 'haskell', 'elixir'],
      minStars: 50,
      maxStars: 20000,
      minForks: 10,
      hasLicense: true,
    };
    diversityCriteria = {
      minPerLanguage: 30,
      maxPerLanguage: 150,
      languageDistribution: 'balanced',
    };
  } else {
    // Diverse strategy (default)
    searchCriteria = {
      languages: [
        'javascript', 'typescript', 'python', 'rust', 'go', 'java',
        'cpp', 'csharp', 'ruby', 'php', 'swift', 'kotlin',
        'scala', 'clojure', 'haskell', 'elixir', 'dart', 'r'
      ],
      minStars: 10,
      maxStars: 100000,
      minForks: 5,
      hasLicense: true,
    };
    diversityCriteria = {
      minPerLanguage: 20,
      maxPerLanguage: 100,
      languageDistribution: 'balanced',
    };
  }

  console.log('🔍 Search Criteria:');
  console.log(`   Languages: ${searchCriteria.languages.length}`);
  console.log(`   Min stars: ${searchCriteria.minStars}`);
  console.log(`   Min forks: ${searchCriteria.minForks}\n`);

  try {
    const selection = await discovery.discoverAndSelect({
      targetCount,
      searchCriteria,
      diversityCriteria,
    });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputPath = path.join(OUTPUT_DIR, `high-value-repos-${strategy}-${timestamp}.json`);

    await fs.writeFile(outputPath, JSON.stringify({
      metadata: {
        discoveredAt: new Date().toISOString(),
        strategy,
        targetCount,
        searched: selection.statistics.total,
        criteria: { search: searchCriteria, diversity: diversityCriteria },
      },
      statistics: selection.statistics,
      repositories: selection.repositories.map(r => ({
        fullName: r.fullName,
        url: r.url,
        language: r.language,
        stars: r.stars,
        forks: r.forks,
        score: r.score,
        license: r.license,
      })),
    }, null, 2));

    console.log(`💾 Saved to: ${outputPath}\n`);
    console.log(`✅ Discovered ${selection.repositories.length} repositories`);
    console.log(`   Average score: ${selection.statistics.avgScore.toFixed(2)}`);
    console.log(`   Languages: ${Object.keys(selection.statistics.byLanguage).length}\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();

