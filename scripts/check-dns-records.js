#!/usr/bin/env node
/**
 * Check DNS records for beast-mode.dev
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

async function checkDNS() {
  console.log('🔍 Checking DNS records for beast-mode.dev...\n');
  
  const creds = await getPorkbunCredentials();
  if (!creds) {
    console.error('❌ Could not get Porkbun credentials');
    return;
  }
  
  const response = await porkbunRequest(`dns/retrieve/${DOMAIN}`, {}, creds.apiKey, creds.secretKey);
  const records = response.records || [];
  
  console.log(`📋 Found ${records.length} DNS record(s):\n`);
  
  records.forEach(r => {
    console.log(`   ${r.type.padEnd(6)} ${(r.name || '@').padEnd(20)} → ${r.content}`);
  });
  
  const rootCNAME = records.find(r => 
    (!r.name || r.name === '' || r.name === '@' || r.name === DOMAIN) && 
    r.type === 'CNAME' && 
    r.content === 'cname.vercel-dns.com'
  );
  
  const rootA = records.find(r => 
    (!r.name || r.name === '' || r.name === '@' || r.name === DOMAIN) && 
    r.type === 'A'
  );
  
  const wwwCNAME = records.find(r => 
    r.name === 'www' && 
    r.type === 'CNAME' && 
    r.content === 'cname.vercel-dns.com'
  );
  
  console.log('\n📊 Status:');
  if (rootCNAME) {
    console.log('   ✅ Root CNAME configured correctly');
  } else if (rootA) {
    console.log(`   ✅ Root A record found: ${rootA.content}`);
    console.log('   ⚠️  Using A record (CNAME may not be supported on root)');
  } else {
    console.log('   ❌ Root domain record missing');
  }
  
  if (wwwCNAME) {
    console.log('   ✅ www CNAME configured correctly');
  } else {
    console.log('   ⚠️  www CNAME missing or incorrect');
  }
  
  console.log('\n⏱️  DNS propagation can take 5-30 minutes');
  console.log('   Check from different locations: https://dnschecker.org/#CNAME/beast-mode.dev');
}

checkDNS().catch(console.error);
