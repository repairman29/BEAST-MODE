/**
 * Pre-Deployment Testing Script
 * 
 * Comprehensive pre-deployment testing
 * 
 * Phase 1: Production Deployment
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function main() {
  console.log('🧪 Pre-Deployment Testing\n');

  const websiteDir = path.join(__dirname, '../website');
  let allTestsPassed = true;

  // Test 1: Build test
  console.log('1️⃣  Testing Production Build...');
  try {
    execSync('npm run build', { cwd: websiteDir, stdio: 'inherit' });
    console.log('   ✅ Production build successful\n');
  } catch (error) {
    console.error('   ❌ Production build failed');
    allTestsPassed = false;
  }

  // Test 2: Lint test
  console.log('2️⃣  Testing Linting...');
  try {
    execSync('npm run lint', { cwd: websiteDir, stdio: 'inherit' });
    console.log('   ✅ Linting passed\n');
  } catch (error) {
    console.error('   ❌ Linting failed');
    allTestsPassed = false;
  }

  // Test 3: Environment verification
  console.log('3️⃣  Testing Environment Configuration...');
  try {
    execSync('npm run verify:env', { cwd: path.join(__dirname, '..'), stdio: 'inherit' });
    console.log('   ✅ Environment configuration verified\n');
  } catch (error) {
    console.error('   ❌ Environment configuration failed');
    allTestsPassed = false;
  }

  // Test 4: Monitoring tests
  console.log('4️⃣  Testing Monitoring...');
  try {
    execSync('npm run test:monitoring', { cwd: path.join(__dirname, '..'), stdio: 'inherit' });
    console.log('   ✅ Monitoring tests passed\n');
  } catch (error) {
    console.error('   ❌ Monitoring tests failed');
    allTestsPassed = false;
  }

  // Test 5: Alert tests
  console.log('5️⃣  Testing Alerts...');
  try {
    execSync('npm run test:alerts', { cwd: path.join(__dirname, '..'), stdio: 'inherit' });
    console.log('   ✅ Alert tests passed\n');
  } catch (error) {
    console.error('   ❌ Alert tests failed');
    allTestsPassed = false;
  }

  // Summary
  console.log('═'.repeat(50));
  if (allTestsPassed) {
    console.log('✅ All pre-deployment tests passed!');
    console.log('\n📋 Ready for deployment:');
    console.log('   1. Review deployment checklist: docs/DEPLOYMENT_CHECKLIST.md');
    console.log('   2. Deploy: cd website && vercel --prod --yes');
    console.log('   3. Verify: curl https://your-domain.com/api/health');
  } else {
    console.log('❌ Some tests failed. Please fix issues before deploying.');
    process.exit(1);
  }

  process.exit(0);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

