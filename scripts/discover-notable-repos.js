#!/usr/bin/env node

/**
 * Discover Notable High-Quality Repositories
 * 
 * Uses patterns from top-quality repos to find similar notable projects
 * Focuses on:
 * - High engagement (stars, forks)
 * - Well-maintained (tests, CI, docs)
 * - Active development
 * - Notable projects (GitHub trending, popular)
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../website/.env.local') });

const { Octokit } = require('@octokit/rest');
const fs = require('fs-extra');

const OUTPUT_DIR = path.join(__dirname, '../.beast-mode/training-data');
const DISCOVERED_DIR = path.join(OUTPUT_DIR, 'discovered-repos');
fs.ensureDirSync(DISCOVERED_DIR);

const { getAuditTrail } = require('../lib/mlops/auditTrail');

/**
 * Get GitHub token
 */
async function getGitHubToken() {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (!token) {
    throw new Error('GITHUB_TOKEN or GH_TOKEN environment variable required');
  }
  return token;
}

/**
 * Discover notable repos using multiple strategies
 */
async function discoverNotableRepos(options = {}) {
  const { targetCount = 1000, minStars = 5000 } = options;
  
  const token = await getGitHubToken();
  const octokit = new Octokit({ auth: token });
  
  const auditTrail = await getAuditTrail();
  await auditTrail.log('discovery_start', { targetCount, minStars });
  
  console.log('🔍 Discovering Notable High-Quality Repositories\n');
  console.log('='.repeat(60));
  console.log(`📊 Target: ${targetCount} repositories`);
  console.log(`⭐ Min stars: ${minStars.toLocaleString()}\n`);
  
  const discovered = new Set();
  const strategies = [
    // Strategy 1: Trending repositories (last 7 days)
    async () => {
      console.log('📈 Strategy 1: Trending Repositories (last 7 days)...');
      const repos = [];
      const languages = ['javascript', 'typescript', 'python', 'rust', 'go', 'java', 'cpp', 'csharp', 'ruby', 'php', 'swift', 'kotlin', 'scala', 'clojure', 'haskell', 'elixir', 'dart', 'r'];
      
      for (const lang of languages) {
        try {
          const { data } = await octokit.search.repos({
            q: `language:${lang} stars:>${minStars} pushed:>${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]} sort:stars`,
            per_page: 30,
            page: 1
          });
          
          for (const repo of data.items || []) {
            const key = `${repo.owner.login}/${repo.name}`;
            if (!discovered.has(key)) {
              discovered.add(key);
              repos.push({
                repo: key,
                url: repo.html_url,
                stars: repo.stargazers_count,
                forks: repo.forks_count,
                language: repo.language,
                description: repo.description,
                created_at: repo.created_at,
                updated_at: repo.updated_at,
                pushed_at: repo.pushed_at,
                open_issues: repo.open_issues_count,
                score: repo.stargazers_count * 0.5 + repo.forks_count * 0.3 + (repo.open_issues_count || 0) * 0.2
              });
            }
          }
          
          // Rate limit handling
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.log(`   ⚠️  Error searching ${lang}: ${error.message}`);
        }
      }
      
      console.log(`   ✅ Found ${repos.length} trending repos\n`);
      return repos;
    },
    
    // Strategy 2: Most starred repositories (all time, by language)
    async () => {
      console.log('⭐ Strategy 2: Most Starred Repositories (all time)...');
      const repos = [];
      const languages = ['javascript', 'typescript', 'python', 'rust', 'go', 'java', 'cpp', 'csharp', 'ruby', 'php', 'swift', 'kotlin', 'scala', 'clojure', 'haskell', 'elixir', 'dart', 'r'];
      
      for (const lang of languages) {
        try {
          const { data } = await octokit.search.repos({
            q: `language:${lang} stars:>${minStars} sort:stars`,
            per_page: 50,
            page: 1
          });
          
          for (const repo of data.items || []) {
            const key = `${repo.owner.login}/${repo.name}`;
            if (!discovered.has(key)) {
              discovered.add(key);
              repos.push({
                repo: key,
                url: repo.html_url,
                stars: repo.stargazers_count,
                forks: repo.forks_count,
                language: repo.language,
                description: repo.description,
                created_at: repo.created_at,
                updated_at: repo.updated_at,
                pushed_at: repo.pushed_at,
                open_issues: repo.open_issues_count,
                score: repo.stargazers_count * 0.5 + repo.forks_count * 0.3 + (repo.open_issues_count || 0) * 0.2
              });
            }
          }
          
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.log(`   ⚠️  Error searching ${lang}: ${error.message}`);
        }
      }
      
      console.log(`   ✅ Found ${repos.length} most starred repos\n`);
      return repos;
    },
    
    // Strategy 3: Recently updated high-quality repos
    async () => {
      console.log('🔄 Strategy 3: Recently Updated High-Quality Repos...');
      const repos = [];
      const languages = ['javascript', 'typescript', 'python', 'rust', 'go', 'java', 'cpp', 'csharp', 'ruby', 'php', 'swift', 'kotlin', 'scala', 'clojure', 'haskell', 'elixir', 'dart', 'r'];
      
      for (const lang of languages) {
        try {
          const { data } = await octokit.search.repos({
            q: `language:${lang} stars:>${minStars} pushed:>${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]} sort:updated`,
            per_page: 30,
            page: 1
          });
          
          for (const repo of data.items || []) {
            const key = `${repo.owner.login}/${repo.name}`;
            if (!discovered.has(key)) {
              discovered.add(key);
              repos.push({
                repo: key,
                url: repo.html_url,
                stars: repo.stargazers_count,
                forks: repo.forks_count,
                language: repo.language,
                description: repo.description,
                created_at: repo.created_at,
                updated_at: repo.updated_at,
                pushed_at: repo.pushed_at,
                open_issues: repo.open_issues_count,
                score: repo.stargazers_count * 0.5 + repo.forks_count * 0.3 + (repo.open_issues_count || 0) * 0.2
              });
            }
          }
          
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.log(`   ⚠️  Error searching ${lang}: ${error.message}`);
        }
      }
      
      console.log(`   ✅ Found ${repos.length} recently updated repos\n`);
      return repos;
    },
    
    // Strategy 4: High engagement ratio (forks/stars ratio indicates quality)
    async () => {
      console.log('📊 Strategy 4: High Engagement Ratio Repos...');
      const repos = [];
      const languages = ['javascript', 'typescript', 'python', 'rust', 'go', 'java', 'cpp', 'csharp', 'ruby', 'php', 'swift', 'kotlin', 'scala', 'clojure', 'haskell', 'elixir', 'dart', 'r'];
      
      for (const lang of languages) {
        try {
          // Search for repos with good fork/star ratio (indicates active use)
          const { data } = await octokit.search.repos({
            q: `language:${lang} stars:>${minStars} forks:>${Math.floor(minStars * 0.1)} sort:stars`,
            per_page: 30,
            page: 1
          });
          
          for (const repo of data.items || []) {
            const forkRatio = repo.forks_count / (repo.stargazers_count || 1);
            // Prefer repos with 5-30% fork ratio (active contributors)
            if (forkRatio >= 0.05 && forkRatio <= 0.3) {
              const key = `${repo.owner.login}/${repo.name}`;
              if (!discovered.has(key)) {
                discovered.add(key);
                repos.push({
                  repo: key,
                  url: repo.html_url,
                  stars: repo.stargazers_count,
                  forks: repo.forks_count,
                  language: repo.language,
                  description: repo.description,
                  created_at: repo.created_at,
                  updated_at: repo.updated_at,
                  pushed_at: repo.pushed_at,
                  open_issues: repo.open_issues_count,
                  score: repo.stargazers_count * 0.4 + repo.forks_count * 0.4 + forkRatio * 100
                });
              }
            }
          }
          
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.log(`   ⚠️  Error searching ${lang}: ${error.message}`);
        }
      }
      
      console.log(`   ✅ Found ${repos.length} high engagement ratio repos\n`);
      return repos;
    }
  ];
  
  // Execute all strategies
  const allRepos = [];
  for (const strategy of strategies) {
    try {
      const repos = await strategy();
      allRepos.push(...repos);
      
      if (allRepos.length >= targetCount) {
        break;
      }
    } catch (error) {
      console.log(`   ⚠️  Strategy error: ${error.message}`);
    }
  }
  
  // Remove duplicates and sort by score
  const uniqueRepos = Array.from(new Map(allRepos.map(r => [r.repo, r])).values());
  uniqueRepos.sort((a, b) => b.score - a.score);
  
  // Take top N
  const selected = uniqueRepos.slice(0, targetCount);
  
  console.log('📊 Discovery Summary:');
  console.log(`   Total discovered: ${uniqueRepos.length}`);
  console.log(`   Selected: ${selected.length}`);
  console.log(`   Min stars: ${Math.min(...selected.map(r => r.stars)).toLocaleString()}`);
  console.log(`   Max stars: ${Math.max(...selected.map(r => r.stars)).toLocaleString()}`);
  console.log(`   Avg stars: ${Math.round(selected.reduce((sum, r) => sum + r.stars, 0) / selected.length).toLocaleString()}\n`);
  
  // Language distribution
  const langDist = {};
  selected.forEach(r => {
    langDist[r.language] = (langDist[r.language] || 0) + 1;
  });
  
  console.log('📋 Language Distribution:');
  Object.entries(langDist)
    .sort((a, b) => b[1] - a[1])
    .forEach(([lang, count]) => {
      console.log(`   ${lang}: ${count} repos`);
    });
  
  // Save results
  const output = {
    metadata: {
      discoveredAt: new Date().toISOString(),
      targetCount,
      minStars,
      totalDiscovered: uniqueRepos.length,
      selected: selected.length,
      strategies: strategies.length
    },
    repositories: selected
  };
  
  const outputPath = path.join(DISCOVERED_DIR, `notable-repos-${new Date().toISOString().replace(/:/g, '-').split('.')[0]}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  
  console.log(`\n💾 Saved to: ${outputPath}`);
  
  await auditTrail.log('discovery_complete', {
    totalDiscovered: uniqueRepos.length,
    selected: selected.length,
    outputPath
  });
  
  return selected;
}

if (require.main === module) {
  discoverNotableRepos({ targetCount: 1000, minStars: 5000 })
    .then(() => {
      console.log('\n✅ Discovery complete!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Error:', error);
      process.exit(1);
    });
}

module.exports = { discoverNotableRepos };


