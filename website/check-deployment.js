#!/usr/bin/env node

/**
 * Check BEAST MODE Deployment Status
 */

const https = require('https');

function checkUrl(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      resolve({
        url,
        status: res.statusCode,
        headers: res.headers
      });
    }).on('error', (err) => {
      resolve({
        url,
        status: 'ERROR',
        error: err.message
      });
    });
  });
}

async function main() {
  console.log('🔍 Checking BEAST MODE Deployment Status...\n');

  const urls = [
    'https://beast-mode.dev',
    'https://beast-mode-landing-7kg9opher-jeff-adkins-projects.vercel.app'
  ];

  for (const url of urls) {
    const result = await checkUrl(url);
    console.log(`${result.url}:`);
    if (result.status === 200) {
      console.log(`  ✅ ${result.status} - Working!`);
    } else if (result.status === 404) {
      console.log(`  ❌ ${result.status} - Domain not configured or DNS not propagated`);
    } else if (result.status === 401) {
      console.log(`  ❌ ${result.status} - Deployment protection enabled`);
    } else {
      console.log(`  ❌ ${result.status} - ${result.error || 'Unknown error'}`);
    }
    console.log('');
  }

  console.log('📋 Next Steps:');
  console.log('1. Disable deployment protection in Vercel dashboard');
  console.log('2. Wait for DNS propagation (beast-mode.dev may take 5-30 minutes)');
  console.log('3. Test both URLs again');
}

main();
