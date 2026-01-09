#!/usr/bin/env node

/**
 * Apply Fixes to Local Repositories
 * 
 * Takes the improvement plans from the review script and applies them to local repos
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

const REPORTS_DIR = path.join(__dirname, '../reports/repo-reviews');

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

// Find the latest review report
async function findLatestReport() {
  try {
    const files = await fs.readdir(REPORTS_DIR);
    const jsonFiles = files
      .filter(f => f.startsWith('repo-review-') && f.endsWith('.json'))
      .sort()
      .reverse();
    
    if (jsonFiles.length === 0) {
      throw new Error('No review reports found. Run review script first.');
    }
    
    return path.join(REPORTS_DIR, jsonFiles[0]);
  } catch (error) {
    throw new Error(`Could not find review reports: ${error.message}`);
  }
}

// Apply fixes from improvement plan
async function applyFixes(repoResult, workspaceRoot) {
  const { repo, improvementPlan, localPath } = repoResult;
  
  if (!improvementPlan || !improvementPlan.generatedFiles || improvementPlan.generatedFiles.length === 0) {
    log(`  ⚠️  No fixes to apply for ${repo}`, 'yellow');
    return { applied: 0, errors: [] };
  }
  
  // Determine repo path
  let repoPath = localPath;
  if (!repoPath) {
    // Try to find local path from repo name
    const repoName = repo.split('/').pop();
    const possiblePaths = [
      path.join(workspaceRoot, repoName),
      path.join(workspaceRoot, repo.split('/')[1]),
    ];
    
    for (const possiblePath of possiblePaths) {
      try {
        await fs.access(possiblePath);
        repoPath = possiblePath;
        break;
      } catch (e) {
        // Path doesn't exist
      }
    }
  }
  
  if (!repoPath) {
    log(`  ❌ Could not find local path for ${repo}`, 'red');
    return { applied: 0, errors: [`Could not find local path for ${repo}`] };
  }
  
  log(`  📝 Applying fixes to ${repo} at ${repoPath}...`, 'cyan');
  
  const applied = [];
  const errors = [];
  
  for (const file of improvementPlan.generatedFiles) {
    try {
      const filePath = path.join(repoPath, file.fileName || file.path);
      const fileDir = path.dirname(filePath);
      
      // Create directory if needed
      await fs.mkdir(fileDir, { recursive: true });
      
      // Write file
      await fs.writeFile(filePath, file.code || file.content || '', 'utf8');
      applied.push(filePath);
      log(`    ✅ Created ${file.fileName || file.path}`, 'green');
    } catch (error) {
      errors.push(`${file.fileName || file.path}: ${error.message}`);
      log(`    ❌ Failed to create ${file.fileName || file.path}: ${error.message}`, 'red');
    }
  }
  
  return { applied: applied.length, errors, repoPath };
}

// Main function
async function main() {
  const args = process.argv.slice(2);
  const workspaceRoot = process.env.WORKSPACE_ROOT || path.resolve(__dirname, '../../..');
  const repoFilter = args.find(arg => arg.startsWith('--repo='))?.split('=')[1];
  
  log('\n🔧 BEAST MODE Fix Application System\n', 'bright');
  log('='.repeat(60), 'cyan');
  log(`📁 Workspace: ${workspaceRoot}`, 'cyan');
  log('='.repeat(60) + '\n', 'cyan');
  
  try {
    // Load latest report
    log('📊 Loading latest review report...', 'cyan');
    const reportPath = await findLatestReport();
    log(`  ✅ Found: ${path.basename(reportPath)}\n`, 'green');
    
    const reportData = JSON.parse(await fs.readFile(reportPath, 'utf8'));
    const results = reportData.results || [];
    
    // Filter repos with fixes
    const reposWithFixes = results.filter(r => 
      r.success && 
      r.improvementPlan && 
      r.improvementPlan.generatedFiles && 
      r.improvementPlan.generatedFiles.length > 0 &&
      (!repoFilter || r.repo.includes(repoFilter))
    );
    
    if (reposWithFixes.length === 0) {
      log('⚠️  No repositories with fixes found in report', 'yellow');
      log('\n💡 Run review script with --fix flag first:', 'cyan');
      log('   npm run review:all-repos:fix\n', 'cyan');
      return;
    }
    
    log(`✅ Found ${reposWithFixes.length} repositories with fixes to apply\n`, 'green');
    
    // Apply fixes
    const summary = {
      total: reposWithFixes.length,
      applied: 0,
      failed: 0,
      errors: [],
    };
    
    for (const repoResult of reposWithFixes) {
      log(`\n📦 Processing ${repoResult.repo}...`, 'blue');
      const result = await applyFixes(repoResult, workspaceRoot);
      
      if (result.applied > 0) {
        summary.applied++;
        log(`  ✅ Applied ${result.applied} fixes`, 'green');
      } else {
        summary.failed++;
      }
      
      if (result.errors.length > 0) {
        summary.errors.push(...result.errors.map(e => `${repoResult.repo}: ${e}`));
      }
    }
    
    // Print summary
    log('\n' + '='.repeat(60), 'cyan');
    log('📊 SUMMARY', 'bright');
    log('='.repeat(60), 'cyan');
    log(`Total Repos: ${summary.total}`, 'cyan');
    log(`✅ Applied Fixes: ${summary.applied}`, 'green');
    log(`❌ Failed: ${summary.failed}`, 'red');
    
    if (summary.errors.length > 0) {
      log(`\n⚠️  Errors (${summary.errors.length}):`, 'yellow');
      summary.errors.slice(0, 10).forEach(err => log(`  - ${err}`, 'yellow'));
      if (summary.errors.length > 10) {
        log(`  ... and ${summary.errors.length - 10} more`, 'yellow');
      }
    }
    
    log('='.repeat(60) + '\n', 'cyan');
    
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

module.exports = { findLatestReport, applyFixes };
