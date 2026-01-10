#!/usr/bin/env node

/**
 * Generate BEAST MODE Brand Assets with AI (Using Supabase API Keys)
 * 
 * Fetches API key from Supabase or uses system key
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
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

async function getApiKey() {
  // Try system key first
  if (process.env.OPENAI_API_KEY) {
    console.log('✅ Using system OPENAI_API_KEY');
    return process.env.OPENAI_API_KEY;
  }

  // Try Supabase
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && supabaseKey) {
    console.log('🔍 Checking Supabase for API keys...');
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Try to get any OpenAI key (for system use)
    const { data, error } = await supabase
      .from('user_api_keys')
      .select('key')
      .eq('provider', 'openai')
      .limit(1)
      .single();

    if (!error && data && data.key) {
      console.log('✅ Using OpenAI key from Supabase');
      return data.key;
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
  console.log('🚀 Generating BEAST MODE Brand Assets with OpenAI DALL-E 3\n');
  console.log('='.repeat(60));

  const apiKey = await getApiKey();
  if (!apiKey) {
    console.error('\n❌ OPENAI_API_KEY not found');
    console.log('\n📋 Options:');
    console.log('   1. Set OPENAI_API_KEY in website/.env.local');
    console.log('   2. Or export: export OPENAI_API_KEY=sk-...');
    console.log('   3. Or add OpenAI key to Supabase user_api_keys table');
    console.log('\n💡 To add to Supabase:');
    console.log('   INSERT INTO user_api_keys (user_id, provider, key)');
    console.log('   VALUES (\'system\', \'openai\', \'sk-...\');\n');
    process.exit(1);
  }

  console.log(`✅ Using OpenAI API key: ${apiKey.substring(0, 10)}...`);
  const openai = new OpenAI({ apiKey });

  const results = [];
  const totalCost = brandAssets.length * 0.04; // DALL-E 3 is ~$0.04 per image

  console.log(`\n💰 Estimated cost: $${totalCost.toFixed(2)} (${brandAssets.length} images)`);
  console.log('   Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');
  
  await new Promise(resolve => setTimeout(resolve, 5000));

  for (let i = 0; i < brandAssets.length; i++) {
    const asset = brandAssets[i];
    console.log(`\n[${i + 1}/${brandAssets.length}]`);
    const result = await generateAsset(asset, openai);
    if (result) {
      results.push(result);
    }
    
    // Wait between requests (DALL-E 3 rate limit: ~1 request per 3 seconds)
    if (i < brandAssets.length - 1) {
      console.log('   ⏳ Waiting 4 seconds before next generation...');
      await new Promise(resolve => setTimeout(resolve, 4000));
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n📋 Generated Assets:');
  results.forEach(r => {
    console.log(`   ✅ ${r.name}`);
    console.log(`      URL: ${r.url}`);
    console.log(`      Path: ${r.path}`);
  });

  if (results.length < brandAssets.length) {
    console.log(`\n⚠️  Generated ${results.length}/${brandAssets.length} assets`);
    console.log('   Some assets failed. Check errors above.');
  } else {
    console.log(`\n✅ Successfully generated all ${results.length} assets!`);
  }

  console.log('\n📝 Next Steps:');
  console.log('   1. Review generated images in website/public/logos/');
  console.log('   2. Optimize for web (compress, resize if needed)');
  console.log('   3. Create favicon from favicon.png (resize to 32x32, 16x16)');
  console.log('   4. Update website with new logos\n');

  return results;
}

if (require.main === module) {
  generateAllAssets().catch(error => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { generateAllAssets, generateAsset, getApiKey };
