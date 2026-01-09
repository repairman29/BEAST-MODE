#!/usr/bin/env node

/**
 * Apply Fixes to Local Repositories
 * 
 * Takes the improvement plans from the review script and applies them to local repos
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

const REPORTS_DIR = path.join(__dirname, '../reports/repo-improvements');

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

// Find the latest improvement report
async function findLatestReport() {
  try {
    const files = await fs.readdir(REPORTS_DIR);
    const jsonFiles = files
      .filter(f => f.startsWith('improvements-') && f.endsWith('.json'))
      .sort()
      .reverse();
    
    if (jsonFiles.length === 0) {
      throw new Error('No improvement reports found. Run improve script first: npm run improve:all');
    }
    
    return path.join(REPORTS_DIR, jsonFiles[0]);
  } catch (error) {
    if (error.message.includes('No improvement reports')) {
      throw error;
    }
    throw new Error(`Failed to find improvement report: ${error.message}`);
  }
}

// Apply fixes from improvement plan
async function applyFixes(repoResult, workspaceRoot) {
  const { repo, plan, localPath } = repoResult;
  
  // Extract all generated files from plan iterations
  const generatedFiles = [];
  if (plan && plan.iterations) {
    for (const iteration of plan.iterations) {
      if (iteration.generatedFiles && Array.isArray(iteration.generatedFiles)) {
        generatedFiles.push(...iteration.generatedFiles);
      }
    }
  }
  
  if (generatedFiles.length === 0) {
    log(`  ⚠️  No fixes to apply for ${repo}`, 'yellow');
    return { applied: 0, errors: [] };
  }
  
  // Determine repo path
  let repoPath = localPath;
  if (!repoPath) {
    // Try to find local path from repo name
    const repoName = repo.split('/').pop();
    const owner = repo.split('/')[0];
    // Handle naming variations
    const nameVariations = [
      repoName,
      repoName.replace('smuggler-', ''),
      'smuggler-' + repoName.replace('smuggler-', ''),
      repoName.replace('-service', ''),
      'smuggler-' + repoName.replace('-service', '').replace('smuggler-', ''),
      repoName.replace('ai-gm-service', 'ai-gm'),
      repoName.replace('code-roach', 'code-roach'),
      repoName.replace('daisy-chain', 'daisy-chain'),
    ];
    
    const possiblePaths = [];
    for (const name of nameVariations) {
      possiblePaths.push(
        path.join(workspaceRoot, name),
        path.join(workspaceRoot, '..', name),
        path.join(workspaceRoot, 'BEAST-MODE-PRODUCT', name),
        path.join(workspaceRoot, 'BEAST-MODE-PRODUCT', 'smuggler-' + name.replace('smuggler-', '')),
      );
    }
    
    // Also search for directories containing the repo name
    try {
      const dirs = await fs.readdir(workspaceRoot);
      for (const dir of dirs) {
        const dirPath = path.join(workspaceRoot, dir);
        try {
          const stat = await fs.stat(dirPath);
          if (stat.isDirectory() && (dir.includes(repoName) || repoName.includes(dir))) {
            possiblePaths.push(dirPath);
          }
        } catch (e) {
          // Skip
        }
      }
    } catch (e) {
      // Can't read directory
    }
    
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
    log(`     Tried: ${repo.split('/').pop()}`, 'yellow');
    return { applied: 0, errors: [`Could not find local path for ${repo}`] };
  }
  
  log(`  📝 Applying ${generatedFiles.length} files to ${repo} at ${repoPath}...`, 'cyan');
  
  const applied = [];
  const errors = [];
  
  for (const file of generatedFiles) {
    try {
      const fileName = file.fileName || file.path;
      if (!fileName) {
        log(`    ⚠️  Skipping file without name`, 'yellow');
        continue;
      }
      
      const filePath = path.join(repoPath, fileName);
      const fileDir = path.dirname(filePath);
      
      // Create directory if needed
      await fs.mkdir(fileDir, { recursive: true });
      
      // Get file content
      let content = file.code || file.content || '';
      
      // If no content in report, try to fetch from API
      if (!content && repoResult.repo) {
        try {
          log(`    🔄 Fetching content for ${fileName} from API...`, 'yellow');
          const axios = require('axios');
          const response = await axios.post('http://localhost:3000/api/repos/quality/improve', {
            repo: repoResult.repo,
            targetQuality: 1.0,
            dryRun: true,
          }, { timeout: 30000 });
          
          // Find this file in the response
          const allFiles = response.data?.plan?.iterations?.flatMap(iter => iter.generatedFiles || []) || [];
          const fileWithContent = allFiles.find(f => (f.fileName || f.path) === fileName);
          if (fileWithContent) {
            content = fileWithContent.code || fileWithContent.content || '';
          }
        } catch (e) {
          // API fetch failed, continue without content
        }
      }
      
      if (!content) {
        log(`    ⚠️  Skipping ${fileName} (no content available)`, 'yellow');
        continue;
      }
      
      // Write file
      await fs.writeFile(filePath, content, 'utf8');
      applied.push(filePath);
      log(`    ✅ Created ${fileName}`, 'green');
    } catch (error) {
      const fileName = file.fileName || file.path || 'unknown';
      errors.push(`${fileName}: ${error.message}`);
      log(`    ❌ Failed to create ${fileName}: ${error.message}`, 'red');
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
    log('📊 Loading latest improvement report...', 'cyan');
    const reportPath = await findLatestReport();
    log(`  ✅ Found: ${path.basename(reportPath)}\n`, 'green');
    
    const reportData = JSON.parse(await fs.readFile(reportPath, 'utf8'));
    const results = reportData.results || [];
    
    // Filter repos with fixes (from improvement reports)
    const reposWithFixes = results.filter(r => {
      if (!r.success) return false;
      if (!r.plan || !r.plan.iterations) return false;
      
      // Check if any iteration has generated files
      const hasFiles = r.plan.iterations.some(iter => 
        iter.generatedFiles && iter.generatedFiles.length > 0
      );
      
      if (!hasFiles) return false;
      if (repoFilter && !r.repo.includes(repoFilter)) return false;
      
      return true;
    });
    
    if (reposWithFixes.length === 0) {
      log('⚠️  No repositories with fixes found in report', 'yellow');
      log('\n💡 Run improvement script first:', 'cyan');
      log('   npm run improve:all\n', 'cyan');
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
      const result = await applyFixes({
        repo: repoResult.repo,
        plan: repoResult.plan,
        localPath: repoResult.localPath,
      }, workspaceRoot);
      
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
