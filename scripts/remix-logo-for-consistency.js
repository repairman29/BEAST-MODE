#!/usr/bin/env node

/**
 * Remix Logo for Consistency
 * 
 * Takes one base logo image and creates all variations from it:
 * - Different backgrounds (light/dark)
 * - Add text for full logos
 * - Resize for favicon
 * 
 * Uses image editing/remixing to maintain consistency
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const sharp = require('sharp'); // For image manipulation

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
const outputDir = path.join(__dirname, '../website/public/logos/consistent');

async function downloadImage(url, filepath) {
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
 * Use Replicate to remix image with consistent style
 */
async function remixImageWithReplicate(inputImagePath, prompt, outputPath) {
  const Replicate = require('replicate');
  const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN || process.env.REPLICATE_API_KEY
  });

  if (!process.env.REPLICATE_API_TOKEN && !process.env.REPLICATE_API_KEY) {
    throw new Error('REPLICATE_API_TOKEN not found');
  }

  // Use image-to-image model (like flux or SDXL)
  // Read image as base64
  const imageBuffer = fs.readFileSync(inputImagePath);
  const imageBase64 = imageBuffer.toString('base64');
  const imageDataUri = `data:image/png;base64,${imageBase64}`;

  console.log(`   🎨 Remixing with Replicate...`);
  
  try {
    // Use flux-dev for high quality image-to-image
    const output = await replicate.run(
      "black-forest-labs/flux-dev",
      {
        input: {
          image: imageDataUri,
          prompt: prompt,
          num_outputs: 1,
          guidance_scale: 3.5,
          num_inference_steps: 28
        }
      }
    );

    const imageUrl = Array.isArray(output) ? output[0] : output;
    await downloadImage(imageUrl, outputPath);
    return outputPath;
  } catch (error) {
    console.error(`   ❌ Replicate error: ${error.message}`);
    throw error;
  }
}

/**
 * Use Sharp to create variations from base image
 */
