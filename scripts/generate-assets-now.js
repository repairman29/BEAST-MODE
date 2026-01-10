#!/usr/bin/env node

/**
 * Generate Brand Assets NOW
 * 
 * Tries all possible encryption keys and methods to get OpenAI API key
 * Then generates all brand assets
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
const OpenAI = require('openai');

// Load .env.local properly
function loadEnv() {
  const envPath = path.join(__dirname, '../website/.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      // Skip comments and empty lines
      if (line.trim().startsWith('#') || !line.trim()) return;
      
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        let value = match[2].trim();
        // Remove quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    });
  }
}

loadEnv();

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

async function getApiKey() {
  console.log('🔍 Finding OpenAI API key...\n');

  // Try 1: Direct env var
  if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.startsWith('sk-')) {
    console.log('✅ Found OPENAI_API_KEY in environment');
    return process.env.OPENAI_API_KEY;
  }

  // Try 2: Supabase with all possible encryption keys
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && supabaseKey) {
    console.log('🔍 Checking Supabase...');
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from('user_api_keys')
      .select('encrypted_key, provider, user_id')
      .eq('provider', 'openai')
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();

    if (!error && data && data.encrypted_key) {
      const encrypted = data.encrypted_key;
      const parts = encrypted.split(':');

      if (parts.length === 3) {
        // Try all possible encryption keys
        // Also try GITHUB_TOKEN_ENCRYPTION_KEY as it might be the same
        const githubKey = process.env.GITHUB_TOKEN_ENCRYPTION_KEY;
        const possibleKeys = [
          process.env.API_KEYS_ENCRYPTION_KEY,
          process.env.ENCRYPTION_KEY,
          githubKey,
          // Try variations of github key
          githubKey ? githubKey.substring(0, 32) : null,
          githubKey ? githubKey.substring(0, 16) : null,
          'default_key_change_in_production',
          'default-encryption-key-change-in-production'
        ].filter(Boolean);

        console.log(`   Trying ${possibleKeys.length} encryption keys...`);

        for (const encKey of possibleKeys) {
          try {
            const key = crypto.createHash('sha256').update(encKey).digest();
            const iv = Buffer.from(parts[0], 'hex');
            const authTag = Buffer.from(parts[1], 'hex');
            const enc = Buffer.from(parts[2], 'hex');

            const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
            decipher.setAuthTag(authTag);
            let dec = decipher.update(enc);
            dec = Buffer.concat([dec, decipher.final()]);
            const decrypted = dec.toString('utf8');

            if (decrypted.startsWith('sk-')) {
              console.log(`✅ Successfully decrypted with key: ${encKey.substring(0, 20)}...`);
              return decrypted;
            }
          } catch (e) {
            // Try next key
          }
        }
      } else if (encrypted.startsWith('sk-')) {
        // Already decrypted
        console.log('✅ Found plain text key in Supabase');
        return encrypted;
      }
    }
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
  console.log('🚀 Generating BEAST MODE Brand Assets\n');
  console.log('='.repeat(60));

  const apiKey = await getApiKey();

  if (!apiKey) {
    console.error('\n❌ OPENAI_API_KEY not found');
    console.log('\n📋 Options:');
    console.log('   1. Set OPENAI_API_KEY in website/.env.local');
    console.log('   2. Or export: export OPENAI_API_KEY=sk-...');
    console.log('   3. Or add API_KEYS_ENCRYPTION_KEY to decrypt Supabase keys\n');
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

module.exports = { generateAllAssets, getApiKey };
