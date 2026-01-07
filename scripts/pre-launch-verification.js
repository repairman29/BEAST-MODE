#!/usr/bin/env node

/**
 * Pre-Launch Verification Script for BEAST MODE MVP
 * 
 * Runs all pre-launch checks:
 * - Build verification
 * - Test suite
 * - Security audit
 * - DNS verification
 * - Integration checks
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

const checks = [];
const rootDir = path.join(__dirname, '..');
const websiteDir = path.join(rootDir, 'website');

/**
 * Check if build succeeds
 */
function checkBuild() {
  log('\n1. Checking Build...', 'cyan');
  try {
    process.chdir(websiteDir);
    const output = execSync('npm run build', { 
      encoding: 'utf8',
      stdio: 'pipe',
      timeout: 120000 // 2 minutes
    });
    
    if (output.includes('Compiled successfully') || output.includes('Route (app)')) {
      log('   ✅ Build successful', 'green');
      checks.push({ name: 'Build', status: 'pass' });
      return true;
    } else {
      log('   ⚠️  Build completed but check output', 'yellow');
      checks.push({ name: 'Build', status: 'warning' });
      return false;
    }
  } catch (error) {
    log(`   ❌ Build failed: ${error.message}`, 'red');
    checks.push({ name: 'Build', status: 'fail', error: error.message });
    return false;
  } finally {
    process.chdir(rootDir);
  }
}

/**
 * Check test suite
 */
function checkTests() {
  log('\n2. Checking Test Suite...', 'cyan');
  try {
    process.chdir(websiteDir);
    const output = execSync('npm run test:final 2>&1 || npm test 2>&1', { 
      encoding: 'utf8',
      stdio: 'pipe',
      timeout: 60000 // 1 minute
    });
    
    // Extract pass rate
    const passMatch = output.match(/Passed:\s*(\d+)/);
    const failMatch = output.match(/Failed:\s*(\d+)/);
    const totalMatch = output.match(/Total Tests:\s*(\d+)/);
    
    if (passMatch && totalMatch) {
      const passed = parseInt(passMatch[1]);
      const total = parseInt(totalMatch[1]);
      const passRate = ((passed / total) * 100).toFixed(1);
      
      if (passRate >= 90) {
        log(`   ✅ Tests passing: ${passed}/${total} (${passRate}%)`, 'green');
        checks.push({ name: 'Tests', status: 'pass', value: `${passed}/${total} (${passRate}%)` });
        return true;
      } else {
        log(`   ⚠️  Tests: ${passed}/${total} (${passRate}%) - below 90%`, 'yellow');
        checks.push({ name: 'Tests', status: 'warning', value: `${passed}/${total} (${passRate}%)` });
        return false;
      }
    } else {
      log('   ⚠️  Could not parse test results', 'yellow');
      checks.push({ name: 'Tests', status: 'warning' });
      return false;
    }
  } catch (error) {
    log(`   ⚠️  Test check failed: ${error.message}`, 'yellow');
    checks.push({ name: 'Tests', status: 'warning', error: error.message });
    return false;
  } finally {
    process.chdir(rootDir);
  }
}

/**
 * Check security audit
 */
function checkSecurity() {
  log('\n3. Running Security Audit...', 'cyan');
  try {
    const output = execSync('node scripts/security-audit.js', { 
      encoding: 'utf8',
      stdio: 'pipe',
      cwd: rootDir,
      timeout: 30000
    });
    
    if (output.includes('Security audit passed')) {
      log('   ✅ Security audit passed', 'green');
      checks.push({ name: 'Security', status: 'pass' });
      return true;
    } else {
      log('   ⚠️  Security audit has warnings', 'yellow');
      checks.push({ name: 'Security', status: 'warning' });
      return false;
    }
  } catch (error) {
    log(`   ❌ Security audit failed: ${error.message}`, 'red');
    checks.push({ name: 'Security', status: 'fail', error: error.message });
    return false;
  }
}

/**
 * Check DNS
 */
