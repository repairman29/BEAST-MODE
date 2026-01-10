#!/usr/bin/env node

/**
 * Generate BEAST MODE Brand Assets with AI
 * 
 * Uses OpenAI DALL-E 3 or Replicate to generate:
 * - Logo variations
 * - Social media assets
 * - Website graphics
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

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

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

const brandAssets = [
  {
    name: 'beast-head-primary',
    prompt: 'A modern, minimal beast head silhouette logo, angular and geometric, powerful and animalistic, in blue (#3B82F6), professional tech company style, vector art style, clean lines, no text, centered, white background, 1024x1024',
    model: 'dalle-3',
    size: '1024x1024'
  },
  {
    name: 'beast-head-dark',
    prompt: 'A modern, minimal beast head silhouette logo, angular and geometric, powerful and animalistic, in blue (#3B82F6), professional tech company style, vector art style, clean lines, no text, centered, dark background (#1F2937), 1024x1024',
    model: 'dalle-3',
    size: '1024x1024'
  },
  {
    name: 'full-logo-horizontal',
    prompt: 'BEAST MODE logo: modern beast head silhouette icon on the left, "BEAST MODE" text on the right in bold uppercase sans-serif font (Inter font), blue (#3B82F6) and dark gray (#1F2937), professional tech company style, horizontal layout, white background, 2048x512',
    model: 'dalle-3',
    size: '1792x1024'
  },
  {
    name: 'full-logo-stacked',
    prompt: 'BEAST MODE logo: modern beast head silhouette icon on top, "BEAST MODE" text below in bold uppercase sans-serif font (Inter font), blue (#3B82F6) and dark gray (#1F2937), professional tech company style, vertical layout, white background, 512x1024',
    model: 'dalle-3',
    size: '1024x1024'
  },
  {
    name: 'favicon',
    prompt: 'Simplified beast head icon, minimal geometric shape, blue (#3B82F6), professional, recognizable at 32x32 pixels, vector style, white background, 512x512',
    model: 'dalle-3',
    size: '1024x1024'
  }
];

async function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(filepath);
    
    protocol.get(url, (response) => {
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

async function generateAsset(asset) {
  console.log(`\n🎨 Generating: ${asset.name}...`);
  console.log(`   Prompt: ${asset.prompt.substring(0, 80)}...`);
  console.log(`   Model: ${asset.model}`);

  try {
    const response = await fetch(`${baseUrl}/api/ai/generate-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: asset.prompt,
        model: asset.model,
        size: asset.size
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Generation failed');
    }

    const data = await response.json();
    console.log(`   ✅ Generated: ${data.imageUrl}`);

    // Download image
    const outputDir = path.join(__dirname, '../website/public/logos');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const filepath = path.join(outputDir, `${asset.name}.png`);
    await downloadImage(data.imageUrl, filepath);
    console.log(`   ✅ Saved: ${filepath}`);

    return { name: asset.name, url: data.imageUrl, path: filepath };
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    return null;
  }
}

async function generateAllAssets() {
  console.log('🚀 Generating BEAST MODE Brand Assets with AI\n');
  console.log('='.repeat(60));

  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY not found');
    console.log('   Set it in website/.env.local or environment');
    process.exit(1);
  }

  const results = [];

  for (const asset of brandAssets) {
    const result = await generateAsset(asset);
    if (result) {
      results.push(result);
    }
    // Wait between requests to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n📋 Generated Assets:');
  results.forEach(r => {
    console.log(`   ✅ ${r.name}`);
    console.log(`      URL: ${r.url}`);
    console.log(`      Path: ${r.path}`);
  });

  console.log('\n📝 Next Steps:');
  console.log('   1. Review generated images');
  console.log('   2. Optimize for web (compress, resize)');
  console.log('   3. Create favicon from favicon.png');
  console.log('   4. Update website with new logos\n');

  return results;
}

if (require.main === module) {
  generateAllAssets().catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
}

module.exports = { generateAllAssets, generateAsset };
