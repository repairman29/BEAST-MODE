#!/usr/bin/env node

/**
 * Setup Vercel Environment Variables from Supabase
 * Fetches credentials from user_api_keys table and sets them in Vercel
 */

const { createClient } = require('@supabase/supabase-js');
const { execSync } = require('child_process');
const readline = require('readline');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ENCRYPTION_KEY = process.env.API_KEYS_ENCRYPTION_KEY || 'default_key_change_in_production';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials!');
  console.error('   Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Decrypt key from user_api_keys table (AES-256-GCM)
function decryptKey(encryptedKey, encryptionKey = ENCRYPTION_KEY) {
  if (!encryptionKey || !encryptedKey) return encryptedKey;
  
  try {
    const crypto = require('crypto');
    
    // Format: iv:authTag:encryptedData
    const parts = encryptedKey.split(':');
    if (parts.length !== 3) {
      // Not in expected format, might be plaintext
      return encryptedKey;
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = Buffer.from(parts[2], 'hex');
    
    // Derive key from encryption key
    const key = crypto.createHash('sha256').update(encryptionKey).digest();
    
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, null, 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    // If decryption fails, return as-is (might already be plaintext)
    console.log(`   ⚠️  Decryption failed, using as-is: ${error.message}`);
    return encryptedKey;
  }
}

async function getCredentialsFromSupabase() {
  console.log('🔍 Fetching credentials from Supabase...\n');

  const credentials = {};

  try {
    // Get GitHub OAuth credentials from user_api_keys
    const { data: githubKeys, error: githubError } = await supabase
      .from('user_api_keys')
      .select('*')
      .eq('provider', 'github')
      .eq('is_active', true)
      .limit(1)
      .single();

    if (!githubError && githubKeys && githubKeys.encrypted_key) {
      console.log('✅ Found GitHub credentials in user_api_keys');
      
      // Decrypt the key
      const decrypted = decryptKey(githubKeys.encrypted_key, encryptionKey);
      
      // Try to parse as JSON (might be JSON string with client_id/client_secret)
      try {
        const keyData = JSON.parse(decrypted);
        credentials.GITHUB_CLIENT_ID = keyData.client_id || keyData.GITHUB_CLIENT_ID;
        credentials.GITHUB_CLIENT_SECRET = keyData.client_secret || keyData.GITHUB_CLIENT_SECRET;
      } catch (e) {
        // Not JSON, might be just the client_id or client_secret
        // Check if it looks like a client ID or secret
        if (decrypted.length > 20) {
          credentials.GITHUB_CLIENT_SECRET = decrypted;
        } else {
          credentials.GITHUB_CLIENT_ID = decrypted;
        }
      }
    } else {
      console.log('⚠️  GitHub credentials not found in user_api_keys');
    }

    // Get Supabase credentials (they should be in env, but check app_config too)
    const { data: appConfig, error: configError } = await supabase
      .from('app_config')
      .select('*')
      .eq('key', 'github_oauth')
      .single();

    if (!configError && appConfig?.value) {
      const config = typeof appConfig.value === 'string' 
        ? JSON.parse(appConfig.value) 
        : appConfig.value;
      
      if (config.client_id && !credentials.GITHUB_CLIENT_ID) {
        credentials.GITHUB_CLIENT_ID = config.client_id;
      }
      if (config.client_secret && !credentials.GITHUB_CLIENT_SECRET) {
        credentials.GITHUB_CLIENT_SECRET = config.client_secret;
      }
      if (config.encryption_key) {
        credentials.GITHUB_TOKEN_ENCRYPTION_KEY = config.encryption_key;
      }
      if (config.redirect_uri) {
        credentials.GITHUB_REDIRECT_URI = config.redirect_uri;
      }
    }

    // Get Supabase URL and keys from environment or app_config
    if (SUPABASE_URL) {
      credentials.NEXT_PUBLIC_SUPABASE_URL = SUPABASE_URL;
      credentials.SUPABASE_URL = SUPABASE_URL;
    }
    
    if (SUPABASE_SERVICE_KEY) {
      credentials.SUPABASE_SERVICE_ROLE_KEY = SUPABASE_SERVICE_KEY;
    }

    // Try to get anon key from app_config or we'll need user to provide it
    const { data: supabaseConfig } = await supabase
      .from('app_config')
      .select('*')
      .eq('key', 'supabase')
      .single();

    if (supabaseConfig?.value) {
      const supabaseData = typeof supabaseConfig.value === 'string' 
        ? JSON.parse(supabaseConfig.value) 
        : supabaseConfig.value;
      
      if (supabaseData.anon_key) {
        credentials.NEXT_PUBLIC_SUPABASE_ANON_KEY = supabaseData.anon_key;
      }
    }

    // Set defaults
    if (!credentials.GITHUB_REDIRECT_URI) {
      credentials.GITHUB_REDIRECT_URI = 'https://beast-mode.dev/api/github/oauth/callback';
    }

    if (!credentials.NEXT_PUBLIC_URL) {
      credentials.NEXT_PUBLIC_URL = 'https://beast-mode.dev';
    }

    return credentials;
  } catch (error) {
    console.error('❌ Error fetching credentials:', error.message);
    throw error;
  }
}

async function setVercelEnvVar(key, value, environment = 'production') {
  try {
    console.log(`   Setting ${key}...`);
    
    // Use Vercel CLI with proper input handling
    // Vercel CLI reads from stdin, so we pipe the value
    const command = `echo "${value.replace(/"/g, '\\"')}" | vercel env add ${key} ${environment} --yes`;
    
    try {
      execSync(command, { 
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: '/bin/bash',
        encoding: 'utf8'
      });
      console.log(`   ✅ ${key} set successfully`);
      return true;
    } catch (error) {
      // If CLI fails, try using Vercel API directly
      console.log(`   ⚠️  CLI method failed, trying API...`);
      
      // Get Vercel token from environment or .vercel directory
      const vercelToken = process.env.VERCEL_TOKEN || process.env.VERCEL_AUTH_TOKEN;
      if (!vercelToken) {
        console.log(`   ⚠️  No VERCEL_TOKEN found, skipping API method`);
        console.log(`   💡 Set VERCEL_TOKEN or use: vercel env add ${key} ${environment}`);
        return false;
      }
      
      // Get project ID from .vercel directory or environment
      const fs = require('fs');
      const path = require('path');
      let projectId = process.env.VERCEL_PROJECT_ID;
      
      if (!projectId) {
        const vercelDir = path.join(process.cwd(), '.vercel', 'project.json');
        if (fs.existsSync(vercelDir)) {
          const projectData = JSON.parse(fs.readFileSync(vercelDir, 'utf8'));
          projectId = projectData.projectId;
        }
      }
      
      if (!projectId) {
        console.log(`   ⚠️  Could not find project ID`);
        return false;
      }
      
      // Use Vercel API
      const https = require('https');
      const querystring = require('querystring');
      
      const postData = querystring.stringify({
        key,
        value,
        type: 'encrypted',
        target: environment
      });
      
      const options = {
        hostname: 'api.vercel.com',
        path: `/v10/projects/${projectId}/env`,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${vercelToken}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': postData.length
        }
      };
      
      return new Promise((resolve) => {
        const req = https.request(options, (res) => {
          if (res.statusCode === 200 || res.statusCode === 201) {
            console.log(`   ✅ ${key} set via API`);
            resolve(true);
          } else {
            console.log(`   ⚠️  API returned ${res.statusCode}`);
            resolve(false);
          }
        });
        
        req.on('error', (error) => {
          console.log(`   ⚠️  API error: ${error.message}`);
          resolve(false);
        });
        
        req.write(postData);
        req.end();
      });
    }
  } catch (error) {
    console.error(`   ❌ Failed to set ${key}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('');
  console.log('🚀 Setting up Vercel Environment Variables from Supabase');
  console.log('========================================================\n');

  try {
    // Get credentials from Supabase
    const credentials = await getCredentialsFromSupabase();

    console.log('\n📋 Credentials Found:');
    console.log('===================');
    Object.keys(credentials).forEach(key => {
      if (credentials[key]) {
        const value = credentials[key];
        const displayValue = key.includes('SECRET') || key.includes('KEY') 
          ? `${value.substring(0, 10)}...${value.substring(value.length - 4)}` 
          : value;
        console.log(`   ${key}: ${displayValue}`);
      }
    });

    console.log('\n🔧 Setting Vercel Environment Variables...\n');

    // Check if Vercel CLI is installed
    try {
      execSync('vercel --version', { stdio: 'ignore' });
    } catch (error) {
      console.error('❌ Vercel CLI not found!');
      console.error('   Install: npm install -g vercel');
      process.exit(1);
    }

    // Set each credential
    const results = {};
    for (const [key, value] of Object.entries(credentials)) {
      if (value) {
        results[key] = await setVercelEnvVar(key, value);
      }
    }

    console.log('\n📊 Summary:');
    console.log('===========');
    const successCount = Object.values(results).filter(Boolean).length;
    const totalCount = Object.keys(results).length;
    console.log(`   ✅ Set: ${successCount}/${totalCount}`);
    
    if (successCount < totalCount) {
      console.log('\n⚠️  Some variables need to be set manually:');
      Object.entries(results).forEach(([key, success]) => {
        if (!success && credentials[key]) {
          console.log(`   • ${key} = ${credentials[key]}`);
        }
      });
    }

    console.log('\n✅ Done! Vercel will auto-redeploy with new env vars.\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { getCredentialsFromSupabase, setVercelEnvVar };

