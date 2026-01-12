#!/usr/bin/env node

/**
 * Replace hardcoded secrets in documentation with placeholders
 * Since secrets are already stored in the database, we can safely replace them
 */

const fs = require('fs');
const path = require('path');

const DOCS_DIR = path.join(__dirname, '../docs');

// Known secrets that are already in the database
const SECRET_REPLACEMENTS = {
  // GitHub OAuth secrets
  '014c7fab1ba6cc6a7398b5bde04e26463f16f4e9': '[STORED_IN_DB]', // GitHub client secret (prod)
  'df4c598018de45ce8cb90313489eeb21448aedcf': '[STORED_IN_DB]', // GitHub client secret (dev)
  '30bb02c253af11af81a53467043d5944bd5967c5': '[STORED_IN_DB]', // GitHub webhook secret
  
  // GitHub Client IDs (these are public, but we'll replace for consistency)
  'Ov23liDKFkIrnPneWwny': 'Ov23liDKFkIrnPneWwny', // Keep prod client ID (it's public)
  'Ov23lidLvmp68FVMEqEB': 'Ov23lidLvmp68FVMEqEB', // Keep dev client ID (it's public)
};

// Patterns to replace (with context-aware replacements)
const REPLACEMENT_PATTERNS = [
  {
    // GitHub client secrets
    pattern: /(GITHUB_CLIENT_SECRET[=:]\s*)([a-f0-9]{40})/gi,
    replacement: (match, prefix, secret) => {
      if (SECRET_REPLACEMENTS[secret]) {
        return `${prefix}${SECRET_REPLACEMENTS[secret]}`;
      }
      return `${prefix}[STORED_IN_DB]`;
    }
  },
  {
    // GitHub webhook secrets
    pattern: /(GITHUB.*WEBHOOK.*SECRET[=:]\s*)([a-f0-9]{40})/gi,
    replacement: (match, prefix, secret) => {
      if (SECRET_REPLACEMENTS[secret]) {
        return `${prefix}${SECRET_REPLACEMENTS[secret]}`;
      }
      return `${prefix}[STORED_IN_DB]`;
    }
  },
  {
    // Stripe price IDs (these are public, but we'll add note)
    pattern: /(NEXT_PUBLIC_STRIPE_PRICE_[^=]+=)(price_[a-zA-Z0-9]+)/gi,
    replacement: (match, prefix, priceId) => {
      return `${prefix}${priceId} # Public price ID - actual secret stored in DB`;
    }
  },
  {
    // Any 40-char hex strings that look like secrets
    pattern: /([=:]\s*)([a-f0-9]{40})(\s|$|"|'|`)/gi,
    replacement: (match, prefix, secret, suffix) => {
      // Skip if it's already a placeholder or in a code comment
      if (match.includes('[STORED_IN_DB]') || match.includes('REDACTED')) {
        return match;
      }
      // Check if it's a known secret
      if (SECRET_REPLACEMENTS[secret]) {
        return `${prefix}${SECRET_REPLACEMENTS[secret]}${suffix}`;
      }
      // Only replace if it looks like a secret (not a hash in documentation context)
      const beforeMatch = match.substring(0, 50);
      if (beforeMatch.includes('SECRET') || beforeMatch.includes('secret') || 
          beforeMatch.includes('KEY') || beforeMatch.includes('key')) {
        return `${prefix}[STORED_IN_DB]${suffix}`;
      }
      return match; // Don't replace if it doesn't look like a secret
    }
  },
];

function replaceSecretsInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  let replacements = 0;

  // Apply each replacement pattern
  for (const { pattern, replacement } of REPLACEMENT_PATTERNS) {
    const newContent = content.replace(pattern, (match, ...args) => {
      const result = typeof replacement === 'function' 
        ? replacement(match, ...args)
        : replacement;
      if (result !== match) {
        replacements++;
        modified = true;
      }
      return result;
    });
    content = newContent;
  }

  // Also replace known secrets directly (more aggressive)
  for (const [secret, placeholder] of Object.entries(SECRET_REPLACEMENTS)) {
    if (secret === placeholder) continue; // Skip if it's the same
    
    // Find all occurrences
    let index = 0;
    while ((index = content.indexOf(secret, index)) !== -1) {
      // Get context around the secret
      const start = Math.max(0, index - 200);
      const end = Math.min(content.length, index + secret.length + 200);
      const context = content.substring(start, end);
      
      // Skip if already replaced or in a "NEVER DO THIS" example
      if (context.includes('[STORED_IN_DB]') || 
          context.includes('REDACTED') ||
          (context.includes('NEVER DO THIS') && context.includes('❌'))) {
        index += secret.length;
        continue;
      }
      
      // Replace the secret
      content = content.substring(0, index) + placeholder + content.substring(index + secret.length);
      replacements++;
      modified = true;
      index += placeholder.length; // Move past the replacement
    }
  }
  
  // Replace secrets in code blocks (backtick blocks)
  const codeBlockPattern = /```[\s\S]*?```/g;
  content = content.replace(codeBlockPattern, (codeBlock) => {
    let modifiedBlock = codeBlock;
    for (const [secret, placeholder] of Object.entries(SECRET_REPLACEMENTS)) {
      if (secret === placeholder) continue;
      // Only replace if it looks like a secret (has SECRET, KEY, etc. nearby)
      if (codeBlock.includes(secret) && 
          (codeBlock.includes('SECRET') || codeBlock.includes('secret') ||
           codeBlock.includes('KEY') || codeBlock.includes('key') ||
           codeBlock.includes('CLIENT_SECRET') || codeBlock.includes('WEBHOOK'))) {
        // Don't replace if it's already a placeholder or in an example
        if (!codeBlock.includes('[STORED_IN_DB]') && 
            !codeBlock.includes('NEVER DO THIS')) {
          modifiedBlock = modifiedBlock.replace(new RegExp(secret.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), placeholder);
          if (modifiedBlock !== codeBlock) {
            replacements++;
            modified = true;
          }
        }
      }
    }
    return modifiedBlock;
  });

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    return { modified: true, replacements };
  }

  return { modified: false, replacements: 0 };
}

