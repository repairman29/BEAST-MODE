#!/usr/bin/env node

/**
 * Decrypt API Key from Supabase
 * 
 * Uses existing decryption methods from the codebase
 */

const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// Load environment
function loadEnv() {
  const fs = require('fs');
  const path = require('path');
  const envPath = path.join(__dirname, '../website/.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        let value = match[2].trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    });
  }
}

loadEnv();

/**
 * Decrypt API key (try common methods)
 */
function decryptKey(encryptedKey, encryptionKey) {
  if (!encryptedKey) return null;
  
  // If it already starts with 'sk-', it's not encrypted
  if (encryptedKey.startsWith('sk-')) {
    return encryptedKey;
  }

  // Try different decryption methods
  try {
    // Method 1: AES-256-GCM (common for Supabase)
    if (encryptionKey) {
      const parts = encryptedKey.split(':');
      if (parts.length === 3) {
        const iv = Buffer.from(parts[0], 'hex');
        const authTag = Buffer.from(parts[1], 'hex');
        const encrypted = Buffer.from(parts[2], 'hex');
        
        const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(encryptionKey, 'hex'), iv);
        decipher.setAuthTag(authTag);
        
        let decrypted = decipher.update(encrypted, null, 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
      }
    }
    
    // Method 2: Base64 decode (might be base64 encoded)
    try {
      const decoded = Buffer.from(encryptedKey, 'base64').toString('utf8');
      if (decoded.startsWith('sk-')) {
        return decoded;
      }
    } catch (e) {
      // Not base64
    }
    
    // Method 3: Try as hex
    try {
      const decoded = Buffer.from(encryptedKey, 'hex').toString('utf8');
      if (decoded.startsWith('sk-')) {
        return decoded;
      }
    } catch (e) {
      // Not hex
    }
    
  } catch (error) {
    console.error('Decryption error:', error.message);
  }

  return null;
}

async function getDecryptedApiKey() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Supabase not configured');
    return null;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Get encrypted key
  const { data, error } = await supabase
    .from('user_api_keys')
    .select('encrypted_key, provider, user_id')
    .eq('provider', 'openai')
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();

  if (error || !data || !data.encrypted_key) {
    console.log('⚠️  No OpenAI key found in Supabase');
    return null;
  }

  const encryptedKey = data.encrypted_key;
  
  // Try to decrypt
  const encryptionKey = process.env.ENCRYPTION_KEY || process.env.SUPABASE_ENCRYPTION_KEY;
  const decrypted = decryptKey(encryptedKey, encryptionKey);

  if (decrypted && decrypted.startsWith('sk-')) {
    console.log('✅ Successfully decrypted API key');
    return decrypted;
  }

  // If decryption failed, the key might be stored in a different format
  // Or we need the encryption key
  console.log('⚠️  Could not decrypt key automatically');
  console.log('   Key format:', encryptedKey.substring(0, 20) + '...');
  console.log('   Length:', encryptedKey.length);
  console.log('   Starts with sk-:', encryptedKey.startsWith('sk-'));
  
  // For now, return null - user will need to provide decryption key or use plain text
  return null;
}

if (require.main === module) {
  getDecryptedApiKey().then(key => {
    if (key) {
      console.log('\n✅ Decrypted key:', key.substring(0, 10) + '...');
    } else {
      console.log('\n❌ Could not decrypt key');
      console.log('   Options:');
      console.log('   1. Set ENCRYPTION_KEY in .env.local');
      console.log('   2. Or use plain text key: export OPENAI_API_KEY=sk-...');
    }
  });
}

module.exports = { getDecryptedApiKey, decryptKey };
