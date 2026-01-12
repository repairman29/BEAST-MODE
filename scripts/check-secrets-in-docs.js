#!/usr/bin/env node

/**
 * Check documentation files for hardcoded secrets
 * Prevents committing secrets to git
 */

const fs = require('fs');
const path = require('path');

const DOCS_DIR = path.join(__dirname, '../docs');
const SECRET_PATTERNS = [
  // API Keys
  /sk-[a-zA-Z0-9]{20,}/g, // OpenAI, Stripe secret keys
  /sk_live_[a-zA-Z0-9]{24,}/g, // Stripe live keys
  /sk_test_[a-zA-Z0-9]{24,}/g, // Stripe test keys
  /ghp_[a-zA-Z0-9]{36,}/g, // GitHub personal access tokens
  /gho_[a-zA-Z0-9]{36,}/g, // GitHub OAuth tokens
  /ghu_[a-zA-Z0-9]{36,}/g, // GitHub user-to-server tokens
  /ghs_[a-zA-Z0-9]{36,}/g, // GitHub server-to-server tokens
  /ghr_[a-zA-Z0-9]{36,}/g, // GitHub refresh tokens
  
  // Webhook Secrets
  /whsec_[a-zA-Z0-9]{32,}/g, // Stripe webhook secrets
  // Note: Hex pattern removed - too many false positives (Stripe Price IDs, etc.)
  // Specific known secret hashes are checked separately
  
  // Supabase
  /sb_secret_[a-zA-Z0-9]{40,}/g, // Supabase service role keys
  /eyJ[a-zA-Z0-9_-]{100,}/g, // JWT tokens (Supabase anon keys)
  
  // Other common patterns
  /[a-zA-Z0-9_-]{32,}=/g, // Base64-like secrets with =
  /pk_live_[a-zA-Z0-9]{24,}/g, // Stripe publishable keys (less sensitive but should be in DB)
  /pk_test_[a-zA-Z0-9]{24,}/g, // Stripe test publishable keys
  
  // Specific known secrets (from our docs)
  /014c7fab1ba6cc6a7398b5bde04e26463f16f4e9/g, // GitHub client secret (prod)
  /df4c598018de45ce8cb90313489eeb21448aedcf/g, // GitHub client secret (dev)
  /30bb02c253af11af81a53467043d5944bd5967c5/g, // GitHub webhook secret
];

const EXCLUDED_PATTERNS = [
  /STORED_IN_DB/g,
  /REDACTED/g,
  /\[.*SECRET.*\]/g,
  /placeholder/g,
  /example/g,
  /your_.*_here/g,
  /EXAMPLE_SECRET/g,
];

// Patterns that are NOT secrets (public identifiers)
const PUBLIC_PATTERNS = [
  /NEXT_PUBLIC_STRIPE_PRICE_/g, // Stripe Price IDs are public
  /price_[a-zA-Z0-9]+/g, // Stripe price IDs
];

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const issues = [];
  
  for (const pattern of SECRET_PATTERNS) {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      const value = match[0];
      const line = content.substring(0, match.index).split('\n').length;
      
      // Check if it's excluded (placeholder)
      const isExcluded = EXCLUDED_PATTERNS.some(exclude => exclude.test(value));
      if (isExcluded) continue;
      
      // Check if it's a public identifier (not a secret)
      const contextBefore = content.substring(Math.max(0, match.index - 150), match.index);
      const contextAfter = content.substring(match.index, Math.min(content.length, match.index + 50));
      const fullContext = contextBefore + contextAfter;
      
      // Stripe Price IDs are public identifiers (not secrets)
      const isPublic = fullContext.includes('NEXT_PUBLIC_STRIPE_PRICE_') || 
                      fullContext.includes('price_') ||
                      (fullContext.includes('STRIPE_PRICE') && fullContext.includes('PUBLIC')) ||
                      fullContext.includes('Public price ID');
      if (isPublic) continue;
      
      // Check if it's in a code block that says it's stored in DB
      const beforeMatch = content.substring(Math.max(0, match.index - 200), match.index);
      const afterMatch = content.substring(match.index, Math.min(content.length, match.index + 200));
      const context = beforeMatch + afterMatch;
      
      if (context.includes('STORED_IN_DB') || context.includes('REDACTED')) {
        continue;
      }
      
      issues.push({
        file: path.relative(DOCS_DIR, filePath),
        line,
        value: value.substring(0, 20) + '...',
        fullValue: value,
      });
    }
  }
  
  return issues;
}

function scanDirectory(dir) {
  const issues = [];
  const files = [];
  
  function walkDir(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walkDir(fullPath);
      } else if (entry.name.endsWith('.md')) {
        files.push(fullPath);
      }
    }
  }
  
  walkDir(dir);
  
  for (const file of files) {
    const fileIssues = scanFile(file);
    issues.push(...fileIssues);
  }
  
  return issues;
}

function main() {
  const checkOnly = process.argv.includes('--check-only');
  
  console.log('🔍 Scanning documentation for hardcoded secrets...\n');
  
  if (!fs.existsSync(DOCS_DIR)) {
    console.error(`❌ Documentation directory not found: ${DOCS_DIR}`);
    process.exit(1);
  }
  
  const issues = scanDirectory(DOCS_DIR);
  
  if (issues.length === 0) {
    console.log('✅ No hardcoded secrets found in documentation!\n');
    process.exit(0);
  }
  
  console.log(`⚠️  Found ${issues.length} potential secret(s) in documentation:\n`);
  
  const byFile = {};
  issues.forEach(issue => {
    if (!byFile[issue.file]) byFile[issue.file] = [];
    byFile[issue.file].push(issue);
  });
  
  for (const [file, fileIssues] of Object.entries(byFile)) {
    console.log(`📄 ${file}:`);
    fileIssues.forEach(issue => {
      console.log(`   Line ${issue.line}: ${issue.value}`);
    });
    console.log('');
  }
  
  console.log('❌ ACTION REQUIRED:');
  console.log('   1. Replace hardcoded secrets with placeholders: [STORED_IN_DB]');
  console.log('   2. Store secrets in database: node scripts/scan-docs-for-secrets.js');
  console.log('   3. Update documentation to reference database storage');
  console.log('   4. Re-run this check before committing\n');
  
  if (!checkOnly) {
    console.log('💡 Tip: Run with --check-only to skip database operations');
  }
  
  process.exit(1);
}

if (require.main === module) {
  main();
}

module.exports = { scanDirectory, scanFile };
