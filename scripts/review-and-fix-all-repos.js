#!/usr/bin/env node

/**
 * Review and Fix All Repositories
 * 
 * Uses BEAST MODE QA system to:
 * 1. Get all repositories (GitHub + Enterprise)
 * 2. Run quality checks on each
 * 3. Automatically fix issues where possible
 * 4. Generate comprehensive report
 */

const { execSync } = require('child_process');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

const BASE_URL = process.env.BEAST_MODE_API_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const OUTPUT_DIR = path.join(__dirname, '../reports/repo-reviews');
const BATCH_SIZE = 10; // Process repos in batches
const MAX_FIX_ATTEMPTS = 3;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Check if GitHub CLI is available
function hasGitHubCLI() {
  try {
    execSync('gh --version', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

// Discover repos from local directories
async function discoverLocalRepos() {
  const repos = [];
  const workspaceRoot = process.env.WORKSPACE_ROOT || path.resolve(__dirname, '../../..');
  
  try {
    log('📡 Discovering repositories from local directories...', 'cyan');
    
    // Look for directories with package.json (Node.js projects)
    const packageJsonFiles = execSync(`find "${workspaceRoot}" -maxdepth 3 -name "package.json" -type f 2>/dev/null`, {
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024
    }).trim().split('\n').filter(Boolean);
    
    for (const pkgPath of packageJsonFiles) {
      const dir = path.dirname(pkgPath);
      const dirName = path.basename(dir);
      const parentDir = path.basename(path.dirname(dir));
      
      // Skip node_modules and common non-repo directories
      if (dir.includes('node_modules') || dir.includes('.git') || dir.includes('dist') || dir.includes('build')) {
        continue;
      }
      
      // Try to get git remote URL
      let gitUrl = null;
      try {
        const gitRemote = execSync(`cd "${dir}" && git remote get-url origin 2>/dev/null`, {
          encoding: 'utf8',
          stdio: 'pipe'
        }).trim();
        
        if (gitRemote) {
          // Convert SSH to HTTPS if needed
          gitUrl = gitRemote.replace(/^git@github.com:/, 'https://github.com/').replace(/\.git$/, '');
          
          // Extract repo name from URL
          const match = gitUrl.match(/github\.com\/([^\/]+\/[^\/]+)/);
          if (match) {
            repos.push({
              name: match[1],
              url: gitUrl,
              private: false, // Assume public if we can't determine
              source: 'local-git',
              localPath: dir
            });
          }
        }
      } catch (e) {
        // Not a git repo or no remote, skip
      }
      
      // If no git remote, still add as local project
      if (!gitUrl && dirName !== 'node_modules') {
        const repoName = parentDir !== 'Smugglers' ? `${parentDir}/${dirName}` : dirName;
        repos.push({
          name: repoName,
          url: `file://${dir}`,
          private: true,
          source: 'local',
          localPath: dir
        });
      }
    }
    
    log(`  ✅ Found ${repos.length} local repositories/projects`, 'green');
  } catch (error) {
    log(`  ⚠️  Could not discover local repos: ${error.message}`, 'yellow');
  }
  
  return repos;
}

// Normalize repo identifier (owner/repo format)
function normalizeRepoName(nameOrUrl) {
  // If it's a URL, extract owner/repo
  const urlMatch = nameOrUrl.match(/github\.com[/:]([^/]+)\/([^/]+?)(?:\.git)?\/?$/);
  if (urlMatch) {
    return `${urlMatch[1]}/${urlMatch[2]}`;
  }
  // If it's already in owner/repo format, return as-is
  if (nameOrUrl.includes('/') && !nameOrUrl.includes('://')) {
    return nameOrUrl;
  }
  return nameOrUrl;
}

// Normalize URL to canonical form
function normalizeUrl(url) {
  if (!url || url.startsWith('file://')) return url;
  return url.replace(/^git@github.com:/, 'https://github.com/')
            .replace(/\.git$/, '')
            .replace(/\/$/, '');
}

// Deduplicate repos by canonical identifier
function deduplicateRepos(repos) {
  const repoMap = new Map();
  const duplicates = [];
  
  for (const repo of repos) {
    const normalizedName = normalizeRepoName(repo.name);
    const normalizedUrl = normalizeUrl(repo.url);
    
    // Create canonical key
    const key = normalizedName.includes('/') ? normalizedName : normalizedUrl;
    
    if (repoMap.has(key)) {
      // Merge with existing repo
      const existing = repoMap.get(key);
      duplicates.push({
        original: repo.name,
        mergedInto: existing.name,
        source: repo.source
      });
      
      // Merge local paths if available
      if (repo.localPath && !existing.localPaths) {
        existing.localPaths = [existing.localPath].filter(Boolean);
      }
      if (repo.localPath && existing.localPaths && !existing.localPaths.includes(repo.localPath)) {
        existing.localPaths.push(repo.localPath);
      }
      
      // Keep the best source (prioritize local-git > github-cli > others)
      const sourcePriority = { 'local-git': 3, 'github-cli': 2, 'beast-mode-api': 1, 'enterprise': 1, 'local': 0 };
      if (sourcePriority[repo.source] > (sourcePriority[existing.source] || 0)) {
        existing.source = repo.source;
      }
    } else {
      // New repo
      const repoData = {
        ...repo,
        name: normalizedName,
        url: normalizedUrl,
        localPaths: repo.localPath ? [repo.localPath] : []
      };
      delete repoData.localPath; // Use localPaths array instead
      repoMap.set(key, repoData);
    }
  }
  
  return {
    repos: Array.from(repoMap.values()),
    duplicates: duplicates
  };
}

// Fetch all repos using GitHub CLI
async function fetchAllRepos() {
  const allRepos = [];
  
  // First, discover local repos
  const localRepos = await discoverLocalRepos();
  allRepos.push(...localRepos);
  
  // Try to get repos from GitHub CLI
  if (hasGitHubCLI()) {
    try {
      log('📡 Fetching repositories from GitHub CLI...', 'cyan');
      const output = execSync('gh repo list --limit 1000 --json name,url,isPrivate,owner,nameWithOwner', { 
        encoding: 'utf8',
        maxBuffer: 10 * 1024 * 1024
      });
      const ghRepos = JSON.parse(output);
      
      ghRepos.forEach(repo => {
        const repoName = repo.nameWithOwner || `${repo.owner.login}/${repo.name}`;
        allRepos.push({
          name: repoName,
          url: repo.url,
          private: repo.isPrivate,
          source: 'github-cli'
        });
      });
      
      log(`  ✅ Found ${ghRepos.length} GitHub repositories`, 'green');
    } catch (error) {
      log(`  ⚠️  Could not fetch from GitHub CLI: ${error.message}`, 'yellow');
    }
  }
  
  // Try to get repos from BEAST MODE API
  try {
    log('📡 Fetching repositories from BEAST MODE API...', 'cyan');
    const response = await axios.get(`${BASE_URL}/api/github/repos`, {
      validateStatus: () => true,
      timeout: 10000,
    });
    
    if (response.status === 200 && response.data.repos) {
      response.data.repos.forEach(repo => {
        const repoName = repo.fullName || repo.name;
        allRepos.push({
          name: repoName,
          url: repo.url || `https://github.com/${repoName}`,
          private: repo.private || false,
          source: 'beast-mode-api'
        });
      });
      log(`  ✅ Found ${response.data.repos.length} repositories from API`, 'green');
    }
  } catch (error) {
    log(`  ⚠️  Could not fetch from API: ${error.message}`, 'yellow');
  }
  
  // Try to get enterprise repos
  try {
    const enterpriseResponse = await axios.get(`${BASE_URL}/api/beast-mode/enterprise/repos`, {
      validateStatus: () => true,
      timeout: 10000,
    });
    
    if (enterpriseResponse.status === 200 && enterpriseResponse.data.repos) {
      enterpriseResponse.data.repos.forEach(repo => {
        allRepos.push({
          name: repo.name,
          url: repo.url,
          private: true,
          source: 'enterprise'
        });
      });
      log(`  ✅ Found ${enterpriseResponse.data.repos.length} enterprise repositories`, 'green');
    }
  } catch (error) {
    log(`  ⚠️  Could not fetch enterprise repos: ${error.message}`, 'yellow');
  }
  
  // Deduplicate repos
  log('\n🔍 Deduplicating repositories...', 'cyan');
  const { repos, duplicates } = deduplicateRepos(allRepos);
  
  if (duplicates.length > 0) {
    log(`  ⚠️  Found ${duplicates.length} duplicate entries (merged)`, 'yellow');
    if (duplicates.length <= 10) {
      duplicates.forEach(dup => {
        log(`    - ${dup.original} → merged into ${dup.mergedInto}`, 'yellow');
      });
    } else {
      log(`    - Showing first 10 of ${duplicates.length} duplicates...`, 'yellow');
      duplicates.slice(0, 10).forEach(dup => {
        log(`    - ${dup.original} → merged into ${dup.mergedInto}`, 'yellow');
      });
    }
  }
  
  log(`  ✅ Unique repositories: ${repos.length} (from ${allRepos.length} total entries)`, 'green');
  
  return repos;
}

// Get quality score for a repository
async function getQualityScore(repo) {
  try {
    const response = await axios.post(`${BASE_URL}/api/repos/quality`, {
      repo: repo.name,
    }, {
      validateStatus: () => true,
      timeout: 30000,
    });
    
    if (response.status === 200) {
      return {
        success: true,
        quality: response.data.quality || 0,
        score: (response.data.quality || 0) * 100, // Convert to 0-100 scale
        grade: response.data.grade || 'F',
        recommendations: response.data.recommendations || [],
        factors: response.data.factors || {},
        confidence: response.data.confidence || 0,
        source: response.data.source || 'unknown',
      };
    } else {
      return {
        success: false,
        error: response.data?.error || `HTTP ${response.status}`,
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

// Run quality check with auto-fix
async function runQualityCheck(repo, options = {}) {
  const { autoFix = false, dryRun = true } = options;
  
  try {
    // First get quality score
    const qualityResult = await getQualityScore(repo);
    
    if (!qualityResult.success) {
      return {
        repo: repo.name,
        success: false,
        error: qualityResult.error,
        quality: null,
      };
    }
    
    const result = {
      repo: repo.name,
      url: repo.url,
      success: true,
      quality: qualityResult.quality,
      score: qualityResult.score,
      grade: qualityResult.grade,
      recommendations: qualityResult.recommendations,
      factors: qualityResult.factors,
      confidence: qualityResult.confidence,
      source: qualityResult.source,
      fixes: [],
      fixErrors: [],
    };
    
    // If auto-fix is enabled and quality is below threshold
    if (autoFix && qualityResult.score < 80) {
      log(`  🔧 Attempting to fix issues in ${repo.name}...`, 'cyan');
      
      // Try to improve quality
      try {
        const improveResponse = await axios.post(`${BASE_URL}/api/repos/quality/improve`, {
          repo: repo.name,
          targetQuality: 0.8, // Target 80/100
          autoApply: !dryRun,
          dryRun: dryRun,
          createPR: false,
        }, {
          validateStatus: () => true,
          timeout: 60000,
        });
        
        if (improveResponse.status === 200 && improveResponse.data.success) {
          result.fixes = improveResponse.data.plan?.generatedFiles || [];
          result.improvementPlan = improveResponse.data.plan;
          
          if (dryRun) {
            log(`    ✅ Generated improvement plan (${result.fixes.length} files)`, 'green');
          } else {
            log(`    ✅ Applied fixes (${result.fixes.length} files)`, 'green');
          }
        } else {
          result.fixErrors.push(improveResponse.data?.error || 'Improvement failed');
        }
      } catch (error) {
        result.fixErrors.push(error.message);
        log(`    ⚠️  Fix attempt failed: ${error.message}`, 'yellow');
      }
    }
    
    return result;
  } catch (error) {
    return {
      repo: repo.name,
      success: false,
      error: error.message,
    };
  }
}

// Process repos in batches
async function processRepos(repos, options = {}) {
  const { autoFix = false, dryRun = true } = options;
  const results = [];
  const total = repos.length;
  
  log(`\n📊 Processing ${total} repositories in batches of ${BATCH_SIZE}...\n`, 'bright');
  
  for (let i = 0; i < repos.length; i += BATCH_SIZE) {
    const batch = repos.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(total / BATCH_SIZE);
    
    log(`\n📦 Batch ${batchNum}/${totalBatches} (${batch.length} repos)`, 'cyan');
    
    const batchPromises = batch.map(async (repo) => {
      log(`  🔍 Analyzing ${repo.name}...`, 'blue');
      const result = await runQualityCheck(repo, { autoFix, dryRun });
      
      if (result.success) {
        const emoji = result.score >= 80 ? '✅' : result.score >= 60 ? '⚠️' : '❌';
        log(`    ${emoji} ${repo.name}: ${result.score.toFixed(1)}/100 (${result.grade})`, 
            result.score >= 80 ? 'green' : result.score >= 60 ? 'yellow' : 'red');
      } else {
        log(`    ❌ ${repo.name}: ${result.error}`, 'red');
      }
      
      return result;
    });
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // Small delay between batches to avoid overwhelming the API
    if (i + BATCH_SIZE < repos.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return results;
}

// Generate comprehensive report
async function generateReport(results) {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = path.join(OUTPUT_DIR, `repo-review-${timestamp}.json`);
  const summaryPath = path.join(OUTPUT_DIR, `repo-review-summary-${timestamp}.md`);
  
  // Calculate statistics
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  const withFixes = results.filter(r => r.fixes && r.fixes.length > 0);
  
  const scoreStats = {
    excellent: successful.filter(r => r.score >= 90).length,
    good: successful.filter(r => r.score >= 80 && r.score < 90).length,
    fair: successful.filter(r => r.score >= 70 && r.score < 80).length,
    needsWork: successful.filter(r => r.score >= 60 && r.score < 70).length,
    poor: successful.filter(r => r.score < 60).length,
  };
  
  const avgScore = successful.length > 0
    ? successful.reduce((sum, r) => sum + r.score, 0) / successful.length
    : 0;
  
  // Save detailed JSON report
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: results.length,
      successful: successful.length,
      failed: failed.length,
      averageScore: avgScore,
      scoreDistribution: scoreStats,
      reposWithFixes: withFixes.length,
      duplicatesMerged: 0, // Will be populated from deduplication
    },
    results: results,
  };
  
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
  
  // Generate markdown summary
  const summary = `# Repository Quality Review Report

**Generated:** ${new Date().toISOString()}
**Total Repositories:** ${results.length}

## Summary

- ✅ **Successful Reviews:** ${successful.length}
- ❌ **Failed Reviews:** ${failed.length}
- 🔧 **Repos with Fixes:** ${withFixes.length}
- 📊 **Average Quality Score:** ${avgScore.toFixed(1)}/100
- 🔄 **Duplicates Merged:** ${report.summary.duplicatesMerged || 0}

## Score Distribution

- 🟢 **Excellent (90-100):** ${scoreStats.excellent}
- 🟡 **Good (80-89):** ${scoreStats.good}
- 🟠 **Fair (70-79):** ${scoreStats.fair}
- 🔴 **Needs Work (60-69):** ${scoreStats.needsWork}
- ⚫ **Poor (<60):** ${scoreStats.poor}

## Top Issues

${results
  .filter(r => r.success && r.recommendations && r.recommendations.length > 0)
  .slice(0, 20)
  .map(r => `### ${r.repo} (${r.score.toFixed(1)}/100)
${r.recommendations.slice(0, 3).map(rec => `- ${rec.action || rec}`).join('\n')}
`)
  .join('\n')}

## Repositories Needing Attention

${results
  .filter(r => r.success && r.score < 70)
  .sort((a, b) => a.score - b.score)
  .slice(0, 20)
  .map(r => `- **${r.repo}**: ${r.score.toFixed(1)}/100 (${r.grade}) - ${r.url}`)
  .join('\n')}

## Detailed Results

See \`${path.basename(reportPath)}\` for complete details.

`;
  
  await fs.writeFile(summaryPath, summary);
  
  log(`\n📄 Reports saved:`, 'bright');
  log(`  📊 JSON: ${reportPath}`, 'cyan');
  log(`  📝 Summary: ${summaryPath}`, 'cyan');
  
  return { reportPath, summaryPath };
}

// Main function
async function main() {
  const args = process.argv.slice(2);
  const autoFix = args.includes('--fix') || args.includes('-f');
  const dryRun = !args.includes('--apply');
  
  log('\n🚀 BEAST MODE Repository Review & Fix System\n', 'bright');
  log('='.repeat(60), 'cyan');
  log(`🌐 API URL: ${BASE_URL}`, 'cyan');
  log(`🔧 Auto-fix: ${autoFix ? 'ENABLED' : 'DISABLED'}`, autoFix ? 'green' : 'yellow');
  log(`🧪 Dry run: ${dryRun ? 'YES' : 'NO'}`, dryRun ? 'yellow' : 'green');
  log('='.repeat(60) + '\n', 'cyan');
  
  try {
    // Step 1: Fetch all repositories
    const repos = await fetchAllRepos();
    
    if (repos.length === 0) {
      log('❌ No repositories found!', 'red');
      log('\n💡 Try:', 'yellow');
      log('  1. Connect GitHub: beast-mode repos connect', 'cyan');
      log('  2. Add repos manually: beast-mode repos add <url>', 'cyan');
      log('  3. Use GitHub CLI: gh repo list', 'cyan');
      process.exit(1);
    }
    
    log(`\n✅ Found ${repos.length} repositories to review\n`, 'green');
    
    // Step 2: Process all repositories
    const results = await processRepos(repos, { autoFix, dryRun });
    
    // Step 3: Generate report
    log('\n📊 Generating comprehensive report...', 'cyan');
    const { reportPath, summaryPath } = await generateReport(results);
    
    // Step 4: Print summary
    const successful = results.filter(r => r.success);
    const avgScore = successful.length > 0
      ? successful.reduce((sum, r) => sum + r.score, 0) / successful.length
      : 0;
    
    log('\n' + '='.repeat(60), 'cyan');
    log('📊 FINAL SUMMARY', 'bright');
    log('='.repeat(60), 'cyan');
    log(`Total Repos: ${results.length}`, 'cyan');
    log(`Successful: ${successful.length}`, 'green');
    log(`Failed: ${results.length - successful.length}`, 'red');
    log(`Average Score: ${avgScore.toFixed(1)}/100`, 'cyan');
    log(`Repos with Fixes: ${results.filter(r => r.fixes && r.fixes.length > 0).length}`, 'yellow');
    log('='.repeat(60) + '\n', 'cyan');
    
    if (autoFix && dryRun) {
      log('💡 To apply fixes, run with --apply flag:', 'yellow');
      log(`   node ${__filename} --fix --apply\n`, 'cyan');
    }
    
  } catch (error) {
    log(`\n❌ Error: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { fetchAllRepos, getQualityScore, runQualityCheck, processRepos, generateReport };
