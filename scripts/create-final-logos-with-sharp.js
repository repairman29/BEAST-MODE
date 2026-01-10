#!/usr/bin/env node

/**
 * Create Final Logos with Sharp
 * 
 * Uses Sharp to add backgrounds and prepare logos
 * Then uses Replicate for AI remixing to add text consistently
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.error('❌ Sharp not installed. Run: npm install sharp');
  process.exit(1);
}

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

  console.log(`   🎨 Remixing with Replicate: ${prompt.substring(0, 50)}...`);
  
  // Read image as base64
  const imageBuffer = fs.readFileSync(inputImagePath);
  const imageBase64 = imageBuffer.toString('base64');
  const imageDataUri = `data:image/png;base64,${imageBase64}`;

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
          num_inference_steps: 28,
          output_format: "png"
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

async function createLogosWithSharp() {
  console.log('🎨 Creating Final Logos with Sharp\n');
  console.log('='.repeat(60));

  // Find base image
  const baseImagePath = path.join(logosDir, 'beast-head-primary.png');
  if (!fs.existsSync(baseImagePath)) {
    console.error('❌ Base image not found:', baseImagePath);
    process.exit(1);
  }

  console.log(`✅ Using base: ${path.basename(baseImagePath)}\n`);

  await fs.promises.mkdir(outputDir, { recursive: true });

  const baseImage = sharp(baseImagePath);
  const metadata = await baseImage.metadata();
  console.log(`   Base: ${metadata.width}x${metadata.height}\n`);

  // 1. Beast head primary (white background)
  console.log('[1/5] beast-head-primary.png...');
  await baseImage
    .clone()
    .resize(1024, 1024, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    })
    .png({ quality: 100 })
    .toFile(path.join(outputDir, 'beast-head-primary.png'));
  console.log('   ✅ Created (white background)');

  // 2. Beast head dark (dark background)
  console.log('[2/5] beast-head-dark.png...');
  await baseImage
    .clone()
    .resize(1024, 1024, {
      fit: 'contain',
      background: { r: 31, g: 41, b: 55, alpha: 1 } // #1F2937
    })
    .png({ quality: 100 })
    .toFile(path.join(outputDir, 'beast-head-dark.png'));
  console.log('   ✅ Created (dark background)');

  // 3. Full logo horizontal - create canvas, place icon on left
  console.log('[3/5] full-logo-horizontal.png...');
  const iconSize = 512;
  const textWidth = 600;
  const totalWidth = iconSize + textWidth;
  const height = 512;

  // Create white background
  const horizontalLogo = sharp({
    create: {
      width: totalWidth,
      height: height,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    }
  });

  // Composite icon on left
  const iconBuffer = await baseImage
    .clone()
    .resize(iconSize, iconSize, { fit: 'contain' })
    .toBuffer();

  await horizontalLogo
    .composite([{ input: iconBuffer, left: 0, top: 0 }])
    .png({ quality: 100 })
    .toFile(path.join(outputDir, 'full-logo-horizontal.png'));
  console.log('   ✅ Created (icon on left, space for text)');

  // 4. Full logo stacked - icon on top
  console.log('[4/5] full-logo-stacked.png...');
  const stackedWidth = 512;
  const stackedHeight = 512 + 200; // icon + text space

  const stackedLogo = sharp({
    create: {
      width: stackedWidth,
      height: stackedHeight,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    }
  });

  const stackedIconBuffer = await baseImage
    .clone()
    .resize(stackedWidth, stackedWidth, { fit: 'contain' })
    .toBuffer();

  await stackedLogo
    .composite([{ input: stackedIconBuffer, left: 0, top: 0 }])
    .png({ quality: 100 })
    .toFile(path.join(outputDir, 'full-logo-stacked.png'));
  console.log('   ✅ Created (icon on top, space for text)');

  // 5. Favicon
  console.log('[5/5] favicon.png...');
  await baseImage
    .clone()
    .resize(512, 512, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    })
    .png({ quality: 100 })
    .toFile(path.join(outputDir, 'favicon.png'));
  console.log('   ✅ Created (512x512)');

  console.log('\n✅ Sharp processing complete!\n');
}

async function addTextWithReplicate() {
  if (!process.env.REPLICATE_API_TOKEN && !process.env.REPLICATE_API_KEY) {
    console.log('⚠️  REPLICATE_API_TOKEN not found, skipping AI text addition');
    console.log('   Logos created with Sharp (icon only, no text)\n');
    return;
  }

  console.log('🎨 Adding text with Replicate AI remixing...\n');

  const remixes = [
    {
      input: path.join(outputDir, 'full-logo-horizontal.png'),
      output: path.join(outputDir, 'full-logo-horizontal-with-text.png'),
      prompt: 'Add "BEAST MODE" text on the right side in bold uppercase sans-serif font, blue (#3B82F6), professional tech company style, keep the beast head icon on the left exactly as is, horizontal layout'
    },
    {
      input: path.join(outputDir, 'full-logo-stacked.png'),
      output: path.join(outputDir, 'full-logo-stacked-with-text.png'),
      prompt: 'Add "BEAST MODE" text below the beast head icon in bold uppercase sans-serif font, blue (#3B82F6), professional tech company style, keep the icon on top exactly as is, vertical stacked layout'
    }
  ];

  for (const remix of remixes) {
    if (fs.existsSync(remix.input)) {
      try {
        console.log(`   Remixing: ${path.basename(remix.output)}...`);
        await remixWithReplicate(remix.input, remix.prompt, remix.output);
        console.log(`   ✅ Created with text`);
      } catch (error) {
        console.error(`   ❌ Failed: ${error.message}`);
      }
    }
  }

  console.log('\n✅ Replicate remixing complete!\n');
}

async function main() {
  try {
    // Step 1: Use Sharp to create base variations
    await createLogosWithSharp();

    // Step 2: Use Replicate to add text (if available)
    await addTextWithReplicate();

    console.log('='.repeat(60));
    console.log('\n✅ All logos created!');
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
    console.log('   2. Use versions with text if Replicate worked');
    console.log('   3. Replace original logos if these are better');
    console.log('   4. Create favicon.ico (16x16, 32x32) from favicon.png\n');
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { createLogosWithSharp, addTextWithReplicate };
