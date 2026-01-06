#!/usr/bin/env node

/**
 * Discover High-Value Repository Targets
 * 
 * Scans thousands of GitHub repositories to find the best 500
 * based on quality criteria, language diversity, and other attributes
 */

const { Octokit } = require('@octokit/rest');
const { RepositoryDiscovery } = require('../lib/mlops/repositoryDiscovery');
const { PublicRepoScanner } = require('../lib/mlops/publicRepoScanner');
const fs = require('fs-extra');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../website/.env.local') });

const OUTPUT_DIR = path.join(__dirname, '../.beast-mode/training-data/discovered-repos');
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

      // Try app_config.github_token
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
    console.log('⚠️  Error checking Supabase:', error.message);
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
 * Main function
 */
async function main() {
  console.log('🎯 High-Value Repository Discovery\n');
  console.log('='.repeat(60));
  console.log('📋 This script will:');
  console.log('   1. Search thousands of GitHub repositories');
  console.log('   2. Score them based on quality criteria');
  console.log('   3. Select diverse top 500 (languages, types)');
  console.log('   4. Save target list for ML training\n');

  // Get GitHub token
  const token = await getGitHubToken();
  if (!token) {
    console.error('❌ GITHUB_TOKEN not found!');
    console.error('   Set GITHUB_TOKEN environment variable or add to .env.local');
    console.error('   Or store in Supabase app_config table');
    process.exit(1);
  }

  console.log(`✅ GitHub token found (${token.substring(0, 10)}...)\n`);

  const octokit = new Octokit({ auth: token });
  const discovery = new RepositoryDiscovery(octokit);

  // Discovery criteria
  const searchCriteria = {
    languages: [
      'javascript',
      'typescript',
      'python',
      'rust',
      'go',
      'java',
      'cpp',
      'csharp',
      'ruby',
      'php',
      'swift',
      'kotlin',
    ],
    minStars: 10,      // Minimum quality threshold
    maxStars: 100000,  // Avoid overly popular (may be less diverse)
    minForks: 5,       // Some community engagement
    hasLicense: true,   // Legal compliance
  };

  const diversityCriteria = {
    minPerLanguage: 20,   // At least 20 per language
    maxPerLanguage: 100,  // Max 100 per language
    languageDistribution: 'balanced', // Equal representation
  };

  console.log('🔍 Discovery Criteria:');
  console.log(`   Languages: ${searchCriteria.languages.length}`);
  console.log(`   Min stars: ${searchCriteria.minStars}`);
  console.log(`   Min forks: ${searchCriteria.minForks}`);
  console.log(`   Target: 500 repositories\n`);

  try {
    // Discover and select
    const selection = await discovery.discoverAndSelect({
      targetCount: 500,
      searchCriteria,
      diversityCriteria,
    });

    // Save results
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputPath = path.join(OUTPUT_DIR, `high-value-repos-${timestamp}.json`);

    await fs.writeFile(outputPath, JSON.stringify({
      metadata: {
        discoveredAt: new Date().toISOString(),
        targetCount: 500,
        searched: selection.statistics.total,
        criteria: {
          search: searchCriteria,
          diversity: diversityCriteria,
        },
      },
      statistics: selection.statistics,
      repositories: selection.repositories.map(r => ({
        fullName: r.fullName,
        url: r.url,
        language: r.language,
        stars: r.stars,
        forks: r.forks,
        score: r.score,
        scoreBreakdown: r.scoreBreakdown,
        license: r.license,
        description: r.description,
        topics: r.topics,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        pushedAt: r.pushedAt,
      })),
    }, null, 2));

    console.log(`💾 Saved target list to: ${outputPath}\n`);

    // Generate summary
    console.log('📊 Final Selection Summary:');
    console.log(`   Total repositories: ${selection.repositories.length}`);
    console.log(`   Languages: ${Object.keys(selection.statistics.byLanguage).length}`);
    console.log(`   Average score: ${selection.statistics.avgScore.toFixed(2)}`);
    console.log(`   Score range: ${selection.statistics.minScore.toFixed(2)} - ${selection.statistics.maxScore.toFixed(2)}\n`);

    console.log('📋 Language Distribution:');
    Object.entries(selection.statistics.byLanguage)
      .sort((a, b) => b[1] - a[1])
      .forEach(([lang, count]) => {
        console.log(`   ${lang}: ${count} repos`);
      });
    console.log('');

    // Save as simple list for scanning
    const listPath = path.join(OUTPUT_DIR, `target-list-${timestamp}.txt`);
    const repoList = selection.repositories.map(r => r.fullName).join('\n');
    await fs.writeFile(listPath, repoList);

    console.log(`💾 Saved target list (simple) to: ${listPath}\n`);

    console.log('✅ Discovery Complete!\n');
    console.log('💡 Next Steps:');
    console.log(`   1. Review target list: ${outputPath}`);
    console.log(`   2. Scan repositories: node scripts/scan-discovered-repos.js`);
    console.log(`   3. Train models with high-quality data\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();

