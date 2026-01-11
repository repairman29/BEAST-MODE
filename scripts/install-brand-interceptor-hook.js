#!/usr/bin/env node

/**
 * Install Brand/Reputation/Secret Interceptor Pre-Commit Hook
 * 
 * This hook intercepts commits that contain:
 * - Secrets (API keys, tokens, passwords)
 * - Internal strategy documents
 * - Marketing/content materials
 * - Business-sensitive information
 * 
 * Intercepted data is stored in Supabase for bot access
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

const HOOK_PATH = path.join(process.cwd(), '.git', 'hooks', 'pre-commit');
const PROJECT_ROOT = process.cwd();

async function installHook() {
  try {
    // Ensure .git/hooks directory exists
    const hooksDir = path.dirname(HOOK_PATH);
    await fs.mkdir(hooksDir, { recursive: true });

    // Check if hook already exists
    let existingHook = '';
    try {
      existingHook = await fs.readFile(HOOK_PATH, 'utf8');
      if (existingHook.includes('BrandReputationInterceptor')) {
        console.log('✅ Brand/Reputation/Secret Interceptor hook already installed');
        return;
      }
    } catch {
      // Hook doesn't exist, that's fine
    }

    // Create the pre-commit hook
    const hookContent = `#!/bin/sh
# BEAST MODE Brand/Reputation/Secret Interceptor Pre-Commit Hook
# Prevents committing secrets, internal docs, and business-sensitive content

PROJECT_ROOT="${PROJECT_ROOT}"
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
      console.error('\\n🛡️  BEAST MODE Brand/Reputation/Secret Interceptor');
      console.error('\\n❌ Commit blocked! Found issues:');
      result.issues.forEach(issue => {
        console.error(\`   • [\${issue.severity.toUpperCase()}] \${issue.message}\`);
      });
      console.error(\`\\n📊 Intercepted \${result.interceptedFiles.length} file(s)\`);
      if (result.interceptedFiles.length > 0) {
        console.error('\\n💾 Intercepted data stored in Supabase for bot access');
        console.error('   Access via: GET /api/intercepted-commits');
      }
      console.error('\\n💡 To fix:');
      console.error('   1. Remove secrets/internal content from files');
      console.error('   2. Use environment variables for secrets');
      console.error('   3. Store internal docs in Supabase instead');
      console.error('   4. Re-stage and commit again');
      console.error('\\n🔍 To view intercepted data:');
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

    await fs.writeFile(HOOK_PATH, hookContent, 'utf8');
    await fs.chmod(HOOK_PATH, '755');

    console.log('✅ Brand/Reputation/Secret Interceptor pre-commit hook installed');
    console.log('   Hook location:', HOOK_PATH);
    console.log('\n💡 The hook will now intercept unsafe commits automatically');
    console.log('   Intercepted data will be stored in Supabase for bot access');
  } catch (error) {
    console.error('❌ Failed to install hook:', error.message);
    process.exit(1);
  }
}

installHook();
