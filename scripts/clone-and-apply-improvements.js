#!/usr/bin/env node

/**
 * Clone Missing Repos and Apply Improvements
 * 
 * Clones repos that don't exist locally, then applies generated improvements
 */

const { execSync } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function getMissingRepos() {
  const reportsDir = path.join(__dirname, '../reports/repo-improvements');
  const files = await fs.readdir(reportsDir);
  const jsonFiles = files
    .filter(f => f.startsWith('improvements-') && f.endsWith('.json'))
    .sort()
    .reverse();
  
  if (jsonFiles.length === 0) {
    throw new Error('No improvement reports found');
  }
  
  const reportPath = path.join(reportsDir, jsonFiles[0]);
  const data = JSON.parse(await fs.readFile(reportPath, 'utf8'));
  
  // Get repos that succeeded but don't have local paths
  const missingRepos = data.results
    .filter(r => r.success && !r.localPath)
    .map(r => r.repo)
    .filter(repo => repo.startsWith('repairman29/')); // Only your repos
  
  return missingRepos;
}

async function cloneRepo(repo, targetDir) {
  try {
    log(`  📥 Cloning ${repo}...`, 'cyan');
    execSync(`gh repo clone ${repo} "${targetDir}"`, {
      stdio: 'inherit',
      cwd: path.dirname(targetDir)
    });
    log(`  ✅ Cloned ${repo}`, 'green');
    return true;
  } catch (error) {
    log(`  ❌ Failed to clone ${repo}: ${error.message}`, 'red');
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const workspaceRoot = process.env.WORKSPACE_ROOT || path.resolve(__dirname, '../..');
  
  log('\n📦 Clone Missing Repos & Apply Improvements\n', 'bright');
  log('='.repeat(60), 'cyan');
  
  try {
    const missingRepos = await getMissingRepos();
    log(`\nFound ${missingRepos.length} repos to clone\n`, 'cyan');
    
    if (dryRun) {
      log('🔍 DRY RUN - Would clone these repos:\n', 'yellow');
      missingRepos.forEach(repo => {
        const repoName = repo.split('/').pop();
        const targetDir = path.join(workspaceRoot, repoName);
        log(`  - ${repo} → ${targetDir}`, 'cyan');
      });
      return;
    }
    
    const results = {
      cloned: 0,
      failed: 0,
      skipped: 0,
    };
    
    for (const repo of missingRepos) {
      const repoName = repo.split('/').pop();
      const targetDir = path.join(workspaceRoot, repoName);
      
      // Check if already exists
      try {
        await fs.access(targetDir);
        log(`  ⏭️  ${repo} already exists at ${targetDir}`, 'yellow');
        results.skipped++;
        continue;
      } catch (e) {
        // Doesn't exist, proceed to clone
      }
      
      log(`\n📦 Processing ${repo}...`, 'blue');
      if (await cloneRepo(repo, targetDir)) {
        results.cloned++;
      } else {
        results.failed++;
      }
    }
    
    log('\n' + '='.repeat(60), 'cyan');
    log('📊 SUMMARY', 'bright');
    log('='.repeat(60), 'cyan');
    log(`✅ Cloned: ${results.cloned}`, 'green');
    log(`⏭️  Skipped: ${results.skipped}`, 'yellow');
    log(`❌ Failed: ${results.failed}`, 'red');
    
    if (results.cloned > 0) {
      log('\n💡 Next step: Run apply-fixes script to apply improvements:', 'cyan');
      log('   node scripts/apply-fixes-to-local-repos.js\n', 'cyan');
    }
    
  } catch (error) {
    log(`\n❌ Error: ${error.message}`, 'red');
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { getMissingRepos, cloneRepo };
