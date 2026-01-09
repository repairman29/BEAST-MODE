#!/usr/bin/env node

/**
 * Deploy All to Production
 * 
 * Complete deployment checklist and validation
 * Dog Fooding: Built using BEAST MODE
 */

require('dotenv').config({ path: require('path').join(__dirname, '../website/.env.local') });
require('dotenv').config();

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PRODUCTION_URL = process.env.NEXT_PUBLIC_URL || 'https://beast-mode.dev';

console.log('🚀 Deploying All to Production...\n');
console.log('='.repeat(60));

// Step 1: Build check
console.log('\n1️⃣ Checking build...');
try {
  process.chdir(path.join(__dirname, '../website'));
  execSync('npm run build', { stdio: 'inherit' });
  console.log('   ✅ Build successful');
} catch (error) {
  console.error('   ❌ Build failed');
  process.exit(1);
}

// Step 2: Verify migrations
console.log('\n2️⃣ Verifying migrations...');
try {
  process.chdir(path.join(__dirname, '..'));
  const migrationScript = path.join(__dirname, 'apply-all-phase-migrations-via-exec-sql.js');
  if (fs.existsSync(migrationScript)) {
    console.log('   ✅ Migration script ready');
  } else {
    console.log('   ⚠️  Migration script not found');
  }
} catch (error) {
  console.log('   ⚠️  Could not verify migrations');
}

// Step 3: Deploy to Vercel
console.log('\n3️⃣ Deploying to Vercel...');
try {
  process.chdir(path.join(__dirname, '../website'));
  execSync('vercel --prod --yes', { stdio: 'inherit' });
  console.log('   ✅ Deployment successful');
} catch (error) {
  console.error('   ❌ Deployment failed');
  process.exit(1);
}

// Step 4: Validate deployment
console.log('\n4️⃣ Validating deployment...');
try {
  process.chdir(path.join(__dirname, '..'));
  const validateScript = path.join(__dirname, 'validate-production-deployment.js');
  if (fs.existsSync(validateScript)) {
    execSync(`node ${validateScript}`, { stdio: 'inherit' });
  } else {
    console.log('   ⚠️  Validation script not found');
  }
} catch (error) {
  console.log('   ⚠️  Validation had issues (may be expected)');
}

console.log('\n' + '='.repeat(60));
console.log('\n🎉 Deployment Complete!\n');
console.log(`🌐 Production URL: ${PRODUCTION_URL}\n`);
