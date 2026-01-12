#!/usr/bin/env node

/**
 * Update Vercel Environment Variables via API
 * Requires VERCEL_TOKEN environment variable
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const secretsFile = path.join(__dirname, '../.rotated-secrets.json');
const secrets = JSON.parse(fs.readFileSync(secretsFile, 'utf8'));

const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID || 'beast-mode-website';
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID;

if (!VERCEL_TOKEN) {
  console.error('❌ VERCEL_TOKEN not set');
  console.error('   Get token from: https://vercel.com/account/tokens');
  console.error('   Then run: export VERCEL_TOKEN=your_token');
  process.exit(1);
}

function httpsRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const req = https.request({
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Authorization': `Bearer ${VERCEL_TOKEN}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    req.on('error', reject);
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

async function updateEnvVar(key, value) {
  const baseUrl = VERCEL_TEAM_ID
    ? `https://api.vercel.com/v10/projects/${VERCEL_PROJECT_ID}?teamId=${VERCEL_TEAM_ID}`
    : `https://api.vercel.com/v10/projects/${VERCEL_PROJECT_ID}`;

  // First, get existing env vars
  const getUrl = VERCEL_TEAM_ID
    ? `https://api.vercel.com/v10/projects/${VERCEL_PROJECT_ID}/env?teamId=${VERCEL_TEAM_ID}`
    : `https://api.vercel.com/v10/projects/${VERCEL_PROJECT_ID}/env`;

  const getResponse = await httpsRequest(getUrl, { method: 'GET' });

  if (getResponse.status !== 200) {
    console.error(`❌ Failed to fetch env vars: ${getResponse.status}`);
    return false;
  }

  const existing = getResponse.data.envs?.find(e => e.key === key);

  if (existing) {
    // Update existing
    const updateUrl = VERCEL_TEAM_ID
      ? `https://api.vercel.com/v10/projects/${VERCEL_PROJECT_ID}/env/${existing.id}?teamId=${VERCEL_TEAM_ID}`
      : `https://api.vercel.com/v10/projects/${VERCEL_PROJECT_ID}/env/${existing.id}`;

    const updateResponse = await httpsRequest(updateUrl, {
      method: 'PATCH',
      body: {
        value,
        type: 'encrypted',
        target: ['production', 'preview', 'development'],
      },
    });

    if (updateResponse.status === 200) {
      console.log(`✅ Updated ${key}`);
      return true;
    } else {
      console.error(`❌ Failed to update ${key}: ${updateResponse.status}`);
      console.error(JSON.stringify(updateResponse.data, null, 2));
      return false;
    }
  } else {
    // Create new
    const createUrl = VERCEL_TEAM_ID
      ? `https://api.vercel.com/v10/projects/${VERCEL_PROJECT_ID}/env?teamId=${VERCEL_TEAM_ID}`
      : `https://api.vercel.com/v10/projects/${VERCEL_PROJECT_ID}/env`;

    const createResponse = await httpsRequest(createUrl, {
      method: 'POST',
      body: {
        key,
        value,
        type: 'encrypted',
        target: ['production', 'preview', 'development'],
      },
    });

    if (createResponse.status === 200 || createResponse.status === 201) {
      console.log(`✅ Created ${key}`);
      return true;
    } else {
      console.error(`❌ Failed to create ${key}: ${createResponse.status}`);
      console.error(JSON.stringify(createResponse.data, null, 2));
      return false;
    }
  }
}

async function main() {
  console.log('🚀 Updating Vercel Environment Variables via API\n');
  console.log('======================================================================\n');

  const secretsToUpdate = [
    { key: 'STRIPE_WEBHOOK_SECRET', value: secrets.STRIPE_WEBHOOK_SECRET },
    { key: 'SUPABASE_SERVICE_ROLE_KEY', value: secrets.SUPABASE_SERVICE_ROLE_KEY },
    { key: 'GITHUB_CLIENT_SECRET', value: secrets.GITHUB_CLIENT_SECRET },
    { key: 'GITHUB_CLIENT_ID', value: secrets.GITHUB_CLIENT_ID },
    { key: 'GITHUB_TOKEN_ENCRYPTION_KEY', value: secrets.GITHUB_TOKEN_ENCRYPTION_KEY },
  ];

  let successCount = 0;
  for (const secret of secretsToUpdate) {
    if (secret.value) {
      const success = await updateEnvVar(secret.key, secret.value);
      if (success) successCount++;
    }
  }

  console.log('\n======================================================================\n');
  console.log(`✅ Updated ${successCount}/${secretsToUpdate.length} environment variables\n`);
  
  if (successCount === secretsToUpdate.length) {
    console.log('🎉 All secrets updated successfully!');
    console.log('📝 Next: Redeploy with: cd website && vercel --prod --yes\n');
  } else {
    console.log('⚠️  Some updates failed. Check errors above.\n');
  }
}

main().catch(err => {
  console.error('❌ Fatal error:', err.message);
  process.exit(1);
});
