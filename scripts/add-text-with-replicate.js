#!/usr/bin/env node

/**
 * Add Text to Logos with Replicate
 * 
 * Uses Replicate's image-to-image models to add "BEAST MODE" text
 * to the consistent logo variations
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

async function remixWithReplicate(inputImagePath, prompt, outputPath) {
  const Replicate = require('replicate');
  const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN || process.env.REPLICATE_API_KEY
  });

  if (!process.env.REPLICATE_API_TOKEN && !process.env.REPLICATE_API_KEY) {
    throw new Error('REPLICATE_API_TOKEN not found');
  }

  console.log(`   🎨 Remixing: ${prompt.substring(0, 60)}...`);
  
  // Read image as base64
  const imageBuffer = fs.readFileSync(inputImagePath);
  const imageBase64 = imageBuffer.toString('base64');
  const imageDataUri = `data:image/png;base64,${imageBase64}`;

  try {
    // Use flux-dev for high quality image-to-image
    console.log('   ⏳ Calling Replicate API...');
    const output = await replicate.run(
      "black-forest-labs/flux-dev",
      {
        input: {
          image: imageDataUri,
          prompt: prompt,
          num_outputs: 1,
          guidance_scale: 3.5,
          num_inference_steps: 28,
          output_format: "png"
        }
      }
    );

    const imageUrl = Array.isArray(output) ? output[0] : output;
    console.log('   ⏳ Downloading result...');
    await downloadImage(imageUrl, outputPath);
    console.log(`   ✅ Saved: ${path.basename(outputPath)}`);
    return outputPath;
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    throw error;
  }
}

async function main() {
  console.log('🎨 Adding Text to Logos with Replicate\n');
  console.log('='.repeat(60));

  if (!process.env.REPLICATE_API_TOKEN && !process.env.REPLICATE_API_KEY) {
    console.error('❌ REPLICATE_API_TOKEN not found');
    console.log('\n📋 Set it in website/.env.local:');
    console.log('   REPLICATE_API_TOKEN=r8_...\n');
    process.exit(1);
  }

  console.log('✅ Replicate API token found\n');

  await fs.promises.mkdir(outputDir, { recursive: true });

  // Use consistent logos as base
  const baseDir = path.join(logosDir, 'consistent');
  const baseImage = path.join(baseDir, 'beast-head-primary.png');

  if (!fs.existsSync(baseImage)) {
    console.error('❌ Base image not found:', baseImage);
    console.log('   Run: node scripts/create-consistent-logos.js first\n');
    process.exit(1);
  }

  console.log(`✅ Using base: ${path.basename(baseImage)}\n`);

  const remixes = [
    {
      name: 'full-logo-horizontal-with-text',
      input: path.join(baseDir, 'full-logo-horizontal.png'),
      prompt: 'Add "BEAST MODE" text on the right side in bold uppercase sans-serif font (Inter Bold), blue (#3B82F6), professional tech company style, keep the beast head icon on the left exactly as is, horizontal layout, white background, clean and modern'
    },
    {
      name: 'full-logo-stacked-with-text',
      input: path.join(baseDir, 'full-logo-stacked.png'),
      prompt: 'Add "BEAST MODE" text below the beast head icon in bold uppercase sans-serif font (Inter Bold), blue (#3B82F6), professional tech company style, keep the icon on top exactly as is, vertical stacked layout, white background, clean and modern'
    }
  ];

  // Also create icon variations with backgrounds
  const iconVariations = [
    {
      name: 'beast-head-primary',
      input: baseImage,
      prompt: 'Keep this exact beast head icon, place on white background, no text, professional, clean, 1024x1024'
    },
    {
      name: 'beast-head-dark',
      input: baseImage,
      prompt: 'Keep this exact beast head icon, place on dark background (#1F2937), no text, professional, clean, 1024x1024'
    }
  ];

  console.log('📋 Processing logos...\n');

  // Process icon variations first
  for (const variation of iconVariations) {
    if (fs.existsSync(variation.input)) {
      try {
        console.log(`[${iconVariations.indexOf(variation) + 1}/${iconVariations.length}] ${variation.name}...`);
        const outputPath = path.join(outputDir, `${variation.name}.png`);
        await remixWithReplicate(variation.input, variation.prompt, outputPath);
        console.log('');
      } catch (error) {
        console.error(`   ❌ Failed: ${error.message}\n`);
      }
    }
  }

  // Process full logos with text
  for (const remix of remixes) {
    if (fs.existsSync(remix.input)) {
      try {
        console.log(`[${remixes.indexOf(remix) + 1}/${remixes.length}] ${remix.name}...`);
        const outputPath = path.join(outputDir, `${remix.name}.png`);
        await remixWithReplicate(remix.input, remix.prompt, outputPath);
        console.log('');
      } catch (error) {
        console.error(`   ❌ Failed: ${error.message}\n`);
      }
    } else {
      console.log(`⚠️  Input not found: ${remix.input}\n`);
    }
  }

  // Copy favicon
  const faviconSource = path.join(baseDir, 'favicon.png');
  if (fs.existsSync(faviconSource)) {
    const faviconDest = path.join(outputDir, 'favicon.png');
    fs.copyFileSync(faviconSource, faviconDest);
    console.log('✅ Copied favicon.png\n');
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
  console.log('   1. Review the logos with text');
  console.log('   2. Replace original logos if these are better');
  console.log('   3. Create favicon.ico (16x16, 32x32) from favicon.png\n');
}

if (require.main === module) {
  main().catch(error => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { remixWithReplicate };
