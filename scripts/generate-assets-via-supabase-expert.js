#!/usr/bin/env node

/**
 * Generate Brand Assets via Supabase (Expert Method)
 * 
 * Follows cursor rules: CLI/API-first, uses Supabase directly
 * Fetches OpenAI key from user_api_keys table and generates assets
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables (cursor rules: use .env.local)
function loadEnv() {
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

const OpenAI = require('openai');

const brandAssets = [
  {
    name: 'beast-head-primary',
    prompt: 'A modern, minimal beast head silhouette logo, angular and geometric, powerful and animalistic, in blue (#3B82F6), professional tech company style, vector art style, clean lines, no text, centered, white background, 1024x1024',
    size: '1024x1024'
  },
  {
    name: 'beast-head-dark',
    prompt: 'A modern, minimal beast head silhouette logo, angular and geometric, powerful and animalistic, in blue (#3B82F6), professional tech company style, vector art style, clean lines, no text, centered, dark background (#1F2937), 1024x1024',
    size: '1024x1024'
  },
  {
    name: 'full-logo-horizontal',
    prompt: 'BEAST MODE logo: modern beast head silhouette icon on the left, "BEAST MODE" text on the right in bold uppercase sans-serif font (Inter font), blue (#3B82F6) and dark gray (#1F2937), professional tech company style, horizontal layout, white background, 2048x512',
    size: '1792x1024'
  },
  {
    name: 'full-logo-stacked',
    prompt: 'BEAST MODE logo: modern beast head silhouette icon on top, "BEAST MODE" text below in bold uppercase sans-serif font (Inter font), blue (#3B82F6) and dark gray (#1F2937), professional tech company style, vertical layout, white background, 512x1024',
    size: '1024x1024'
  },
  {
    name: 'favicon',
    prompt: 'Simplified beast head icon, minimal geometric shape, blue (#3B82F6), professional, recognizable at 32x32 pixels, vector style, white background, 512x512',
    size: '1024x1024'
  }
];

function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(filepath);
    
    protocol.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve(filepath);
      });
    }).on('error', (err) => {
      fs.unlink(filepath, () => {});
      reject(err);
    });
  });
}

/**
 * Get OpenAI API key from Supabase (Expert Method)
 * Follows cursor rules: CLI/API-first, use existing decryption function
 */
async function getApiKeyFromSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Supabase not configured');
    console.log('   Need: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    return null;
  }

  console.log('🔍 Fetching OpenAI API key from Supabase...');
  console.log(`   URL: ${supabaseUrl.substring(0, 30)}...`);

  // Use existing getUserApiKeys function (cursor rules: use existing infrastructure)
  try {
    const path = require('path');
    const apiKeysDecryptPath = path.join(__dirname, '../website/lib/api-keys-decrypt');
    
    // Try TypeScript version first, then JavaScript
    let getUserApiKeys;
    try {
      // For TypeScript files, we need to use ts-node or compile first
      // But since we're in Node.js, try to require the compiled version or use a workaround
      const fs = require('fs');
      const jsPath = apiKeysDecryptPath + '.js';
      const tsPath = apiKeysDecryptPath + '.ts';
      
      if (fs.existsSync(jsPath)) {
        getUserApiKeys = require(jsPath).getUserApiKeys;
      } else if (fs.existsSync(tsPath)) {
        // For TypeScript, we'll query Supabase directly using the same decryption logic
        console.log('   Using direct Supabase query with decryption...');
        
        const supabase = createClient(supabaseUrl, supabaseKey);
        const { data: keyData, error: keyError } = await supabase
          .from('user_api_keys')
          .select('encrypted_key, provider, user_id, key_name, is_active')
          .eq('provider', 'openai')
          .eq('is_active', true)
          .limit(1)
          .maybeSingle();

        if (keyError || !keyData || !keyData.encrypted_key) {
          console.log('⚠️  No OpenAI key found in Supabase');
          return null;
        }

        // Decrypt using the same method as api-keys-decrypt.ts
        const crypto = require('crypto');
        const parts = keyData.encrypted_key.split(':');
        if (parts.length === 3) {
          const encryptionKey = process.env.API_KEYS_ENCRYPTION_KEY || 
                               process.env.ENCRYPTION_KEY || 
                               'default_key_change_in_production';
          const key = crypto.createHash('sha256').update(encryptionKey).digest();
          const iv = Buffer.from(parts[0], 'hex');
          const authTag = Buffer.from(parts[1], 'hex');
          const encrypted = Buffer.from(parts[2], 'hex');
          
          const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
          decipher.setAuthTag(authTag);
          let decrypted = decipher.update(encrypted);
          decrypted = Buffer.concat([decrypted, decipher.final()]);
          const apiKey = decrypted.toString('utf8');
          
          console.log(`✅ Found and decrypted OpenAI key (user: ${keyData.user_id || 'system'}, name: ${keyData.key_name || 'default'})`);
          return apiKey;
        } else {
          // If not in expected format, try as plain text
          if (keyData.encrypted_key.startsWith('sk-')) {
            console.log(`✅ Found OpenAI key (user: ${keyData.user_id || 'system'})`);
            return keyData.encrypted_key;
          }
        }
        
        console.log('⚠️  Could not decrypt key - wrong format');
        return null;
      } else {
        throw new Error('api-keys-decrypt file not found');
      }
    } catch (error) {
      console.log('   Using direct Supabase query...');
      // Fallback to direct query
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('user_api_keys')
        .select('encrypted_key, provider, user_id, key_name, is_active')
        .eq('provider', 'openai')
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      if (fallbackError || !fallbackData || !fallbackData.encrypted_key) {
        console.log('⚠️  No OpenAI key found in Supabase');
        return null;
      }

      // Try decryption
      const crypto = require('crypto');
      const parts = fallbackData.encrypted_key.split(':');
      if (parts.length === 3) {
        const encryptionKey = process.env.API_KEYS_ENCRYPTION_KEY || 
                             process.env.ENCRYPTION_KEY || 
                             'default_key_change_in_production';
        const key = crypto.createHash('sha256').update(encryptionKey).digest();
        const iv = Buffer.from(parts[0], 'hex');
        const authTag = Buffer.from(parts[1], 'hex');
        const encrypted = Buffer.from(parts[2], 'hex');
        
        const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(encrypted);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        const apiKey = decrypted.toString('utf8');
        
        console.log(`✅ Found and decrypted OpenAI key (user: ${fallbackData.user_id || 'system'})`);
        return apiKey;
      }
      
      // If not encrypted format, return as-is (might be plain text)
      if (fallbackData.encrypted_key.startsWith('sk-')) {
        return fallbackData.encrypted_key;
      }
      
      return null;
    }

    // If we got getUserApiKeys function, use it
    if (getUserApiKeys) {
      // Need a user ID - try to get any active OpenAI key
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data: keyData } = await supabase
        .from('user_api_keys')
        .select('user_id')
        .eq('provider', 'openai')
        .eq('is_active', true)
        .limit(1)
        .single();

      if (keyData && keyData.user_id) {
        const userKeys = await getUserApiKeys(keyData.user_id);
        if (userKeys && userKeys.openai) {
          console.log(`✅ Found OpenAI key via getUserApiKeys (user: ${keyData.user_id})`);
          return userKeys.openai;
        }
      }
    }
  } catch (error) {
    console.error('❌ Error getting API key:', error.message);
    return null;
  }

  return null;
}

