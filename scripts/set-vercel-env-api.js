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

const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const PROJECT_ID = process.env.VERCEL_PROJECT_ID;

if (!VERCEL_TOKEN) {
  console.error('❌ VERCEL_TOKEN not found!');
  console.error('   Get it from: https://vercel.com/account/tokens');
  console.error('   Then: export VERCEL_TOKEN=your_token');
  process.exit(1);
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
        'Authorization': `Bearer ${VERCEL_TOKEN}`,
        'Content-Type': 'application/x-www-form-urlencoded',
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
            const putData = querystring.stringify({
              value,
              type: 'encrypted',
              target: environment
            });
            
            const putOptions = {
              hostname: 'api.vercel.com',
              path: `/v10/projects/${projectId}/env/${existing.id}`,
              method: 'PATCH',
              headers: {
                'Authorization': `Bearer ${VERCEL_TOKEN}`,
                'Content-Type': 'application/x-www-form-urlencoded',
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

