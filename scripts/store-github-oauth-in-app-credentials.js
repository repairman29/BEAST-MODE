#!/usr/bin/env node
/**
 * Store GitHub OAuth credentials in github_app_credentials table
 * Extracts from secrets table and stores in proper format
 */

const path = require('path');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Load .env.local
try {
  const envPath = path.join(__dirname, '../website/.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    });
  }
} catch (e) {}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function storeGitHubOAuth() {
  console.log('🔍 Fetching GitHub OAuth secrets from secrets table...\n');
  
  // Get GitHub secrets
  const { data: secrets, error: secretsError } = await supabase
    .from('secrets')
    .select('key, value')
    .in('key', ['github_clientId', 'github_clientSecret', 'github_webhookSecret'])
    .order('key');

  if (secretsError) {
    console.error('❌ Error fetching secrets:', secretsError.message);
    return;
  }

  const clientId = secrets.find(s => s.key === 'github_clientId')?.value;
  const clientSecret = secrets.find(s => s.key === 'github_clientSecret')?.value;
  const webhookSecret = secrets.find(s => s.key === 'github_webhookSecret')?.value;

  if (!clientId || !clientSecret) {
    console.log('⚠️  GitHub OAuth credentials not found in secrets table');
    return;
  }

  console.log('📦 Storing in github_app_credentials table...\n');

  // Determine if this is production or dev based on client ID
  const isProduction = clientId === 'Ov23liDKFkIrnPneWwny';
  const appName = isProduction ? 'BEAST MODE Production' : 'BEAST MODE Development';
  const callbackUrl = isProduction 
    ? 'https://beast-mode.dev/api/github/oauth/callback'
    : 'http://localhost:7777/api/github/oauth/callback';

  // Store in github_app_credentials table
  const { data, error } = await supabase
    .from('github_app_credentials')
    .upsert({
      client_id: clientId,
      client_secret: clientSecret,
      webhook_secret: webhookSecret || null,
      app_name: appName,
      callback_url: callbackUrl,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'client_id'
    });

  if (error) {
    console.error('❌ Error storing credentials:', error.message);
    return;
  }

  console.log('✅ GitHub OAuth credentials stored in github_app_credentials table!');
  console.log(`   App: ${appName}`);
  console.log(`   Client ID: ${clientId}`);
  console.log(`   Callback URL: ${callbackUrl}\n`);
}

storeGitHubOAuth().catch(console.error);