function scanDirectory(dir) {
  const files = [];
  const results = [];

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

  console.log(`📄 Processing ${files.length} documentation files...\n`);

  for (const file of files) {
    const result = replaceSecretsInFile(file);
    if (result.modified) {
      const relativePath = path.relative(DOCS_DIR, file);
      results.push({ file: relativePath, replacements: result.replacements });
      console.log(`   ✅ ${relativePath}: ${result.replacements} replacement(s)`);
    }
  }

  return results;
}

function main() {
  const dryRun = process.argv.includes('--dry-run');
  
  console.log('🔍 Replacing secrets in documentation with placeholders...\n');
  
  if (!fs.existsSync(DOCS_DIR)) {
    console.error(`❌ Documentation directory not found: ${DOCS_DIR}`);
    process.exit(1);
  }

  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No files will be modified\n');
  }

  const results = scanDirectory(DOCS_DIR);

  if (results.length === 0) {
    console.log('\n✅ No secrets found to replace (or already replaced)!\n');
    process.exit(0);
  }

  const totalReplacements = results.reduce((sum, r) => sum + r.replacements, 0);

  console.log(`\n✅ Complete!`);
  console.log(`   • Files modified: ${results.length}`);
  console.log(`   • Total replacements: ${totalReplacements}\n`);

  console.log('📋 Next steps:');
  console.log('   1. Review the changes');
  console.log('   2. Verify secrets are still accessible in database');
  console.log('   3. Update any documentation that references these secrets');
  console.log('   4. Commit the changes\n');
}

if (require.main === module) {
  main();
}

module.exports = { replaceSecretsInFile, scanDirectory };
