#!/usr/bin/env node
/**
 * Setup DNS with A record for root domain (if CNAME doesn't work)
 */

const path = require('path');
const fs = require('fs');
const https = require('https');

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

const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const encryptionKey = process.env.API_KEYS_ENCRYPTION_KEY || 'default_key_change_in_production';
const crypto = require('crypto');

const DOMAIN = 'beast-mode.dev';
const VERCEL_IP = '76.76.21.21'; // Vercel's IP from the warning message

async function getPorkbunCredentials() {
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  const { data: keys } = await supabase
    .from('user_api_keys')
    .select('*')
    .eq('provider', 'porkbun')
    .eq('is_active', true)
    .limit(1);
  
  if (keys && keys.length > 0) {
    const key = keys[0];
    const parts = key.encrypted_key.split(':');
    if (parts.length === 3) {
      const iv = Buffer.from(parts[0], 'hex');
      const authTag = Buffer.from(parts[1], 'hex');
      const encrypted = Buffer.from(parts[2], 'hex');
      const keyBuffer = crypto.createHash('sha256').update(encryptionKey).digest();
      
      const decipher = crypto.createDecipheriv('aes-256-gcm', keyBuffer, iv);
      decipher.setAuthTag(authTag);
      let decrypted = decipher.update(encrypted);
      decrypted = Buffer.concat([decrypted, decipher.final()]);
      const parsed = JSON.parse(decrypted.toString('utf8'));
      return { apiKey: parsed.api_key, secretKey: parsed.secret_key };
    }
  }
  return null;
}

function porkbunRequest(endpoint, data, apiKey, secretKey) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      apikey: apiKey,
      secretapikey: secretKey,
      ...data
    });

    const url = new URL(`https://api.porkbun.com/api/json/v3/${endpoint}`);
    
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (parsed.status === 'ERROR' || parsed.error) {
            reject(new Error(parsed.message || parsed.error));
          } else {
            resolve(parsed);
          }
        } catch (e) {
          reject(new Error(`Failed to parse response: ${e.message}`));
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function setupARecord() {
  console.log('🔧 Setting up A record for root domain...\n');
  
  const creds = await getPorkbunCredentials();
  if (!creds) {
    console.error('❌ Could not get Porkbun credentials');
    return;
  }
  
  // Get current records
  const response = await porkbunRequest(`dns/retrieve/${DOMAIN}`, {}, creds.apiKey, creds.secretKey);
  const records = response.records || [];
  
  // Delete existing root CNAME if it exists
  const rootCNAME = records.find(r => 
    (!r.name || r.name === '' || r.name === '@' || r.name === DOMAIN) && 
    r.type === 'CNAME'
  );
  
  if (rootCNAME) {
    console.log('🗑️  Deleting root CNAME (some DNS providers don\'t support CNAME on root)...');
    await porkbunRequest(`dns/delete/${DOMAIN}/${rootCNAME.id}`, {}, creds.apiKey, creds.secretKey);
    console.log('   ✅ Deleted root CNAME\n');
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Check if A record already exists
  const rootA = records.find(r => 
    (!r.name || r.name === '' || r.name === '@' || r.name === DOMAIN) && 
    r.type === 'A' && 
    r.content === VERCEL_IP
  );
  
  if (rootA) {
    console.log('✅ Root A record already points to Vercel\n');
  } else {
    // Delete any existing A records
    const existingA = records.filter(r => 
      (!r.name || r.name === '' || r.name === '@' || r.name === DOMAIN) && 
      r.type === 'A'
    );
    
    if (existingA.length > 0) {
      console.log(`🗑️  Deleting ${existingA.length} existing A record(s)...`);
      for (const record of existingA) {
        await porkbunRequest(`dns/delete/${DOMAIN}/${record.id}`, {}, creds.apiKey, creds.secretKey);
      }
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Create A record
    console.log(`➕ Creating A record: @ -> ${VERCEL_IP}`);
    await porkbunRequest(`dns/create/${DOMAIN}`, {
      type: 'A',
      name: '',
      content: VERCEL_IP,
      ttl: 600
    }, creds.apiKey, creds.secretKey);
    console.log('   ✅ A record created\n');
  }
  
  console.log('✅ DNS configuration complete!');
  console.log(`   • Root domain (@) → A record → ${VERCEL_IP}`);
  console.log(`   • www subdomain → CNAME → cname.vercel-dns.com`);
  console.log('\n⏱️  DNS propagation typically takes 5-30 minutes');
  console.log(`🌐 After propagation, visit: https://${DOMAIN}`);
}

setupARecord().catch(console.error);
