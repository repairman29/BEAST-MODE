#!/usr/bin/env node

/**
 * Install Brand/Reputation/Secret Interceptor across all repairman29 repos
 * 
 * This script finds all git repos in the workspace and installs the interceptor hook
 * Works for repos that have the interceptor code (BEAST-MODE-PRODUCT) and others
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const WORKSPACE_ROOT = path.resolve(path.join(__dirname, '../..'));
const BEAST_MODE_ROOT = path.resolve(path.join(__dirname, '..'));

/**
 * Find all git repositories in workspace using find command (more reliable)
 */
function findGitRepos(rootDir) {
  const repos = [];
  const seen = new Set();
  
  try {
    // Use find command to locate all .git directories
    const { execSync } = require('child_process');
    const findCmd = `find "${rootDir}" -name ".git" -type d 2>/dev/null`;
    const output = execSync(findCmd, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
    
    const gitDirs = output.trim().split('\n').filter(Boolean);
    
    for (const gitDir of gitDirs) {
      const repoDir = path.dirname(gitDir);
      const normalized = path.resolve(repoDir);
      
      // Skip if already seen
      if (seen.has(normalized)) continue;
      
      // Skip if inside another repo (nested repos), but allow if it's a legitimate sub-repo
      let isNested = false;
      for (const existingRepo of repos) {
        const existingNormalized = path.resolve(existingRepo);
        if (normalized.startsWith(existingNormalized + path.sep) && normalized !== existingNormalized) {
          // Check if this is a legitimate nested repo (has its own remote)
          try {
            const { execSync } = require('child_process');
            execSync('git remote -v', { cwd: repoDir, stdio: 'ignore' });
            // Has remote, so it's a legitimate repo - include it
            isNested = false;
            break;
          } catch (e) {
            // No remote, probably a nested subdirectory - skip it
            isNested = true;
            break;
          }
        }
      }
      
      if (!isNested) {
        repos.push(repoDir);
        seen.add(normalized);
      }
    }
  } catch (error) {
    console.warn('⚠️  Error using find command, falling back to directory scan:', error.message);
    // Fallback to directory scanning
    return findGitReposFallback(rootDir);
  }
  
  return repos;
}

/**
 * Fallback: Find git repos by directory scanning
 */
function findGitReposFallback(rootDir, maxDepth = 6) {
  const repos = [];
  const seen = new Set();
  
  function scanDir(dir, depth) {
    if (depth > maxDepth) return;
    
    const gitDir = path.join(dir, '.git');
    if (fs.existsSync(gitDir)) {
      try {
        const stat = fs.statSync(gitDir);
        if (stat.isDirectory() || stat.isFile()) {
          const normalized = path.resolve(dir);
          if (!seen.has(normalized)) {
            repos.push(dir);
            seen.add(normalized);
          }
          // Continue scanning at root level to find nested repos
          if (depth > 0) return;
        }
      } catch (e) {
        // Skip if can't access
      }
    }
    
    try {
      const entries = fs.readdirSync(dir);
      for (const entry of entries) {
        if (entry.startsWith('.') && entry !== '.git') continue;
        if (entry === 'node_modules' || entry === 'dist' || entry === 'build' || 
            entry === 'coverage' || entry === 'temp-repos' || entry === 'backups') {
          continue;
        }
        
        const fullPath = path.join(dir, entry);
        try {
          const stat = fs.statSync(fullPath);
          if (stat.isDirectory()) {
            scanDir(fullPath, depth + 1);
          }
        } catch (e) {
          // Skip if can't access
        }
      }
    } catch (e) {
      // Skip if can't read
    }
  }
  
  scanDir(rootDir, 0);
  return repos;
}

/**
 * Check if repo has interceptor code
 */
function hasInterceptorCode(repoPath) {
  const interceptorPath = path.join(repoPath, 'lib', 'janitor', 'brand-reputation-interceptor.js');
  return fs.existsSync(interceptorPath);
}

/**
 * Install hook in repo with interceptor code (BEAST-MODE-PRODUCT style)
 */
function installHookWithCode(repoPath) {
  const hookPath = path.join(repoPath, '.git', 'hooks', 'pre-commit');
  const hooksDir = path.dirname(hookPath);
  
  // Ensure hooks directory exists
  if (!fs.existsSync(hooksDir)) {
    fs.mkdirSync(hooksDir, { recursive: true });
  }
  
  // Check if hook already exists
  if (fs.existsSync(hookPath)) {
    const existing = fs.readFileSync(hookPath, 'utf8');
    if (existing.includes('BrandReputationInterceptor')) {
      return { installed: true, reason: 'already installed' };
    }
  }
  
  // Create hook that uses local interceptor
  const hookContent = `#!/bin/sh
# BEAST MODE Brand/Reputation/Secret Interceptor Pre-Commit Hook
# Prevents committing secrets, internal docs, and business-sensitive content

PROJECT_ROOT="${repoPath}"
cd "$PROJECT_ROOT"

# Run the interceptor
node -e "
const { BrandReputationInterceptor } = require('./lib/janitor/brand-reputation-interceptor');
const interceptor = new BrandReputationInterceptor({ 
  enabled: true, 
  strictMode: true,
  storeInSupabase: true 
});

interceptor.initialize()
  .then(() => interceptor.checkStagedFiles())
  .then(result => {
    if (!result.allowed) {
      console.error('\\\\n🛡️  BEAST MODE Brand/Reputation/Secret Interceptor');
      console.error('\\\\n❌ Commit blocked! Found issues:');
      result.issues.forEach(issue => {
        console.error(\`   • [\${issue.severity.toUpperCase()}] \${issue.message}\`);
      });
      console.error(\`\\\\n📊 Intercepted \${result.interceptedFiles.length} file(s)\`);
      if (result.interceptedFiles.length > 0) {
        console.error('\\\\n💾 Intercepted data stored in Supabase for bot access');
        console.error('   Access via: GET /api/intercepted-commits');
      }
      console.error('\\\\n💡 To fix:');
      console.error('   1. Remove secrets/internal content from files');
      console.error('   2. Use environment variables for secrets');
      console.error('   3. Store internal docs in Supabase instead');
      console.error('   4. Re-stage and commit again');
      console.error('\\\\n🔍 To view intercepted data:');
      console.error('   beast-mode interceptor list');
      process.exit(1);
    } else {
      console.log('✅ All files are safe to commit');
      process.exit(0);
    }
  })
  .catch(err => {
    console.error('❌ Interceptor error:', err.message);
    // Don't block commit on interceptor errors - fail open
    process.exit(0);
  });
`;

  fs.writeFileSync(hookPath, hookContent, 'utf8');
  fs.chmodSync(hookPath, '755');
  
  return { installed: true, reason: 'installed with local code' };
}

/**
 * Install hook in repo without interceptor code (uses BEAST-MODE-PRODUCT)
 */
function installHookRemote(repoPath) {
  const hookPath = path.join(repoPath, '.git', 'hooks', 'pre-commit');
  const hooksDir = path.dirname(hookPath);
  
  // Ensure hooks directory exists
  if (!fs.existsSync(hooksDir)) {
    fs.mkdirSync(hooksDir, { recursive: true });
  }
  
  // Check if hook already exists
  if (fs.existsSync(hookPath)) {
    const existing = fs.readFileSync(hookPath, 'utf8');
    if (existing.includes('BrandReputationInterceptor')) {
      return { installed: true, reason: 'already installed' };
    }
  }
  
  // Create hook that uses BEAST-MODE-PRODUCT interceptor
  const hookContent = `#!/bin/sh
# BEAST MODE Brand/Reputation/Secret Interceptor Pre-Commit Hook
# Prevents committing secrets, internal docs, and business-sensitive content
# Uses interceptor from BEAST-MODE-PRODUCT

BEAST_MODE_ROOT="${BEAST_MODE_ROOT}"
REPO_ROOT="${repoPath}"
cd "$REPO_ROOT"

# Run the interceptor from BEAST-MODE-PRODUCT
node -e "
const { BrandReputationInterceptor } = require('${BEAST_MODE_ROOT}/lib/janitor/brand-reputation-interceptor');
const interceptor = new BrandReputationInterceptor({ 
  enabled: true, 
  strictMode: true,
  storeInSupabase: true 
});

interceptor.initialize()
  .then(() => interceptor.checkStagedFiles())
  .then(result => {
    if (!result.allowed) {
      console.error('\\\\n🛡️  BEAST MODE Brand/Reputation/Secret Interceptor');
      console.error('\\\\n❌ Commit blocked! Found issues:');
      result.issues.forEach(issue => {
        console.error(\`   • [\${issue.severity.toUpperCase()}] \${issue.message}\`);
      });
      console.error(\`\\\\n📊 Intercepted \${result.interceptedFiles.length} file(s)\`);
      if (result.interceptedFiles.length > 0) {
        console.error('\\\\n💾 Intercepted data stored in Supabase for bot access');
        console.error('   Access via: GET /api/intercepted-commits');
      }
      console.error('\\\\n💡 To fix:');
      console.error('   1. Remove secrets/internal content from files');
      console.error('   2. Use environment variables for secrets');
      console.error('   3. Store internal docs in Supabase instead');
      console.error('   4. Re-stage and commit again');
      process.exit(1);
    } else {
      console.log('✅ All files are safe to commit');
      process.exit(0);
    }
  })
  .catch(err => {
    console.error('❌ Interceptor error:', err.message);
    // Don't block commit on interceptor errors - fail open
    process.exit(0);
  });
`;

  fs.writeFileSync(hookPath, hookContent, 'utf8');
  fs.chmodSync(hookPath, '755');
  
  return { installed: true, reason: 'installed with remote code' };
}

/**
 * Get repo name from path
 */
function getRepoName(repoPath) {
  return path.basename(repoPath);
}

/**
 * Main installation function
 */
async function installAllRepos() {
  console.log('🛡️  Installing Brand/Reputation/Secret Interceptor across all repos\n');
  
  const repos = findGitRepos(WORKSPACE_ROOT);
  console.log(`📋 Found ${repos.length} git repositories\n`);
  
  const results = {
    withCode: [],
    remote: [],
    skipped: [],
    errors: []
  };
  
  for (const repoPath of repos) {
    const repoName = getRepoName(repoPath);
    
    try {
      if (hasInterceptorCode(repoPath)) {
        const result = installHookWithCode(repoPath);
        results.withCode.push({ repo: repoName, path: repoPath, ...result });
        console.log(`✅ ${repoName} - ${result.reason}`);
      } else {
        const result = installHookRemote(repoPath);
        results.remote.push({ repo: repoName, path: repoPath, ...result });
        console.log(`✅ ${repoName} - ${result.reason} (using BEAST-MODE-PRODUCT)`);
      }
    } catch (error) {
      results.errors.push({ repo: repoName, path: repoPath, error: error.message });
      console.log(`❌ ${repoName} - Error: ${error.message}`);
    }
  }
  
  console.log('\n📊 Summary:');
  console.log(`   ✅ Installed in ${results.withCode.length + results.remote.length} repos`);
  console.log(`   📦 With local code: ${results.withCode.length}`);
  console.log(`   🔗 Using remote code: ${results.remote.length}`);
  if (results.errors.length > 0) {
    console.log(`   ❌ Errors: ${results.errors.length}`);
  }
  
  console.log('\n💡 The interceptor will now run automatically on all commits');
  console.log('   Intercepted data will be stored in Supabase for bot access\n');
  
  return results;
}

if (require.main === module) {
  installAllRepos().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { installAllRepos, findGitRepos };
