#!/usr/bin/env node
/**
 * Get and decrypt Porkbun credentials from Supabase user_api_keys
 */

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

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

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function decryptKey(encryptedKey) {
  try {
    const parts = encryptedKey.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted key format');
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = Buffer.from(parts[2], 'hex');
    
    // Derive key from encryption key
    const key = crypto.createHash('sha256').update(encryptionKey).digest();
    
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted.toString('utf8');
  } catch (error) {
    console.error('Decryption error:', error.message);
    return null;
  }
}

async function getPorkbunCredentials() {
  console.log('🔍 Looking for Porkbun credentials in user_api_keys...\n');
  
  const { data: keys, error } = await supabase
    .from('user_api_keys')
    .select('*')
    .eq('provider', 'porkbun')
    .eq('is_active', true)
    .limit(1);
  
  if (error) {
    console.error('❌ Error querying user_api_keys:', error.message);
    return null;
  }
  
  if (!keys || keys.length === 0) {
    console.log('❌ No active Porkbun keys found in user_api_keys');
    console.log('   Try checking for any porkbun records...');
    
    // Check for any porkbun records (case insensitive)
    const { data: allKeys } = await supabase
      .from('user_api_keys')
      .select('*')
      .ilike('provider', '%porkbun%')
      .limit(5);
    
    if (allKeys && allKeys.length > 0) {
      console.log(`   Found ${allKeys.length} record(s) with porkbun in provider name`);
      allKeys.forEach(k => console.log(`      Provider: ${k.provider}, Active: ${k.is_active}`));
    }
    
    return null;
  }
  
  const key = keys[0];
  console.log(`✅ Found Porkbun key (ID: ${key.id})`);
  console.log(`   Key name: ${key.key_name || 'N/A'}`);
  console.log(`   Encrypted: ${key.encrypted_key.substring(0, 50)}...`);
  
  // Try to decrypt
  const decrypted = decryptKey(key.encrypted_key);
  if (decrypted) {
    console.log(`   ✅ Decrypted successfully!`);
    // The decrypted value might be JSON with api_key and secret_key
    try {
      const parsed = JSON.parse(decrypted);
      if (parsed.api_key && parsed.secret_key) {
        return {
          apiKey: parsed.api_key,
          secretKey: parsed.secret_key
        };
      } else if (parsed.apiKey && parsed.secretKey) {
        return {
          apiKey: parsed.apiKey,
          secretKey: parsed.secretKey
        };
      }
    } catch (e) {
      // Not JSON, might be just the API key
      // Check if there's a separate record for secret
      console.log('   ⚠️  Decrypted value is not JSON, might need separate secret key record');
      return {
        apiKey: decrypted,
        secretKey: null // Need to find secret separately
      };
    }
  } else {
    console.log('   ❌ Failed to decrypt');
    return null;
  }
}

getPorkbunCredentials().then(creds => {
  if (creds && creds.apiKey && creds.secretKey) {
    console.log('\n✅ Successfully retrieved Porkbun credentials!');
    console.log(`   API Key: ${creds.apiKey.substring(0, 10)}...`);
    console.log(`   Secret Key: ${creds.secretKey.substring(0, 10)}...`);
    console.log('\n🚀 You can now run the DNS setup script!');
  } else {
    console.log('\n❌ Could not retrieve complete credentials');
  }
}).catch(console.error);
