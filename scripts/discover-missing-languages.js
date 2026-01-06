#!/usr/bin/env node

/**
 * Discover Repositories for Missing Languages
 * 
 * Auto-discovers and scans repos for languages with coverage gaps
 * Based on language coverage analysis
 */

const fs = require('fs-extra');
const path = require('path');
const { Octokit } = require('@octokit/rest');
const { PublicRepoScanner } = require('../lib/mlops/publicRepoScanner');

const DISCOVERED_DIR = path.join(__dirname, '../.beast-mode/training-data/discovered-repos');
const SCANNED_DIR = path.join(__dirname, '../.beast-mode/training-data/scanned-repos');

// Language coverage targets (from analysis)
const LANGUAGE_TARGETS = {
  // Critical (need 100+)
  'Java': { current: 92, target: 100, priority: 'critical' },
  'Rust': { current: 69, target: 100, priority: 'critical' },
  'C#': { current: 76, target: 100, priority: 'critical' },
  'Go': { current: 93, target: 100, priority: 'critical' },
  
  // High (need 80+)
  'Swift': { current: 79, target: 80, priority: 'high' },
  'Ruby': { current: 59, target: 80, priority: 'high' },
  'Shell': { current: 0, target: 80, priority: 'high' },
  'C': { current: 0, target: 80, priority: 'high' },
  'HTML': { current: 0, target: 50, priority: 'high' },
  'CSS': { current: 0, target: 50, priority: 'high' },
  
  // Medium (need 50+)
  'Scala': { current: 25, target: 50, priority: 'medium' },
  'R': { current: 4, target: 50, priority: 'medium' },
  'Haskell': { current: 11, target: 50, priority: 'medium' },
  'Elixir': { current: 14, target: 50, priority: 'medium' },
  'Dart': { current: 54, target: 50, priority: 'medium' }, // Already met
};

// GitHub language name mapping
const GITHUB_LANGUAGE_MAP = {
  'C#': 'csharp',
  'C++': 'cpp',
  'JavaScript': 'javascript',
  'TypeScript': 'typescript',
  'Shell': 'shell',
  'HTML': 'html',
  'CSS': 'css',
  'R': 'r',
};

/**
 * Get GitHub language name
 */
function getGitHubLanguageName(lang) {
  return GITHUB_LANGUAGE_MAP[lang] || lang.toLowerCase();
}

/**
 * Discover repos for a specific language
 */
async function discoverReposForLanguage(octokit, language, count, minStars = 100) {
  const githubLang = getGitHubLanguageName(language);
  const repos = [];
  let page = 1;
  const perPage = 100;

  console.log(`   🔍 Discovering ${count} ${language} repos (min ${minStars} stars)...`);

  while (repos.length < count && page <= 10) {
    try {
      const { data } = await octokit.rest.search.repos({
        q: `language:${githubLang} stars:>${minStars} sort:stars`,
        per_page: Math.min(perPage, count - repos.length),
        page: page
      });

      if (data.items.length === 0) break;

      for (const repo of data.items) {
        if (repos.length >= count) break;
        repos.push({
          repo: repo.full_name,
          url: repo.html_url,
          stars: repo.stargazers_count,
          language: repo.language || language,
          description: repo.description
        });
      }

      page++;
      
      // Rate limit: wait 1 second between pages
      if (page <= 10) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      if (error.status === 403) {
        console.log(`   ⚠️  Rate limited, waiting 60 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 60000));
      } else {
        console.error(`   ❌ Error discovering ${language}:`, error.message);
        break;
      }
    }
  }

  return repos;
}

/**
 * Discover repos for missing languages
 */
async function discoverMissingLanguages(options = {}) {
  const { priority = 'all', maxRepos = 500, minStars = 100 } = options;

  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (!token) {
    throw new Error('GITHUB_TOKEN or GH_TOKEN environment variable required');
  }

  const octokit = new Octokit({ auth: token });

  // Filter languages by priority
  let languagesToDiscover = Object.entries(LANGUAGE_TARGETS)
    .filter(([lang, data]) => {
      const gap = data.target - data.current;
      return gap > 0 && (priority === 'all' || data.priority === priority);
    })
    .map(([lang, data]) => ({
      language: lang,
      gap: data.target - data.current,
      priority: data.priority
    }))
    .sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return b.gap - a.gap;
    });

  if (languagesToDiscover.length === 0) {
    console.log('✅ No missing languages to discover!');
    return;
  }

  console.log(`🌍 Discovering Repos for Missing Languages\n`);
  console.log(`   Priority: ${priority}`);
  console.log(`   Languages: ${languagesToDiscover.length}`);
  console.log(`   Total needed: ${languagesToDiscover.reduce((sum, l) => sum + l.gap, 0)} repos\n`);

  const allRepos = [];

  for (const { language, gap } of languagesToDiscover) {
    if (allRepos.length >= maxRepos) break;

    const count = Math.min(gap, maxRepos - allRepos.length);
    const repos = await discoverReposForLanguage(octokit, language, count, minStars);
    allRepos.push(...repos);

    console.log(`   ✅ Found ${repos.length} ${language} repos\n`);
  }

  // Save discovered repos
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outputPath = path.join(DISCOVERED_DIR, `missing-languages-${timestamp}.json`);
  
  await fs.ensureDir(DISCOVERED_DIR);
  await fs.writeJson(outputPath, {
    metadata: {
      discoveredAt: new Date().toISOString(),
      priority,
      totalRepos: allRepos.length,
      languages: languagesToDiscover.map(l => l.language)
    },
    repositories: allRepos
  }, { spaces: 2 });

  console.log(`✅ Discovered ${allRepos.length} repos`);
  console.log(`📄 Saved to: ${outputPath}\n`);

  return outputPath;
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const priority = args.includes('--critical') ? 'critical' :
                   args.includes('--high') ? 'high' :
                   args.includes('--medium') ? 'medium' : 'all';
  
  const maxRepos = parseInt(args.find(a => a.startsWith('--max='))?.split('=')[1] || '500');
  const minStars = parseInt(args.find(a => a.startsWith('--min-stars='))?.split('=')[1] || '100');

  try {
    await discoverMissingLanguages({ priority, maxRepos, minStars });
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { discoverMissingLanguages };
