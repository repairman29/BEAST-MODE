#!/usr/bin/env node

/**
 * Improve All Repositories to 100/100 Quality
 * 
 * Uses BEAST MODE's improvement API to systematically improve all repos
 */

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

const BASE_URL = process.env.BEAST_MODE_API_URL || 'http://localhost:3000';
const REPORTS_DIR = path.join(__dirname, '../reports/repo-improvements');
const BATCH_SIZE = 5;

// Colors for console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
  bright: '\x1b[1m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Load latest review report
async function loadLatestReview() {
  const reportsDir = path.join(__dirname, '../reports/repo-reviews');
  const files = await fs.readdir(reportsDir);
  const jsonFiles = files
    .filter(f => f.startsWith('repo-review-') && f.endsWith('.json'))
    .sort()
    .reverse();
  
  if (jsonFiles.length === 0) {
    throw new Error('No review reports found. Run review script first.');
  }
  
  const reportPath = path.join(reportsDir, jsonFiles[0]);
  const data = JSON.parse(await fs.readFile(reportPath, 'utf8'));
  return { data, path: reportPath };
}

// Improve a single repository with retry logic
async function improveRepo(repo, targetQuality = 1.0, dryRun = true, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (attempt > 0) {
        log(`  🔄 Retry ${attempt}/${retries} for ${repo.name}...`, 'yellow');
        await new Promise(resolve => setTimeout(resolve, 2000 * attempt)); // Exponential backoff
      } else {
        log(`  🔧 Improving ${repo.name} to ${(targetQuality * 100).toFixed(0)}/100...`, 'cyan');
      }
      
      const response = await axios.post(`${BASE_URL}/api/repos/quality/improve`, {
        repo: repo.name,
        targetQuality: targetQuality,
        dryRun: dryRun,
        autoApply: false,
      }, {
        timeout: 180000, // 3 minutes
        validateStatus: () => true,
      });
      
      if (response.status === 200 && response.data) {
        const result = response.data;
        
        return {
          success: result.success !== false,
          repo: repo.name,
          currentQuality: result.currentQuality || 0,
          finalQuality: result.finalQuality || 0,
          targetQuality: targetQuality,
          generatedFiles: result.generatedFiles || 0,
          iterations: result.iterations || 0,
          plan: result.plan,
          error: result.error,
        };
      } else if (response.status >= 500 && attempt < retries) {
        // Server error - retry
        continue;
      } else {
        return {
          success: false,
          error: response.data?.error || `HTTP ${response.status}`,
          repo: repo.name,
        };
      }
    } catch (error) {
      if (attempt < retries && (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || error.response?.status >= 500)) {
        // Retry on network/server errors
        continue;
      }
      return {
        success: false,
        error: error.message || error.response?.data?.error || 'Unknown error',
        repo: repo.name,
      };
    }
  }
}