async function createVariationsWithSharp(baseImagePath) {
  await fs.promises.mkdir(outputDir, { recursive: true });

  console.log('\n📐 Creating variations with Sharp (fast, consistent)...\n');

  const baseImage = sharp(baseImagePath);

  // 1. Beast head primary (light background) - extract icon, add white bg
  console.log('[1/5] Creating beast-head-primary...');
  await baseImage
    .resize(1024, 1024, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png()
    .toFile(path.join(outputDir, 'beast-head-primary.png'));
  console.log('   ✅ Created');

  // 2. Beast head dark (dark background) - same icon, dark bg
  console.log('[2/5] Creating beast-head-dark...');
  await baseImage
    .resize(1024, 1024, { fit: 'contain', background: { r: 31, g: 41, b: 55, alpha: 1 } })
    .png()
    .toFile(path.join(outputDir, 'beast-head-dark.png'));
  console.log('   ✅ Created');

  // 3. Full logo horizontal - add text using composite
  console.log('[3/5] Creating full-logo-horizontal...');
  // For now, just create a horizontal layout with icon on left
  // Text would need to be added with canvas or SVG
  await baseImage
    .resize(512, 512, { fit: 'contain' })
    .extend({
      top: 0,
      bottom: 0,
      left: 0,
      right: 512,
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    })
    .png()
    .toFile(path.join(outputDir, 'full-logo-horizontal.png'));
  console.log('   ✅ Created (icon only - text needs manual addition)');

  // 4. Full logo stacked - vertical layout
  console.log('[4/5] Creating full-logo-stacked...');
  await baseImage
    .resize(512, 512, { fit: 'contain' })
    .extend({
      top: 0,
      bottom: 512,
      left: 0,
      right: 0,
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    })
    .png()
    .toFile(path.join(outputDir, 'full-logo-stacked.png'));
  console.log('   ✅ Created (icon only - text needs manual addition)');

  // 5. Favicon - small, simplified
  console.log('[5/5] Creating favicon...');
  await baseImage
    .resize(512, 512, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png()
    .toFile(path.join(outputDir, 'favicon.png'));
  console.log('   ✅ Created');

  console.log('\n✅ All variations created with Sharp!');
  console.log(`📁 Location: ${outputDir}\n`);
}

/**
 * Use DALL-E 3 with reference image (via Replicate or manual)
 */
async function createConsistentWithDALLE(baseImagePath) {
  // DALL-E 3 doesn't support image-to-image directly
  // But we can use the base image as a reference in the prompt
  // Or use Replicate's image-to-image models
  
  console.log('\n🎨 Creating consistent variations with AI remixing...\n');
  
  const baseImageBuffer = fs.readFileSync(baseImagePath);
  const baseImageBase64 = baseImageBuffer.toString('base64');

  const variations = [
    {
      name: 'beast-head-primary',
      prompt: 'Use this exact beast head icon style, keep it identical, place on white background, no text, 1024x1024',
      remix: true
    },
    {
      name: 'beast-head-dark',
      prompt: 'Use this exact beast head icon style, keep it identical, place on dark background (#1F2937), no text, 1024x1024',
      remix: true
    },
    {
      name: 'full-logo-horizontal',
      prompt: 'Use this exact beast head icon, place it on the left, add "BEAST MODE" text on the right in bold uppercase, horizontal layout, white background',
      remix: true
    },
    {
      name: 'full-logo-stacked',
      prompt: 'Use this exact beast head icon, place it on top, add "BEAST MODE" text below in bold uppercase, vertical layout, white background',
      remix: true
    },
    {
      name: 'favicon',
      prompt: 'Use this exact beast head icon, simplify it for 32x32 pixels, keep style identical, white background',
      remix: true
    }
  ];

  // Try Replicate first (image-to-image)
  if (process.env.REPLICATE_API_TOKEN || process.env.REPLICATE_API_KEY) {
    console.log('   Using Replicate for image-to-image remixing...\n');
    for (const variation of variations) {
      try {
        const outputPath = path.join(outputDir, `${variation.name}.png`);
        await remixImageWithReplicate(baseImagePath, variation.prompt, outputPath);
        console.log(`   ✅ ${variation.name}`);
      } catch (error) {
        console.error(`   ❌ ${variation.name}: ${error.message}`);
      }
    }
  } else {
    console.log('   ⚠️  REPLICATE_API_TOKEN not found, using Sharp instead...\n');
    await createVariationsWithSharp(baseImagePath);
  }
}

async function main() {
  console.log('🎨 Remixing Logo for Consistency\n');
  console.log('='.repeat(60));

  // Find the best base image (prefer beast-head-primary)
  const possibleBases = [
    path.join(logosDir, 'beast-head-primary.png'),
    path.join(logosDir, 'beast-head-dark.png'),
    path.join(logosDir, 'full-logo-horizontal.png'),
    path.join(logosDir, 'full-logo-stacked.png')
  ];

  let baseImagePath = null;
  for (const possible of possibleBases) {
    if (fs.existsSync(possible)) {
      baseImagePath = possible;
      console.log(`✅ Using base image: ${path.basename(possible)}\n`);
      break;
    }
  }

  if (!baseImagePath) {
    console.error('❌ No base logo image found!');
    console.log('   Expected one of:');
    possibleBases.forEach(p => console.log(`     - ${path.basename(p)}`));
    process.exit(1);
  }

  await fs.promises.mkdir(outputDir, { recursive: true });

  // Try AI remixing first, fallback to Sharp
  try {
    if (process.env.REPLICATE_API_TOKEN || process.env.REPLICATE_API_KEY) {
      await createConsistentWithDALLE(baseImagePath);
    } else {
      console.log('📋 REPLICATE_API_TOKEN not found, using Sharp for fast variations...\n');
      await createVariationsWithSharp(baseImagePath);
    }
  } catch (error) {
    console.error('❌ AI remixing failed, using Sharp fallback...\n');
    await createVariationsWithSharp(baseImagePath);
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n✅ Consistent logo variations created!');
  console.log(`📁 Output: ${outputDir}`);
  console.log('\n📋 Next Steps:');
  console.log('   1. Review the consistent variations');
  console.log('   2. Replace original logos if better');
  console.log('   3. Add text to full logos (if needed)');
  console.log('   4. Optimize for web\n');
}

if (require.main === module) {
  main().catch(error => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { createVariationsWithSharp, remixImageWithReplicate };
