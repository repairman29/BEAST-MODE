#!/usr/bin/env node

/**
 * Set Vercel Environment Variables using Vercel API
 * Requires VERCEL_TOKEN environment variable
 */

const https = require('https');
const querystring = require('querystring');
const path = require('path');
const fs = require('fs');

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

// Get credentials from Supabase (reuse logic from setup script)
const { getCredentialsFromSupabase } = require('./setup-vercel-env-from-supabase');

const readline = require('readline');
const crypto = require('crypto');

let VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const PROJECT_ID = process.env.VERCEL_PROJECT_ID;

// Function to get Vercel token from Supabase
async function getVercelTokenFromSupabase() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const encryptionKey = process.env.API_KEYS_ENCRYPTION_KEY || 'default_key_change_in_production';
  
  if (!supabaseUrl || !supabaseKey) {
    return null;
  }
  
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    const { data, error } = await supabase
      .from('user_api_keys')
      .select('encrypted_key')
      .eq('provider', 'vercel')
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error || !data) {
      return null;
    }
    
    // Decrypt the token
    const encrypted = data.encrypted_key;
    const parts = encrypted.split(':');
    if (parts.length !== 3) {
      return null;
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encryptedData = Buffer.from(parts[2], 'hex');
    
    const key = crypto.createHash('sha256').update(encryptionKey).digest();
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedData, null, 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    return null;
  }
}

async function getProjectId() {
  if (PROJECT_ID) return PROJECT_ID;
  
  // Try to get from .vercel directory
  const vercelDir = path.join(process.cwd(), 'website', '.vercel', 'project.json');
  if (fs.existsSync(vercelDir)) {
    const projectData = JSON.parse(fs.readFileSync(vercelDir, 'utf8'));
    return projectData.projectId;
  }
  
  // Try to get from Vercel API
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.vercel.com',
      path: '/v9/projects?limit=100',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${VERCEL_TOKEN}`,
        'Content-Type': 'application/json'
      }
    };
    
    https.get(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const projects = JSON.parse(data).projects || [];
          const project = projects.find(p => p.name === 'beast-mode' || p.name === 'beast-mode-website');
          if (project) {
            resolve(project.id);
          } else {
            reject(new Error('Project not found. Set VERCEL_PROJECT_ID manually.'));
          }
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function setEnvVar(projectId, key, value, environment = 'production') {
  return new Promise((resolve, reject) => {
    // Vercel API expects JSON, not form-encoded
    const postData = JSON.stringify({
      key,
      value,
      type: 'encrypted',
      target: [environment] // Vercel expects array
    });
    
    const options = {
      hostname: 'api.vercel.com',
      path: `/v10/projects/${projectId}/env`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VERCEL_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': postData.length
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          resolve(true);
        } else {
          try {
            const error = JSON.parse(data);
            if (error.error?.message?.includes('already exists')) {
              // Update existing
              updateEnvVar(projectId, key, value, environment).then(resolve).catch(reject);
            } else {
              reject(new Error(`API returned ${res.statusCode}: ${error.error?.message || data}`));
            }
          } catch (e) {
            reject(new Error(`API returned ${res.statusCode}: ${data}`));
          }
        }
      });
    });
    
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function updateEnvVar(projectId, key, value, environment = 'production') {
  return new Promise((resolve, reject) => {
    // First get the env var ID
    const options = {
      hostname: 'api.vercel.com',
      path: `/v10/projects/${projectId}/env`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${VERCEL_TOKEN}`,
        'Content-Type': 'application/json'
      }
    };
    
    https.get(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const envVars = JSON.parse(data).envs || [];
          const existing = envVars.find(e => e.key === key && e.target?.includes(environment));
          
          if (existing) {
            // Update existing
            const putData = JSON.stringify({
              value,
              type: 'encrypted',
              target: [environment] // Vercel expects array
            });
            
            const putOptions = {
              hostname: 'api.vercel.com',
              path: `/v10/projects/${projectId}/env/${existing.id}`,
              method: 'PATCH',
              headers: {
                'Authorization': `Bearer ${VERCEL_TOKEN}`,
                'Content-Type': 'application/json',
                'Content-Length': putData.length
              }
            };
            
            const putReq = https.request(putOptions, (putRes) => {
              if (putRes.statusCode === 200 || putRes.statusCode === 201) {
                resolve(true);
              } else {
                reject(new Error(`Update failed: ${putRes.statusCode}`));
              }
            });
            
            putReq.on('error', reject);
            putReq.write(putData);
            putReq.end();
          } else {
            reject(new Error('Variable not found for update'));
          }
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  // Get token if not set - try Supabase first
  if (!VERCEL_TOKEN) {
    console.log('🔍 Checking Supabase for Vercel token...');
    VERCEL_TOKEN = await getVercelTokenFromSupabase();
    
    if (VERCEL_TOKEN) {
      console.log('✅ Found Vercel token in Supabase!\n');
    } else {
      // Fallback to prompt
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      console.log('');
      console.log('🔑 Vercel Token Required');
      console.log('   Get it from: https://vercel.com/account/tokens');
      console.log('   Click "Create Token" and copy it');
      console.log('');
      
      VERCEL_TOKEN = await new Promise((resolve) => {
        rl.question('   Enter VERCEL_TOKEN: process.env.TOKEN || ''❌ Token is required!');
        process.exit(1);
      }
    }
  }
  console.log('');
  console.log('🚀 Setting Vercel Environment Variables via API');
  console.log('===============================================\n');
  
  try {
    // Get project ID
    console.log('🔍 Finding Vercel project...');
    const projectId = await getProjectId();
    console.log(`✅ Found project ID: ${projectId}\n`);
    
    // Get credentials from Supabase
    const credentials = await getCredentialsFromSupabase();
    
    // Fix redirect URI to production
    if (credentials.GITHUB_REDIRECT_URI && credentials.GITHUB_REDIRECT_URI.includes('localhost')) {
      credentials.GITHUB_REDIRECT_URI = 'https://beast-mode.dev/api/github/oauth/callback';
      console.log('⚠️  Updated GITHUB_REDIRECT_URI to production URL\n');
    }
    
    console.log('📋 Setting environment variables...\n');
    
    const results = {};
    for (const [key, value] of Object.entries(credentials)) {
      if (value) {
        try {
          await setEnvVar(projectId, key, value, 'production');
          console.log(`   ✅ ${key}`);
          results[key] = true;
        } catch (error) {
          console.log(`   ❌ ${key}: ${error.message}`);
          results[key] = false;
        }
      }
    }
    
    console.log('\n📊 Summary:');
    const successCount = Object.values(results).filter(Boolean).length;
    const totalCount = Object.keys(results).length;
    console.log(`   ✅ Set: ${successCount}/${totalCount}`);
    
    if (successCount === totalCount) {
      console.log('\n✅ All variables set! Vercel will auto-redeploy.\n');
    } else {
      console.log('\n⚠️  Some variables failed. Check errors above.\n');
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

