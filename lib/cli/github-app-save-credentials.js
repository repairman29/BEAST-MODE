#!/usr/bin/env node

/**
 * Save GitHub App Credentials
 * 
 * Saves GitHub App credentials to .env.local and optionally Supabase
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { createLogger } = require('../utils/logger');

const log = createLogger('GitHubAppSave');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

/**
 * Find PEM file in Downloads
 */
function findPemFile() {
  const downloadsPath = path.join(require('os').homedir(), 'Downloads');
  const files = fs.readdirSync(downloadsPath).filter(f => f.endsWith('.pem'));
  
  if (files.length === 0) {
    return null;
  }
  
  // Get most recent PEM file
  const filesWithStats = files.map(f => {
    const filePath = path.join(downloadsPath, f);
    return {
      name: f,
      path: filePath,
      mtime: fs.statSync(filePath).mtime
    };
  }).sort((a, b) => b.mtime - a.mtime);
  
  return filesWithStats[0].path;
}

/**
 * Save to .env.local
 */
async function saveToEnvLocal(credentials) {
  const envPath = path.join(process.cwd(), 'website', '.env.local');
  const envDir = path.dirname(envPath);

  // Ensure directory exists
  if (!fs.existsSync(envDir)) {
    fs.mkdirSync(envDir, { recursive: true });
  }

  // Read existing .env.local
  let envContent = '';
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }

  // Update or add GitHub App variables
  const lines = envContent.split('\n');
  const newLines = [];
  let foundGitHubApp = false;

  for (const line of lines) {
    if (line.startsWith('GITHUB_APP_ID=') ||
        line.startsWith('GITHUB_APP_CLIENT_ID=') ||
        line.startsWith('GITHUB_APP_CLIENT_SECRET=') ||
        line.startsWith('GITHUB_APP_WEBHOOK_SECRET=') ||
        line.startsWith('GITHUB_APP_PRIVATE_KEY=')) {
      if (!foundGitHubApp) {
        newLines.push('# GitHub App Configuration');
        foundGitHubApp = true;
      }
      continue; // Skip old values
    }
    newLines.push(line);
  }

  if (!foundGitHubApp) {
    newLines.push('');
    newLines.push('# GitHub App Configuration');
  }

  newLines.push(`GITHUB_APP_ID=${credentials.appId}`);
  newLines.push(`GITHUB_APP_CLIENT_ID=${credentials.clientId}`);
  
  if (credentials.clientSecret) {
    newLines.push(`GITHUB_APP_CLIENT_SECRET=${credentials.clientSecret}`);
  }
  
  if (credentials.webhookSecret) {
    newLines.push(`GITHUB_APP_WEBHOOK_SECRET=${credentials.webhookSecret}`);
  }
  
  if (credentials.privateKey) {
    // Escape newlines for .env file
    const escapedKey = credentials.privateKey.replace(/\n/g, '\\n');
    newLines.push(`GITHUB_APP_PRIVATE_KEY="${escapedKey}"`);
  } else {
    newLines.push(`# GITHUB_APP_PRIVATE_KEY=-----BEGIN RSA PRIVATE KEY-----`);
    newLines.push(`# Add your private key here (download from GitHub App settings)`);
  }

  fs.writeFileSync(envPath, newLines.join('\n') + '\n');

  console.log('\n✅ Credentials saved to:', envPath);
  return envPath;
}

/**
 * Encrypt value using same method as GitHub tokens
 */
async function encryptValue(text) {
  try {
    // Try to use the website encryption utility
    const path = require('path');
    const encryptionPath = path.join(process.cwd(), 'website', 'lib', 'github-token-encrypt.ts');
    
    // For CLI, we'll use a simple encryption or store encrypted in app layer
    // In production, this should use the same encryption as github-token-encrypt.ts
    const crypto = require('crypto');
    const key = process.env.GITHUB_TOKEN_ENCRYPTION_KEY || 
                '20abb6f3b973e2fdeea6e2c417ce93824e7b64962f9fee4bfd6339264c8e792c';
    const keyBuffer = Buffer.from(key.slice(0, 64), 'hex');
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', keyBuffer, iv);
    let encrypted = cipher.update(text, 'utf8');
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  } catch (error) {
    console.log('   ⚠️  Encryption failed, storing plain (not recommended for production)');
    return text; // Fallback to plain text
  }
}

/**
 * Save to Supabase (if configured)
 */