// Process repos in batches
async function processRepos(repos, targetQuality = 1.0, dryRun = true) {
  const results = [];
  const total = repos.length;
  
  log(`\n📊 Processing ${total} repositories in batches of ${BATCH_SIZE}...\n`, 'bright');
  
  for (let i = 0; i < repos.length; i += BATCH_SIZE) {
    const batch = repos.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(total / BATCH_SIZE);
    
    log(`\n📦 Batch ${batchNum}/${totalBatches} (${batch.length} repos)`, 'cyan');
    
    const batchPromises = batch.map(async (repo) => {
      const result = await improveRepo(repo, targetQuality, dryRun);
      
      if (result.success) {
        const improvement = ((result.finalQuality - result.currentQuality) * 100).toFixed(1);
        const emoji = result.finalQuality >= targetQuality ? '✅' : result.finalQuality >= 0.8 ? '⚠️' : '❌';
        log(`    ${emoji} ${repo.name}: ${(result.currentQuality * 100).toFixed(1)} → ${(result.finalQuality * 100).toFixed(1)} (+${improvement})`, 
            result.finalQuality >= targetQuality ? 'green' : result.finalQuality >= 0.8 ? 'yellow' : 'red');
        log(`      Generated ${result.generatedFiles} files in ${result.iterations} iterations`, 'blue');
      } else {
        log(`    ❌ ${repo.name}: ${result.error}`, 'red');
      }
      
      return result;
    });
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // Delay between batches
    if (i + BATCH_SIZE < repos.length) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  return results;
}

// Generate improvement report
async function generateReport(results, targetQuality) {
  await fs.mkdir(REPORTS_DIR, { recursive: true });
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = path.join(REPORTS_DIR, `improvements-${timestamp}.json`);
  const summaryPath = path.join(REPORTS_DIR, `improvements-summary-${timestamp}.md`);
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  const reachedTarget = results.filter(r => r.success && r.finalQuality >= targetQuality);
  const withFiles = results.filter(r => r.success && r.generatedFiles > 0);
  
  const avgCurrent = successful.length > 0
    ? successful.reduce((sum, r) => sum + r.currentQuality, 0) / successful.length
    : 0;
  const avgFinal = successful.length > 0
    ? successful.reduce((sum, r) => sum + r.finalQuality, 0) / successful.length
    : 0;
  
  const report = {
    timestamp: new Date().toISOString(),
    targetQuality,
    summary: {
      total: results.length,
      successful: successful.length,
      failed: failed.length,
      reachedTarget: reachedTarget.length,
      withFiles: withFiles.length,
      averageCurrentQuality: avgCurrent,
      averageFinalQuality: avgFinal,
      averageImprovement: avgFinal - avgCurrent,
      totalFilesGenerated: results.reduce((sum, r) => sum + (r.generatedFiles || 0), 0),
    },
    results: results,
  };
  
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
  
  const summary = `# Repository Quality Improvements Report

**Generated:** ${new Date().toISOString()}
**Target Quality:** ${(targetQuality * 100).toFixed(0)}/100
**Total Repositories:** ${results.length}

## Summary

- ✅ **Successful Improvements:** ${successful.length}
- ❌ **Failed:** ${failed.length}
- 🎯 **Reached Target (${(targetQuality * 100).toFixed(0)}/100):** ${reachedTarget.length}
- 📝 **With Generated Files:** ${withFiles.length}
- 📊 **Average Quality:** ${(avgCurrent * 100).toFixed(1)} → ${(avgFinal * 100).toFixed(1)} (+${((avgFinal - avgCurrent) * 100).toFixed(1)})
- 📄 **Total Files Generated:** ${report.summary.totalFilesGenerated}

## Top Improvements

${results
  .filter(r => r.success && r.finalQuality > r.currentQuality)
  .sort((a, b) => (b.finalQuality - b.currentQuality) - (a.finalQuality - a.currentQuality))
  .slice(0, 20)
  .map(r => `- **${r.repo}**: ${(r.currentQuality * 100).toFixed(1)} → ${(r.finalQuality * 100).toFixed(1)} (+${((r.finalQuality - r.currentQuality) * 100).toFixed(1)}) - ${r.generatedFiles} files`)
  .join('\n')}

## Repositories That Reached Target

${reachedTarget.length > 0 
  ? reachedTarget.map(r => `- ✅ **${r.repo}**: ${(r.finalQuality * 100).toFixed(1)}/100`).join('\n')
  : 'None yet - continue improvements!'}

## Repositories Needing More Work

${results
  .filter(r => r.success && r.finalQuality < targetQuality)
  .sort((a, b) => a.finalQuality - b.finalQuality)
  .slice(0, 20)
  .map(r => `- **${r.repo}**: ${(r.finalQuality * 100).toFixed(1)}/100 (needs +${((targetQuality - r.finalQuality) * 100).toFixed(1)})`)
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
  const targetQuality = args.includes('--target') 
    ? parseFloat(args[args.indexOf('--target') + 1]) / 100 
    : 1.0; // Default to 100/100
  const dryRun = !args.includes('--apply');
  const maxIterations = args.includes('--iterations')
    ? parseInt(args[args.indexOf('--iterations') + 1])
    : 3; // Run up to 3 improvement cycles
  
  log('\n🚀 BEAST MODE - Improve All Repos to 100/100\n', 'bright');
  log('='.repeat(60), 'cyan');
  log(`🌐 API URL: ${BASE_URL}`, 'cyan');
  log(`🎯 Target Quality: ${(targetQuality * 100).toFixed(0)}/100`, 'cyan');
  log(`🧪 Dry Run: ${dryRun ? 'YES' : 'NO'}`, dryRun ? 'yellow' : 'green');
  log(`🔄 Max Iterations: ${maxIterations}`, 'cyan');
  log('='.repeat(60) + '\n', 'cyan');
  
  try {
    // Step 1: Load latest review
    log('📊 Loading latest review report...', 'cyan');
    const { data: reviewData } = await loadLatestReview();
    const repos = reviewData.results
      .filter(r => r.success)
      .map(r => ({ name: r.repo, url: r.url, currentQuality: r.quality || r.score / 100 }));
    
    log(`  ✅ Found ${repos.length} repositories to improve\n`, 'green');
    
    if (repos.length === 0) {
      log('⚠️  No repositories found in review report', 'yellow');
      return;
    }
    
    // Step 2: Filter to only repos that need improvement
    // Load previous results to skip already-improved repos
    const previousReportPath = path.join(REPORTS_DIR, 'improvements-2026-01-09T06-33-00-623Z.json');
    let alreadyImproved = new Set();
    try {
      const previousData = JSON.parse(await fs.readFile(previousReportPath, 'utf8'));
      previousData.results
        .filter(r => r.success && r.finalQuality >= targetQuality)
        .forEach(r => alreadyImproved.add(r.repo));
      log(`  ⏭️  Skipping ${alreadyImproved.size} already-improved repos`, 'yellow');
    } catch (e) {
      // No previous report, continue with all repos
    }
    
    // Filter to repos that need improvement
    const reposToImprove = repos.filter(r => !alreadyImproved.has(r.name));
    log(`  📋 Processing ${reposToImprove.length} repos that need improvement\n`, 'green');
    
    // Step 3: Improve repos iteratively
    let allResults = [];
    let currentRepos = reposToImprove;
    
    for (let iteration = 1; iteration <= maxIterations; iteration++) {
      log(`\n${'='.repeat(60)}`, 'cyan');
      log(`🔄 ITERATION ${iteration}/${maxIterations}`, 'bright');
      log('='.repeat(60) + '\n', 'cyan');
      
      const results = await processRepos(currentRepos, targetQuality, dryRun);
      allResults.push(...results);
      
      // Filter repos that still need improvement
      currentRepos = results
        .filter(r => r.success && r.finalQuality < targetQuality)
        .map(r => ({
          name: r.repo,
          url: repos.find(repo => repo.name === r.repo)?.url || '',
          currentQuality: r.finalQuality,
        }));
      
      const successful = results.filter(r => r.success && r.finalQuality >= targetQuality);
      if (successful.length > 0) {
        log(`\n✅ ${successful.length} repos reached target quality this iteration!`, 'green');
      }
      
      if (currentRepos.length === 0) {
        log(`\n✅ All repositories reached target quality!`, 'green');
        break;
      }
      
      log(`\n📊 After iteration ${iteration}:`, 'cyan');
      log(`  - Repos at target: ${allResults.filter(r => r.success && r.finalQuality >= targetQuality).length}`, 'green');
      log(`  - Still improving: ${currentRepos.length}`, 'yellow');
      
      if (iteration < maxIterations) {
        log(`\n⏳ Waiting before next iteration...`, 'cyan');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
    
    // Step 3: Generate final report
    log('\n📊 Generating final improvement report...', 'cyan');
    const { reportPath, summaryPath } = await generateReport(allResults, targetQuality);
    
    // Step 4: Print final summary
    const successful = allResults.filter(r => r.success);
    const reachedTarget = allResults.filter(r => r.success && r.finalQuality >= targetQuality);
    const avgFinal = successful.length > 0
      ? successful.reduce((sum, r) => sum + r.finalQuality, 0) / successful.length
      : 0;
    
    log('\n' + '='.repeat(60), 'cyan');
    log('📊 FINAL SUMMARY', 'bright');
    log('='.repeat(60), 'cyan');
    log(`Total Repos: ${repos.length}`, 'cyan');
    log(`✅ Successful: ${successful.length}`, 'green');
    log(`🎯 Reached Target: ${reachedTarget.length}`, 'green');
    log(`📊 Average Final Quality: ${(avgFinal * 100).toFixed(1)}/100`, 'cyan');
    log(`📄 Total Files Generated: ${allResults.reduce((sum, r) => sum + (r.generatedFiles || 0), 0)}`, 'cyan');
    log('='.repeat(60) + '\n', 'cyan');
    
    if (dryRun) {
      log('💡 To apply improvements, run with --apply flag:', 'yellow');
      log(`   node ${__filename} --apply\n`, 'cyan');
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

module.exports = { improveRepo, processRepos, generateReport };
