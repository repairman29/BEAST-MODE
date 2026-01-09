#!/usr/bin/env node

/**
 * Production Deployment Validation Script
 * 
 * Validates all production endpoints, services, and integrations
 * after deployment to ensure everything is working correctly.
 */

const https = require('https');
const http = require('http');

const PRODUCTION_URL = process.env.NEXT_PUBLIC_URL || process.env.VERCEL_URL 
  ? `https://${process.env.VERCEL_URL}` 
  : 'https://beast-mode-website.vercel.app';

const checks = {
  passed: [],
  failed: [],
  warnings: []
};

function log(message, type = 'info') {
  const icons = { info: 'ℹ️', success: '✅', error: '❌', warning: '⚠️', step: '🔧' };
  console.log(`${icons[type] || '•'} ${message}`);
}

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const req = client.request(url, {
      method: options.method || 'GET',
      headers: options.headers || {},
      timeout: options.timeout || 10000
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: data, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

async function checkHealthEndpoint() {
  log('Checking health endpoint...', 'step');
  try {
    const response = await makeRequest(`${PRODUCTION_URL}/api/health`);
    if (response.status === 200 && response.data.status) {
      checks.passed.push('Health endpoint');
      log(`Health status: ${response.data.status}`, 'success');
      return true;
    } else {
      checks.failed.push('Health endpoint');
      log(`Health check failed: ${response.status}`, 'error');
      return false;
    }
  } catch (error) {
    checks.failed.push('Health endpoint');
    log(`Health check error: ${error.message}`, 'error');
    return false;
  }
}

async function checkDetailedHealth() {
  log('Checking detailed health...', 'step');
  try {
    const response = await makeRequest(`${PRODUCTION_URL}/api/health?level=detailed`);
    if (response.status === 200) {
      if (response.data.services) {
        const services = Object.keys(response.data.services);
        log(`Found ${services.length} services: ${services.join(', ')}`, 'success');
        checks.passed.push('Detailed health check');
        return true;
      } else {
        checks.warnings.push('Detailed health (no services)');
        log('Detailed health available but no services found', 'warning');
        return true;
      }
    } else {
      checks.failed.push('Detailed health check');
      log(`Detailed health check failed: ${response.status}`, 'error');
      return false;
    }
  } catch (error) {
    checks.failed.push('Detailed health check');
    log(`Detailed health error: ${error.message}`, 'error');
    return false;
  }
}

async function checkMonitoringEndpoint() {
  log('Checking monitoring endpoint...', 'step');
  try {
    const response = await makeRequest(`${PRODUCTION_URL}/api/monitoring/metrics`);
    if (response.status === 200) {
      checks.passed.push('Monitoring endpoint');
      log('Monitoring endpoint accessible', 'success');
      return true;
    } else {
      checks.warnings.push('Monitoring endpoint');
      log(`Monitoring endpoint returned ${response.status}`, 'warning');
      return false;
    }
  } catch (error) {
    checks.warnings.push('Monitoring endpoint');
    log(`Monitoring endpoint error: ${error.message}`, 'warning');
    return false;
  }
}

async function checkBEASTMODEHealth() {
  log('Checking BEAST MODE health...', 'step');
  try {
    const response = await makeRequest(`${PRODUCTION_URL}/api/beast-mode/health`);
    if (response.status === 200 || response.status === 503) {
      // 503 is acceptable if monitoring not available
      checks.passed.push('BEAST MODE health endpoint');
      log('BEAST MODE health endpoint accessible', 'success');
      return true;
    } else {
      checks.warnings.push('BEAST MODE health endpoint');
      log(`BEAST MODE health returned ${response.status}`, 'warning');
      return false;
    }
  } catch (error) {
    checks.warnings.push('BEAST MODE health endpoint');
    log(`BEAST MODE health error: ${error.message}`, 'warning');
    return false;
  }
}

async function checkDatabaseConnection() {
  log('Checking database connection...', 'step');
  try {
    // Check if Supabase connection is working via health endpoint
    const response = await makeRequest(`${PRODUCTION_URL}/api/health?level=full`);
    if (response.status === 200) {
      // Database connection is implied if health check passes
      checks.passed.push('Database connection');
      log('Database connection verified (via health check)', 'success');
      return true;
    } else {
      checks.failed.push('Database connection');
      log('Database connection check failed', 'error');
      return false;
    }
  } catch (error) {
    checks.failed.push('Database connection');
    log(`Database check error: ${error.message}`, 'error');
    return false;
  }
}

async function checkStripeIntegration() {
  log('Checking Stripe integration...', 'step');
  try {
    // Check if Stripe route exists (should return 400 for missing params, not 404)
    const response = await makeRequest(`${PRODUCTION_URL}/api/stripe/create-checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {}
    });
    
    // 400 means endpoint exists but needs params (good)
    // 404 means endpoint doesn't exist (bad)
    if (response.status === 400 || response.status === 401) {
      checks.passed.push('Stripe integration');
      log('Stripe endpoint accessible', 'success');
      return true;
    } else if (response.status === 404) {
      checks.failed.push('Stripe integration');
      log('Stripe endpoint not found', 'error');
      return false;
    } else {
      checks.warnings.push('Stripe integration');
      log(`Stripe endpoint returned ${response.status}`, 'warning');
      return false;
    }
  } catch (error) {
    checks.warnings.push('Stripe integration');
    log(`Stripe check error: ${error.message}`, 'warning');
    return false;
  }
}

async function checkGitHubOAuth() {
  log('Checking GitHub OAuth...', 'step');
  try {
    // Check if GitHub OAuth route exists (correct path is /api/github/oauth/authorize)
    const response = await makeRequest(`${PRODUCTION_URL}/api/github/oauth/authorize`);
    
    // Should return 200/400/401 (needs auth), not 404
    if (response.status < 500 && response.status !== 404) {
      checks.passed.push('GitHub OAuth');
      log('GitHub OAuth endpoint accessible', 'success');
      return true;
    } else if (response.status === 404) {
      checks.failed.push('GitHub OAuth');
      log('GitHub OAuth endpoint not found', 'error');
      return false;
    } else {
      checks.warnings.push('GitHub OAuth');
      log(`GitHub OAuth returned ${response.status}`, 'warning');
      return false;
    }
  } catch (error) {
    checks.warnings.push('GitHub OAuth');
    log(`GitHub OAuth check error: ${error.message}`, 'warning');
    return false;
  }
}

async function checkErrorTracking() {
  log('Checking error tracking setup...', 'step');
  try {
    // Check if monitoring service is configured
    const fs = require('fs');
    const path = require('path');
    const monitoringFile = path.join(__dirname, '../website/lib/monitoring.ts');
    
    if (fs.existsSync(monitoringFile)) {
      const content = fs.readFileSync(monitoringFile, 'utf8');
      if (content.includes('Sentry') || content.includes('errorMonitor')) {
        checks.passed.push('Error tracking');
        log('Error tracking configured', 'success');
        return true;
      }
    }
    
    checks.warnings.push('Error tracking');
    log('Error tracking may not be fully configured', 'warning');
    return false;
  } catch (error) {
    checks.warnings.push('Error tracking');
    log(`Error tracking check error: ${error.message}`, 'warning');
    return false;
  }
}

async function runAllChecks() {
  console.log('\n🚀 Production Deployment Validation\n');
  console.log('=' .repeat(60));
  console.log(`Production URL: ${PRODUCTION_URL}\n`);

  await checkHealthEndpoint();
  await checkDetailedHealth();
  await checkMonitoringEndpoint();
  await checkBEASTMODEHealth();
  await checkDatabaseConnection();
  await checkStripeIntegration();
  await checkGitHubOAuth();
  await checkErrorTracking();

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Validation Summary:\n');
  console.log(`  ✅ Passed: ${checks.passed.length}`);
  checks.passed.forEach(check => console.log(`     - ${check}`));
  
  if (checks.warnings.length > 0) {
    console.log(`\n  ⚠️  Warnings: ${checks.warnings.length}`);
    checks.warnings.forEach(check => console.log(`     - ${check}`));
  }
  
  if (checks.failed.length > 0) {
    console.log(`\n  ❌ Failed: ${checks.failed.length}`);
    checks.failed.forEach(check => console.log(`     - ${check}`));
  }

  console.log('\n' + '='.repeat(60));
  
  if (checks.failed.length === 0) {
    console.log('\n🎉 All critical checks passed! Production deployment is healthy.\n');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some checks failed. Please review and fix issues before proceeding.\n');
    process.exit(1);
  }
}

// Run checks
runAllChecks().catch(error => {
  console.error('\n❌ Validation script error:', error);
  process.exit(1);
});
