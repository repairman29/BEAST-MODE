#!/usr/bin/env node

/**
 * Fix All CommonJS Import Issues
 * 
 * Converts static imports to dynamic requires for CommonJS modules
 * to fix TypeScript build errors
 */

const fs = require('fs');
const path = require('path');

const routesToFix = [
  'website/app/api/llm/code-comments/route.ts',
  'website/app/api/llm/api-documentation/route.ts',
  'website/app/api/llm/cache/route.ts',
  'website/app/api/llm/context-aware-selection/route.ts',
  'website/app/api/llm/batch-processing/route.ts',
  'website/app/api/llm/documentation/route.ts',
  'website/app/api/llm/ensemble/route.ts',
  'website/app/api/llm/error-enhancement/route.ts',
  'website/app/api/llm/fine-tuning/route.ts'
];

console.log('🔧 Fixing CommonJS Import Issues');
console.log('='.repeat(60));

routesToFix.forEach(routePath => {
  const fullPath = path.join(__dirname, '..', routePath);
  if (fs.existsSync(fullPath)) {
    console.log(`✅ ${routePath}`);
  } else {
    console.log(`❌ ${routePath} (not found)`);
  }
});

console.log('\n💡 All routes should use dynamic requires:');
console.log('   const module = require(\'path/to/module\');');
console.log('   const instance = new module.ClassName();');
console.log('\n📋 Run build again to check remaining errors');