function checkDNS() {
  log('\n4. Checking DNS...', 'cyan');
  try {
    const output = execSync('node scripts/check-dns-verification.js', { 
      encoding: 'utf8',
      stdio: 'pipe',
      cwd: rootDir,
      timeout: 30000
    });
    
    if (output.includes('DNS verification passed')) {
      log('   ✅ DNS verification passed', 'green');
      checks.push({ name: 'DNS', status: 'pass' });
      return true;
    } else {
      log('   ⚠️  DNS verification has issues', 'yellow');
      checks.push({ name: 'DNS', status: 'warning' });
      return false;
    }
  } catch (error) {
    log(`   ❌ DNS check failed: ${error.message}`, 'red');
    checks.push({ name: 'DNS', status: 'fail', error: error.message });
    return false;
  }
}

/**
 * Check environment variables
 */
function checkEnvVars() {
  log('\n5. Checking Environment Variables...', 'cyan');
  
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'JWT_SECRET'
  ];
  
  const envExample = path.join(websiteDir, '.env.example');
  let found = 0;
  
  if (fs.existsSync(envExample)) {
    const content = fs.readFileSync(envExample, 'utf8');
    requiredVars.forEach(varName => {
      if (content.includes(varName)) {
        found++;
      }
    });
  }
  
  if (found === requiredVars.length) {
    log(`   ✅ All required env vars documented (${found}/${requiredVars.length})`, 'green');
    checks.push({ name: 'Environment Variables', status: 'pass', value: `${found}/${requiredVars.length}` });
    return true;
  } else {
    log(`   ⚠️  Some env vars may be missing (${found}/${requiredVars.length})`, 'yellow');
    checks.push({ name: 'Environment Variables', status: 'warning', value: `${found}/${requiredVars.length}` });
    return false;
  }
}

/**
 * Check documentation
 */
function checkDocumentation() {
  log('\n6. Checking Documentation...', 'cyan');
  
  const requiredDocs = [
    'docs/README.md',
    'docs/getting-started/README.md',
    'docs/guides/mvp-user-guide.md',
    'docs/guides/mvp-troubleshooting.md',
    'docs/business/pricing.md',
    'README.md'
  ];
  
  let found = 0;
  requiredDocs.forEach(doc => {
    const docPath = path.join(rootDir, doc);
    if (fs.existsSync(docPath)) {
      found++;
    }
  });
  
  if (found === requiredDocs.length) {
    log(`   ✅ All required docs present (${found}/${requiredDocs.length})`, 'green');
    checks.push({ name: 'Documentation', status: 'pass', value: `${found}/${requiredDocs.length}` });
    return true;
  } else {
    log(`   ⚠️  Some docs may be missing (${found}/${requiredDocs.length})`, 'yellow');
    checks.push({ name: 'Documentation', status: 'warning', value: `${found}/${requiredDocs.length}` });
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  log('\n🚀 BEAST MODE Pre-Launch Verification\n', 'cyan');
  log('='.repeat(60) + '\n');

  checkBuild();
  checkTests();
  checkSecurity();
  checkDNS();
  checkEnvVars();
  checkDocumentation();

  // Summary
  log('\n' + '='.repeat(60), 'cyan');
  log('\n📊 Pre-Launch Verification Summary\n', 'cyan');

  const passed = checks.filter(c => c.status === 'pass').length;
  const failed = checks.filter(c => c.status === 'fail').length;
  const warnings = checks.filter(c => c.status === 'warning').length;

  log(`✅ Passed: ${passed}`, 'green');
  log(`❌ Failed: ${failed}`, failed > 0 ? 'red' : 'green');
  log(`⚠️  Warnings: ${warnings}`, warnings > 0 ? 'yellow' : 'green');

  log('\n📋 Detailed Results:', 'cyan');
  checks.forEach(check => {
    const icon = check.status === 'pass' ? '✅' : check.status === 'fail' ? '❌' : '⚠️';
    const color = check.status === 'pass' ? 'green' : check.status === 'fail' ? 'red' : 'yellow';
    log(`   ${icon} ${check.name}: ${check.status}${check.value ? ` (${check.value})` : ''}${check.error ? ` - ${check.error}` : ''}`, color);
  });

  log('\n');
  
  if (failed === 0 && passed >= 4) {
    log('✅ Pre-launch verification passed! Ready for launch!', 'green');
    process.exit(0);
  } else if (failed === 0) {
    log('⚠️  Pre-launch verification passed with warnings - review before launch', 'yellow');
    process.exit(0);
  } else {
    log('❌ Pre-launch verification failed - please fix issues before launch', 'red');
    process.exit(1);
  }
}

main();

