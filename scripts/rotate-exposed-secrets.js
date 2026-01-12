#!/usr/bin/env node

/**
 * Rotate Exposed Secrets via CLI/APIs
 * 
 * This script rotates all secrets that were exposed in git history:
 * 1. Stripe Webhook Secret
 * 2. Supabase Service Role Key
 * 3. GitHub OAuth Client Secret
 * 4. GitHub Token Encryption Key
 * 
 * Usage:
 *   node scripts/rotate-exposed-secrets.js
 * 
 * Environment Variables Required:
 *   - STRIPE_SECRET_KEY (for Stripe operations)
 *   - SUPABASE_ACCESS_TOKEN (for Supabase Management API)
 *   - GITHUB_TOKEN (for GitHub API)
 *   - VERCEL_TOKEN (for updating Vercel env vars)
 */

const https = require('https');
const { execSync } = require('child_process');
const crypto = require('crypto');

// Colors for output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function error(message) {
  log(`❌ ${message}`, 'red');
}

function success(message) {
  log(`✅ ${message}`, 'green');
}

function info(message) {
  log(`ℹ️  ${message}`, 'cyan');
}

function warn(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// Helper: Make HTTPS request
function httpsRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
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

// 1. Rotate Stripe Webhook Secret
async function rotateStripeWebhookSecret() {
  info('Rotating Stripe Webhook Secret...');
  
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    error('STRIPE_SECRET_KEY not set. Skipping Stripe rotation.');
    return null;
  }

  try {
    // Get existing webhooks
    const webhooksResponse = await httpsRequest('https://api.stripe.com/v1/webhook_endpoints', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (webhooksResponse.status !== 200) {
      error(`Failed to fetch webhooks: ${webhooksResponse.status}`);
      return null;
    }

    const webhooks = webhooksResponse.data.data || [];
    const beastModeWebhook = webhooks.find(w => 
      w.url && w.url.includes('beast-mode.dev') && w.url.includes('webhook')
    );

    if (!beastModeWebhook) {
      warn('No Beast Mode webhook found. You may need to create one manually.');
      return null;
    }

    info(`Found webhook: ${beastModeWebhook.id} (${beastModeWebhook.url})`);

    // Create new webhook endpoint (Stripe doesn't allow regenerating secrets directly)
    // We'll create a new endpoint and delete the old one
    const newWebhookResponse = await httpsRequest('https://api.stripe.com/v1/webhook_endpoints', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: {
        url: beastModeWebhook.url,
        enabled_events: beastModeWebhook.enabled_events || ['*'],
      },
    });

    if (newWebhookResponse.status !== 200) {
      error(`Failed to create new webhook: ${newWebhookResponse.status}`);
      return null;
    }

    const newSecret = newWebhookResponse.data.secret;
    success(`New Stripe Webhook Secret: ${newSecret}`);

    // Delete old webhook
    await httpsRequest(`https://api.stripe.com/v1/webhook_endpoints/${beastModeWebhook.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
      },
    });

    return {
      key: 'STRIPE_WEBHOOK_SECRET',
      value: newSecret,
      service: 'Stripe',
    };
  } catch (err) {
    error(`Stripe rotation failed: ${err.message}`);
    return null;
  }
}

// 2. Rotate Supabase Service Role Key
async function rotateSupabaseServiceRoleKey() {
  info('Rotating Supabase Service Role Key...');
  
  const supabaseAccessToken = process.env.SUPABASE_ACCESS_TOKEN;
  const supabaseProjectRef = process.env.SUPABASE_PROJECT_REF || 'rbfzlqmkwhbvrrfdcain';
  
  if (!supabaseAccessToken) {
    error('SUPABASE_ACCESS_TOKEN not set. Skipping Supabase rotation.');
    warn('Get token from: https://supabase.com/dashboard/account/tokens');
    return null;
  }

  try {
    // Supabase Management API: Regenerate service role key
    const response = await httpsRequest(
      `https://api.supabase.com/v1/projects/${supabaseProjectRef}/api-keys`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${supabaseAccessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.status !== 200) {
      error(`Failed to fetch API keys: ${response.status}`);
      warn('You may need to regenerate manually in Supabase Dashboard');
      return null;
    }

    // Find service_role key
    const serviceRoleKey = response.data.find(k => k.name === 'service_role');
    if (!serviceRoleKey) {
      error('Service role key not found');
      return null;
    }

    // Regenerate the key
    const regenerateResponse = await httpsRequest(
      `https://api.supabase.com/v1/projects/${supabaseProjectRef}/api-keys/${serviceRoleKey.id}/regenerate`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseAccessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (regenerateResponse.status !== 200) {
      error(`Failed to regenerate key: ${regenerateResponse.status}`);
      warn('You may need to regenerate manually in Supabase Dashboard');
      return null;
    }

    const newKey = regenerateResponse.data.api_key;
    success(`New Supabase Service Role Key: ${newKey.substring(0, 20)}...`);

    return {
      key: 'SUPABASE_SERVICE_ROLE_KEY',
      value: newKey,
      service: 'Supabase',
    };
  } catch (err) {
    error(`Supabase rotation failed: ${err.message}`);
    return null;
  }
}

// 3. Rotate GitHub OAuth Client Secret
async function rotateGitHubOAuthSecret() {
  info('Rotating GitHub OAuth Client Secret...');
  
  const githubToken = process.env.GITHUB_TOKEN;
  const githubAppId = process.env.GITHUB_APP_ID || 'Ov23lidLvmp68FVMEqEB';
  
  if (!githubToken) {
    error('GITHUB_TOKEN not set. Skipping GitHub rotation.');
    warn('Create token at: https://github.com/settings/tokens (repo scope)');
    return null;
  }

  try {
    // GitHub API: Regenerate OAuth app secret
    const response = await httpsRequest(
      `https://api.github.com/applications/${githubAppId}/token`,
      {
        method: 'POST',
        headers: {
          'Authorization': `token ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: {
          // GitHub requires client_id and client_secret to regenerate
          // This is a limitation - we need the old secret to regenerate
        },
      }
    );

    // GitHub doesn't allow regenerating OAuth secrets via API without the old secret
    // We'll need to do this manually or use a different approach
    warn('GitHub OAuth secret cannot be rotated via API without old secret.');
    warn('Please regenerate manually at: https://github.com/settings/developers');
    
    return null;
  } catch (err) {
    error(`GitHub rotation failed: ${err.message}`);
    return null;
  }
}

// 4. Generate New GitHub Token Encryption Key
function generateGitHubTokenEncryptionKey() {
  info('Generating new GitHub Token Encryption Key...');
  
  // Generate 64-character hex key (32 bytes = 64 hex chars)
  const newKey = crypto.randomBytes(32).toString('hex');
  success(`New GitHub Token Encryption Key: ${newKey}`);

  warn('⚠️  WARNING: Existing encrypted tokens will be invalid!');
  warn('Users will need to re-authenticate with GitHub.');

  return {
    key: 'GITHUB_TOKEN_ENCRYPTION_KEY',
    value: newKey,
    service: 'GitHub (Encryption)',
  };
}

// 5. Update Vercel Environment Variables
async function updateVercelEnvVars(rotatedSecrets) {
  info('Updating Vercel Environment Variables...');
  
  const vercelToken = process.env.VERCEL_TOKEN;
  const vercelProjectId = process.env.VERCEL_PROJECT_ID || 'beast-mode-website';
  const vercelTeamId = process.env.VERCEL_TEAM_ID;

  if (!vercelToken) {
    error('VERCEL_TOKEN not set. Skipping Vercel update.');
    warn('Get token from: https://vercel.com/account/tokens');
    warn('Or use: vercel env add <key> <value> --yes');
    return false;
  }

  try {
    for (const secret of rotatedSecrets) {
      if (!secret) continue;

      info(`Updating ${secret.key} in Vercel...`);

      // Vercel API: Update environment variable
      const url = vercelTeamId
        ? `https://api.vercel.com/v10/projects/${vercelProjectId}/env?teamId=${vercelTeamId}`
        : `https://api.vercel.com/v10/projects/${vercelProjectId}/env`;

      // First, get existing env vars
      const getResponse = await httpsRequest(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${vercelToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (getResponse.status !== 200) {
        error(`Failed to fetch Vercel env vars: ${getResponse.status}`);
        continue;
      }

      // Find existing env var
      const existing = getResponse.data.envs?.find(e => e.key === secret.key);
      
      if (existing) {
        // Update existing
        const updateUrl = vercelTeamId
          ? `https://api.vercel.com/v10/projects/${vercelProjectId}/env/${existing.id}?teamId=${vercelTeamId}`
          : `https://api.vercel.com/v10/projects/${vercelProjectId}/env/${existing.id}`;

        const updateResponse = await httpsRequest(updateUrl, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${vercelToken}`,
            'Content-Type': 'application/json',
          },
          body: {
            value: secret.value,
            type: 'encrypted', // Keep as encrypted
            target: ['production', 'preview', 'development'],
          },
        });

        if (updateResponse.status === 200) {
          success(`Updated ${secret.key} in Vercel`);
        } else {
          error(`Failed to update ${secret.key}: ${updateResponse.status}`);
        }
      } else {
        // Create new
        const createResponse = await httpsRequest(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${vercelToken}`,
            'Content-Type': 'application/json',
          },
          body: {
            key: secret.key,
            value: secret.value,
            type: 'encrypted',
            target: ['production', 'preview', 'development'],
          },
        });

        if (createResponse.status === 200 || createResponse.status === 201) {
          success(`Created ${secret.key} in Vercel`);
        } else {
          error(`Failed to create ${secret.key}: ${createResponse.status}`);
        }
      }
    }

    return true;
  } catch (err) {
    error(`Vercel update failed: ${err.message}`);
    return false;
  }
}

// Main execution
async function main() {
  log('\n🔒 Secret Rotation Script\n', 'cyan');
  log('This script will rotate all exposed secrets via CLI/APIs.\n', 'yellow');

  const rotatedSecrets = [];

  // 1. Rotate Stripe Webhook Secret
  const stripeSecret = await rotateStripeWebhookSecret();
  if (stripeSecret) rotatedSecrets.push(stripeSecret);

  // 2. Rotate Supabase Service Role Key
  const supabaseSecret = await rotateSupabaseServiceRoleKey();
  if (supabaseSecret) rotatedSecrets.push(supabaseSecret);

  // 3. Rotate GitHub OAuth Secret (manual - API limitation)
  await rotateGitHubOAuthSecret();
  // Note: GitHub requires manual rotation

  // 4. Generate new encryption key
  const encryptionKey = generateGitHubTokenEncryptionKey();
  rotatedSecrets.push(encryptionKey);

  // 5. Update Vercel
  if (rotatedSecrets.length > 0) {
    await updateVercelEnvVars(rotatedSecrets);
  }

  // Summary
  log('\n📋 Rotation Summary\n', 'cyan');
  if (rotatedSecrets.length > 0) {
    rotatedSecrets.forEach(secret => {
      if (secret) {
        success(`${secret.service}: ${secret.key} rotated`);
      }
    });
  }

  log('\n⚠️  Manual Actions Required:\n', 'yellow');
  log('1. GitHub OAuth Client Secret:', 'yellow');
  log('   → https://github.com/settings/developers', 'yellow');
  log('   → Regenerate client secret manually', 'yellow');
  log('   → Update GITHUB_CLIENT_SECRET in Vercel\n', 'yellow');

  log('2. Verify all services are working:', 'yellow');
  log('   → Test GitHub OAuth flow', 'yellow');
  log('   → Test Stripe webhooks', 'yellow');
  log('   → Test Supabase connections\n', 'yellow');

  log('3. Redeploy application:', 'yellow');
  log('   → cd website && vercel --prod --yes\n', 'yellow');
}

// Run if executed directly
if (require.main === module) {
  main().catch(err => {
    error(`Fatal error: ${err.message}`);
    process.exit(1);
  });
}

module.exports = { main };
