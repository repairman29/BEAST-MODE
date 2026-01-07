#!/usr/bin/env node

/**
 * DNS Verification Script for BEAST MODE
 * 
 * Checks DNS configuration for beast-mode.dev
 */

const dns = require('dns').promises;
const https = require('https');

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

const DOMAIN = 'beast-mode.dev';
const checks = [];

/**
 * Check DNS A record
 */
async function checkA() {
  log('\n1. Checking A record...', 'cyan');
  try {
    const addresses = await dns.resolve4(DOMAIN);
    if (addresses.length > 0) {
      log(`   ✅ A record found: ${addresses.join(', ')}`, 'green');
      checks.push({ name: 'A record', status: 'pass', value: addresses.join(', ') });
      return true;
    } else {
      log(`   ❌ No A record found`, 'red');
      checks.push({ name: 'A record', status: 'fail' });
      return false;
    }
  } catch (error) {
    log(`   ⚠️  A record check failed: ${error.message}`, 'yellow');
    checks.push({ name: 'A record', status: 'warning', error: error.message });
    return false;
  }
}

/**
 * Check DNS AAAA record (IPv6)
 */
async function checkAAAA() {
  log('\n2. Checking AAAA record (IPv6)...', 'cyan');
  try {
    const addresses = await dns.resolve6(DOMAIN);
    if (addresses.length > 0) {
      log(`   ✅ AAAA record found: ${addresses.join(', ')}`, 'green');
      checks.push({ name: 'AAAA record', status: 'pass', value: addresses.join(', ') });
      return true;
    } else {
      log(`   ⚠️  No AAAA record (optional)`, 'yellow');
      checks.push({ name: 'AAAA record', status: 'optional' });
      return true; // Optional
    }
  } catch (error) {
    log(`   ⚠️  AAAA record not found (optional)`, 'yellow');
    checks.push({ name: 'AAAA record', status: 'optional' });
    return true; // Optional
  }
}

/**
 * Check HTTPS accessibility
 */
async function checkHTTPS() {
  log('\n3. Checking HTTPS accessibility...', 'cyan');
  return new Promise((resolve) => {
    const url = `https://${DOMAIN}`;
    const req = https.get(url, { timeout: 5000 }, (res) => {
      const statusCode = res.statusCode;
      if (statusCode >= 200 && statusCode < 400) {
        log(`   ✅ HTTPS accessible (status: ${statusCode})`, 'green');
        checks.push({ name: 'HTTPS', status: 'pass', value: statusCode });
        resolve(true);
      } else {
        log(`   ⚠️  HTTPS returned status: ${statusCode}`, 'yellow');
        checks.push({ name: 'HTTPS', status: 'warning', value: statusCode });
        resolve(false);
      }
    });

    req.on('error', (error) => {
      log(`   ❌ HTTPS check failed: ${error.message}`, 'red');
      checks.push({ name: 'HTTPS', status: 'fail', error: error.message });
      resolve(false);
    });

    req.on('timeout', () => {
      req.destroy();
      log(`   ❌ HTTPS check timed out`, 'red');
      checks.push({ name: 'HTTPS', status: 'fail', error: 'timeout' });
      resolve(false);
    });

    req.end();
  });
}

/**
 * Check SSL certificate
 */
async function checkSSL() {
  log('\n4. Checking SSL certificate...', 'cyan');
  return new Promise((resolve) => {
    const options = {
      hostname: DOMAIN,
      port: 443,
      method: 'GET',
      rejectUnauthorized: true
    };

    const req = https.request(options, (res) => {
      const cert = res.socket.getPeerCertificate();
      if (cert && cert.subject) {
        const validTo = new Date(cert.valid_to);
        const now = new Date();
        const daysUntilExpiry = Math.floor((validTo - now) / (1000 * 60 * 60 * 24));
        
        if (daysUntilExpiry > 0) {
          log(`   ✅ SSL certificate valid (expires in ${daysUntilExpiry} days)`, 'green');
          checks.push({ name: 'SSL', status: 'pass', value: `${daysUntilExpiry} days` });
          resolve(true);
        } else {
          log(`   ❌ SSL certificate expired`, 'red');
          checks.push({ name: 'SSL', status: 'fail', error: 'expired' });
          resolve(false);
        }
      } else {
        log(`   ⚠️  Could not get certificate info`, 'yellow');
        checks.push({ name: 'SSL', status: 'warning' });
        resolve(false);
      }
    });

    req.on('error', (error) => {
      log(`   ❌ SSL check failed: ${error.message}`, 'red');
      checks.push({ name: 'SSL', status: 'fail', error: error.message });
      resolve(false);
    });

    req.end();
  });
}

/**
 * Main function
 */
async function main() {
  log('\n🌐 BEAST MODE DNS Verification\n', 'cyan');
  log('='.repeat(60) + '\n');
  log(`Domain: ${DOMAIN}`, 'blue');

  await checkA();
  await checkAAAA();
  await checkHTTPS();
  await checkSSL();

  // Summary
  log('\n' + '='.repeat(60), 'cyan');
  log('\n📊 DNS Verification Summary\n', 'cyan');

  const passed = checks.filter(c => c.status === 'pass').length;
  const failed = checks.filter(c => c.status === 'fail').length;
  const warnings = checks.filter(c => c.status === 'warning' || c.status === 'optional').length;

  log(`✅ Passed: ${passed}`, 'green');
  log(`❌ Failed: ${failed}`, failed > 0 ? 'red' : 'green');
  log(`⚠️  Warnings/Optional: ${warnings}`, warnings > 0 ? 'yellow' : 'green');

  log('\n📋 Detailed Results:', 'cyan');
  checks.forEach(check => {
    const icon = check.status === 'pass' ? '✅' : check.status === 'fail' ? '❌' : '⚠️';
    const color = check.status === 'pass' ? 'green' : check.status === 'fail' ? 'red' : 'yellow';
    log(`   ${icon} ${check.name}: ${check.status}${check.value ? ` (${check.value})` : ''}${check.error ? ` - ${check.error}` : ''}`, color);
  });

  log('\n');
  
  if (failed === 0) {
    log('✅ DNS verification passed!', 'green');
    process.exit(0);
  } else {
    log('❌ DNS verification failed - please fix issues', 'red');
    process.exit(1);
  }
}

main();