async function saveToSupabase(credentials) {
  try {
    // Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.log('\n⚠️  Supabase not configured - skipping database storage');
      console.log('   Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to enable');
      console.log('   Migration available: supabase/migrations/20250110000000_create_github_app_credentials_table.sql');
      return false;
    }

    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Prepare data with encryption
    const dataToStore = {
      app_id: parseInt(credentials.appId),
      client_id: credentials.clientId,
      app_name: 'BEAST MODE',
      webhook_url: 'https://beastmode.dev/api/github/webhook',
      callback_url: 'https://beastmode.dev/api/github/app/callback',
      updated_at: new Date().toISOString()
    };

    // Encrypt sensitive fields
    if (credentials.clientSecret) {
      dataToStore.client_secret = await encryptValue(credentials.clientSecret);
    }
    if (credentials.webhookSecret) {
      dataToStore.webhook_secret = await encryptValue(credentials.webhookSecret);
    }
    if (credentials.privateKey) {
      dataToStore.private_key = await encryptValue(credentials.privateKey);
    }

    // Try to upsert
    const { data, error } = await supabase
      .from('github_app_credentials')
      .upsert(dataToStore, {
        onConflict: 'app_id'
      })
      .select();

    if (error) {
      // Check if table doesn't exist
      if (error.code === '42P01' || error.message.includes('does not exist')) {
        console.log('\n⚠️  github_app_credentials table does not exist');
        console.log('   Run migration: supabase db push');
        console.log('   Or apply: supabase/migrations/20250110000000_create_github_app_credentials_table.sql');
        return false;
      }
      
      console.log('\n⚠️  Failed to save to Supabase:', error.message);
      if (error.code) {
        console.log('   Error code:', error.code);
      }
      return false;
    }

    console.log('\n✅ Credentials saved to Supabase (encrypted)');
    return true;
  } catch (error) {
    if (error.message && error.message.includes('Cannot find module')) {
      console.log('\n⚠️  Supabase client not available in CLI context');
      console.log('   Credentials saved to .env.local only');
      console.log('   To store in Supabase, run migration and set env vars');
    } else {
      console.log('\n⚠️  Supabase save failed:', error.message);
    }
    return false;
  }
}

/**
 * Main save function
 */
async function saveCredentials(providedCredentials = null) {
  console.log('\n💾 Save GitHub App Credentials\n');

  let credentials = providedCredentials;

  if (!credentials) {
    console.log('Enter your GitHub App credentials:\n');

    // Try to find PEM file automatically
    const pemFile = findPemFile();
    if (pemFile) {
      console.log(`📁 Found PEM file: ${pemFile}`);
      const usePem = await question(`Use this file? (y/n): `);
      if (usePem.toLowerCase() === 'y') {
        credentials = credentials || {};
        credentials.privateKeyPath = pemFile;
      }
    }

    credentials = credentials || {};
    
    if (!credentials.appId) {
      credentials.appId = await question('GitHub App ID: ');
    }
    if (!credentials.clientId) {
      credentials.clientId = await question('Client ID: ');
    }
    if (!credentials.clientSecret) {
      credentials.clientSecret = await question('Client Secret (or press Enter to skip): ');
    }
    if (!credentials.webhookSecret) {
      credentials.webhookSecret = await question('Webhook Secret (or press Enter to skip): ');
    }
    if (!credentials.privateKeyPath && !credentials.privateKey) {
      if (!pemFile || credentials.privateKeyPath !== pemFile) {
        credentials.privateKeyPath = await question('Private Key file path (or press Enter to skip): ');
      }
    }
  }

  // Read private key if path provided
  if (credentials.privateKeyPath && fs.existsSync(credentials.privateKeyPath)) {
    credentials.privateKey = fs.readFileSync(credentials.privateKeyPath, 'utf8').trim();
    console.log(`✅ Loaded private key from: ${credentials.privateKeyPath}`);
  } else if (credentials.privateKeyPath) {
    console.log('⚠️  Private key file not found. You can add it later to .env.local');
  }

  // Save to .env.local
  await saveToEnvLocal(credentials);

  // Try to save to Supabase
  const savedToSupabase = await saveToSupabase(credentials);

  if (!savedToSupabase && credentials.privateKey) {
    console.log('\n⚠️  Note: Private key stored in .env.local only');
    console.log('   For production, consider encrypting and storing in Supabase');
  }

  console.log('\n✅ Setup complete!');
  console.log('\n📋 Next steps:');
  console.log('  1. Update GitHub App events (add Installation, Installation repositories)');
  console.log('  2. Test webhook: beast-mode github-app check');
  console.log('  3. Install app on a test repo');
  console.log('  4. Create a test PR to verify it works\n');
}

// CLI entry point
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length >= 2) {
    // Non-interactive mode
    const credentials = {
      appId: args[0],
      clientId: args[1],
      clientSecret: args[2] || '',
      webhookSecret: args[3] || '',
      privateKeyPath: args[4] || findPemFile()
    };
    
    saveCredentials(credentials).then(() => {
      rl.close();
      process.exit(0);
    }).catch(error => {
      console.error('Error:', error);
      rl.close();
      process.exit(1);
    });
  } else {
    // Interactive mode
    saveCredentials().then(() => {
      rl.close();
    }).catch(error => {
      console.error('Error:', error);
      rl.close();
      process.exit(1);
    });
  }
}

module.exports = { saveCredentials, findPemFile, saveToEnvLocal, saveToSupabase };