async function generateAsset(asset, openai) {
  console.log(`\n🎨 Generating: ${asset.name}...`);
  console.log(`   Prompt: ${asset.prompt.substring(0, 80)}...`);

  try {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: asset.prompt,
      size: asset.size === '1792x1024' ? '1792x1024' : '1024x1024',
      quality: "hd",
      n: 1
    });

    const imageUrl = response.data[0].url;
    if (!imageUrl) {
      throw new Error('No image URL returned');
    }

    console.log(`   ✅ Generated: ${imageUrl}`);

    // Download image
    const outputDir = path.join(__dirname, '../website/public/logos');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const filepath = path.join(outputDir, `${asset.name}.png`);
    await downloadImage(imageUrl, filepath);
    console.log(`   ✅ Saved: ${filepath}`);

    return { name: asset.name, url: imageUrl, path: filepath };
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    if (error.response) {
      console.error(`   Details:`, JSON.stringify(error.response.data, null, 2));
    }
    return null;
  }
}

async function generateAllAssets() {
  console.log('🚀 Generating BEAST MODE Brand Assets (Expert Method)\n');
  console.log('='.repeat(60));
  console.log('📋 Following cursor rules: CLI/API-first, Supabase integration\n');

  // Try Supabase first (cursor rules: use Supabase)
  let apiKey = await getApiKeyFromSupabase();

  // Fallback to system key
  if (!apiKey) {
    apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      console.log('✅ Using system OPENAI_API_KEY');
    }
  }

  if (!apiKey) {
    console.error('\n❌ OPENAI_API_KEY not found');
    console.log('\n📋 Options:');
    console.log('   1. Add to Supabase: INSERT INTO user_api_keys (user_id, provider, key) VALUES (\'system\', \'openai\', \'sk-...\');');
    console.log('   2. Or set OPENAI_API_KEY in website/.env.local');
    console.log('   3. Or export: export OPENAI_API_KEY=sk-...\n');
    process.exit(1);
  }

  console.log(`✅ Using OpenAI API key: ${apiKey.substring(0, 10)}...`);
  const openai = new OpenAI({ apiKey });

  const results = [];
  const totalCost = brandAssets.length * 0.04;

  console.log(`\n💰 Estimated cost: $${totalCost.toFixed(2)} (${brandAssets.length} images)`);
  console.log('   Starting generation in 3 seconds...\n');
  await new Promise(resolve => setTimeout(resolve, 3000));

  for (let i = 0; i < brandAssets.length; i++) {
    const asset = brandAssets[i];
    console.log(`\n[${i + 1}/${brandAssets.length}]`);
    const result = await generateAsset(asset, openai);
    if (result) {
      results.push(result);
    }
    
    // Wait between requests (DALL-E 3 rate limit)
    if (i < brandAssets.length - 1) {
      console.log('   ⏳ Waiting 4 seconds (rate limit)...');
      await new Promise(resolve => setTimeout(resolve, 4000));
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n📋 Generated Assets:');
  results.forEach(r => {
    console.log(`   ✅ ${r.name}`);
    console.log(`      Path: ${r.path}`);
  });

  if (results.length < brandAssets.length) {
    console.log(`\n⚠️  Generated ${results.length}/${brandAssets.length} assets`);
  } else {
    console.log(`\n✅ Successfully generated all ${results.length} assets!`);
  }

  console.log('\n📝 Next Steps:');
  console.log('   1. Review images in website/public/logos/');
  console.log('   2. Optimize for web if needed');
  console.log('   3. Create favicon sizes (16x16, 32x32)');
  console.log('   4. Update website components\n');

  return results;
}

if (require.main === module) {
  generateAllAssets().catch(error => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { generateAllAssets, getApiKeyFromSupabase };
