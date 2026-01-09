#!/usr/bin/env node

/**
 * Run Local Tests (No GitHub Actions Required)
 * 
 * Runs tests locally for repos that have been improved
 * Uses local tools - no paid GitHub Actions needed
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function findReposWithImprovements(workspaceRoot) {
  const repos = [];
  
  // Check for repos that have .github/workflows/ci.yml (newly created)
  async function scanDir(dir, depth = 0) {
    if (depth > 3) return; // Limit depth
    
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isDirectory() && !entry.name.startsWith('.') && !entry.name.includes('node_modules')) {
          const repoPath = path.join(dir, entry.name);
          
          // Check if this looks like a repo (has .git or package.json)
          const hasGit = await fs.access(path.join(repoPath, '.git')).then(() => true).catch(() => false);
          const hasPackageJson = await fs.access(path.join(repoPath, 'package.json')).then(() => true).catch(() => false);
          const hasNewCI = await fs.access(path.join(repoPath, '.github/workflows/ci.yml')).then(() => true).catch(() => false);
          
          if ((hasGit || hasPackageJson) && hasNewCI) {
            repos.push({
              name: entry.name,
              path: repoPath,
            });
          }
          
          // Recursively scan (limited depth)
          if (depth < 2) {
            await scanDir(repoPath, depth + 1);
          }
        }
      }
    } catch (e) {
      // Can't read directory
    }
  }
  
  await scanDir(workspaceRoot);
  return repos;
}

async function runTestsForRepo(repo) {
  const { name, path: repoPath } = repo;
  
  log(`\n🧪 Testing ${name}...`, 'blue');
  
  const results = {
    repo: name,
    tests: { ran: false, passed: false },
    lint: { ran: false, passed: false },
    build: { ran: false, passed: false },
  };
  
  try {
    // Check if package.json exists
    const packageJsonPath = path.join(repoPath, 'package.json');
    try {
      await fs.access(packageJsonPath);
    } catch (e) {
      log(`  ⏭️  No package.json, skipping`, 'yellow');
      return results;
    }
    
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
    const scripts = packageJson.scripts || {};
    
    // Run tests if available
    if (scripts.test) {
      try {
        log(`  🧪 Running tests...`, 'cyan');
        execSync('npm test', {
          cwd: repoPath,
          stdio: 'pipe',
          timeout: 30000, // 30 second timeout
        });
        results.tests = { ran: true, passed: true };
        log(`  ✅ Tests passed`, 'green');
      } catch (e) {
        results.tests = { ran: true, passed: false, error: e.message };
        log(`  ⚠️  Tests failed or not found`, 'yellow');
      }
    } else {
      log(`  ⏭️  No test script found`, 'yellow');
    }
    
    // Run lint if available
    if (scripts.lint) {
      try {
        log(`  🔍 Running linter...`, 'cyan');
        execSync('npm run lint', {
          cwd: repoPath,
          stdio: 'pipe',
          timeout: 30000,
        });
        results.lint = { ran: true, passed: true };
        log(`  ✅ Lint passed`, 'green');
      } catch (e) {
        results.lint = { ran: true, passed: false };
        log(`  ⚠️  Lint issues found (non-blocking)`, 'yellow');
      }
    }
    
    // Try build if available
    if (scripts.build) {
      try {
        log(`  🏗️  Running build...`, 'cyan');
        execSync('npm run build', {
          cwd: repoPath,
          stdio: 'pipe',
          timeout: 60000, // 1 minute for builds
        });
        results.build = { ran: true, passed: true };
        log(`  ✅ Build succeeded`, 'green');
      } catch (e) {
        results.build = { ran: true, passed: false };
        log(`  ⚠️  Build failed (non-blocking)`, 'yellow');
      }
    }
    
  } catch (error) {
    log(`  ❌ Error: ${error.message}`, 'red');
    results.error = error.message;
  }
  
  return results;
}

async function main() {
  const args = process.argv.slice(2);
  const workspaceRoot = process.env.WORKSPACE_ROOT || path.resolve(__dirname, '../..');
  const repoFilter = args.find(arg => arg.startsWith('--repo='))?.split('=')[1];
  
  log('\n🧪 Local Test Runner (No GitHub Actions Required)\n', 'bright');
  log('='.repeat(60), 'cyan');
  log(`📁 Workspace: ${workspaceRoot}`, 'cyan');
  log('='.repeat(60) + '\n', 'cyan');
  
  try {
    log('🔍 Finding repos with improvements...', 'cyan');
    const repos = await findReposWithImprovements(workspaceRoot);
    
    const filteredRepos = repoFilter
      ? repos.filter(r => r.name.includes(repoFilter))
      : repos;
    
    log(`Found ${filteredRepos.length} repos to test\n`, 'cyan');
    
    if (filteredRepos.length === 0) {
      log('⚠️  No repos found with improvements', 'yellow');
      return;
    }
    
    const results = [];
    for (const repo of filteredRepos) {
      const result = await runTestsForRepo(repo);
      results.push(result);
    }
    
    // Summary
    log('\n' + '='.repeat(60), 'cyan');
    log('📊 TEST SUMMARY', 'bright');
    log('='.repeat(60), 'cyan');
    
    const withTests = results.filter(r => r.tests.ran);
    const testsPassed = results.filter(r => r.tests.passed);
    const buildsPassed = results.filter(r => r.build.passed);
    
    log(`Total Repos: ${results.length}`, 'cyan');
    log(`✅ Tests Ran: ${withTests.length}`, 'green');
    log(`✅ Tests Passed: ${testsPassed.length}`, 'green');
    log(`✅ Builds Passed: ${buildsPassed.length}`, 'green');
    
    if (withTests.length > 0) {
      log(`\n📋 Detailed Results:`, 'cyan');
      results.forEach(r => {
        if (r.tests.ran) {
          const status = r.tests.passed ? '✅' : '⚠️';
          log(`  ${status} ${r.repo}: Tests ${r.tests.passed ? 'passed' : 'failed'}`, r.tests.passed ? 'green' : 'yellow');
        }
      });
    }
    
    log('\n' + '='.repeat(60) + '\n', 'cyan');
    
  } catch (error) {
    log(`\n❌ Error: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { findReposWithImprovements, runTestsForRepo };
