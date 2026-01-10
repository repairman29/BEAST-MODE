#!/usr/bin/env node

/**
 * Create Logos via Website API Route
 * 
 * Uses the website's /api/ai/generate-image route
 * which has better error handling and API key management
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Load environment
function loadEnv() {
  const envPath = path.join(__dirname, '../website/.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      if (line.trim().startsWith('#') || !line.trim()) return;
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        let value = match[2].trim();
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

const logosDir = path.join(__dirname, '../website/public/logos');
const outputDir = path.join(__dirname, '../website/public/logos/final');
const apiUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

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

async function generateViaAPI(prompt, model, size, outputPath) {
  const fetch = require('node-fetch');
  
  console.log(`   🎨 ${prompt.substring(0, 60)}...`);
  console.log('   ⏳ Calling website API...');
  
  try {
    const response = await fetch(`${apiUrl}/api/ai/generate-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, model, size })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.imageUrl) {
      throw new Error('No image URL in response');
    }

    console.log('   ⏳ Downloading...');
    await downloadImage(data.imageUrl, outputPath);
    console.log(`   ✅ Saved`);
    return outputPath;
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    throw error;
  }
}

async function main() {
  console.log('🎨 Creating Logos via Website API\n');
  console.log('='.repeat(60));

  await fs.promises.mkdir(outputDir, { recursive: true });

  // Use base image
  const baseImage = path.join(logosDir, 'beast-head-primary.png');
  if (!fs.existsSync(baseImage)) {
    console.error('❌ Base image not found');
    process.exit(1);
  }

  console.log(`✅ Using base: ${path.basename(baseImage)}`);
  console.log(`🌐 API URL: ${apiUrl}\n`);

  const variations = [
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
      prompt: 'BEAST MODE logo: modern beast head silhouette icon on the left, "BEAST MODE" text on the right in bold uppercase sans-serif font (Inter Bold), blue (#3B82F6) and dark gray (#1F2937), professional tech company style, horizontal layout, white background, 1792x1024',
      model: 'dalle-3',
      size: '1792x1024'
    },
    {
      name: 'full-logo-stacked',
      prompt: 'BEAST MODE logo: modern beast head silhouette icon on top, "BEAST MODE" text below in bold uppercase sans-serif font (Inter Bold), blue (#3B82F6) and dark gray (#1F2937), professional tech company style, vertical stacked layout, white background, 1024x1024',
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

  console.log(`📋 Processing ${variations.length} variations...\n`);

  for (let i = 0; i < variations.length; i++) {
    const variation = variations[i];
    try {
      console.log(`[${i + 1}/${variations.length}] ${variation.name}...`);
      const outputPath = path.join(outputDir, `${variation.name}.png`);
      await generateViaAPI(variation.prompt, variation.model, variation.size, outputPath);
      console.log('');
      
      // Wait between requests (DALL-E 3 rate limit)
      if (i < variations.length - 1) {
        console.log('   ⏳ Waiting 4 seconds (rate limit)...\n');
        await new Promise(resolve => setTimeout(resolve, 4000));
      }
    } catch (error) {
      console.error(`   ❌ Failed: ${error.message}\n`);
    }
  }

  console.log('='.repeat(60));
  console.log('\n✅ All logos processed!');
  console.log(`📁 Location: ${outputDir}\n`);

  // Show file sizes
  const files = await fs.promises.readdir(outputDir);
  console.log('📊 Generated Files:');
  for (const file of files) {
    const filePath = path.join(outputDir, file);
    const stats = await fs.promises.stat(filePath);
    const sizeKB = (stats.size / 1024).toFixed(1);
    console.log(`   ${file}: ${sizeKB}KB`);
  }

  console.log('\n📋 Next Steps:');
  console.log('   1. Review the logos');
  console.log('   2. Replace original logos if these are better');
  console.log('   3. Create favicon.ico (16x16, 32x32) from favicon.png\n');
}

if (require.main === module) {
  main().catch(error => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { generateViaAPI };
