#!/usr/bin/env node

/**
 * Fix Production API Routes
 * 
 * Checks and reports on production API route issues
 */

const https = require('https');

const PROD_URL = 'https://beast-mode.dev';
const routes = [
  { path: '/api/health', name: 'Health Check', expected: 200 },
  { path: '/api/user/usage', name: 'Usage API', expected: [200, 401] },
  { path: '/api/user/subscription', name: 'Subscription API', expected: [200, 401] },
  { path: '/api/credits/balance', name: 'Credit Balance API', expected: [200, 401] },
  { path: '/api/credits/history', name: 'Credit History API', expected: [200, 401] },
  { path: '/api/credits/purchase', name: 'Credit Purchase API', expected: [200, 401, 405] },
  { path: '/api/stripe/webhook', name: 'Stripe Webhook', expected: [200, 400, 405] },
  { path: '/api/github/webhook', name: 'GitHub Webhook', expected: [200, 400, 405] }
];

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, {
      method: 'GET',
      timeout: 10000
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, body: data.substring(0, 100) });
      });
    });
    
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
    
    req.end();
  });
}

async function checkRoutes() {
  console.log('\n🔍 Checking Production API Routes\n');
  console.log('='.repeat(70));
  console.log();
  
  const results = [];
  
  for (const route of routes) {
    try {
      const response = await makeRequest(`${PROD_URL}${route.path}`);
      const expected = Array.isArray(route.expected) ? route.expected : [route.expected];
      const isOk = expected.includes(response.status);
      
      results.push({
        name: route.name,
        path: route.path,
        status: response.status,
        ok: isOk
      });
      
      const icon = isOk ? '✅' : '❌';
      console.log(`${icon} ${route.name}: ${response.status} ${isOk ? '(OK)' : '(UNEXPECTED)'}`);
      
      if (!isOk && response.status === 404) {
        console.log(`   ⚠️  Route not found - may need deployment`);
      }
    } catch (error) {
      results.push({
        name: route.name,
        path: route.path,
        status: 'ERROR',
        ok: false
      });
      console.log(`❌ ${route.name}: ${error.message}`);
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('\n📊 Results:\n');
  
  const passed = results.filter(r => r.ok).length;
  const total = results.length;
  const percentage = Math.round(passed / total * 100);
  
  console.log(`   ✅ Working: ${passed}/${total} (${percentage}%)`);
  console.log(`   ❌ Issues: ${total - passed}/${total}`);
  
  const issues = results.filter(r => !r.ok);
  if (issues.length > 0) {
    console.log('\n⚠️  Routes with Issues:\n');
    issues.forEach(issue => {
      console.log(`   • ${issue.name} (${issue.path}): ${issue.status}`);
    });
    
    console.log('\n💡 Fix Actions:\n');
    console.log('   1. Verify routes exist in website/app/api/');
    console.log('   2. Check Next.js build output');
    console.log('   3. Redeploy to Vercel: vercel --prod --yes');
    console.log('   4. Verify environment variables in Vercel\n');
  } else {
    console.log('\n✅ All routes are working!\n');
  }
  
  return results;
}

if (require.main === module) {
  checkRoutes()
    .then(() => {
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Check failed:', error);
      process.exit(1);
    });
}

module.exports = { checkRoutes };
